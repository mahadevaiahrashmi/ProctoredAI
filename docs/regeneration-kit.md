# Regeneration Kit

Everything needed to **rebuild the ProctoredAI code from scratch** — the pinned stack, the
scaffolding commands, the configuration of record, the full AI-behavior spec (all 7 flows with
their exact input/output contracts and prompt intent), the file manifest, and a single
copy-paste "master build prompt" you can hand to an AI coding agent.

This is the companion to [resumability.md](resumability.md) (rebuild the *environment and pick
up the work*) and the [ADRs](adr/README.md) (*why* each decision was made). Where this kit and
the live code disagree, **the code wins** — update this kit to match.

> Scope note: this regenerates the **application code**. It does not reproduce secrets
> (`GEMINI_API_KEY`), generated exam content (that comes from the model at runtime), or git
> history.

---

## 1. How to use this kit

**As a human developer:** read §2–§3 (stack + scaffold), then recreate the files in §4–§7 in
order (config → AI layer → server actions → UI). Verify with §9.

**As an AI coding agent:** the fastest path is the **master build prompt in §10** plus these
canonical inputs as context. Build the AI layer (§5) first — it is the heart of the app and the
hardest to infer — then the thin server-action seam (§6), then the UI (§7).

## 2. Canonical inputs (source-of-truth ranking)

Feed these into a rebuild, in priority order. Higher items override lower ones on conflict.

1. **The live `src/` code** — ultimate source of truth, especially `src/ai/flows/*` (each flow file *is* the spec for its prompt and schema).
2. **[blueprint.md](blueprint.md)** — the original product/aesthetic brief (app name, core features, color & font intent).
3. **[PRD.md](PRD.md)** — goals, users, stories, success metrics.
4. **[system_design.md](system_design.md)** & **[product_design.md](product_design.md)** — architecture, flows, IA, interaction detail.
5. **[requirements.txt](../requirements.txt)** / **package.json** — dependency inventory (package.json is authoritative for versions).
6. **[.env.example](../.env.example)** — the one required secret and optional toggles.
7. **This kit + the [ADRs](adr/README.md)** — the recipe and the rationale.

## 3. Pinned stack & versions

Exact versions from `package.json` (Node **20**, npm 9+). Pin these to reproduce behavior.

| Layer | Package(s) | Version |
| --- | --- | --- |
| Framework | `next` | `15.3.3` |
| React | `react`, `react-dom` | `^18.3.1` |
| Language | `typescript` | `^5` |
| Lint | `eslint`, `eslint-config-next` | `^8.57.1`, `^15.3.3` |
| AI runtime | `genkit`, `@genkit-ai/googleai`, `@genkit-ai/next` | `^1.14.1` |
| AI CLI (dev) | `genkit-cli` | `^1.14.1` |
| Models | (config, not a package) | `googleai/gemini-2.5-flash`; TTS `gemini-2.5-flash-preview-tts` (voice `Algenib`) |
| Validation | `zod` | `^3.24.2` |
| Styling | `tailwindcss` | `^3.4.1` + `tailwindcss-animate`, `tailwind-merge`, `class-variance-authority`, `clsx` |
| UI primitives | `@radix-ui/react-*` (accordion, dialog, select, toast, …) | see package.json |
| Icons | `lucide-react` | `^0.475.0` |
| Forms | `react-hook-form`, `@hookform/resolvers` | `^7.54.2`, `^4.1.3` |
| Charts | `recharts` | `^2.15.1` |
| Audio | `wav` (+ `@types/wav`) | `^1.0.2` |
| Env | `dotenv` | `^16.5.0` |

**Present but not load-bearing — do not re-add on a clean rebuild:** `firebase` (unused — [TD-013](tech_debt.md)), `patch-package` (no patches — [TD-016](tech_debt.md)). Several shadcn deps (`embla-carousel-react`, `react-day-picker`) back UI components the app does not actually use.

## 4. Scaffold + configuration

### 4.1 Scaffold commands

