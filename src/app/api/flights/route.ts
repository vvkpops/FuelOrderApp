import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { ensureDb } from "@/lib/init-db";

// GET /api/flights — list all ingested flights
export async function GET(req: NextRequest) {
  try {
    await ensureDb();
    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get("limit")) || 100;
    const deptIcao = searchParams.get("deptIcao");
    const flightNumber = searchParams.get("flightNumber");
    const acRegistration = searchParams.get("acRegistration");
    const date = searchParams.get("date"); // YYYY-MM-DD

    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (deptIcao) {
      conditions.push(`f.dept_icao = $${idx++}`);
      params.push(deptIcao.toUpperCase());
    }
    if (flightNumber) {
      conditions.push(`f.flight_number ILIKE $${idx++}`);
      params.push(`%${flightNumber}%`);
    }
    if (acRegistration) {
      conditions.push(`f.ac_registration ILIKE $${idx++}`);
      params.push(`%${acRegistration}%`);
    }
    if (date) {
      conditions.push(`f.dept_time >= $${idx++} AND f.dept_time <= $${idx++}`);
      params.push(date + "T00:00:00Z", date + "T23:59:59.999Z");
    }

    const where = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

    params.push(limit);

    const sql = `
      SELECT f.*,
        COALESCE(
          json_agg(json_build_object('id', o.id, 'status', o.status, 'sent_at', o.sent_at))
          FILTER (WHERE o.id IS NOT NULL), '[]'
        ) AS orders
      FROM flights f
      LEFT JOIN fuel_orders o ON o.flight_id = f.id
      ${where}
      GROUP BY f.id
      ORDER BY f.dept_time ASC
      LIMIT $${idx}
    `;

    const { rows } = await pool.query(sql, params);

    return NextResponse.json({
      success: true,
      data: rows.map((f) => ({
        id: f.id,
        externalId: f.external_id,
        flightNumber: f.flight_number,
        acRegistration: f.ac_registration,
        acType: f.ac_type,
        deptIcao: f.dept_icao,
        deptTime: new Date(f.dept_time).toISOString(),
        arrivalIcao: f.arrival_icao,
        arrivalTime: f.arrival_time ? new Date(f.arrival_time).toISOString() : null,
        alternateIcao: f.alternate_icao,
        eta: f.eta ? new Date(f.eta).toISOString() : null,
        fuelLoad: f.fuel_load,
        dispatcher: f.dispatcher,
        ingestedAt: new Date(f.ingested_at).toISOString(),
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
