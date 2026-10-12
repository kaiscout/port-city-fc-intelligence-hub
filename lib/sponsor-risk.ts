import type { Sponsor } from "./types";

export type RiskLevel = "Low" | "Moderate" | "High";

export function assessSponsorRisk(sponsor: Sponsor): {
  level: RiskLevel;
  score: number;
  reasons: string[];
} {
  let score = 0;
  const reasons: string[] = [];
  const fulfillmentPct = sponsor.total ? (sponsor.delivered / sponsor.total) * 100 : 0;

  if (fulfillmentPct < 65) {
    score += 45;
    reasons.push(`Only ${Math.round(fulfillmentPct)}% of deliverables are complete`);
  } else if (fulfillmentPct < 85) {
    score += 22;
    reasons.push(`Fulfillment is below the 85% target (${Math.round(fulfillmentPct)}%)`);
  }
  if (sponsor.overdue > 0) {
    score += Math.min(30, sponsor.overdue * 12);
    reasons.push(
      `${sponsor.overdue} deliverable${sponsor.overdue === 1 ? " is" : "s are"} overdue`,
    );
  }
  if (sponsor.engagementPct < 2) {
    score += 18;
    reasons.push("Activation engagement is below 2%");
  }
  if (sponsor.renewalIntent === "Unknown") {
    score += 12;
    reasons.push("Renewal intent has not been confirmed");
  } else if (sponsor.renewalIntent === "Positive") {
    score = Math.max(0, score - 12);
    reasons.push("Positive renewal intent reduces risk");
  }

  if (reasons.length === 0) reasons.push("Delivery, engagement, and renewal signals are on target");
  return { level: score >= 55 ? "High" : score >= 25 ? "Moderate" : "Low", score, reasons };
}
