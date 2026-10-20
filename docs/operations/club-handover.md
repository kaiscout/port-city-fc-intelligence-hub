# Club handover — candidate 6.0

Prepared 18 October 2026. Product owner and club source approver: **to be assigned by PCFC**. This is software handover for controlled evaluation, not authority to rely on synthetic financials.

## First session

1. Use a dedicated private PostgreSQL database and a new session secret. Apply migrations, then run `db:clean-org` with an approved administrator and strong initial password. It creates an organization/account only, without demonstration records.
2. In Settings, confirm organization name, data owner, reference date and reporting exclusions. No targets are supplied.
3. In Operations studio, configure and approve seasons, programs/teams, competitions and venues. Dates and venue capacity require source references. Choose the active reporting season in Settings.
4. Provision named users with the least suitable role. No invitation email is sent. Share initial credentials through the club's secure channel, never public screenshots or repository files. Access changes revoke existing sessions. The last active administrator cannot be removed.
5. Confirm the organization starts empty, then enter a small reconciled source sample before a full import.

## Reporting cycle

- Record fixtures against approved configuration, with an explicit Home/Away classification. A season's match total is not an assumed home count.
- Enter attendance: paid, complimentary and optional returning paid. Blank returning counts are unknown, not zero. Paid + complimentary cannot exceed venue capacity.
- Record receipts separately from sponsor face value. Link fixture receipts/costs to their fixture; use Direct or Allocated shared cost class deliberately. An empty receipt/cost register cannot prove zero activity.
- Approve reviewed records. Only APPROVED operational records feed the analytical views. Drafts remain visible in administration.
- Review dashboard coverage and evidence. Configure → enter/import → validate → approve → dashboard → inspect evidence → assign action → scenario → meeting report → audit.
- Use a correction on the existing record identity instead of creating a second attendance count or importing the same row again. Refresh after a stale-version warning; do not overwrite a colleague's change blindly.
- In sponsors, maintain owner, dates, face value, deliverable status, evidence note and due date. Club-wide accounts remain unallocated and appear once in a combined register.
- Assign actual decisions/actions with owner, due date, priority, rationale and status. The public proposed queue is not transferred to your private organization.
- Save scenario cases only after all required assumptions, explicit home count, sponsor frequency and provenance are entered. Compare saved versions; restore an earlier version as a new draft, never rewrite history.
- Export the selected rows or print a meeting report. Confirm season/program/search scope, record completeness, reference dates, omitted costs and units. Approve reports outside the tool through the club's agreed governance process.

## CSV procedure

Use the selected domain's **Download template**. Its exact header is the supported schema; there is no hidden automatic mapping. Templates contain headers only, not fabricated club examples.

Required common columns: externalId, name, status, evidence, sourceRef, referenceDate, followed by the domain's published fields. Accepted evidence classes: User-entered operational data; Documented assumption; Synthetic demonstration data. Use ISO dates YYYY-MM-DD and decimal USD amounts without currency symbols. Use stable external IDs unique within organization/domain. References use the approved record's external ID, not a display label.

Quoted commas, escaped quotes, CRLF and multiline quoted fields are supported. Files are limited to 2 MB and 10,000 rows. Missing required values, malformed CSV, duplicate identities, missing/unapproved references, out-of-season dates and capacity violations are rejected with row-level feedback.

**Validate & preview** persists a preview/history entry only. **Commit all rows** revalidates against current database state. Every row must pass; any error rolls back the entire operational import and its commit audit. Replayed successful commits do not write again. Identical committed contents are rejected even if the filename changes. Across-batch duplicates are rejected by stable record identities. Correct a saved row through administration rather than using import as an update mechanism.

Import parents before children: seasons/teams/competitions/venues → fixtures → attendance/revenue/costs; sponsors → deliverables. Reconcile row counts and source totals after acceptance. The history shows PREVIEWED, INVALID and COMMITTED states and accepted/rejected counts.

## Roles and privacy

Administrators manage configuration/users/audit. Analysts manage reporting records and scenarios; commercial users manage sponsors/deliverables and approved actions; matchday users manage fixture attendance/cost operations with analytics read access. The exact current matrix is in Settings and `lib/rbac.ts`. An absent button is not the security control: server APIs and page policies enforce permissions and organization isolation.

Audit is append-only through the application and records actor, action, entity, time and versions. Database administrators remain technically capable of changes; this is not tamper-proof evidence. Access is organization-level, not team-level private-app RLS. Power BI's program role examples are a separate report boundary, not application authorization.

Keep original statements, staff contacts and private operational exports out of the public repository and static deployment. Public mode is a separate synthetic data product and must never connect to the private database.

## Administration and recovery

- Run migrations before starting the candidate. Back up before upgrades. Retain the prior source/deployment so application rollback does not require deleting data. Do not roll back a migration without a reviewed plan and isolated rehearsal.
- Monitor the authenticated application, database, storage, logs and `/api/health`. Health returns failure when the configured database is unavailable; UI errors must not be interpreted as an empty successful dataset.
- Use HTTPS, secure environment storage, encrypted restricted backups and an upstream authentication rate limiter. Current application throttling is process-local. There is no self-service email reset or connected identity provider; administrator recovery is a controlled support task.
- Follow [backup and restore](backup-restore.md). Restore into a new isolated database, never over the live database. Compare record, scenario revision, audit and settings counts and analytical totals; verify sign-in and reporting before considering recovery accepted.
- The verification database contains synthetic UAT organizations only and is disposable; it is not the club's future database, backup policy or availability guarantee.
- Agree retention, archival, incident response, report approval, support owner and scheduled backup/restore testing before operational use.

## Acceptance boundary

Automated software verification is recorded in the current UAT release record. Club acceptance still requires reviewed actual inputs, reconciliation to source statements, confirmed accounting/exclusion policies, named owners and users, stakeholder sign-off and a separately authorized private deployment. No bank/ticket/email/social integration or achieved financial impact is claimed.
