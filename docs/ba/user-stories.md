# User Stories and Acceptance Criteria

## US-001 — First-run onboarding

As an administrator, I want to configure a clean organization so that the Hub does not depend on demonstration records.

- Given an empty database, when valid organization, season, program, venue, catalog, and target data are submitted, then configuration is saved and audited.
- Production mode creates no synthetic records and no default password.

## US-002 — Staff provisioning

As an administrator, I want to provision a staff user with one role so that access is deliberate.

- Email is unique and password is Argon2id hashed.
- Restricted APIs reject that user even if they bypass the interface.

## US-003 — Fixture import

As a matchday-operations user, I want to preview a fixture CSV so that errors do not reach live records.

- A template documents required headers.
- Invalid dates/capacity and in-file/existing duplicates show row errors.
- Valid rows commit atomically with an import batch and audit event.

## US-004 — Executive review

As an executive, I want filter-aware KPIs with definitions and provenance so that I can trust the scope and meaning.

- Changing team, venue, competition, or fixture changes relevant KPIs and detail.
- Every KPI exposes source class and definition.

## US-005 — Scenario decision

As an analyst, I want to save and compare scenarios so that assumptions and downside are explicit.

- Conservative, baseline, and optimistic presets are present.
- Results update immediately, can be duplicated/deleted, and export from current data.

## US-006 — Sponsor delivery

As commercial staff, I want rule-based renewal risk and next actions so that I intervene early.

- Risk shows score drivers; changing fulfillment signals changes classification.
- A print-ready report contains actual sponsor application data.

## US-007 — Program investment

As leadership, I want equivalent program measures and a women’s business case so that allocation is evidence-led.

- Shared and program-specific costs are visible.
- Conservative/baseline/optimistic outcomes and success gates are shown.

## US-008 — Community reporting

As a community owner, I want provenance on impact records so external narratives do not overstate evidence.

- Synthetic figures are visibly labeled and excluded from official-claim language.

## US-009 — Audit investigation

As an administrator, I want actor/action/object/time history so that important changes are traceable.

- Imports, users, settings, scenarios, and sponsor-delivery writes append events.

## US-010 — Recovery

As the service owner, I want verified backup and restore instructions so a database loss is recoverable.

- Backup uses encrypted storage and checksum; restore is tested in isolation before cutover.
