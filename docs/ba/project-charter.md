# Project Charter

## Purpose

Deliver a credible operational pilot that converts club goals and operational records into governed decisions across matchday economics, supporters, sponsorship, programs, and community impact.

## Sponsor and ownership assumptions

Portfolio project owner: repository author. Hypothetical organizational sponsor: executive leadership. Product owner: club administrator. These roles are documented assumptions and do not imply Port City FC participation or endorsement.

## Objectives

1. Provide a club-wide executive view with drill-down and provenance.
2. Model, save, compare, and export matchday scenarios.
3. Trace the supporter funnel and cohort retention.
4. Control sponsor profiles, deliverables, risk, and print reporting.
5. Compare men’s and women’s programs equitably.
6. Record community impact without confusing synthetic and official evidence.
7. Support onboarding, roles, configuration, CRUD, validated imports, audit, and recovery.

## Measures of success

- Critical requirements pass automated or UAT verification.
- Invalid/duplicate CSV rows cannot commit.
- Restricted server actions reject unauthorized roles.
- Calculations reproduce documented examples.
- A clean organization operates with zero seeded records.
- Major pages pass desktop/tablet/mobile and print inspection.

## Constraints

No external account changes, deployment, paid service, or real club data. Provider integrations are boundaries, not implemented claims. PostgreSQL is the production datastore; local demonstration mode may render deterministic data without a database.

## Milestones

Research and analysis → architecture and model → operational workflows → security controls → tests → visual QA → documentation and readiness assessment.
