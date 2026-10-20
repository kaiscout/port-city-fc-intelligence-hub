# PCFC Design Refinement — 18 October 2026

This update gives the nine-workspace public Hub a consistent club identity and rebuilds Scenario Lab around a live, inspectable attendance/contribution graph. The private application uses the same graph and calculation engine. Financial inputs, projections and evidence classifications retain their existing source boundaries.

## Delivered behavior

- Removed decorative brand/module numbering and the background grid treatment. Navigation, headings, actions, icons, spacing and surfaces follow a consistent visual system.
- Replaced the Scenario Lab banner stack with grouped controls and a persistent results area. Advanced assumptions remain accessible without losing the graph.
- Added synchronized numeric inputs and sliders, baseline comparison, keyboard/touch chart inspection, normal-motion transitions and reduced-motion support.
- Replaced complimentary-attendance terminology with **Guests Admitted Free**, a direct explanation and calculated free/paid guest counts.
- Every plotted point evaluates the shared scenario equation. Each comparison labels its home-match count. Capacity limits, negative contribution, flat or declining contribution and loss boundaries are explicit.
- Invalid public inputs retain an explicitly labeled last valid result and block export until corrected. Private unknown inputs remain blank and use readable validation labels.
- Preserved private saves, immutable revisions, comparisons, restore-as-copy, archive and transactional audit behavior.

## Observed verification

Execution used Dell Windows, Node 24.19 and Chromium. The trusted Pi was selected first and received a hash-verified isolated source archive, but dependency preparation failed because its storage was full. Its task-created partial installation was removed; no Pi build/test pass is claimed.

| Verification                                     | Observed result                                                                                            |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| Unit/integration suite                           | 43 tests passed, including four new graph/evidence edge cases                                              |
| Independent public numerical/export suite        | 78 cases passed; 24 model controls                                                                         |
| Existing public browser suite                    | 95 checks passed, including the 54 fiscal/program/workspace export combinations and nine mobile workspaces |
| Design/interaction suite                         | 25 checks passed across nine workspaces, two themes and four viewport sizes                                |
| Full private operational E2E baseline            | 36 tests passed across desktop, tablet and mobile                                                          |
| Final private sticky-chart/navigation regression | Three tests passed against the final native production build                                               |
| Production native build                          | Passed; strict TypeScript and application routes compiled                                                  |
| Data regeneration                                | Ten outputs reproduced without drift; seven reconciliation controls                                        |
| Power BI source regeneration/structure           | Passed; seven tables, nine relationships, two roles and six visuals                                        |

Design viewports: 1440 × 900, 1280 × 800, 1024 × 768 and 390 × 844. Native E2E projects additionally use their configured tablet viewport. Screenshots were visually inspected; a private form alignment and sticky-container issue found during that review was corrected and verified with the final three targeted tests. Tests use isolated synthetic data and a disposable loopback PostgreSQL instance. Browser emulation does not certify a physical device or every browser engine.

Current machine-readable design evidence: [verification.json](verification.json). Public calculation/filter/export evidence is retained with this record. The live site remains a static, synthetic demonstration; private application testing does not deploy its database or establish club adoption.

## Visual comparison

- Scenario Lab: [before](scenario-before.png), [desktop dark](scenario-1440-dark.png), [desktop light](scenario-1440-light.png), [mobile](scenario-390-light.png).
- Command Center: [before](command-before.png), [desktop light](command-1440-light.png), [desktop dark](command-1440-dark.png).
- Private Scenario Lab: [desktop](private-scenario-1440.png), [tablet](private-scenario-1024.png), [mobile](private-scenario-390.png).

## Repeat the checks

```sh
npm run site:check
npm run site:test
npm run site:test:polish
npm run test
npm run lint
npm run typecheck
npm run format:check
npm run privacy:scan
npm run build
# E2E_DATABASE_URL must identify an isolated test database.
# Run migrations and synthetic test seeding only in that database.
npx playwright test
```

Public version 7 was published successfully at 12:20:04 UTC. The exact saved version, source commit and terminal deployment result are in [publication.json](publication.json). The existing public audience and custom domain were preserved. [Live-domain verification](live-browser.json) passed 103 checks with no console errors, including exact HTTPS bytes for all eight assets, exports, filters, themes and nine mobile workspaces. The public deployment contains eight static assets plus the hosting manifest. It serves no private database, API, user account or credential.
