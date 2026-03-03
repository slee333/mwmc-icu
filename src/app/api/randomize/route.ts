import { NextRequest, NextResponse } from "next/server";
import { performRandomization } from "@/lib/randomization";

export async function POST(request: NextRequest) {
  try {
    const { site } = await request.json();

    if (!site) {
      return NextResponse.json(
        { error: "Site is required" },
        { status: 400 }
      );
    }

    const result = await performRandomization(site);

    return NextResponse.json({
      allocation: result.allocation,
      studyId: result.studyId,
    });
  } catch (error) {
    console.error("Randomization error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Randomization failed",
      },
      { status: 500 }
    );
  }
}
