# Assumptions, Risks, Issues, and Dependencies Log

| ID    | Type       | Item                                                                 | Probability / impact | Owner           | Response / status                                        |
| ----- | ---------- | -------------------------------------------------------------------- | -------------------- | --------------- | -------------------------------------------------------- |
| A-001 | Assumption | Staff can export stable IDs and aggregate facts from existing tools. | Medium / High        | Administrator   | Validate during pilot discovery                          |
| A-002 | Assumption | No supporter-level PII is required for initial cohort reporting.     | Medium / High        | Privacy owner   | Use aggregate cohorts; re-review if scope changes        |
| A-003 | Assumption | PostgreSQL 17 is acceptable for pilot hosting.                       | High / Medium        | Service owner   | Revalidate platform support before deployment            |
| A-004 | Assumption | KPI definitions in v1 are acceptable starting points.                | Medium / Medium      | Analyst         | Stakeholder definition workshop                          |
| R-001 | Risk       | Synthetic figures are mistaken for actual club results.              | Medium / High        | Product owner   | Persistent labels, provenance, disclaimer                |
| R-002 | Risk       | Provider IDs/exports change, causing duplicates.                     | Medium / High        | Operations      | Stable mapping, checksum, preview, reconciliation        |
| R-003 | Risk       | Sponsor reach estimates are overinterpreted.                         | Medium / Medium      | Commercial      | Mark forecast; document methodology                      |
| R-004 | Risk       | Shared-cost allocation distorts program comparison.                  | Medium / High        | Analyst/finance | Show shared and specific costs separately                |
| R-005 | Risk       | Local in-memory rate limiting is insufficient at scale.              | High / Medium        | Service owner   | Use distributed limiter before multi-instance production |
| R-006 | Risk       | Contact/audit data retention exceeds need.                           | Medium / High        | Privacy owner   | Approve retention schedule and deletion process          |
| I-001 | Issue      | Suggested legacy WordPress crest URL returned unavailable.           | Closed               | Developer       | Verified current official-site circular asset instead    |
| D-001 | Dependency | Production adoption needs hosting/security/privacy approvals.        | High / High          | Executive owner | Mandatory gate                                           |
| D-002 | Dependency | Live integrations need provider access and data contracts.           | High / Medium        | Provider owners | Future discovery; not claimed                            |

## Review cadence

Administrator reviews open items weekly during pilot; leadership reviews high-impact risks monthly. Status and mitigations are audit-tracked.
