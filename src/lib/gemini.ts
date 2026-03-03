import { GoogleGenerativeAI } from "@google/generative-ai";
import { SYSTEM_PROMPT } from "./system-prompt";

let client: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (client) return client;
  client = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);
  return client;
}

export async function queryGemini(
  hpText: string,
  modelId: string
): Promise<{
  response: string;
  model: string;
  responseTimeMs: number;
}> {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({
    model: modelId,
    systemInstruction: SYSTEM_PROMPT,
  });

  const startTime = Date.now();

  const result = await model.generateContent(
    `Here is the de-identified History and Physical for an ICU patient with Acute Hypoxic Respiratory Failure:\n\n${hpText}`
  );

  const responseTimeMs = Date.now() - startTime;
  const response = result.response.text();

  return {
    response,
    model: modelId,
    responseTimeMs,
  };
}
