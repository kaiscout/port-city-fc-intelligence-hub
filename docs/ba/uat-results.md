# UAT and verification — candidate 6.0

Execution date: 18 October 2026. Executor: project developer. This record supersedes the 14/16 October summaries; historical public evidence remains in the dated verification folders. Developer verification is not PCFC stakeholder acceptance.

## Tested identity and environment

Base Git revision: `6330e24c2c0774cff36b53e0aacb853941705c3d`. Candidate changes remain uncommitted; no hosted CI or pushed-revision pass is claimed. The release manifest enumerates every runtime file and archive checksum.

Runtime SHA-256 fingerprint: `951c82cb147ea18066f310ff03b92a8ab84715dec2b3aeb8acc771919876b3ca`. All 99 runtime inputs were hash-compared between the Dell editing checkout and isolated execution directory. Fingerprint inputs are app/components/lib/data/prisma/site plus package/lock/config/proxy/instrumentation, not documentation or generated media.

Final execution: Dell Windows, Node.js 24.19, Next.js 16.4, locked Playwright Chromium and loopback PostgreSQL 17.6. Both databases contained only explicit synthetic seed/UAT data. Three migrations were applied. The Pi was selected initially and used for baseline builds/tests; after connectivity was lost, verification continued in new isolated Dell staging without touching production or retrying a deployment.

## Observed product verification

| Gate                                 | Result | Observed evidence                                                                                                                           |
| ------------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Source generation and reconciliation | PASS   | 10 deterministic outputs; seven zero-difference controls; regeneration drift gate                                                           |
| Financial controls                   | PASS   | FY25 67,500 / 63,700 / 3,800 USD; FY24 63,200 / 60,950 / 2,250 USD; FY24 annual-only                                                        |
| Power BI source                      | PASS   | 28-file zero-drift regeneration; 13 JSON documents; seven tables, nine relationships, two roles, six visuals                                |
| Unit/integration                     | PASS   | 39 tests in nine files; typed relations, CSV, permissions, missing values, shared scenario equation and precision limits                    |
| Production build                     | PASS   | Optimized Next.js application compiled, typed and generated successfully                                                                    |
| Private PostgreSQL browser suite     | PASS   | 36/36: 12 cases each at desktop, tablet and mobile; final run 5.4 minutes                                                                   |
| Native public/no-database profile    | PASS   | Six applicable desktop cases; six database-only cases correctly not applicable here, already passed in all private profiles                 |
| Static numerical/export suite        | PASS   | 78 independent cases and 24 calculated integrity controls                                                                                   |
| Static browser suite                 | PASS   | 95 checks, 54 period/program/view export combinations, nine mobile views, zero console errors                                               |
| Desktop/mobile/print review          | PASS   | Final rendered private summary/filter/source/action layouts and print report inspected; public desktop/mobile/owner-print evidence retained |
| Reload and fresh browser             | PASS   | Server-confirmed operations, settings, scenario versions and account changes retained across new contexts                                   |
| Separate-process restart             | PASS   | Different owned application PIDs, same database, fresh browser sign-ins; five business fingerprints identical                               |
| Isolated logical restore             | PASS   | Checksummed backup read back, restored transactionally into the same migrated schema; all 33 application table hashes/counts matched        |
| Production dependencies              | PASS   | npm audit with development dependencies omitted reports zero vulnerabilities                                                                |
| Refreshed walkthrough                | PASS   | 180.711 seconds, 1280×720; playback and four seek captures; decoded 180-second stereo narration, non-silent RMS; rendered frames inspected  |

Current source formatting, lint, strict types, privacy and regeneration results are recorded in the accompanying [release verification record](../verification/2026-10-18-v6/release-verification.json). Public-bundle inventory is exactly six static assets, with no database, environment, private documents, contacts, credential exports or mutation server.

## Actual operating-loop coverage

- UAT-027: a clean organization starts empty; typed approved season/program/competition/venue/fixture records, dates, capacity and references validate.
- UAT-028: manual correction and quoted CSV preview/explicit atomic commit drive analytics. The synthetic example moves contribution from $10,740 to $9,830 after a cost correction. Invalid rows, repeat content, stale versions and commit-time duplicates cannot partially write.
- UAT-029: sponsor face value remains distinct from receipts; deliverables and owner/due/status/rationale actions persist. Action scope is explicitly organization-wide.
- UAT-030: settings/report ownership and user provision/deactivation are durable and audited. Actual routes exercise all six roles, entity read/write policies, last-admin protection, origin rejection, organization isolation and session revocation.
- UAT-031: explicit scope/home count/sponsor frequency/provenance, capacity, complimentary attendance, costs/community/allowances; save/version/compare/reset/export/duplicate/restore-as-new-draft/archive all exercised.
- UAT-032: restart compared 456 operational rows, 23 settings, 58 scenarios, 89 revisions and 733 non-sign-in audit events across the accumulated synthetic test database. These are test inventory counts, not club performance statistics.

The shared after-allowance baseline threshold is 827, not the superseded before-allowance 674. Independent worked example: receipts $1,620, costs $784, community $162, allowance $304, contribution $370; 36 attendees produces −$4 and 37 produces $4.50. Oversized/nonfinite calculations are rejected rather than saved or displayed as infinity.

## Evidence and reproduction

Sanitized machine records are in [2026-10-18-v6](../verification/2026-10-18-v6/): numerical/browser results, restart before/after/cycle, disposable restore and walkthrough verification. Raw traces, credential-bearing backup data and local execution logs are excluded from public/source/presentation archives.

Run the README gates. Database E2E requires the explicitly seeded disposable verification database; clean club setup must not use that seed. The bounded `scripts/check-restart-cycle.ts` owns and stops both loopback test application processes. The restore helper refuses occupied business targets and never restores over live data. The release manifest identifies exact archive/file hashes independently of the unchanged base Git revision.

Verification found and corrected genuine issues before the final runs: canonical-origin handling, accessible password naming, scenario precision/zero-attendance behavior, compressed mobile filters and the recovery helper's JSON serialization. Failed restore attempts rolled back; the successful run did not require deleting target business records. A separate capture-selector ambiguity was corrected without changing application behavior.

The walkthrough recorder initially received an indefinite audio duration. Media-length/range headers and fail-fast page-error handling were corrected before the successful playback/audio/seek verification.

## Companion and acceptance boundary

The XLSX retains eight sheets, recalculates linked reconciliation formulas with seven zero differences, has no detected formula errors, and was rendered/reviewed with the bundled artifact engine. This is not a native Microsoft Excel refresh. Power BI checks validate M/DAX/model/role/report source and generation; Desktop refresh/render and native View As have not been performed. Annual category measures explicitly retain year while ignoring a month/date filter; annual anchors do not become monthly transactions.

The logical restore is an application-data rehearsal, not pg_dump/pg_restore, physical/PITR recovery, encrypted off-host storage or provider failover. Restart fingerprints exclude sign-in events because the check deliberately signs in again; ordinary write audit events and scenario revisions remain included.

No public hosting, DNS, LinkedIn account, production database or live integration was changed. The public figures remain synthetic/generalized; net cash movement is not balance, profit or runway. Software checks do not certify real club figures, independent security/accessibility, load/SLA, endorsement, achieved benefits or stakeholder acceptance.

Before adoption: club data/report owners and approved actual inputs, definition/exclusion sign-off, role-account approval, native companion acceptance where required, and an authorized private environment with TLS, managed secrets, upstream authentication throttling, monitoring, encrypted backups, recovery/support ownership and stakeholder UAT. Static publication and any LinkedIn post require Deniz's separate approval.
