import { NextRequest, NextResponse } from "next/server";
import { verifyPassword, createToken, setAuthCookie } from "@/lib/auth";
import { getRows } from "@/lib/sheets";
import { SHEET_TABS } from "@/lib/constants";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password required" },
        { status: 400 }
      );
    }

    const rows = await getRows(SHEET_TABS.USERS);
    // Find user row (skip header)
    const userRow = rows
      .slice(1)
      .find(
        (row) => row[0]?.toLowerCase() === username.toLowerCase()
      );

    if (!userRow) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const [, passwordHash, role, displayName] = userRow;

    const valid = await verifyPassword(password, passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const token = await createToken({
      username: userRow[0],
      role: role as "researcher" | "admin",
      displayName,
    });

    await setAuthCookie(token);

    return NextResponse.json({
      user: {
        username: userRow[0],
        role,
        displayName,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
