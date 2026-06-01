# System Design — ProctoredAI

Architecture, component breakdown, data flow, operations, and design alternatives.

---

## 1. Architecture overview

ProctoredAI is a **single Next.js 15 application** (App Router) with no separate backend.
The browser runs React client components; AI work happens in **Server Actions** that call
**Genkit flows**, which in turn call the **configured AI provider** (Google Gemini by default;
optionally Ollama or OpenRouter — see §8 and [ADR-0009](adr/0009-pluggable-ai-providers-and-camera-opt-out.md)).
There is no database — session state is held in the browser's `sessionStorage`.

```
┌──────────────────────────── Browser (client) ─────────────────────────────┐
│  React client components ("use client")                                    │
│   • Setup wizard (page.tsx)        • Exam runner (exam/page.tsx)            │
│   • Proctoring panel  ── webcam ─► canvas frame (JPEG data URI)             │
│   • Results + Chat tutor           • <audio> playback (TTS, mutable)        │
│   sessionStorage: examData, examResults, examConfig (proctored?)           │
└───────────────┬───────────────────────────────────────────────────────────┘
                │  Server Action calls (RPC over HTTPS, Next.js)
                ▼
┌──────────────────────── Next.js server (Server Actions) ───────────────────┐
│  src/app/actions.ts  ("use server")                                        │
│   detectViolationsAction · generateExamAction · gradeExamAction            │
│   clarifyDoubtAction · summarizeAlertsAction · textToSpeechAction          │
└───────────────┬───────────────────────────────────────────────────────────┘
                │  invoke
                ▼
┌──────────────────────────── Genkit flows (src/ai) ─────────────────────────┐
│  genkit.ts: AI_PROVIDER selects the plugin → ai = genkit({ plugins:[…] })  │
│   googleai (default) · ollama · openrouter; exports vision/TTS flags        │
│  flows/: generate-exam-questions · generate-exam-session-prompt            │
│          detect-exam-violations · grade-exam · summarize-proctoring-alerts │
│          clarify-exam-doubts · text-to-speech                              │
└───────────────┬───────────────────────────────────────────────────────────┘
                │  AI provider call (default: HTTPS + GEMINI_API_KEY)
                ▼
        ┌────────────────────────────┐
        │  AI provider (AI_PROVIDER): │
        │   googleai → gemini-2.5-    │
        │     flash (+ preview-tts)   │
        │   ollama   → local models   │
        │   openrouter → free models  │
        └────────────────────────────┘
```

### Why this shape
- **Server Actions** keep the AI provider key (e.g. Gemini) server-side; the browser never sees it.
- **Genkit** gives typed, schema-validated (Zod) flows with structured JSON output, which makes the AI calls behave like ordinary typed functions.
- **No DB** keeps the demo zero-config; the cost is that nothing persists (see §6, §8).

---

## 2. Tech stack

| Layer | Choice | Notes |
| --- | --- | --- |
| Framework | Next.js 15.3.3 (App Router, RSC, Server Actions) | Dev server on port **9002** via Turbopack |
| Language | TypeScript 5 | Strict mode on; build fails on type errors (see §7) |
| AI orchestration | Genkit 1.36 | `defineFlow`, `definePrompt`, Zod schemas |
| Model provider | Selectable via `AI_PROVIDER`: `@genkit-ai/google-genai` (Gemini, default), `genkitx-ollama`, `@genkit-ai/compat-oai` (OpenRouter) | Capability flags gate vision/TTS per provider; TTS is Gemini-only (`gemini-2.5-flash-preview-tts`) |
| UI | Tailwind 3.4 + shadcn-ui (Radix) + lucide-react | CSS-variable theming |
| Validation | Zod | Shared by Genkit I/O and forms |
| Audio | `wav` | Wraps Gemini PCM output into a WAV data URI |
| Hosting target | Firebase App Hosting | `apphosting.yaml` (maxInstances: 1) |
| Dev workspace | Firebase Studio / IDX | `.idx/dev.nix` (Node 20, Zulu JDK) |

---

## 3. Component & module breakdown

### 3.1 Pages (client components)
| File | Responsibility |
| --- | --- |
| `src/app/page.tsx` | 3-step setup wizard; generates exam; gates on camera/mic permissions. |
| `src/app/exam/page.tsx` | Loads exam from session (or static fallback); orchestrates header, questions, navigation, proctoring; writes results to session on submit. |
| `src/app/results/page.tsx` | Loads results from session; runs grading + violation summary in parallel; renders report and mounts the tutor. |
| `src/app/layout.tsx` | Root layout; loads Inter font; mounts global `<Toaster>`. |

