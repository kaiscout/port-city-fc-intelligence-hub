# Calculation methodology — PCFC-DIH-CALC-2.0

Effective: 16 October 2026. Maintainer: portfolio developer. Change: correct period scope, expected-attendance math, break-even funding, weighted denominators, and export/evidence contracts.

All public figures are synthetic or deliberately generalized. No public amount is an extraction from a private statement or an approved PCFC actual. Currency is USD. Underlying calculations retain precision; cards round currency to whole dollars and percentages to one decimal. Detailed scenario rows and channel cost per purchase show cents; CSVs retain numeric precision.

## Dataset and filter contract

| Subject                    | Scope                                           | Supported filters          | Missing data                                                              |
| -------------------------- | ----------------------------------------------- | -------------------------- | ------------------------------------------------------------------------- |
| Cash controls              | FY24 / FY25, club-wide annual totals            | Finance period             | No opening balance, debt schedule, accrual accounts or program allocation |
| Cash months and categories | FY25 only                                       | Finance period             | FY24 breakdowns stay unavailable; no scaling or imputation                |
| Fixtures                   | Eight synthetic 2026 home-fixture examples      | Program                    | Not a complete season or approved home/away split                         |
| Sponsor contracts          | Six synthetic 2026 accounts                     | Program, search, sort      | Face value is not cash received or recognized revenue                     |
| Acquisition                | 2026 club-wide illustrative stages/channels     | None                       | No program attribution or measured user journey                           |
| Scenario                   | Independent planning case                       | Its own inputs and program | No automatic mapping to historical ledgers or contracts                   |
| Decision register          | Proposed stakeholder agenda                     | Priority                   | Owners/timings await agreement                                            |
| Controls / permissions     | Entire public model / application policy source | None                       | No claim of club-data assurance or public-site authentication             |

A program view includes club-wide sponsor accounts once and unallocated. Adding Men and Women views double-counts those club-wide accounts and is not a valid club total. The interface identifies each panel's scope. Inapplicable global controls are disabled. All exports use the same selectors as the visible view; a commercial workspace export contains separately labeled portfolio and club-wide acquisition sections.

## Synthetic cash model

- Inflow and outflow are the published synthetic control totals for the selected period.
- Net cash movement = inflow − outflow. It is neither bank balance nor operating profit.
- Net cash margin = net cash movement / inflow.
- Inflow/outflow ratio = inflow / outflow. It is not liquidity coverage or cash runway.
- Sponsorship share = same-period sponsorship cash category / same-period cash inflow.
- FY25 monthly sums and categories each reconcile to annual inflow $67,500 and outflow $63,700; net movement is $3,800.
- FY24 annual inflow is $63,200, outflow $60,950 and net movement $2,250. No monthly or category breakdown is published.
- Generalized season commitments, field-cost examples and the 2026 operational sample are independent scopes. They are not additional ledger rows.
- A proposed 1.05× cash-flow policy is a discussion point, not an approved management threshold.

## Fixture and sponsor measures

- Average paid attendance = total paid / fixture count.
- Direct fixture contribution = sample total revenue − sample direct cost, before shared overhead.
- Average direct contribution = total direct contribution / fixture count.
- Aggregate capacity fill = total paid / total fixture capacity.
- Returning share = Σ(paid × fixture returning %) / total paid.
- Empty denominators are unavailable, not zero.
- Sponsor completion = Σ delivered assets / Σ contracted assets, not an average of account percentages.
- Positive renewal intent is an account count, not a forecast probability or signed renewal.
- Public follow-up rule: overdue assets → delivery recovery; otherwise positive intent → no open delivery exception; other intents → renewal discussion. This is a rule illustration, not a validated risk score.
- Acquisition purchase conversion = sample purchases / sample website visits. Channel visits and purchases reconcile to those funnel stages. Social reach, visits, purchases and attendance have different units and are not asserted to be tracked cohorts.
- Cost per purchase = channel spend / purchases.

Sparklines appear only for dated monthly or fixture sequences, with their period and grain visible. Program comparisons retain their original units in a table; no arbitrary index combines dollars, percentages and people.

## Public season scenario

All inputs are visible, including expanded cost assumptions. Monetary cost inputs are per home fixture except sponsor funding, which is a single season allocation. The home-match count is a planning assumption.

Let A = min(demand, capacity), M = assumed home matches, c = community allocation fraction, r = weather plus operational allowance fraction, v = attendee cost, F = sum of seven per-fixture direct costs, and S = season sponsor funding.

- Expected paid attendance per fixture = A × (1 − complimentary fraction). It may be fractional; this is an expectation, not a recorded headcount.
- Unit attendee receipts u = ticket price × paid fraction + concession participation × average concession spend + merchandise participation × average merchandise spend.
- Season variable receipts = A × u × M. Every attendee-linked receipt is capacity capped.
- Season total receipts R = variable receipts + S.
- Direct costs = F × M + A × v × M.
- Community allocation = R × c.
- Risk allowance = variable receipts × r. This is a planning deduction, not observed spending.
- Contribution after allowance = R − direct costs − community allocation − risk allowance.
- Contribution percentage = contribution / R; unavailable when R is zero.
- Incremental contribution per attendee = u × (1 − c − r) − v.
- Unfunded fixed costs = F × M − S × (1 − c).
- Break-even total attendance per fixture = 0 when unfunded fixed costs are nonpositive; otherwise ceil(unfunded fixed costs / (M × incremental contribution)).
- A nonpositive incremental contribution with unfunded costs has no finite solution. A threshold above capacity is marked not achievable. The threshold is verified using the same contribution equation at the threshold and one attendee below it.

Independent worked example: capacity 80, demand 100, two home matches, $10 ticket, 25% complimentary, 20% concession participation at $5, 10% merchandise participation at $10, $100 season sponsorship, $200 direct costs per match, $2.40 attendee cost, 10% community and 20% combined risk allowance. Season revenue is $1,620; direct costs $784; community $162; risk allowance $304; contribution $370. Break-even is 37 total attendees per match; 36 produces −$4 and 37 produces $4.50.

## Native application per-fixture scenario

The repository's separate PostgreSQL workflow evaluates one fixture. It uses the same capacity cap, expected paid fraction, $2.40 attendee cost, community allocation, and sponsorship-after-community break-even funding. Its downside exposure is reported separately rather than deducted from operating margin. It must not be compared with the public season model's after-allowance contribution as though they were identical measures.

Native break-even = ceil(max(0, fixed costs − sponsor allocation × (1 − community fraction)) / net contribution per attendee). The baseline threshold is 674; the operating margin is negative at 673 and nonnegative at 674.

## Verification and change control

The Sites build calculates the Hub integrity checks and reads the actual pipeline reconciliation results. It refuses a release when those checks fail. The browser recalculates the Hub checks rather than trusting stored status labels. Neither check set proves source authenticity, privacy completeness, actual data freshness, stakeholder acceptance or production readiness.

Verification includes independent worked examples, capacity and zero-denominator boundaries, corrupted-data controls, the fiscal-period/program/view export matrix, sponsor search/sort behavior, every exposed scenario input, mobile layouts and printable briefing. The release record states exactly what ran and distinguishes prior database evidence from current static-site checks.
