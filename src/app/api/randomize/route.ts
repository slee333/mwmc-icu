import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { performRandomization } from "@/lib/randomization";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
      internalId: result.internalId,
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
