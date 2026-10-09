# Vercel deployment

The repository root contains `vercel.json`. Import that directory, not `frontend/` or `backend/` alone. The two services share one domain: Next.js handles `/`, and FastAPI handles `/api/*`.

The configuration follows Vercel's current [Services configuration](https://vercel.com/docs/services/config-reference) and [FastAPI build commands](https://vercel.com/docs/frameworks/backend/fastapi#build-command). Services is currently a Vercel beta feature. Python is pinned to 3.12 in the backend service.

## Configure before deploying

1. Import `Monarch-sdw/ImpactLinkV1` and select branch `v2`. Keep Root Directory at the repository root. Let `vercel.json` configure both services; do not override the project with a frontend-only build command.
2. Connect a managed PostgreSQL database. Use a dedicated database for this fictional demo. SQLite files cannot retain application data across Vercel function deployments; the app rejects SQLite on Vercel.
3. Set these environment variables for the appropriate Vercel environments:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection URL including the provider's SSL parameters. `POSTGRES_URL` is also recognized automatically. `postgres://`, `postgresql://`, and `postgresql+psycopg://` are supported. |
| `DATABASE_DIRECT_URL` | Direct PostgreSQL URL for migrations when the runtime URL is a transaction-pooler URL. `DATABASE_URL_UNPOOLED` and `POSTGRES_URL_NON_POOLING` are also recognized. Omit if the runtime URL already uses a direct connection. |
| `JWT_SECRET` | A stable random secret of at least 32 characters. |
| `DEMO_MODE` | `true` to enable fictional accounts, sample data, and one-click super-admin login. |
| `COOKIE_SECURE` | `true` for HTTPS. This is also the Vercel default. |
| `CORS_ORIGINS` | Comma-separated HTTPS origins, without trailing slashes, for every production/custom/branch alias you will use. The generated `VERCEL_URL` origin is included automatically. |

The frontend needs no public database URL or secret. Leave `API_URL` unset on Vercel: the browser uses the same-origin `/api` routes. Use separate Preview and Production databases to keep preview testing out of the main demo.

## What happens during a build

The backend service runs `python build.py` after installing dependencies. It checks the hosted database and signing-secret settings before importing the database code, then runs the bootstrap routine. It upgrades Alembic to the latest revision and adds demo records when `DEMO_MODE=true`. A direct PostgreSQL connection and advisory lock serialize simultaneous deployment setup. Runtime requests do not run migrations or seed data.

## Fixing a failed bootstrap build

`Command "python -m app.bootstrap" exited with 1` is the old build's final summary, not its underlying Python error. Redeploy the latest `v2` commit, which uses `python build.py` and prints an explicit configuration diagnosis. Remove any old Build Command override in Vercel Project Settings so the service commands in `vercel.json` apply.

In Vercel, connect a PostgreSQL database through Storage, or add its connection URL as `DATABASE_URL` or `POSTGRES_URL` under Settings > Environment Variables. Also add `JWT_SECRET` (at least 32 random characters) and `DEMO_MODE=true`. Assign the variables to the deployment's actual environment: Production and/or Preview. Saving environment variables requires a new deployment before they apply.

The runtime prefers `DATABASE_URL`, then `POSTGRES_URL`, then an available direct URL. Migrations prefer `DATABASE_DIRECT_URL`, `DATABASE_URL_UNPOOLED`, or `POSTGRES_URL_NON_POOLING`. Blank variables are ignored, and hosted deployments do not load a local `.env` file. Database connections have a 15-second connection timeout.

The build deliberately remains unsuccessful when required settings are absent or database setup fails; it never substitutes temporary storage or publishes an app whose account data cannot persist. No hosted database credentials are included in Git. See Vercel's [environment configuration guide](https://vercel.com/docs/environment-variables/manage-across-environments).

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
