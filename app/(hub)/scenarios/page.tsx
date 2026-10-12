"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, Download, Plus, Save, Trash2, TriangleAlert } from "lucide-react";
import { useHubData } from "@/components/data-context";
import { Card, CardHeader, DataTable, PageHeader, SourceBadge, Status } from "@/components/ui";
import { calculateScenario } from "@/lib/calculations";
import { toCsv } from "@/lib/csv";
import { currency, number, percent } from "@/lib/format";
import type { ScenarioInput } from "@/lib/types";

const numericFields: {
  key: keyof ScenarioInput;
  label: string;
  suffix?: string;
  min?: number;
  max?: number;
}[] = [
  { key: "ticketPrice", label: "Ticket price", suffix: "$", min: 0 },
  { key: "expectedAttendance", label: "Expected attendance", min: 0 },
  { key: "venueCapacity", label: "Venue capacity", min: 1 },
  { key: "complimentaryPct", label: "Complimentary tickets", suffix: "%", min: 0, max: 100 },
  { key: "marketingSpend", label: "Marketing spend", suffix: "$", min: 0 },
  { key: "staffing", label: "Staffing", suffix: "$", min: 0 },
  { key: "security", label: "Security", suffix: "$", min: 0 },
  { key: "officials", label: "Officials", suffix: "$", min: 0 },
  { key: "venueCosts", label: "Venue costs", suffix: "$", min: 0 },
  { key: "transportation", label: "Transportation", suffix: "$", min: 0 },
  { key: "equipment", label: "Equipment", suffix: "$", min: 0 },
  {
    key: "concessionParticipationPct",
    label: "Concession participation",
    suffix: "%",
    min: 0,
    max: 100,
  },
  { key: "averageConcessionSpend", label: "Average concession spend", suffix: "$", min: 0 },
  {
    key: "merchandiseParticipationPct",
    label: "Merchandise participation",
    suffix: "%",
    min: 0,
    max: 100,
  },
  { key: "averageMerchandiseSpend", label: "Average merchandise spend", suffix: "$", min: 0 },
  { key: "sponsorIncome", label: "Sponsor allocation", suffix: "$", min: 0 },
  { key: "communityAllocationPct", label: "Community allocation", suffix: "%", min: 0, max: 100 },
  { key: "weatherRiskPct", label: "Weather risk", suffix: "%", min: 0, max: 100 },
  { key: "operationalRiskPct", label: "Operational risk", suffix: "%", min: 0, max: 100 },
];

