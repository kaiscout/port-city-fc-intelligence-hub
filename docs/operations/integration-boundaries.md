# Integration Boundaries

| Provider domain   | Pilot input            | Future read boundary                            | Explicitly out of scope             | Acceptance controls                        |
| ----------------- | ---------------------- | ----------------------------------------------- | ----------------------------------- | ------------------------------------------ |
| Ticketing         | CSV/manual aggregate   | fixtures, order/category aggregates, attendance | selling/refunds/access control      | stable IDs, refund/show reconciliation     |
| Accounting        | Approved summary CSV   | revenue/cost summaries                          | journals, close, tax, bank data     | chart mapping, approval, close-period lock |
| Website analytics | Aggregate CSV          | page/funnel aggregates                          | raw identifiers/cross-site profiles | consent, bot filters, retention            |
| Email marketing   | Campaign aggregate CSV | sends/opens/clicks/attributed visits            | sending/suppression ownership       | consent, attribution, provider policy      |
| Payments          | None                   | settled aggregate if approved                   | card data, charge/refund processing | reconciliation; no PCI data in Hub         |
| Social analytics  | Aggregate CSV          | reach/engagement by campaign                    | posting/moderation                  | methodology, API terms, rate limit         |

No connector or live integration is implemented or claimed. Manual/CSV operation is a deliberate independent baseline, not placeholder behavior.
