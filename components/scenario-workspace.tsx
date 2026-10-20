"use client";
import { ScenarioLivePanel } from "./scenario-live-panel";
import { freeEntryExplanation } from "../site/scenario-visuals.js";
import { useEffect, useMemo, useState } from "react";
import { scenarioPresets } from "@/lib/data/demo";
import { scenarioInputSchema } from "@/lib/scenarios";
import { calculateScenario } from "@/lib/calculations";
import type { ScenarioInput } from "@/lib/types";
import { currency } from "@/lib/format";
import { toCsv } from "@/lib/csv";
import { useHubData } from "./data-context";
import { requestJson } from "./operations-workspace";
import { downloadText } from "./club-workspace";
import { Card, CardHeader, DataTable, PageHeader } from "./ui";
const numericFields = [
  ["expectedAttendance", "Expected Fans per Home Match"],
  ["venueCapacity", "Venue Capacity"],
  ["ticketPrice", "Average Ticket Price (USD)"],
  ["complimentaryPct", "Guests Admitted Free (%)"],
  ["concessionParticipationPct", "Fans Buying Food or Drink (%)"],
  ["averageConcessionSpend", "Spend per Food or Drink Buyer (USD)"],
  ["merchandiseParticipationPct", "Fans Buying Merchandise (%)"],
  ["averageMerchandiseSpend", "Spend per Merchandise Buyer (USD)"],
  ["sponsorIncome", "Sponsorship Amount (USD)"],
  ["variableCostPerAttendee", "Cost per Attendee (USD)"],
  ["marketingSpend", "Marketing per Match (USD)"],
  ["staffing", "Staffing per Match (USD)"],
  ["security", "Security per Match (USD)"],
  ["officials", "Officials per Match (USD)"],
  ["venueCosts", "Venue per Match (USD)"],
  ["transportation", "Transport per Match (USD)"],
  ["equipment", "Equipment per Match (USD)"],
  ["communityAllocationPct", "Community Funding (%)"],
  ["weatherRiskPct", "Weather Buffer (%)"],
  ["operationalRiskPct", "Operations Buffer (%)"],
] as const;
const strings = (input: ScenarioInput) =>
  Object.fromEntries(
    Object.entries(input)
      .filter(([, v]) => v !== undefined)
      .map(([key, v]) => [key, String(v)]),
  );
