# Readiness assessment — candidate 6.0

Prepared 18 October 2026. The current UAT record identifies observed checks, environment, tested source and limitations. Older release passes do not certify this candidate.

## Delivered software boundary

A read-only synthetic public demonstration and a separate authenticated private PostgreSQL operating application. The private product supports typed configuration and reporting records; reviewed records feed the dashboard; CSV imports have real preview/commit/history; corrections, sponsor deliverables, actions, user administration, settings and scenario versions persist with transactional audit.

A clean organization contains no demonstration operations or invented business targets. Missing numeric inputs stay unavailable. Scenarios use one explicit capacity/scope/cost/allowance equation across both clients, and can be reproduced from exported assumptions.

Operational domain payloads use typed JSONB records with application-level relationship validation and organization transaction locks. Legacy relational pilot tables are retained for migration compatibility, not silently combined into analytical totals. Restrict direct database access: application validation does not assert physical foreign keys for JSON references or team-level database RLS.

## Presentation and evaluation

The candidate is intended for stakeholder review and controlled club UAT. Public numbers remain synthetic/generalized; no club endorsement, adoption, achieved saving, source certification or statistical forecast is claimed. The prepared public bundle is not the currently hosted release until Deniz separately approves publication.

Desktop, mobile, filters, exports and readable print are part of the current verification contract. The workbook's formula/render checks use the bundled artifact engine. Power BI generation validates M/DAX/model/role/report sources; it does not establish a Desktop refresh, rendering or native View As test.

## Remaining release/adoption decisions

- Deniz's separate approval to publish the prepared static bundle and any LinkedIn text.
- Named club data/report owners, approved actual inputs, accounting exclusions and source reconciliation; stakeholder workflow acceptance.
- Approved private hosting, database, TLS, secret management, monitoring, encrypted backups, recovery ownership and support.
- Trusted upstream authentication throttling for an exposed or multi-instance private service. The application limiter is process-local.
- Agreed credential recovery, retention/privacy and incident procedures. There is no connected email invitation, self-service reset or identity provider.
- Recipient native Excel/Power BI acceptance where those tools are part of the operational handover.
- Independent security/accessibility review and load testing according to the club's deployment risk; automated functional checks are not certifications or an SLA.

No production system, database or public hosting is migrated by this task. No ticketing, banking, accounting, email or social integration is represented as connected.

## Recovery evidence boundary

The disposable rehearsal compares application tables, versions, audit and settings after a logical data backup restored into the same migrated schema. It is not a physical cluster, point-in-time, encrypted off-host or provider-failover test. Production pg_dump/pg_restore and the managed service's recovery procedure still require an owner, tooling and a separately approved environment.

Software behavior and evidence transparency can be verified here; actual club data and operational adoption require club authorization.
