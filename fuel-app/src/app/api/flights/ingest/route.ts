import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

const FLIGHT_API_URL = process.env.FLIGHT_API_URL || "https://fdfeedapi.up.railway.app";
const FLIGHT_API_KEY = process.env.FLIGHT_API_KEY || "";

interface FDAFlight {
  id: number;
  callsign: string;
  actype: string;
  acregistration: string;
  departureicao: string;
  arrivalicao: string;
  alternateicao: string;
  departuretime: string;
  arrivaltime: string;
  eta: string;
  alteta: string;
  generation_date: string;
  created_at: string;
  updated_at: string;
}

/**
 * POST /api/flights/ingest
 *
 * Fetches flight data from the Flight Data API and upserts into the local database.
 * Accepts optional body: { date?: "YYYY-MM-DD" } to fetch a specific date (defaults to today).
 */
export async function POST(req: NextRequest) {
  try {
    if (!FLIGHT_API_KEY) {
      return NextResponse.json(
        { success: false, error: "FLIGHT_API_KEY is not configured" },
        { status: 500 }
      );
    }

    let targetDate: string | undefined;
    try {
      const body = await req.json();
      targetDate = body.date;
    } catch {
      // No body is fine — default to today
    }

    // Fetch all flights from the API, paginated
    const allFlights: FDAFlight[] = [];
    let page = 1;
    let totalPages = 1;

    while (page <= totalPages) {
      const url = new URL(`${FLIGHT_API_URL}/api/v1/flights`);
      url.searchParams.set("page", String(page));
      url.searchParams.set("limit", "200");
      if (targetDate) {
        url.searchParams.set("date", targetDate);
      }

      const response = await fetch(url.toString(), {
        headers: { "x-api-key": FLIGHT_API_KEY },
        cache: "no-store",
      });

      if (!response.ok) {
        const errBody = await response.text();
        console.error(`Flight Data API error (page ${page}):`, response.status, errBody);
        return NextResponse.json(
          {
            success: false,
            error: `Flight Data API returned ${response.status}: ${errBody}`,
          },
          { status: 502 }
        );
      }

      const json = await response.json();
      const flights: FDAFlight[] = json.data || [];
      allFlights.push(...flights);

      totalPages = json.pagination?.pages || 1;
      page++;
    }

    if (allFlights.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No flights returned from API for the requested date",
        data: [],
      });
    }

    // Upsert flights — match on externalId (API id) to avoid duplicates
    const results = [];
    for (const flight of allFlights) {
      const deptTime = new Date(flight.departuretime);
      if (isNaN(deptTime.getTime())) {
        results.push({
          flightNumber: flight.callsign,
          status: "skipped",
          reason: "invalid departure time",
        });
        continue;
      }

      const arrivalTime = flight.arrivaltime ? new Date(flight.arrivaltime) : null;
      const eta = flight.eta ? new Date(flight.eta) : null;

      const data = {
        flightNumber: flight.callsign,
        acRegistration: flight.acregistration,
        acType: flight.actype,
        deptIcao: flight.departureicao.toUpperCase(),
        deptTime,
        arrivalIcao: flight.arrivalicao?.toUpperCase() || null,
        arrivalTime: arrivalTime && !isNaN(arrivalTime.getTime()) ? arrivalTime : null,
        alternateIcao: flight.alternateicao?.toUpperCase() || null,
        eta: eta && !isNaN(eta.getTime()) ? eta : null,
        rawData: flight as unknown as Prisma.InputJsonValue,
      };

      const existing = await prisma.flight.findUnique({
        where: { externalId: flight.id },
      });

      if (existing) {
        await prisma.flight.update({
          where: { id: existing.id },
          data,
        });
        results.push({ flightNumber: flight.callsign, status: "updated" });
      } else {
        await prisma.flight.create({
          data: {
            ...data,
            externalId: flight.id,
          },
        });
        results.push({ flightNumber: flight.callsign, status: "created" });
      }
    }

    const created = results.filter((r) => r.status === "created").length;
    const updated = results.filter((r) => r.status === "updated").length;
    const skipped = results.filter((r) => r.status === "skipped").length;

    return NextResponse.json({
      success: true,
      message: `Processed ${results.length} flights (${created} created, ${updated} updated, ${skipped} skipped)`,
      data: results,
    });
  } catch (error) {
    console.error("POST /api/flights/ingest error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to ingest flight data" },
      { status: 500 }
    );
  }
}
