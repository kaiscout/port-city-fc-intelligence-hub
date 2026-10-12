"use client";

import Link from "next/link";
import { ArrowRight, FileCheck2, ShieldCheck, TriangleAlert } from "lucide-react";
import { CashFlowTrend, RevenueMix } from "@/components/charts/analytics-charts";
import { Card, CardHeader, KpiCard, PageHeader, Status } from "@/components/ui";
import {
  financialPeriods,
  fy25IncomeCategories,
  fy25MonthlyCashFlow,
  managementOperatingBaseline,
  managementSeasonCommitments,
} from "@/lib/data/pcfc-reference";
import { currency, number, percent } from "@/lib/format";

const current = financialPeriods[1]!;
const prior = financialPeriods[0]!;
const cashCoverage = current.inflow / current.outflow;
const cashMargin = (current.netCash / current.inflow) * 100;
const sponsorship = fy25IncomeCategories.find((item) => item.name === "Sponsorship")!.amount;
const sponsorshipShare = (sponsorship / current.inflow) * 100;
const committed = managementSeasonCommitments
  .filter((item) => item.confidence === "Confirmed in messages")
  .reduce((sum, item) => sum + item.amount, 0);

const decisions = [
  {
    decision: "Protect early-season liquidity",
    position: "Synthetic cash turns negative in the second half of the year.",
    ask: "Approve a monthly cash floor and named mitigation owner.",
    tone: "warning" as const,
  },
  {
    decision: "Reduce income concentration",
    position: `${percent(sponsorshipShare)} of modeled inflow is sponsorship.`,
    ask: "Set a non-sponsorship growth target before campaign spend is approved.",
    tone: "warning" as const,
  },
  {
    decision: "Authorize forecast construction",
    position: "Attendance and ticket price are assumptions, not approved forecast inputs.",
    ask: "Confirm fixture split, capacity, sell-through and per-match cost owners.",
    tone: "info" as const,
  },
];

export default function OwnershipPage() {
  return (
    <div className="ownership-snapshot">
      <PageHeader
        eyebrow="Ownership snapshot · public portfolio"
        title="One screen for the decisions that need an owner."
        description="A sanitized executive view of cash resilience, income concentration and forecast readiness. Every number is synthetic; the analytical controls and decision logic are production-oriented."
        actions={
          <Link className="button button-primary" href="/dashboard">
            Open evidence detail <ArrowRight size={15} />
          </Link>
        }
      />

      <div className="ownership-kpis">
        <KpiCard
          label="Net cash"
          value={currency(current.netCash)}
          change={`${currency(current.netCash - prior.netCash)} vs prior benchmark`}
          positive
          source="Synthetic demonstration data"
          definition="Synthetic inflow less synthetic outflow for the current public-model year."
        />
        <KpiCard
          label="Cash coverage"
          value={`${cashCoverage.toFixed(2)}×`}
          change={`${percent(cashMargin)} cash margin`}
          positive={cashCoverage >= 1}
          source="Calculated metric"
          definition="Cash inflow divided by cash outflow; values above one indicate positive net cash."
        />
        <KpiCard
          label="Sponsor concentration"
          value={percent(sponsorshipShare)}
          change="Largest income dependency"
          positive={false}
          source="Calculated metric"
          definition="Synthetic sponsorship receipts as a share of synthetic cash inflow."
        />
        <KpiCard
          label="Operating baseline"
          value={number(managementOperatingBaseline.averageAttendance)}
          change={`${currency(managementOperatingBaseline.ticketPrice)} ticket assumption`}
          positive={null}
          source="Documented assumption"
          definition="Sanitized attendance assumption used only for planning readiness—not an approved forecast."
        />
      </div>

      <div className="ownership-main-grid">
        <Card className="ownership-chart-card">
          <CardHeader
            title="Cash timing"
            description="Monthly synthetic inflow, outflow and net cash; annual control totals reconcile to $0.00."
            action={<Status tone="success">Reconciled</Status>}
          />
          <CashFlowTrend data={fy25MonthlyCashFlow} />
        </Card>
        <Card className="ownership-chart-card">
          <CardHeader
            title="Income mix"
            description="Concentration is visible before any growth case is approved."
            action={<Status tone="warning">Watch</Status>}
          />
          <RevenueMix
            data={fy25IncomeCategories.map(({ name, amount }) => ({ name, value: amount }))}
          />
        </Card>
      </div>

      <div className="ownership-bottom-grid">
        <Card className="padded ownership-decisions">
          <CardHeader
            title="Decisions and owner asks"
            description="The screen ends in action—not another chart."
          />
          <div className="decision-list">
            {decisions.map((item) => (
              <article key={item.decision}>
                <Status tone={item.tone}>{item.decision}</Status>
                <p>{item.position}</p>
                <strong>{item.ask}</strong>
              </article>
            ))}
          </div>
        </Card>
        <Card className="padded ownership-evidence">
          <CardHeader
            title="Evidence boundary"
            description="What this view can and cannot claim."
          />
          <ul className="evidence-list">
            <li>
              <FileCheck2 size={16} />
              <span>
                <b>Controlled:</b> {currency(current.inflow)} inflow, {currency(current.outflow)}{" "}
                outflow and {currency(committed)} confirmed synthetic commitments reconcile through
                the published pipeline.
              </span>
            </li>
            <li>
              <TriangleAlert size={16} />
              <span>
                <b>Not approved:</b> fixture-level revenue, margin and break-even remain scenario
                outputs.
              </span>
            </li>
            <li>
              <ShieldCheck size={16} />
              <span>
                <b>Privacy:</b> no contacts, payees, bank rows, private filenames or interview
                attribution are present.
              </span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
