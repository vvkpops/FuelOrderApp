import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/auth
 * Simple username/password check against env vars.
 * Returns { success: true } if credentials match.
 */
export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    const validUser = process.env.APP_USERNAME || "admin";
    const validPass = process.env.APP_PASSWORD || "admin";

    if (username === validUser && password === validPass) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { success: false, error: "Invalid credentials" },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Bad request" },
      { status: 400 }
    );
  }
}
