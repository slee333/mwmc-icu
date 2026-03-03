import { google, sheets_v4 } from "googleapis";

let sheetsClient: sheets_v4.Sheets | null = null;

function getSheets(): sheets_v4.Sheets {
  if (sheetsClient) return sheetsClient;

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  sheetsClient = google.sheets({ version: "v4", auth });
  return sheetsClient;
}

function getSpreadsheetId(): string {
  const id = process.env.GOOGLE_SPREADSHEET_ID;
  if (!id) throw new Error("GOOGLE_SPREADSHEET_ID not set");
  return id;
}

// --- In-memory cache with 30s TTL ---
const cache = new Map<string, { data: unknown[][]; ts: number }>();
const CACHE_TTL = 30_000;

function getCached(key: string): unknown[][] | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
  cache.delete(key);
  return null;
}

function setCache(key: string, data: unknown[][]) {
  cache.set(key, { data, ts: Date.now() });
}

export function invalidateCache(tab: string) {
  cache.delete(tab);
}

// --- CRUD helpers ---

export async function getRows(tab: string): Promise<string[][]> {
  const cached = getCached(tab);
  if (cached) return cached as string[][];

  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: `${tab}!A:Z`,
  });

  const rows = (res.data.values || []) as string[][];
  setCache(tab, rows);
  return rows;
}

export async function appendRow(tab: string, values: string[]): Promise<void> {
  const sheets = getSheets();
  await sheets.spreadsheets.values.append({
    spreadsheetId: getSpreadsheetId(),
    range: `${tab}!A:Z`,
    valueInputOption: "RAW",
    requestBody: { values: [values] },
  });
  invalidateCache(tab);
}

export async function updateRow(
  tab: string,
  rowIndex: number,
  values: string[]
): Promise<void> {
  const sheets = getSheets();
  await sheets.spreadsheets.values.update({
    spreadsheetId: getSpreadsheetId(),
    range: `${tab}!A${rowIndex}:Z${rowIndex}`,
    valueInputOption: "RAW",
    requestBody: { values: [values] },
  });
  invalidateCache(tab);
}

export async function getRowByColumn(
  tab: string,
  colIndex: number,
  value: string
): Promise<{ row: string[]; rowIndex: number } | null> {
  const rows = await getRows(tab);
  // Skip header row (index 0)
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][colIndex] === value) {
      return { row: rows[i], rowIndex: i + 1 }; // +1 because Sheets is 1-indexed
    }
  }
  return null;
}

export async function getAllDataRows(tab: string): Promise<string[][]> {
  const rows = await getRows(tab);
  return rows.slice(1); // Skip header row
}

// Optimistic concurrency: read → modify → write with version check
export async function updateRowWithConcurrency(
  tab: string,
  rowIndex: number,
  expectedLastUpdated: string,
  lastUpdatedColIndex: number,
  newValues: string[]
): Promise<boolean> {
  // Re-read fresh (bypass cache)
  invalidateCache(tab);
  const rows = await getRows(tab);
  const currentRow = rows[rowIndex - 1]; // Convert from 1-indexed
  if (!currentRow) return false;

  if (currentRow[lastUpdatedColIndex] !== expectedLastUpdated) {
    return false; // Concurrent modification detected
  }

  await updateRow(tab, rowIndex, newValues);
  return true;
}
