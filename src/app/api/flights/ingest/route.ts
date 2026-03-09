import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/flights/ingest
 *
 * DEPRECATED: Flights are now fetched in real-time from the Flight Data API.
 * This endpoint is no longer needed.
 */
export async function POST(req: NextRequest) {
  return NextResponse.json({
    success: true,
    message: "Flights are now fetched in real-time. No sync needed.",
    deprecated: true,
  });
}
