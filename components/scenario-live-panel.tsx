"use client";

import { useEffect, useRef, useState } from "react";
import type { ScenarioInput } from "@/lib/types";
import { calculateScenario } from "@/lib/calculations";
import { currency, number, percent } from "@/lib/format";
import { mountScenarioChart, scenarioExplanation } from "../site/scenario-visuals.js";

export function ScenarioLivePanel({
  input,
  reference,
}: {
  input: ScenarioInput | null;
  reference: ScenarioInput | null;
}) {
  const host = useRef<HTMLDivElement>(null);
  const chart = useRef<ReturnType<typeof mountScenarioChart> | null>(null);
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    if (!host.current || !input) return;
    if (!chart.current) chart.current = mountScenarioChart(host.current, input, reference ?? input);
    else chart.current.update(input, reference ?? input);
  }, [input, reference]);
  useEffect(() => () => chart.current?.destroy(), []);
  useEffect(() => {
    if (!input && chart.current) {
      chart.current.destroy();
      chart.current = null;
    }
  }, [input]);
  if (!input)
    return (
      <aside className="lab-results">
        <div className="lab-chart-empty">
          <div>
            <span className="lab-eyebrow">Your Plan, Visualized</span>
            <h2>Inputs Required</h2>
            <p>
              Enter your assumptions and plan details to see the live attendance graph. Unknown
              values stay blank.
            </p>
          </div>
        </div>
      </aside>
    );
  const r = calculateScenario(input);
  const delta = r.operatingMargin - calculateScenario(reference ?? input).operatingMargin;
  return (
    <aside
      className={`lab-results${expanded ? " expanded" : ""}`}
      aria-label="Live scenario results"
    >
      <button
        className="lab-mobile-expand"
        aria-expanded={expanded}
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? "Compact Graph" : "Expand Graph"}
      </button>
      <div className="lab-outcome">
        <span className="lab-eyebrow">
          {input.scope === "Per fixture" ? "Per Home Match" : `${input.homeMatches} Home Matches`} ·{" "}
          {input.program}
        </span>
        <div className="lab-outcome-line">
          <div>
            <h2>Money Left After Costs</h2>
            <strong className={r.operatingMargin < 0 ? "is-shortfall" : "is-surplus"}>
              {currency(r.operatingMargin)}
            </strong>
          </div>
          <span className={`lab-delta ${delta < 0 ? "is-shortfall" : "is-surplus"}`}>
            {delta < 0 ? "−" : "+"}
            {currency(Math.abs(delta))}
            <small>vs starting case</small>
          </span>
        </div>
        <p>{percent(r.operatingMarginPct)} of receipts · before shared club overhead & taxes</p>
      </div>
      <div className="lab-chart-host" ref={host} />
      <div className="lab-stat-grid">
        <div className="lab-stat">
          <small>Money Coming In</small>
          <b>{currency(r.totalRevenue)}</b>
          <span>All receipts in this plan</span>
        </div>
        <div className="lab-stat">
          <small>Costs & Allowances</small>
          <b>{currency(r.totalCost)}</b>
          <span>Includes planning buffers</span>
        </div>
        <div className="lab-stat">
          <small>Fans to Break Even</small>
          <b>{r.breakEvenAttendance === null ? "Unreachable" : number(r.breakEvenAttendance)}</b>
          <span>{r.feasible ? "Per home match" : "Above venue capacity"}</span>
        </div>
      </div>
      <p className="lab-verdict">{scenarioExplanation(input)}</p>
      <details className="lab-method">
        <summary>View the Calculation & Breakdown</summary>
        <div className="lab-method-body">
          <p>
            Contribution = receipts − direct costs − attendee costs − community funding − planning
            buffers. Every attendance-linked amount is capped at venue capacity. Sponsorship follows
            its selected frequency.
          </p>
          <table className="data-table">
            <tbody>
              {[
                ["Ticket receipts", r.ticketRevenue],
                ["Food & drink receipts", r.concessionRevenue],
                ["Merchandise receipts", r.merchandiseRevenue],
                ["Sponsor funding", r.sponsorshipAllocation],
                ["Direct fixed costs", -r.fixedCosts],
                [
                  "Attendee costs",
                  -(r.variableCosts - r.charitableContribution - r.downsideExposure),
                ],
                ["Community funding", -r.charitableContribution],
                ["Planning buffers", -r.downsideExposure],
                ["Money left after costs", r.operatingMargin],
              ].map(([label, value]) => (
                <tr key={label}>
                  <td>{label}</td>
                  <td>{currency(Number(value))}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p>
            Conditional planning. Shared overhead and taxes are excluded. Saved cases retain their
            provenance and version history.
          </p>
        </div>
      </details>
    </aside>
  );
}
