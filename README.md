# ImpactLink

**Connecting Resources to Real Needs** · Community partnerships · Team De-zum · TS-036

Methodist College of Engineering and Technology, Hyderabad. Shaik Muhammed Muzakir, Mohammed Muabbir Sayeed, and Devansh Bohra.

This application is built with Next.js App Router, TypeScript, Tailwind, a shadcn-style Radix button, Lucide, Recharts, React Hook Form/Zod, FastAPI, SQLAlchemy, and Alembic. It runs locally on SQLite because Docker/PostgreSQL are not installed on the development machine. A PostgreSQL Docker Compose setup is included but has not been executed here.

This copy lives in `ImpactLink/mvp` to isolate it from another implementation that appeared in the parent folder during development. Run commands from **this directory**. The parent's frontend, backend, and database are independent and should not be mixed with this copy.

## Quick start on Windows

### Product update: 10 October 2026

The UI now uses square edges, bold type, an ink/white/cobalt palette, consistent buttons, and minimal surfaces. Short hover, press, tab, and entrance transitions respect reduced-motion preferences. A single shared observer handles one-time reveals; there is no animation library or continuous decorative background. The theme lives in `frontend/src/app/product.css`.

Projects use named community causes across registration, filters, matching, charts, and administration. Existing stored records remain compatible.

NGO and CSR registrations require super-admin approval before their organizations, projects, or offers become public or eligible for matching. Applicants can prepare private resources, inspect review notes, and edit their profile. Profile changes return NGO/CSR accounts to review. College and supplier registrations are listed immediately. Resource verification remains a separate administrator workflow.

Open **Login / Demo > Super admin** for the account-approval portal. The **NGO applicant (pending review)** and **CSR applicant (pending review)** accounts include private sample resources. Approve, reject, or remove a listing with a mandatory note; each decision is retained in the review history. Standard administrator accounts cannot make listing decisions.

For hosting with persistent demo data, follow [DEPLOYMENT.md](DEPLOYMENT.md). The latest version is maintained in `Monarch-sdw/ImpactLinkV1` on branch `v2`.

This copy can run alongside the original app using separate ports:

```powershell
cd C:\Users\moham\Downloads\dimpact\ImpactLink\mvp
.\start-local.ps1 -FrontendPort 3018 -BackendPort 8018
```

Open **http://localhost:3018**; API docs are at **http://localhost:8018/docs**. Add `-Setup` if dependencies have not yet been installed. Stop this copy with `.\stop-local.ps1`. The stop script checks project paths so copied process records cannot stop the original app. Without port arguments, startup retains the default ports described below.

To run browser tests against this copy, set `$env:TEST_URL='http://127.0.0.1:3018'` in `frontend/` before `npx playwright test`.

Prerequisites: Python 3.12+, Node.js 20.9+ (Node 24 LTS was used), npm, and PowerShell. Restart the terminal after installing runtimes so PATH is refreshed.

```powershell
cd C:\Users\moham\Downloads\dimpact\ImpactLink\mvp
powershell -ExecutionPolicy Bypass -File .\start-local.ps1 -Setup
```

Open **http://localhost:3017**. FastAPI docs: **http://localhost:8017/docs**.

The script installs dependencies into this project's virtual environment, applies migrations, seeds an empty database, generates an ignored local signing secret, and starts two hidden background processes. Ports 3017 and 8017 avoid conflicts with the separate application in the parent folder. Logs and process IDs are in `.runtime/`. On subsequent starts, omit `-Setup`.

```powershell
powershell -ExecutionPolicy Bypass -File .\stop-local.ps1
powershell -ExecutionPolicy Bypass -File .\start-local.ps1
```

If startup reports occupied ports, check whether this application is already running. The stop script only stops the saved processes after checking their command lines. All records persist in `backend/impactlink.db` across restarts and page refreshes.

## Manual setup (Windows)

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
cd backend
Copy-Item .env.example .env
# Replace JWT_SECRET in .env with a random secret.
..\.venv\Scripts\python.exe -m alembic upgrade head
..\.venv\Scripts\python.exe -m app.seed
..\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8017
```

In a second terminal:

```powershell
cd C:\Users\moham\Downloads\dimpact\ImpactLink\mvp\frontend
npm ci
$env:API_URL='http://127.0.0.1:8017'
npm run dev -- --port 3017
```

On Linux/macOS use `python3 -m venv .venv`, `.venv/bin/python`, and `API_URL=http://127.0.0.1:8017 npm run dev -- --port 3017`. Copy the backend environment example, set a signing secret, and run backend commands from `backend/`.

## Three-minute judge demo

1. Open **Login / Demo** and choose **NGO organizer**. These are fictional accounts; no passwords are shown or needed.
2. Open **Digital futures: a classroom for everyone** from Overview.
3. Select **Find matching partners**. Inspect scores, explanations, proposed allocations, and the **Partnership network** tab.
4. Send a partnership request to a contributor. Notice that the project still has **zero committed** until acceptance.
5. Select **Demo guide & accounts** and choose the contributor whose organization name appeared on the request. Every seeded offer owner has a demo account.
6. Open **Partnerships**, accept the request, then record a cumulative delivered quantity. Inspect **Impact dashboard** to see committed and delivered values separately.
7. Switch back to the NGO organizer and reopen the project. The updated requirement totals persist after refresh.

The same workflow supports all four demo scenarios. Flood relief has insufficient transport; healthcare has missing qualified volunteers and equipment. These shortages are calculated from the actual records. If judges consume existing capacity, later match plans change accordingly. Create additional offers to explore alternative allocations.

Demo access requires `DEMO_MODE=true`. It is a local, trusted demonstration convenience including an administrator account. Keep it disabled for a non-demo deployment and do not mix real sensitive information into a publicly accessible demo database. Ordinary registration and password login also work; passwords use Argon2 and sessions use HttpOnly cookies. Registration cannot grant administrator privileges.

