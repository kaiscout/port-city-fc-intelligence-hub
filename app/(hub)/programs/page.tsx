"use client";

import { useState } from "react";
import { ArrowRight, Equal, TrendingUp } from "lucide-react";
import { ProgramBars } from "@/components/charts/analytics-charts";
import { Card, CardHeader, PageHeader, SourceBadge, Status } from "@/components/ui";
import { aggregateFixtures, calculateScenario } from "@/lib/calculations";
import { demoFixtures, scenarioPresets } from "@/lib/data/demo";
import { currency, number, percent } from "@/lib/format";

const compareRows = [
  ["Paid attendance", "5,652", "6,187", "+9.5%"],
  ["Matchday revenue", "$178.0K", "$186.6K", "+4.8%"],
  ["Operating cost", "$120.6K", "$123.9K", "+2.7%"],
  ["Operating margin", "$57.4K", "$62.7K", "+9.2%"],
  ["Sponsor allocation", "$44.0K", "$49.0K", "+11.4%"],
  ["Returning supporters", "45.8%", "50.4%", "+4.6 pts"],
  ["Community participation", "168", "236", "+40.5%"],
  ["Marketing cost / purchase", "$4.98", "$4.34", "−12.9%"],
  ["Break-even attendance", "1,124", "1,048", "−76 seats"],
];

