import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/flights — list all ingested flights
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get("limit")) || 100;
    const deptIcao = searchParams.get("deptIcao");
    const flightNumber = searchParams.get("flightNumber");
    const acRegistration = searchParams.get("acRegistration");
    const date = searchParams.get("date"); // YYYY-MM-DD

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (deptIcao) where.deptIcao = deptIcao.toUpperCase();
    if (flightNumber) where.flightNumber = { contains: flightNumber, mode: "insensitive" };
    if (acRegistration) where.acRegistration = { contains: acRegistration, mode: "insensitive" };
    if (date) {
      const start = new Date(date + "T00:00:00Z");
      const end = new Date(date + "T23:59:59.999Z");
      where.deptTime = { gte: start, lte: end };
    }

    const flights = await prisma.flight.findMany({
      where,
      orderBy: { deptTime: "asc" },
      take: limit,
      include: {
        orders: {
          select: { id: true, status: true, sentAt: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: flights.map((f) => ({
        ...f,
        deptTime: f.deptTime.toISOString(),
        arrivalTime: f.arrivalTime?.toISOString() || null,
        eta: f.eta?.toISOString() || null,
        ingestedAt: f.ingestedAt.toISOString(),
        hasOrder: f.orders.length > 0,
        latestOrderStatus: f.orders.length > 0 ? f.orders[f.orders.length - 1].status : null,
      })),
    });
  } catch (error) {
    console.error("GET /api/flights error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch flights" },
      { status: 500 }
    );
  }
}
