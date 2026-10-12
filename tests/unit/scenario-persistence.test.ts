import { describe, expect, it } from "vitest";
import { scenarioPresets } from "../../lib/data/demo";
import { fromScenarioRow, toScenarioRowInput } from "../../lib/scenarios";

describe("scenario persistence mapping", () => {
  it("round-trips a scenario through the PostgreSQL row shape", () => {
    const input = scenarioPresets[1]!;
    const stored = toScenarioRowInput(input);
    const restored = fromScenarioRow({
      id: "9e4bc49e-f0e5-46a6-a1d2-44a5e0dff816",
      ...stored,
    });
    expect(restored).toEqual({ ...input, id: "9e4bc49e-f0e5-46a6-a1d2-44a5e0dff816" });
  });

  it("rejects percentages outside their domain", () => {
    expect(() => toScenarioRowInput({ ...scenarioPresets[0]!, complimentaryPct: 101 })).toThrow();
  });
});
