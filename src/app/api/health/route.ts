import { NextResponse } from "next/server";

/**
 * GET /api/health
 * Simple health-check endpoint for Railway / load-balancer probes.
 */
export async function GET() {
  return NextResponse.json({ status: "ok", timestamp: new Date().toISOString() });
}
