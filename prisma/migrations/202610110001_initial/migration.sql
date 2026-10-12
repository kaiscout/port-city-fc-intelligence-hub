CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
  CREATE TYPE role AS ENUM ('ADMINISTRATOR','EXECUTIVE','ANALYST','COMMERCIAL','MARKETING','MATCHDAY_OPERATIONS');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE program AS ENUM ('MEN','WOMEN','CLUB_WIDE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS organization (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL,
  mode text NOT NULL DEFAULT 'DEMO' CHECK (mode IN ('DEMO','PRODUCTION')),
  onboarding_complete boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS user_account (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE, display_name text NOT NULL, password_hash text NOT NULL, role role NOT NULL,
  active boolean NOT NULL DEFAULT true, failed_sign_ins integer NOT NULL DEFAULT 0 CHECK (failed_sign_ins >= 0),
  locked_until timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS session (
  id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES user_account(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), revoked_at timestamptz
);
CREATE INDEX IF NOT EXISTS session_user_expires_idx ON session(user_id, expires_at);
CREATE TABLE IF NOT EXISTS permission (code text PRIMARY KEY, description text NOT NULL);
CREATE TABLE IF NOT EXISTS role_permission (role role NOT NULL, permission_code text NOT NULL REFERENCES permission(code), PRIMARY KEY(role, permission_code));

CREATE TABLE IF NOT EXISTS season (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  name text NOT NULL, starts_on date NOT NULL, ends_on date NOT NULL, active boolean NOT NULL DEFAULT false,
  CHECK (ends_on >= starts_on), UNIQUE(organization_id, name)
);
CREATE TABLE IF NOT EXISTS team (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  name text NOT NULL, program program NOT NULL, UNIQUE(organization_id, name)
);
CREATE TABLE IF NOT EXISTS competition (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  name text NOT NULL, external_id text, UNIQUE(organization_id, name)
);
CREATE TABLE IF NOT EXISTS venue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  name text NOT NULL, capacity integer NOT NULL CHECK (capacity > 0), address text, UNIQUE(organization_id, name)
);
CREATE TABLE IF NOT EXISTS fixture (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  season_id uuid NOT NULL REFERENCES season(id), team_id uuid NOT NULL REFERENCES team(id), competition_id uuid NOT NULL REFERENCES competition(id), venue_id uuid NOT NULL REFERENCES venue(id),
  external_id text NOT NULL, opponent text NOT NULL, starts_at timestamptz NOT NULL, status text NOT NULL DEFAULT 'SCHEDULED',
  UNIQUE(organization_id, external_id)
);
CREATE INDEX IF NOT EXISTS fixture_scope_idx ON fixture(organization_id, starts_at, team_id, venue_id);
CREATE TABLE IF NOT EXISTS attendance_record (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), fixture_id uuid NOT NULL REFERENCES fixture(id) ON DELETE CASCADE,
  paid integer NOT NULL CHECK (paid >= 0), complimentary integer NOT NULL DEFAULT 0 CHECK (complimentary >= 0), returning_supporters integer NOT NULL DEFAULT 0 CHECK (returning_supporters >= 0),
  source text NOT NULL, recorded_at timestamptz NOT NULL DEFAULT now(), CHECK (returning_supporters <= paid)
);
CREATE TABLE IF NOT EXISTS ticket_category (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  name text NOT NULL, default_price numeric(12,2) NOT NULL CHECK (default_price >= 0), UNIQUE(organization_id, name)
);
CREATE TABLE IF NOT EXISTS ticket_channel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  name text NOT NULL, external_id text, UNIQUE(organization_id, name)
);
CREATE TABLE IF NOT EXISTS revenue_item (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), fixture_id uuid REFERENCES fixture(id) ON DELETE CASCADE,
  category text NOT NULL, amount numeric(14,2) NOT NULL CHECK (amount >= 0), source text NOT NULL
);
CREATE TABLE IF NOT EXISTS cost_item (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), fixture_id uuid REFERENCES fixture(id) ON DELETE CASCADE,
  category text NOT NULL, amount numeric(14,2) NOT NULL CHECK (amount >= 0), shared boolean NOT NULL DEFAULT false, source text NOT NULL
);

CREATE TABLE IF NOT EXISTS sponsor_package (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  name text NOT NULL, target_value numeric(14,2) NOT NULL CHECK (target_value >= 0), description text, UNIQUE(organization_id, name)
);
CREATE TABLE IF NOT EXISTS sponsor (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  package_id uuid REFERENCES sponsor_package(id), name text NOT NULL, contract_value numeric(14,2) NOT NULL CHECK (contract_value >= 0),
  starts_on date NOT NULL, ends_on date NOT NULL, program program NOT NULL, renewal_intent text NOT NULL DEFAULT 'UNKNOWN', notes text,
  CHECK (ends_on >= starts_on), UNIQUE(organization_id, name, starts_on)
);
CREATE TABLE IF NOT EXISTS sponsor_contact (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), sponsor_id uuid NOT NULL REFERENCES sponsor(id) ON DELETE CASCADE,
  name text NOT NULL, email text NOT NULL, phone text
);
CREATE TABLE IF NOT EXISTS sponsor_deliverable (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), sponsor_id uuid NOT NULL REFERENCES sponsor(id) ON DELETE CASCADE,
  name text NOT NULL, due_at timestamptz NOT NULL, status text NOT NULL, evidence_url text, estimated_reach integer CHECK (estimated_reach >= 0)
);
CREATE INDEX IF NOT EXISTS sponsor_deliverable_due_idx ON sponsor_deliverable(sponsor_id, due_at, status);

