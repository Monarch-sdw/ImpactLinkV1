# Vercel deployment

The repository root contains `vercel.json`. Import that directory, not `frontend/` or `backend/` alone. The two services share one domain: Next.js handles `/`, and FastAPI handles `/api/*`.

The configuration follows Vercel's current [Services configuration](https://vercel.com/docs/services/config-reference) and [FastAPI build commands](https://vercel.com/docs/frameworks/backend/fastapi#build-command). Services is currently a Vercel beta feature. Python is pinned to 3.12 in the backend service.

## Configure before deploying

1. Import `Monarch-sdw/ImpactLinkV1` and select branch `v2`. Keep Root Directory at the repository root. Let `vercel.json` configure both services; do not override the project with a frontend-only build command.
2. Connect a managed PostgreSQL database. Use a dedicated database for this fictional demo. SQLite files cannot retain application data across Vercel function deployments; the app rejects SQLite on Vercel.
3. Set these environment variables for the appropriate Vercel environments:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection URL including the provider's SSL parameters. `postgres://`, `postgresql://`, and `postgresql+psycopg://` are supported. |
| `DATABASE_DIRECT_URL` | Direct PostgreSQL URL for migrations when `DATABASE_URL` is a transaction-pooler URL. Omit if `DATABASE_URL` already uses a direct connection. |
| `JWT_SECRET` | A stable random secret of at least 32 characters. |
| `DEMO_MODE` | `true` to enable fictional accounts, sample data, and one-click super-admin login. |
| `COOKIE_SECURE` | `true` for HTTPS. This is also the Vercel default. |
| `CORS_ORIGINS` | Comma-separated HTTPS origins, without trailing slashes, for every production/custom/branch alias you will use. The generated `VERCEL_URL` origin is included automatically. |

The frontend needs no public database URL or secret. Leave `API_URL` unset on Vercel: the browser uses the same-origin `/api` routes. Use separate Preview and Production databases to keep preview testing out of the main demo.

## What happens during a build

The backend service runs `python -m app.bootstrap` after installing dependencies. It upgrades Alembic to the latest revision, then adds demo records when `DEMO_MODE=true`. A direct PostgreSQL connection and advisory lock serialize simultaneous deployment setup. Runtime requests do not run migrations or seed data.

On an empty database the seed creates 93 fictional organizations, 31 projects, 15 offers, 100 sample volunteer profiles, and demo users for all offer owners. The two new applicant organizations stay pending; their project and offer are private until approval. Existing approved fictional examples remain available for matching.

Subsequent builds preserve account decisions, edits, commitments, and deliveries. Missing approval-demo roles are added by email; existing data is never reset. Sample dates are relative to the first seed. As that dataset ages or capacity is consumed, create new projects/offers through the app to demonstrate fresh matching.

For manual setup, run from `backend/` with these environment variables configured:

```sh
python -m pip install -r requirements.txt
python -m app.bootstrap
```

`DEMO_MODE=false` creates/upgrades the schema without adding demo users. A non-demo installation needs a separately provisioned super-admin account. One-click demo accounts intentionally grant the displayed role; use the hosted demo only with fictional data.

## Check the deployed app

1. Open `/api/health`; confirm `status: ok` and `demo_mode: true`.
2. Open `/login` and select **Super admin**. Review **New Horizons Foundation · Demo** and **Northstar CSR Fund · Demo** in Account approvals.
3. Select an applicant demo account and inspect its private project/offer and Organization account page.
4. Approve the application with a note. Its project/offer should appear in public results after refresh. Rejecting/removing approval hides it again and prevents new matching or stale request acceptance.
5. Refresh or redeploy and confirm that decisions and records persist. Try the NGO organizer and a contributor to check the request, acceptance, and delivery workflow.

Build, migrations/seeding on SQLite, API authorization, and local browser flows have been tested. A real Vercel deployment and the PostgreSQL runtime have not been executed in this workspace; they require the configured hosting project and database.
