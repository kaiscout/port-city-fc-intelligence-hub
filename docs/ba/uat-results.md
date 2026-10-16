# UAT and verification results

## Current stakeholder presentation release — 16 October 2026

Environment: Dell Windows, Node.js 24.19 and Chromium. The task's automatic workhorse check returned Dell fallback because both trusted Pi aliases were unresolved. Verification is by the project developer; PCFC stakeholder acceptance remains pending.

| Gate                                      | Result | Current evidence                                                                                                                                                           |
| ----------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public calculation and export regressions | Pass   | 77 independent numerical/export cases; period availability, weighted denominators, scenario equation/break-even, corrupted controls and export scope                       |
| Public browser verification               | Pass   | 94 checks; 54 fiscal-period/program/workspace combinations, real downloaded CSV contents, all exposed scenario drivers and program, search/sort, labels and print workflow |
| Mobile coverage                           | Pass   | All nine workspaces at 390 × 844; applicable filters visible, navigation usable, no horizontal page overflow                                                               |
| Model controls                            | Pass   | 24 checks calculated from the published inputs, including agreement with pipeline controls                                                                                 |
| Source-model pipeline                     | Pass   | Seven zero-difference controls; regeneration causes no processed-data drift                                                                                                |
| Power BI source structure                 | Pass   | Seven model tables, nine relationships, two roles and six visuals; regeneration causes no source drift                                                                     |
| Privacy                                   | Pass   | Repository scan; public bundle pattern check; no contact, bank-identifier, private-path or row-level financial export fields                                               |
| Formatting / lint / strict types          | Pass   | Repository checks plus final focused lint of browser, model, build and test sources                                                                                        |
| Native calculation regression             | Pass   | 21 unit/integration tests; baseline native break-even is 674 and the operating margin crosses zero between 673 and 674                                                     |
| Production build                          | Pass   | Next.js 16.4 compiles all 25 routes/endpoints                                                                                                                              |
| Production dependency audit               | Pass   | Zero production vulnerabilities                                                                                                                                            |
| Visual review                             | Pass   | Rendered desktop, mobile and A4 briefing screenshots inspected; print body text is dark and at least 10.5pt                                                                |

Machine-readable evidence is retained in [numerical verification](../verification/2026-10-16-v5/hub-numerical-verification.json) and [browser verification](../verification/2026-10-16-v5/hub-browser-verification.json). The Sites saved version records the exact source commit and deployment outcome separately.

| Acceptance scenario | Result | Evidence                                                                                                                                                                                     |
| ------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UAT-020             | Pass   | FY24 annual controls stay $63,200/$60,950/$2,250 with no invented breakdown; FY25 monthly/category totals agree; negative chart points stay within axes                                      |
| UAT-021             | Pass   | Program AND search constrain accounts, cards and downloads; sorting is functional; empty delivery percentage is unavailable; club-wide accounts appear once                                  |
| UAT-022             | Pass   | Every workspace exports substantive scoped data; all 54 combinations tested; inactive filters do not mislabel filenames                                                                      |
| UAT-023             | Pass   | Each numeric driver and scenario program tested; all attendee receipts capacity capped; full cost/community/risk equation matches exported output; break-even boundary independently checked |
| UAT-024             | Pass   | Source manifest and calculated model results are exported; missing/failed controls cannot become a passing assurance badge                                                                   |
| UAT-025             | Pass   | Dated sparklines only, no mixed-unit index, weighted capacity/returning denominators, consistent category drill-down                                                                         |
| UAT-026             | Pass   | Owner briefing contains three explicit approval requests and a printable, readable handout with the synthetic boundary retained                                                              |

### Acceptance boundary

This release is technically verified for a guided stakeholder presentation and proposed validation pilot. All public figures remain synthetic or generalized. No test result establishes PCFC financial accuracy, actual current liquidity, an approved fixture schedule, production recovery capability or stakeholder sign-off.

The in-app browser automation service timed out during this task; browser behavior was verified with the independent Chromium suite and generated screenshot review. Native Power BI Desktop refresh/render/RLS interaction and a managed-host recovery drill remain conditional. Database-backed persistence and audit evidence below are the 14 October baseline; they were not rerun on 16 October because this release changes presentation calculations and the static adapter, not persistence or authorization.

Use [stakeholder-brief.md](stakeholder-brief.md) for the meeting route, decisions and proposed pilot acceptance criteria.

## Historical technical baseline — 14 October 2026

Execution date: 14 October 2026. Executor: portfolio project developer. Environment: Dell browser verification plus a hash-matched, isolated Raspberry Pi 5 ARM64 build and PostgreSQL 17.10 test evidence. This is portfolio verification, **not Port City FC stakeholder acceptance**.

## Automated gates

