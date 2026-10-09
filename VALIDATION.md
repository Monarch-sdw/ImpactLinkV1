# Validation - 10 October 2026

Tested in the dimpact/ImpactLink/mvp repository. Local app: http://localhost:3018. API: http://localhost:8018. The separate original app was not stopped or changed.

| Check | Result |
| --- | --- |
| Backend pytest | 35 passed after deployment configuration patch |
| Next.js production build | Passed, Next.js 15.5.27 |
| Standalone TypeScript check | Passed |
| Chrome Playwright | 8 passed |
| Fresh migration and repeatable demo setup | Passed on SQLite |
| Demo-disabled setup | Schema created without demo accounts |
| Git diff whitespace | Passed |
| Tracked secrets and databases | None |

## Approval coverage

Backend tests cover NGO/CSR pending registration, private organization/project/offer visibility, public dashboard filtering, owner access, super-admin-only decisions, required notes, review history, duplicate/concurrent decisions, profile changes returning to review, and prevention of client-supplied privileges. Rejection blocks stale request acceptance as well as new matching.

Desktop NGO and mobile CSR browser journeys cover registration, private resources, super-admin approval, reload persistence, removal of approval, and applicant sign-in to read the decision. Both seeded pending applicants remain available for manual review.

The other browser journeys cover named causes, keyboard tabs, reduced motion, matching, request/acceptance, delivery, offer editing/deactivation, multi-requirement project creation, verification, and mobile navigation. Backend tests also retain capacity concurrency, ownership, cancellation, delivery limits, and separate funding/volunteer metrics.

## Visual and data checks

Desktop and mobile approval screens were inspected: square surfaces/buttons, bold type, ink/white/cobalt colors, and no horizontal page overflow. Screenshots are in ignored .runtime/product-*.png. Motion uses one shared visibility observer and short transitions, with reduced-motion support.

The existing local database was backed up to .runtime/before-listing-approval.db before migration. Existing records were retained. Fresh setup creates 93 organizations, 31 projects, 15 offers, and the super-admin/applicant demo roles. A second bootstrap preserves counts, listing decisions, and edits. Vercel startup rejects SQLite.

Browser tests leave labelled fictional projects, offers, and rejected test applications in this local database. Startup never resets existing demo activity.

## Git and deployment

Release branch: v2. Repository: Monarch-sdw/ImpactLinkV1. This release was prepared from ea61ecc92c487e96940fb0caeca930e3f4a0e853 in the original ImpactLink repository. Publishing the source is authorized; hosting deployment remains separate.

Vercel configuration was checked against current official Services/FastAPI documentation and the live schema's Services support. [DEPLOYMENT.md](DEPLOYMENT.md) documents persistent PostgreSQL, build-time migrations/seeding, and required environment variables.

A real PostgreSQL database, Docker runtime, and live Vercel deployment were not exercised. Browser checks used Chrome. Starlette/AnyIO emits one test-only deprecation warning.

## Deployment configuration patch

The bootstrap exit was reproduced with VERCEL enabled and no database URL. The hosted error supplied only the final command exit, so its exact underlying exception could not be confirmed. Runtime and migration configuration now recognize provider-injected PostgreSQL variables, ignore blank values, and avoid local dotenv files on Vercel. A build entrypoint reports configuration errors before importing the database and applies a connection timeout. Tests cover URL precedence, direct migration connections, missing settings, invalid hosted SQLite, and a complete migration/demo setup through the build entrypoint. All 35 backend tests passed. UI files were unchanged in this patch; prior browser/build results above remain the latest UI validation.
