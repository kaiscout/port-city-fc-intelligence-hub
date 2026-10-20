# Port City FC Business Intelligence & Analytics

A football business-analysis portfolio product with a privacy-safe public demonstration and a separate authenticated PostgreSQL operating workspace.

The project was renamed on 18 October 2026. The public domain and repository URL
remain stable; dated release evidence, recordings and artifact filenames retain
their historical identity rather than being retroactively rewritten.

> Every public figure is synthetic or deliberately generalized. This is an independent case study, not an audited statement, official club system, endorsement or claim of operational adoption. Public release 7 was published on 18 October 2026. The private application remains separate and was not deployed.

## Design refinement

The latest interface refinement adds a consistent PCFC design system and an animated, persistent Scenario Lab graph with plain-language controls. See the [design and verification record](docs/verification/2026-10-18-design/README.md), including desktop/mobile comparisons and the preserved calculation boundaries.

## Review the result

- Live release 7: [pcfc.denizci.dev](https://pcfc.denizci.dev/) — [design and publication record](docs/verification/2026-10-18-design/README.md). The [release 6 record](docs/verification/2026-10-18-publication/README.md) is retained as history.
- [Club handover](docs/operations/club-handover.md): configuration, routine reporting, CSV imports, permissions and recovery.
- [Current execution record](docs/ba/uat-results.md) and [readiness assessment](docs/ba/production-readiness-assessment.md).
- [Calculation methodology 3.0](docs/operations/calculation-methodology.md), [KPI dictionary](docs/ba/kpi-dictionary.md), [traceability](docs/ba/traceability-matrix.md).
- [Launch drafts and publication checklist](docs/launch/README.md).
- [Analytical workbook](outputs/01a128c4-1c8c-71b0-819c-29eaae5a311f/PortCityFC_Analytics_Companion.xlsx).
- [Power BI companion project](powerbi/PortCityFCCompanion/PortCityFCCompanion.pbip), including source-validation limitations.
- [Refreshed narrated walkthrough](walkthrough/port-city-fc-intelligence-hub-walkthrough.webm).

## Two honest modes

The static demonstration is a nine-workspace control room: finance, fixtures, programs, sponsor delivery, acquisition examples, decisions, scenarios, quality and access. It offers fiscal/program filtering, evidence drill-down, searching, sorting, CSV exports, print briefing, responsive navigation and local theme preferences. No private database, credentials or mutation API is published.

The private application uses only records entered into the signed-in organization. A clean organization begins empty. Operations studio supports typed seasons, teams/programs, competitions, venues, fixtures, attendance, receipts, direct/allocated costs, sponsors, deliverables and actions. Approved records feed the dashboards; missing data remains unavailable. Settings and account administration persist. Scenario revisions, comparisons and exports are durable, and writes append audit events in the same transaction.

No ticketing, accounting, banking, email or social integration is implied. Reliable manual and CSV reporting is the implemented route.

## Quick start: static demonstration

Requirements: Node.js 24, npm.

```sh
npm ci
npm run data:build
npm run site:preview
```

Open `http://127.0.0.1:4173`. `npm run site:build` prepares `dist/`; it does not publish. Static calculations share the scenario engine with the native application.

## Quick start: private application

Use a dedicated development PostgreSQL database. The supplied Compose database is loopback-only and has a development-only password; it is not a production service.

```sh
docker compose up -d postgres
# Copy .env.example to .env.local using your shell.
# Set DATABASE_URL, a new SESSION_SECRET (32+ characters),
# APP_URL=http://127.0.0.1:3000, DEMO_MODE=false,
# PUBLIC_DEMO_MODE=false and LOCAL_PREVIEW_MODE=false.
npm run db:migrate
# Set CLEAN_ORG_NAME, CLEAN_ADMIN_EMAIL, CLEAN_ADMIN_PASSWORD (12+ characters).
npm run db:clean-org
npm run dev
```

Sign in at `http://127.0.0.1:3000/login` with the administrator you provisioned. No default account is advertised or accepted by the login screen. Configuration and data ownership are the first tasks. `db:seed` is exclusively for an isolated synthetic test environment and requires explicit demo mode; never use it for a real club organization.

For a production-mode local check, use `npm run build` then `npm run start` with the same private environment. Production refuses missing database/session configuration or a database-connected public mode. `APP_URL` must match the external origin and reverse proxies must preserve Host; writes reject missing or foreign origins. HTTPS is required outside loopback.

## Data and architecture

Public raw sources → deterministic TypeScript generation → dimensions/facts/reference JSON + SHA-256 reconciliation → static hub, native demonstration, workbook and Power BI source. FY25 months/categories reconcile independently; FY24 stays annual-only.

Private: signed session → current database session/user validation → route/entity permission + organization filter → typed domain validation → transactional record/settings/scenario + audit → approved-record workspace feed. Version checks reject stale writes. CSV preview and explicit atomic commit have separate persisted states; content checksums and stable record identities prevent repeats.

`site/model.js` is the canonical scenario engine. Both clients use explicit scope, home count, sponsorship frequency, costs and receipt allowances. No home schedule, growth target, ROI or new business default is invented. See methodology for the independent worked example and the correction from legacy before-allowance native results.

## Verification

```sh
npm run verify
npm run site:check
npm run site:test
npm run db:migrate
# Seed only the isolated synthetic verification database, with an explicit test password.
E2E_DATABASE_URL=... npx playwright test
```

`CHROMIUM_EXECUTABLE_PATH` can point to system Chromium. Tests cover independent calculations, zero/missing values, relationships, CSV parsing/atomicity, actual APIs, durable analytics, corrections, scenario versions, user provisioning and access isolation. Reports distinguish current runs from historical evidence. Native Excel and Power BI Desktop checks are not implied by source or artifact-engine validation.

CI runs privacy, regeneration drift, format/lint/types, unit/integration, build, static numerical/browser checks and database E2E. A green local run is not a claim that an unpushed change has passed hosted CI.

## Publication and operational adoption

Prepare static `dist/` and the handover package for review. Do not copy `.env*`, credentials, database dumps, original statements, private contacts, node_modules or test traces into a public upload. The package script uses an explicit safe allowlist.

Posting LinkedIn or replacing the hosted demonstration requires Deniz's separate approval. Private operational deployment additionally requires club source owners, reviewed actual data, role/account approval, TLS, managed secrets/backups, a restore owner, support and stakeholder UAT. Authentication throttling is process-local; use a trusted upstream limiter before multi-instance or internet-exposed private deployment.

No production data or hosted service was migrated to the Pi. Development execution uses isolated synthetic staging while the primary source remains on the Dell.