| Gate                           | Result | Evidence                                                                                                      |
| ------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------- |
| Privacy boundary               | Pass   | `npm run privacy:scan`; no unexpected contacts, banking identifiers, local paths, or row-level export columns |
| Source-to-model pipeline       | Pass   | Nine generated outputs; seven reconciliation checks; every difference is zero                                 |
| Power BI source structure      | Pass   | 13 JSON documents, seven model tables, nine relationships, two RLS roles, six report visuals                  |
| Formatting and lint            | Pass   | Prettier and ESLint with zero warnings                                                                        |
| Strict typecheck               | Pass   | `tsc --noEmit`                                                                                                |
| Unit and integration tests     | Pass   | 8 files, 21 tests                                                                                             |
| Production build               | Pass   | Next.js 16.4; 25 dynamic routes/endpoints compiled                                                            |
| Dependency production audit    | Pass   | `npm audit --omit=dev --audit-level=high`; zero production vulnerabilities                                    |
| PostgreSQL migrations and seed | Pass   | Two migrations applied; deterministic organization and three scenarios created                                |
| Desktop Playwright E2E         | Pass   | 5/5 workflows, including persisted scenario and audit evidence                                                |
| Static interaction suite       | Pass   | Nine workspaces; flow/net, scenario, search, drawer, theme, and 390-pixel responsive behaviors verified       |
| Visual system review           | Pass   | Midnight football control-room shell, telemetry hierarchy, owner queue, desktop density, and mobile reflow    |
| Public Sites deployment        | Pass   | Privacy-safe interactive executive workspace published in read-only static mode and visually reviewed         |
| Narrated walkthrough           | Pass   | 3:02 WebM, four verified application views, narration source and reproducible recording scripts               |

The full development dependency tree reports five high findings in the current Next.js ESLint toolchain through `fast-glob`/`micromatch`/`braces`; it has no runtime path, and the production dependency audit is clean. The repository does not apply an unsafe forced downgrade.

## Acceptance scenarios

| ID      | Result      | Evidence / note                                                                                                                          |
| ------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| UAT-001 | Pass        | Command center presents four KPIs, interactive cash view, income mix, owner actions, and the evidence boundary                           |
| UAT-002 | Pass        | Deterministic data pipeline regenerates dimensions, facts, hashes, and seven control checks                                              |
| UAT-003 | Pass        | Privacy scan and manual review confirm role-only staffing data and no transaction/payee rows                                             |
| UAT-004 | Pass        | Route policy tests cover exact paths, nested paths, invalid roles, and denied personas                                                   |
| UAT-005 | Pass        | Entity policy tests prove each generic read/write route resolves a domain-specific permission                                            |
| UAT-006 | Pass        | PostgreSQL scenario update survives server reload and appears in the saved scenario table                                                |
| UAT-007 | Pass        | The same scenario transaction appends an organization-scoped audit event                                                                 |
| UAT-008 | Pass        | Public no-database mode loads presets, exposes no audit events, and disables mutations                                                   |
| UAT-009 | Pass        | Dashboard evidence, blocked forecast status, field aggregates, and planning boundary are visible                                         |
| UAT-010 | Pass        | Operations import preview exposes row errors before any commit boundary                                                                  |
| UAT-011 | Pass        | Sponsor risk explanation and print workflow complete in the browser test                                                                 |
| UAT-012 | Pass        | Every primary route has one level-one heading and no horizontal viewport overflow at desktop width                                       |
| UAT-013 | Pass        | Power BI project generator and validator confirm Power Query imports, DAX measures, star relationships, and RLS source                   |
| UAT-014 | Conditional | Power BI Desktop native refresh/render and Service role assignment require a machine with Power BI Desktop and an authorized workspace   |
| UAT-015 | Conditional | Backup procedure is documented; a managed-host restore drill remains an adoption prerequisite                                            |
| UAT-016 | Pass        | Public deployment exposes nine sanitized workspaces and contains no database, credentials, private contacts, or mutation workflow        |
| UAT-017 | Pass        | Walkthrough playback, opening frame, progress timeline, and audio track were visually verified in the browser                            |
| UAT-018 | Pass        | Period/program filters, cash toggle, command search, sponsor/fixture/decision drill-down, live scenario outputs, theme, and exports work |
| UAT-019 | Pass        | Chromium and in-app browser review at 390 × 844 confirm reflow, mobile navigation, usable scenario controls, and no horizontal overflow  |

## Residual acceptance work

Before organizational adoption, approved users must repeat UAT with authorized source data, real role accounts, production-like hosting, signed KPI definitions, assistive-technology coverage, and an executed backup/restore drill. The Power BI project must be opened in Desktop, refreshed, visually inspected, and tested with **View as** for both program roles. These conditions do not block the sanitized public portfolio demonstration.