function download(name: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function ScenariosPage() {
  const {
    scenarios,
    scenarioAudit,
    scenariosReady,
    scenariosReadOnly,
    scenarioError,
    saveScenario,
    duplicateScenario,
    deleteScenario,
  } = useHubData();
  const [draft, setDraft] = useState<ScenarioInput>(scenarios[1] ?? scenarios[0]!);
  const [selected, setSelected] = useState<string[]>(scenarios.slice(0, 3).map((item) => item.id));
  const [mutationMessage, setMutationMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [editorReady, setEditorReady] = useState(false);
  const result = useMemo(() => calculateScenario(draft), [draft]);
  const compare = scenarios.filter((scenario) => selected.includes(scenario.id));

  useEffect(() => {
    if (!scenariosReady || !scenarios.length) return;
    const timer = window.setTimeout(() => {
      setDraft(
        (current) =>
          scenarios.find((item) => item.id === current.id) ?? scenarios[1] ?? scenarios[0]!,
      );
      setSelected((current) => {
        const valid = current.filter((id) => scenarios.some((item) => item.id === id));
        return valid.length ? valid : scenarios.slice(0, 3).map((item) => item.id);
      });
      setEditorReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [scenarios, scenariosReady]);

  const runMutation = async (operation: () => Promise<void>, success: string) => {
    setPending(true);
    setMutationMessage(null);
    try {
      await operation();
      setMutationMessage(success);
    } catch (error) {
      setMutationMessage(error instanceof Error ? error.message : "Scenario change failed");
    } finally {
      setPending(false);
    }
  };

  const updateNumber = (key: keyof ScenarioInput, value: string) =>
    setDraft((current) => ({ ...current, [key]: Number(value) }));
  const selectPreset = (id: string) => {
    const found = scenarios.find((item) => item.id === id);
    if (found) setDraft({ ...found });
  };
  const createScenario = () =>
    setDraft({ ...draft, id: `scenario-${Date.now()}`, name: "New matchday scenario" });
  const exportComparison = () =>
    download(
      "pcfc-scenario-comparison.csv",
      toCsv(
        compare.map((scenario) => ({
          scenario: scenario.name,
          program: scenario.program,
          ...calculateScenario(scenario),
        })),
      ),
    );

  return (
    <>
      <PageHeader
        eyebrow="Matchday economics"
        title="Test assumptions without calling them a forecast."
        description="Explore fixture economics, expose every formula, and compare downside cases. Outputs remain illustrative until the required operating inputs are approved."
        actions={
          <>
            <button
              className="button button-secondary"
              onClick={createScenario}
              disabled={!editorReady}
            >
              <Plus size={15} /> New scenario
            </button>
            <button
              className="button button-primary"
              onClick={() =>
                runMutation(
                  () => saveScenario(draft),
                  "Scenario saved to PostgreSQL and recorded in the audit log.",
                )
              }
              disabled={!editorReady || scenariosReadOnly || pending}
              title={scenariosReadOnly ? "The public portfolio is read-only" : undefined}
            >
              <Save size={15} /> Save scenario
            </button>
          </>
        }
      />
      <div className="callout">
        <TriangleAlert size={18} />
        <div>
          <strong>Illustrative sandbox—not an approved PCFC forecast</strong>
          <p>
            Preset inputs are synthetic planning assumptions. Use this lab for sensitivity testing
            only; do not present its revenue, margin, or break-even outputs as club results or an
            approved budget.
          </p>
        </div>
      </div>
      {(scenariosReadOnly || scenarioError || mutationMessage) && (
        <div className="callout callout-neutral" role="status">
          <div>
            <strong>{scenariosReadOnly ? "Read-only portfolio mode" : "Scenario workflow"}</strong>
            <p>
              {scenarioError ??
                mutationMessage ??
                "The public demonstration loads sanitized presets through the scenario API. Configure PostgreSQL and sign in with scenario-write permission to save, duplicate or delete; every write is transactional and audited."}
            </p>
          </div>
        </div>
      )}
      <div className="scenario-layout">
        <Card className="scenario-editor">
          <CardHeader
            title="Scenario assumptions"
            description="All inputs are documented assumptions or forecasts until replaced with approved operational data."
            action={<SourceBadge source="Forecast or scenario" />}
          />
          <div className="preset-tabs" aria-label="Scenario presets">
            {scenarios.slice(0, 3).map((scenario) => (
              <button
                key={scenario.id}
                className={`preset-tab ${draft.id === scenario.id ? "active" : ""}`}
                onClick={() => selectPreset(scenario.id)}
                disabled={!editorReady}
              >
                {scenario.name}
              </button>
            ))}
          </div>
          <div className="form-grid">
            <label className="field field-full">
              <span>Scenario name</span>
              <input
                value={draft.name}
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                maxLength={80}
                disabled={!editorReady}
              />
            </label>
            <label className="field">
              <span>Program</span>
              <select
                value={draft.program}
                onChange={(event) =>
                  setDraft({ ...draft, program: event.target.value as "Men" | "Women" })
                }
                disabled={!editorReady}
              >
                <option>Men</option>
                <option>Women</option>
              </select>
            </label>
            {numericFields.map((field) => (
              <label className="field input-suffix" key={field.key}>
                <span>{field.label}</span>
                <input
                  type="number"
                  min={field.min}
                  max={field.max}
                  step={field.suffix === "%" ? 0.5 : 1}
                  value={draft[field.key] as number}
                  onChange={(event) => updateNumber(field.key, event.target.value)}
                  disabled={!editorReady}
                />
                {field.suffix && <span>{field.suffix}</span>}
              </label>
            ))}
          </div>
        </Card>
        <div className="scenario-results">
          <Card className="result-hero">
            <p>Projected operating margin</p>
            <strong>{currency(result.operatingMargin)}</strong>
            <small>
              {percent(result.operatingMarginPct)} of total revenue · {draft.name}
            </small>
          </Card>
          <div className="result-grid">
            {[
              ["Paid attendance", number(result.paidAttendance)],
              ["Ticket revenue", currency(result.ticketRevenue)],
              ["Concession revenue", currency(result.concessionRevenue)],
              ["Merchandise revenue", currency(result.merchandiseRevenue)],
              ["Sponsorship", currency(result.sponsorshipAllocation)],
              ["Total revenue", currency(result.totalRevenue)],
              ["Fixed costs", currency(result.fixedCosts)],
              ["Variable costs", currency(result.variableCosts)],
              ["Total cost", currency(result.totalCost)],
              ["Contribution margin", currency(result.contributionMargin)],
              [
                "Break-even attendance",
                result.breakEvenAttendance ? number(result.breakEvenAttendance) : "Not attainable",
              ],
              ["Capacity utilization", percent(result.capacityUtilizationPct)],
              ["Revenue / attendee", currency(result.revenuePerAttendee)],
              ["Cost / attendee", currency(result.costPerAttendee)],
              ["Downside exposure", currency(result.downsideExposure)],
              ["Community allocation", currency(result.charitableContribution)],
            ].map(([label, value]) => (
              <div className="result-cell" key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
          <details className="formula-box">
            <summary>Calculation methodology</summary>
            <pre>
              {[
                "Paid attendance = min(attendance, capacity) × (1 − comp %)",
                "Ticket revenue = paid attendance × ticket price",
                "Ancillary revenue = attendance × participation × average spend",
                "Total cost = fixed costs + ($2.40 × attendance) + community allocation",
                "Operating margin = total revenue − total cost",
                "Break-even attendance = (fixed costs − sponsor allocation) ÷ net contribution per attendee",
                "Downside exposure = revenue × (weather risk + operational risk)",
              ].join("\n")}
            </pre>
          </details>
        </div>
      </div>
      <Card className="padded section-gap">
        <CardHeader
          title="Saved scenario portfolio"
          description="Select two or more scenarios for an executive comparison."
          action={
            <button
              className="button button-secondary button-small"
              onClick={exportComparison}
              disabled={!compare.length}
            >
              <Download size={13} /> Export comparison
            </button>
          }
        />
        <DataTable
          caption="Saved matchday scenario comparison"
          headers={[
            "Compare",
            "Scenario",
            "Program",
            "Attendance",
            "Revenue",
            "Cost",
            "Margin",
            "Break-even",
            "Exposure",
            "Actions",
          ]}
          rows={scenarios.map((scenario) => {
            const calculated = calculateScenario(scenario);
            return [
              <input
                key="select"
                type="checkbox"
                checked={selected.includes(scenario.id)}
                aria-label={`Compare ${scenario.name}`}
                onChange={(event) =>
                  setSelected((current) =>
                    event.target.checked
                      ? [...current, scenario.id]
                      : current.filter((id) => id !== scenario.id),
                  )
                }
              />,
              <button
                key="name"
                className="button button-ghost button-small"
                onClick={() => setDraft({ ...scenario })}
              >
                {scenario.name}
              </button>,
              scenario.program,
              number(scenario.expectedAttendance),
              currency(calculated.totalRevenue),
              currency(calculated.totalCost),
              <Status key="margin" tone={calculated.operatingMargin >= 0 ? "success" : "danger"}>
                {currency(calculated.operatingMargin)}
              </Status>,
              calculated.breakEvenAttendance ? number(calculated.breakEvenAttendance) : "—",
              currency(calculated.downsideExposure),
              <span key="actions" style={{ display: "flex", gap: 4 }}>
                <button
                  className="icon-button"
                  onClick={() =>
                    runMutation(
                      () => duplicateScenario(scenario.id),
                      "Scenario copy saved and audited.",
                    )
                  }
                  aria-label={`Duplicate ${scenario.name}`}
                  disabled={scenariosReadOnly || pending}
                >
                  <Copy size={14} />
                </button>
                <button
                  className="icon-button"
                  onClick={() =>
                    runMutation(() => deleteScenario(scenario.id), "Scenario deleted and audited.")
                  }
                  aria-label={`Delete ${scenario.name}`}
                  disabled={scenariosReadOnly || pending}
                >
                  <Trash2 size={14} />
                </button>
              </span>,
            ];
          })}
        />
      </Card>
      <Card className="padded section-gap">
        <CardHeader
          title="Scenario audit evidence"
          description="The newest PostgreSQL audit events for this organization. The public no-database demo intentionally shows no events."
          action={
            <Status tone={scenarioAudit.length ? "success" : "neutral"}>
              {scenarioAudit.length ? "Connected" : "Read-only"}
            </Status>
          }
        />
        <DataTable
          caption="Scenario audit events"
          headers={["When", "Action", "Summary", "Entity"]}
          rows={
            scenarioAudit.length
              ? scenarioAudit.map((event) => [
                  new Date(event.createdAt).toLocaleString(),
                  <Status key="action" tone="info">
                    {event.action}
                  </Status>,
                  event.summary,
                  event.entityId?.slice(0, 8) ?? "—",
                ])
              : [
                  [
                    "—",
                    <Status key="read-only" tone="neutral">
                      No database
                    </Status>,
                    "Configure PostgreSQL and sign in to create audited scenario events.",
                    "—",
                  ],
                ]
          }
        />
      </Card>
    </>
  );
}
