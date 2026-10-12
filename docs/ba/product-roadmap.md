# Product Roadmap

## Phase 0 — Configuration and governance (weeks 0–2)

Validate KPI definitions, role owners, categories, retention, hosting, incident, and backup responsibilities. Configure a clean organization and provision pilot users.

## Phase 1 — Parallel operational pilot (weeks 3–8)

Run manual/CSV workflows alongside current reporting. Measure import effort, correction rates, decision latency, dashboard use, sponsor exceptions, and staff feedback. No automated writes to external systems.

## Phase 2 — User acceptance and control tuning (weeks 9–12)

Complete role-based UAT, reconcile representative periods, tune targets and rules, restore-test, resolve accessibility issues, and obtain security/privacy approvals.

## Phase 3 — Integration discovery (quarter 2)

For each candidate provider: confirm authorization, API/export contract, identifiers, rate limits, consent, retention, reconciliation, failure ownership, and rollback. Prioritize read-only aggregates.

## Phase 4 — Controlled automation (later)

Add approved scheduled ingestion, distributed rate limiting, SSO, observability, and signed report packs. Keep manual fallback and provenance intact.

## Outcome gates

- ≥95% accepted import rows after initial mapping period.
- Executive review time reduced without reconciliation exceptions.
- Sponsor due-item exceptions assigned within two business days.
- No unauthorized server action in security/UAT testing.
- Restore exercise meets approved RPO/RTO.
- Stakeholder acceptance explicitly recorded.
