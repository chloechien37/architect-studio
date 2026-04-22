# Agent Studio

> An editorial, single-screen design tool that walks you from *"what agent do you want to be today?"* to a Google Cloud–native agent blueprint.

A Vite + React frontend-only demo. No backend — all data is mocked client-side to showcase the flow and visual design.

---

## The five-step flow

| # | Chapter       | What happens |
|---|---------------|--------------|
| 01 | **Intent**       | *"What agent do you want to be today?"* — one line of intent. Four starter suggestions (OSS digest · code reader · PR reviewer · program sync). |
| 02 | **Data**         | Pick the sources the agent will read — source code, docs, issues & PRs, chat, runtime signals, external feeds, meetings, team graph. |
| 03 | **Architecture** | Pick the **agent runtime** — Vertex AI Agent Engine, Cloud Run, or GKE Autopilot — each with its own tagline and trade-offs. The supporting GCP stack (models, tools, memory, ingest, security, observability) renders beneath. Leave plain-language comments ("add RAG", "needs GPU", "multi-agent") and the blueprint rearranges. |
| 04 | **Finalize**     | Summary grid: intent, runtime, data sources, dependency layers, revisions — plus a compact preview of the final blueprint. |
| 05 | **Generate**     | Runtime-aware deployment trace: `gcloud projects create` → IAM/SA → Secret Manager → data ingestion → memory stores → model pinning → **runtime deploy** (Agent Engine / Cloud Run / GKE pods with GPUs) → eval harness → observability → Terraform export. Live console beside step tracker. |

---

## Design

- **Gemini visual language** — signature gradient (`#4285F4` blue → `#9B72F6` violet → `#E05D8B` magenta → `#FBBC04` warm yellow) applied to active states, gradient-traced card borders, soft bloom ambient background, and animated gradient text on hero accents.
- **Typography** — Noto Serif Display (editorial italic for display), Plus Jakarta Sans (UI), Google Sans Code (mono / labels / console).
- **Logo** — 4-point Gemini sparkle, used in the sidebar brand (rotating), the loading state in step 3, and the completion card in step 5.
- **Layout** — one viewport, no page scroll. Left sidebar holds the stepper, session meta, and a `✦ Powered by Gemini` signature. Right stage holds the step content.

---

## Getting started

```bash
npm install
npm run dev
```

Open `http://localhost:5173/`.

### Build for production

```bash
npm run build
npm run preview
```

---

## Project structure

```
src/
├── App.jsx                 # Root layout + step routing
├── App.css                 # All layout + component styles
├── index.css               # Theme tokens, fonts, ambient background
├── main.jsx
└── components/
    ├── GeminiLogo.jsx         # SVG 4-point sparkle with gradient fill
    ├── Stepper.jsx            # Vertical stepper with gradient progress rail
    ├── Step1Intent.jsx        # Large prompt + labeled input field + agent suggestions
    ├── Step2DataTypes.jsx     # 4-column grid of data source cards
    ├── Step3Architecture.jsx  # Runtime tabs + showcase + supporting stack + comment panel
    ├── Step4Finalize.jsx      # Summary grid + compact blueprint preview
    └── Step5Generate.jsx      # Runtime-aware build steps + dark console
```

State lives in `App.jsx`: `intent`, `dataTypes`, `runtime`, `architecture`. The refinement loop in step 3 mutates `architecture` client-side based on keywords in the comment (e.g. `rag`, `gpu`, `multi-agent`, `streaming`, `cheap`, `safety`, `mcp`).

---

## Stack

- Vite 5 · React 18
- No UI framework, no state library, no backend — just the essentials.
- Fonts loaded from Google Fonts.

---

## License

MIT
