"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import type { EnrollmentFormData } from "@/lib/types";

interface StepRandomizationProps {
  form: EnrollmentFormData;
  updateForm: (updates: Partial<EnrollmentFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function StepRandomization({
  form,
  updateForm,
  onNext,
  onBack,
}: StepRandomizationProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRandomize = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/randomize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ site: form.site }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Randomization failed");
      }

      const data = await res.json();
      updateForm({
        allocation: data.allocation,
        internalId: data.internalId,
      });
      onNext();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Randomization failed");
    }
    setLoading(false);
  };

  return (
    <Card
      title="Subject Randomization"
      subtitle="Block randomization will be performed with allocation concealment. This action is irreversible."
    >
      <div className="p-5 bg-warning/5 border border-warning/15 rounded-lg mb-5">
        <p className="text-[13px] text-warning font-semibold mb-1">
          Confirm before proceeding
        </p>
        <p className="text-[13px] text-text-dim">
          Site: <strong className="text-text">{form.site}</strong> &middot;
          Researcher:{" "}
          <strong className="text-text">{form.researcherName}</strong> &middot;
          Study ID: <strong className="text-text">{form.studyId}</strong> &middot;
          MRN: <strong className="text-text">{form.mrn}</strong> &middot;
          Attending: <strong className="text-text">{form.icuAttending}</strong>
        </p>
      </div>

      {error && (
        <div className="p-3.5 bg-danger/5 border border-danger/20 rounded-lg mb-4">
          <p className="text-[13px] text-danger">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="secondary" onClick={onBack}>
          &larr; Back
        </Button>
        <Button onClick={handleRandomize} loading={loading}>
          Randomize Subject
        </Button>
      </div>
    </Card>
  );
}
