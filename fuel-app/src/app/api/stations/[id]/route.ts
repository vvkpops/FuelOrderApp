import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT /api/stations/[id] — update a station
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const station = await prisma.station.update({
      where: { id },
      data: {
        icaoCode: body.icaoCode?.toUpperCase(),
        name: body.name,
        timezone: body.timezone !== undefined ? (body.timezone || null) : undefined,
        emails: body.emails?.map((e: string) => e.trim()),
        ccEmails: body.ccEmails?.map((e: string) => e.trim()),
        isActive: body.isActive,
      },
    });

    return NextResponse.json({
      success: true,
      data: station,
      message: `Station ${station.icaoCode} updated`,
    });
  } catch (error) {
    console.error("PUT /api/stations/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update station" },
      { status: 500 }
    );
  }
}

// DELETE /api/stations/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.station.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: "Station deleted",
    });
  } catch (error) {
    console.error("DELETE /api/stations/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete station" },
      { status: 500 }
    );
  }
}
