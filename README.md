# Port City FC Business Intelligence & Analytics

A sanitized, recruiter-facing business-analysis portfolio project that turns a mixed evidence pack into an executive decision product, a governed PostgreSQL workflow, and a reproducible Power BI model.

> **Evidence boundary:** every public figure is synthetic or deliberately generalized. This repository contains no staff identities or contact channels, bank or transaction rows, payees, private filenames, document hashes, or attributed messages. It is an independent portfolio case study, not an audited financial statement and not an official Port City FC system.

## Portfolio deliverables

- **Live read-only demo:** [pcfc.denizci.dev](https://pcfc.denizci.dev/)
- **Three-minute walkthrough:** [`walkthrough/port-city-fc-intelligence-hub-walkthrough.webm`](walkthrough/port-city-fc-intelligence-hub-walkthrough.webm)
- **Analytical workbook:** [`outputs/01a128c4-1c8c-71b0-819c-29eaae5a311f/PortCityFC_Analytics_Companion.xlsx`](outputs/01a128c4-1c8c-71b0-819c-29eaae5a311f/PortCityFC_Analytics_Companion.xlsx)
- **Power BI project:** [`powerbi/PortCityFCCompanion/PortCityFCCompanion.pbip`](powerbi/PortCityFCCompanion/PortCityFCCompanion.pbip)
- **Stakeholder presentation:** [`docs/ba/stakeholder-brief.md`](docs/ba/stakeholder-brief.md), also available in the Hub through **Owner briefing** with a printable handout.

The hosted demo is a purpose-built football business control room with nine decision views, a midnight telemetry interface, interactive drill-downs, and an accountable owner queue. It publishes no runtime database, credentials, mutation endpoint, or private evidence. The full repository retains the locally verified PostgreSQL scenario-and-audit vertical slice.

The project was renamed on 18 October 2026. The repository URL and historical
artifact filenames remain unchanged to preserve existing links. The public
site is versioned separately; this naming-only commit does not publish the
uncommitted application work from the local development checkout. Historical
recordings retain their original branding and are not evidence of club adoption.

## What this proves

- **Executive communication:** a high-density decision cockpit connects cash, commercial concentration, matchday readiness, program equity, accountable actions, and explicit evidence limits.
- **Business analysis:** charter, requirements, process maps, RACI, RAID, KPI definitions, UAT, and traceability stay connected to current product behavior.
- **Data engineering:** raw public inputs build deterministic dimensions/facts, SHA-256 manifests, and seven zero-difference reconciliation checks.
- **Application engineering:** Next.js, TypeScript, PostgreSQL, migrations, organization scoping, secure sessions, route policies, entity permissions, and transactional audit writes.
- **BI engineering:** a source-controlled Power BI Project (`.pbip`) with Power Query, DAX, a star-schema constellation, and program-level RLS roles.
- **Delivery discipline:** privacy scanning, cross-platform formatting, automated interaction tests, database-backed E2E verification, CI, and a read-only public deployment mode.

## Product tour

![Sanitized Port City FC executive command center](public/screenshots/executive-command-center.png)

| Workspace           | Decision purpose                                              | Interactive behavior                                             |
| ------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------- |
| Command center      | What changed and what needs owner attention now?              | KPI trends, flow/net toggle, category drill-down, decision queue |
| Finance & cash      | Where are liquidity and spend concentration under pressure?   | Period filter, monthly rhythm, evidence drawer, CSV export       |
| Commercial          | Where are sponsor, delivery, and acquisition risks?           | Sponsor search/drill-down, funnel and channel analysis           |
| Matchday operations | Are modeled home fixtures operationally and economically fit? | Program filter, fixture cards, unit-economics drill-down         |
| Program equity      | How do equivalent Men’s and Women’s program drivers compare?  | Like-for-like KPIs and fixture evidence                          |
| Scenario lab        | What changes under attendance, pricing, and cost assumptions? | Live sliders, presets, waterfall, break-even and export          |
| Decision register   | Who owns each finding, recommendation, and due date?          | Priority/status filters and executive detail drawers             |
| Data quality        | Why should a reviewer trust the public model?                 | Reconciliation controls, lineage, freshness and privacy rules    |
| Access & audit      | Who can do what and what changed?                             | Permission contract and synthetic audit evidence                 |

Global conveniences include cross-workspace filters, `Ctrl+K` navigation, responsive mobile navigation, dark control-room and light presentation themes, tooltips, print-ready meeting briefs, local CSV exports, alerts, and a persistent evidence-boundary explanation.

## Stakeholder review contract

The current presentation is a **proposal for a controlled validation pilot**. PCFC acceptance, actual-data reconciliation, current cash balances, an approved home/away split and production adoption remain decisions for authorized stakeholders.

- The finance selector changes **FY24/FY25 club-wide cash measures**. FY24 has annual totals only; the interface and CSV leave its monthly/category breakdown unavailable.
- Program selection changes the **2026 synthetic fixture and sponsor samples**. It does not allocate cash or acquisition measures to programs. Club-wide sponsor accounts are included once in each program view; program totals must not be added together.
- The **2026 club-wide acquisition sample** is a separate scope with no program attribution. Contract face value, cash receipts, acquisition volumes and season scenarios are never silently combined.
- Inapplicable global controls are disabled. Sponsor program, search and sort share one selector; exported records and measures match the visible selection.
- Cards carry evidence labels, time sparklines have dated sequences, program comparisons retain their units, and displayed controls are calculated rather than hard-coded success badges.
- Every workspace export contains its data, definitions of scope and synthetic evidence boundary. Scenario exports include all inputs and outputs. CSVs retain calculation precision while cards use presentation rounding.

The formula specification and independent worked example are in [`docs/operations/calculation-methodology.md`](docs/operations/calculation-methodology.md). The supplied walkthrough illustrates the separate native application and architecture; use the current live Hub and Owner briefing for this presentation.

## Architecture

```mermaid
flowchart LR
  A[Sanitized CSV inputs] --> B[Deterministic TypeScript pipeline]
  B --> C[Conformed dimensions and facts]
  B --> D[Reconciliation manifest]
  C --> E[Next.js decision hub]
  C --> F[Power BI semantic model]
  G[Signed session] --> H[Route and entity policy]
  H --> E
  E --> I[(PostgreSQL)]
  I --> J[Scenario transaction]
  J --> K[Audit event in same transaction]
  D --> L[CI release gate]
  F --> M[Program RLS]
```

The public deployment is a static privacy-safe adapter generated from the same sanitized source model. It performs local filtering, scenario calculation, drill-down, export, and theme persistence without a server or database. The full Next.js application uses `PUBLIC_DEMO_MODE=true` for read-only pages and scenario feeds; local and CI verification exercise its PostgreSQL workflow separately.

## Quick start

Requirements: Node.js 24+, npm, and optionally Docker for the database-backed workflow.

```bash
npm ci
npm run data:build
npm run dev
```

Open `http://127.0.0.1:3000/ownership`. Development mode defaults to a read-only demonstration if no database is configured.

To preview the exact recruiter-facing static deployment on loopback:

```bash
npm run site:preview
```

Open `http://127.0.0.1:4173`. `npm run site:check` validates the generated bundle and privacy patterns. `npm run site:test` runs independent numerical/export regression cases, then Chromium checks the 54 period/program/workspace combinations, downloaded CSV contents, every scenario driver, sponsor search/sort, negative cash charts, evidence labels, the owner handout, and nine mobile workspaces. Machine-readable execution reports are written to `test-results/hub-numerical-verification.json` and `test-results/hub-browser-verification.json`.

For the complete persisted scenario workflow:

```bash
docker compose up -d postgres
cp .env.example .env.local
# Replace SESSION_SECRET and DEMO_ADMIN_PASSWORD in .env.local.
npm run db:migrate
npm run db:seed
npm run dev
```

Sign in with the local demonstration account shown on the login page and the password you set in `DEMO_ADMIN_PASSWORD`.

## Source-to-model pipeline

`npm run data:build` reads the small, reviewable files in `data/raw/`, validates privacy and control totals, and regenerates `data/processed/`.

Release gates currently prove:

- monthly inflow = category inflow = **$67,500**;
- monthly outflow = category outflow = **$63,700**;
- net cash = **$3,800**;
- all 12 months and both modeled programs are present;
- all seven checks pass with a difference of zero; and
- output hashes are recorded in `data/processed/reconciliation.json`.

Run `npm run data:check` after the repository has been initialized; it rebuilds the model and fails if generated outputs drift.

## PostgreSQL and audit workflow

The Scenario Lab is the complete vertical slice:

1. the client loads organization-scoped scenarios from `/api/scenarios`;
2. route and server permission checks require `scenarios:read` or `scenarios:write`;
3. Zod validates the command;
4. PostgreSQL creates or versions the scenario; and
5. the corresponding audit event commits in the same transaction.

Deletes are also organization-scoped and audited. The UI reloads from the server after each command and presents the recent scenario audit trail. Public mode returns read-only presets and rejects writes.

## Authorization model

- Page routes use explicit policies (`lib/auth/policies.ts`) rather than a blanket “signed in” check.
- API handlers repeat authorization on the server; UI visibility is never the control boundary.
- Generic entity endpoints resolve entity-specific read and write permissions.
- Database queries include `organization_id` in their predicate.
- Signed JWT claims are validated for issuer, audience, expiry, and known role; persisted sessions can be revoked.
- Same-origin checks protect state-changing requests.

The complete matrix is in [`docs/operations/permission-matrix.md`](docs/operations/permission-matrix.md).

## Power BI companion

Open [`powerbi/PortCityFCCompanion/PortCityFCCompanion.pbip`](powerbi/PortCityFCCompanion/PortCityFCCompanion.pbip) in Power BI Desktop, replace the `DataRoot` parameter with the absolute path to `data/processed`, and refresh.

The semantic model includes:

- `DimDate`, `DimProgram`, `DimMetric`, and `DimCategory`;
- finance, category, and operations fact tables at documented grains;
- one-direction, one-to-many relationships;
- DAX measures for inflow, outflow, net cash, margin, category amount, attendance, and ticket price; and
- `MenProgramViewer` and `WomenProgramViewer` RLS roles on `DimProgram`.

`npm run powerbi:build` regenerates the PBIP source; `npm run powerbi:check` fails on drift. See [`powerbi/README.md`](powerbi/README.md) for the Power Query, DAX, RLS, and Desktop validation checklist.

The analytical workbook in `outputs/01a128c4-1c8c-71b0-819c-29eaae5a311f/` provides an Excel-friendly Ownership Snapshot, reconciliations, model map, and data dictionary from the same processed data.

## Verification

```bash
npm run privacy:scan
npm run data:check
npm run powerbi:check
npm run site:check
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run build
npm run site:test
E2E_DATABASE_URL=postgres://... npx playwright test --project=desktop
```

CI runs this sequence against PostgreSQL 17 and retains Playwright evidence on failure. The current execution record is in [`docs/ba/uat-results.md`](docs/ba/uat-results.md), with requirement links in [`docs/ba/traceability-matrix.md`](docs/ba/traceability-matrix.md).

## Repository map

```text
app/                 Next.js pages and protected API routes
components/          Decision UI, filters, charts, and server-backed scenario state
data/raw/            Sanitized source inputs under review limits
data/processed/      Generated dimensions, facts, hashes, and reconciliation
docs/                BA artifacts, controls, UAT, traceability, and operations
lib/auth/            Session, RBAC, route policies, and server guards
powerbi/             PBIP, Power Query, DAX, TMDL model, PBIR report, and RLS
prisma/migrations/   PostgreSQL schema and permission evolution
scripts/             Pipeline, PBIP generator, migrations, seed, backup, privacy scan
site/                Source for the nine-workspace recruiter-facing static deployment
tests/               Unit, integration, and Playwright E2E coverage
walkthrough/         Narration, reproducible recorder, application frames, and final video
```

## Known limits

- Public figures demonstrate the analysis method; they must not be treated as club actuals.
- The public site is deliberately read-only and has no database or production credentials.
- Power BI Desktop is required for the final native render, visual interaction check, and Service role assignment.
- Organizational adoption would require approved source contracts, KPI sign-off, real-role UAT, accessibility testing with target users, and an executed recovery drill.

See [`docs/ba/production-readiness-assessment.md`](docs/ba/production-readiness-assessment.md) for the full decision boundary.
