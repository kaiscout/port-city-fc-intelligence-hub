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

## Exit criteria

All public-portfolio critical scenarios pass with no P1/P2 defect. Native Power BI and managed-host recovery scenarios may remain conditional only when their required external environment is unavailable and the limitation is stated in the UAT result and README.
