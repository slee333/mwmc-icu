/**
 * Brute-force recover MRNs from SHA-256 hashes, then update the Google Sheet.
 * MRN format: 3NNNNNNNN (9-digit number starting with 3)
 *
 * What this does:
 *   1. Reads existing hashes from column B ("MRN Hash")
 *   2. Brute-forces the original MRNs
 *   3. Renames column B header from "MRN Hash" to "MRN"
 *   4. Replaces hashes with plaintext MRNs in column B
 *   5. Adds a "MRN Hash (legacy)" column at the end with the old hashes
 *
 * Usage: node scripts/unhash-mrns.mjs
 */

import { createHash } from "crypto";
import { google } from "googleapis";
import { readFileSync } from "fs";
import { resolve } from "path";

// --- Load .env.local (same as seed.mjs) ---
const envPath = resolve(process.cwd(), ".env.local");
try {
  const envContent = readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
} catch {
  console.error("Could not read .env.local - make sure it exists");
  process.exit(1);
}

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
const rawKeyB64 = process.env.GOOGLE_PRIVATE_KEY_BASE64;
const rawKey = rawKeyB64
  ? Buffer.from(rawKeyB64, "base64").toString("utf-8")
  : (process.env.GOOGLE_PRIVATE_KEY || "");
const privateKey = rawKey.replace(/^["']|["']$/g, "").split("\\n").join("\n");

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: privateKey,
  },
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});
const sheets = google.sheets({ version: "v4", auth });

// --- SHA-256 matching the original hash.ts logic ---
function sha256(input) {
  const normalized = input.trim().toUpperCase();
  return createHash("sha256").update(normalized).digest("hex");
}

async function main() {
  // Step 1: Read existing data
  console.log("Reading Subjects sheet...");
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "Subjects!A:Z",
  });
  const rows = res.data.values || [];
  if (rows.length <= 1) {
    console.log("No data rows found.");
    return;
  }

  const headers = rows[0];
  const dataRows = rows.slice(1);
  const mrnColIndex = headers.indexOf("MRN Hash");

  if (mrnColIndex === -1) {
    console.log('Column "MRN Hash" not found. Headers:', headers);
    console.log('If already renamed to "MRN", nothing to migrate.');
    return;
  }

  // Collect hashes
  const hashEntries = [];
  for (let i = 0; i < dataRows.length; i++) {
    const hash = dataRows[i][mrnColIndex];
    if (hash) hashEntries.push({ rowIdx: i, hash });
  }

  console.log(`Found ${hashEntries.length} hashed MRNs to recover.\n`);

  if (hashEntries.length === 0) {
    console.log("No hashes to crack. Just renaming the header.");
  }

  // Step 2: Brute-force
  const hashMap = new Map();
  for (const entry of hashEntries) {
    if (!hashMap.has(entry.hash)) hashMap.set(entry.hash, []);
    hashMap.get(entry.hash).push(entry.rowIdx);
  }

  const recovered = new Map(); // rowIdx -> plaintext MRN
  let remaining = hashMap.size;

  if (remaining > 0) {
    console.log("Brute-forcing MRNs in range 300000000-399999999...");
    const start = Date.now();

    for (let n = 300_000_000; n <= 399_999_999; n++) {
      const candidate = String(n);
      const h = sha256(candidate);

      if (hashMap.has(h)) {
        const rowIndices = hashMap.get(h);
        for (const idx of rowIndices) {
          recovered.set(idx, candidate);
          const studyId = dataRows[idx][0];
          console.log(`  Found: Study ID ${studyId} -> MRN ${candidate}`);
        }
        hashMap.delete(h);
        remaining--;
        if (remaining === 0) break;
      }

      if ((n - 300_000_000) % 10_000_000 === 0 && n > 300_000_000) {
        const pct = (((n - 300_000_000) / 100_000_000) * 100).toFixed(0);
        console.log(`  ${pct}% searched... (${remaining} remaining)`);
      }
    }

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`\nBrute-force done in ${elapsed}s. Recovered ${recovered.size}/${hashEntries.length} MRNs.`);

    if (hashMap.size > 0) {
      console.log("\nWARNING: Could not recover these hashes:");
      for (const [hash, indices] of hashMap) {
        const sids = indices.map((i) => dataRows[i][0]).join(", ");
        console.log(`  Study IDs ${sids}: ${hash}`);
      }
    }
  }

  // Step 3: Update the sheet
  console.log("\nUpdating Google Sheet...");

  // Build updated rows with: MRN in col B, legacy hash appended at end
  const legacyColIndex = headers.length; // new column at the end
  const updatedRows = [];

  // Header row: rename col B, add legacy column
  const newHeaders = [...headers];
  newHeaders[mrnColIndex] = "MRN";
  newHeaders[legacyColIndex] = "MRN Hash (legacy)";
  updatedRows.push(newHeaders);

  // Data rows
  for (let i = 0; i < dataRows.length; i++) {
    const row = [...dataRows[i]];
    // Pad row to full header length if needed
    while (row.length < headers.length) row.push("");
    const oldHash = row[mrnColIndex] || "";
    // Replace hash with recovered MRN (or leave hash if unrecovered)
    if (recovered.has(i)) {
      row[mrnColIndex] = recovered.get(i);
    }
    // Append legacy hash at the end
    row[legacyColIndex] = oldHash;
    updatedRows.push(row);
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `Subjects!A1:${columnLetter(legacyColIndex)}${updatedRows.length}`,
    valueInputOption: "RAW",
    requestBody: { values: updatedRows },
  });

  console.log("Sheet updated successfully!");
  console.log(`  - Column B renamed: "MRN Hash" -> "MRN"`);
  console.log(`  - Column ${columnLetter(legacyColIndex)}: "MRN Hash (legacy)" added`);
  console.log(`  - ${recovered.size} MRNs restored to plaintext`);
}

function columnLetter(index) {
  let letter = "";
  let i = index;
  while (i >= 0) {
    letter = String.fromCharCode(65 + (i % 26)) + letter;
    i = Math.floor(i / 26) - 1;
  }
  return letter;
}

main().catch(console.error);