const blank = (): Record<string, string> => ({
  id: `new-${Date.now()}`,
  name: "",
  program: "Men",
  scope: "Per fixture",
  homeMatches: "1",
  sponsorFrequency: "Per fixture",
  provenance: "",
  referenceDate: "",
  ...Object.fromEntries(numericFields.map(([key]) => [key, ""])),
});
type Revision = { version: number; snapshot: ScenarioInput; recorded_at: string };
export function ScenarioWorkspace() {
  const {
    privateMode,
    scenarios,
    scenariosReady,
    scenariosReadOnly,
    scenarioError,
    duplicateScenario,
    deleteScenario,
    reloadScenarios,
  } = useHubData();
  const [draft, setDraft] = useState<Record<string, string>>(() =>
    privateMode ? blank() : strings(scenarioPresets[1]!),
  );
  const [reference, setReference] = useState<ScenarioInput | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [revisions, setRevisions] = useState<Revision[]>([]);
  useEffect(() => {
    if (!scenariosReady || initialized) return;
    const timer = setTimeout(() => {
      if (scenarios.length)
        setDraft(strings(scenarios.find((s) => s.id === "baseline") ?? scenarios[0]!));
      setSelected(scenarios.slice(0, 3).map((s) => s.id));
      setInitialized(true);
    }, 0);
    return () => clearTimeout(timer);
  }, [scenarios, scenariosReady, initialized]);
  const parsed = useMemo(
    () =>
      scenarioInputSchema.safeParse({
        ...draft,
        ...Object.fromEntries(
          [...numericFields.map(([key]) => key), "homeMatches"].map((key) => [
            key,
            draft[key] === "" ? NaN : Number(draft[key]),
          ]),
        ),
        ...(draft.version ? { version: Number(draft.version) } : {}),
      }),
    [draft],
  );
  const input = parsed.success ? parsed.data : null;
  const result = input ? calculateScenario(input) : null;
  useEffect(() => {
    if (!input || reference) return;
    const timer = setTimeout(() => setReference(input), 0);
    return () => clearTimeout(timer);
  }, [input, reference]);
  const compare = scenarios.filter((s) => selected.includes(s.id));
  const run = async (work: () => Promise<void>) => {
    setPending(true);
    setError("");
    setMessage("");
    try {
      await work();
    } catch (e) {
      setError(e instanceof Error ? e.message : "The server did not confirm this change");
    } finally {
      setPending(false);
    }
  };
  const update = (key: string, v: string) => setDraft((current) => ({ ...current, [key]: v }));
  const select = async (s: ScenarioInput) => {
    setDraft(strings(s));
    setReference(s);
    setRevisions([]);
    if (privateMode && s.version)
      try {
        setRevisions((await requestJson<{ data: Revision[] }>(`/api/scenarios/${s.id}`)).data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unable to load revisions");
      }
  };
  return (
    <div className="lab-shell private-lab">
      <PageHeader
        eyebrow={privateMode ? "Private conditional planning" : "Synthetic planning sandbox"}
        title="Scenario Lab"
        description="Adjust matchday assumptions. See what changes, and why. Saved plans retain their source and version history."
        actions={
          <>
            <button
              className="button button-secondary"
              onClick={() => {
                setDraft(blank());
                setReference(null);
                setRevisions([]);
              }}
            >
              New Blank Scenario
            </button>
            <button
              className="button button-primary"
              disabled={scenariosReadOnly || pending || !parsed.success}
              onClick={() =>
                void run(async () => {
                  if (!parsed.success) return;
                  const saved = await requestJson<{ data: ScenarioInput }>("/api/scenarios", {
                    method: "POST",
                    body: JSON.stringify(parsed.data),
                  });
                  await reloadScenarios();
                  setDraft(strings(saved.data));
                  try {
                    setRevisions(
                      (await requestJson<{ data: Revision[] }>(`/api/scenarios/${saved.data.id}`))
                        .data,
                    );
                  } catch {
                    setError(
                      "The scenario was saved, but version history could not be refreshed. Reopen the case to retry.",
                    );
                  }
                  setSelected((current) => [...new Set([...current, saved.data.id])]);
                  setMessage(
                    `Scenario version ${saved.data.version} committed with immutable revision and audit event.`,
                  );
                })
              }
            >
              Save Scenario
            </button>
          </>
        }
      />
      <details className="private-planning-note">
        <summary>Conditional Planning · About These Figures</summary>
        <div>
          <p>
            All cost inputs are per home fixture. Sponsorship follows its explicit frequency.
            Community allocation applies to total receipts; weather and operational allowances are
            deductions from attendee-linked receipts, not probabilities, observed losses or
            confidence intervals. Costs not entered, shared club overhead and taxes are not implied
            to be covered.
          </p>
        </div>
      </details>
      {scenariosReadOnly && (
        <p className="callout" role="status">
          {privateMode
            ? "Your role has view-only scenario access. Saved cases retain their recorded provenance; planning assumptions are not historical actuals."
            : "Read-only portfolio mode. Existing presets are synthetic planning assumptions; changing them does not create club actuals."}
        </p>
      )}
      {(error || scenarioError) && (
        <p className="callout" role="alert">
          {error || scenarioError}
        </p>
      )}
      {message && (
        <p className="callout" role="status">
          {message}
        </p>
      )}
      <div className="lab-layout">
        <div className="lab-inputs">
          <section className="lab-input-group">
            <h2>Match Setup</h2>
            <div className="form-grid">
              <label className="field field-full">
                Scenario Name
                <input
                  aria-label="Scenario Name"
                  value={draft.name ?? ""}
                  onChange={(e) => update("name", e.target.value)}
                />
              </label>
              <label className="field">
                Program
                <select value={draft.program} onChange={(e) => update("program", e.target.value)}>
                  <option>Men</option>
                  <option>Women</option>
                </select>
              </label>
              <label className="field">
                Planning Scope
                <select
                  aria-label="Planning Scope"
                  value={draft.scope}
                  onChange={(e) => {
                    update("scope", e.target.value);
                    update("homeMatches", e.target.value === "Per fixture" ? "1" : "");
                  }}
                >
                  <option>Per fixture</option>
                  <option>Season</option>
                </select>
              </label>
              <label className="field">
                Home Matches
                <input
                  aria-label="Home Matches"
                  type="number"
                  min="1"
                  step="1"
                  value={draft.homeMatches ?? ""}
                  onChange={(e) => update("homeMatches", e.target.value)}
                  readOnly={draft.scope === "Per fixture"}
                />
                <small>
                  One match for a matchday plan. Enter your home count for a season plan.
                </small>
              </label>
              <label className="field">
                Funding Applies
                <select
                  value={draft.sponsorFrequency}
                  onChange={(e) => update("sponsorFrequency", e.target.value)}
                >
                  <option>Per fixture</option>
                  <option>Per season</option>
                </select>
              </label>
            </div>
          </section>
          {[
            [
              "Attendance & Tickets",
              ["expectedAttendance", "venueCapacity", "ticketPrice", "complimentaryPct"],
            ],
            [
              "Food, Drink & Merchandise",
              [
                "concessionParticipationPct",
                "averageConcessionSpend",
                "merchandiseParticipationPct",
                "averageMerchandiseSpend",
              ],
            ],
            ["Sponsorship", ["sponsorIncome"]],
            [
              "Costs & Allowances",
              [
                "marketingSpend",
                "staffing",
                "security",
                "officials",
                "venueCosts",
                "transportation",
                "equipment",
                "variableCostPerAttendee",
                "communityAllocationPct",
                "weatherRiskPct",
                "operationalRiskPct",
              ],
            ],
          ].map(([title, keys], index) => {
            const content = (
              <section className="lab-input-group" key={String(title)}>
                {index === 0 && <h2>{title}</h2>}
                {(keys as string[]).map((key) => {
                  const label = numericFields.find(([field]) => field === key)![1];
                  const ranges: Record<string, number> = {
                    expectedAttendance: 10000,
                    venueCapacity: 10000,
                    ticketPrice: 100,
                    variableCostPerAttendee: 20,
                    averageConcessionSpend: 25,
                    averageMerchandiseSpend: 100,
                    sponsorIncome: 50000,
                  };
                  const maximum = key.endsWith("Pct")
                    ? 100
                    : Math.max(Number(draft[key]) || 0, ranges[key] ?? 30000);
                  return (
                    <div className="lab-control" key={key}>
                      <label htmlFor={`private-${key}`}>{label}</label>
                      <div className="lab-value-wrap">
                        <input
                          id={`private-${key}`}
                          aria-label={label}
                          type="number"
                          min={key === "venueCapacity" ? 1 : 0}
                          max={maximum}
                          step={key === "expectedAttendance" || key === "venueCapacity" ? 1 : "any"}
                          value={draft[key] ?? ""}
                          onChange={(e) => update(key, e.target.value)}
                        />
                      </div>
                      <input
                        aria-label={label + " slider"}
                        type="range"
                        min={key === "venueCapacity" ? 1 : 0}
                        max={maximum}
                        step={key === "expectedAttendance" || key === "venueCapacity" ? 1 : 0.1}
                        value={draft[key] === "" ? 0 : Number(draft[key])}
                        disabled={draft[key] === ""}
                        onChange={(e) => update(key, e.target.value)}
                      />
                      <small>
                        {key === "complimentaryPct"
                          ? "The percentage of attendees who enter without paying for a ticket. Free-entry guests may still buy food, drink or merchandise."
                          : key === "expectedAttendance"
                            ? "Fans per home match. Every attendee-linked amount is capped at venue capacity."
                            : key.endsWith("RiskPct")
                              ? "Planning deduction from attendee-linked receipts; not a probability."
                              : key === "communityAllocationPct"
                                ? "Share of all receipts, including sponsorship, allocated to community activity."
                                : draft[key] === ""
                                  ? "Enter an approved assumption to enable the slider."
                                  : ""}
                      </small>
                      {key === "complimentaryPct" && input && (
                        <small>{freeEntryExplanation(input)}</small>
                      )}
                    </div>
                  );
                })}
              </section>
            );
            return index === 0 ? (
              content
            ) : (
              <details key={String(title)}>
                <summary>{title}</summary>
                {content}
              </details>
            );
          })}
          <details>
            <summary>Plan Details & Source</summary>
            <section className="lab-input-group">
              <div className="form-grid">
                <label className="field field-full">
                  Assumption Source
                  <textarea
                    aria-label="Assumption Source"
                    value={draft.provenance ?? ""}
                    onChange={(e) => update("provenance", e.target.value)}
                    placeholder="Source/version for each driver, owner, and deliberate zero or omission"
                  />
                </label>
                <label className="field">
                  Data Reference Date
                  <input
                    type="date"
                    value={draft.referenceDate ?? ""}
                    onChange={(e) => update("referenceDate", e.target.value)}
                  />
                </label>
              </div>
            </section>
          </details>
          <div className="lab-input-footer">
            {" "}
            <button
              className="button button-secondary"
              onClick={() => {
                const saved = scenarios.find((s) => s.id === draft.id);
                setDraft(saved ? strings(saved) : blank());
                setError("");
              }}
            >
              Reset Unsaved Inputs
            </button>
          </div>
          {!parsed.success && (
            <details className="formula-box">
              <summary>Inputs needed before calculation ({parsed.error.issues.length})</summary>
              <ul>
                {parsed.error.issues.map((issue, i) => (
                  <li key={i}>
                    {numericFields.find(([key]) => key === issue.path[0])?.[1] ??
                      (
                        {
                          name: "Scenario Name",
                          provenance: "Assumption Source",
                          referenceDate: "Data Reference Date",
                          homeMatches: "Home Matches",
                        } as Record<string, string>
                      )[String(issue.path[0])] ??
                      "Plan"}
                    :{" "}
                    {issue.path.length
                      ? "Enter or correct this value."
                      : "Check the match count, combined buffers and input limits."}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
        <ScenarioLivePanel input={input} reference={reference} />
      </div>
      {result && input && (
        <button
          className="button button-secondary section-gap"
          onClick={() =>
            downloadText(
              "pcfc-scenario-inputs-and-outputs.csv",
              toCsv([
                {
                  ...input,
                  ...result,
                  evidence: "Conditional planning; inherits the recorded input evidence",
                  calculation: "Shared site/model.js equation; contribution after allowances",
                  exportedAt: new Date().toISOString(),
                },
              ]),
            )
          }
        >
          Export Inputs & Outputs
        </button>
      )}
      <Card className="padded section-gap">
        <CardHeader
          title="Saved Scenarios & Comparison"
          description="Cases differ only in their recorded inputs. Labels such as optimistic do not imply likelihood."
          action={
            <button
              className="button button-secondary"
              disabled={!compare.length}
              onClick={() =>
                downloadText(
                  "pcfc-scenario-comparison.csv",
                  toCsv(
                    compare.map((s) => ({
                      ...s,
                      ...calculateScenario(s),
                      evidence: "Conditional planning, not club actuals",
                      exportedAt: new Date().toISOString(),
                    })),
                  ),
                )
              }
            >
              Export Comparison
            </button>
          }
        />
        <DataTable
          caption="Saved scenario comparison"
          headers={[
            "Compare",
            "Case",
            "Scope",
            "Version",
            "Receipts",
            "Contribution after allowance",
            "Break-even / fixture",
            "Actions",
          ]}
          rows={scenarios.map((s) => {
            const r = calculateScenario(s);
            return [
              <input
                key="select"
                type="checkbox"
                aria-label={`Compare ${s.name}`}
                checked={selected.includes(s.id)}
                onChange={(e) =>
                  setSelected((current) =>
                    e.target.checked ? [...current, s.id] : current.filter((id) => id !== s.id),
                  )
                }
              />,
              <button key="case" className="button button-ghost" onClick={() => void select(s)}>
                {s.name}
              </button>,
              `${s.scope}; ${s.homeMatches} home; sponsor ${s.sponsorFrequency.toLowerCase()}`,
              s.version ?? "Synthetic preset",
              currency(r.totalRevenue),
              currency(r.operatingMargin),
              r.breakEvenAttendance === null
                ? "No finite solution"
                : `${r.breakEvenAttendance}${r.feasible ? "" : " · above capacity"}`,
              <span key="actions" className="club-toolbar">
                <button
                  className="button button-ghost"
                  disabled={scenariosReadOnly || pending}
                  onClick={() =>
                    void run(async () => {
                      await duplicateScenario(s.id);
                      setMessage("Scenario copy committed and audited.");
                    })
                  }
                >
                  Duplicate {s.name}
                </button>
                <button
                  className="button button-ghost"
                  disabled={scenariosReadOnly || pending}
                  onClick={() =>
                    void run(async () => {
                      await deleteScenario(s.id);
                      setSelected((current) => current.filter((id) => id !== s.id));
                      if (draft.id === s.id) {
                        setDraft(blank());
                        setRevisions([]);
                      }
                      setMessage("Scenario archived; historical revisions retained.");
                    })
                  }
                >
                  Archive {s.name}
                </button>
              </span>,
            ];
          })}
        />
      </Card>
      {revisions.length > 0 && (
        <Card className="padded section-gap">
          <CardHeader title="Version History" />
          <DataTable
            caption="Scenario revision history"
            headers={["Version", "Recorded", "Provenance", "Action"]}
            rows={revisions.map((r) => [
              r.version,
              new Date(r.recorded_at).toLocaleString(),
              r.snapshot.provenance,
              <button
                key="restore"
                className="button button-secondary"
                onClick={() =>
                  setDraft(
                    strings({
                      ...r.snapshot,
                      id: `new-${Date.now()}`,
                      version: undefined,
                      name: `${r.snapshot.name} — version ${r.version} copy`,
                    }),
                  )
                }
              >
                Restore v{r.version} as new draft
              </button>,
            ])}
          />
        </Card>
      )}
    </div>
  );
}
