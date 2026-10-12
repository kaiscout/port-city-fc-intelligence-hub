# Security and privacy

This repository is a sanitized portfolio demonstration. Do not open an issue containing real staff contacts, credentials, financial rows, bank data, payees, private filenames, or private source documents.

## Supported surface

Security fixes target the current `main` branch. The public deployment is read-only and must not be connected to a database. PostgreSQL-backed operation is intended for local or controlled environments with secrets supplied outside Git.

## Reporting

Report a suspected vulnerability privately through the repository host's security-reporting feature. Include the affected route, role, entity, expected authorization decision, and a minimal reproduction that uses synthetic data only.

## Control summary

- route policies and entity-specific permissions;
- server-side authorization on every protected handler;
- organization-scoped reads and writes;
- signed, expiring, revocable sessions;
- Argon2id password hashing;
- same-origin mutation checks;
- transactional audit writes;
- privacy scan and dependency audit in CI; and
- explicit public read-only mode with no database.
