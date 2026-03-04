import { NextRequest, NextResponse } from "next/server";
import airportsData from "@/data/airports.json";

const airports = airportsData as Record<
  string,
  {
    icao: string;
    iata: string | null;
    name: string;
    city: string | null;
    country: string;
    lat: number;
    lng: number;
    timezone: string;
  }
>;

/**
 * GET /api/airports?q=CYUL
 * Lookup airport by ICAO code (exact) or search by partial code/name
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim().toUpperCase();

  if (!q) {
    return NextResponse.json({ success: false, error: "Provide ?q= query" }, { status: 400 });
  }

  // Exact match first
  if (airports[q]) {
    return NextResponse.json({ success: true, data: airports[q] });
  }

  // Partial search (limit 10)
  const results = Object.values(airports)
    .filter(
      (a) =>
        a.icao.includes(q) ||
        (a.iata && a.iata.includes(q)) ||
        a.name.toUpperCase().includes(q)
    )
    .slice(0, 10);

  return NextResponse.json({ success: true, data: results });
}