CREATE TABLE IF NOT EXISTS campaign (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  name text NOT NULL, channel text NOT NULL, spend numeric(14,2) NOT NULL CHECK (spend >= 0), starts_at timestamptz NOT NULL, ends_at timestamptz NOT NULL,
  CHECK (ends_at >= starts_at)
);
CREATE TABLE IF NOT EXISTS funnel_metric (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), campaign_id uuid REFERENCES campaign(id) ON DELETE CASCADE, fixture_id uuid REFERENCES fixture(id) ON DELETE CASCADE,
  stage text NOT NULL, value integer NOT NULL CHECK (value >= 0), measured_at timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS supporter_cohort (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  name text NOT NULL, acquired_month text NOT NULL, supporters integer NOT NULL CHECK (supporters >= 0), returned_30d integer NOT NULL DEFAULT 0 CHECK (returned_30d >= 0), returned_60d integer NOT NULL DEFAULT 0 CHECK (returned_60d >= 0),
  CHECK (returned_30d <= supporters), CHECK (returned_60d <= supporters), UNIQUE(organization_id, name)
);
CREATE TABLE IF NOT EXISTS community_program (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  name text NOT NULL, program program NOT NULL, owner text NOT NULL, UNIQUE(organization_id, name)
);
CREATE TABLE IF NOT EXISTS community_impact_record (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), community_program_id uuid NOT NULL REFERENCES community_program(id) ON DELETE CASCADE,
  occurred_on date NOT NULL, participants integer NOT NULL CHECK (participants >= 0), event_attendance integer NOT NULL CHECK (event_attendance >= 0),
  volunteer_hours numeric(10,2) NOT NULL CHECK (volunteer_hours >= 0), contribution numeric(14,2) NOT NULL CHECK (contribution >= 0), estimated_reach integer NOT NULL CHECK (estimated_reach >= 0), source text NOT NULL
);

CREATE TABLE IF NOT EXISTS scenario (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  name text NOT NULL, program program NOT NULL, created_by_id uuid NOT NULL REFERENCES user_account(id), version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  assumptions jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS kpi_target (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  key text NOT NULL, value numeric(14,4) NOT NULL, unit text NOT NULL, effective_from timestamptz NOT NULL,
  UNIQUE(organization_id, key, effective_from)
);
CREATE TABLE IF NOT EXISTS risk (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  title text NOT NULL, likelihood integer NOT NULL CHECK (likelihood BETWEEN 1 AND 5), impact integer NOT NULL CHECK (impact BETWEEN 1 AND 5),
  owner text NOT NULL, mitigation text NOT NULL, status text NOT NULL
);
CREATE TABLE IF NOT EXISTS recommendation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  title text NOT NULL, rationale text NOT NULL, owner text NOT NULL, status text NOT NULL, target_date date
);
CREATE TABLE IF NOT EXISTS import_batch (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  kind text NOT NULL, source_filename text NOT NULL, checksum text NOT NULL, row_count integer NOT NULL CHECK (row_count >= 0),
  accepted_count integer NOT NULL CHECK (accepted_count >= 0), rejected_count integer NOT NULL CHECK (rejected_count >= 0), status text NOT NULL,
  created_by_id uuid NOT NULL REFERENCES user_account(id), created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(organization_id, kind, checksum)
);
CREATE TABLE IF NOT EXISTS audit_event (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  actor_user_id uuid REFERENCES user_account(id), action text NOT NULL, entity_type text NOT NULL, entity_id text,
  summary text NOT NULL, metadata jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_org_time_idx ON audit_event(organization_id, created_at DESC);
CREATE TABLE IF NOT EXISTS application_setting (
  organization_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE, key text NOT NULL, value jsonb NOT NULL,
  updated_by_id uuid NOT NULL REFERENCES user_account(id), updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(organization_id, key)
);
CREATE TABLE IF NOT EXISTS operational_record (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  entity_type text NOT NULL, external_id text NOT NULL, name text NOT NULL, status text NOT NULL DEFAULT 'ACTIVE', payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by_id uuid NOT NULL REFERENCES user_account(id), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, entity_type, external_id)
);

INSERT INTO permission(code, description) VALUES
  ('dashboard:read','View executive dashboards'), ('analytics:read','View analytical detail'), ('scenarios:read','View scenarios'),
  ('scenarios:write','Create and manage scenarios'), ('reports:read','View reports'), ('reports:export','Export reports'),
  ('sponsors:read','View sponsors'), ('sponsors:write','Manage sponsors'), ('funnel:read','View funnel metrics'),
  ('funnel:write','Manage funnel metrics'), ('community:read','View community impact'), ('fixtures:read','View fixtures'),
  ('fixtures:write','Manage fixtures'), ('attendance:write','Manage attendance'), ('imports:write','Commit imports')
ON CONFLICT DO NOTHING;
