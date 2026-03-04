import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { ensureDb } from "@/lib/init-db";
import { newId } from "@/lib/id";

// GET /api/settings — get all settings
export async function GET() {
  try {
    await ensureDb();
    const { rows } = await pool.query("SELECT * FROM settings");
    const settingsMap: Record<string, string> = {};
    for (const s of rows) {
      settingsMap[s.key] = s.value;
    }

    return NextResponse.json({ success: true, data: settingsMap });
  } catch (error) {
    console.error("GET /api/settings error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// PUT /api/settings — upsert settings
export async function PUT(req: NextRequest) {
  try {
    await ensureDb();
    const body = await req.json();

    const results = [];
    for (const [key, value] of Object.entries(body)) {
      const { rows: existing } = await pool.query(
        "SELECT id FROM settings WHERE key = $1",
        [key]
      );

      if (existing.length > 0) {
        const { rows } = await pool.query(
          "UPDATE settings SET value = $1, updated_at = NOW() WHERE key = $2 RETURNING *",
          [String(value), key]
        );
        results.push(rows[0]);
      } else {
        const { rows } = await pool.query(
          "INSERT INTO settings (id, key, value) VALUES ($1, $2, $3) RETURNING *",
          [newId(), key, String(value)]
        );
        results.push(rows[0]);
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
      message: "Settings updated",
    });
  } catch (error) {
    console.error("PUT /api/settings error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
