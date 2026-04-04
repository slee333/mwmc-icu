/**
 * Brute-force a single SHA-256 hash across all 9-digit numbers.
 * Also tries shorter/longer lengths in case of typos.
 */

import { createHash } from "crypto";

const TARGET = "e3fbb85724d2a3065cb8b60c9c04d68902f18c32b2886a0e6bd338700bf9931d";

function sha256(input) {
  const normalized = input.trim().toUpperCase();
  return createHash("sha256").update(normalized).digest("hex");
}

async function main() {
  console.log(`Target hash: ${TARGET}\n`);

  // Try all 9-digit numbers (100000000-999999999)
  console.log("Trying all 9-digit numbers (100000000-999999999)...");
  let start = Date.now();
  for (let n = 100_000_000; n <= 999_999_999; n++) {
    if (sha256(String(n)) === TARGET) {
      console.log(`\n  FOUND: ${n}`);
      console.log(`  Done in ${((Date.now() - start) / 1000).toFixed(1)}s`);
      return;
    }
    if (n % 100_000_000 === 0) {
      console.log(`  ${n}... (${((Date.now() - start) / 1000).toFixed(0)}s elapsed)`);
    }
  }

  // Try 7-8 digit numbers (in case someone entered fewer digits)
  console.log("\nTrying 7-8 digit numbers...");
  for (let n = 1_000_000; n <= 99_999_999; n++) {
    if (sha256(String(n)) === TARGET) {
      console.log(`\n  FOUND: ${n}`);
      return;
    }
  }

  // Try 10-digit numbers
  console.log("Trying 10-digit numbers (1000000000-3999999999)...");
  for (let n = 1_000_000_000; n <= 3_999_999_999; n++) {
    if (sha256(String(n)) === TARGET) {
      console.log(`\n  FOUND: ${n}`);
      return;
    }
    if (n % 1_000_000_000 === 0) {
      console.log(`  ${n}...`);
    }
  }

  console.log("\nNot found in any numeric range tried. Might contain letters or special characters.");
}

main().catch(console.error);
