import { NextRequest, NextResponse } from "next/server";
import { getAllDataRows } from "@/lib/sheets";
import { SHEET_TABS, SUBJECT_HEADERS } from "@/lib/constants";

export async function POST(request: NextRequest) {
  try {
    const { mrnHash } = await request.json();

    if (!mrnHash || typeof mrnHash !== "string") {
      return NextResponse.json(
        { error: "mrnHash is required" },
        { status: 400 }
      );
    }

    const rows = await getAllDataRows(SHEET_TABS.SUBJECTS);
    const mrnHashIndex = SUBJECT_HEADERS.indexOf("MRN Hash");

    const exists = rows.some((row) => row[mrnHashIndex] === mrnHash);

    return NextResponse.json({ exists });
  } catch (error) {
    console.error("Check MRN error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
