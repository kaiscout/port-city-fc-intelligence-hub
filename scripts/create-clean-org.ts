import postgres from "postgres";
import { hashPassword } from "../lib/auth/password";
import { env } from "../lib/env";

if (!env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const name = process.env.CLEAN_ORG_NAME;
const email = process.env.CLEAN_ADMIN_EMAIL;
const password = process.env.CLEAN_ADMIN_PASSWORD;
if (!name || !email || !password)
  throw new Error("CLEAN_ORG_NAME, CLEAN_ADMIN_EMAIL, and CLEAN_ADMIN_PASSWORD are required");
const sql = postgres(env.DATABASE_URL, { max: 1, prepare: false });
const passwordHash = await hashPassword(password);
const result = await sql.begin(async (tx) => {
  const [org] =
    await tx`INSERT INTO organization(name,mode,onboarding_complete) VALUES (${name},'PRODUCTION',false) RETURNING id`;
  await tx`INSERT INTO user_account(organization_id,email,display_name,password_hash,role) VALUES (${org!.id},${email.toLowerCase()},'Initial administrator',${passwordHash},'ADMINISTRATOR')`;
  return org;
});
console.log(
  JSON.stringify({
    event: "clean_org.created",
    organizationId: result!.id,
    email: email.toLowerCase(),
    syntheticRecords: 0,
  }),
);
await sql.end();
