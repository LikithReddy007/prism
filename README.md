# PRISM — Predictive Resilient Infrastructure with Self-Learning Autonomous Healing Model

Frontend dashboard for **PRISM**, a capstone project (Team 55) for predictive infrastructure monitoring and auto-healing on AWS. It visualizes the full pipeline:

```
AWS EC2 → CloudWatch → Python Monitoring Engine → ML Prediction
→ Decision Engine → AWS Lambda (Auto-Healing) → Validation
```

## Status: frontend only

There is no backend yet. The app ships with an in-browser **simulation engine**
(`src/services/simulationEngine.js`) that seeds 6 EC2 instances, streams live
CloudWatch-style metrics, and periodically walks a synthetic incident through
the real pipeline stages (predicted → deciding → recovering → validating →
resolved/failed), writing every transition to a live audit trail. This makes
every screen genuinely interactive today without a backend.

All pages read through a single `useSimulation()` hook
(`src/services/store.jsx`). To wire up a real backend later, replace the tick
loop and incident lifecycle in `simulationEngine.js` with `fetch`/WebSocket
calls — no page component needs to change, since they only depend on the
shared state shape.

## Pages

- **Dashboard** — KPIs, live pipeline activity strip, fleet-wide metric chart, recent activity feed
- **Incidents** — filterable/searchable table of every predicted failure
- **Incident Detail** — full timeline from prediction to validation, plus the metric chart around the incident window
- **Recovery Actions** — auto-healing action history with outcomes and duration
- **Decision Engine** — risk tiers, playbook mapping, safety guardrails
- **Model Metrics** — accuracy/precision/recall/AUC, confusion matrix, feature importance
- **Resources** — monitored EC2 instances with live per-metric bars
- **Audit Trail** — immutable event log with CSV export

## Stack

React 18 + Vite 5, react-router-dom, recharts, lucide-react. Plain CSS design
system (dark ops-console theme) in `src/index.css` — no Tailwind.

## Running locally

```bash
npm install
npm run dev
```

Then open the printed local URL. `npm run build` produces a production bundle in `dist/`.
