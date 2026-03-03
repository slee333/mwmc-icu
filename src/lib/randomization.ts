import { BLOCK_SIZES, SITE_PREFIXES, SHEET_TABS } from "./constants";
import { getRows, updateRow, invalidateCache } from "./sheets";

function generateBlock(size: number): string[] {
  const half = size / 2;
  const assignments = [
    ...Array(half).fill("Control"),
    ...Array(half).fill("Intervention"),
  ];
  // Fisher-Yates shuffle
  for (let i = assignments.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [assignments[i], assignments[j]] = [assignments[j], assignments[i]];
  }
  return assignments;
}

export { invalidateCache };

export async function performRandomization(
  site: string,
  maxRetries = 3
): Promise<{ allocation: "Control" | "Intervention"; internalId: string }> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // Force fresh read
    invalidateCache(SHEET_TABS.RANDOMIZATION_STATE);
    const rows = await getRows(SHEET_TABS.RANDOMIZATION_STATE);

    // Find site row (skip header at index 0)
    let siteRowIndex = -1;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === site) {
        siteRowIndex = i + 1; // 1-indexed for Sheets API
        break;
      }
    }

    if (siteRowIndex === -1) {
      throw new Error(`Site "${site}" not found in randomization state`);
    }

    const row = rows[siteRowIndex - 1];
    const remaining: string[] = JSON.parse(row[1] || "[]");
    const nextId = parseInt(row[2] || "1", 10);
    const lastUpdated = row[3] || "";

    // Generate new block if empty
    if (remaining.length === 0) {
      const blockSize =
        BLOCK_SIZES[Math.floor(Math.random() * BLOCK_SIZES.length)];
      remaining.push(...generateBlock(blockSize));
    }

    const allocation = remaining.shift()!;
    const prefix = SITE_PREFIXES[site] || "XX";
    const internalId = `${prefix}-${String(nextId).padStart(4, "0")}`;
    const newLastUpdated = new Date().toISOString();

    const newValues = [
      site,
      JSON.stringify(remaining),
      String(nextId + 1),
      newLastUpdated,
    ];

    // Optimistic concurrency: verify lastUpdated hasn't changed
    invalidateCache(SHEET_TABS.RANDOMIZATION_STATE);
    const freshRows = await getRows(SHEET_TABS.RANDOMIZATION_STATE);
    const freshRow = freshRows[siteRowIndex - 1];

    if (freshRow && freshRow[3] === lastUpdated) {
      await updateRow(SHEET_TABS.RANDOMIZATION_STATE, siteRowIndex, newValues);
      return {
        allocation: allocation as "Control" | "Intervention",
        internalId,
      };
    }

    // Concurrent modification — retry
    if (attempt === maxRetries - 1) {
      throw new Error("Failed to randomize after max retries (concurrency)");
    }
  }

  throw new Error("Randomization failed");
}