```bash
npx create-next-app@15.3.3 proctoredai --typescript --tailwind --app --src-dir --import-alias "@/*"
cd proctoredai

# AI runtime
npm i genkit@^1.14.1 @genkit-ai/googleai@^1.14.1 @genkit-ai/next@^1.14.1 zod@^3.24.2 wav@^1.0.2 dotenv@^16.5.0
npm i -D genkit-cli@^1.14.1 @types/wav@^1.0.4

# UI: shadcn-ui (Radix + lucide). Init, then add the components used by the app.
npx shadcn@latest init       # style: default, base color: neutral, CSS vars: yes
npx shadcn@latest add button card input label textarea radio-group progress \
  dialog alert-dialog toast tooltip scroll-area separator avatar badge skeleton tabs
npm i lucide-react@^0.475.0 react-hook-form@^7.54.2 @hookform/resolvers@^4.1.3
```

### 4.2 `next.config.ts` — preserve these intentional choices

- `typescript.ignoreBuildErrors: false` and `eslint.ignoreDuringBuilds: false` — `next build` **fails** on type or lint errors (enforced; see [ADR-0008](adr/0008-enforce-type-lint-ci.md), which superseded [ADR-0007](adr/0007-suppress-build-type-lint-errors.md), and [TD-001](tech_debt.md), resolved). CI re-checks both via `npm run typecheck` / `npm run lint`.
- `images.remotePatterns` allow-lists `placehold.co`, `images.unsplash.com`, `picsum.photos`.

### 4.3 `package.json` scripts

```json
"dev": "next dev --turbopack -p 9002",
"genkit:dev": "genkit start -- tsx src/ai/dev.ts",
"genkit:watch": "genkit start -- tsx --watch src/ai/dev.ts",
"build": "next build",
"start": "next start",
"lint": "next lint",
"typecheck": "tsc --noEmit"
```

> Dev server runs on **port 9002** (not 3000). `typecheck`/`lint` are **separate** commands for fast feedback, but the build now enforces both too ([ADR-0008](adr/0008-enforce-type-lint-ci.md)).

### 4.4 Theme (Tailwind + tokens)

- `tailwind.config.ts`: `darkMode: ['class']`; map `colors` to `hsl(var(--token))`; set `fontFamily.body` and `fontFamily.headline` to `['Inter', 'sans-serif']`; plugin `tailwindcss-animate`; accordion keyframes.
- `src/app/globals.css`: define the HSL design tokens of record. Light primary `221 83% 53%`, near-white background `240 10% 98%`; dark mode primary `217 91% 60%`, background `240 6% 10%`. `--radius: 0.5rem`.
- Load **Inter** (e.g. `next/font` or a `<link>` in `layout.tsx`).

> **Design divergence to know:** [blueprint.md](blueprint.md) specifies a deep-blue/gray palette (primary `#30475E`, background `#E8E8E8`, accent `#749BC2`). The shipped `globals.css` instead uses the brighter blue tokens above. Treat **globals.css as current truth** and the blueprint as original intent — reconcile deliberately if you care about matching the brief.

### 4.5 Other config

- `components.json` — shadcn config: `style: default`, `rsc: true`, `baseColor: neutral`, CSS vars on, aliases `@/components`, `@/lib`, `@/hooks`, `@/components/ui`, icon library `lucide`.
- `tsconfig.json` — `@/*` path alias to `src/*`.
- `.eslintrc.json` — extends `next/core-web-vitals`; used by `npm run lint` and the build.
- `.github/workflows/ci.yml` — CI: `npm ci` → `npm run typecheck` → `npm run lint` on push/PR to `main` (Node 20) — [ADR-0008](adr/0008-enforce-type-lint-ci.md).
- `apphosting.yaml` — Firebase App Hosting: `runConfig.maxInstances: 1` (raise to scale — [ADR-0006](adr/0006-firebase-app-hosting.md), [TD-018](tech_debt.md)).
- `.env` from [.env.example](../.env.example) — set `GEMINI_API_KEY` (or `GOOGLE_API_KEY`).

## 5. AI layer — the heart of the app (build this first)

### 5.1 `src/ai/genkit.ts`

```ts
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.5-flash',
});
```

### 5.2 `src/ai/dev.ts`

Loads `dotenv` then side-effect-imports all 7 flow files so the Genkit dev inspector registers them. Keep this list in sync with `src/ai/flows/*`.

### 5.3 The 7 flows (behavior spec)

Each flow is a `'use server'` module that defines Zod input/output schemas, (usually) an
`ai.definePrompt`, and an `ai.defineFlow`, plus an exported async wrapper. **The Zod schemas are
the contract — reproduce them exactly.** Prompt *intent* is summarized; the live file is the
exact wording.

