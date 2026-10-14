# UAT and verification results

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
