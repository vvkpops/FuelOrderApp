import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { ensureDb } from "@/lib/init-db";
import { newId } from "@/lib/id";

// GET /api/stations — list all stations
export async function GET() {
  try {
    await ensureDb();

    const { rows } = await pool.query(
      "SELECT * FROM stations ORDER BY icao_code ASC"
    );

    return NextResponse.json({
      success: true,
      data: rows.map((s) => ({
        id: s.id,
        icaoCode: s.icao_code,
        name: s.name,
        timezone: s.timezone,
        emails: s.emails,
        ccEmails: s.cc_emails,
        isActive: s.is_active,
      })),
    });
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
    await ensureDb();
    const body = await req.json();

    const { icaoCode, name, emails, ccEmails, timezone } = body;

    if (!icaoCode || !emails || emails.length === 0) {
      return NextResponse.json(
        { success: false, error: "icaoCode and at least one email are required" },
        { status: 400 }
      );
    }

    const code = icaoCode.toUpperCase();
    const emailList = emails.map((e: string) => e.trim());
    const ccList = (ccEmails || []).map((e: string) => e.trim());

    // Upsert
    const { rows: existing } = await pool.query(
      "SELECT id FROM stations WHERE icao_code = $1",
      [code]
    );

    let station;
    if (existing.length > 0) {
      const { rows } = await pool.query(
        `UPDATE stations SET
          name = COALESCE($1, name), timezone = COALESCE($2, timezone),
          emails = $3, cc_emails = $4, updated_at = NOW()
        WHERE icao_code = $5 RETURNING *`,
        [name || null, timezone || null, emailList, ccList, code]
      );
      station = rows[0];
    } else {
      const { rows } = await pool.query(
        `INSERT INTO stations (id, icao_code, name, timezone, emails, cc_emails)
        VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [newId(), code, name || null, timezone || null, emailList, ccList]
      );
      station = rows[0];
    }

    return NextResponse.json({
      success: true,
      data: {
        id: station.id,
        icaoCode: station.icao_code,
        name: station.name,
        timezone: station.timezone,
        emails: station.emails,
        ccEmails: station.cc_emails,
        isActive: station.is_active,
      },
      message: `Station ${code} created`,
    });
  } catch (error) {
    console.error("POST /api/stations error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create station" },
      { status: 500 }
    );
  }
}
