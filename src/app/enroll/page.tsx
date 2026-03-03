"use client";

import { useEnrollment } from "@/hooks/useEnrollment";
import Header from "@/components/layout/Header";
import StepProgress from "@/components/enrollment/StepProgress";
import StepRegistration from "@/components/enrollment/StepRegistration";
import StepEligibility from "@/components/enrollment/StepEligibility";
import StepRandomization from "@/components/enrollment/StepRandomization";
import StepAllocation from "@/components/enrollment/StepAllocation";
import StepComplete from "@/components/enrollment/StepComplete";

export default function EnrollPage() {
  const { step, form, setStep, updateForm, reset } = useEnrollment();

  return (
    <div className="min-h-screen">
      <Header user={null} />
      <main className="max-w-[900px] mx-auto py-8 px-6">
        <StepProgress current={step} total={5} />

        {step === 0 && (
          <StepRegistration
            form={form}
            updateForm={updateForm}
            onNext={() => setStep(1)}
          />
        )}

        {step === 1 && (
          <StepEligibility
            form={form}
            updateForm={updateForm}
            onNext={() => setStep(2)}
            onBack={() => setStep(0)}
          />
        )}

        {step === 2 && (
          <StepRandomization
            form={form}
            updateForm={updateForm}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}

        {step === 3 && (
          <StepAllocation
            form={form}
            updateForm={updateForm}
            onComplete={() => setStep(4)}
          />
        )}

        {step === 4 && <StepComplete form={form} onReset={reset} />}
      </main>
    </div>
  );
}
