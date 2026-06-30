# DecoyShield

> **Fake targets. Real protection.**

DecoyShield is an autonomous cyber deception platform that deploys fake servers, portals, APIs, and credentials across your infrastructure. The moment an attacker touches any decoy — DecoyShield captures everything, scores the threat, and fires an alert instantly.

**Core principle:** Nobody should ever touch a honeypot. If they do, it matters.

🔗 **Live Dashboard:** https://decoyshield-dashboard.vercel.app
🔗 **Live Backend API:** https://decoyshield-backend.onrender.com

---

## Table of Contents

- [What It Does](#what-it-does)
- [Live Status](#live-status)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Honeypot Types](#honeypot-types)
- [Risk Scoring](#risk-scoring)
- [Alerting](#alerting)
- [Roadmap](#roadmap)
- [Hosting — 100% Free](#hosting--100-free)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Known Limitations](#known-limitations)
- [Contributing](#contributing)
- [License](#license)

---

## What It Does

Most security tools generate thousands of alerts. DecoyShield works differently.

Decoys are placed inside your infrastructure — fake SSH servers, fake admin portals, fake API endpoints. Real users never touch them. Attackers always do. Every interaction is a confirmed threat signal, not a false positive.

DecoyShield captures the attacker's IP, location, commands, payloads, and behavior pattern — then sends a plain-English summary of exactly what happened and how serious it is, with instant Discord alerts.

---

## Live Status

| Component | Status | Notes |
|---|---|---|
| Backend API | ✅ Live | Deployed on Render, free tier (spins down on idle) |
| Dashboard | ✅ Live | Deployed on Vercel, two views: landing page + threat console |
| Database | ✅ Live | Supabase PostgreSQL |
| Discord Alerts | ✅ Live | Fires on every honeypot hit ≥ 70 risk score |
| SSH Honeypot | ✅ Built | Runs locally, exposed via ngrok (no cloud VM yet) |
| Web Login Honeypot | ✅ Built | Runs locally, exposed via ngrok |
| Fake API Honeypot | ✅ Built | Runs locally, exposed via ngrok |
| AI Summary Layer | ⚠️ Disabled | Rule-based summaries active instead — Anthropic key not yet configured |
| Honeytokens | ⬜ Not built | Planned |

---

## Features

### Honeypot Types
- **SSH Honeypot** — fake SSH server, captures brute force attempts, credentials tried, and commands executed
- **Web Login Honeypot** — fake admin portal, captures credential spray and reconnaissance
- **API Honeypot** — fake REST endpoints, captures enumeration and probing behavior

### Attack Intelligence
- Full IP geolocation (country, city, ISP) via ip-api.com
- Commands executed and payloads captured
- Risk-scored automatically on ingestion

### Risk Scoring Engine

| Event | Score |
|---|---|
| Port scan | 20 |
| Login attempt | 40 |
| Credential spray | 70 |
| Command execution | 90 |
| Payload upload | 95 |

### Threat Summary
Every event gets an automatic plain-English summary (currently rule-based, Claude API integration ready but not active):

```
Source:    Germany, Stiftung Erneuerbare Freiheit
Behavior:  credential_spray detected on ssh honeypot
Risk:      HIGH (70/100)
Action:    Review attacker IP and monitor for further activity
```

### Dashboard
Two distinct experiences:

- **Landing page (`/`)** — public-facing marketing page with an animated robotic face (HTML canvas, mouse-reactive), particle network background, live stat counters pulled from the real backend, and a "Coming Soon" modal on CTA buttons
- **Threat console (`/dashboard`)** — Bloomberg-terminal-style live attack feed with filterable risk table, threat intelligence side panel, honeypot status bars, all wired to real Supabase data, auto-refreshing every 15s

### Alerting
- Discord webhook — instant notification on every high-risk hit (score ≥ 70), includes IP, country, risk level, and summary

---

## Architecture

```
Attacker / Scanner
        │
        ▼
┌─────────────────────────────────────────┐
│           Honeypot Network              │
│   SSH · Web Portal · Fake API           │
│   (Local machine, exposed via ngrok)    │
└──────────────────┬──────────────────────┘
                   │ events (HTTPS POST)
                   ▼
┌─────────────────────────────────────────┐
│            Backend Engine               │
│      FastAPI on Render.com              │
│                                         │
│  Event Store │ Risk Scoring             │
│  Geo Lookup  │ Rule-based Summary       │
└──────┬───────────────────────┬──────────┘
       │                       │
       ▼                       ▼
┌─────────────┐       ┌────────────────┐
│  Dashboard  │       │    Discord     │
│  Next.js    │       │   Webhook      │
│  Vercel     │       │    Alerts      │
└─────────────┘       └────────────────┘
       │
       ▼
┌─────────────┐
│  Supabase   │
│ PostgreSQL  │
└─────────────┘
```

---

## Tech Stack

| Layer | Technology | Hosting |
|---|---|---|
| Landing page + Dashboard | Next.js 16 (App Router, TypeScript) | Vercel (free) |
| Backend | FastAPI (Python) | Render.com (free tier) |
| Database | PostgreSQL via Supabase | Supabase (free tier) |
| Honeypots | Python (asyncssh, FastAPI) | Local machine + ngrok tunnel |
| Geolocation | ip-api.com | Free, no API key |
| Threat Summaries | Rule-based (Claude API ready, not active) | — |
| Alerting | Discord Webhook | Free |

**Total monthly cost: $0**

---

## Project Structure

```
DecoyShield/
│
├── dashboard/                       # Next.js 16 frontend
│   ├── app/
│   │   ├── page.tsx                 # Landing page (robotic face canvas, modal, scroll nav)
│   │   ├── dashboard/
│   │   │   └── page.tsx             # Threat console — Bloomberg-style live feed
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── lib/
│   │   ├── supabase.ts
│   │   └── api.ts                   # getEvents, getStats, createEvent wrappers
│   ├── public/
│   ├── .env.local                   # NEXT_PUBLIC_SUPABASE_URL, ANON_KEY, API_URL
│   └── package.json
│
├── backend/                         # FastAPI
│   ├── main.py
│   ├── routes/
│   │   ├── events.py                # POST/GET /events — ingest + list attack events
│   │   ├── honeypots.py             # CRUD for honeypot registry
│   │   └── reports.py               # /reports/stats — aggregate stats for dashboard
│   ├── services/
│   │   ├── scoring.py               # Risk scoring engine
│   │   ├── geo.py                   # IP geolocation via ip-api.com
│   │   ├── ai_summary.py            # Currently rule-based, Claude-ready
│   │   └── alerts.py                # Discord webhook sender
│   ├── models/
│   │   └── event.py                 # Pydantic schemas
│   ├── requirements.txt
│   └── .env                         # SUPABASE_URL, SUPABASE_SERVICE_KEY, DISCORD_WEBHOOK_URL
│
├── honeypots/
│   ├── ssh/
│   │   ├── server.py                # asyncssh fake SSH server, port 2222
│   │   └── .env                     # DECOYSHIELD_API_URL
│   ├── web/
│   │   ├── portal.py                # FastAPI fake admin login portal, port 8081
│   │   └── .env
│   └── api/
│       ├── fake_api.py              # FastAPI fake REST API, port 8082
│       └── .env
│
├── supabase/
│   └── schema.sql                   # events, honeypots, alerts tables
│
└── README.md
```

---

## Honeypot Types

### SSH Honeypot (`honeypots/ssh/server.py`)
Built with `asyncssh`. Listens on port 2222. Accepts any username/password, logs every credential attempt, and emulates a fake Ubuntu shell session — `ls`, `whoami`, `cat /etc/passwd`, `uname -a` etc. all return realistic fake output. Every command typed is captured and reported to the backend. Nothing is ever actually executed.

### Web Login Honeypot (`honeypots/web/portal.py`)
FastAPI app on port 8081. Serves a fake admin login page at `/`, `/admin`, `/wp-admin`, `/login`. Accepts any credentials, always rejects them, and logs username/password/IP/user-agent on every attempt. A catch-all route logs any other path probed (directory scanning, CMS fingerprinting attempts, etc).

### API Honeypot (`honeypots/api/fake_api.py`)
FastAPI app on port 8082. Exposes fake endpoints like `/api/users`, `/api/config` (returns obviously fake AWS/Stripe-style keys to bait credential harvesters), and `/api/auth/login`. A catch-all route reports any unknown endpoint probe.

### Honeytokens — Not yet built
Planned: fake AWS keys / credentials seeded in plausible locations that trigger instant alerts on use.

---

## Risk Scoring

```python
SCORES = {
    "port_scan":          20,
    "login_attempt":      40,
    "credential_spray":   70,
    "command_execution":  90,
    "payload_upload":     95,
    "lateral_movement":   98,
}
```

Scores ≥ 70 trigger a Discord alert immediately.

---

## Alerting

### Discord Webhook
Fires automatically from `backend/services/alerts.py` whenever an event's risk score is 70 or above. The embed includes IP, country, ISP, risk score, event type, and the generated summary, color-coded by severity.

---

## Roadmap

### Phase 1 — Backend + Database ✅ Done
- [x] FastAPI project setup
- [x] Supabase schema (events, honeypots, alerts)
- [x] Event ingestion API endpoint
- [x] IP geolocation service

### Phase 2 — SSH Honeypot ✅ Done
- [x] asyncssh fake server
- [x] Log credentials, commands, session duration
- [x] POST events to backend API
- [x] ngrok tunnel for public exposure

### Phase 3 — Dashboard ✅ Done
- [x] Next.js project setup
- [x] Landing page with animated canvas
- [x] Threat console with live attack feed
- [x] Risk filtering and detail panel

### Phase 4 — Alerts ✅ Done
- [x] Discord webhook alerts
- [ ] Claude API summary integration (currently rule-based fallback)
- [ ] Email alerts for high-risk events

### Phase 5 — Web + API Honeypots ✅ Done
- [x] Fake admin login portal
- [x] Fake REST API endpoints
- [ ] Honeytoken generator

### Phase 6 — Next
- [ ] Deploy honeypots to a persistent host (currently local + ngrok only — stops when laptop is off)
- [ ] Re-enable AI summaries once Anthropic API credit is added
- [ ] Add honeytoken generator
- [ ] Multi-tunnel support for running all 3 honeypots publicly at once

---

## Hosting — 100% Free

| Service | What it runs | Free limit |
|---|---|---|
| Render.com | FastAPI backend | Free tier (spins down on idle, cold starts) |
| Supabase | PostgreSQL | 500MB, 50k MAU |
| Vercel | Next.js dashboard + landing page | Unlimited personal projects |
| Discord | Webhook alerts | Free |
| ip-api.com | IP geolocation | 45 req/min, no key required |
| ngrok | Public tunnel for honeypots | Free tier, 1 tunnel at a time |

---

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 20+
- Supabase account (free)
- Discord server with a webhook URL
- ngrok account (free, for exposing honeypots publicly)

### 1. Clone the repo
```bash
git clone https://github.com/kunal-gangani/DecoyShield.git
cd DecoyShield
```

### 2. Set up the database
Run `supabase/schema.sql` in your Supabase SQL editor.

### 3. Start the backend
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
# create .env — see Environment Variables below
uvicorn main:app --reload
```

### 4. Start the dashboard
```bash
cd dashboard
npm install
# create .env.local — see Environment Variables below
npm run dev
```
Landing page: `http://localhost:3000`
Threat console: `http://localhost:3000/dashboard`

### 5. Run the honeypots locally
```bash
# SSH honeypot
cd honeypots/ssh
pip install asyncssh httpx python-dotenv
python server.py

# Web login honeypot
cd honeypots/web
pip install fastapi uvicorn httpx python-dotenv python-multipart
python portal.py

# Fake API honeypot
cd honeypots/api
pip install fastapi uvicorn httpx python-dotenv
python fake_api.py
```

### 6. Expose a honeypot publicly with ngrok
```bash
ngrok tcp 2222          # for SSH honeypot
ngrok http 8081          # for web honeypot
ngrok http 8082          # for API honeypot
```
Free ngrok only runs one tunnel at a time — pick whichever honeypot you want to expose.

---

## Environment Variables

```env
# backend/.env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
ANTHROPIC_API_KEY=                          # leave empty — not active yet
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

```env
# dashboard/.env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=https://decoyshield-backend.onrender.com
```

```env
# honeypots/ssh/.env, honeypots/web/.env, honeypots/api/.env
DECOYSHIELD_API_URL=http://127.0.0.1:8000   # or your deployed backend URL
```

---

## Known Limitations

- **Honeypots are not persistently public.** They only catch real internet traffic while your laptop is on and ngrok is running. Moving to a free-tier cloud VM (Oracle, or a credit-card-free alternative) is the next step.
- **AI summaries are rule-based**, not LLM-generated, since no Anthropic API credit is configured yet.
- **Free ngrok only exposes one honeypot at a time.** Running all three publicly simultaneously needs a paid ngrok plan or separate public hosts.
- **Render free tier cold-starts** — the backend may take 30–60s to respond after periods of inactivity.

---

## Contributing

Pull requests are welcome. For major changes, open an issue first to discuss what you'd like to change.

---

## License

MIT License.

---

<p align="center">Built with Python · FastAPI · Next.js · Supabase · asyncssh</p>