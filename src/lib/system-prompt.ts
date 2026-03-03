import { readFileSync } from "fs";
import { join } from "path";

export const SYSTEM_PROMPT = readFileSync(
  join(process.cwd(), "docs", "prompt3.md"),
  "utf-8",
);
