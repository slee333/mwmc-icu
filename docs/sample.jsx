import { useState, useEffect, useCallback, useRef } from "react";

// ─── CONFIG ──────────────────────────────────────────────────────────
const BLOCK_SIZES = [4, 6, 8];
const SITES = ["MetroWest Medical Center", "St. Vincent Hospital"];

const SYSTEM_PROMPT = `You are a clinical decision-support AI assisting ICU physicians managing patients with Acute Hypoxic Respiratory Failure (AHRF). Based on the provided de-identified History and Physical examination, generate the following structured output:

1. **TOP 5 DIFFERENTIAL DIAGNOSES** — Rank-ordered by estimated probability, with a brief clinical rationale for each.

2. **5-POINT THERAPEUTIC PLAN** — Evidence-based, addressing the primary suspected diagnosis and immediate management priorities.

3. **AIRWAY & VENTILATOR MANAGEMENT** — Recommendations regarding intubation indications and suggested initial ventilator parameters (mode, TV, RR, PEEP, FiO2) if applicable.

4. **RISK STRATIFICATION** — Estimated risk of clinical deterioration within 24–48 hours (Low / Moderate / High), with specific clinical parameters or triggers that should prompt escalation of care.

5. **CRITICAL ALERTS** — Any immediate safety concerns or time-sensitive interventions warranting urgent attention.

Be specific, evidence-based, and structured. Do not provide generic advice. Reference relevant clinical guidelines (e.g., ARDSNet, Surviving Sepsis Campaign) where applicable.`;

// ─── STORAGE HELPERS ─────────────────────────────────────────────────
async function loadStudyData() {
  try {
    const result = await window.storage.get("icu-llm-study-data");
    return result
      ? JSON.parse(result.value)
      : { subjects: [], nextId: 1, randomizationLog: [], blockState: {} };
  } catch {
    return { subjects: [], nextId: 1, randomizationLog: [], blockState: {} };
  }
}

async function saveStudyData(data) {
  try {
    await window.storage.set("icu-llm-study-data", JSON.stringify(data));
  } catch (e) {
    console.error("Storage save failed:", e);
  }
}

// ─── RANDOMIZATION ENGINE ────────────────────────────────────────────
function generateBlock(size) {
  const half = size / 2;
  const assignments = [
    ...Array(half).fill("Control"),
    ...Array(half).fill("Intervention"),
  ];
  for (let i = assignments.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [assignments[i], assignments[j]] = [assignments[j], assignments[i]];
  }
  return assignments;
}

function getNextAllocation(blockState, site) {
  const key = site;
  let state = blockState[key] || { remaining: [] };
  if (state.remaining.length === 0) {
    const size = BLOCK_SIZES[Math.floor(Math.random() * BLOCK_SIZES.length)];
    state.remaining = generateBlock(size);
  }
  const allocation = state.remaining.shift();
  blockState[key] = state;
  return { allocation, blockState };
}

// ─── STYLES ──────────────────────────────────────────────────────────
const theme = {
  bg: "#0B1120",
  card: "#111827",
  cardBorder: "#1E293B",
  accent: "#3B82F6",
  accentDim: "#1E3A5F",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  text: "#E2E8F0",
  textDim: "#94A3B8",
  textMuted: "#64748B",
  input: "#1E293B",
  inputBorder: "#334155",
};

