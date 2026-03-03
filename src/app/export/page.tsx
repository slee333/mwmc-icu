"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import NavTabs from "@/components/layout/NavTabs";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";

export default function ExportPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [subjectCount, setSubjectCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!authLoading && user?.role !== "admin") {
      router.push("/enroll");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    fetch("/api/subjects")
      .then((r) => r.json())
      .then((d) => {
        setSubjectCount(d.subjects?.length || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch("/api/export/csv");
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const date = new Date().toISOString().slice(0, 10);
      a.download = `icu_llm_study_export_${date}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
    }
    setDownloading(false);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (user?.role !== "admin") return null;

  return (
    <div className="min-h-screen">
      <Header user={user} />
      <NavTabs user={user} subjectCount={subjectCount} />
      <main className="max-w-[900px] mx-auto py-8 px-6">
        <Card
          title="Data Export"
          subtitle="Export enrollment data as CSV for import into Google Sheets or Excel."
        >
          <Button
            onClick={handleDownload}
            disabled={subjectCount === 0}
            loading={downloading}
          >
            Download CSV ({subjectCount} records)
          </Button>
        </Card>

        <Card
          title="Study Statistics"
          subtitle="Overview of enrollment progress."
        >
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-input rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-accent">{subjectCount}</div>
              <div className="text-xs text-text-muted mt-1">Total Enrolled</div>
            </div>
            <div className="bg-input rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-text-dim">--</div>
              <div className="text-xs text-text-muted mt-1">Control</div>
            </div>
            <div className="bg-input rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-success">--</div>
              <div className="text-xs text-text-muted mt-1">Intervention</div>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
