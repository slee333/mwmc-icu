# ICU LLM Study Platform

## Purpose

Fullstack web portal for a prospective randomized controlled trial (RCT) evaluating **LLM-augmented clinical decision support** for ICU patients with Acute Hypoxic Respiratory Failure (AHRF). The platform handles patient enrollment, block randomization, de-identified H&P submission to an LLM, and data collection across two hospital sites (MetroWest Medical Center and St. Vincent Hospital).

The study compares an **Intervention arm** (clinicians receive LLM-generated analysis of ICU admission notes) against a **Control arm** (standard care, no LLM query).

## Tech Stack

- **Next.js 16** — App Router, TypeScript, React 19
- **Tailwind CSS v4** — Dark theme via CSS custom properties
- **Google Sheets API v4** — Primary data store (service account auth)
- **Anthropic SDK** — Server-side LLM queries (claude-sonnet-4-20250514)
- **jose + bcryptjs** — Custom JWT auth with HttpOnly cookies

## Project Structure

```
src/
├── app/                          # Next.js App Router pages and API routes
│   ├── layout.tsx                # Root layout (dark theme, Inter + JetBrains Mono fonts)
│   ├── page.tsx                  # Redirect to /login or /enroll
│   ├── login/page.tsx            # Login form
│   ├── enroll/page.tsx           # 5-step enrollment wizard (main workflow)
│   ├── log/page.tsx              # Enrollment log table (all subjects)
│   ├── export/page.tsx           # CSV export + stats (admin only)
│   └── api/
│       ├── auth/{login,logout,me}/route.ts
│       ├── subjects/route.ts     # GET list, POST create
│       ├── subjects/check-id/route.ts  # Live duplicate Study ID check
│       ├── randomize/route.ts    # Block randomization with concurrency control
│       ├── llm/route.ts          # Proxy H&P to Anthropic, saves interaction
│       ├── export/csv/route.ts   # CSV download (admin)
│       └── surveys/route.ts      # Post-enrollment survey save
├── components/
│   ├── layout/                   # Header, NavTabs
│   ├── enrollment/               # StepRegistration, StepEligibility, StepRandomization,
│   │                             # StepAllocation, StepComplete, StepProgress, CheckItem
│   ├── ui/                       # Button, Card, Input, Select, Textarea, Tag, Modal, Spinner
│   └── llm/                      # LlmResultDisplay (markdown rendering)
├── hooks/
│   ├── useAuth.ts                # Auth state + login/logout
│   └── useEnrollment.ts          # Wizard state via useReducer
└── lib/
    ├── sheets.ts                 # Google Sheets CRUD with 30s in-memory cache
    ├── auth.ts                   # JWT sign/verify, bcrypt, cookie helpers
    ├── randomization.ts          # Fisher-Yates block randomization (sizes [4,6,8])
    ├── anthropic.ts              # Anthropic API client wrapper
    ├── constants.ts              # Sites, criteria, attendings, sheet config
    ├── system-prompt.ts          # Full ABCDE ICU analysis prompt (from docs/prompt3.md)
    └── types.ts                  # TypeScript interfaces

middleware.ts                     # JWT auth guard (protects all routes except /login)
scripts/seed.mjs                  # Seeds spreadsheet headers, randomization state, admin user
docs/                             # Reference documents (proposal.md, queries.md, prompt3.md, sample.jsx)
```

## Core Workflow — Enrollment Wizard (5 Steps)

0. **Registration** — Site, researcher info, ICU Study ID (001-500 with live duplicate check), MRN, ICU attending, confirmation checkbox
1. **Eligibility Screening** — Inclusion criteria (all must be met) and exclusion criteria (none must be present) from `docs/queries.md`
2. **Randomization Confirmation** — Review all data, confirm, call `POST /api/randomize`
3. **Allocation + H&P Entry** — Shows allocation result (Control/Intervention) and internal ID. Intervention arm: paste H&P, submit to LLM, view formatted analysis. Control arm: save directly.
4. **Enrollment Complete** — Success summary, option to enroll another subject

## Data Layer — Google Sheets (5 Tabs)

| Tab | Purpose |
|-----|---------|
| `Subjects` | One row per enrolled patient (Study ID, Internal ID, MRN, site, allocation, attending, researcher, dates, LLM status) |
| `LLM_Interactions` | H&P text, LLM response, model, response time for each query |
| `Post_Enrollment_Surveys` | Survey responses as JSON |
| `Randomization_State` | Per-site: remaining block allocations (JSON), next internal ID counter, last-updated timestamp for optimistic concurrency |
| `Users` | Username, bcrypt password hash, role (researcher/admin), display name |

## Auth

- JWT in HttpOnly cookie, 7-day expiry
- Middleware protects all routes except `/login` and `/api/auth/login`
- Roles: `researcher` (enroll, view log) and `admin` (+ export, data management)
- Passwords stored as bcrypt hashes in the Users sheet

## Key Design Decisions

- **Google Sheets as database**: Chosen for accessibility to clinical researchers — data is viewable/exportable without technical tools. Trade-off: optimistic concurrency control needed for randomization writes.
- **Server-side LLM only**: Anthropic API key never exposed to client. All LLM calls proxied through `/api/llm`.
- **Block randomization**: Fisher-Yates shuffle with block sizes [4,6,8], stratified by site. Ensures balanced allocation within blocks.
- **Internal ID vs Study ID**: Study ID is researcher-entered (001-500). Internal ID is system-generated (MW-0001, SV-0001) to prevent collisions.
- **30s cache on Sheets reads**: Reduces API calls. Writes invalidate cache immediately.

## Commands

```bash
npm run dev       # Start dev server on localhost:3000
npm run build     # Production build
npm run start     # Start production server
npm run seed      # Seed spreadsheet (requires .env.local)
npm run lint      # Run ESLint
```

## Environment Variables

See `.env.example` for all required variables:
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_SPREADSHEET_ID` — Sheets access
- `ANTHROPIC_API_KEY` — LLM queries
- `JWT_SECRET` — Token signing
- `ADMIN_USERNAME`, `ADMIN_PASSWORD` — Used by seed script only

## Style Conventions

- Dark theme throughout — colors defined as CSS custom properties in `globals.css` and registered as Tailwind theme values
- Component styling uses Tailwind utility classes (not inline styles)
- UI components in `src/components/ui/` are generic and reusable; enrollment components are domain-specific
- `"use client"` directive on all interactive components; server components used for layout and redirects
