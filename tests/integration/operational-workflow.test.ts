import { describe, expect, it } from "vitest";
import { createPilotStore } from "../../lib/operational-workflow";
import { scenarioPresets } from "../../lib/data/demo";

const admin = { id: "admin-1", role: "ADMINISTRATOR" as const };
const operations = { id: "ops-1", role: "MATCHDAY_OPERATIONS" as const };
const analyst = { id: "analyst-1", role: "ANALYST" as const };

describe("required operational workflow", () => {
  it("runs clean organization onboarding, provisioning, import, scenario, and audit", () => {
    const store = createPilotStore("PRODUCTION", () => "2026-10-11T12:00:00.000Z");
    expect(store.state.records).toEqual({});
    expect(store.state.organization.mode).toBe("PRODUCTION");
    store.onboard(admin, "Clean pilot organization");
    store.addUser(admin, "ops@example.test", "MATCHDAY_OPERATIONS");
    store.addUser(admin, "analyst@example.test", "ANALYST");
    const result = store.import(operations, "fixtures", [
      {
        externalId: "F-100",
        date: "2026-07-18T19:00:00Z",
        program: "Women",
        opponent: "Wake FC",
        venue: "Legion Stadium",
        capacity: 6000,
      },
    ]);
    expect(result.committed).toBe(true);
    store.saveScenario(analyst, scenarioPresets[1]!);
    expect(store.state.records.fixtures).toHaveLength(1);
    expect(store.state.scenarios).toHaveLength(1);
    expect(store.state.audit.map((event) => event.action)).toEqual([
      "ONBOARD",
      "USER_CREATED",
      "USER_CREATED",
      "IMPORT_COMMITTED",
      "SCENARIO_SAVED",
    ]);
  });

  it("keeps invalid or duplicate imports atomic", () => {
    const store = createPilotStore("DEMO");
    const first = store.import(operations, "fixtures", [
      {
        externalId: "F-1",
        date: "2026-07-18T19:00:00Z",
        program: "Men",
        opponent: "Wake FC",
        venue: "Legion Stadium",
        capacity: 6000,
      },
    ]);
    expect(first.committed).toBe(true);
    const duplicate = store.import(operations, "fixtures", [
      {
        externalId: "F-1",
        date: "2026-07-19T19:00:00Z",
        program: "Men",
        opponent: "NCFC U23",
        venue: "Legion Stadium",
        capacity: 6000,
      },
    ]);
    expect(duplicate.committed).toBe(false);
    const invalid = store.import(operations, "fixtures", [
      { externalId: "F-2", date: "bad", program: "Men", opponent: "X", venue: "Y", capacity: 0 },
    ]);
    expect(invalid.committed).toBe(false);
    expect(store.state.records.fixtures).toHaveLength(1);
  });

  it("enforces restricted actions outside the interface", () => {
    const store = createPilotStore("DEMO");
    expect(() => store.saveScenario(operations, scenarioPresets[0]!)).toThrow("FORBIDDEN");
    expect(() => store.addUser(analyst, "nope@example.test", "EXECUTIVE")).toThrow("FORBIDDEN");
  });
});
