/**
 * Seed script for ICU LLM Study Platform
 *
 * Usage:
 *   node scripts/seed.mjs
 *
 * Requires .env.local to be configured with:
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_SPREADSHEET_ID
 *   ADMIN_USERNAME, ADMIN_PASSWORD (optional, defaults to admin/changeme)
 *   JWT_SECRET
 */

import { google } from "googleapis";
import { hash } from "bcryptjs";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env.local
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
    // Remove surrounding quotes
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
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "changeme";

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  },
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

async function clearAndWrite(tab, values) {
  // Clear existing data
  try {
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: `${tab}!A:Z`,
    });
  } catch {
    // Tab might not exist yet
  }

  // Write data
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${tab}!A1`,
    valueInputOption: "RAW",
    requestBody: { values },
  });
  console.log(`  [OK] ${tab}: ${values.length} rows written`);
}

async function main() {
  console.log("Seeding ICU LLM Study spreadsheet...\n");

  // 1. Subjects - headers only
  await clearAndWrite("Subjects", [
    [
      "Study ID",
      "Internal ID",
      "MRN",
      "Site",
      "Allocation",
      "ICU Attending",
      "Researcher Name",
      "Researcher Email",
      "Enrollment Date",
      "H&P Submitted",
      "LLM Queried",
      "LLM Model",
    ],
  ]);

  // 2. LLM_Interactions - headers only
  await clearAndWrite("LLM_Interactions", [
    [
      "Study ID",
      "Internal ID",
      "H&P Text",
      "LLM Model",
      "LLM Response",
      "Timestamp",
      "Response Time Ms",
    ],
  ]);

  // 3. Post_Enrollment_Surveys - headers only
  await clearAndWrite("Post_Enrollment_Surveys", [
    ["Study ID", "Internal ID", "Survey Responses", "Timestamp"],
  ]);

  // 4. Randomization_State - headers + 2 site rows
  const now = new Date().toISOString();
  await clearAndWrite("Randomization_State", [
    ["Site", "Remaining Allocations", "Next Internal ID", "Last Updated"],
    ["MetroWest Medical Center", "[]", "1", now],
    ["St. Vincent Hospital", "[]", "1", now],
  ]);

  // 5. Users - headers + admin user
  const passwordHash = await hash(ADMIN_PASSWORD, 12);
  await clearAndWrite("Users", [
    ["Username", "Password Hash", "Role", "Display Name", "Created At"],
    [ADMIN_USERNAME, passwordHash, "admin", "Administrator", now],
  ]);

  console.log(`\nSeed complete!`);
  console.log(`  Admin login: ${ADMIN_USERNAME} / ${ADMIN_PASSWORD}`);
  console.log(`  Change the password after first login.`);
}

main().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
