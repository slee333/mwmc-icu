import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getRows } from "@/lib/sheets";
import { SHEET_TABS } from "@/lib/constants";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const studyId = searchParams.get("studyId");

  if (!studyId) {
    return NextResponse.json(
      { error: "studyId parameter required" },
      { status: 400 }
    );
  }

  const rows = await getRows(SHEET_TABS.SUBJECTS);
  // Column 0 is Study ID, skip header
  const exists = rows.slice(1).some((row) => row[0] === studyId);

  return NextResponse.json({ exists });
}
