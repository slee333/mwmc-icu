"use client";

import { useState, useEffect, useRef } from "react";
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
  const [mrn, setMrn] = useState("");
  const [mrnChecking, setMrnChecking] = useState(false);
  const [mrnDuplicate, setMrnDuplicate] = useState(false);
  const [mrnChecked, setMrnChecked] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const siteOptions = SITES.map((s) => ({ value: s, label: s }));
  const attendingOptions = ICU_ATTENDINGS.map((a) => ({
    value: a,
    label: a,
  }));

  useEffect(() => {
    if (!mrn.trim()) {
      updateForm({ mrn: "" });
      setMrnDuplicate(false);
      setMrnChecked(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      updateForm({ mrn: mrn.trim() });

      setMrnChecking(true);
      try {
        const res = await fetch("/api/subjects/check-mrn", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mrn: mrn.trim() }),
        });
        const data = await res.json();
        setMrnDuplicate(data.exists);
      } catch {
        setMrnDuplicate(false);
      }
      setMrnChecking(false);
      setMrnChecked(true);
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [mrn]); // eslint-disable-line react-hooks/exhaustive-deps

  const canProceed =
    form.site &&
    form.researcherName &&
    form.researcherEmail &&
    form.icuAttending &&
    form.mrn &&
    !mrnDuplicate &&
    !mrnChecking;

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

      <div className="mb-4">
        <Select
          label="ICU Attending"
          options={attendingOptions}
          placeholder="Select attending..."
          value={form.icuAttending}
          onChange={(e) => updateForm({ icuAttending: e.target.value })}
        />
      </div>

      <div className="border-t border-card-border my-5" />

      <div className="mb-4">
        <Input
          label="Patient MRN"
          value={mrn}
          onChange={(e) => setMrn(e.target.value)}
          placeholder="Enter patient MRN"
        />
        <p className="text-xs text-text-muted mt-1">
          MRN is stored as entered for study records.
        </p>
        {mrnChecking && (
          <p className="text-xs text-accent mt-1">Checking for duplicates...</p>
        )}
        {mrnDuplicate && (
          <p className="text-xs text-danger font-semibold mt-1">
            This patient has already been enrolled. Duplicate enrollment is not permitted.
          </p>
        )}
        {mrnChecked && !mrnDuplicate && !mrnChecking && mrn.trim() && (
          <p className="text-xs text-success mt-1">No duplicate found.</p>
        )}
      </div>

      <Button disabled={!canProceed} onClick={onNext}>
        Proceed to Eligibility Screening &rarr;
      </Button>
    </Card>
  );
}
