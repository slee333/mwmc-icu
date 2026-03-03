"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/layout/Header";
import NavTabs from "@/components/layout/NavTabs";
import Card from "@/components/ui/Card";
import Tag from "@/components/ui/Tag";
import Spinner from "@/components/ui/Spinner";

interface SubjectRow {
  "Study ID": string;
  "Internal ID": string;
  MRN: string;
  Site: string;
  Allocation: string;
  "ICU Attending": string;
  "Researcher Name": string;
  "Researcher Email": string;
  "Enrollment Date": string;
  "H&P Submitted": string;
  "LLM Queried": string;
  "LLM Model": string;
}

export default function LogPage() {
  const { user, loading: authLoading } = useAuth();
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/subjects")
      .then((r) => r.json())
      .then((d) => {
        setSubjects(d.subjects || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const controlCount = subjects.filter(
    (s) => s.Allocation === "Control"
  ).length;
  const interventionCount = subjects.filter(
    (s) => s.Allocation === "Intervention"
  ).length;

  return (
    <div className="min-h-screen">
      <Header user={user} />
      <NavTabs user={user} subjectCount={subjects.length} />
      <main className="max-w-[900px] mx-auto py-8 px-6">
        <Card title="Enrollment Log" subtitle="All enrolled subjects across both study sites.">
          {loading ? (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          ) : subjects.length === 0 ? (
            <p className="text-text-muted text-[13px] text-center py-10">
              No subjects enrolled yet.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[13px]">
                  <thead>
                    <tr>
                      {["ID", "Internal ID", "Site", "Arm", "Attending", "Researcher", "Date", "LLM"].map(
                        (h) => (
                          <th
                            key={h}
                            className="text-left px-3 py-2.5 border-b-2 border-card-border text-text-muted text-[11px] uppercase tracking-widest"
                          >
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {[...subjects].reverse().map((s, i) => (
                      <tr key={i} className="border-b border-card-border">
                        <td className="px-3 py-2.5 font-mono font-bold text-accent">
                          {s["Study ID"]}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-text-dim">
                          {s["Internal ID"]}
                        </td>
                        <td className="px-3 py-2.5 text-text-dim">
                          {s.Site?.replace(" Medical Center", "").replace(
                            " Hospital",
                            ""
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          <Tag
                            color={
                              s.Allocation === "Intervention"
                                ? "accent"
                                : "muted"
                            }
                          >
                            {s.Allocation}
                          </Tag>
                        </td>
                        <td className="px-3 py-2.5 text-text-dim">
                          {s["ICU Attending"]}
                        </td>
                        <td className="px-3 py-2.5 text-text-dim">
                          {s["Researcher Name"]}
                        </td>
                        <td className="px-3 py-2.5 text-text-muted">
                          {s["Enrollment Date"]
                            ? new Date(s["Enrollment Date"]).toLocaleDateString()
                            : ""}
                        </td>
                        <td className="px-3 py-2.5">
                          {s["LLM Queried"] === "true" ? (
                            <span className="text-success">&#10003;</span>
                          ) : (
                            <span className="text-text-muted">&mdash;</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-xs text-text-muted">
                Total: {subjects.length} &middot; Control: {controlCount}{" "}
                &middot; Intervention: {interventionCount}
              </div>
            </>
          )}
        </Card>
      </main>
    </div>
  );
}
