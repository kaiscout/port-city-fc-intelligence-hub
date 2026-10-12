import { describe, expect, it } from "vitest";
import { demoSponsors } from "../../lib/data/demo";
import { assessSponsorRisk } from "../../lib/sponsor-risk";

describe("sponsor renewal risk", () => {
  it("assigns low risk when delivery and intent are healthy", () => {
    const result = assessSponsorRisk(demoSponsors[0]!);
    expect(result.level).toBe("Low");
    expect(result.reasons.join(" ")).toContain("Positive renewal intent");
  });

  it("explains high risk with rule evidence", () => {
    const result = assessSponsorRisk(demoSponsors[3]!);
    expect(result.level).toBe("High");
    expect(result.score).toBeGreaterThanOrEqual(55);
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        expect.stringContaining("deliverables"),
        expect.stringContaining("overdue"),
        expect.stringContaining("Renewal intent"),
      ]),
    );
  });
});
