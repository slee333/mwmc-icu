"use client";

import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import type { EnrollmentFormData } from "@/lib/types";

interface StepCompleteProps {
  form: EnrollmentFormData;
  onReset: () => void;
}

export default function StepComplete({ form, onReset }: StepCompleteProps) {
  return (
    <Card>
      <div className="text-center py-5">
        <div className="text-5xl mb-3">&#10003;</div>
        <h2 className="text-[22px] font-bold tracking-tight text-text text-center">
          Enrollment Complete
        </h2>
        <p className="text-[13px] text-text-dim text-center max-w-[500px] mx-auto mt-2 mb-6">
          Subject{" "}
          <strong className="text-accent">{form.studyId}</strong> has been
          enrolled in the{" "}
          <strong
            className={
              form.allocation === "Intervention"
                ? "text-success"
                : "text-text-dim"
            }
          >
            {form.allocation}
          </strong>{" "}
          arm. A 24-hour follow-up survey reminder will be sent to{" "}
          <strong className="text-text">{form.researcherEmail}</strong>.
        </p>
        <Button onClick={onReset}>Enroll Another Subject</Button>
      </div>
    </Card>
  );
}
