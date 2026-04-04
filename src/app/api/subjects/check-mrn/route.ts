import { NextRequest, NextResponse } from "next/server";
import { getAllDataRows } from "@/lib/sheets";
import { SHEET_TABS, SUBJECT_HEADERS } from "@/lib/constants";

export async function POST(request: NextRequest) {
  try {
    const { mrn } = await request.json();

    if (!mrn || typeof mrn !== "string") {
      return NextResponse.json(
        { error: "mrn is required" },
        { status: 400 }
      );
    }

    const rows = await getAllDataRows(SHEET_TABS.SUBJECTS);
    const mrnIndex = SUBJECT_HEADERS.indexOf("MRN");

    const exists = rows.some((row) => row[mrnIndex] === mrn.trim());

    return NextResponse.json({ exists });
  } catch (error) {
    console.error("Check MRN error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
