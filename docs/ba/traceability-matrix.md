# Requirements traceability — candidate 6.0

Implementation references below identify the tests to execute, not a claim that a historical pass verifies new code. Current observed results and source/environment identity are in [UAT](uat-results.md) and its release evidence.

| Requirement                 | Implementation evidence                                                                  | Executable / visual evidence                                                                 |
| --------------------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| FR-001 scope/exports        | `site/model.js`, `club-workspace.tsx`                                                    | Static 54-combination browser/export matrix; private filtered/empty downloaded CSV           |
| FR-002 evidence             | Generated reference JSON, record provenance, KPI definition disclosures, methodology 3.0 | Integrity controls, evidence drawer assertions, source class/date/version visual review      |
| FR-003 typed operations     | `lib/club.ts`, `club-store.ts`, entity API, Operations studio                            | Completion unit relationships/capacity; private manual/API→database→dashboard                |
| FR-004 CSV                  | `lib/csv.ts`, import schema, preview/commit/history APIs                                 | Quoted fields; row errors; invalid and commit-time duplicate atomicity; repeat/replay        |
| FR-005 correction/analytics | Optimistic versions, approved workspace feed                                             | Receipt/cost correction changes contribution; stale 409; reload/fresh context                |
| FR-006 sponsors/actions     | Typed sponsor, deliverable, recommendation domains                                       | Private contract/delivery/action persistence and UI evidence                                 |
| FR-007 scenarios            | Canonical calculator, scenario APIs/revisions/UI                                         | Independent threshold math; all driver tests; saved versions/reset/export/comparison/history |
| FR-008 settings/users       | Settings/user APIs and Settings workspace                                                | UI account provision/deactivate, settings reload, audit and last-admin protection            |
| FR-009 authorization        | Session guards, proxy/layout, page/entity policies                                       | Real-route origin, read/write, foreign organization and revoked-session tests                |
| FR-010 separation           | Clean-org script, private router, DB workspace                                           | Empty organization has null measures, no sample substitution; public writes rejected         |
| FR-011 usability            | Responsive CSS, semantic tables, keyboard definitions, print rules                       | Desktop/tablet/mobile route/layout checks, inspected screenshots and printed reports         |
| FR-012 BI/pipeline          | Data builder, reconciliation hashes, XLSX builder, PBIP generator                        | Source drift gates; workbook formulas/render; Power BI structural validation (not native)    |
| FR-013 durability/recovery  | PostgreSQL, version/audit transactions, disposable recovery script                       | Fresh browser; separate-process restart; isolated logical application-data restore           |
| FR-014 handover/assets      | README, club handover, launch drafts, walkthrough                                        | Current screenshots, narrated delivered UI and package checksum inventory                    |

## Nonclaims

No controlled test establishes actual club-data accuracy, endorsement, stakeholder acceptance, achieved benefits, source completeness, independent security/accessibility certification or managed production availability. Power BI Desktop refresh/View As and native Excel acceptance are separate recipient checks. Publication requires a separate approval and did not occur during candidate preparation.
