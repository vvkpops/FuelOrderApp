import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { ensureDb } from "@/lib/init-db";
import { flightHash } from "@/lib/id";

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
}

// GET /api/flights — fetch flights in real-time from Flight Data API
export async function GET(req: NextRequest) {
  try {
    await ensureDb();

    if (!FLIGHT_API_KEY) {
      return NextResponse.json(
        { success: false, error: "FLIGHT_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get("limit")) || 100;
    const deptIcao = searchParams.get("deptIcao");
    const flightNumber = searchParams.get("flightNumber");
    const acRegistration = searchParams.get("acRegistration");
    const date = searchParams.get("date"); // YYYY-MM-DD

    // Fetch flights from external API (paginated)
    const allFlights: FDAFlight[] = [];
    let page = 1;
    let totalPages = 1;

    while (page <= totalPages && allFlights.length < limit) {
      const url = new URL(`${FLIGHT_API_URL}/api/v1/flights`);
      url.searchParams.set("page", String(page));
      url.searchParams.set("limit", "200");
      if (date) {
        url.searchParams.set("date", date);
      }

      const response = await fetch(url.toString(), {
        headers: { "x-api-key": FLIGHT_API_KEY },
        cache: "no-store",
      });

      if (!response.ok) {
        const errBody = await response.text();
        console.error(`Flight Data API error (page ${page}):`, response.status, errBody);
        return NextResponse.json(
          { success: false, error: `Flight Data API error: ${response.status}` },
          { status: 502 }
        );
      }

      const json = await response.json();
      const flights: FDAFlight[] = json.data || [];
      allFlights.push(...flights);

      totalPages = json.pagination?.pages || 1;
      page++;
    }

    // Apply client-side filters
    let filteredFlights = allFlights;

    if (deptIcao) {
      filteredFlights = filteredFlights.filter(
        (f) => f.departureicao.toUpperCase() === deptIcao.toUpperCase()
      );
    }
    if (flightNumber) {
      const search = flightNumber.toLowerCase();
      filteredFlights = filteredFlights.filter((f) =>
        f.callsign.toLowerCase().includes(search)
      );
    }
    if (acRegistration) {
      const search = acRegistration.toLowerCase();
      filteredFlights = filteredFlights.filter((f) =>
        f.acregistration.toLowerCase().includes(search)
      );
    }

    // Limit results
    filteredFlights = filteredFlights.slice(0, limit);

    // Generate flight hashes for each flight
    const flightHashes = filteredFlights.map((f) =>
      flightHash(f.callsign, f.departureicao, f.departuretime)
    );

    // Query orders - handle both flight_hash (new) and flight_number+dept_icao+date (legacy)
    const orderMap = new Map<string, { hasOrder: boolean; latestStatus: string | null; fuelLoad: number | null; dispatcher: string | null }>();
    
    try {
      // First try to get orders by flight_hash
      const { rows: hashOrders } = await pool.query(
        `SELECT flight_hash, flight_number, dept_icao, dept_time, id, status, sent_at, fuel_load, dispatcher
         FROM fuel_orders 
         WHERE (flight_hash = ANY($1) OR flight_hash IS NULL) AND status != 'CANCELLED'
         ORDER BY sent_at DESC`,
        [flightHashes]
      );

      // Build lookup maps for matching
      for (const o of hashOrders) {
        // Match by flight_hash if available
        if (o.flight_hash && flightHashes.includes(o.flight_hash) && !orderMap.has(o.flight_hash)) {
          orderMap.set(o.flight_hash, {
            hasOrder: true,
            latestStatus: o.status,
            fuelLoad: o.fuel_load,
            dispatcher: o.dispatcher,
          });
        } else if (!o.flight_hash) {
          // Legacy order without flight_hash - match by flight details
          const matchingFlight = filteredFlights.find((f) => {
            const flightNum = f.callsign.toUpperCase();
            const orderFlightNum = o.flight_number?.toUpperCase();
            const flightDept = f.departureicao.toUpperCase();
            const orderDept = o.dept_icao?.toUpperCase();
            const flightDate = new Date(f.departuretime).toISOString().slice(0, 10);
            const orderDate = o.dept_time ? new Date(o.dept_time).toISOString().slice(0, 10) : null;
            return flightNum === orderFlightNum && flightDept === orderDept && flightDate === orderDate;
          });
          
          if (matchingFlight) {
            const hash = flightHash(matchingFlight.callsign, matchingFlight.departureicao, matchingFlight.departuretime);
            if (!orderMap.has(hash)) {
              orderMap.set(hash, {
                hasOrder: true,
                latestStatus: o.status,
                fuelLoad: o.fuel_load,
                dispatcher: o.dispatcher,
              });
            }
          }
        }
      }
    } catch (e) {
      // flight_hash column might not exist - try legacy lookup
      console.error("Order hash lookup failed, trying legacy:", e);
      try {
        const { rows: legacyOrders } = await pool.query(
          `SELECT flight_number, dept_icao, dept_time, id, status, sent_at, fuel_load, dispatcher
           FROM fuel_orders 
           WHERE status != 'CANCELLED'
           ORDER BY sent_at DESC`
        );
        
        for (const o of legacyOrders) {
          const matchingFlight = filteredFlights.find((f) => {
            const flightNum = f.callsign.toUpperCase();
            const orderFlightNum = o.flight_number?.toUpperCase();
            const flightDept = f.departureicao.toUpperCase();
            const orderDept = o.dept_icao?.toUpperCase();
            const flightDate = new Date(f.departuretime).toISOString().slice(0, 10);
            const orderDate = o.dept_time ? new Date(o.dept_time).toISOString().slice(0, 10) : null;
            return flightNum === orderFlightNum && flightDept === orderDept && flightDate === orderDate;
          });
          
          if (matchingFlight) {
            const hash = flightHash(matchingFlight.callsign, matchingFlight.departureicao, matchingFlight.departuretime);
            if (!orderMap.has(hash)) {
              orderMap.set(hash, {
                hasOrder: true,
                latestStatus: o.status,
                fuelLoad: o.fuel_load,
                dispatcher: o.dispatcher,
              });
            }
          }
        }
      } catch (e2) {
        console.error("Legacy order lookup also failed:", e2);
      }
    }

    // Sort by departure time
    filteredFlights.sort((a, b) => 
      new Date(a.departuretime).getTime() - new Date(b.departuretime).getTime()
    );

    return NextResponse.json({
      success: true,
      data: filteredFlights.map((f) => {
        const hash = flightHash(f.callsign, f.departureicao, f.departuretime);
        const orderInfo = orderMap.get(hash);
        return {
          id: hash, // Use flight hash as the unique ID
          flightHash: hash,
          flightNumber: f.callsign,
          acRegistration: f.acregistration,
          acType: f.actype,
          deptIcao: f.departureicao.toUpperCase(),
          deptTime: new Date(f.departuretime).toISOString(),
          arrivalIcao: f.arrivalicao?.toUpperCase() || null,
          arrivalTime: f.arrivaltime ? new Date(f.arrivaltime).toISOString() : null,
          alternateIcao: f.alternateicao?.toUpperCase() || null,
          eta: f.eta ? new Date(f.eta).toISOString() : null,
          fuelLoad: orderInfo?.fuelLoad || null,
          dispatcher: orderInfo?.dispatcher || null,
          hasOrder: orderInfo?.hasOrder || false,
          latestOrderStatus: orderInfo?.latestStatus || null,
        };
      }),
    });
  } catch (error) {
    console.error("GET /api/flights error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch flights" },
      { status: 500 }
    );
  }
}
