# Security and Privacy

## Implemented controls

Argon2id; signed HTTP-only same-site sessions with production secure flag and database revocation; generic login errors; login throttling; server RBAC; same-origin state-change checks; Zod validation; parameterized Drizzle queries; PostgreSQL foreign-key/unique/check constraints; restricted CSV size/rows; safe parsing/preview; duplicates/checksums; spreadsheet export neutralization; structured redacted logs; security headers; audit events; environment validation; no secret values in source/client.

## Data minimization

The pilot does not need card/bank data, ticket credentials, government identifiers, medical/safeguarding data, or supporter-level direct identifiers. Sponsor contacts, user data, sessions, and audit evidence are restricted. Cohorts and marketing metrics are aggregate.

## Retention assumptions

Operational/financial aggregates follow approved financial/business policy; contact data lasts only through relationship plus approved closeout; sessions are short-lived and expired rows purged; import files are not retained after validated commit unless policy requires encrypted evidence; audit retention is approved against investigation need and privacy impact.

## User-access responsibilities

Administrators provision/deactivate accounts, review access quarterly and after role changes, avoid shared accounts, use unique passwords, protect recovery channels, and inspect anomalous audit events. Privileged production access should use SSO/MFA when an authorized identity provider is selected.

## External risks

Provider exports can carry excessive fields, inconsistent IDs, formula payloads, stale/refunded transactions, hidden consent limits, and changing schemas. Automations require least-privilege credentials, secret manager, retry/idempotency, reconciliation, rate limits, failure ownership, and revocation.

## Incident response recommendation

Detect/triage → contain sessions/credentials/integration → preserve logs/audit and timestamps → assess data/scope → notify accountable owners and required parties → eradicate/fix → recover from verified state → retrospective and control update. Do not place secrets or sensitive rows in incident chat/logs.

## Production additions

Managed WAF/TLS, distributed rate limiting, MFA/SSO, centralized SIEM/alerts, DB network isolation/PITR, malware scanning if file storage expands, dependency scanning/patch SLA, penetration test, privacy assessment, key rotation, restore exercises, and approved incident contacts.

No formal compliance certification is claimed.
