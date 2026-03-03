import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getRows } from "@/lib/sheets";
import { SHEET_TABS } from "@/lib/constants";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const rows = await getRows(SHEET_TABS.SUBJECTS);

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "No data to export" },
        { status: 404 }
      );
    }

    // Escape CSV fields
    const escapeCsv = (field: string) => {
      if (field.includes(",") || field.includes('"') || field.includes("\n")) {
        return `"${field.replace(/"/g, '""')}"`;
      }
      return field;
    };

    const csv = rows
      .map((row) => row.map((cell) => escapeCsv(cell || "")).join(","))
      .join("\n");

    const date = new Date().toISOString().slice(0, 10);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="icu_llm_study_export_${date}.csv"`,
      },
    });
  } catch (error) {
    console.error("CSV export error:", error);
    return NextResponse.json(
      { error: "Export failed" },
      { status: 500 }
    );
  }
}
