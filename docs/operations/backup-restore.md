# Backup and Restore Runbook

## Responsibilities and assumptions

Service owner runs/monitors backups; database owner approves restore; administrator validates application records; security owner controls encryption keys. Proposed pilot RPO: 24 hours. Proposed RTO: 4 hours. Port City FC must approve both.

## Backup

1. Confirm database identity and approved maintenance window.
2. Run `npm run db:backup` with `DATABASE_URL` in environment, never a shell argument or file.
3. Compute `sha256sum backups/<file>.dump` (PowerShell: `Get-FileHash -Algorithm SHA256`).
4. Encrypt and copy to approved off-host storage with restricted access and retention.
5. Record timestamp, source, size, checksum, tool version, and operator in the operations log.

## Restore test

1. Create a new isolated empty PostgreSQL database; never restore over live data.
2. Verify checksum before decrypting/restoring.
3. Run `pg_restore --clean --if-exists --no-owner --dbname "$RESTORE_DATABASE_URL" <dump>` using environment-held credentials.
4. Run migrations only if the restored migration table is behind the application version.
5. Verify organization/user/fixture/import/audit row counts, constraints, latest audit timestamp, login, dashboards, scenario calculation, and a read-only export.
6. Document duration and variance from RPO/RTO.

## Controlled cutover

Require incident/change approval, current backup of the target, stakeholder notification, maintenance mode, validated restored state, DNS/runtime change, smoke test, and rollback window. Never replay uncertain writes automatically after an interrupted operation.

## Retention

Suggested starting point: daily 14 days, weekly 8 weeks, monthly 12 months—subject to approved legal/privacy/business needs. Expired copies and keys must be destroyed according to policy.
