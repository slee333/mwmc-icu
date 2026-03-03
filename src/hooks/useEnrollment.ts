"use client";

import { useReducer, useCallback } from "react";
import type { EnrollmentFormData, EnrollmentStep } from "@/lib/types";
import { DEFAULT_LLM_MODEL } from "@/lib/constants";

interface EnrollmentState {
  step: EnrollmentStep;
  form: EnrollmentFormData;
}

type EnrollmentAction =
  | { type: "SET_STEP"; step: EnrollmentStep }
  | { type: "UPDATE_FORM"; updates: Partial<EnrollmentFormData> }
  | { type: "RESET" };

const initialForm: EnrollmentFormData = {
  site: "",
  researcherName: "",
  researcherEmail: "",
  studyId: "",
  studyIdConfirmed: false,
  mrn: "",
  icuAttending: "",
  inclusionChecks: {},
  exclusionChecks: {},
  eligibilityResult: null,
  allocation: null,
  internalId: "",
  hpText: "",
  llmModel: DEFAULT_LLM_MODEL,
  llmResult: "",
  llmError: "",
  llmLoading: false,
};

const initialState: EnrollmentState = {
  step: 0,
  form: initialForm,
};

function enrollmentReducer(
  state: EnrollmentState,
  action: EnrollmentAction
): EnrollmentState {
  switch (action.type) {
    case "SET_STEP":
      return { ...state, step: action.step };
    case "UPDATE_FORM":
      return { ...state, form: { ...state.form, ...action.updates } };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

export function useEnrollment() {
  const [state, dispatch] = useReducer(enrollmentReducer, initialState);

  const setStep = useCallback(
    (step: EnrollmentStep) => dispatch({ type: "SET_STEP", step }),
    []
  );

  const updateForm = useCallback(
    (updates: Partial<EnrollmentFormData>) =>
      dispatch({ type: "UPDATE_FORM", updates }),
    []
  );

  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  return {
    step: state.step,
    form: state.form,
    setStep,
    updateForm,
    reset,
  };
}
