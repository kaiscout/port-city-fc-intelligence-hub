# Completion requirements — candidate 6.0

The task requires an honest public demonstration and a persistent private reporting loop. Unsupported integrations, tracked customer cohorts, measured community outcomes and financial impact claims are excluded, not represented as implemented.

| ID     | Observable requirement                                                                  | Implementation                                                |
| ------ | --------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| FR-001 | Correct fiscal/program/search scope and matching exports                                | Public selectors; approved private selectors                  |
| FR-002 | Source/evidence/formula/unit/date and missing-input meaning visible                     | Definitions, methodology, record evidence, exports            |
| FR-003 | Configure season/program/competition/venue and enter fixtures/attendance/receipts/costs | Typed Operations studio, API and database                     |
| FR-004 | Preview and explicitly commit CSV atomically; reject duplicates/changed references      | Templates, parser, preview, commit, history                   |
| FR-005 | Correct record versions and resulting analytics, without fake success                   | Optimistic versions, transactional save/audit, workspace feed |
| FR-006 | Maintain sponsor contracts/deliverables and accountable actions                         | Explicit owner/status/due/evidence                            |
| FR-007 | Save/revise/compare/reset/export/restore-copy/archive scenarios                         | Shared equation, inputs, immutable versions                   |
| FR-008 | Persist settings and controlled user administration                                     | Transactions, session revocation, last-admin protection       |
| FR-009 | Enforce actual route/entity permissions and organization isolation                      | Current session, origin checks and scoped SQL                 |
| FR-010 | Clean private organization contains no samples or assumed targets                       | Clean setup and empty analytical states                       |
| FR-011 | Usable desktop/tablet/mobile/keyboard/print                                             | Responsive components, definitions, tables and reports        |
| FR-012 | Reproducible source controls and companions                                             | Manifest, XLSX and PBIP/M/DAX/RLS sources                     |
| FR-013 | Retain data after restart and isolated backup/restore                                   | Current disposable-environment evidence                       |
| FR-014 | Accurate handover and recruiter assets without publishing                               | README, UAT, traceability, walkthrough and drafts             |

Nonfunctional controls: Argon2id; signed HTTP-only same-site sessions secure in production; revocation; validated configuration; bounded request bodies; formula-safe text exports with signed numbers preserved; null-safe denominators; parameterized SQL; atomic audit; current verification gates.

Automated tests do not establish WCAG certification, independent penetration testing, an SLA, distributed authentication throttling, actual-data assurance or stakeholder acceptance.
