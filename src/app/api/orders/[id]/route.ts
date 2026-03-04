import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { ensureDb } from "@/lib/init-db";

// GET /api/orders/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDb();
    const { id } = await params;

    const { rows } = await pool.query("SELECT * FROM fuel_orders WHERE id = $1", [id]);

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    const o = rows[0];

    // Fetch updates (orders that reference this one as original)
    const { rows: updates } = await pool.query(
      "SELECT * FROM fuel_orders WHERE original_order_id = $1",
      [id]
    );

    // Fetch original order if this is an update
    let originalOrder = null;
    if (o.original_order_id) {
      const { rows: orig } = await pool.query(
        "SELECT * FROM fuel_orders WHERE id = $1",
        [o.original_order_id]
      );
      if (orig.length > 0) originalOrder = orig[0];
    }

    return NextResponse.json({
      success: true,
      data: {
        id: o.id,
        flightId: o.flight_id,
        flightNumber: o.flight_number,
        acRegistration: o.ac_registration,
        acType: o.ac_type,
        deptIcao: o.dept_icao,
        deptTime: new Date(o.dept_time).toISOString(),
        fuelLoad: o.fuel_load,
        dispatcher: o.dispatcher,
        status: o.status,
        sentAt: o.sent_at ? new Date(o.sent_at).toISOString() : null,
        sentTo: o.sent_to,
        ccTo: o.cc_to,
        emailSubject: o.email_subject,
        emailBody: o.email_body,
        isUpdate: o.is_update,
        originalOrderId: o.original_order_id,
        updateReason: o.update_reason,
        createdAt: new Date(o.created_at).toISOString(),
        updatedAt: new Date(o.updated_at).toISOString(),
        updates,
        originalOrder,
      },
    });
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
    await ensureDb();
    const { id } = await params;
    const body = await req.json();

    const newStatus = body.status || "CANCELLED";
    const { rows } = await pool.query(
      "UPDATE fuel_orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
      [newStatus, id]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: rows[0],
      message: `Order ${rows[0].flight_number} updated to ${rows[0].status}`,
    });
  } catch (error) {
    console.error("PUT /api/orders/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update order" },
      { status: 500 }
    );
  }
}
