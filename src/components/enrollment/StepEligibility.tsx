"use client";

import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Tag from "@/components/ui/Tag";
import CheckItem from "./CheckItem";
import { INCLUSION_CRITERIA, EXCLUSION_CRITERIA } from "@/lib/constants";
import type { EnrollmentFormData, EligibilityResult } from "@/lib/types";

interface StepEligibilityProps {
  form: EnrollmentFormData;
  updateForm: (updates: Partial<EnrollmentFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function StepEligibility({
  form,
  updateForm,
  onNext,
  onBack,
}: StepEligibilityProps) {
  const toggleInclusion = (id: string) => {
    updateForm({
      inclusionChecks: {
        ...form.inclusionChecks,
        [id]: !form.inclusionChecks[id],
      },
      eligibilityResult: null,
    });
  };

  const toggleExclusion = (id: string) => {
    updateForm({
      exclusionChecks: {
        ...form.exclusionChecks,
        [id]: !form.exclusionChecks[id],
      },
      eligibilityResult: null,
    });
  };

  const checkEligibility = () => {
    const allIncluded = INCLUSION_CRITERIA.every(
      (item) => form.inclusionChecks[item.id]
    );
    const anyExcluded = EXCLUSION_CRITERIA.some(
      (item) => form.exclusionChecks[item.id]
    );

    let result: EligibilityResult;
    if (!allIncluded) {
      result = {
        eligible: false,
        reason:
          "Not all inclusion criteria are met. All inclusion criteria must be satisfied.",
      };
    } else if (anyExcluded) {
      result = {
        eligible: false,
        reason:
          "One or more exclusion criteria are present. This patient is not eligible for enrollment.",
      };
    } else {
      result = {
        eligible: true,
        reason:
          "Patient meets all inclusion criteria and no exclusion criteria. Eligible for randomization.",
      };
    }
    updateForm({ eligibilityResult: result });
  };

  return (
    <Card
      title="Eligibility Screening"
      subtitle="Verify inclusion and exclusion criteria for the patient."
    >
      <h3 className="text-sm font-bold text-success mb-3 tracking-wider uppercase">
        Inclusion Criteria (all must be met)
      </h3>
      {INCLUSION_CRITERIA.map((item) => (
        <CheckItem
          key={item.id}
          id={item.id}
          label={item.label}
          checked={!!form.inclusionChecks[item.id]}
          onChange={toggleInclusion}
          type="inclusion"
        />
      ))}

      <div className="border-t border-card-border my-6" />

      <h3 className="text-sm font-bold text-danger mb-3 tracking-wider uppercase">
        Exclusion Criteria (none must be present)
      </h3>
      {EXCLUSION_CRITERIA.map((item) => (
        <CheckItem
          key={item.id}
          id={item.id}
          label={item.label}
          checked={!!form.exclusionChecks[item.id]}
          onChange={toggleExclusion}
          type="exclusion"
        />
      ))}

      <div className="border-t border-card-border my-6" />

      {form.eligibilityResult && (
        <div
          className={`p-4 rounded-lg mb-4 border ${
            form.eligibilityResult.eligible
              ? "bg-success/5 border-success/20"
              : "bg-danger/5 border-danger/20"
          }`}
        >
          <Tag color={form.eligibilityResult.eligible ? "success" : "danger"}>
            {form.eligibilityResult.eligible ? "ELIGIBLE" : "NOT ELIGIBLE"}
          </Tag>
          <p className="text-[13px] text-text-dim mt-2">
            {form.eligibilityResult.reason}
          </p>
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="secondary" onClick={onBack}>
          &larr; Back
        </Button>
        <Button onClick={checkEligibility}>Check Eligibility</Button>
        {form.eligibilityResult?.eligible && (
          <Button variant="success" onClick={onNext}>
            Proceed to Randomization &rarr;
          </Button>
        )}
      </div>
    </Card>
  );
}
