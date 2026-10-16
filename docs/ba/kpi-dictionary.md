# Public Hub KPI dictionary

Calculation version: PCFC-DIH-CALC-2.0, effective 16 October 2026. Every public input is synthetic or generalized; every resulting measure inherits that boundary. Proposed owner roles are discussion responsibilities, not completed stakeholder sign-off.

| Displayed measure             | Definition / formula                                                                | Unit / grain                  | Scope and limitation                                             |
| ----------------------------- | ----------------------------------------------------------------------------------- | ----------------------------- | ---------------------------------------------------------------- |
| Cash inflow                   | Published synthetic annual inflow                                                   | USD / fiscal period           | FY24/FY25 club-wide; no program allocation                       |
| Cash outflow                  | Published synthetic annual outflow                                                  | USD / fiscal period           | FY24/FY25 club-wide                                              |
| Net cash movement             | Inflow − outflow                                                                    | USD / fiscal period           | A movement, not bank balance or accrual profit                   |
| Net cash margin               | Net movement / inflow × 100                                                         | % / fiscal period             | Unavailable for zero inflow                                      |
| Inflow / outflow              | Inflow / outflow                                                                    | Ratio / fiscal period         | Does not establish liquidity or runway                           |
| Sponsorship share             | Sponsorship cash category / cash inflow × 100                                       | % / fiscal period             | FY25 only; FY24 category data unavailable                        |
| Average paid attendance       | Σ paid / fixture count                                                              | People / example home fixture | Selected 2026 synthetic fixture sample                           |
| Aggregate capacity fill       | Σ paid / Σ capacity × 100                                                           | % / selected fixture sample   | Capacity-weighted, not a mean of venue percentages               |
| Direct contribution           | Σ fixture revenue − Σ direct cost                                                   | USD / selected fixture sample | Before shared overhead; not club profit                          |
| Average direct contribution   | Direct contribution / fixture count                                                 | USD / home fixture            | Same selected population as attendance                           |
| Returning share               | Σ(paid × returning %) / Σ paid                                                      | % / selected fixture sample   | Paid-weighted modeled proportion                                 |
| Home-kit quantities specified | Count of home requirement rows with numeric quantity / home requirement rows        | Count / requirements list     | Quantity mapping is not availability or readiness                |
| Sample contract face value    | Σ visible sponsor face values                                                       | USD / visible 2026 accounts   | Program AND search apply; club-wide accounts included once       |
| Delivery completion           | Σ delivered / Σ contracted × 100                                                    | % / visible sponsor accounts  | Assets, not revenue; empty denominator unavailable               |
| Overdue deliverables          | Σ overdue assets                                                                    | Assets / visible accounts     | Not necessarily the count of recovery accounts                   |
| Positive renewal intent       | Count of visible accounts labeled Positive                                          | Accounts                      | Does not establish probability or a signed renewal               |
| Club-wide purchase conversion | Purchases / website visits × 100                                                    | % / 2026 acquisition sample   | Program and sponsor search do not apply                          |
| Channel conversion            | Purchases / visits × 100                                                            | % / channel                   | Synthetic club-wide acquisition sample                           |
| Channel cost / purchase       | Spend / purchases                                                                   | USD / purchase                | Displayed to cents; CSV retains precision                        |
| Scenario revenue              | Season attendee receipts + single season sponsor allocation                         | USD / assumed season          | Independent sandbox; all attendee receipts capacity capped       |
| Scenario contribution         | Revenue − direct cost − community allocation − risk allowance                       | USD / assumed season          | Before omitted club-wide overhead and taxes                      |
| Break-even total attendance   | Smallest whole attendees per home fixture satisfying the same contribution equation | People / assumed home fixture | No finite or above-capacity thresholds are explicitly identified |
| Hub checks passed             | Calculated passing controls / calculated control count                              | Count / public input bundle   | Arithmetic/coverage only; no assurance score                     |
| Pipeline checks passed        | Passing rows / rows in the reconciliation manifest                                  | Count / synthetic pipeline    | Separate from privacy scanning and stakeholder acceptance        |

The full formula specification, rounding policy and worked example are in [calculation-methodology.md](../operations/calculation-methodology.md). No unlabeled time trend is drawn across unrelated accounts, stages or units.
