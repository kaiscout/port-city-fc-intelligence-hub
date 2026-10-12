import { randomUUID } from "node:crypto";
import type { Role, ScenarioInput } from "./types";
import { assertPermission } from "./rbac";
import { type ImportKind, validateRows } from "./csv";

type Audit = { action: string; actor: string; entity: string; at: string };
type PilotState = {
  organization: {
    id: string;
    name: string;
    mode: "DEMO" | "PRODUCTION";
    onboardingComplete: boolean;
  };
  users: { id: string; email: string; role: Role }[];
  records: Record<string, Record<string, unknown>[]>;
  scenarios: ScenarioInput[];
  audit: Audit[];
};

export function createPilotStore(
  mode: "DEMO" | "PRODUCTION",
  now = () => new Date().toISOString(),
) {
  const state: PilotState = {
    organization: { id: randomUUID(), name: "", mode, onboardingComplete: false },
    users: [],
    records: {},
    scenarios: [],
    audit: [],
  };
  const audit = (action: string, actor: string, entity: string) =>
    state.audit.push({ action, actor, entity, at: now() });
  return {
    state,
    onboard(actor: { id: string; role: Role }, name: string) {
      assertPermission(actor.role, "*");
      if (name.trim().length < 2) throw new Error("INVALID_ORGANIZATION");
      state.organization.name = name.trim();
      state.organization.onboardingComplete = true;
      audit("ONBOARD", actor.id, state.organization.id);
    },
    addUser(actor: { id: string; role: Role }, email: string, role: Role) {
      assertPermission(actor.role, "*");
      if (state.users.some((user) => user.email === email.toLowerCase()))
        throw new Error("DUPLICATE_USER");
      state.users.push({ id: randomUUID(), email: email.toLowerCase(), role });
      audit("USER_CREATED", actor.id, email.toLowerCase());
    },
    import(actor: { id: string; role: Role }, kind: ImportKind, rows: Record<string, unknown>[]) {
      assertPermission(actor.role, "imports:write");
      const validation = validateRows(kind, rows);
      if (validation.some((row) => !row.valid)) return { committed: false, validation };
      const existing = state.records[kind] ?? [];
      const existingIds = new Set(
        existing.map((row) => String(row.externalId ?? row.fixtureExternalId).toLowerCase()),
      );
      if (
        validation.some((row) =>
          existingIds.has(
            String(
              (row.data as Record<string, unknown>).externalId ??
                (row.data as Record<string, unknown>).fixtureExternalId,
            ).toLowerCase(),
          ),
        )
      ) {
        return {
          committed: false,
          validation: validation.map((row) => ({
            ...row,
            valid: false,
            errors: [...row.errors, "Duplicate record already exists"],
          })),
        };
      }
      state.records[kind] = [
        ...existing,
        ...validation.map((row) => row.data as Record<string, unknown>),
      ];
      audit("IMPORT_COMMITTED", actor.id, kind);
      return { committed: true, validation };
    },
    saveScenario(actor: { id: string; role: Role }, scenario: ScenarioInput) {
      assertPermission(actor.role, "scenarios:write");
      const index = state.scenarios.findIndex((item) => item.id === scenario.id);
      if (index >= 0) state.scenarios[index] = scenario;
      else state.scenarios.push(scenario);
      audit("SCENARIO_SAVED", actor.id, scenario.id);
    },
  };
}
