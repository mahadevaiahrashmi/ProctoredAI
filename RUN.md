# Run / Stop ProctoredAI Locally

A quick reference for starting and stopping the app on your own machine. For full
prerequisites, provider options, and troubleshooting, see **[SETUP.md](SETUP.md)**.

---

## First-time setup (once)

```bash
npm install            # install dependencies
cp .env.example .env   # create your local env file, then edit it (see "AI provider" below)
```

> `.env` holds your secrets and is **git-ignored** — never commit it.

---

## Run the app

```bash
npm run dev
```

- Open **http://localhost:9002** in your browser.
- The dev server stays running in this terminal and **live-reloads** when you edit code.
- Leave the terminal open while you use the app.

**Optional — Genkit flow inspector** (a separate UI for debugging the AI flows), in a
*second* terminal:

```bash
npm run genkit:dev
```

---

## Stop the app

**If the server is running in the foreground** (you can see its logs):

- Press **`Ctrl` + `C`** in that terminal.

**If you closed the terminal or the port is stuck** (e.g. "port 9002 already in use"):

```bash
lsof -ti:9002 | xargs kill        # stop whatever is using port 9002
```

If it refuses to stop, force it:

```bash
lsof -ti:9002 | xargs kill -9
```

Stop the optional Genkit inspector the same way — `Ctrl` + `C` in its terminal.

---

## Choosing an AI provider

The app talks to an AI model. Pick one in `.env` via the `AI_PROVIDER` variable:

| `AI_PROVIDER` | Needs | Notes |
| --- | --- | --- |
| `googleai` *(default)* | `GEMINI_API_KEY` | Free key from [Google AI Studio](https://aistudio.google.com/app/apikey). Full features (proctoring + spoken tutor). |
| `ollama` | nothing (a local [Ollama](https://ollama.com) server) | No API key. Text + tutor work; structured exam/grading can be unreliable on small models. |
| `openrouter` | `OPENROUTER_API_KEY` | Free models available. |

If you don't set `AI_PROVIDER`, it defaults to **Gemini** (`googleai`).

---

## Quick checks (optional)

```bash
npm test           # run the test suite
npm run typecheck  # TypeScript check
npm run lint       # ESLint
```

---

## Common issues

| Problem | Fix |
| --- | --- |
| **"Port 9002 already in use"** | An old server is still running — stop it with `lsof -ti:9002 \| xargs kill`, then `npm run dev` again. |
| **"Failed to generate exam"** | Check your provider key in `.env` (Gemini/OpenRouter), or that your Ollama server is running. |
| **Page is blank / shows a sample exam** | You opened a deep link or lost the session — go to http://localhost:9002 and start from the home page. |

For anything else, see **[SETUP.md](SETUP.md)**.