| # | File / flow | Input | Output | Prompt intent & notes |
| --- | --- | --- | --- | --- |
| 1 | `generate-exam-questions.ts` · `generateExamQuestionsFlow` | `{ topic: string, numberOfQuestions: number (1–10) }` | `{ title: string, questions: [{ id: number, type: 'multiple-choice'\|'text', text: string, options?: string[], answer: string }] }` | Expert exam creator: creative title; **exactly N** questions; mix of MC and text; MC has **exactly 4 options** incl. the correct one; sequential ids from 1; `answer` is the option (MC) or a model answer (text). |
| 2 | `detect-exam-violations.ts` · `detectExamViolationsFlow` | `{ videoDataUri: string }` (a single JPEG frame as a `data:` URI) | `{ violations: string[] }` | AI proctor over one frame via `{{media url=videoDataUri}}`. Flag: **"Multiple faces detected."**, **"Phone detected."**, looking away, other people, suspicious eye movements. Empty list if clean. |
| 3 | `grade-exam.ts` · `gradeExamFlow` | `{ questions: Question[], userAnswers: Record<id, string\|string[]> }` | `{ overallScore: number (0–100), summaryReport: string, gradedQuestions: [{ questionId: number, isCorrect: boolean, feedback: string }] }` | Grades **every** question with the LLM, incl. MC (semantic check for text vs. model answer). Encouraging summary + per-question feedback. (LLM-grades-MC is intentional — [ADR-0005](adr/0005-llm-grading.md), [TD-010](tech_debt.md).) |
| 4 | `clarify-exam-doubts.ts` · `clarifyExamDoubtsFlow` (the tutor) | `{ examTitle, questions[], userAnswers, gradingReport, chatHistory: [{role:'user'\|'model', content}], userQuery }` | `{ response: string }` | Friendly tutor grounded **only** in the provided exam context; explains right/wrong; uses chat history; politely declines off-topic. **Quirk:** the file defines an `ai.definePrompt` that is **unused** — the flow rebuilds the same prompt inline as a template string and calls `ai.generate()` ([TD-009](tech_debt.md)). On rebuild, pick **one** path (prefer `definePrompt`). |
| 5 | `summarize-proctoring-alerts.ts` · `summarizeProctoringAlertsFlow` | `{ alerts: string[] }` | `{ summary: string }` | 1–2 sentence overview of conduct (types + frequency). **Short-circuits:** empty `alerts` returns a fixed "No proctoring violations…" string **without** an API call. |
| 6 | `text-to-speech.ts` · `textToSpeechFlow` | `{ text: string }` | `{ audioDataUri: string }` (`data:audio/wav;base64,…`) | Calls model `gemini-2.5-flash-preview-tts`, `responseModalities: ['AUDIO']`, prebuilt voice **`Algenib`**. Converts returned base64 **PCM → WAV** via the `wav` lib (1 channel, 24 kHz, 16-bit). No `definePrompt`. |
| 7 | `generate-exam-session-prompt.ts` · `generateExamSessionPromptFlow` | `{ studentName: string, examName: string }` | `{ sessionStartPrompt: string }` | Friendly welcome + 4 setup steps: show photo ID, grant camera/mic, close other apps, be alone. |

The shared `Question` shape (used by flows 1, 3, 4 and the fallback data) is:
`{ id: number, type: 'multiple-choice' | 'text', text: string, options?: string[], answer: string }`.

> `'use server'` constraint to remember: these files can export **types** but **not** Zod
> schema objects. The tutor flow re-declares `GradeExamOutput`'s schema locally for this reason —
> preserve that pattern if you split schemas across server files.

## 6. Server Actions seam — `src/app/actions.ts`

A thin `'use server'` module: the only bridge the UI uses to reach the flows. Six actions, each
wrapping a flow with try/catch.

