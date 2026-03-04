import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { ensureDb } from "@/lib/init-db";

// GET /api/orders/export — export orders as CSV
export async function GET() {
  try {
    await ensureDb();

    const { rows: orders } = await pool.query(
      "SELECT * FROM fuel_orders ORDER BY created_at DESC"
    );

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

    const csvRows = orders.map((o) => [
      o.flight_number,
      o.ac_registration,
      o.ac_type,
      o.dept_icao,
      new Date(o.dept_time).toISOString(),
      o.fuel_load ?? "",
      o.dispatcher,
      o.status,
      o.sent_at ? new Date(o.sent_at).toISOString() : "",
      (o.sent_to || []).join("; "),
      (o.cc_to || []).join("; "),
      o.is_update ? "Yes" : "No",
      o.update_reason ?? "",
      new Date(o.created_at).toISOString(),
    ]);

    const csv = [
      headers.join(","),
      ...csvRows.map((r) =>
        r.map((v: unknown) => `"${String(v).replace(/"/g, '""')}"`).join(",")
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
