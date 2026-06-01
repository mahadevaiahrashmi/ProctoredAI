# ProctoredAI

An AI-powered proctored-exam web app. A student enters a topic, the app generates
an exam with Google Gemini, proctors the session live through the webcam, grades the
submission, and finishes with a voice-enabled AI tutor that explains the results.

Built with **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS / shadcn-ui**,
and **Genkit** on top of the **Google Gemini** models.

## Credits / Source

This repository was cloned from **[abhinavrbharadwaj7/AI_test_propter](https://github.com/abhinavrbharadwaj7/AI_test_propter)**
by **Abhinav R Bharadwaj**. All credit for the original application goes to the upstream
author. It was scaffolded in **Firebase Studio** as a Next.js starter.

The documentation in this repo (`SETUP.md`, `requirements.txt`, `.env.example`, and the
`docs/` folder) was added on top of that source to describe and operate the project.

## Features

- **AI exam generation** — creates a titled exam (mixed multiple-choice and open-ended
  questions) from any topic.
- **Live proctoring** — samples the webcam every ~1.5s and uses Gemini vision to flag
  violations (multiple faces, phones, looking away, other people).
- **AI grading** — scores answers (including free-text) and produces a per-question
  performance report.
- **Voice AI tutor** — a post-exam chat grounded in your results, with spoken responses
  via Gemini text-to-speech.
- **Proctoring report** — a summarized violation log on the results page.

## Quick start

```bash
npm install
cp .env.example .env   # then add your GEMINI_API_KEY
npm run dev            # http://localhost:9002
```

You need a Google Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
See **[SETUP.md](SETUP.md)** for full prerequisites, scripts, and troubleshooting.

## Documentation

| Doc | Purpose |
| --- | --- |
| [SETUP.md](SETUP.md) | Install/run steps, prerequisites, troubleshooting |
| [requirements.txt](requirements.txt) | Annotated dependency inventory |
| [docs/PRD.md](docs/PRD.md) | Product requirements: goals, users, stories, metrics |
| [docs/product_design.md](docs/product_design.md) | Flows, information architecture, visual & interaction design |
| [docs/system_design.md](docs/system_design.md) | Architecture, components, ops, alternatives |
| [docs/user_manual.md](docs/user_manual.md) | End-user guide |
| [docs/testing.md](docs/testing.md) | Test strategy, conventions, CI |
| [docs/UAT.md](docs/UAT.md) | User acceptance test plan and sign-off |
| [docs/tech_debt.md](docs/tech_debt.md) | Known technical debt and tracking process |
| [docs/blueprint.md](docs/blueprint.md) | Original app blueprint (from the source repo) |

## Tech stack

- **Framework:** Next.js 15.3 (App Router, React Server Components, Server Actions)
- **Language:** TypeScript 5
- **AI:** Genkit 1.14 + `@genkit-ai/googleai` → Gemini 2.5 Flash (and `gemini-2.5-flash-preview-tts` for speech)
- **UI:** Tailwind CSS 3.4, shadcn-ui (Radix primitives), lucide-react icons
- **Validation:** Zod
- **Hosting target:** Firebase App Hosting

## License

No license file is present in the upstream repository. Treat the original work as
"all rights reserved" by the source author unless/until a license is added upstream.
Check with the original author before redistributing or using commercially.
