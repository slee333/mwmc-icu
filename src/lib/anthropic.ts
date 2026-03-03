import Anthropic from "@anthropic-ai/sdk";
import { LLM_MODEL, LLM_MAX_TOKENS } from "./constants";
import { SYSTEM_PROMPT } from "./system-prompt";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (client) return client;
  client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
  return client;
}

export async function queryLLM(hpText: string): Promise<{
  response: string;
  model: string;
  responseTimeMs: number;
}> {
  const anthropic = getClient();
  const startTime = Date.now();

  const message = await anthropic.messages.create({
    model: LLM_MODEL,
    max_tokens: LLM_MAX_TOKENS,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Here is the de-identified History and Physical for an ICU patient with Acute Hypoxic Respiratory Failure:\n\n${hpText}`,
      },
    ],
  });

  const responseTimeMs = Date.now() - startTime;
  const response = message.content
    .filter((block) => block.type === "text")
    .map((block) => {
      if (block.type === "text") return block.text;
      return "";
    })
    .join("\n");

  return {
    response,
    model: LLM_MODEL,
    responseTimeMs,
  };
}
