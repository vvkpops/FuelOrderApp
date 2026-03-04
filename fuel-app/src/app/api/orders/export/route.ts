import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/orders/export — export orders as CSV
export async function GET() {
  try {
    const orders = await prisma.fuelOrder.findMany({
      orderBy: { createdAt: "desc" },
    });

    const headers = [
      "Flight Number",
      "AC Registration",
      "AC Type",
      "Dept ICAO",
      "Dept Time (UTC)",
      "Fuel Load (LBS)",
      "Dispatcher",
      "Status",
      "Sent At",
      "Sent To",
      "CC",
      "Is Update",
      "Update Reason",
      "Created At",
    ];

    const rows = orders.map((o) => [
      o.flightNumber,
      o.acRegistration,
      o.acType,
      o.deptIcao,
      o.deptTime.toISOString(),
      o.fuelLoad ?? "",
      o.dispatcher,
      o.status,
      o.sentAt?.toISOString() ?? "",
      o.sentTo.join("; "),
      o.ccTo.join("; "),
      o.isUpdate ? "Yes" : "No",
      o.updateReason ?? "",
      o.createdAt.toISOString(),
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((r) =>
        r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="fuel_orders_export_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    console.error("GET /api/orders/export error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to export orders" },
      { status: 500 }
    );
  }
}
