"use client";

import { useCallback, useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { SITES, ICU_ATTENDINGS } from "@/lib/constants";
import type { EnrollmentFormData } from "@/lib/types";

interface StepRegistrationProps {
  form: EnrollmentFormData;
  updateForm: (updates: Partial<EnrollmentFormData>) => void;
  onNext: () => void;
}

export default function StepRegistration({
  form,
  updateForm,
  onNext,
}: StepRegistrationProps) {
  const [idCheckResult, setIdCheckResult] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const checkStudyId = useCallback(
    async (id: string) => {
      if (!id || !form.site) return;
      setChecking(true);
      try {
        const res = await fetch(
          `/api/subjects/check-id?studyId=${encodeURIComponent(id)}`
        );
        const data = await res.json();
        if (data.exists) {
          setIdCheckResult("This Study ID has already been used.");
        } else {
          setIdCheckResult(null);
        }
      } catch {
        setIdCheckResult(null);
      }
      setChecking(false);
    },
    [form.site]
  );

  useEffect(() => {
    if (form.studyId) {
      const timer = setTimeout(() => checkStudyId(form.studyId), 500);
      return () => clearTimeout(timer);
    } else {
      setIdCheckResult(null);
    }
  }, [form.studyId, checkStudyId]);

  const siteOptions = SITES.map((s) => ({ value: s, label: s }));
  const attendingOptions = ICU_ATTENDINGS.map((a) => ({
    value: a,
    label: a,
  }));

  const canProceed =
    form.site &&
    form.researcherName &&
    form.researcherEmail &&
    form.studyId &&
    form.studyIdConfirmed &&
    form.mrn &&
    form.icuAttending &&
    !idCheckResult &&
    !checking;

  return (
    <Card title="Study Registration" subtitle="Enter study site and researcher information to begin enrollment.">
      <div className="flex gap-4 mb-4">
        <div className="flex-1">
          <Select
            label="Study Site"
            options={siteOptions}
            placeholder="Select site..."
            value={form.site}
            onChange={(e) => updateForm({ site: e.target.value })}
          />
        </div>
      </div>

      <div className="flex gap-4 mb-4">
        <div className="flex-1">
          <Input
            label="Researcher Name"
            value={form.researcherName}
            onChange={(e) => updateForm({ researcherName: e.target.value })}
            placeholder="Dr. Jane Smith"
          />
        </div>
        <div className="flex-1">
          <Input
            label="Researcher Email"
            type="email"
            value={form.researcherEmail}
            onChange={(e) => updateForm({ researcherEmail: e.target.value })}
            placeholder="researcher@hospital.org"
          />
        </div>
      </div>

      <p className="text-xs text-text-muted mb-5">
        Email is used to send the 24-hour post-enrollment follow-up survey link.
      </p>

      <div className="border-t border-card-border my-5" />

      <div className="flex gap-4 mb-4">
        <div className="flex-1">
          <Input
            label="ICU Study ID (001-500)"
            value={form.studyId}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9]/g, "").slice(0, 3);
              updateForm({ studyId: val });
            }}
            placeholder="e.g. 042"
            error={idCheckResult || undefined}
          />
          {checking && (
            <p className="text-xs text-text-muted mt-1">Checking...</p>
          )}
        </div>
        <div className="flex-1">
          <Input
            label="Patient MRN"
            value={form.mrn}
            onChange={(e) => updateForm({ mrn: e.target.value })}
            placeholder="Enter MRN"
          />
        </div>
      </div>

      <div className="mb-4">
        <Select
          label="ICU Attending"
          options={attendingOptions}
          placeholder="Select attending..."
          value={form.icuAttending}
          onChange={(e) => updateForm({ icuAttending: e.target.value })}
        />
      </div>

      <div
        onClick={() => updateForm({ studyIdConfirmed: !form.studyIdConfirmed })}
        className={`
          flex items-start gap-3 px-4 py-3 rounded-lg cursor-pointer mb-5
          border transition-all duration-150
          ${form.studyIdConfirmed ? "bg-warning/5 border-warning/20" : "border-input-border"}
        `}
      >
        <div
          className={`
            w-5 h-5 rounded flex-shrink-0 mt-0.5
            border-2 flex items-center justify-center transition-all duration-150
            ${form.studyIdConfirmed ? "border-warning bg-warning" : "border-input-border"}
          `}
        >
          {form.studyIdConfirmed && (
            <span className="text-white text-[13px] font-bold">&#10003;</span>
          )}
        </div>
        <span className="text-sm text-text-dim leading-relaxed">
          I confirm this Study ID has NOT been previously randomized
        </span>
      </div>

      <Button disabled={!canProceed} onClick={onNext}>
        Proceed to Eligibility Screening &rarr;
      </Button>
    </Card>
  );
}
