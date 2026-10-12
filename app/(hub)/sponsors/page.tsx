"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Download, FileCheck2, Mail, Printer, Search } from "lucide-react";
import { Card, CardHeader, DataTable, KpiCard, PageHeader, Status } from "@/components/ui";
import { demoSponsors } from "@/lib/data/demo";
import { financialPeriods, reportedSponsorReceipts } from "@/lib/data/pcfc-reference";
import { currency, number, percent } from "@/lib/format";
import { assessSponsorRisk } from "@/lib/sponsor-risk";

const deliverables = [
  {
    id: 1,
    name: "Matchday LED rotation",
    due: "Jul 18",
    type: "Matchday exposure",
    status: "Complete",
  },
  {
    id: 2,
    name: "Community clinic recap",
    due: "Jul 22",
    type: "Community activation",
    status: "In review",
  },
  {
    id: 3,
    name: "Co-branded social feature",
    due: "Jul 25",
    type: "Digital exposure",
    status: "Scheduled",
  },
  {
    id: 4,
    name: "Quarterly impact report",
    due: "Jul 31",
    type: "Reporting",
    status: "Not started",
  },
];

export default function SponsorsPage() {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(demoSponsors[0]!.id);
  const [items, setItems] = useState(deliverables);
  const filtered = demoSponsors.filter((sponsor) =>
    sponsor.name.toLowerCase().includes(query.toLowerCase()),
  );
  const selected = demoSponsors.find((sponsor) => sponsor.id === selectedId) ?? demoSponsors[0]!;
  const risk = useMemo(() => assessSponsorRisk(selected), [selected]);
  const totalValue = demoSponsors.reduce((sum, sponsor) => sum + sponsor.contractValue, 0);
  const fulfilled =
    (demoSponsors.reduce((sum, sponsor) => sum + sponsor.delivered, 0) /
      demoSponsors.reduce((sum, sponsor) => sum + sponsor.total, 0)) *
    100;
  const highRiskValue = demoSponsors
    .filter((sponsor) => assessSponsorRisk(sponsor).level === "High")
    .reduce((sum, sponsor) => sum + sponsor.contractValue, 0);
  const fy25 = financialPeriods[1]!;
  const reportedReceipts = reportedSponsorReceipts.reduce((sum, item) => sum + item.amount, 0);
  const groupedReceipts = reportedSponsorReceipts
    .slice(0, 2)
    .reduce((sum, item) => sum + item.amount, 0);
  const sponsorTransactions = reportedSponsorReceipts.reduce(
    (sum, item) => sum + item.transactions,
    0,
  );

  return (
    <>
      <PageHeader
        eyebrow="Sponsorship performance"
        title="Start with a reconciled receipt model. Build the contract view next."
        description="The public dataset provides synthetic sponsorship totals and generalized receipt groups. Contract value, deliverables, contacts and renewal risk remain a separate illustrative workflow."
        actions={
          <>
            <button className="button button-secondary" onClick={() => window.print()}>
              <Printer size={15} /> Print sponsor report
            </button>
            <button className="button button-primary" onClick={() => window.print()}>
              <Download size={15} /> Generate summary
            </button>
          </>
        }
      />
      <div className="kpi-grid">
        <KpiCard
          label="Synthetic sponsor receipts"
          value={currency(reportedReceipts, true)}
          change={`${percent((reportedReceipts / fy25.inflow) * 100)} of FY25 inflow`}
          definition="Synthetic cash receipts classified as sponsorship in the public model."
          positive={null}
          source="Synthetic demonstration data"
        />
        <KpiCard
          label="Sponsor transactions"
          value={number(sponsorTransactions)}
          change="Across the public model year"
          definition="Count of synthetic receipt events represented by the generalized groups."
          positive={null}
          source="Synthetic demonstration data"
        />
        <KpiCard
          label="Grouped partner receipts"
          value={currency(groupedReceipts, true)}
          change="Two generalized partners"
          definition="Synthetic receipts assigned to generalized partner groups; no source payer names are present."
          positive={null}
          source="Synthetic demonstration data"
        />
        <KpiCard
          label="Aggregated sponsor cash"
          value={currency(reportedSponsorReceipts[2]!.amount, true)}
          change={`${percent((reportedSponsorReceipts[2]!.amount / reportedReceipts) * 100)} of sponsor receipts`}
          definition="Synthetic sponsorship receipts intentionally retained only as an aggregate."
          positive={false}
          source="Calculated metric"
        />
      </div>
      <Card className="padded">
        <CardHeader
          title="Sanitized sponsorship receipt model"
          description="Generalized receipt groups demonstrate reconciliation without publishing payer-level evidence"
          action={<FileCheck2 size={18} />}
        />
        <DataTable
          caption="Sanitized sponsorship receipts"
          headers={[
            "Receipt group",
            "Cash received",
            "Events",
            "Latest modeled date",
            "Classification",
          ]}
          rows={reportedSponsorReceipts.map((item) => [
            <strong key="name">{item.name}</strong>,
            currency(item.amount),
            number(item.transactions),
            new Date(`${item.latestReceipt}T12:00:00`).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }),
            item.evidence,
          ])}
        />
      </Card>
      <div className="callout section-gap">
        <FileCheck2 size={18} />
        <div>
          <strong>Evidence boundary</strong>
          <p>
            The public model proves that monthly, category and annual control totals reconcile. It
            does not claim signed contract values, private contacts, delivered reach or renewal
            intent. The workflow below is explicitly illustrative.
          </p>
        </div>
      </div>
      <div className="section-gap" style={{ marginTop: 32 }}>
        <p className="eyebrow">Illustrative contract workflow</p>
        <h2 className="section-title">Modeled partner delivery controls</h2>
      </div>
      <div className="kpi-grid">
        <KpiCard
          label="Modeled contract value"
          value={currency(totalValue, true)}
          change="6 active partners"
          definition="Total synthetic contract value for active sponsor agreements."
          source="Synthetic demonstration data"
        />
        <KpiCard
          label="Illustrative fulfillment"
          value={percent(fulfilled, 0)}
          change="+7 pts this month"
          definition="Completed deliverables divided by contracted deliverables."
        />
        <KpiCard
          label="Modeled reach"
          value="620K"
          change="Across 3 channels"
          definition="Estimated deduplicated exposure; not an audited audience figure."
          source="Forecast or scenario"
        />
        <KpiCard
          label="Modeled renewal pipeline"
          value="$111K"
          change="72% weighted"
          definition="Contract value weighted by renewal confidence."
          source="Forecast or scenario"
        />
        <KpiCard
          label="Modeled at-risk value"
          value={currency(highRiskValue, true)}
          change="1 high-risk partner"
          definition="Contract value assigned a high rules-based renewal risk."
          positive={false}
        />
        <KpiCard
          label="Modeled activations"
          value="9"
          change="3 scheduled"
          definition="Delivered sponsor-supported community activations."
          source="Synthetic demonstration data"
        />
      </div>
      <div className="grid-3">
        <Card className="padded">
          <CardHeader
            title="Illustrative partner portfolio"
            description="Synthetic records for workflow demonstration"
          />
          <label className="field">
            <span className="sr-only">Search sponsors</span>
            <div style={{ position: "relative" }}>
              <Search
                size={14}
                style={{ position: "absolute", left: 11, top: 13, color: "#637283" }}
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search partner"
                style={{ paddingLeft: 33 }}
              />
            </div>
          </label>
          <div className="metric-list section-gap">
            {filtered.map((sponsor) => {
              const itemRisk = assessSponsorRisk(sponsor);
              return (
                <button
                  key={sponsor.id}
                  onClick={() => setSelectedId(sponsor.id)}
                  style={{
                    display: "grid",
                    width: "100%",
                    gridTemplateColumns: "1fr auto",
                    gap: 10,
                    padding: "12px 3px",
                    textAlign: "left",
                    background: "none",
                    border: 0,
                    borderBottom: "1px solid #edf3f7",
                    cursor: "pointer",
                  }}
                >
                  <span>
                    <strong style={{ display: "block", fontSize: 11, color: "#0a1f38" }}>
                      {sponsor.name}
                    </strong>
                    <small style={{ color: "#637283" }}>
                      {sponsor.tier} · {currency(sponsor.contractValue)}
                    </small>
                  </span>
                  <Status
                    tone={
                      itemRisk.level === "High"
                        ? "danger"
                        : itemRisk.level === "Moderate"
                          ? "warning"
                          : "success"
                    }
                  >
                    {itemRisk.level}
                  </Status>
                </button>
              );
            })}
          </div>
        </Card>
        <Card className="padded span-2 radar-panel">
          <CardHeader
            title={selected.name}
            description={`${selected.tier} partner · ${selected.program} · ${selected.period}`}
            action={
              <Status
                tone={
                  risk.level === "High"
                    ? "danger"
                    : risk.level === "Moderate"
                      ? "warning"
                      : "success"
                }
              >
                {risk.level} renewal risk
              </Status>
            }
          />
          <div className="grid-3">
            <div className="metric-list">
              <div className="metric-row">
                <span>Contract value</span>
                <strong>{currency(selected.contractValue)}</strong>
              </div>
              <div className="metric-row">
                <span>Fulfillment</span>
                <strong>{percent((selected.delivered / selected.total) * 100, 0)}</strong>
              </div>
              <div className="metric-row">
                <span>Estimated reach</span>
                <strong>{number(selected.estimatedReach)}</strong>
              </div>
            </div>
            <div className="metric-list">
              <div className="metric-row">
                <span>Activation engagement</span>
                <strong>{percent(selected.engagementPct)}</strong>
              </div>
              <div className="metric-row">
                <span>Deliverables</span>
                <strong>
                  {selected.delivered} / {selected.total}
                </strong>
              </div>
              <div className="metric-row">
                <span>Overdue</span>
                <strong>{selected.overdue}</strong>
              </div>
            </div>
            <div className="metric-list">
              <div className="metric-row">
                <span>Primary contact</span>
                <strong>{selected.contact}</strong>
              </div>
              <div className="metric-row">
                <span>Renewal intent</span>
                <strong>{selected.renewalIntent}</strong>
              </div>
              <div className="metric-row">
                <span>Program</span>
                <strong>{selected.program}</strong>
              </div>
            </div>
          </div>
          <div className="callout">
            <Mail size={18} />
            <div>
              <strong>Recommended next action</strong>
              <p>{selected.nextAction}</p>
            </div>
          </div>
          <div className="section-gap">
            <h3 className="section-title">Why this risk classification?</h3>
            <ul>
              {risk.reasons.map((reason) => (
                <li key={reason} style={{ marginTop: 7, color: "#637283", fontSize: 11 }}>
                  {reason}
                </li>
              ))}
            </ul>
            <p className="chart-summary">
              Transparent rule: 45 points for fulfillment below 65% (22 below 85%), up to 30 for
              overdue items, 18 for engagement below 2%, and 12 for unknown intent. Positive intent
              removes 12 points. High ≥55; moderate ≥25.
            </p>
          </div>
        </Card>
      </div>
      <Card className="padded">
        <CardHeader
          title="Illustrative deliverable control board"
          description={`Synthetic delivery register shown for ${selected.name}. Status updates demonstrate the intended audit workflow.`}
        />
        <DataTable
          caption="Sponsor deliverables"
          headers={["Deliverable", "Type", "Due", "Status", "Action"]}
          rows={items.map((item) => [
            <strong key="name">{item.name}</strong>,
            item.type,
            item.due,
            <Status
              key="status"
              tone={
                item.status === "Complete"
                  ? "success"
                  : item.status === "Not started"
                    ? "warning"
                    : "info"
              }
            >
              {item.status}
            </Status>,
            <button
              key="action"
              className="button button-ghost button-small"
              disabled={item.status === "Complete"}
              onClick={() =>
                setItems((current) =>
                  current.map((existing) =>
                    existing.id === item.id ? { ...existing, status: "Complete" } : existing,
                  ),
                )
              }
            >
              <CheckCircle2 size={13} /> Mark complete
            </button>,
          ])}
        />
      </Card>
    </>
  );
}
