# Private application permissions — candidate 6.0

Canonical contracts: `lib/rbac.ts` and `lib/auth/policies.ts`. Settings displays current role permissions.

| Capability                                   | Administrator | Executive | Analyst            | Commercial             | Marketing | Matchday           |
| -------------------------------------------- | ------------- | --------- | ------------------ | ---------------------- | --------- | ------------------ |
| Dashboard aggregates / approved actions      | Yes           | Yes       | Yes                | Yes                    | Yes       | Yes                |
| Fixture / attendance / receipt / cost detail | Yes           | Yes       | Yes                | No                     | No        | Yes                |
| Configuration records and fixtures           | Yes           | No        | Yes                | No                     | No        | Yes                |
| Attendance, receipts and costs entry         | Yes           | No        | Yes                | No                     | No        | Yes                |
| Sponsors and deliverables read/write         | Yes           | No        | No                 | Yes                    | No        | No                 |
| Actions write                                | Yes           | No        | Yes                | Yes                    | No        | No                 |
| CSV import                                   | Yes           | No        | Authorized domains | Sponsor/action domains | No        | Authorized domains |
| Scenarios                                    | Read/write    | Read      | Read/write         | No                     | No        | No                 |
| Reports page / CSV export                    | Yes           | Yes       | Yes                | Sponsor export         | No        | No                 |
| Users / organization settings / audit        | Yes           | No        | No                 | No                     | No        | No                 |

Configuration records are distinct from administrator-only organization settings. Analysts can complete the reporting loop; matchday users can read the evidence they enter. Import permission alone does not grant receipt/cost or other domain writes. Preview and commit require both import and entity write permissions. Marketing retains legacy policy declarations, but unsupported private funnel/community domains have no operating mutation endpoint or substituted demonstration data.

Every protected API checks the current active user and persisted unrevoked session, then role and organization. Mutations check configured origin/Host, typed input, references and versions. Access changes revoke sessions; the last active administrator is protected. Public mode is a separate synthetic read-only product.

Application authorization is organization-level, not team-level RLS. Power BI's example program roles are a separate report publication boundary.
