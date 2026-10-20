# User acceptance test plan

## Objective

Confirm that a reviewer can understand the executive decision story, reproduce the public model, verify the evidence boundary, and complete the governed scenario workflow without exposing private data.

## Entry criteria

- sanitized source review and automated privacy scan pass;
- deterministic pipeline and reconciliation pass;
- format, lint, strict typecheck, unit/integration tests, and production build pass;
- isolated PostgreSQL cluster is available for migration, seed, and scenario tests; and
- the public-mode build has no database or credentials.

## Scenarios

| ID      | Persona             | Scenario                                                       | Expected result                                                                                                                        |
| ------- | ------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| UAT-001 | Ownership           | Review the Ownership Snapshot                                  | Four KPIs, trend/mix, decisions, owners, gates, and evidence boundary fit the executive view                                           |
| UAT-002 | Data analyst        | Regenerate the public model                                    | Outputs and hashes are deterministic; all seven controls pass                                                                          |
| UAT-003 | Privacy reviewer    | Inspect source, public data, and generated artifacts           | No staff identities/contact channels, banking identifiers, payees, transaction rows, or private paths                                  |
| UAT-004 | Unauthorized role   | Navigate directly to a restricted page                         | Route policy sends the user to the forbidden boundary                                                                                  |
| UAT-005 | Domain user         | Read a generic entity outside the role's domain                | Entity-specific server permission denies the read                                                                                      |
| UAT-006 | Analyst             | Edit and save a scenario                                       | PostgreSQL versioned row persists and reloads in the portfolio table                                                                   |
| UAT-007 | Administrator       | Inspect the scenario audit trail                               | Actor, action, entity, summary, and time appear from the same committed operation                                                      |
| UAT-008 | Public viewer       | Open Scenario Lab on the public deployment                     | Presets load; save/duplicate/delete are disabled; no database is required                                                              |
| UAT-009 | Executive           | Review Command Center evidence gates                           | Reconciled, provisional, and blocked subjects are visibly distinct                                                                     |
| UAT-010 | Operations          | Preview an invalid attendance import                           | Row errors appear before commit; no partial write occurs                                                                               |
| UAT-011 | Commercial          | Review sponsor risk and print                                  | Explanation and printable output are available                                                                                         |
| UAT-012 | Reviewer            | Navigate every primary route                                   | One H1 per page and no horizontal viewport overflow                                                                                    |
| UAT-013 | BI developer        | Regenerate and validate the PBIP source                        | Tables, measures, relationships, visuals, and RLS source pass structural checks                                                        |
| UAT-014 | BI reviewer         | Refresh in Power BI Desktop and use **View as**                | Visuals render and Men/Women roles filter program facts as designed                                                                    |
| UAT-015 | Service owner       | Restore a backup into isolation                                | Checksum and row counts reconcile before controlled cutover                                                                            |
| UAT-016 | Public viewer       | Navigate the deployed executive workspace                      | Nine privacy-safe views load without database access or mutation controls                                                              |
| UAT-017 | Recruiter           | Play the three-minute walkthrough                              | Problem, evidence boundary, finding, decision, architecture, and next step are understandable                                          |
| UAT-018 | Executive           | Filter, drill down, search, and stress-test                    | Controls respond immediately; scenario outputs change; evidence remains clearly labeled                                                |
| UAT-019 | Mobile reviewer     | Use the public hub at 390-pixel width                          | Navigation opens, cards reflow, core controls remain usable, and no horizontal overflow appears                                        |
| UAT-020 | Finance reviewer    | Switch FY24/FY25 and inspect display and CSV                   | Annual controls match; FY24 has no invented monthly/category detail; negative net months remain within chart axes                      |
| UAT-021 | Commercial reviewer | Combine program, search, sort, empty results and export        | Rows, KPI denominators and exports use the same selection; club-wide accounts appear once; empty delivery percentage is unavailable    |
| UAT-022 | Reviewer            | Export all nine views in each applicable filter context        | The 54 period/program/view combinations contain substantive data and evidence scope; inactive filters do not mislabel filenames        |
| UAT-023 | Analyst             | Exercise every scenario input, program and break-even boundary | Full equation, capacity caps, risk/community deductions, preset state and CSV inputs/outputs agree; infeasible thresholds are explicit |
| UAT-024 | Data reviewer       | Inspect manifest, model controls and corrupted-data cases      | Checks are calculated; missing/failing results never become an assurance score or a club-data verification label                       |
| UAT-025 | Analyst             | Review charts and program measures                             | Dated sequences only; no combined unlike-unit index; capacity fill and returning share use weighted denominators                       |
| UAT-026 | Presenter           | Open and print Owner briefing                                  | Three evidence-based requests are explicit; synthetic boundary remains visible; print text is dark and at least 10.5pt                 |

## Candidate 6.0 private operating-loop acceptance

Use a loopback disposable PostgreSQL database and synthetic UAT organizations, never the real club database. Execute the private suite at desktop, tablet and mobile sizes. These checks supplement, not replace, the public cases above.

| ID      | Scenario                                     | Observable acceptance                                                                                                                                                               |
| ------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UAT-027 | Clean organization and typed configuration   | No sample substitution; season/program/venue references and dates validate; approved rows alone feed analytics                                                                      |
| UAT-028 | CSV preview, commit and correction           | Quoted values parse; invalid/duplicate/stale batches never partially commit; repeated commit is idempotent; corrected receipt/cost changes displayed totals and downloaded rows     |
| UAT-029 | Commercial and accountable action            | Sponsor face value is not cash; deliverable status and owner/due/status/rationale persist; organization-wide action scope stays explicit                                            |
| UAT-030 | Settings, users and actual-route permissions | Server-confirmed settings/user writes survive fresh context; all six role policies, last-admin protection, revoked sessions, origin and foreign-organization requests are exercised |
| UAT-031 | Versioned planning                           | Blank private assumptions require entry; scope/frequency/capacity/allowances validate; save, compare, reset, duplicate, historical restore-as-draft, archive and export work        |
| UAT-032 | Restart and isolated recovery                | Before/after separate-process restart fingerprints agree; logical backup readback checksum and every restored application table agree in a different migrated disposable database   |

## Candidate exit criteria

All public-portfolio critical scenarios pass with no P1/P2 defect. Native Power BI and managed-host recovery scenarios may remain conditional only when their required external environment is unavailable and the limitation is stated in the UAT result and README.
