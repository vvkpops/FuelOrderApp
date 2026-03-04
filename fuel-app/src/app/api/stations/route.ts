import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/stations — list all stations
export async function GET() {
  try {
    const stations = await prisma.station.findMany({
      orderBy: { icaoCode: "asc" },
    });

    return NextResponse.json({ success: true, data: stations });
  } catch (error) {
    console.error("GET /api/stations error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch stations" },
      { status: 500 }
    );
  }
}

// POST /api/stations — create a new station
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { icaoCode, name, emails, ccEmails, timezone } = body;

    console.log("POST /api/stations body:", JSON.stringify({ icaoCode, name, emails, ccEmails, timezone }));

    if (!icaoCode || !emails || emails.length === 0) {
      return NextResponse.json(
        { success: false, error: "icaoCode and at least one email are required" },
        { status: 400 }
      );
    }

    // Upsert — create or update if station already exists
    const station = await prisma.station.upsert({
      where: { icaoCode: icaoCode.toUpperCase() },
      update: {
        name: name || undefined,
        timezone: timezone || undefined,
        emails: emails.map((e: string) => e.trim()),
        ccEmails: (ccEmails || []).map((e: string) => e.trim()),
      },
      create: {
        icaoCode: icaoCode.toUpperCase(),
        name: name || null,
        timezone: timezone || null,
        emails: emails.map((e: string) => e.trim()),
        ccEmails: (ccEmails || []).map((e: string) => e.trim()),
      },
    });

    return NextResponse.json({
      success: true,
      data: station,
      message: `Station ${station.icaoCode} created`,
    });
  } catch (error) {
    console.error("POST /api/stations error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create station" },
      { status: 500 }
    );
  }
}
