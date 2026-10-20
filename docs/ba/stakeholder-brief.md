# Port City FC — stakeholder review briefing

Purpose: agree a controlled validation pilot, data owners and decision definitions. Presentation candidate: 6.0, 18 October 2026. The current live URL remains the previous release until publication is separately approved.

## Opening statement

“This Hub demonstrates a proposed way to connect financial, commercial and matchday analysis to accountable decisions. The public figures are synthetic or generalized. Today I am asking you to validate the workflows, definitions and next steps; current club balances and operational performance require authorized data reconciliation.”

## Three findings and the decisions requested

| Finding in the demonstration                                          | Evidence and interpretation                                                                                                                                                                                                                    | Decision requested                                                                                                                                  | Proposed accountable role |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| Reserve policy needs an agreed cash definition                        | The FY25 synthetic model has $67,500 inflow, $63,700 outflow and $3,800 net movement: 5.63% of inflow and a 1.06× inflow/outflow ratio. Net movement is not an available cash balance.                                                         | Nominate a finance data owner; agree the cash-movement definition and how an approved balance/payment schedule will inform reserve policy.          | Ownership and finance     |
| Sponsor delivery should have explicit ownership                       | Sponsorship is 56.30% of FY25 synthetic cash inflow. The separate 2026 account sample has $139,000 contract face value and three overdue assets across two accounts. Contract face value and cash receipts are different measures and periods. | Confirm actual accounts, contract dates and receipt treatment; assign one accountable owner per deliverable and agree the exception-review cadence. | Commercial lead           |
| Fixture economics cannot be extrapolated without an approved schedule | Eight synthetic 2026 home-fixture examples demonstrate paid attendance and direct contribution. The approved home/away split, complete fixture opportunity and shared-cost allocation are unavailable.                                         | Confirm schedule, attendance definition, direct-cost basis and treatment of season commitments before building a club forecast.                     | Operations and finance    |

These findings describe the demonstration and proposed controls. They are not assertions about PCFC's current liquidity, sponsor performance or profitability. Role assignments above are proposals for agreement.

## Eight-minute presentation route

1. **Context and boundary — 45 seconds.** Open Command center and explain the synthetic label, dataset scopes and three owner decisions.
2. **Cash flow — 90 seconds.** Show FY25 inflow/outflow, negative monthly net movement and same-period category shares. Switch to FY24 to demonstrate honest annual-only reporting rather than invented detail. Explain why a bank balance is still needed.
3. **Commercial exception — 90 seconds.** Select a program, search an account, sort by delivery and open the sponsor detail. Explain inclusion of unallocated club-wide accounts. Export the visible selection. Separate 2026 contract face value from FY25 cash receipts.
4. **Fixture and program analysis — 75 seconds.** Open one synthetic fixture and show direct contribution. Compare programs using per-fixture measures, weighted capacity fill and paid-weighted returning share; do not claim full-season equivalence.
5. **Scenario sensitivity — 90 seconds.** Start at the public Baseline preset. Explicitly select per-fixture or season scope, home count and sponsorship frequency; one fixture is the starting unit, not an approved schedule. Change attendance and a cost input, show after-allowance break-even feasibility, then export the complete assumptions and output equation. Risk allowance is a planning deduction.
6. **Decision and next step — 90 seconds.** Open Owner briefing or Decision register. Agree the three requests, reviewers, a reporting-period pilot, and acceptance criteria.

## Proposed validation pilot

For the separate private-application demonstration, use only the disposable synthetic test organization: show typed configuration, a quoted-field CSV preview, explicit atomic commit, an approved correction changing analytics, an accountable action, a saved scenario version and the audit trail. A newly provisioned club organization starts empty. Do not expose test credentials, raw traces or private records on the public screen.

- Agree one reporting period, one fixture and a small sponsor population.
- Authorize the source records and nominate the finance, operations and commercial reviewers.
- Sign the KPI definitions, source grain, filter scope, allocation method and reporting cutoff.
- Reconcile the period cash totals and one fixture from source through model, display and exported output.
- Review missing evidence and obtain actual stakeholder acceptance; developer tests do not substitute for it.
- Agree production access, hosting, retention, monitoring, support and backup/restore ownership separately before operational adoption.

Success means the agreed source totals reconcile without unexplained differences and the reviewers can trace each presented KPI to an approved definition, population and period. Record any exceptions with an owner and due date.

## Questions to be ready to answer

| Stakeholder question                                           | Evidence-based answer                                                                                                                                                         |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Are these our real figures?                                    | No. This public version uses synthetic/generalized figures. The proposed pilot will reconcile authorized club records.                                                        |
| Why can I not see monthly FY24 data?                           | Only annual FY24 controls are published. The Hub does not infer monthly or category detail from FY25.                                                                         |
| Why does the program selection not change cash or acquisition? | Cash is club-wide without a program allocation. Acquisition is a club-wide sample without program attribution. Their scope is visible and inapplicable controls are disabled. |
| Can we add the Men and Women sponsor totals?                   | No. Each program view includes club-wide accounts once and unallocated; summing them duplicates those accounts. Use All programs for the distinct club total.                 |
| Does “checks pass” mean the numbers are audited?               | No. The checks establish internal synthetic-model arithmetic and coverage. Source authenticity, stakeholder acceptance, privacy review and production readiness are separate. |
| Is the public website our operating database?                  | No. It is a read-only static demonstration. The repository contains a separate PostgreSQL scenario/audit workflow.                                                            |
| Is Power BI fully accepted?                                    | The source model has structural verification. Native Desktop refresh/render and role testing remain a separate acceptance gate.                                               |

Use the Hub's **Owner briefing → Print owner briefing** action for a concise meeting handout. The formula contract is in [calculation-methodology.md](../operations/calculation-methodology.md); the current execution record is in [uat-results.md](uat-results.md).
