export const SITES = ["MetroWest Medical Center", "St. Vincent Hospital"] as const;

export const SITE_PREFIXES: Record<string, string> = {
  "MetroWest Medical Center": "MW",
  "St. Vincent Hospital": "SV",
};

export const ICU_ATTENDINGS = [
  "Dr. Silverman",
  "Dr. Konter",
  "Dr. Deshpande",
  "Dr. Markowitz",
  "Dr. Somers",
  "Dr. Rishikof",
] as const;

export const BLOCK_SIZES = [4, 6, 8] as const;

export const INCLUSION_CRITERIA = [
  {
    id: "age",
    label: "Age > 18 y/o",
    required: true,
  },
  {
    id: "admission",
    label:
      "Direct admission from ED to MICU or floor Medicine/Surgical transfers to MICU",
    required: true,
  },
  {
    id: "stemi",
    label: "Cath lab STEMI patients can be included",
    required: true,
  },
] as const;

export const EXCLUSION_CRITERIA = [
  {
    id: "transfer_outside",
    label:
      "Transfers to the MICU from outside hospitals or operating room or PACU",
    excludes: true,
  },
  {
    id: "age_under_18",
    label: "Age < 18 y/o",
    excludes: true,
  },
  {
    id: "incomplete_data",
    label: "Incomplete clinical information and missing data",
    excludes: true,
  },
  {
    id: "postpartum_pregnant_prisoners",
    label: "Postpartum and pregnant women and prisoners",
    excludes: true,
  },
] as const;

// Google Sheets tab names
export const SHEET_TABS = {
  SUBJECTS: "Subjects",
  LLM_INTERACTIONS: "LLM_Interactions",
  POST_ENROLLMENT_SURVEYS: "Post_Enrollment_Surveys",
  RANDOMIZATION_STATE: "Randomization_State",
  USERS: "Users",
} as const;

// Sheet column headers
export const SUBJECT_HEADERS = [
  "Study ID",
  "MRN",
  "Site",
  "Allocation",
  "ICU Attending",
  "Researcher Name",
  "Researcher Email",
  "Enrollment Date",
  "H&P Submitted",
  "LLM Queried",
  "LLM Model",
];

export const LLM_INTERACTION_HEADERS = [
  "Study ID",
  "H&P Text",
  "LLM Model",
  "LLM Response",
  "Timestamp",
  "Response Time Ms",
];

export const SURVEY_HEADERS = [
  "Study ID",
  "Survey Responses",
  "Timestamp",
];

export const RANDOMIZATION_HEADERS = [
  "Site",
  "Remaining Allocations",
  "Next Study ID",
  "Last Updated",
];

export const USER_HEADERS = [
  "Username",
  "Password Hash",
  "Role",
  "Display Name",
  "Created At",
];

export const LLM_MODEL = "claude-sonnet-4-20250514";
export const LLM_MAX_TOKENS = 16384;

export const LLM_MODELS = [
  { id: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro (Google)", provider: "gemini" as const, maxTokens: 16384 },
  { id: "gpt-5.2", label: "GPT-5.2 (OpenAI)", provider: "openai" as const, maxTokens: 16384 },
];

export const DEFAULT_LLM_MODEL = "gpt-5.2";
