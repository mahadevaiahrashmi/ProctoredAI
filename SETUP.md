# Setup Guide

How to install, configure, and run **ProctoredAI** locally, plus common problems and fixes.

---

## 1. Prerequisites

| Requirement | Version / Notes |
| --- | --- |
| **Node.js** | 20.x (the dev environment pins `nodejs_20`). Node 18+ likely works but is untested. |
| **npm** | 9+ (ships with Node 20). `yarn`/`pnpm` also work but lockfile is npm. |
| **Google Gemini API key** | Free key from [Google AI Studio](https://aistudio.google.com/app/apikey). Required — every core feature calls Gemini. |
| **Modern browser** | Chrome/Edge/Safari/Firefox with a **webcam and microphone**. Proctoring needs camera access. |
| **JDK (optional)** | Only if you run the Firebase emulators. The workspace includes Zulu JDK for that; the app itself does not need Java. |

> **Note:** `firebase` is listed as a dependency and emulator config exists in `.idx/dev.nix`,
> but the app does not currently persist anything to Firebase. You do **not** need a Firebase
> project to run it locally.

---

## 2. Install

```bash
# from the repository root
npm install
```

This installs Next.js, Genkit, the Radix/shadcn UI libraries, and the dev toolchain.

---

## 3. Configure environment

The Genkit Google AI plugin reads your API key from the environment. Create a local
`.env` from the template and fill in the key:

```bash
cp .env.example .env
```

Then edit `.env`:

```dotenv
GEMINI_API_KEY=your_key_here
```

- `.env` is git-ignored — your key never gets committed.
- `.env.example` is the committed, value-less template. Keep it in sync when you add new vars.
- `GOOGLE_API_KEY` is accepted as an alternative name by the plugin if you already have one set.

---

## 4. Run

### App (Next.js dev server)

```bash
npm run dev
```

- Serves on **http://localhost:9002** (note: not the default 3000).
- Uses Turbopack for fast refresh.

### Genkit developer UI (optional)

Useful for inspecting/testing the AI flows in isolation (exam generation, grading, TTS, etc.):

```bash
npm run genkit:dev      # one-shot
npm run genkit:watch    # restarts on file changes
```

This launches the local Genkit UI where you can run each flow with sample input.

### Production build

```bash
npm run build
npm run start           # serves the production build
```

### Quality checks

```bash
npm run lint            # next lint (ESLint)
npm run typecheck       # tsc --noEmit
```

> **Important:** `next.config.ts` sets `typescript.ignoreBuildErrors` and
> `eslint.ignoreDuringBuilds` to `true`. That means **`npm run build` will succeed even
> if there are type or lint errors.** Always run `npm run typecheck` and `npm run lint`
> separately in CI — a green build is not proof the types are sound.

---

## 5. First-run walkthrough

1. Open http://localhost:9002.
2. Enter a **name** and an **exam topic** (e.g. "World History"). Click **Generate Exam & Proceed**.
3. Read the AI-generated instructions, then **Start System Check**.
4. Grant **camera + microphone** permission when the browser prompts.
5. Click **Start Exam**. Answer the questions; proctoring runs in the side panel.
6. **Submit** on the last question (or let the timer expire).
7. Review your graded report and chat with the **AI Tutor** (responses are spoken aloud).

---

## 6. Troubleshooting

| Symptom | Likely cause & fix |
| --- | --- |
| **"Failed to generate exam"** on the first screen | Missing/invalid `GEMINI_API_KEY`, or the model is rate-limited. Verify the key in `.env`, restart `npm run dev` (env is read at startup), and check your AI Studio quota. |
| **AI Tutor error / "AI Tutor Error: ..."** | Same root cause as above — the key or quota. The tutor calls Gemini on every message. |
| **Camera/mic never turns green** in System Check | The browser blocked the permission, or you're on an insecure origin. `getUserMedia` only works on `http://localhost` or HTTPS. Re-grant permission in the site settings and refresh. |
| **Proctoring panel shows "Camera access denied or failed."** | Another app is holding the camera, or permission was revoked. Close other apps using the webcam and reload. |
| **No audio from the tutor** | TTS returns an empty string on failure (the app degrades silently). Check the server console for "Error converting text to speech" and verify the key/quota. Also confirm your browser tab isn't muted. |
| **Port 9002 already in use** | Stop the other process or run on a different port: `next dev --turbopack -p 3001`. |
| **Refreshing the exam loses my questions** | State lives in `sessionStorage`, not a database. Refreshing the `/exam` page reloads from session; opening a new tab or clearing storage starts over (and `/exam` falls back to the static sample exam in `src/lib/data.ts`). |
| **Env changes not taking effect** | The dev server reads `.env` at startup. Stop and restart `npm run dev` after editing it. |
| **`build` passes but the app misbehaves** | Type/lint errors are ignored during build (see §4). Run `npm run typecheck` to surface them. |
| **Slow/laggy exam page** | A webcam frame is sent to Gemini every ~1.5s. On slow networks or constrained quota this can lag; it does not block answering questions. |

---

## 7. Project layout (quick reference)

```
src/
  ai/
    genkit.ts            # Genkit + Google AI client (default model: gemini-2.5-flash)
    dev.ts               # Genkit dev entrypoint (registers all flows)
    flows/               # Server-side AI flows (generation, proctoring, grading, tutor, TTS)
  app/
    page.tsx             # Exam setup wizard (name, topic, permissions)
    exam/page.tsx        # Exam runner + proctoring
    results/page.tsx     # Grading report + AI tutor
    actions.ts           # Server Actions wrapping the AI flows
  components/            # UI (proctoring panel, chat tutor, camera, question display, shadcn ui/)
  lib/data.ts            # Fallback/sample exam
docs/                    # Project documentation (see README table)
```

See [docs/system_design.md](docs/system_design.md) for the full architecture.
