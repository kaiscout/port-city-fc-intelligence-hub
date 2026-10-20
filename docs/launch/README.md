# Launch package — candidate 6.0

Prepared 18 October 2026. Deniz subsequently authorized publication of the public candidate only; release 6.0 is now live. LinkedIn posting and private application deployment remain unauthorized and were not performed. See the [publication record](../verification/2026-10-18-publication/README.md).

## Contents and review

- Live site: [pcfc.denizci.dev](https://pcfc.denizci.dev/) (public release 6.0, verified 18 October 2026).
- `dist/`: generated read-only candidate, containing only static synthetic assets.
- `release/`: prepared public deployment ZIP, presentation companion ZIP and SHA-256 manifest after packaging.
- Current README, club handover, methodology, KPI dictionary, traceability, UAT and readiness assessment.
- Final-build screenshots in `public/screenshots/completion-*` and refreshed narrated WebM in `walkthrough/`.
- Analytical XLSX and Power BI PBIP source. Power BI Desktop/native Excel acceptance is not implied.

Review candidate locally using `npm run site:preview`. For the private product use a new organization as described in the handover, not a seeded public-demo database. Review UAT evidence and evidence labels before a stakeholder meeting.

## Reproduce the deliverables

From the source repository, install locked dependencies, run `npm run data:build`, `npm run powerbi:build`, the verification gates, and `npm run site:build`. PowerShell 7 can then run `./scripts/package-release.ps1`. It creates separate static-public, application-source and presentation ZIPs plus a checksummed inventory under ignored `release/`; it does not upload anything. The source archive contains no Git history, installed dependencies, local environment, database, backup or test traces.

Open the delivered XLSX in Excel or the PBIP in Power BI Desktop for recipient acceptance. Power BI data-folder setup and native refresh/View As steps are in `powerbi/README.md`. The workbook authoring script uses the bundled `@oai/artifact-tool` environment; it is not an npm dependency of the application and is not required to open the delivered workbook. Formula recalculation/render checks in that engine do not substitute for native Excel acceptance.

The walkthrough folder includes narration, captured frames, the recorded video and rebuild instructions. No recorded private view contains real club data. Machine-readable current verification is linked from UAT; the release manifest identifies the exact runtime inputs independently of the unchanged base Git revision.

## Publication checklist

1. Deniz approves the candidate and the specific text/images to share.
2. Inspect the static ZIP allowlist and privacy gates; do not upload application source, environment files, dumps, original statements or staff contacts as site assets.
3. Preserve the existing hosted release for rollback; use its hosting provider's reviewed upload workflow and the already-connected pcfc.denizci.dev domain. Do not alter the parent portfolio/domain.
4. After the separately approved upload, check HTTPS, navigation, FY24 unavailable breakdowns, scenario reset/export, mobile and print. Record the deployed bundle hash and time.
5. Replace screenshots only if needed, then publish an approved LinkedIn post. Do not imply PCFC endorsement, use of verified financials, operational adoption or realized savings.

Private hosting is a separate decision: obtain the approved environment, database credentials, TLS/reverse proxy, secrets/backups, monitoring/support and club acceptance. This task does not deploy private data or connect new integrations.

## LinkedIn project entry — draft only

Deniz selected a profile project entry, not a feed post. No LinkedIn account
change or upload is authorized by the website/repository rename.

**Project name:** Port City FC Business Intelligence & Analytics

**Project URL:** https://pcfc.denizci.dev/

**Description:** Interactive analytics hub covering football club finance,
sponsorship and matchday planning. Features executive KPIs, cash-flow analysis,
sponsor delivery reporting, scenario modeling, break-even analysis and a
decision register.

Supporting deliverables include documented requirements, KPI definitions,
source-to-model reconciliation, traceability, acceptance criteria and automated
validation. The public demonstration uses synthetic and generalized data.
Independent case study—not an official club system or endorsement.

**Suggested skills:** Business Analysis, Requirements Analysis, Data Analysis,
Business Intelligence, Data Visualization.

## Short portfolio description

Designed and implemented a football business decision hub using Next.js, TypeScript and PostgreSQL. Delivered an interactive synthetic public demonstration and an authenticated operational workflow with typed records, CSV validation/atomic imports, scenario versioning, role checks and transactional audit. Built reproducible reconciliation controls, an analytical workbook and Power BI model sources. Independent case study; no claim of actual financial impact, operational adoption or club endorsement.
