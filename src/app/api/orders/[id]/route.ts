import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/orders/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const order = await prisma.fuelOrder.findUnique({
      where: { id },
      include: {
        updates: true,
        originalOrder: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    console.error("GET /api/orders/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}

// PUT /api/orders/[id] — cancel an order
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const order = await prisma.fuelOrder.update({
      where: { id },
      data: {
        status: body.status || "CANCELLED",
      },
    });

    return NextResponse.json({
      success: true,
      data: order,
      message: `Order ${order.flightNumber} updated to ${order.status}`,
    });
  } catch (error) {
    console.error("PUT /api/orders/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update order" },
      { status: 500 }
    );
  }
}
