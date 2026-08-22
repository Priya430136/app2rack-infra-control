# App2Rack — Infrastructure Monitoring & Optimization Platform

App2Rack is a full-stack platform for tracking data center / server-rack infrastructure and turning raw operational data into actionable insight. It combines a REST API for infrastructure and incident data with a rule-based (optionally AI-assisted) analysis engine that surfaces root causes, optimization opportunities, and log anomalies — all presented through a modern web dashboard.

## Key Features

- **Infrastructure Inventory** — track racks, servers, and applications, with CSV/spreadsheet import and field mapping for onboarding existing data.
- **Incident Management** — log, track, and review infrastructure incidents with a full audit trail.
- **Root Cause Analysis (RCA)** — an analysis engine that correlates incidents and metrics to suggest likely root causes.
- **Log Analyzer** — parses uploaded logs and flags anomalies and patterns without requiring an external AI provider.
- **Optimization Advisor** — recommends capacity and cost optimizations based on current infrastructure data.
- **InfraBot** — a conversational assistant over infrastructure data, with optional integration to an external AI provider (OpenAI/Groq-compatible or Anthropic).
- **Capacity Calculators** — rack, storage, and cloud-cost calculators with saved calculation history.
- **Reporting & Dashboard** — a central dashboard and exportable reports (PDF) summarizing infrastructure health.
- **Billing & Usage** — plan, credits, and usage tracking views.
- **Authentication & Audit Logging** — JWT-based auth with rate limiting and a persisted audit log of user actions.

All AI-assisted features (Log Analyzer, Optimization Advisor, InfraBot) run on built-in rule-based engines by default and work fully without any external API key; an AI provider can optionally be enabled for enhanced analysis.

## Tech Stack

**Backend** (`server/`)
- Node.js + Express.js
- PostgreSQL (via `pg`), with a plain SQL migration system
- JWT authentication (`jsonwebtoken`) and password hashing (`bcrypt`)
- Security & reliability middleware: `helmet`, `cors`, `express-rate-limit`, `express-validator`
- `morgan` for HTTP request logging

**Frontend** (`rackvue-insight/`)
- React 19 + TypeScript, bundled with Vite
- TanStack Start / TanStack Router and TanStack Query
- Tailwind CSS 4 with shadcn/ui (Radix UI primitives)
- Recharts for data visualization, `jsPDF` for report export, `papaparse` / `xlsx` for data import
- Deployable to Cloudflare (via `@cloudflare/vite-plugin` / Wrangler)

**Infrastructure**
- Docker & Docker Compose (separate development and production compose files)

## Project Structure

```
app2rack_infra_control/
├── server/                     # Express.js backend (REST API)
│   ├── src/
│   │   ├── controllers/        # Request handlers
│   │   ├── routes/             # API route definitions
│   │   ├── services/           # Business logic (incl. analysis engines)
│   │   ├── middleware/         # Auth, validation, rate limiting
│   │   ├── database/           # DB connection + SQL migrations
│   │   └── validators/         # Request payload validation
│   ├── Dockerfile
│   └── .env.example
├── rackvue-insight/             # React frontend (dashboard)
│   └── src/
│       ├── routes/              # Page routes (dashboard, incidents, reports, etc.)
│       ├── components/          # UI components
│       ├── hooks/, lib/, integrations/
├── docker-compose.yml            # Local development stack
├── docker-compose.production.yml # Production stack
└── DEPLOYMENT.md                 # Deployment & operations checklist
```

## Getting Started (Local Development)

### Prerequisites
- Node.js 18+
- PostgreSQL (or use the bundled Docker Compose service)
- Docker & Docker Compose (optional but recommended)

### 1. Clone and configure environment variables

```bash
git clone <repository-url>
cd app2rack_infra_control
cp server/.env.example server/.env
```

Edit `server/.env` and set at minimum:
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` — must match your PostgreSQL instance (defaults match the bundled `docker-compose.yml`)
- `JWT_SECRET` — generate one with:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- `CLIENT_URL` — the frontend origin(s), comma-separated for multiple dev ports

AI-assisted features are optional. Leave `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` blank to run entirely on the built-in rule-based engines.

### 2. Start the database (Docker)

```bash
docker compose up -d postgres
```

### 3. Run the backend

```bash
cd server
npm install
npm run migrate    # applies SQL migrations
npm run dev         # starts the API with nodemon
```

### 4. Run the frontend

```bash
cd rackvue-insight
npm install
npm run dev
```

The frontend dev server and backend API will run on their respective ports (see each `.env` file); the frontend is configured to call the backend via `CLIENT_URL`/API base URL.

### Full stack via Docker Compose

```bash
docker compose up -d --build
```

## Production Deployment

See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for the full production checklist, including required environment variables, running the stack with `docker-compose.production.yml`, and operational recommendations (managed PostgreSQL, log/audit collection, credential rotation, and dependency auditing).

## Available Scripts

**Backend** (`server/`)
| Script | Description |
|---|---|
| `npm start` | Run the API in production mode |
| `npm run dev` | Run the API with hot-reload (nodemon) |
| `npm run migrate` | Apply database migrations |

**Frontend** (`rackvue-insight/`)
| Script | Description |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |

## Security Notes

- Never commit `.env` files or provider API keys.
- The `xlsx` package used for spreadsheet import currently has known advisories without an upstream fix; review before exposing import to untrusted uploads (see `DEPLOYMENT.md`).
- Run `npm audit` in both `server` and `rackvue-insight` before releases.

## License

Add your chosen license here (e.g., MIT).