### 3.2 Feature components
| File | Responsibility |
| --- | --- |
| `proctoring-panel.tsx` | Owns the proctoring webcam stream; every 1.5s draws a frame to a hidden canvas, encodes JPEG (q=0.7), calls `detectViolationsAction`, appends timestamped violations; manages status. |
| `chat-tutor.tsx` | Chat UI; calls `clarifyDoubtAction` with full exam context + history, then `textToSpeechAction`; plays audio and animates the avatar while speaking. |
| `floating-camera.tsx` | Small secondary webcam preview for small screens. |
| `exam-header.tsx` | Countdown timer (90s × #questions); calls `onTimeUp` at zero. |
| `question-display.tsx` | Renders MC (radio) or text (textarea) inputs. |
| `components/ui/*` | shadcn-ui primitives (button, card, dialog, accordion, etc.). |

### 3.3 Server Actions — `src/app/actions.ts`
Thin `"use server"` wrappers around the flows, each with try/catch. Notable behaviors:
- `detectViolationsAction` **swallows errors and returns `[]`** to avoid crashing the client loop.
- `summarizeAlertsAction` short-circuits to a clean message when there are no alerts.
- `generateExamAction` runs question generation + session prompt **in parallel** (`Promise.all`) and hard-codes **5 questions**.
- `gradeExamAction` / `clarifyDoubtAction` rethrow as user-facing errors.
- `textToSpeechAction` returns `""` on failure (silent audio degrade).

### 3.4 AI flows — `src/ai/flows/*` (all `"use server"`)
| Flow | Input → Output | Model usage |
| --- | --- | --- |
| `generate-exam-questions` | `{topic, numberOfQuestions(1–10)}` → `{title, questions[]}` | Structured JSON via `definePrompt` output schema |
| `generate-exam-session-prompt` | `{studentName, examName}` → `{sessionStartPrompt}` | Templated welcome text |
| `detect-exam-violations` | `{videoDataUri}` (image) → `{violations[]}` | **Multimodal** — `{{media url=...}}` vision |
| `grade-exam` | `{questions[], userAnswers}` → `{overallScore, summaryReport, gradedQuestions[]}` | Handlebars-templated grading prompt |
| `summarize-proctoring-alerts` | `{alerts[]}` → `{summary}` | Short text summary (skips model when empty) |
| `clarify-exam-doubts` | `{examTitle, questions, userAnswers, gradingReport, chatHistory, userQuery}` → `{response}` | Builds a **custom string prompt** and calls `ai.generate` directly |
| `text-to-speech` | `{text}` → `{audioDataUri}` | `gemini-2.5-flash-preview-tts`, voice "Algenib", PCM→WAV |

`src/ai/genkit.ts` configures the shared `ai` instance; `src/ai/dev.ts` imports every flow so they register in the Genkit dev UI.

### 3.5 Data model (Zod-validated)
```ts
Question      = { id:number, type:'multiple-choice'|'text', text:string, options?:string[], answer:string }
Exam          = { title:string, questions:Question[] }
GradeExam     = { overallScore:0–100, summaryReport:string,
                  gradedQuestions:{ questionId:number, isCorrect:boolean, feedback:string }[] }
ChatMessage   = { role:'user'|'model', content:string }
```

---

## 4. Runtime data flow

1. **Generate:** Setup form → `generateExamAction(topic, name)` → `{examData, sessionPrompt}` → `sessionStorage.examData`.
2. **Proctor loop (proctored sessions only):** `setInterval(1500ms)` → canvas frame → `detectViolationsAction(jpegDataUri)` → violations appended to React state. Skipped when the user opted out of the camera (`examConfig.proctored === false`).
3. **Submit:** `{questions, answers, violations, title, proctored}` → `sessionStorage.examResults` → navigate `/results`.
4. **Grade:** `Promise.all([gradeExamAction(...), summarizeAlertsAction(...)])` → report + violation summary rendered (unproctored sessions are labeled instead).
5. **Tutor:** each message → `clarifyDoubtAction(context + history + query)` → text. If the user hasn't muted voice **and** the provider supports TTS → `textToSpeechAction(text)` → WAV data URI → `<audio>.play()`.

All cross-page handoff is via `sessionStorage` (JSON). Nothing is written to a server store.

---

## 5. External integrations & configuration
- **AI provider (pluggable via `AI_PROVIDER`)** — `googleai` (Genkit `googleAI()`; auth `GEMINI_API_KEY`/`GOOGLE_API_KEY`; **default**), `ollama` (local, keyless; `OLLAMA_*` vars), or `openrouter` (`OPENROUTER_API_KEY`). `genkit.ts` resolves the plugin and exports `providerSupportsVision`/`providerSupportsTTS` flags consumed by the actions/UI. See [.env.example](../.env.example) and [ADR-0009](adr/0009-pluggable-ai-providers-and-camera-opt-out.md).
- **Browser Media APIs:** `navigator.mediaDevices.getUserMedia` for camera/mic; `<canvas>` for frame capture; `<audio>` for playback.
- **Google Fonts:** Inter, loaded in `layout.tsx`.
- **`next.config.ts` image allowlist:** `placehold.co`, `images.unsplash.com`, `picsum.photos`.

---

## 6. Operations

### Environments & commands
| Task | Command | Notes |
| --- | --- | --- |
| Dev | `npm run dev` | Turbopack, port 9002 |
| Genkit UI | `npm run genkit:dev` / `:watch` | Inspect/run flows |
| Build | `npm run build` | **Fails on TS/ESLint errors** (enforced) |
| Serve | `npm run start` | Production server |
| Typecheck | `npm run typecheck` | `tsc --noEmit` |
| Lint | `npm run lint` | `next lint` |

### Deployment
- Target: **Firebase App Hosting** (`apphosting.yaml`, `maxInstances: 1`). Set the provider key (e.g. `GEMINI_API_KEY`) plus any `AI_PROVIDER`/provider vars as backend secrets/env vars in the hosting environment.
- Stateless server (no DB), so horizontal scaling is limited only by the `maxInstances` setting and provider quota.

### Observability
- Current: `console.error` in actions/flows only. No structured logging, metrics, or tracing.
- Genkit can emit traces/telemetry in dev via the Genkit UI; production telemetry is not configured.

### Failure modes & handling
| Failure | Behavior |
| --- | --- |
| Missing/invalid API key | Generation/grading/tutor throw user-facing errors; proctoring returns `[]`; TTS returns `""`. |
| Gemini rate limit/5xx | Same as above; the proctoring loop keeps trying on the next tick. |
| Camera denied / declined | Setup offers **Take Without Camera (Unproctored)**; the exam runs without proctoring and results are labeled unproctored. |
| Direct `/exam` visit | Falls back to `src/lib/data.ts` sample exam. |
| Lost session (refresh/new tab) | Results unavailable; exam falls back to sample. |

---

## 7. Security & privacy considerations
- **API key isolation:** Good — the key stays in Server Actions/flows, never shipped to the client.
- **No authn/authz:** Anyone with the URL can use any feature; there are no roles or rate limits on the AI actions (abuse/cost risk).
- **Webcam frames to third party:** In a **proctored** session a JPEG of the user is sent to the AI provider every ~1.5s with no consent log or retention statement (still needs a privacy notice + configurable cadence — [TD-003](tech_debt.md)). Users can now **opt out** of the camera entirely and take the exam unproctored ([ADR-0009](adr/0009-pluggable-ai-providers-and-camera-opt-out.md)).
- **Answer exposure:** Correct answers are generated by AI and stored in client-readable `sessionStorage`; this is a learning tool, not exam-secure.
- **Build safety:** type/lint errors **fail** `next build` (`ignoreBuildErrors`/`ignoreDuringBuilds` are `false`), and CI re-checks both on every push/PR ([ADR-0008](adr/0008-enforce-type-lint-ci.md), [testing.md](testing.md)).

---

## 8. Design alternatives & trade-offs

| Decision | Chosen | Alternatives | Trade-off |
| --- | --- | --- | --- |
| State handoff | `sessionStorage` | Server DB (Firestore), URL/query, React context + single SPA | Chosen path is zero-config and private to the tab, but loses data on refresh/new tab and supports no history/audit. |
| AI orchestration | Genkit flows | Direct REST/SDK calls, LangChain | Genkit gives typed schemas + a dev UI; adds a framework dependency. |
| AI provider | Pluggable via `AI_PROVIDER` (Gemini default; Ollama/OpenRouter) | Single hard-wired Gemini; multi-SDK direct calls | Pluggable lowers the key barrier and avoids single-vendor lock-in for non-TTS use, but adds config surface and uneven capabilities (TTS is Gemini-only; small Ollama models can't do structured output) — see [ADR-0009](adr/0009-pluggable-ai-providers-and-camera-opt-out.md), [TD-020](tech_debt.md). |
| Proctoring requirement | Optional — user can take the exam unproctored | Mandatory camera; block the exam without it | Optional access is more inclusive and a partial consent mitigation ([TD-003](tech_debt.md)), but unproctored results are lower-assurance (and labeled as such) — see [ADR-0009](adr/0009-pluggable-ai-providers-and-camera-opt-out.md). |
| Proctoring input | Periodic JPEG frames (1.5s) to vision model | Continuous video stream, on-device ML (e.g. face-api/MediaPipe), WebRTC to a proctor | Frame sampling is simple and model-agnostic but adds latency, cost, and privacy exposure; on-device ML would cut cost/privacy risk at the price of complexity and lower accuracy. |
| Grading | LLM grades MC **and** free-text | Deterministic MC scoring + LLM only for text | LLM-for-everything is uniform but can mis-score deterministic MC; a hybrid would be cheaper and more reliable for MC. |
| Tutor prompt | Custom string prompt built in code | Use the declared `definePrompt` Handlebars template | The Handlebars prompt is defined but unused — duplicated logic; consolidating would reduce drift (tracked in [tech_debt.md](tech_debt.md)). |
| Persistence of correct answers | Stored client-side in session | Keep answers server-side, grade server-side only | Client storage is simpler but exposes answers; server-side keeps integrity at the cost of needing a backend. |
| Hosting | Firebase App Hosting | Vercel, self-hosted Node, Cloud Run | App Hosting integrates with the Firebase Studio origin; portable to any Node host since there's no Firebase runtime dependency in code. |

See [tech_debt.md](tech_debt.md) for the prioritized list of issues implied above.
