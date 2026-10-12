# Data Dictionary

| Entity                | Key fields                                                         | Important constraints / classification               |
| --------------------- | ------------------------------------------------------------------ | ---------------------------------------------------- |
| Organization          | id, name, mode, onboardingComplete                                 | Tenant boundary; mode DEMO/PRODUCTION                |
| User                  | organizationId, email, passwordHash, role, active                  | Unique email; Argon2id; no plaintext                 |
| Role / Permission     | role, permissionCode                                               | Six fixed roles; server checked                      |
| Session               | id, userId, expiresAt, revokedAt                                   | Signed cookie references revocable row               |
| Season                | organizationId, name, startsOn, endsOn                             | Unique per org; end ≥ start; historic rows retained  |
| Team                  | organizationId, name, program                                      | MEN/WOMEN/CLUB_WIDE                                  |
| Competition           | name, externalId                                                   | Stable mapping boundary                              |
| Venue                 | name, capacity, address                                            | capacity > 0                                         |
| Fixture               | season/team/competition/venue IDs, externalId, opponent, startsAt  | Unique org + externalId                              |
| AttendanceRecord      | fixtureId, paid, complimentary, returning, source                  | Nonnegative; returning ≤ paid                        |
| TicketCategory        | name, defaultPrice                                                 | Price ≥ 0; configurable                              |
| TicketChannel         | name, externalId                                                   | Unique name in organization                          |
| RevenueItem           | fixtureId, category, amount, source                                | Amount ≥ 0; decision-support aggregate               |
| CostItem              | fixtureId, category, amount, shared, source                        | Amount ≥ 0; shared flag supports equity view         |
| Sponsor               | packageId, value, dates, program, renewalIntent                    | end ≥ start                                          |
| SponsorContact        | sponsorId, name, email, phone                                      | Internal contact data; restricted                    |
| SponsorPackage        | name, targetValue                                                  | Configurable catalog                                 |
| SponsorDeliverable    | sponsorId, dueAt, status, evidenceUrl, reach                       | Reach classified estimate unless verified            |
| Campaign              | channel, spend, dates                                              | end ≥ start                                          |
| FunnelMetric          | campaign/fixture, stage, value, measuredAt                         | Nonnegative, aggregated                              |
| SupporterCohort       | month, supporters, returned30d/60d                                 | Returns ≤ supporters; no direct identifiers in pilot |
| CommunityProgram      | name, program, owner                                               | Operational program register                         |
| CommunityImpactRecord | date, participants, attendance, hours, contribution, reach, source | Nonnegative; explicit provenance                     |
| Scenario              | name, program, createdBy, version, assumptions                     | JSON assumptions versioned and audited               |
| KpiTarget             | key, value, unit, effectiveFrom                                    | Unique effective version                             |
| Risk                  | title, likelihood, impact, owner, mitigation, status               | likelihood/impact 1–5                                |
| Recommendation        | rationale, owner, status, targetDate                               | Decision follow-up                                   |
| ImportBatch           | kind, filename, checksum, counts, status, actor                    | Unique org/kind/checksum                             |
| AuditEvent            | actor, action, entity, summary, metadata, time                     | Append-only application policy                       |
| ApplicationSetting    | organizationId, key, JSON value, actor                             | Composite key; audited                               |

## Data classification

- Public: official club/league facts and source URLs.
- Internal operational: aggregated attendance, revenue, cost, campaign, sponsor, and impact data.
- Restricted: user identity, credentials, contact information, access/audit evidence.
- Synthetic: deterministic demo records, always labeled.
- Calculated/forecast/assumption: derived values with formula/version or explicit assumption status.

The pilot intentionally stores no payment-card, bank-account, medical, safeguarding, or supporter-level direct-identification data.
