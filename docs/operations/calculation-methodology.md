# Calculation methodology — PCFC-DIH-CALC-3.0

Effective 18 October 2026, completion candidate 6.0. This supersedes version 2.0, including the old native threshold of 674. Both applications now use the same after-allowance equation. Source reference dates are not build dates.

## Source hierarchy and evidence

1. Public annual synthetic metadata: `data/raw/financial_periods.json`. FY25 monthly/category sources: `finance_monthly.csv`, `finance_categories.csv`. Existing control totals are regression expectations, not replacement source rows.
2. `scripts/build-public-dataset.ts` validates source arithmetic and generates `data/processed/public-reference.json`, dimensions, facts and a SHA-256 reconciliation manifest. `lib/data/pcfc-reference.ts` reads the generated financial arrays, rather than maintaining alternative annual/monthly answers.
3. Existing generalized football, field, staffing and receipt examples remain in `pcfc-reference.ts` and the role-only raw files. These are deliberately generalized, not extracts from private statements. They have independent grains and cannot be added to ledger totals.
4. `lib/data/demo.ts` is the source for eight synthetic 2026 fixture examples, six sponsor examples, acquisition stages/channels and three existing scenario cases. They are not a full schedule, actual contracts or tracked customers.
5. Private operations use organization-scoped PostgreSQL records, not the public arrays. Each record requires a stable external ID, evidence class, source reference, reference date, approval state and version. APPROVED means reviewed by an application user, not certified by the club or independently audited.
6. Saved scenarios retain all assumptions, provenance, reference date and immutable versions. New private organizations have no operational sample or scenario defaults. Numeric unknowns stay blank until explicitly entered.

No private documents, contacts, bank rows or attributed conversations are needed to reproduce this public model. Calculated results inherit all evidence limitations of their inputs, including synthetic inputs. The public reference date is 2026-10-12; 2026-10-18 identifies this preparation, not fresh club data.

## Scope and filters

| Subject            | Period and grain                      | Valid selection                                | Unknown / excluded                                                  |
| ------------------ | ------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------- |
| Public annual cash | FY24/FY25, USD, club-wide             | Finance period                                 | No program allocation, opening balance, accruals, debt or runway    |
| Monthly/categories | FY25 only                             | Finance period                                 | FY24 breakdowns unavailable; annual categories are not transactions |
| Public fixtures    | Eight synthetic 2026 home examples    | Program                                        | Not a complete season or actual home/away split                     |
| Public sponsors    | Six synthetic 2026 contracts          | Program AND search, sort                       | Face value is not cash; Club-wide included once, unallocated        |
| Acquisition        | 2026 club-wide illustrative sample    | No program filter                              | Stages have different units, not a tracked cohort or causal journey |
| Private records    | Approved records in one organization  | Season, program, search, sort                  | Missing attendance/cost/receipt records are unavailable, not zero   |
| Scenario           | Independent conditional planning case | Its own program, scope, home count and drivers | No inferred home schedule or automatic cash/contract allocation     |

Adding Men and Women sponsor views would count Club-wide accounts twice. Use All for the combined view. Inapplicable public controls are disabled. Private sponsor filters do not purport to filter unrelated fixture totals; sponsor pages hide the fixture cards.

## Cash and operational measures

Annual net cash change = inflow − outflow. FY25: 67,500 − 63,700 = 3,800 USD. FY24: 63,200 − 60,950 = 2,250 USD. FY25 months and category directions independently reconcile to the annual amounts. Net cash change is not bank balance, profit, liquidity or runway.

Net cash margin = net cash change / inflow. Inflow/outflow ratio = inflow / outflow. Sponsorship share = same-period sponsorship cash category / inflow. Zero or unavailable denominators yield unavailable percentages, not 0%.

Public fixture contribution = sample receipts − sample direct costs, before shared overhead. Average paid = total paid / fixture count. Capacity fill = total paid / total capacity. Returning share = sum(paid × fixture returning percentage) / total paid. This is paid-weighted, not a mean of percentages.

Private fixture receipts/costs = sums of approved linked revenue/cost records. Explicitly allocated shared costs are included; omitted shared costs remain excluded. A receipt record of zero establishes a genuine recorded zero; no receipt record establishes no value. Contribution is available only if each selected fixture has both receipt and cost inputs. Partial receipt, cost and attendance totals are labeled Recorded. Coverage counts records, not assurance of source completeness. Returning share uses sum(returning counts) / sum(paid counts), and is unavailable if any relevant count is missing or the denominator is zero. Complimentary attendees are excluded from paid counts.

