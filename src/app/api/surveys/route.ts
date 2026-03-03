import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { appendRow } from "@/lib/sheets";
import { SHEET_TABS } from "@/lib/constants";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { studyId, internalId, responses } = await request.json();

    if (!studyId || !responses) {
      return NextResponse.json(
        { error: "studyId and responses are required" },
        { status: 400 }
      );
    }

    const timestamp = new Date().toISOString();
    await appendRow(SHEET_TABS.POST_ENROLLMENT_SURVEYS, [
      studyId,
      internalId || "",
      JSON.stringify(responses),
      timestamp,
    ]);

    return NextResponse.json({ success: true, timestamp });
  } catch (error) {
    console.error("Survey save error:", error);
    return NextResponse.json(
      { error: "Failed to save survey" },
      { status: 500 }
    );
  }
}
