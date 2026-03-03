import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAllDataRows, appendRow } from "@/lib/sheets";
import { SHEET_TABS, SUBJECT_HEADERS } from "@/lib/constants";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await getAllDataRows(SHEET_TABS.SUBJECTS);
  const subjects = rows.map((row) => {
    const obj: Record<string, string> = {};
    SUBJECT_HEADERS.forEach((header, i) => {
      obj[header] = row[i] || "";
    });
    return obj;
  });

  return NextResponse.json({ subjects });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      studyId,
      internalId,
      mrn,
      site,
      allocation,
      icuAttending,
      researcherName,
      researcherEmail,
      hpSubmitted,
      llmQueried,
      llmModel,
    } = body;

    if (!studyId || !internalId || !site || !allocation) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const enrollmentDate = new Date().toISOString();
    const values = [
      studyId,
      internalId,
      mrn || "",
      site,
      allocation,
      icuAttending || "",
      researcherName || "",
      researcherEmail || "",
      enrollmentDate,
      String(!!hpSubmitted),
      String(!!llmQueried),
      llmModel || "",
    ];

    await appendRow(SHEET_TABS.SUBJECTS, values);

    return NextResponse.json({ success: true, enrollmentDate });
  } catch (error) {
    console.error("Create subject error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