## Implemented workflows

- Public landing page, searchable project directory with cause/resource/location/urgency/status filters, project detail pages and organization-scoped overview.
- Registration of NGO, CSR, college/group, and supplier organizations, password login/logout, session validation and fictional account switching.
- NGO project creation with multiple validated requirements; title/description/progress edits; cancellation and completion controls. Completion requires delivery of all requested resources.
- Contributor offer creation, editing, deactivation, available capacity and matching project discovery.
- Deterministic ranked matching and explanations, a combined resource proposal, missing-resource detection, and an interactive connected network view.
- Request, accept, decline, and delivery workflows with ownership checks and transactional capacity revalidation.
- Platform analytics with two Recharts charts. Money and people are never summed together. Recommendations, commitments, delivery and verified outcomes are separate.
- Administrator organization review with audit records, suspension from matching, and outcome attestation requiring an evidence reference.
- OpenStreetMap location links based on stored coordinates.
- Ninety-three fictional organization profiles (including two pending applicants and the super-admin workspace), 100 anonymous fictional volunteer profiles, 31 projects and 15 resource offers. Volunteer profiles are sample records; capacity is managed through group offers.

## Matching and allocation

The engine in [matching.py](backend/app/matching.py) rejects inactive or exhausted offers, wrong categories or units, missing mandatory specification tags, insufficient date-window coverage, suspended organizations, and offers outside their radius. Missing coordinates exclude local offers instead of inventing a distance. Funding and explicitly remote offers are location-independent. Medical resources and healthcare-tagged volunteering require manual organization verification. Only organizations with approved listings can match. Approved listings with pending resource verification can match ordinary resources with reduced verification weight.

Eligible scores use:

`100 × (0.35 compatibility + 0.20 capacity + 0.20 availability + 0.15 proximity + 0.10 verification)`

- Compatibility: 1 for a supported project cause; 0.7 for a compatible resource without the cause preference. Mandatory tags are exact, normalized matches, not fuzzy guesses.
- Capacity: available capacity / remaining need, capped at 1.
- Availability: 1 after full date-window eligibility.
- Proximity: `1 − distance / service radius`, bounded at zero; 1 for remote/funding. Haversine distance uses stored coordinates.
- Verification: 1 for manual approval; 0.3 for pending review. Demo verification is simulated and labelled.

Weights are prototype assumptions, not scientifically validated success probabilities. Urgency never inflates suitability. Ties break by offer ID. Each requirement is filled in descending score order, without exceeding its remaining need. An in-memory reservation ledger also prevents the same offer being over-proposed across multiple requirements in one plan. Proposals never reserve actual capacity.

Acceptance reruns eligibility inside a database transaction. PostgreSQL uses a transaction-scoped advisory lock shared by all capacity-changing actions; SQLite uses `BEGIN IMMEDIATE`. It rechecks remaining requirement and uncommitted offer capacity before inserting a unique commitment. Delivery totals can only increase up to the confirmed quantity. Cancelled projects release undelivered allocations and preserve recorded deliveries.

## Data model and API

Models are in [models.py](backend/app/models.py). The Alembic initial revision uses a frozen schema snapshot so future model edits do not change migration history. Tables: organizations, users, projects, requirements, offers, partnerships, commitments, project_updates, verification_records, listing_reviews, recommendations, and volunteers. Foreign keys, uniqueness constraints, quantity checks, timestamps, and lookup indexes are included.

For MVP simplicity, a project has one primary cause and small arrays of supported causes/skills are stored in JSON columns. The core operational entities are relational. Quantities use floating-point storage with bounded input; this is a pledge-tracking prototype, not financial accounting or payment processing.

Open [FastAPI documentation](http://localhost:8017/docs) for routes and validation schemas. Organization creation is atomic with registration. Offer deactivation and project cancellation serve as safe removal operations; historical commitments are retained. Organization updates reset verification. User-owned endpoints require matching organization IDs and roles. The frontend proxies `/api/*` to FastAPI so browser cookies stay same-origin.

## PostgreSQL and Docker

Install Docker Desktop with Compose, then:

```powershell
Copy-Item .env.example .env
# Set POSTGRES_PASSWORD and JWT_SECRET to random values in .env.
docker compose up --build
```

Open http://localhost:3000 and http://localhost:8000/docs. PostgreSQL data persists in a named volume. The backend applies Alembic migrations and seeds an empty database and adds missing approval-demo roles without resetting existing records. To use an existing PostgreSQL server, set the backend `DATABASE_URL` to `postgresql+psycopg://...` and apply migrations before startup. Use URL-safe database passwords in the Compose example, or URL-encode special characters in the connection URL.

Docker and PostgreSQL integration are supplied but **not runtime-tested on this machine**. The SQLite transaction path is exercised by concurrency tests. For a hosted fictional demo, follow [DEPLOYMENT.md](DEPLOYMENT.md). For real organization data, disable demo access and provision privileged users through a controlled process.

## Deploy to Vercel

See [DEPLOYMENT.md](DEPLOYMENT.md) for the complete environment table, automatic migration/demo setup, persistent PostgreSQL configuration, and hosted acceptance checks. Local SQLite files are excluded from Git and deployments. The hosting deployment is separate from publishing the source repository.

## Run checks

From `backend/`, run `..\.venv\Scripts\python.exe -m pytest -q`. From `frontend/`, run `npm run build`, `npm run typecheck`, and `$env:TEST_URL='http://127.0.0.1:3018'; npx playwright test` with the app running. The Playwright configuration uses installed Chrome. See [VALIDATION.md](VALIDATION.md) for results and limitations.
