import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { ensureDb } from "@/lib/init-db";

// PUT /api/stations/[id] — update a station
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDb();
    const { id } = await params;
    const body = await req.json();

    const updates: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (body.icaoCode !== undefined) {
      updates.push(`icao_code = $${idx++}`);
      values.push(body.icaoCode.toUpperCase());
    }
    if (body.name !== undefined) {
      updates.push(`name = $${idx++}`);
      values.push(body.name);
    }
    if (body.timezone !== undefined) {
      updates.push(`timezone = $${idx++}`);
      values.push(body.timezone || null);
    }
    if (body.emails !== undefined) {
      updates.push(`emails = $${idx++}`);
      values.push(body.emails.map((e: string) => e.trim()));
    }
    if (body.ccEmails !== undefined) {
      updates.push(`cc_emails = $${idx++}`);
      values.push(body.ccEmails.map((e: string) => e.trim()));
    }
    if (body.isActive !== undefined) {
      updates.push(`is_active = $${idx++}`);
      values.push(body.isActive);
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const { rows } = await pool.query(
      `UPDATE stations SET ${updates.join(", ")} WHERE id = $${idx} RETURNING *`,
      values
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Station not found" },
        { status: 404 }
      );
    }

    const s = rows[0];
    return NextResponse.json({
      success: true,
      data: {
        id: s.id,
        icaoCode: s.icao_code,
        name: s.name,
        timezone: s.timezone,
        emails: s.emails,
        ccEmails: s.cc_emails,
        isActive: s.is_active,
      },
      message: `Station ${s.icao_code} updated`,
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
    await ensureDb();
    const { id } = await params;
    await pool.query("DELETE FROM stations WHERE id = $1", [id]);

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
