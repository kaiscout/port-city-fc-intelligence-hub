"use client";

import { Download } from "lucide-react";
import { ChannelBars, PerformanceTrend } from "@/components/charts/analytics-charts";
import {
  Card,
  CardHeader,
  DataTable,
  KpiCard,
  PageHeader,
  SourceBadge,
  Status,
} from "@/components/ui";
import { calculateFunnelConversion } from "@/lib/calculations";
import { channelPerformance, demoFixtures, funnelStages, monthlyTrend } from "@/lib/data/demo";
import { toCsv } from "@/lib/csv";
import { number, percent } from "@/lib/format";

function saveCsv() {
  const content = toCsv(
    channelPerformance.map((row) => ({
      ...row,
      conversionPct: (row.purchases / row.visits) * 100,
      costPerPurchase: row.spend / row.purchases,
    })),
  );
  const url = URL.createObjectURL(new Blob([content], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "pcfc-channel-performance.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function AttendancePage() {
  const funnel = calculateFunnelConversion(funnelStages.map((stage) => stage.value));
  const max = funnelStages[0]?.value ?? 1;
  const repeatRate = (funnelStages.at(-1)!.value / funnelStages.at(-2)!.value) * 100;
  const channels = channelPerformance.map((row) => ({
    channel: row.channel,
    conversion: (row.purchases / row.visits) * 100,
  }));

  return (
    <>
      <PageHeader
        eyebrow="Attendance & fan funnel"
        title="See where attention becomes belonging."
        description="Trace the supporter journey from reach to repeat attendance, identify conversion friction, and direct campaign spend to the channels that compound loyalty."
        actions={
          <button className="button button-primary" onClick={saveCsv}>
            <Download size={15} /> Export channel data
          </button>
        }
      />
      <div className="kpi-grid">
        <KpiCard
          label="Awareness reach"
          value="184K"
          change="+21% vs prior"
          definition="Aggregate unique-equivalent social reach in the active period."
          source="Synthetic demonstration data"
        />
        <KpiCard
          label="Website visits"
          value="28.4K"
          change="15.4% of reach"
          definition="Sessions attributed to club-owned web properties."
          source="Synthetic demonstration data"
        />
        <KpiCard
          label="Ticket starts"
          value="4,860"
          change="37.6% of fixture views"
          definition="Supporters who began a ticket purchase flow."
          source="Synthetic demonstration data"
        />
        <KpiCard
          label="Purchases"
          value="3,214"
          change="66.1% completion"
          definition="Completed ticket orders in the demonstration dataset."
          source="Synthetic demonstration data"
        />
        <KpiCard
          label="Match attendance"
          value="2,948"
          change="91.7% show rate"
          definition="Ticket holders recorded as present."
          source="Calculated metric"
        />
        <KpiCard
          label="Repeat attendance"
          value={percent(repeatRate)}
          change="+6.2 pts"
          definition="Attendees with a prior event in the active season."
          source="Calculated metric"
        />
      </div>
      <div className="grid-2">
        <Card className="padded">
          <CardHeader
            title="Supporter conversion funnel"
            description="Stage-to-stage conversion and drop-off"
            action={<SourceBadge source="Synthetic demonstration data" />}
          />
          <div className="funnel-stack">
            {funnelStages.map((stage, index) => (
              <div
                className="funnel-stage"
                key={stage.stage}
                style={
                  {
                    "--funnel-width": `${Math.max(10, (stage.value / max) * 100)}%`,
                  } as React.CSSProperties
                }
              >
                <strong>{stage.stage}</strong>
                <span>{number(stage.value)}</span>
                <small>
                  {index === 0 ? "Baseline" : `${percent(funnel[index]!.conversionPct, 0)} step`}
                </small>
              </div>
            ))}
          </div>
          <p className="chart-summary">
            Largest absolute leakage occurs between social reach and website visits. Highest-value
            optimization: improve the fixture-page-to-ticket-start handoff while protecting purchase
            completion.
          </p>
        </Card>
        <Card className="chart-card">
          <CardHeader
            title="Channel conversion"
            description="Completed purchases divided by attributed visits"
          />
          <ChannelBars data={channels} />
          <p className="chart-summary">
            Email converts most efficiently; partner referrals combine lower spend with strong
            intent. Paid social should be optimized around fixture-specific creative.
          </p>
        </Card>
      </div>
      <div className="grid-2">
        <Card className="chart-card">
          <CardHeader
            title="Attendance momentum"
            description="Monthly synthetic match attendance and revenue"
          />
          <PerformanceTrend data={monthlyTrend} />
          <p className="chart-summary">
            July volume reflects two high-interest home fixtures; the cohort view below separates
            acquisition from retention effects.
          </p>
        </Card>
        <Card className="padded">
          <CardHeader
            title="Supporter cohorts"
            description="First attendance month and subsequent return behavior"
          />
          <DataTable
            caption="Supporter cohort retention"
            headers={[
              "Cohort",
              "Supporters",
              "Returned in 30d",
              "Returned in 60d",
              "Primary channel",
            ]}
            rows={[
              ["May 2026", "1,482", "38%", "51%", "Email"],
              ["June 2026", "1,906", "42%", "—", "Partner"],
              ["July 2026", "1,238", "—", "—", "Organic social"],
            ].map((row) =>
              row.map((cell, j) => (j === 0 ? <strong key={j}>{cell}</strong> : cell)),
            )}
          />
          <div className="callout section-gap">
            <Status tone="success">Opportunity</Status>
            <p>
              Invite first-time women’s-program attendees to a paired men’s fixture and vice versa;
              measure incremental return without masking program-specific loyalty.
            </p>
          </div>
        </Card>
      </div>
      <Card className="padded">
        <CardHeader
          title="Fixture attendance detail"
          description="New vs returning supporter mix, capacity use, and paid attendance."
        />
        <DataTable
          caption="Fixture attendance performance"
          headers={[
            "Fixture",
            "Program",
            "Opponent",
            "Paid",
            "New",
            "Returning",
            "Return rate",
            "Capacity use",
          ]}
          rows={demoFixtures.map((fixture) => {
            const returning = Math.round((fixture.paid * fixture.returningPct) / 100);
            return [
              <strong key="id">{fixture.id}</strong>,
              fixture.program,
              fixture.opponent,
              number(fixture.paid),
              number(fixture.paid - returning),
              number(returning),
              percent(fixture.returningPct, 0),
              percent((fixture.paid / fixture.capacity) * 100),
            ];
          })}
        />
      </Card>
    </>
  );
}
