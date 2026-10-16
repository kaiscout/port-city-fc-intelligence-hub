# Requirements Catalog

## Business requirements

| ID     | Requirement                                                                                              | Measure                        |
| ------ | -------------------------------------------------------------------------------------------------------- | ------------------------------ |
| BR-001 | Leadership can connect program growth to profitability, retention, sponsor value, readiness, and impact. | One filtered command center    |
| BR-002 | Matchday choices use transparent break-even and downside evidence.                                       | Reproducible formulas          |
| BR-003 | Sponsor delivery risk is visible before renewal decisions.                                               | Explainable rule output        |
| BR-004 | Men’s and women’s programs are compared on equivalent definitions.                                       | Shared/program cost visibility |
| BR-005 | Community claims distinguish official context from operational evidence.                                 | Six provenance classes         |
| BR-006 | The pilot can operate without replacing current platforms.                                               | Manual/CSV path complete       |

## Functional requirements

| ID     | Requirement                                                                                                                                | Priority | Implementation                     |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------ | -------- | ---------------------------------- |
| FR-001 | Applicable period/program filters constrain supported measures and exports consistently; unsupported dimensions are explicit and disabled. | Must     | Public Hub scope contract          |
| FR-002 | KPI cards expose definition and evidence class; comparisons and time trends appear only when a valid same-grain source is available.       | Must     | KPI dictionary and model selectors |
| FR-003 | Users create, name, save, edit, duplicate, compare, delete, and export scenarios.                                                          | Must     | Scenario lab                       |
| FR-004 | Scenario formulas calculate all specified revenue, cost, margin, break-even, utilization, and downside outputs.                            | Must     | `calculateScenario`                |
| FR-005 | Funnel views expose stage conversion/drop-off, channel performance, cohorts, and fixtures.                                                 | Must     | Fan funnel                         |
| FR-006 | Sponsor profiles store contacts, package, value, dates, program, delivery, exposure, reach, risk, notes, and action.                       | Must     | Sponsorship workspace              |
| FR-007 | Renewal risk is rules-based and explains contributing signals.                                                                             | Must     | `assessSponsorRisk`                |
| FR-008 | Program comparison exposes equivalent metrics and a women’s investment case.                                                               | Must     | Program equity                     |
| FR-009 | Community records show participation, attendance, partners, hours, giving, reach, initiative, and trend.                                   | Must     | Community impact                   |
| FR-010 | Reports export active application data and carry filters/date/methodology/source notes.                                                    | Must     | Reports & exports                  |
| FR-011 | Administrator can maintain every named data domain.                                                                                        | Must     | Operations studio + CRUD API       |
| FR-012 | CSV imports provide template, preview, row errors, duplicates, and transactional boundary.                                                 | Must     | CSV controls + import API          |
| FR-013 | Onboarding configures org, season, teams, venue, categories, targets, users, and mode.                                                     | Must     | First-run onboarding               |
| FR-014 | Administrator provisions users and assigns one of six roles.                                                                               | Must     | User management + schema           |
| FR-015 | Important writes append an audit event.                                                                                                    | Must     | Transactional server handlers      |
| FR-016 | Demonstration seed is deterministic; clean organization contains no synthetic records.                                                     | Must     | Seed/clean scripts                 |
| FR-017 | Sponsor and executive reports are print optimized.                                                                                         | Must     | Print CSS and report views         |
| FR-018 | In-app help exposes calculations, operating guidance, and integration boundaries.                                                          | Should   | Help section                       |

## Non-functional requirements

| ID      | Requirement                                                                                   | Verification                      |
| ------- | --------------------------------------------------------------------------------------------- | --------------------------------- |
| NFR-001 | Server enforces role authorization on protected writes.                                       | RBAC/unit/integration tests       |
| NFR-002 | Passwords use Argon2id; session cookie is signed, HTTP-only, secure in production, same-site. | Password/session review           |
| NFR-003 | State-changing APIs reject cross-origin requests.                                             | Guard review/integration coverage |
| NFR-004 | Login is rate-limited and returns generic errors.                                             | Auth route review                 |
| NFR-005 | Inputs use Zod and database constraints; SQL is parameterized.                                | Code/schema review                |
| NFR-006 | CSV size, type, schema, duplicate, and formula-injection risks are controlled.                | CSV tests                         |
| NFR-007 | UI meets WCAG AA intent, keyboard/focus/reduced-motion/table alternatives.                    | E2E/manual accessibility QA       |
| NFR-008 | Layout is intentionally responsive at 1440×900, 1024, and 390×844.                            | Screenshot/E2E QA                 |
| NFR-009 | Structured logs exclude secrets and sensitive request bodies.                                 | Logger review                     |
| NFR-010 | PostgreSQL migration and recovery procedures are reproducible.                                | Migration/backup docs             |
| NFR-011 | Environment values are validated; production rejects demo mode.                               | Env unit/build checks             |
| NFR-012 | Production build, lint, format, typecheck, unit, integration, and E2E gates pass.             | CI-equivalent command record      |
