"use client";

import { Download, FileChartColumn, FileSpreadsheet, Printer, ShieldCheck } from "lucide-react";
import { useHubData } from "@/components/data-context";
import { Card, CardHeader, DataTable, PageHeader, SourceBadge, Status } from "@/components/ui";
import { aggregateFixtures, calculateScenario } from "@/lib/calculations";
import { demoSponsors } from "@/lib/data/demo";
import { toCsv } from "@/lib/csv";
import { assessSponsorRisk } from "@/lib/sponsor-risk";
import { currency, number, percent } from "@/lib/format";

function download(name: string, data: string, type = "text/csv") {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const { filteredFixtures, filters, scenarios } = useHubData();
  const totals = aggregateFixtures(filteredFixtures);
  const generated = new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date());
  const filterSummary = `${filters.season} · ${filters.team} · ${filters.competition} · ${filters.venue} · ${filters.fixture}`;
  const reports = [
    {
      title: "Executive performance brief",
      detail: "KPI narrative, economics, risks, and recommended actions",
      icon: FileChartColumn,
      action: () => window.print(),
      label: "Print report",
    },
    {
      title: "Fixture economics dataset",
      detail: "Filtered fixture attendance, revenue, cost, and margin",
      icon: FileSpreadsheet,
      action: () =>
        download(
          "pcfc-fixture-economics.csv",
          toCsv(filteredFixtures.map((f) => ({ ...f, margin: f.totalRevenue - f.cost }))),
        ),
      label: "Download CSV",
    },
    {
      title: "Sponsor renewal report",
      detail: "Portfolio value, fulfillment, transparent risk, and next action",
      icon: ShieldCheck,
      action: () =>
        download(
          "pcfc-sponsor-renewal.csv",
          toCsv(
            demoSponsors.map((s) => ({
              ...s,
              fulfillmentPct: (s.delivered / s.total) * 100,
              risk: assessSponsorRisk(s).level,
              riskReasons: assessSponsorRisk(s).reasons.join(" | "),
            })),
          ),
        ),
      label: "Download CSV",
    },
    {
      title: "Scenario comparison",
      detail: "Saved inputs, calculated results, break-even, and downside",
      icon: FileChartColumn,
      action: () =>
        download(
          "pcfc-scenarios.csv",
          toCsv(scenarios.map((s) => ({ ...s, ...calculateScenario(s) }))),
        ),
      label: "Download CSV",
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Reports & exports"
        title="Reports & Exports"
        description="Generate current, filtered outputs from application data—with provenance, methodology, filters, and report date attached."
        actions={
          <button className="button button-primary" onClick={() => window.print()}>
            <Printer size={15} /> Print executive summary
          </button>
        }
      />
      <Card className="padded radar-panel">
        <CardHeader
          title="Executive Summary"
          description={`Generated ${generated}`}
          action={<SourceBadge source="Calculated metric" />}
        />
        <div className="grid-4">
          <div className="result-cell">
            <span>Paid attendance</span>
            <strong>{number(totals.paidAttendance)}</strong>
          </div>
          <div className="result-cell">
            <span>Matchday revenue</span>
            <strong>{currency(totals.totalRevenue)}</strong>
          </div>
          <div className="result-cell">
            <span>Operating margin</span>
            <strong>{currency(totals.operatingMargin)}</strong>
          </div>
          <div className="result-cell">
            <span>Returning rate</span>
            <strong>{percent(totals.returningSupporterPct)}</strong>
          </div>
        </div>
        <div className="callout">
          <FileChartColumn size={18} />
          <div>
            <strong>Executive interpretation</strong>
            <p>
              Growth is commercially viable in the demonstration baseline when repeat attendance,
              sponsor fulfillment, and ancillary spend move together. Prioritize conversion before
              broad reach, recover the one high-risk sponsor, and release women’s-program investment
              against documented gates.
            </p>
          </div>
        </div>
        <div className="metric-list section-gap">
          <div className="metric-row">
            <span>Active filter summary</span>
            <strong>{filterSummary}</strong>
          </div>
          <div className="metric-row">
            <span>Data source note</span>
            <strong>Synthetic demonstration data + calculated metrics</strong>
          </div>
          <div className="metric-row">
            <span>Methodology version</span>
            <strong>PCFC-DIH-CALC-1.0</strong>
          </div>
        </div>
      </Card>
      <div className="grid-2 section-gap">
        {reports.map(({ title, detail, icon: Icon, action, label }) => (
          <Card key={title} className="padded card-interactive">
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <span className="risk-index" style={{ width: 42, height: 42 }}>
                <Icon size={18} />
              </span>
              <div style={{ flex: 1 }}>
                <h2 className="section-title">{title}</h2>
                <p style={{ color: "#637283", fontSize: 11, lineHeight: 1.55 }}>{detail}</p>
                <button className="button button-secondary button-small" onClick={action}>
                  <Download size={13} /> {label}
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <Card className="padded">
        <CardHeader
          title="Accessible Table Alternative"
          description="The executive chart data is available below without relying on color, shape, or interaction."
        />
        <DataTable
          caption="Executive fixture economics data"
          headers={[
            "Fixture",
            "Program",
            "Opponent",
            "Projected attendance",
            "Paid attendance",
            "Ticket revenue",
            "Total revenue",
            "Cost",
            "Margin",
          ]}
          rows={filteredFixtures.map((fixture) => [
            <strong key="id">{fixture.id}</strong>,
            fixture.program,
            fixture.opponent,
            number(fixture.projected),
            number(fixture.paid),
            currency(fixture.ticketRevenue),
            currency(fixture.totalRevenue),
            currency(fixture.cost),
            <Status
              key="margin"
              tone={fixture.totalRevenue - fixture.cost >= 0 ? "success" : "danger"}
            >
              {currency(fixture.totalRevenue - fixture.cost)}
            </Status>,
          ])}
        />
      </Card>
    </>
  );
}
