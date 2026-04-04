"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Tag from "@/components/ui/Tag";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import LlmResultDisplay from "@/components/llm/LlmResultDisplay";
import type { EnrollmentFormData } from "@/lib/types";
import { LLM_MODELS } from "@/lib/constants";

interface StepAllocationProps {
  form: EnrollmentFormData;
  updateForm: (updates: Partial<EnrollmentFormData>) => void;
  onComplete: () => void;
}

export default function StepAllocation({
  form,
  updateForm,
  onComplete,
}: StepAllocationProps) {
  const [saving, setSaving] = useState(false);

  const queryLLM = async () => {
    if (!form.hpText.trim()) return;
    updateForm({ llmLoading: true, llmError: "", llmResult: "" });

    try {
      const res = await fetch("/api/llm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hpText: form.hpText,
          studyId: form.studyId,
          model: form.llmModel,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        updateForm({ llmError: data.error || "LLM query failed", llmLoading: false });
        return;
      }

      updateForm({ llmResult: data.response, llmLoading: false });
    } catch (err) {
      updateForm({
        llmError: err instanceof Error ? err.message : "Request failed",
        llmLoading: false,
      });
    }
  };

  const saveRecord = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studyId: form.studyId,
          mrn: form.mrn,
          site: form.site,
          allocation: form.allocation,
          icuAttending: form.icuAttending,
          researcherName: form.researcherName,
          researcherEmail: form.researcherEmail,
          hpSubmitted: form.allocation === "Intervention" && form.hpText.trim().length > 0,
          llmQueried: !!form.llmResult,
          llmModel: form.llmResult ? form.llmModel : "",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      onComplete();
    } catch (err) {
      updateForm({
        llmError: err instanceof Error ? err.message : "Save failed",
      });
    }
    setSaving(false);
  };

  return (
    <>
      {/* Allocation Result */}
      <Card
        title="Randomization Complete"
        subtitle="Subject has been assigned to a study arm."
        titleRight={
          <Tag
            color={form.allocation === "Intervention" ? "accent" : "muted"}
            className="text-[13px] px-3.5 py-1.5"
          >
            {form.allocation === "Intervention"
              ? "INTERVENTION ARM"
              : "CONTROL ARM"}
          </Tag>
        }
      >
        <div className="flex gap-6">
          <div>
            <div className="text-[11px] text-text-muted uppercase tracking-widest">
              Study ID
            </div>
            <div className="text-2xl font-extrabold font-[family-name:var(--font-mono)] text-accent mt-0.5">
              {form.studyId}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-text-muted uppercase tracking-widest">
              Allocation
            </div>
            <div
              className={`text-2xl font-extrabold mt-0.5 ${
                form.allocation === "Intervention"
                  ? "text-success"
                  : "text-text-dim"
              }`}
            >
              {form.allocation}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-text-muted uppercase tracking-widest">
              Site
            </div>
            <div className="text-sm font-semibold text-text mt-1.5">
              {form.site}
            </div>
          </div>
        </div>
      </Card>

      {/* Intervention: H&P + LLM */}
      {form.allocation === "Intervention" ? (
        <Card
          title="De-identified H&P Submission"
          subtitle="Paste the de-identified History and Physical below. Ensure all 18 HIPAA identifiers have been removed via double-screening. The clinical team's preliminary Assessment & Plan should be withheld."
        >
          <Select
            label="LLM Model"
            options={LLM_MODELS.map((m) => ({ value: m.id, label: m.label }))}
            value={form.llmModel}
            onChange={(e) => updateForm({ llmModel: e.target.value })}
          />
          <div className="mt-4" />
          <Textarea
            value={form.hpText}
            onChange={(e) => updateForm({ hpText: e.target.value })}
            placeholder={`Chief Complaint: 67-year-old [sex] presenting with...\n\nHPI: Patient presented to ED with acute onset dyspnea...\n\nPMH: HTN, DM2, COPD...\n\nVitals: T 38.2 C, HR 112, BP 95/62, RR 28, SpO2 84% on RA\n\nLabs: ABG pH 7.31, PaCO2 48, PaO2 55, HCO3 22, P/F ratio 183\n      WBC 18.2, Lactate 3.1, Procalcitonin 2.4\n\nImaging: CXR bilateral infiltrates R>L...\n\nAssessment: [WITHHELD]\nPlan: [WITHHELD]`}
          />
          <div className="flex gap-3 mt-4 items-center">
            <Button
              disabled={!form.hpText.trim() || form.llmLoading}
              loading={form.llmLoading}
              onClick={queryLLM}
            >
              {form.llmLoading ? "Querying LLM..." : "Submit to LLM"}
            </Button>
            <Button variant="secondary" onClick={saveRecord} loading={saving}>
              Skip LLM Query &amp; Save Record &rarr;
            </Button>
          </div>

          {form.llmError && (
            <div className="p-3.5 bg-danger/5 border border-danger/20 rounded-lg mt-4">
              <p className="text-[13px] text-danger">{form.llmError}</p>
            </div>
          )}

          {form.llmResult && (
            <>
              <LlmResultDisplay result={form.llmResult} />
              <div className="mt-4">
                <Button variant="success" onClick={saveRecord} loading={saving}>
                  Save Record &amp; Complete Enrollment &rarr;
                </Button>
              </div>
            </>
          )}
        </Card>
      ) : (
        <Card
          title="Control Arm -- Standard Care"
          subtitle="This subject has been randomized to the Control Arm. No LLM query will be performed. Clinical care proceeds per standard protocols."
        >
          {form.llmError && (
            <div className="p-3.5 bg-danger/5 border border-danger/20 rounded-lg mb-4">
              <p className="text-[13px] text-danger">{form.llmError}</p>
            </div>
          )}
          <Button variant="success" onClick={saveRecord} loading={saving}>
            Save Record &amp; Complete Enrollment &rarr;
          </Button>
        </Card>
      )}
    </>
  );
}
