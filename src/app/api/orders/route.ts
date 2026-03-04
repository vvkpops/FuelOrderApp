import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatEmailSubject, formatEmailBody, generateMailtoUrl } from "@/lib/email";

// GET /api/orders — list all orders
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const deptIcao = searchParams.get("deptIcao");
    const limit = Number(searchParams.get("limit")) || 200;
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (deptIcao) where.deptIcao = deptIcao.toUpperCase();
    if (search) {
      where.OR = [
        { flightNumber: { contains: search, mode: "insensitive" } },
        { acRegistration: { contains: search, mode: "insensitive" } },
        { deptIcao: { contains: search, mode: "insensitive" } },
      ];
    }

    const orders = await prisma.fuelOrder.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      data: orders.map((o) => ({
        ...o,
        deptTime: o.deptTime.toISOString(),
        sentAt: o.sentAt?.toISOString() ?? null,
        createdAt: o.createdAt.toISOString(),
        updatedAt: o.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("GET /api/orders error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

// POST /api/orders — create a new order and generate mailto URL
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      flightId,
      flightNumber,
      acRegistration,
      acType,
      deptIcao,
      deptTime,
      fuelLoad,
      dispatcher,
      isUpdate,
      originalOrderId,
      updateReason,
      timeFormat,
    } = body;

    if (!flightNumber || !acRegistration || !deptIcao || !dispatcher) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: flightNumber, acRegistration, deptIcao, dispatcher" },
        { status: 400 }
      );
    }

    // Check for duplicate — same flight record, not cancelled
    if (!isUpdate && flightId) {
      const duplicate = await prisma.fuelOrder.findFirst({
        where: {
          flightId,
          status: { not: "CANCELLED" },
        },
      });

      if (duplicate) {
        return NextResponse.json({
          success: false,
          error: "DUPLICATE_WARNING",
          message: `An order already exists for ${flightNumber} at ${deptIcao} (Status: ${duplicate.status}). Use update/resend instead, or include isUpdate: true.`,
          existingOrder: {
            ...duplicate,
            deptTime: duplicate.deptTime.toISOString(),
            sentAt: duplicate.sentAt?.toISOString() ?? null,
            createdAt: duplicate.createdAt.toISOString(),
            updatedAt: duplicate.updatedAt.toISOString(),
          },
        });
      }
    }

    // Look up station emails
    const station = await prisma.station.findUnique({
      where: { icaoCode: deptIcao.toUpperCase() },
    });

    if (!station || station.emails.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "NO_STATION_EMAIL",
          message: `No email configured for station ${deptIcao}. Please configure it in Settings.`,
        },
        { status: 400 }
      );
    }

    // Generate email content
    const emailSubject = formatEmailSubject({
      flightNumber,
      deptIcao,
      acRegistration,
      isUpdate: !!isUpdate,
    });

    const emailBody = formatEmailBody({
      flightNumber,
      acRegistration,
      acType,
      deptIcao,
      deptTime: new Date(deptTime).toUTCString(),
      fuelLoad,
      dispatcher,
      isUpdate: !!isUpdate,
      updateReason,
      timezone: timeFormat === "utc" ? null : station.timezone,
    });

    // Generate mailto URL
    const mailtoUrl = generateMailtoUrl({
      to: station.emails,
      cc: station.ccEmails,
      subject: emailSubject,
      body: emailBody,
    });

    // If this is an update, mark original as UPDATED
    if (isUpdate && originalOrderId) {
      await prisma.fuelOrder.update({
        where: { id: originalOrderId },
        data: { status: "UPDATED" },
      });
    }

    const parsedFuelLoad = fuelLoad ? parseFloat(String(fuelLoad)) : null;

    // Create the order
    const order = await prisma.fuelOrder.create({
      data: {
        flightId: flightId || undefined,
        flightNumber,
        acRegistration,
        acType: acType || "Unknown",
        deptIcao: deptIcao.toUpperCase(),
        deptTime: new Date(deptTime),
        fuelLoad: parsedFuelLoad,
        dispatcher,
        status: "SENT",
        sentAt: new Date(),
        sentTo: station.emails,
        ccTo: station.ccEmails,
        emailSubject,
        emailBody,
        isUpdate: !!isUpdate,
        originalOrderId: originalOrderId || null,
        updateReason: updateReason || null,
      },
    });

    // Update the flight record with fuel load and dispatcher so the board reflects ordered values
    if (flightId) {
      const updateData: Record<string, unknown> = {};
      if (parsedFuelLoad !== null) updateData.fuelLoad = parsedFuelLoad;
      if (dispatcher) updateData.dispatcher = dispatcher;
      if (Object.keys(updateData).length > 0) {
        await prisma.flight.update({
          where: { id: flightId },
          data: updateData,
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...order,
        deptTime: order.deptTime.toISOString(),
        sentAt: order.sentAt?.toISOString() ?? null,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
      },
      mailtoUrl,
      message: "Order created. Opening email client...",
    });
  } catch (error) {
    console.error("POST /api/orders error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create order" },
      { status: 500 }
    );
  }
}