Sponsor delivery completion = sum(delivered assets) / sum(contracted assets) in the public example. Private deliverables are accountable records with status, owner, due date and evidence note; they are not assumed numerical delivery obligations. Renewal intent is not probability or signed renewal. Private actions are entered and approved, not generated financial recommendations. Proposed public actions require club approval; due dates and owners are suggestions.

## One scenario equation

The canonical calculator is `site/model.js::calculateSeasonScenario`, called by the native TypeScript wrapper. Per-fixture scope requires exactly one home fixture; season scope requires an explicit positive integer home count. No preset establishes an approved home schedule. Existing presets retain their prior per-fixture assumptions, including the existing $2.40 attendee cost, now explicit and editable.

Let A = min(expected total attendance, capacity), M = explicit home count, c = community allocation fraction, r = weather + operational allowance fraction, v = explicit attendee cost, F = sum of seven entered per-fixture fixed/direct cost inputs.

Sponsor allocation S = sponsor input × M for Per fixture, otherwise the entered Per season allocation once. For one-fixture scope, a Per season allocation means the user has allocated that full entered amount to this case; no automatic apportionment is performed.

- Expected paid attendance = A × (1 − complimentary fraction). Fractional expectations are permitted; recorded headcounts must be integers.
- Attendee receipts per attendee u = ticket price × paid fraction + concession participation × concession spend + merchandise participation × merchandise spend.
- Attendee-linked receipts V = A × u × M. All three receipt streams respect capacity; complimentary attendees may buy ancillary items but do not buy admission.
- Total receipts R = V + S.
- Entered fixed/direct costs = F × M.
- Attendee costs = A × v × M.
- Community allocation = R × c.
- Receipt risk allowance = V × r. This is a planning deduction, not a probability, observed loss, confidence interval or separate booked expense.
- Contribution before allowance = R − fixed/direct costs − attendee costs − community allocation.
- Contribution after allowance = contribution before allowance − receipt risk allowance.
- Contribution percentage = after-allowance contribution / R.
- Incremental contribution per attendee = u × (1 − c − r) − v.
- Unfunded fixed cost = F × M − S × (1 − c).
- Break-even total attendance per home fixture = 0 when unfunded fixed cost ≤ 0; otherwise ceil(unfunded fixed cost / (M × incremental contribution)).
- Unfunded costs with nonpositive incremental contribution have no finite solution. A threshold above capacity is not feasible. A funded zero threshold does not promise a profit at greater attendance when incremental contribution is negative.

Shared overhead, taxes, capital costs and any other omitted item are not implicitly included. Users must explicitly allocate appropriate costs; no generalized season commitment is silently added. Combined allowance must not exceed 100%. Zero-receipt margins and zero-attendance unit ratios are unavailable.

Independent worked example (test values, not club assumptions): capacity 80, demand 100, two home fixtures, $10 ticket, 25% complimentary, 20% concession participation at $5, 10% merchandise at $10, $100 sponsorship once, $200 fixed/direct costs per fixture, $2.40 attendee cost, 10% community, 20% combined allowance. Receipts $1,620; costs $784; community $162; allowance $304; contribution $370. At 36 attendees per fixture contribution is −$4; at 37 it is $4.50. Break-even is 37.

Existing native baseline now has after-allowance contribution $15,034.80 and break-even 827; 826 is negative and 827 nonnegative. This changed because the previously separate exposure deduction is now included consistently, not because business inputs were altered.

## Precision, exports and review

Input combinations that produce nonfinite results or exceed the supported numeric range are rejected, not displayed as infinity or stored. Entered and derived dollar totals must remain within Number.MAX_SAFE_INTEGER / 10,000, and break-even counts must be safe whole integers. This is a technical precision safeguard, not a business limit, target or forecast assumption.

Calculations retain numeric precision; whole-dollar cards and one-decimal percentages are display formatting. Detailed exports retain unrounded numeric inputs and outputs. Scenario exports include scope, home count, sponsorship frequency, all costs, allowances, provenance and reference date. Private fixture exports match selected visible records; empty exports state that no records match instead of inventing zero rows.

Record IDs and version histories identify corrections. Writes and audit events commit in one database transaction. CSV previews do not modify operational data; every row must pass preview and commit-time validation, or the whole import is rejected. Audit entries are application append-only, not cryptographically immutable against database administrators.

The workbook is recalculated and rendered with the bundled workbook engine. Power BI generation validates source structure and formulas but does not claim a Desktop refresh, visual render or native RLS test. Club source approval, adoption and operational hosting are separate release decisions.