export default function ProgramsPage() {
  const [caseId, setCaseId] = useState("baseline");
  const caseInput = scenarioPresets.find((item) => item.id === caseId) ?? scenarioPresets[1]!;
  const result = calculateScenario({ ...caseInput, program: "Women" });
  const men = aggregateFixtures(demoFixtures.filter((fixture) => fixture.program === "Men"));
  const women = aggregateFixtures(demoFixtures.filter((fixture) => fixture.program === "Women"));

  return (
    <>
      <PageHeader
        eyebrow="Men’s & women’s programs"
        title="Grow both programs on evidence."
        description="Compare performance equitably, make shared costs visible, and test the women’s program business case as a first-class growth investment."
        actions={
          <Status tone="info">
            <Equal size={13} /> Equity lens active
          </Status>
        }
      />
      <div className="split-comparison">
        <section className="program-panel">
          <div className="program-title">
            <div>
              <p className="eyebrow">USL League Two</p>
              <h2>Men’s program</h2>
            </div>
            <span className="program-score">96</span>
          </div>
          <div className="metric-list">
            <div className="metric-row">
              <span>Paid attendance</span>
              <strong>{number(men.paidAttendance)}</strong>
            </div>
            <div className="metric-row">
              <span>Total revenue</span>
              <strong>{currency(men.totalRevenue)}</strong>
            </div>
            <div className="metric-row">
              <span>Operating margin</span>
              <strong>{currency(men.operatingMargin)}</strong>
            </div>
            <div className="metric-row">
              <span>Returning supporters</span>
              <strong>{percent(men.returningSupporterPct)}</strong>
            </div>
            <div className="metric-row">
              <span>Shared cost allocation</span>
              <strong>$31,400</strong>
            </div>
            <div className="metric-row">
              <span>Program-specific costs</span>
              <strong>$89,240</strong>
            </div>
          </div>
        </section>
        <section className="program-panel">
          <div className="program-title">
            <div>
              <p className="eyebrow">USL W League</p>
              <h2>Women’s program</h2>
            </div>
            <span className="program-score">108</span>
          </div>
          <div className="metric-list">
            <div className="metric-row">
              <span>Paid attendance</span>
              <strong>{number(women.paidAttendance)}</strong>
            </div>
            <div className="metric-row">
              <span>Total revenue</span>
              <strong>{currency(women.totalRevenue)}</strong>
            </div>
            <div className="metric-row">
              <span>Operating margin</span>
              <strong>{currency(women.operatingMargin)}</strong>
            </div>
            <div className="metric-row">
              <span>Returning supporters</span>
              <strong>{percent(women.returningSupporterPct)}</strong>
            </div>
            <div className="metric-row">
              <span>Shared cost allocation</span>
              <strong>$31,400</strong>
            </div>
            <div className="metric-row">
              <span>Program-specific costs</span>
              <strong>$92,490</strong>
            </div>
          </div>
        </section>
      </div>
      <div className="grid-2 section-gap">
        <Card className="chart-card">
          <CardHeader
            title="Normalized performance index"
            description="100 equals combined club benchmark; synthetic dataset"
            action={<SourceBadge source="Calculated metric" />}
          />
          <ProgramBars
            data={[
              { metric: "Attendance", Men: 93, Women: 107 },
              { metric: "Revenue", Men: 95, Women: 105 },
              { metric: "Margin", Men: 91, Women: 109 },
              { metric: "Sponsor", Men: 94, Women: 106 },
              { metric: "Engagement", Men: 96, Women: 112 },
              { metric: "Community", Men: 90, Women: 118 },
              { metric: "Efficiency", Men: 97, Women: 109 },
              { metric: "Growth", Men: 102, Women: 121 },
            ]}
          />
          <p className="chart-summary">
            Scores normalize differently scaled measures before comparison. They are a decision aid,
            not a ranking of sporting merit.
          </p>
        </Card>
        <Card className="padded">
          <CardHeader
            title="Comparable KPI ledger"
            description="Absolute values and decision-relevant variance"
          />
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Measure</th>
                  <th>Men</th>
                  <th>Women</th>
                  <th>Variance</th>
                </tr>
              </thead>
              <tbody>
                {compareRows.map((row) => (
                  <tr key={row[0]}>
                    <td>
                      <strong>{row[0]}</strong>
                    </td>
                    <td>{row[1]}</td>
                    <td>{row[2]}</td>
                    <td>
                      <Status tone="success">{row[3]}</Status>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
      <Card className="padded section-gap radar-panel">
        <CardHeader
          title="Women’s program investment case"
          description="Choose an assumption set to compare the commercial and community case."
          action={
            <div className="preset-tabs" style={{ margin: 0 }}>
              {scenarioPresets.map((scenario) => (
                <button
                  key={scenario.id}
                  className={`preset-tab ${caseId === scenario.id ? "active" : ""}`}
                  onClick={() => setCaseId(scenario.id)}
                >
                  {scenario.name}
                </button>
              ))}
            </div>
          }
        />
        <div className="grid-4">
          <div className="result-cell">
            <span>Investment envelope</span>
            <strong>{currency(caseInput.marketingSpend + 10500)}</strong>
          </div>
          <div className="result-cell">
            <span>Projected revenue</span>
            <strong>{currency(result.totalRevenue)}</strong>
          </div>
          <div className="result-cell">
            <span>Projected margin</span>
            <strong>{currency(result.operatingMargin)}</strong>
          </div>
          <div className="result-cell">
            <span>Break-even attendance</span>
            <strong>{number(result.breakEvenAttendance ?? 0)}</strong>
          </div>
        </div>
        <div className="grid-3">
          <div>
            <h3 className="section-title">Investment opportunities</h3>
            <ul className="action-list section-gap">
              <li className="action-item">
                <span className="risk-index">
                  <TrendingUp size={14} />
                </span>
                <div>
                  <strong>Fixture-specific acquisition</strong>
                  <p>
                    Scale the best-performing partner and email audiences around high-intent home
                    dates.
                  </p>
                </div>
              </li>
              <li className="action-item">
                <span className="risk-index">02</span>
                <div>
                  <strong>Girls pathway activation</strong>
                  <p>
                    Package player pathway, community clinic, and sponsor inventory as one
                    measurable platform.
                  </p>
                </div>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="section-title">Operational requirements</h3>
            <ul>
              <li>Protected matchday staffing and venue decision dates</li>
              <li>Program-specific CRM tagging and cohort reporting</li>
              <li>Equal-quality creative, merchandise, and content inventory</li>
              <li>Named sponsor activation owner</li>
            </ul>
          </div>
          <div>
            <h3 className="section-title">Success criteria</h3>
            <ul>
              <li>≥1,500 average paid attendance</li>
              <li>≥48% returning-supporter rate</li>
              <li>≥$14 matchday contribution per attendee</li>
              <li>≥85% sponsor fulfillment by due date</li>
              <li>≥200 community participants per season</li>
            </ul>
          </div>
        </div>
        <div className="callout">
          <ArrowRight size={18} />
          <div>
            <strong>Recommendation</strong>
            <p>
              Approve the baseline investment with a six-week checkpoint. Release the optimistic
              tranche only when ticket-start conversion and sponsor commitments clear the documented
              gates.
            </p>
          </div>
        </div>
      </Card>
    </>
  );
}
