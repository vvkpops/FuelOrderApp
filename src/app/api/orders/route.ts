import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { ensureDb } from "@/lib/init-db";
import { newId, flightHash } from "@/lib/id";
import { formatEmailSubject, formatEmailBody, generateMailtoUrl } from "@/lib/email";

// GET /api/orders — list all orders
export async function GET(req: NextRequest) {
  try {
    await ensureDb();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const deptIcao = searchParams.get("deptIcao");
    const limit = Number(searchParams.get("limit")) || 200;
    const search = searchParams.get("search");

    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (status) {
      conditions.push(`status = $${idx++}`);
      params.push(status);
    }
    if (deptIcao) {
      conditions.push(`dept_icao = $${idx++}`);
      params.push(deptIcao.toUpperCase());
    }
    if (search) {
      conditions.push(`(flight_number ILIKE $${idx} OR ac_registration ILIKE $${idx} OR dept_icao ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }

    const where = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";
    params.push(limit);

    const sql = `SELECT * FROM fuel_orders ${where} ORDER BY created_at DESC LIMIT $${idx}`;
    const { rows } = await pool.query(sql, params);

    return NextResponse.json({
      success: true,
      data: rows.map((o) => ({
        id: o.id,
        flightHash: o.flight_hash,
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
    await ensureDb();
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

    // Generate unique flight hash based on flight number, departure airport, and date
    const hash = flightHash(flightNumber, deptIcao, deptTime);

    // Check for duplicate — same flight hash, not cancelled
    if (!isUpdate) {
      const { rows: dupes } = await pool.query(
        "SELECT * FROM fuel_orders WHERE flight_hash = $1 AND status != 'CANCELLED' LIMIT 1",
        [hash]
      );

      if (dupes.length > 0) {
        const d = dupes[0];
        return NextResponse.json({
          success: false,
          error: "DUPLICATE_WARNING",
          message: `An order already exists for ${flightNumber} at ${deptIcao} (Status: ${d.status}). Use update/resend instead, or include isUpdate: true.`,
          existingOrder: {
            id: d.id,
            flightNumber: d.flight_number,
            status: d.status,
            deptTime: new Date(d.dept_time).toISOString(),
            sentAt: d.sent_at ? new Date(d.sent_at).toISOString() : null,
            createdAt: new Date(d.created_at).toISOString(),
            updatedAt: new Date(d.updated_at).toISOString(),
          },
        });
      }
    }

    // Look up station emails
    const { rows: stations } = await pool.query(
      "SELECT * FROM stations WHERE icao_code = $1",
      [deptIcao.toUpperCase()]
    );

    if (stations.length === 0 || stations[0].emails.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "NO_STATION_EMAIL",
          message: `No email configured for station ${deptIcao}. Please configure it in Settings.`,
        },
        { status: 400 }
      );
    }

    const station = stations[0];

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
      cc: station.cc_emails,
      subject: emailSubject,
      body: emailBody,
    });

    // If this is an update, mark original as UPDATED
    if (isUpdate && originalOrderId) {
      await pool.query(
        "UPDATE fuel_orders SET status = 'UPDATED', updated_at = NOW() WHERE id = $1",
        [originalOrderId]
      );
    }

    const parsedFuelLoad = fuelLoad ? parseFloat(String(fuelLoad)) : null;
    const orderId = newId();
    const now = new Date();

    await pool.query(
      `INSERT INTO fuel_orders
        (id, flight_hash, flight_number, ac_registration, ac_type, dept_icao, dept_time,
         fuel_load, dispatcher, status, sent_at, sent_to, cc_to, email_subject, email_body,
         is_update, original_order_id, update_reason, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)`,
      [
        orderId,
        hash,
        flightNumber,
        acRegistration,
        acType || "Unknown",
        deptIcao.toUpperCase(),
        new Date(deptTime),
        parsedFuelLoad,
        dispatcher,
        "SENT",
        now,
        station.emails,
        station.cc_emails,
        emailSubject,
        emailBody,
        !!isUpdate,
        originalOrderId || null,
        updateReason || null,
        now,
        now,
      ]
    );

    // No longer updating flights table - data is fetched real-time from API
    // Fuel load and dispatcher are stored with the order and retrieved when listing flights

    return NextResponse.json({
      success: true,
      data: {
        id: orderId,
        flightHash: hash,
        flightNumber,
        acRegistration,
        acType: acType || "Unknown",
        deptIcao: deptIcao.toUpperCase(),
        deptTime: new Date(deptTime).toISOString(),
        fuelLoad: parsedFuelLoad,
        dispatcher,
        status: "SENT",
        sentAt: now.toISOString(),
        sentTo: station.emails,
        ccTo: station.cc_emails,
        emailSubject,
        emailBody,
        isUpdate: !!isUpdate,
        originalOrderId: originalOrderId || null,
        updateReason: updateReason || null,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
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
