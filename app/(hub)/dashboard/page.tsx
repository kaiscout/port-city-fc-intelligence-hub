"use client";

import Link from "next/link";
import { ArrowRight, Download, FileCheck2, ShieldCheck, TriangleAlert } from "lucide-react";
import { CashFlowTrend, RevenueMix } from "@/components/charts/analytics-charts";
import { Card, CardHeader, DataTable, KpiCard, PageHeader, Status } from "@/components/ui";
import {
  financialPeriods,
  fy25ExpenseCategories,
  fy25FieldCosts,
  fy25IncomeCategories,
  fy25MonthlyCashFlow,
  managementMatchdayCosts,
  managementOperatingBaseline,
  managementSeasonCommitments,
} from "@/lib/data/pcfc-reference";
import { currency, number, percent } from "@/lib/format";

const prior = financialPeriods[0]!;
const current = financialPeriods[1]!;
const cashMargin = (current.netCash / current.inflow) * 100;
const sponsorship = fy25IncomeCategories.find((item) => item.name === "Sponsorship")!.amount;
const fieldCosts = fy25FieldCosts.reduce((sum, item) => sum + item.amount, 0);
const confirmedCommitments = managementSeasonCommitments
  .filter((item) => item.confidence === "Synthetic fixed assumption")
  .reduce((sum, item) => sum + item.amount, 0);
const conditionalCommitments = managementSeasonCommitments
  .filter((item) => item.confidence !== "Synthetic fixed assumption")
  .reduce((sum, item) => sum + item.amount, 0);
const recurringHomeMinimum = managementMatchdayCosts.reduce((sum, item) => sum + item.minimum, 0);
const recurringHomeMaximum = managementMatchdayCosts.reduce((sum, item) => sum + item.maximum, 0);
const ticketCeiling =
  managementOperatingBaseline.averageAttendance * managementOperatingBaseline.ticketPrice;

const evidenceReadiness = [
  [
    "Public financial model",
    `${currency(current.inflow)} in · ${currency(current.outflow)} out`,
    "Reconciled",
    "success",
  ],
  [
    "Field-cost sample",
    `${currency(fieldCosts)} synthetic standalone aggregate`,
    "Illustrative",
    "info",
  ],
  [
    "Operating assumptions",
    `${number(managementOperatingBaseline.averageAttendance)} attendance · ${currency(managementOperatingBaseline.ticketPrice)} ticket`,
    "Provisional",
    "warning",
  ],
  ["Fixture forecast", "Home/away split and sell-through not approved", "Blocked", "danger"],
] as const;

