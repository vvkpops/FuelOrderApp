import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { ensureDb } from "@/lib/init-db";
import { newId } from "@/lib/id";

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
    await ensureDb();

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

    // Upsert flights — match on external_id to avoid duplicates
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

      // Check if exists
      const { rows: existing } = await pool.query(
        "SELECT id FROM flights WHERE external_id = $1",
        [flight.id]
      );

      if (existing.length > 0) {
        await pool.query(
          `UPDATE flights SET
            flight_number = $1, ac_registration = $2, ac_type = $3,
            dept_icao = $4, dept_time = $5, arrival_icao = $6,
            arrival_time = $7, alternate_icao = $8, eta = $9, raw_data = $10
          WHERE id = $11`,
          [
            flight.callsign,
            flight.acregistration,
            flight.actype,
            flight.departureicao.toUpperCase(),
            deptTime,
            flight.arrivalicao?.toUpperCase() || null,
            arrivalTime && !isNaN(arrivalTime.getTime()) ? arrivalTime : null,
            flight.alternateicao?.toUpperCase() || null,
            eta && !isNaN(eta.getTime()) ? eta : null,
            JSON.stringify(flight),
            existing[0].id,
          ]
        );
        results.push({ flightNumber: flight.callsign, status: "updated" });
      } else {
        await pool.query(
          `INSERT INTO flights (id, external_id, flight_number, ac_registration, ac_type,
            dept_icao, dept_time, arrival_icao, arrival_time, alternate_icao, eta, raw_data)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
          [
            newId(),
            flight.id,
            flight.callsign,
            flight.acregistration,
            flight.actype,
            flight.departureicao.toUpperCase(),
            deptTime,
            flight.arrivalicao?.toUpperCase() || null,
            arrivalTime && !isNaN(arrivalTime.getTime()) ? arrivalTime : null,
            flight.alternateicao?.toUpperCase() || null,
            eta && !isNaN(eta.getTime()) ? eta : null,
            JSON.stringify(flight),
          ]
        );
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
