"use client";

import { Download, HeartHandshake } from "lucide-react";
import { CommunityTrend } from "@/components/charts/analytics-charts";
import {
  Card,
  CardHeader,
  DataTable,
  KpiCard,
  PageHeader,
  SourceBadge,
  Status,
} from "@/components/ui";
import { communityRecords } from "@/lib/data/demo";
import { toCsv } from "@/lib/csv";
import { currency, number } from "@/lib/format";

export default function CommunityPage() {
  const totals = communityRecords.reduce(
    (acc, item) => ({
      participants: acc.participants + item.participants,
      attendance: acc.attendance + item.eventAttendance,
      partners: acc.partners + item.partners,
      hours: acc.hours + item.volunteerHours,
      contribution: acc.contribution + item.contribution,
      reach: acc.reach + item.reach,
    }),
    { participants: 0, attendance: 0, partners: 0, hours: 0, contribution: 0, reach: 0 },
  );
  const exportData = () => {
    const url = URL.createObjectURL(
      new Blob([toCsv(communityRecords.map((record) => ({ ...record })))], {
        type: "text/csv",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "pcfc-community-impact-demo.csv";
    a.click();
    URL.revokeObjectURL(url);
  };
  const trend = [
    { month: "Apr", participants: 186, reach: 9200 },
    { month: "May", participants: 310, reach: 16600 },
    { month: "Jun", participants: 356, reach: 34800 },
    { month: "Jul", participants: 404, reach: 40100 },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Community impact"
        title="Community Impact"
        description="Connect participation, partner effort, volunteering, and ticket-linked giving without presenting demonstration figures as verified club outcomes."
        actions={
          <button className="button button-primary" onClick={exportData}>
            <Download size={15} /> Export impact data
          </button>
        }
      />
      <div className="callout" style={{ marginBottom: 18 }}>
        <HeartHandshake size={19} />
        <div>
          <strong>Data integrity notice</strong>
          <p>
            Every numerical impact measure on this page is synthetic demonstration data. Official
            sources support the club’s community orientation and charitable model—not the values
            shown here.
          </p>
        </div>
      </div>
      <div className="kpi-grid">
        <KpiCard
          label="Youth participants"
          value={number(totals.participants)}
          change="4 active initiatives"
          definition="Synthetic unique-equivalent youth participation records."
          source="Synthetic demonstration data"
        />
        <KpiCard
          label="Event attendance"
          value={number(totals.attendance)}
          change="Across 4 activations"
          definition="Synthetic recorded attendance at linked community activities."
          source="Synthetic demonstration data"
        />
        <KpiCard
          label="Partner organizations"
          value="14"
          change="5 repeat partners"
          definition="Synthetic count of organizations engaged in community delivery."
          source="Synthetic demonstration data"
        />
        <KpiCard
          label="Volunteer hours"
          value={number(totals.hours)}
          change="+16% vs plan"
          definition="Synthetic approved volunteer hours."
          source="Synthetic demonstration data"
        />
        <KpiCard
          label="Charitable contribution"
          value={currency(totals.contribution)}
          change="Ticket-linked + direct"
          definition="Synthetic ticket-linked and approved direct contributions."
          source="Synthetic demonstration data"
        />
        <KpiCard
          label="Estimated reach"
          value={number(totals.reach, true)}
          change="Non-audited estimate"
          definition="Modelled communications reach; not a verified audience figure."
          source="Forecast or scenario"
        />
      </div>
      <div className="grid-2">
        <Card className="chart-card">
          <CardHeader
            title="Impact Trend"
            description="Cumulative synthetic participation and estimated reach"
            action={<SourceBadge source="Synthetic demonstration data" />}
          />
          <CommunityTrend data={trend} />
          <p className="chart-summary">
            Recorded participation grows steadily; estimated reach rises after Matchday Gives. Reach
            should be replaced by provider-validated data before external reporting.
          </p>
        </Card>
        <Card className="padded radar-panel">
          <CardHeader
            title="Impact By Initiative"
            description="Investment and measured participation"
          />
          <div className="metric-list">
            {communityRecords.map((item) => (
              <div
                key={item.initiative}
                style={{ padding: "12px 0", borderBottom: "1px solid #edf3f7" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <strong style={{ fontSize: 11 }}>{item.initiative}</strong>
                  <span style={{ fontSize: 11, fontWeight: 700 }}>
                    {currency(item.contribution)}
                  </span>
                </div>
                <div className="progress-track" style={{ marginTop: 9 }}>
                  <div
                    className="progress-fill"
                    style={{ width: `${Math.min(100, item.reach / 200)}%` }}
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 6,
                    color: "#637283",
                    fontSize: 9,
                  }}
                >
                  <span>{number(item.participants)} participants</span>
                  <span>{number(item.reach)} reach</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <Card className="padded">
        <CardHeader
          title="Community Impact Register"
          description="Operational records retain program attribution, partner counts, hours, contribution, and reporting period."
        />
        <DataTable
          caption="Community impact records"
          headers={[
            "Initiative",
            "Program",
            "Month",
            "Participants",
            "Event attendance",
            "Partners",
            "Volunteer hours",
            "Contribution",
            "Reach",
            "Evidence",
          ]}
          rows={communityRecords.map((item) => [
            <strong key="name">{item.initiative}</strong>,
            item.program,
            item.month,
            number(item.participants),
            number(item.eventAttendance),
            item.partners,
            number(item.volunteerHours),
            currency(item.contribution),
            number(item.reach),
            <Status key="evidence" tone="warning">
              Demo record
            </Status>,
          ])}
        />
      </Card>
    </>
  );
}
