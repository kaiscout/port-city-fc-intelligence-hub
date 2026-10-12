# Permission Matrix

| Capability                          | Administrator | Executive | Analyst | Commercial | Marketing | Matchday Operations |
| ----------------------------------- | ------------: | --------: | ------: | ---------: | --------: | ------------------: |
| Dashboard read                      |             ✓ |         ✓ |       ✓ |          ✓ |         ✓ |                   ✓ |
| Analytics detail                    |             ✓ |         ✓ |       ✓ |          — |         ✓ |                   — |
| Scenario read/write                 |             ✓ |      read |       ✓ |          — |         — |                   — |
| Sponsor read/write                  |             ✓ |         — |       — |          ✓ |         — |                   — |
| Funnel read/write                   |             ✓ |         — |    read |          — |         ✓ |                   — |
| Community read/write                |             ✓ |         — |       — |          — |         ✓ |                   — |
| Fixture read/write                  |             ✓ |         — |       — |          — |         — |                   ✓ |
| Attendance/import write             |             ✓ |         — |       — |          — |         — |                   ✓ |
| Report read/export                  |             ✓ |         ✓ |       ✓ |     export |         — |                   — |
| Operations workspace read           |             ✓ |         — |       — |          — |         — |                   ✓ |
| Users/settings/audit administration |             ✓ |         — |       — |          — |         — |                   — |

The client may hide controls, but the server reads signed session claims, checks revocation, requires the canonical permission, validates input, scopes queries by organization, and writes an audit event inside the same transaction.
