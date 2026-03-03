import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { queryLLM } from "@/lib/anthropic";
import { queryGemini } from "@/lib/gemini";
import { appendRow } from "@/lib/sheets";
import { SHEET_TABS, LLM_MODELS, DEFAULT_LLM_MODEL } from "@/lib/constants";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { hpText, studyId, internalId, model } = await request.json();

    if (!hpText || !hpText.trim()) {
      return NextResponse.json(
        { error: "H&P text is required" },
        { status: 400 }
      );
    }

    const selectedModelId = model || DEFAULT_LLM_MODEL;
    const modelConfig = LLM_MODELS.find((m) => m.id === selectedModelId);
    if (!modelConfig) {
      return NextResponse.json(
        { error: `Unknown model: ${selectedModelId}` },
        { status: 400 }
      );
    }

    let result: { response: string; model: string; responseTimeMs: number };

    if (modelConfig.provider === "gemini") {
      result = await queryGemini(hpText, modelConfig.id);
    } else {
      result = await queryLLM(hpText);
    }

    // Save to LLM_Interactions sheet
    const timestamp = new Date().toISOString();
    await appendRow(SHEET_TABS.LLM_INTERACTIONS, [
      studyId || "",
      internalId || "",
      hpText,
      result.model,
      result.response,
      timestamp,
      String(result.responseTimeMs),
    ]);

    return NextResponse.json({
      response: result.response,
      model: result.model,
      responseTimeMs: result.responseTimeMs,
    });
  } catch (error) {
    console.error("LLM query error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "LLM query failed",
      },
      { status: 500 }
    );
  }
}
