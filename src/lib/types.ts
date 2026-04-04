export interface Subject {
  studyId: string;
  mrn: string;
  site: string;
  allocation: "Control" | "Intervention";
  icuAttending: string;
  researcherName: string;
  researcherEmail: string;
  enrollmentDate: string;
  hpSubmitted: boolean;
  llmQueried: boolean;
  llmModel: string;
}

export interface LlmInteraction {
  studyId: string;
  hpText: string;
  llmModel: string;
  llmResponse: string;
  timestamp: string;
  responseTimeMs: number;
}

export interface PostEnrollmentSurvey {
  studyId: string;
  surveyResponses: string; // JSON
  timestamp: string;
}

export interface RandomizationState {
  site: string;
  remainingAllocations: string; // JSON array
  nextStudyId: number;
  lastUpdated: string;
}

export interface User {
  username: string;
  passwordHash: string;
  role: "researcher" | "admin";
  displayName: string;
  createdAt: string;
}

export interface JWTPayload {
  username: string;
  role: "researcher" | "admin";
  displayName: string;
}

export interface EnrollmentFormData {
  site: string;
  researcherName: string;
  researcherEmail: string;
  icuAttending: string;
  mrn: string;
  inclusionChecks: Record<string, boolean>;
  exclusionChecks: Record<string, boolean>;
  eligibilityResult: EligibilityResult | null;
  allocation: "Control" | "Intervention" | null;
  studyId: string;
  hpText: string;
  llmModel: string;
  llmResult: string;
  llmError: string;
  llmLoading: boolean;
}

export interface EligibilityResult {
  eligible: boolean;
  reason: string;
}

export type EnrollmentStep = 0 | 1 | 2 | 3 | 4;
