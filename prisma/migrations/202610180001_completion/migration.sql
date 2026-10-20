ALTER TABLE operational_record ADD COLUMN version integer NOT NULL DEFAULT 1 CHECK(version > 0);
CREATE UNIQUE INDEX operational_record_identity_casefold ON operational_record(organization_id,entity_type,lower(external_id));
ALTER TABLE import_batch ADD COLUMN preview_rows jsonb NOT NULL DEFAULT '[]';
ALTER TABLE import_batch ADD COLUMN validation jsonb NOT NULL DEFAULT '[]';
ALTER TABLE import_batch ADD COLUMN completed_at timestamptz;
ALTER TABLE import_batch ADD COLUMN version integer NOT NULL DEFAULT 1;
ALTER TABLE application_setting ADD COLUMN version integer NOT NULL DEFAULT 1;
ALTER TABLE user_account ADD COLUMN version integer NOT NULL DEFAULT 1;
CREATE TABLE scenario_revision (
  scenario_id uuid NOT NULL REFERENCES scenario(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organization(id),
  version integer NOT NULL,
  snapshot jsonb NOT NULL,
  actor_user_id uuid NOT NULL REFERENCES user_account(id),
  recorded_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(scenario_id,version)
);
CREATE INDEX audit_org_created ON audit_event(organization_id,created_at DESC);
ALTER TABLE scenario ADD COLUMN archived boolean NOT NULL DEFAULT false;
UPDATE scenario SET assumptions=jsonb_build_object('scope','Per fixture','homeMatches',1,'sponsorFrequency','Per fixture','variableCostPerAttendee',2.4,'provenance','Migrated existing native per-fixture assumptions; original attendee-cost constant 2.40. Not an approved forecast.','referenceDate','2026-10-12') || assumptions;
INSERT INTO scenario_revision(scenario_id,organization_id,version,snapshot,actor_user_id)
SELECT id,organization_id,version,jsonb_build_object('id',id,'name',name,'program',CASE program WHEN 'MEN' THEN 'Men' ELSE 'Women' END,'version',version)||assumptions,created_by_id FROM scenario;