const baseStyles = {
  container: {
    minHeight: "100vh",
    background: `linear-gradient(135deg, ${theme.bg} 0%, #0F172A 50%, #111827 100%)`,
    color: theme.text,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    padding: "0",
  },
  header: {
    background: "linear-gradient(90deg, #1E293B 0%, #0F172A 100%)",
    borderBottom: `1px solid ${theme.cardBorder}`,
    padding: "16px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: "16px",
    fontWeight: 700,
    letterSpacing: "-0.02em",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  headerBadge: {
    fontSize: "10px",
    fontWeight: 600,
    background: theme.accentDim,
    color: theme.accent,
    padding: "3px 8px",
    borderRadius: "4px",
    letterSpacing: "0.05em",
    textTransform: "uppercase",
  },
  main: { maxWidth: "900px", margin: "0 auto", padding: "32px 24px" },
  card: {
    background: theme.card,
    border: `1px solid ${theme.cardBorder}`,
    borderRadius: "12px",
    padding: "28px",
    marginBottom: "20px",
  },
  cardTitle: {
    fontSize: "18px",
    fontWeight: 700,
    marginBottom: "4px",
    letterSpacing: "-0.01em",
  },
  cardSub: { fontSize: "13px", color: theme.textDim, marginBottom: "20px" },
  label: {
    display: "block",
    fontSize: "13px",
    fontWeight: 600,
    color: theme.textDim,
    marginBottom: "6px",
    letterSpacing: "0.02em",
  },
  input: {
    width: "100%",
    padding: "10px 14px",
    background: theme.input,
    border: `1px solid ${theme.inputBorder}`,
    borderRadius: "8px",
    color: theme.text,
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.15s",
  },
  textarea: {
    width: "100%",
    minHeight: "280px",
    padding: "14px",
    background: theme.input,
    border: `1px solid ${theme.inputBorder}`,
    borderRadius: "8px",
    color: theme.text,
    fontSize: "13px",
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    lineHeight: 1.7,
    resize: "vertical",
    outline: "none",
    boxSizing: "border-box",
  },
  select: {
    width: "100%",
    padding: "10px 14px",
    background: theme.input,
    border: `1px solid ${theme.inputBorder}`,
    borderRadius: "8px",
    color: theme.text,
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
    appearance: "none",
  },
  btnPrimary: {
    padding: "12px 28px",
    background: `linear-gradient(135deg, ${theme.accent}, #2563EB)`,
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    letterSpacing: "0.01em",
    transition: "all 0.15s",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
  },
  btnSecondary: {
    padding: "10px 20px",
    background: "transparent",
    color: theme.textDim,
    border: `1px solid ${theme.inputBorder}`,
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.15s",
  },
  btnDanger: {
    padding: "10px 20px",
    background: "transparent",
    color: theme.danger,
    border: `1px solid ${theme.danger}33`,
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: 500,
    cursor: "pointer",
  },
  stepIndicator: { display: "flex", gap: "4px", marginBottom: "28px" },
  stepDot: (active, done) => ({
    height: "4px",
    flex: 1,
    borderRadius: "2px",
    background: done
      ? theme.success
      : active
        ? theme.accent
        : theme.inputBorder,
    transition: "background 0.3s",
  }),
  tag: (color) => ({
    display: "inline-block",
    fontSize: "11px",
    fontWeight: 700,
    padding: "4px 10px",
    borderRadius: "6px",
    background: `${color}18`,
    color,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
  }),
  row: { display: "flex", gap: "16px", marginBottom: "16px" },
  col: { flex: 1 },
  divider: { borderTop: `1px solid ${theme.cardBorder}`, margin: "20px 0" },
  resultBlock: {
    background: "#0B1120",
    border: `1px solid ${theme.cardBorder}`,
    borderRadius: "8px",
    padding: "20px",
    marginTop: "16px",
    whiteSpace: "pre-wrap",
    fontSize: "13px",
    lineHeight: 1.8,
    fontFamily: "'Inter', sans-serif",
    maxHeight: "500px",
    overflowY: "auto",
  },
};

// ─── QUESTIONNAIRE DEFINITIONS ───────────────────────────────────────
const INCLUSION = [
  { id: "age", label: "Patient is ≥18 years of age", required: true },
  {
    id: "admission",
    label:
      "Admitted to ICU from the Emergency Department with a diagnosis of Acute Hypoxic Respiratory Failure",
    required: true,
  },
  { id: "pf_ratio", label: "PaO₂/FiO₂ ratio ≤300 mmHg", required: true },
  {
    id: "o2_support",
    label: "Requires supplemental oxygen or ventilatory support",
    required: true,
  },
];
const EXCLUSION = [
  {
    id: "dnr_dni",
    label: "Presence of DNI or DNR orders upon admission",
    excludes: true,
  },
  {
    id: "mortality_48h",
    label: "Expected mortality within 48 hours of admission",
    excludes: true,
  },
  { id: "pregnant", label: "Patient is pregnant", excludes: true },
  {
    id: "transfer_24h",
    label: "Transfer from outside hospital with >24 hours prior treatment",
    excludes: true,
  },
  { id: "prisoner", label: "Prisoner or ward of the state", excludes: true },
  {
    id: "prior_enrollment",
    label: "Previously enrolled in this study",
    excludes: true,
  },
];

// ─── COMPONENTS ──────────────────────────────────────────────────────
const CheckItem = ({ item, checked, onChange, type }) => (
  <div
    onClick={() => onChange(item.id)}
    style={{
      display: "flex",
      alignItems: "flex-start",
      gap: "12px",
      padding: "12px 16px",
      background: checked
        ? type === "inclusion"
          ? `${theme.success}08`
          : `${theme.danger}08`
        : "transparent",
      border: `1px solid ${checked ? (type === "inclusion" ? `${theme.success}30` : `${theme.danger}30`) : theme.inputBorder}`,
      borderRadius: "8px",
      cursor: "pointer",
      marginBottom: "8px",
      transition: "all 0.15s",
    }}
  >
    <div
      style={{
        width: "20px",
        height: "20px",
        borderRadius: "4px",
        border: `2px solid ${checked ? (type === "inclusion" ? theme.success : theme.danger) : theme.inputBorder}`,
        background: checked
          ? type === "inclusion"
            ? theme.success
            : theme.danger
          : "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        marginTop: "1px",
        transition: "all 0.15s",
      }}
    >
      {checked && (
        <span style={{ color: "#fff", fontSize: "13px", fontWeight: 700 }}>
          ✓
        </span>
      )}
    </div>
    <span
      style={{
        fontSize: "14px",
        lineHeight: 1.5,
        color: checked ? theme.text : theme.textDim,
      }}
    >
      {item.label}
    </span>
  </div>
);

const StepProgress = ({ current, total }) => (
  <div style={baseStyles.stepIndicator}>
    {Array.from({ length: total }, (_, i) => (
      <div key={i} style={baseStyles.stepDot(i === current, i < current)} />
    ))}
  </div>
);

// ─── MAIN APP ────────────────────────────────────────────────────────
export default function App() {
  const [step, setStep] = useState(0);
  const [studyData, setStudyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("enroll"); // enroll | log | export

  // Form state
  const [site, setSite] = useState("");
  const [researcherEmail, setResearcherEmail] = useState("");
  const [researcherName, setResearcherName] = useState("");
  const [inclusionChecks, setInclusionChecks] = useState({});
  const [exclusionChecks, setExclusionChecks] = useState({});
  const [eligibilityResult, setEligibilityResult] = useState(null);
  const [allocation, setAllocation] = useState(null);
  const [subjectId, setSubjectId] = useState("");
  const [hpText, setHpText] = useState("");
  const [llmLoading, setLlmLoading] = useState(false);
  const [llmResult, setLlmResult] = useState("");
  const [llmError, setLlmError] = useState("");
  const [copied, setCopied] = useState(false);
  const [sheetsUrl, setSheetsUrl] = useState("");
  const [sheetsUrlSaved, setSheetsUrlSaved] = useState(false);

  // Load data on mount
  useEffect(() => {
    (async () => {
      const data = await loadStudyData();
      // load sheets URL
      try {
        const r = await window.storage.get("icu-llm-sheets-url");
        if (r) setSheetsUrl(r.value);
      } catch {}
      setStudyData(data);
      setLoading(false);
    })();
  }, []);

  // ─── ELIGIBILITY CHECK ───────────────────────────────────────────
  const checkEligibility = useCallback(() => {
    const allIncluded = INCLUSION.every((item) => inclusionChecks[item.id]);
    const anyExcluded = EXCLUSION.some((item) => exclusionChecks[item.id]);
    if (!allIncluded)
      return setEligibilityResult({
        eligible: false,
        reason:
          "Not all inclusion criteria are met. All four inclusion criteria must be satisfied.",
      });
    if (anyExcluded)
      return setEligibilityResult({
        eligible: false,
        reason:
          "One or more exclusion criteria are present. This patient is not eligible for enrollment.",
      });
    setEligibilityResult({
      eligible: true,
      reason:
        "Patient meets all inclusion criteria and no exclusion criteria. Eligible for randomization.",
    });
  }, [inclusionChecks, exclusionChecks]);

  // ─── RANDOMIZE ───────────────────────────────────────────────────
  const performRandomization = useCallback(async () => {
    if (!studyData) return;
    const blockState = { ...studyData.blockState };
    const { allocation: alloc, blockState: newBlockState } = getNextAllocation(
      blockState,
      site,
    );
    const sitePrefix = site === SITES[0] ? "MW" : "SV";
    const sid = `${sitePrefix}-${String(studyData.nextId).padStart(4, "0")}`;
    setAllocation(alloc);
    setSubjectId(sid);
    const updated = {
      ...studyData,
      nextId: studyData.nextId + 1,
      blockState: newBlockState,
    };
    setStudyData(updated);
    await saveStudyData(updated);
    setStep(3);
  }, [studyData, site]);

  // ─── LLM QUERY ──────────────────────────────────────────────────
  const queryLLM = useCallback(async () => {
    if (!hpText.trim()) return;
    setLlmLoading(true);
    setLlmError("");
    setLlmResult("");
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: "user",
              content: `Here is the de-identified History and Physical for an ICU patient with Acute Hypoxic Respiratory Failure:\n\n${hpText}`,
            },
          ],
        }),
      });
      const data = await response.json();
      if (data.content && data.content.length > 0) {
        setLlmResult(data.content.map((c) => c.text || "").join("\n"));
      } else if (data.error) {
        setLlmError(data.error.message || "API returned an error.");
      }
    } catch (err) {
      setLlmError(`Request failed: ${err.message}`);
    }
    setLlmLoading(false);
  }, [hpText]);

  // ─── SAVE SUBJECT RECORD ────────────────────────────────────────
  const saveSubjectRecord = useCallback(async () => {
    if (!studyData) return;
    const record = {
      subjectId,
      site,
      allocation,
      researcherEmail,
      researcherName,
      enrollmentDate: new Date().toISOString(),
      hpTextLength: hpText.length,
      llmQueried: !!llmResult,
    };
    const updated = { ...studyData, subjects: [...studyData.subjects, record] };
    setStudyData(updated);
    await saveStudyData(updated);

    // Try to send to Google Sheets webhook if configured
    if (sheetsUrl) {
      try {
        // We'll just note it's configured; actual webhook call would go here
        console.log("Google Sheets webhook configured:", sheetsUrl);
      } catch {}
    }
    setStep(5);
  }, [
    studyData,
    subjectId,
    site,
    allocation,
    researcherEmail,
    researcherName,
    hpText,
    llmResult,
    sheetsUrl,
  ]);

  // ─── RESET ───────────────────────────────────────────────────────
  const resetForm = () => {
    setStep(0);
    setSite("");
    setResearcherEmail("");
    setResearcherName("");
    setInclusionChecks({});
    setExclusionChecks({});
    setEligibilityResult(null);
    setAllocation(null);
    setSubjectId("");
    setHpText("");
    setLlmResult("");
    setLlmError("");
  };

  // ─── EXPORT CSV ──────────────────────────────────────────────────
  const exportCSV = () => {
    if (!studyData?.subjects.length) return;
    const headers = [
      "Subject ID",
      "Site",
      "Allocation",
      "Researcher",
      "Email",
      "Enrollment Date",
      "LLM Queried",
    ];
    const rows = studyData.subjects.map((s) => [
      s.subjectId,
      s.site,
      s.allocation,
      s.researcherName,
      s.researcherEmail,
      s.enrollmentDate,
      s.llmQueried,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `icu_llm_study_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyResults = () => {
    navigator.clipboard.writeText(llmResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading)
    return (
      <div
        style={{
          ...baseStyles.container,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p style={{ color: theme.textDim }}>Loading study data...</p>
      </div>
    );

  // ═══════════════════════════════════════════════════════════════════
  return (
    <div style={baseStyles.container}>
      {/* HEADER */}
      <div style={baseStyles.header}>
        <div style={baseStyles.headerTitle}>
          <span style={{ fontSize: "20px" }}>⚕</span>
          <span>ICU LLM Study Platform</span>
          <span style={baseStyles.headerBadge}>Research Use Only</span>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {["enroll", "log", "export"].map((v) => (
            <button
              key={v}
              onClick={() => {
                setView(v);
                if (v === "enroll") resetForm();
              }}
              style={{
                ...baseStyles.btnSecondary,
                ...(view === v
                  ? { borderColor: theme.accent, color: theme.accent }
                  : {}),
              }}
            >
              {v === "enroll"
                ? "New Enrollment"
                : v === "log"
                  ? `Log (${studyData?.subjects.length || 0})`
                  : "Export"}
            </button>
          ))}
        </div>
      </div>

      <div style={baseStyles.main}>
        {/* ─── ENROLLMENT VIEW ─── */}
        {view === "enroll" && (
          <>
            <StepProgress current={step} total={6} />

            {/* STEP 0: Site & Researcher Info */}
            {step === 0 && (
              <div style={baseStyles.card}>
                <h2 style={baseStyles.cardTitle}>Study Registration</h2>
                <p style={baseStyles.cardSub}>
                  Enter study site and researcher information to begin
                  enrollment.
                </p>
                <div style={baseStyles.row}>
                  <div style={baseStyles.col}>
                    <label style={baseStyles.label}>Study Site</label>
                    <select
                      value={site}
                      onChange={(e) => setSite(e.target.value)}
                      style={baseStyles.select}
                    >
                      <option value="">Select site...</option>
                      {SITES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div style={baseStyles.row}>
                  <div style={baseStyles.col}>
                    <label style={baseStyles.label}>Researcher Name</label>
                    <input
                      value={researcherName}
                      onChange={(e) => setResearcherName(e.target.value)}
                      placeholder="Dr. Jane Smith"
                      style={baseStyles.input}
                    />
                  </div>
                  <div style={baseStyles.col}>
                    <label style={baseStyles.label}>Researcher Email</label>
                    <input
                      value={researcherEmail}
                      onChange={(e) => setResearcherEmail(e.target.value)}
                      placeholder="researcher@hospital.org"
                      type="email"
                      style={baseStyles.input}
                    />
                  </div>
                </div>
                <p
                  style={{
                    fontSize: "12px",
                    color: theme.textMuted,
                    marginBottom: "20px",
                  }}
                >
                  Email is used to send the 24-hour post-enrollment follow-up
                  survey link.
                </p>
                <button
                  disabled={!site || !researcherEmail || !researcherName}
                  onClick={() => setStep(1)}
                  style={{
                    ...baseStyles.btnPrimary,
                    opacity:
                      !site || !researcherEmail || !researcherName ? 0.4 : 1,
                  }}
                >
                  Proceed to Eligibility Screening →
                </button>
              </div>
            )}

            {/* STEP 1: Eligibility Screening */}
            {step === 1 && (
              <div style={baseStyles.card}>
                <h2 style={baseStyles.cardTitle}>Eligibility Screening</h2>
                <p style={baseStyles.cardSub}>
                  Verify inclusion and exclusion criteria for the patient.
                </p>

                <h3
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    color: theme.success,
                    marginBottom: "12px",
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                  }}
                >
                  Inclusion Criteria (all must be met)
                </h3>
                {INCLUSION.map((item) => (
                  <CheckItem
                    key={item.id}
                    item={item}
                    checked={!!inclusionChecks[item.id]}
                    onChange={(id) =>
                      setInclusionChecks((p) => ({ ...p, [id]: !p[id] }))
                    }
                    type="inclusion"
                  />
                ))}

                <div style={{ ...baseStyles.divider, margin: "24px 0" }} />

                <h3
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    color: theme.danger,
                    marginBottom: "12px",
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                  }}
                >
                  Exclusion Criteria (none must be present)
                </h3>
                {EXCLUSION.map((item) => (
                  <CheckItem
                    key={item.id}
                    item={item}
                    checked={!!exclusionChecks[item.id]}
                    onChange={(id) =>
                      setExclusionChecks((p) => ({ ...p, [id]: !p[id] }))
                    }
                    type="exclusion"
                  />
                ))}

                <div style={{ ...baseStyles.divider, margin: "24px 0" }} />

                {eligibilityResult && (
                  <div
                    style={{
                      padding: "16px",
                      borderRadius: "8px",
                      marginBottom: "16px",
                      background: eligibilityResult.eligible
                        ? `${theme.success}10`
                        : `${theme.danger}10`,
                      border: `1px solid ${eligibilityResult.eligible ? theme.success : theme.danger}30`,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "4px",
                      }}
                    >
                      <span
                        style={baseStyles.tag(
                          eligibilityResult.eligible
                            ? theme.success
                            : theme.danger,
                        )}
                      >
                        {eligibilityResult.eligible
                          ? "ELIGIBLE"
                          : "NOT ELIGIBLE"}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: "13px",
                        color: theme.textDim,
                        marginTop: "8px",
                      }}
                    >
                      {eligibilityResult.reason}
                    </p>
                  </div>
                )}

                <div style={{ display: "flex", gap: "12px" }}>
                  <button
                    onClick={() => setStep(0)}
                    style={baseStyles.btnSecondary}
                  >
                    ← Back
                  </button>
                  <button
                    onClick={checkEligibility}
                    style={baseStyles.btnPrimary}
                  >
                    Check Eligibility
                  </button>
                  {eligibilityResult?.eligible && (
                    <button
                      onClick={() => setStep(2)}
                      style={{
                        ...baseStyles.btnPrimary,
                        background: `linear-gradient(135deg, ${theme.success}, #059669)`,
                      }}
                    >
                      Proceed to Randomization →
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* STEP 2: Randomization */}
            {step === 2 && (
              <div style={baseStyles.card}>
                <h2 style={baseStyles.cardTitle}>Subject Randomization</h2>
                <p style={baseStyles.cardSub}>
                  Block randomization will be performed with allocation
                  concealment. This action is irreversible.
                </p>
                <div
                  style={{
                    padding: "20px",
                    background: `${theme.warning}08`,
                    border: `1px solid ${theme.warning}25`,
                    borderRadius: "8px",
                    marginBottom: "20px",
                  }}
                >
                  <p
                    style={{
                      fontSize: "13px",
                      color: theme.warning,
                      fontWeight: 600,
                      marginBottom: "4px",
                    }}
                  >
                    ⚠ Confirm before proceeding
                  </p>
                  <p style={{ fontSize: "13px", color: theme.textDim }}>
                    Site: <strong style={{ color: theme.text }}>{site}</strong>{" "}
                    · Researcher:{" "}
                    <strong style={{ color: theme.text }}>
                      {researcherName}
                    </strong>{" "}
                    · Subject ID will be:{" "}
                    <strong style={{ color: theme.text }}>
                      {site === SITES[0] ? "MW" : "SV"}-
                      {String(studyData.nextId).padStart(4, "0")}
                    </strong>
                  </p>
                </div>
                <div style={{ display: "flex", gap: "12px" }}>
                  <button
                    onClick={() => setStep(1)}
                    style={baseStyles.btnSecondary}
                  >
                    ← Back
                  </button>
                  <button
                    onClick={performRandomization}
                    style={baseStyles.btnPrimary}
                  >
                    🎲 Randomize Subject
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Allocation Result + H&P Entry */}
            {step === 3 && (
              <>
                <div style={baseStyles.card}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <div>
                      <h2 style={baseStyles.cardTitle}>
                        Randomization Complete
                      </h2>
                      <p style={baseStyles.cardSub}>
                        Subject has been assigned to a study arm.
                      </p>
                    </div>
                    <span
                      style={{
                        ...baseStyles.tag(
                          allocation === "Intervention"
                            ? theme.accent
                            : theme.textMuted,
                        ),
                        fontSize: "13px",
                        padding: "6px 14px",
                      }}
                    >
                      {allocation === "Intervention"
                        ? "🔬 INTERVENTION ARM"
                        : "📋 CONTROL ARM"}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "24px" }}>
                    <div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: theme.textMuted,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                        }}
                      >
                        Subject ID
                      </div>
                      <div
                        style={{
                          fontSize: "24px",
                          fontWeight: 800,
                          fontFamily: "'JetBrains Mono', monospace",
                          color: theme.accent,
                          marginTop: "2px",
                        }}
                      >
                        {subjectId}
                      </div>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: theme.textMuted,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                        }}
                      >
                        Allocation
                      </div>
                      <div
                        style={{
                          fontSize: "24px",
                          fontWeight: 800,
                          color:
                            allocation === "Intervention"
                              ? theme.success
                              : theme.textDim,
                          marginTop: "2px",
                        }}
                      >
                        {allocation}
                      </div>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: theme.textMuted,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                        }}
                      >
                        Site
                      </div>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: 600,
                          color: theme.text,
                          marginTop: "6px",
                        }}
                      >
                        {site}
                      </div>
                    </div>
                  </div>
                </div>

                {allocation === "Intervention" ? (
                  <div style={baseStyles.card}>
                    <h2 style={baseStyles.cardTitle}>
                      De-identified H&P Submission
                    </h2>
                    <p style={baseStyles.cardSub}>
                      Paste the de-identified History and Physical below. Ensure
                      all 18 HIPAA identifiers have been removed via
                      double-screening. The clinical team's preliminary
                      Assessment & Plan should be withheld.
                    </p>
                    <textarea
                      value={hpText}
                      onChange={(e) => setHpText(e.target.value)}
                      placeholder={
                        "Chief Complaint: 67-year-old [sex] presenting with...\n\nHPI: Patient presented to ED with acute onset dyspnea...\n\nPMH: HTN, DM2, COPD...\n\nVitals: T 38.2°C, HR 112, BP 95/62, RR 28, SpO2 84% on RA\n\nLabs: ABG pH 7.31, PaCO2 48, PaO2 55, HCO3 22, P/F ratio 183\n      WBC 18.2, Lactate 3.1, Procalcitonin 2.4\n\nImaging: CXR bilateral infiltrates R>L...\n\nAssessment: [WITHHELD]\nPlan: [WITHHELD]"
                      }
                      style={baseStyles.textarea}
                    />
                    <div
                      style={{
                        display: "flex",
                        gap: "12px",
                        marginTop: "16px",
                        alignItems: "center",
                      }}
                    >
                      <button
                        disabled={!hpText.trim() || llmLoading}
                        onClick={queryLLM}
                        style={{
                          ...baseStyles.btnPrimary,
                          opacity: !hpText.trim() || llmLoading ? 0.5 : 1,
                        }}
                      >
                        {llmLoading ? "⏳ Querying LLM..." : "🧠 Submit to LLM"}
                      </button>
                      <button
                        onClick={() => {
                          saveSubjectRecord();
                        }}
                        style={baseStyles.btnSecondary}
                      >
                        Skip LLM Query & Save Record →
                      </button>
                    </div>

                    {llmError && (
                      <div
                        style={{
                          padding: "14px",
                          background: `${theme.danger}10`,
                          border: `1px solid ${theme.danger}30`,
                          borderRadius: "8px",
                          marginTop: "16px",
                        }}
                      >
                        <p style={{ fontSize: "13px", color: theme.danger }}>
                          {llmError}
                        </p>
                      </div>
                    )}

                    {llmResult && (
                      <div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginTop: "20px",
                          }}
                        >
                          <h3
                            style={{
                              fontSize: "15px",
                              fontWeight: 700,
                              color: theme.success,
                            }}
                          >
                            ✓ LLM Output Generated
                          </h3>
                          <button
                            onClick={copyResults}
                            style={baseStyles.btnSecondary}
                          >
                            {copied ? "✓ Copied!" : "📋 Copy Results"}
                          </button>
                        </div>
                        <div style={baseStyles.resultBlock}>{llmResult}</div>
                        <div style={{ marginTop: "16px" }}>
                          <button
                            onClick={saveSubjectRecord}
                            style={{
                              ...baseStyles.btnPrimary,
                              background: `linear-gradient(135deg, ${theme.success}, #059669)`,
                            }}
                          >
                            Save Record & Complete Enrollment →
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={baseStyles.card}>
                    <h2 style={baseStyles.cardTitle}>
                      Control Arm — Standard Care
                    </h2>
                    <p style={baseStyles.cardSub}>
                      This subject has been randomized to the Control Arm. No
                      LLM query will be performed. Clinical care proceeds per
                      standard protocols.
                    </p>
                    <button
                      onClick={saveSubjectRecord}
                      style={{
                        ...baseStyles.btnPrimary,
                        background: `linear-gradient(135deg, ${theme.success}, #059669)`,
                      }}
                    >
                      Save Record & Complete Enrollment →
                    </button>
                  </div>
                )}
              </>
            )}

            {/* STEP 5: Complete */}
            {step === 5 && (
              <div style={baseStyles.card}>
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div style={{ fontSize: "48px", marginBottom: "12px" }}>
                    ✓
                  </div>
                  <h2
                    style={{
                      ...baseStyles.cardTitle,
                      fontSize: "22px",
                      textAlign: "center",
                    }}
                  >
                    Enrollment Complete
                  </h2>
                  <p
                    style={{
                      ...baseStyles.cardSub,
                      textAlign: "center",
                      maxWidth: "500px",
                      margin: "0 auto 24px",
                    }}
                  >
                    Subject{" "}
                    <strong style={{ color: theme.accent }}>{subjectId}</strong>{" "}
                    has been enrolled in the{" "}
                    <strong
                      style={{
                        color:
                          allocation === "Intervention"
                            ? theme.success
                            : theme.textDim,
                      }}
                    >
                      {allocation}
                    </strong>{" "}
                    arm. A 24-hour follow-up survey reminder will be sent to{" "}
                    <strong style={{ color: theme.text }}>
                      {researcherEmail}
                    </strong>
                    .
                  </p>
                  <button onClick={resetForm} style={baseStyles.btnPrimary}>
                    Enroll Another Subject
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ─── LOG VIEW ─── */}
        {view === "log" && (
          <div style={baseStyles.card}>
            <h2 style={baseStyles.cardTitle}>Enrollment Log</h2>
            <p style={baseStyles.cardSub}>
              All enrolled subjects across both study sites.
            </p>
            {!studyData?.subjects.length ? (
              <p
                style={{
                  color: theme.textMuted,
                  fontSize: "13px",
                  textAlign: "center",
                  padding: "40px 0",
                }}
              >
                No subjects enrolled yet.
              </p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "13px",
                  }}
                >
                  <thead>
                    <tr>
                      {["ID", "Site", "Arm", "Researcher", "Date", "LLM"].map(
                        (h) => (
                          <th
                            key={h}
                            style={{
                              textAlign: "left",
                              padding: "10px 12px",
                              borderBottom: `2px solid ${theme.cardBorder}`,
                              color: theme.textMuted,
                              fontSize: "11px",
                              textTransform: "uppercase",
                              letterSpacing: "0.06em",
                            }}
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {[...studyData.subjects].reverse().map((s, i) => (
                      <tr
                        key={i}
                        style={{
                          borderBottom: `1px solid ${theme.cardBorder}`,
                        }}
                      >
                        <td
                          style={{
                            padding: "10px 12px",
                            fontFamily: "monospace",
                            fontWeight: 700,
                            color: theme.accent,
                          }}
                        >
                          {s.subjectId}
                        </td>
                        <td
                          style={{ padding: "10px 12px", color: theme.textDim }}
                        >
                          {s.site
                            ?.replace(" Medical Center", "")
                            .replace(" Hospital", "")}
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <span
                            style={baseStyles.tag(
                              s.allocation === "Intervention"
                                ? theme.accent
                                : theme.textMuted,
                            )}
                          >
                            {s.allocation}
                          </span>
                        </td>
                        <td
                          style={{ padding: "10px 12px", color: theme.textDim }}
                        >
                          {s.researcherName}
                        </td>
                        <td
                          style={{
                            padding: "10px 12px",
                            color: theme.textMuted,
                          }}
                        >
                          {new Date(s.enrollmentDate).toLocaleDateString()}
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          {s.llmQueried ? "✓" : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div
                  style={{
                    marginTop: "16px",
                    display: "flex",
                    gap: "16px",
                    alignItems: "center",
                  }}
                >
                  <div style={{ fontSize: "12px", color: theme.textMuted }}>
                    Total: {studyData.subjects.length} · Control:{" "}
                    {
                      studyData.subjects.filter(
                        (s) => s.allocation === "Control",
                      ).length
                    }{" "}
                    · Intervention:{" "}
                    {
                      studyData.subjects.filter(
                        (s) => s.allocation === "Intervention",
                      ).length
                    }
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── EXPORT VIEW ─── */}
        {view === "export" && (
          <>
            <div style={baseStyles.card}>
              <h2 style={baseStyles.cardTitle}>Data Export</h2>
              <p style={baseStyles.cardSub}>
                Export enrollment data as CSV for import into Google Sheets or
                Excel.
              </p>
              <button
                onClick={exportCSV}
                disabled={!studyData?.subjects.length}
                style={{
                  ...baseStyles.btnPrimary,
                  opacity: studyData?.subjects.length ? 1 : 0.4,
                }}
              >
                📥 Download CSV ({studyData?.subjects.length || 0} records)
              </button>
            </div>

            <div style={baseStyles.card}>
              <h2 style={baseStyles.cardTitle}>
                Google Sheets Integration (Optional)
              </h2>
              <p style={baseStyles.cardSub}>
                To enable automatic data logging to Google Sheets, deploy a
                Google Apps Script web app and paste the URL below. See setup
                instructions below.
              </p>
              <div
                style={{ display: "flex", gap: "10px", marginBottom: "16px" }}
              >
                <input
                  value={sheetsUrl}
                  onChange={(e) => {
                    setSheetsUrl(e.target.value);
                    setSheetsUrlSaved(false);
                  }}
                  placeholder="https://script.google.com/macros/s/..."
                  style={{ ...baseStyles.input, flex: 1 }}
                />
                <button
                  onClick={async () => {
                    try {
                      await window.storage.set("icu-llm-sheets-url", sheetsUrl);
                      setSheetsUrlSaved(true);
                    } catch {}
                  }}
                  style={baseStyles.btnSecondary}
                >
                  {sheetsUrlSaved ? "✓ Saved" : "Save"}
                </button>
              </div>
              <div
                style={{
                  background: theme.input,
                  borderRadius: "8px",
                  padding: "20px",
                  fontSize: "12px",
                  color: theme.textDim,
                  lineHeight: 1.8,
                  fontFamily: "monospace",
                }}
              >
                <p
                  style={{
                    color: theme.text,
                    fontWeight: 700,
                    marginBottom: "8px",
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "13px",
                  }}
                >
                  Google Apps Script Setup:
                </p>
                <p>1. Open Google Sheets → Extensions → Apps Script</p>
                <p>
                  2. Paste this code and deploy as Web App (Execute as: Me,
                  Access: Anyone):
                </p>
                <pre
                  style={{
                    background: "#0B1120",
                    padding: "12px",
                    borderRadius: "6px",
                    marginTop: "8px",
                    overflowX: "auto",
                    whiteSpace: "pre-wrap",
                  }}
                >{`function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);
  sheet.appendRow([
    data.subjectId, data.site, data.allocation,
    data.researcherName, data.researcherEmail,
    data.enrollmentDate, data.llmQueried
  ]);
  return ContentService.createTextOutput("OK");
}`}</pre>
                <p style={{ marginTop: "8px" }}>
                  3. Copy the deployed Web App URL and paste it above.
                </p>
              </div>
            </div>

            <div style={baseStyles.card}>
              <h2 style={{ ...baseStyles.cardTitle, color: theme.danger }}>
                Reset Study Data
              </h2>
              <p style={baseStyles.cardSub}>
                Permanently delete all enrollment records and reset the subject
                counter. This cannot be undone.
              </p>
              <button
                onClick={async () => {
                  if (
                    confirm(
                      "Are you absolutely sure? This will delete ALL study data and cannot be undone.",
                    )
                  ) {
                    const fresh = {
                      subjects: [],
                      nextId: 1,
                      randomizationLog: [],
                      blockState: {},
                    };
                    setStudyData(fresh);
                    await saveStudyData(fresh);
                  }
                }}
                style={baseStyles.btnDanger}
              >
                ⚠ Reset All Data
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