| Action | Calls | Returns / error behavior |
| --- | --- | --- |
| `detectViolationsAction(imageDataUri)` | flow 2 | `string[]`; on error logs and returns **`[]`** (never crashes the proctor loop). |
| `summarizeAlertsAction(alerts)` | flow 5 | `string`; empty input → canned clean message; on error → "Could not generate summary." |
| `generateExamAction(topic, studentName)` | flows 1 + 7 **in parallel** (`Promise.all`) | `{ examData, sessionPrompt }`; throws "Failed to generate exam…" on error. **`numberOfQuestions` is hard-coded to `5`** here though the flow supports 1–10 ([TD-011](tech_debt.md)). |
| `gradeExamAction(questions, userAnswers)` | flow 3 | `GradeExamOutput`; throws "Failed to grade exam." |
| `clarifyDoubtAction(input)` | flow 4 | `string`; re-throws as `AI Tutor Error: …`. |
| `textToSpeechAction(text)` | flow 6 | `string`; on error returns **`""`** (UI degrades to no audio). |

## 7. UI surface

Three live routes plus shared components. State crosses pages via **`sessionStorage`** (no DB —
[ADR-0003](adr/0003-client-session-state-no-db.md)).

| Route | Role | Reads / writes |
| --- | --- | --- |
| `src/app/page.tsx` | Setup wizard: enter topic + name, gate on camera/mic permission, generate exam. | Calls `generateExamAction`; **writes** `sessionStorage.examData = { title, questions[] }`. |
| `src/app/exam/page.tsx` | Exam runner + proctoring loop: per-question timer (**90s × #questions**), webcam sampling. | **Reads** `examData` (falls back to `src/lib/data.ts` sample if absent); proctor panel samples a frame **every 1500 ms** → `detectViolationsAction`; on submit **writes** `examResults = { questions, answers, violations[], title }`. |
| `src/app/results/page.tsx` | Grading report + voice AI tutor. | **Reads** `examResults`; calls `gradeExamAction` + `summarizeAlertsAction`; tutor chat → `clarifyDoubtAction` + `textToSpeechAction`. |

**Key components** (`src/components/`): `proctoring-panel.tsx` (hidden `<canvas>` → JPEG data URI sampling loop — [ADR-0004](adr/0004-webcam-frame-sampling-proctoring.md)), `floating-camera.tsx`, `exam-header.tsx` (timer), `question-display.tsx`, `chat-tutor.tsx` (tutor chat + audio playback). Plus `src/components/ui/*` (shadcn), `src/hooks/use-toast.ts`, `use-mobile.tsx`, `src/lib/utils.ts`.

**Fallback data:** `src/lib/data.ts` exports a static 5-question "Introduction to Quantum Physics" exam used when `/exam` loads with no session.

## 8. File manifest

```
src/
  ai/
    genkit.ts                 # Genkit init (gemini-2.5-flash)
    dev.ts                    # registers all flows for the dev inspector
    flows/
      generate-exam-questions.ts
      generate-exam-session-prompt.ts
      detect-exam-violations.ts
      grade-exam.ts
      clarify-exam-doubts.ts
      summarize-proctoring-alerts.ts
      text-to-speech.ts
  app/
    layout.tsx                # root layout, Inter font, <Toaster/>
    globals.css               # HSL design tokens (light + dark)
    page.tsx                  # setup wizard
    actions.ts                # 6 Server Actions (UI ↔ AI seam)
    exam/page.tsx             # exam runner + proctoring
    results/page.tsx          # grading report + tutor
  components/
    proctoring-panel.tsx  floating-camera.tsx  exam-header.tsx
    question-display.tsx  chat-tutor.tsx
    ui/*                      # shadcn components
  hooks/  use-toast.ts  use-mobile.tsx
  lib/   utils.ts  data.ts (fallback exam)  placeholder-images.{ts,json}
# root config
next.config.ts  tailwind.config.ts  postcss.config.mjs  components.json
tsconfig.json  apphosting.yaml  package.json  .env(.example)
.eslintrc.json  .github/workflows/ci.yml
```

## 9. Verify the rebuild

1. `npm run typecheck` — the build **also** enforces this now ([ADR-0008](adr/0008-enforce-type-lint-ci.md)), but run it directly for fast feedback.
2. `npm run lint`.
3. `npm run dev` → open http://localhost:9002. Optional: `npm run genkit:dev` to inspect flows.
4. **Smoke test the golden path** (see [UAT.md](UAT.md) for full cases): enter a topic + name → grant camera/mic → take the 5-question exam (watch the proctoring panel log a violation when you hold up a phone) → submit → confirm a score + per-question feedback render → ask the tutor a question and confirm a spoken reply.

## 10. Master build prompt

Copy-paste this to an AI coding agent, attaching the canonical inputs from §2.

```text
Build a Next.js 15 (App Router, TypeScript, src dir, "@/*" alias) app called "ProctoredAI"
that generates an AI exam from a topic, proctors the test-taker via periodic webcam-frame
analysis, grades the answers, and offers a voice-enabled AI tutor on a results page. There is
NO database — pass state between pages via sessionStorage.

Stack (pin exactly): next@15.3.3, react@^18.3.1, typescript@^5, tailwindcss@^3.4.1 with
shadcn-ui (Radix + lucide-react), and Genkit ^1.14.1 (genkit, @genkit-ai/googleai,
@genkit-ai/next) on Google Gemini. Default model googleai/gemini-2.5-flash; TTS model
gemini-2.5-flash-preview-tts with prebuilt voice "Algenib" (convert returned PCM to WAV via
the `wav` package). Validate all flow I/O with Zod. Dev server on port 9002
(`next dev --turbopack -p 9002`). In next.config.ts set typescript.ignoreBuildErrors and
eslint.ignoreDuringBuilds to false so the build fails on type/lint errors; add an
.eslintrc.json extending next/core-web-vitals and a .github/workflows/ci.yml that runs
`typecheck` + `lint` on push/PR.

Create src/ai/genkit.ts (Genkit init) and 7 Genkit flows under src/ai/flows/, each a
'use server' module with Zod schemas, defining exactly these contracts:
  1. generateExamQuestions({topic, numberOfQuestions:1–10}) -> {title, questions:[{id, type:'multiple-choice'|'text', text, options?, answer}]}. Mix MC (exactly 4 options) and text; sequential ids from 1; include the correct answer / model answer.
  2. detectExamViolations({videoDataUri}) -> {violations:string[]} analyzing ONE webcam frame; flag "Multiple faces detected.", "Phone detected.", looking away, other people, suspicious eye movements; empty list if clean.
  3. gradeExam({questions, userAnswers}) -> {overallScore:0–100, summaryReport, gradedQuestions:[{questionId, isCorrect, feedback}]}; grade every question with the LLM (semantic match for text answers); encouraging, constructive feedback.
  4. clarifyExamDoubts({examTitle, questions, userAnswers, gradingReport, chatHistory:[{role,content}], userQuery}) -> {response}; a friendly tutor grounded ONLY in the supplied exam context, using chat history, declining off-topic questions.
  5. summarizeProctoringAlerts({alerts:string[]}) -> {summary}; 1–2 sentence overview; short-circuit an empty list to a fixed "no violations" string WITHOUT calling the model.
  6. textToSpeech({text}) -> {audioDataUri} ("data:audio/wav;base64,...").
  7. generateExamSessionPrompt({studentName, examName}) -> {sessionStartPrompt}; a welcome + 4 setup steps (show photo ID, grant camera/mic, close other apps, be alone).

Expose them through a single src/app/actions.ts ('use server') with six wrappers
(detectViolationsAction, summarizeAlertsAction, generateExamAction, gradeExamAction,
clarifyDoubtAction, textToSpeechAction). detectViolationsAction must swallow errors and return
[]; textToSpeechAction returns "" on error; generateExamAction runs the question + session
flows in parallel and requests 5 questions.

Build three routes: / (setup wizard: topic + name, gate on camera/mic, store examData in
sessionStorage), /exam (run the exam with a 90s-per-question timer; a proctoring panel that
draws a webcam frame to a hidden canvas and POSTs a JPEG data URI to detectViolationsAction
every 1500ms, logging violations; on submit store examResults in sessionStorage; fall back to
a static sample exam if there's no session), and /results (read examResults, call
gradeExamAction + summarizeAlertsAction, render the report, and a chat tutor that calls
clarifyDoubtAction and plays textToSpeechAction audio). Use shadcn-ui components, the Inter
font, and a clean blue/neutral theme via HSL CSS variables with dark-mode support.
```

> When done, do **not** reintroduce `firebase`, `patch-package`, or the dead `submitted/page.tsx`,
> and resolve the tutor flow to a single prompt path. These are tracked debt — see
> [tech_debt.md](tech_debt.md).
