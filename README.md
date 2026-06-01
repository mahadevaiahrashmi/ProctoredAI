# ProctoredAI

An AI-powered proctored-exam web app. A student enters a topic, the app generates
an exam, proctors the session live through the webcam, grades the submission, and
finishes with a voice-enabled AI tutor that explains the results. The camera is
**optional** — exams can also be taken unproctored.

Built with **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS / shadcn-ui**,
and **Genkit**. AI runs on **Google Gemini** by default, with **Ollama** (local, no key)
and **OpenRouter** (free models) as opt-in providers.

## Credits / Source

This repository was cloned from **[abhinavrbharadwaj7/AI_test_propter](https://github.com/abhinavrbharadwaj7/AI_test_propter)**
by **Abhinav R Bharadwaj**. All credit for the original application goes to the upstream
author. It was scaffolded in **Firebase Studio** as a Next.js starter.

The documentation in this repo (`SETUP.md`, `requirements.txt`, `.env.example`, and the
`docs/` folder) was added on top of that source to describe and operate the project.

## Features

- **AI exam generation** — creates a titled exam (mixed multiple-choice and open-ended
  questions) from any topic.
- **Live proctoring (optional)** — samples the webcam every ~1.5s and uses a vision model to
  flag violations (multiple faces, phones, looking away, other people). Users can opt out and
  take the exam **unproctored**.
- **AI grading** — scores answers (including free-text) and produces a per-question
  performance report.
- **Voice AI tutor** — a post-exam chat grounded in your results, with spoken responses via
  Gemini text-to-speech. The voice is **mutable**, and the tutor is text-only on non-Gemini
  providers.
- **Proctoring report** — a summarized violation log on the results page (unproctored sessions
  are labeled as such).
- **Pluggable AI provider** — Gemini by default; switch to local **Ollama** (no key) or
  **OpenRouter** via the `AI_PROVIDER` env var.

## Quick start

```bash
npm install
cp .env.example .env   # then add your GEMINI_API_KEY
npm run dev            # http://localhost:9002
```

The default provider (Gemini) needs a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
Prefer no key? Set `AI_PROVIDER=ollama` to run locally. See **[SETUP.md](SETUP.md)** for full
prerequisites, provider options, scripts, and troubleshooting.

## Documentation

| Doc | Purpose |
| --- | --- |
| [SETUP.md](SETUP.md) | Install/run steps, prerequisites, troubleshooting |
| [requirements.txt](requirements.txt) | Annotated dependency inventory |
| [docs/PRD.md](docs/PRD.md) | Product requirements: goals, users, stories, metrics |
| [docs/product_design.md](docs/product_design.md) | Flows, information architecture, visual & interaction design |
| [docs/system_design.md](docs/system_design.md) | Architecture, components, ops, alternatives |
| [docs/quick-start.md](docs/quick-start.md) | One-page quick start for test-takers (non-technical) |
| [docs/user_manual.md](docs/user_manual.md) | End-user guide (full, non-technical) |
| [docs/testing.md](docs/testing.md) | Test strategy, conventions, CI |
| [docs/UAT.md](docs/UAT.md) | User acceptance test plan and sign-off |
| [docs/tech_debt.md](docs/tech_debt.md) | Known technical debt and tracking process |
| [docs/adr/README.md](docs/adr/README.md) | Architecture Decision Records — why key choices were made |
| [docs/resumability.md](docs/resumability.md) | Resumability & handoff guide — pick the project back up |
| [docs/regeneration-kit.md](docs/regeneration-kit.md) | Regeneration kit — rebuild the code from scratch |
| [docs/blueprint.md](docs/blueprint.md) | Original app blueprint (from the source repo) |

## Tech stack

- **Framework:** Next.js 15.3 (App Router, React Server Components, Server Actions)
- **Language:** TypeScript 5
- **AI:** Genkit 1.36 with a selectable provider — `@genkit-ai/google-genai` (Gemini 2.5 Flash + `gemini-2.5-flash-preview-tts` for speech; default), `genkitx-ollama` (local), or `@genkit-ai/compat-oai` (OpenRouter)
- **UI:** Tailwind CSS 3.4, shadcn-ui (Radix primitives), lucide-react icons
- **Validation:** Zod
- **Hosting target:** Firebase App Hosting

## License

No license file is present in the upstream repository. Treat the original work as
"all rights reserved" by the source author unless/until a license is added upstream.
Check with the original author before redistributing or using commercially.