function downloadSummary() {
  const content = [
    "PORT CITY FC PUBLIC PORTFOLIO — SANITIZED DECISION SUMMARY",
    "",
    "DATA CLASSIFICATION",
    "All figures are synthetic or deliberately generalized. No private rows, contacts, payees, filenames or interview attribution are included.",
    "",
    "CONTROLLED MODEL",
    `Cash inflow: ${current.inflow.toFixed(2)}`,
    `Cash outflow: ${current.outflow.toFixed(2)}`,
    `Net cash: ${current.netCash.toFixed(2)}`,
    `Cash margin: ${cashMargin.toFixed(1)}%`,
    `Independent fixed planning assumptions (not added to cash totals): ${confirmedCommitments.toFixed(2)}`,
    "",
    "DECISION",
    "Approve a monthly cash floor and complete the fixture driver pack before presenting a forecast.",
    "",
    "REPRODUCIBILITY",
    "Run npm run data:build, then inspect data/processed/reconciliation.json.",
  ].join("\n");
  const url = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "pcfc-public-decision-summary.txt";
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        eyebrow="Evidence detail · sanitized public model"
        title="Command Center"
        description="This detailed view shows the synthetic financial baseline, generalized operating assumptions and the evidence gaps that prevent an illustrative scenario from being mistaken for an approved club forecast."
        actions={
          <>
            <button className="button button-secondary" onClick={downloadSummary}>
              <Download size={15} /> Export summary
            </button>
            <Link className="button button-primary" href="/ownership">
              Ownership view <ArrowRight size={15} />
            </Link>
          </>
        }
      />

      <div className="callout">
        <ShieldCheck size={18} />
        <div>
          <strong>Privacy-safe portfolio boundary</strong>
          <p>
            The source model is synthetic and deterministic. Private evidence never entered this
            repository; the published inputs contain no staff contacts, payees, statement rows,
            source filenames or attributed messages.
          </p>
        </div>
      </div>

      <div className="kpi-grid">
        <KpiCard
          label="Synthetic inflow"
          value={currency(current.inflow, true)}
          change={`${percent(((current.inflow - prior.inflow) / prior.inflow) * 100)} vs benchmark`}
          positive
          source="Synthetic demonstration data"
          definition="Sum of the public monthly inflow controls."
        />
        <KpiCard
          label="Synthetic outflow"
          value={currency(current.outflow, true)}
          change={`${percent(((current.outflow - prior.outflow) / prior.outflow) * 100)} vs benchmark`}
          positive={false}
          source="Synthetic demonstration data"
          definition="Sum of the public monthly outflow controls."
        />
        <KpiCard
          label="Net cash"
          value={currency(current.netCash, true)}
          change={`${percent(cashMargin)} cash margin`}
          positive
          source="Calculated metric"
          definition="Synthetic inflow less synthetic outflow."
        />
        <KpiCard
          label="Sponsor share"
          value={percent((sponsorship / current.inflow) * 100)}
          change="Income concentration"
          positive={false}
          source="Calculated metric"
          definition="Synthetic sponsorship as a share of synthetic inflow."
        />
        <KpiCard
          label="Field category"
          value={currency(fieldCosts, true)}
          change="Aggregate only"
          positive={null}
          source="Synthetic demonstration data"
          definition="Synthetic match and practice-field category total; no vendor rows."
        />
        <KpiCard
          label="Fixed planning assumptions"
          value={currency(confirmedCommitments, true)}
          change={`${currency(conditionalCommitments, true)} conditional`}
          positive={null}
          source="Documented assumption"
          definition="Generalized, synthetic planning commitments split by confidence."
        />
      </div>

      <div className="grid-2">
        <Card className="chart-card">
          <CardHeader
            title="Monthly Cash Timing"
            description="The annual model reconciles to the financial controls."
            action={<Status tone="success">$0.00 difference</Status>}
          />
          <CashFlowTrend data={fy25MonthlyCashFlow} />
        </Card>
        <Card className="chart-card">
          <CardHeader
            title="Income Concentration"
            description="The mix makes the diversification question visible."
            action={<Status tone="warning">Decision input</Status>}
          />
          <RevenueMix
            data={fy25IncomeCategories.map(({ name, amount }) => ({ name, value: amount }))}
          />
        </Card>
      </div>

      <Card className="padded section-gap">
        <CardHeader
          title="Evidence-to-decision Gate"
          description="A status is earned only when the public model has a control or an explicit owner assumption."
          action={<FileCheck2 size={18} />}
        />
        <DataTable
          caption="Evidence readiness"
          headers={["Subject", "Current position", "Status"]}
          rows={evidenceReadiness.map(([subject, position, status, tone]) => [
            <strong key={subject}>{subject}</strong>,
            position,
            <Status key={status} tone={tone}>
              {status}
            </Status>,
          ])}
        />
      </Card>

      <div className="grid-2 section-gap">
        <Card className="padded">
          <CardHeader
            title="Expense Categories"
            description="Synthetic categories reconcile to total outflow."
          />
          <DataTable
            caption="Synthetic expense categories"
            headers={["Category", "Amount", "Share"]}
            rows={fy25ExpenseCategories.map((item) => [
              item.name,
              currency(item.amount),
              percent((item.amount / current.outflow) * 100),
            ])}
          />
        </Card>
        <Card className="padded">
          <CardHeader
            title="Field-cost Aggregates"
            description="Vendor, date and payment-channel details are intentionally excluded."
          />
          <DataTable
            caption="Sanitized field cost categories"
            headers={["Category", "Amount", "Evidence"]}
            rows={fy25FieldCosts.map((item) => [item.name, currency(item.amount), item.evidence])}
          />
        </Card>
      </div>

      <Card className="padded section-gap">
        <CardHeader
          title="Planning Boundary"
          description="Generalized assumptions show what an owner must confirm before the model becomes a forecast."
          action={<TriangleAlert size={18} />}
        />
        <div className="grid-4">
          <div className="result-cell">
            <span>Attendance assumption</span>
            <strong>{number(managementOperatingBaseline.averageAttendance)}</strong>
          </div>
          <div className="result-cell">
            <span>Ticket assumption</span>
            <strong>{currency(managementOperatingBaseline.ticketPrice)}</strong>
          </div>
          <div className="result-cell">
            <span>Gross ticket ceiling</span>
            <strong>{currency(ticketCeiling)}</strong>
          </div>
          <div className="result-cell">
            <span>Recurring direct cost range</span>
            <strong>
              {currency(recurringHomeMinimum)}–{currency(recurringHomeMaximum)}
            </strong>
          </div>
        </div>
        <p className="chart-summary">
          The ticket ceiling is attendance multiplied by ticket price—not booked revenue. A paid
          share, home fixture count, capacity, sell-through, complimentary policy and approved cost
          allocation are still required. Scenario Lab remains illustrative until those fields have
          accountable owners.
        </p>
        <Link href="/scenarios" className="button button-secondary button-small section-gap">
          Inspect the scenario boundary <ArrowRight size={14} />
        </Link>
      </Card>
    </>
  );
}
