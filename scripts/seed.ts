import postgres from "postgres";
import { hashPassword } from "../lib/auth/password";
import { env } from "../lib/env";
import { scenarioPresets } from "../lib/data/demo";
import { toScenarioRowInput } from "../lib/scenarios";

if (!env.DATABASE_URL) throw new Error("DATABASE_URL is required");
if (env.DEMO_MODE !== "true")
  throw new Error("Refusing to seed synthetic data unless DEMO_MODE=true");
const password = process.env.DEMO_ADMIN_PASSWORD;
if (!password) throw new Error("DEMO_ADMIN_PASSWORD is required for deterministic demo seeding");
const sql = postgres(env.DATABASE_URL, { max: 1, prepare: false });
const passwordHash = await hashPassword(password);
const ids = {
  org: "00000000-0000-4000-8000-000000000010",
  user: "00000000-0000-4000-8000-000000000001",
  season: "00000000-0000-4000-8000-000000000020",
  men: "00000000-0000-4000-8000-000000000031",
  women: "00000000-0000-4000-8000-000000000032",
  l2: "00000000-0000-4000-8000-000000000041",
  wl: "00000000-0000-4000-8000-000000000042",
  legion: "00000000-0000-4000-8000-000000000051",
  uncw: "00000000-0000-4000-8000-000000000052",
  scenarios: [
    "00000000-0000-4000-8000-000000000100",
    "00000000-0000-4000-8000-000000000101",
    "00000000-0000-4000-8000-000000000102",
  ],
};
await sql.begin(async (tx) => {
  await tx`INSERT INTO organization(id,name,mode,onboarding_complete) VALUES (${ids.org},'Port City FC · Demonstration organization','DEMO',true) ON CONFLICT (id) DO NOTHING`;
  await tx`INSERT INTO user_account(id,organization_id,email,display_name,password_hash,role) VALUES (${ids.user},${ids.org},'admin@pcfc-demo.local','Alex Morgan',${passwordHash},'ADMINISTRATOR') ON CONFLICT (email) DO UPDATE SET password_hash=EXCLUDED.password_hash`;
  await tx`INSERT INTO season(id,organization_id,name,starts_on,ends_on,active) VALUES (${ids.season},${ids.org},'2026','2026-01-01','2026-12-31',true) ON CONFLICT DO NOTHING`;
  await tx`INSERT INTO team(id,organization_id,name,program) VALUES (${ids.men},${ids.org},'Port City FC Men','MEN'),(${ids.women},${ids.org},'Port City FC Women','WOMEN') ON CONFLICT DO NOTHING`;
  await tx`INSERT INTO competition(id,organization_id,name) VALUES (${ids.l2},${ids.org},'USL League Two'),(${ids.wl},${ids.org},'USL W League') ON CONFLICT DO NOTHING`;
  await tx`INSERT INTO venue(id,organization_id,name,capacity) VALUES (${ids.legion},${ids.org},'Legion Stadium',6000),(${ids.uncw},${ids.org},'UNCW Soccer Stadium',3000) ON CONFLICT DO NOTHING`;
  await tx`INSERT INTO kpi_target(organization_id,key,value,unit,effective_from) VALUES (${ids.org},'operating_margin_pct',18,'percent','2026-01-01'),(${ids.org},'returning_supporter_pct',50,'percent','2026-01-01'),(${ids.org},'sponsor_fulfillment_pct',90,'percent','2026-01-01') ON CONFLICT DO NOTHING`;
  for (const [index, scenario] of scenarioPresets.entries()) {
    const scenarioId = ids.scenarios[index];
    if (!scenarioId) throw new Error(`Missing deterministic scenario id at index ${index}`);
    const { name, program, assumptions } = toScenarioRowInput(scenario);
    await tx`INSERT INTO scenario(id,organization_id,name,program,created_by_id,version,assumptions)
      VALUES (${scenarioId},${ids.org},${name},${program},${ids.user},1,${JSON.stringify(assumptions)}::jsonb)
      ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, program=EXCLUDED.program, assumptions=EXCLUDED.assumptions, updated_at=now()`;
  }
  await tx`INSERT INTO audit_event(organization_id,actor_user_id,action,entity_type,entity_id,summary,metadata) VALUES (${ids.org},${ids.user},'DEMO_SEED','organization',${ids.org},'Created deterministic demonstration organization','{"classification":"Synthetic demonstration data"}'::jsonb)`;
});
console.log(
  JSON.stringify({
    event: "demo.seed_complete",
    organizationId: ids.org,
    email: "admin@pcfc-demo.local",
  }),
);
await sql.end();
