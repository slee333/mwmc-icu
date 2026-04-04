import OpenAI from "openai";
import { SYSTEM_PROMPT } from "./system-prompt";

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (client) return client;
  client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  return client;
}

export async function queryOpenAI(
  hpText: string,
  modelId: string
): Promise<{
  response: string;
  model: string;
  responseTimeMs: number;
}> {
  const openai = getClient();
  const startTime = Date.now();

  const completion = await openai.chat.completions.create({
    model: modelId,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Here is the de-identified History and Physical for an ICU patient with Acute Hypoxic Respiratory Failure:\n\n${hpText}`,
      },
    ],
  });

  const responseTimeMs = Date.now() - startTime;
  const response = completion.choices[0]?.message?.content || "";

  return {
    response,
    model: modelId,
    responseTimeMs,
  };
}
