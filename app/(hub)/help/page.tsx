import Link from "next/link";
import { BookOpenCheck, DatabaseBackup, FileQuestion, LifeBuoy, ShieldCheck } from "lucide-react";
import { Card, CardHeader, DataTable, PageHeader, Status } from "@/components/ui";

export default function HelpPage() {
  return (
    <>
      <PageHeader
        eyebrow="In-application help"
        title="Use the hub with confidence."
        description="Operating guidance, calculation definitions, import controls, recovery procedures, and clear boundaries for future integrations."
      />
      <div className="grid-2">
        <Card className="padded">
          <CardHeader title="Start here" description="Role-aware operating guides" />
          <ul className="action-list">
            <li className="action-item">
              <span className="risk-index">
                <BookOpenCheck size={14} />
              </span>
              <div>
                <strong>Administrator onboarding</strong>
                <p>
                  Configure organization, season, programs, venues, categories, KPI targets, and
                  staff accounts.
                </p>
              </div>
              <Status tone="info">6 min</Status>
            </li>
            <li className="action-item">
              <span className="risk-index">
                <FileQuestion size={14} />
              </span>
              <div>
                <strong>Importing operational data</strong>
                <p>
                  Download a template, preserve external IDs, preview row errors, then commit valid
                  records.
                </p>
              </div>
              <Status tone="info">4 min</Status>
            </li>
            <li className="action-item">
              <span className="risk-index">
                <LifeBuoy size={14} />
              </span>
              <div>
                <strong>Resolving a duplicate</strong>
                <p>
                  Use source-system identity and fixture/date context; never delete a historic
                  season to force an import.
                </p>
              </div>
              <Status tone="info">2 min</Status>
            </li>
          </ul>
        </Card>
        <Card className="padded radar-panel">
          <CardHeader title="Calculation methodology" description="Version PCFC-DIH-CALC-1.0" />
          <div className="metric-list">
            <div className="metric-row">
              <span>Paid attendance</span>
              <strong>attendance × (1 − comp %)</strong>
            </div>
            <div className="metric-row">
              <span>Contribution margin</span>
              <strong>revenue − variable costs</strong>
            </div>
            <div className="metric-row">
              <span>Operating margin</span>
              <strong>revenue − total costs</strong>
            </div>
            <div className="metric-row">
              <span>Capacity utilization</span>
              <strong>attendance ÷ capacity</strong>
            </div>
            <div className="metric-row">
              <span>Ticket conversion</span>
              <strong>purchases ÷ ticket starts</strong>
            </div>
            <div className="metric-row">
              <span>Sponsor fulfillment</span>
              <strong>delivered ÷ due</strong>
            </div>
          </div>
          <Link href="/scenarios" className="button button-secondary section-gap">
            Open transparent formulas
          </Link>
        </Card>
      </div>
      <Card className="padded">
        <CardHeader
          title="Integration boundary register"
          description="No integration is claimed until it is authorized, implemented, reconciled, and tested."
        />
        <DataTable
          caption="External integration boundaries"
          headers={["System", "Pilot method", "Future boundary", "Required assurance"]}
          rows={[
            [
              "Ticketing",
              "CSV/manual",
              "Fixture, order, attendance imports",
              "Stable IDs, refunds, reconciliation",
            ],
            [
              "Accounting",
              "CSV/manual",
              "Approved revenue/cost summaries",
              "Chart mapping, close policy, read-only scope",
            ],
            [
              "Website analytics",
              "CSV/manual",
              "Aggregated funnel events",
              "Consent, retention, bot filtering",
            ],
            [
              "Email marketing",
              "CSV/manual",
              "Campaign aggregates only",
              "Consent and suppression ownership",
            ],
            ["Payments", "No processing", "Settled aggregate only", "No card data in Hub"],
            [
              "Social analytics",
              "CSV/manual",
              "Provider aggregates",
              "Reach methodology and API terms",
            ],
          ].map((row) => row.map((cell, i) => (i === 0 ? <strong key={i}>{cell}</strong> : cell)))}
        />
      </Card>
      <div className="grid-2 section-gap">
        <Card className="padded">
          <CardHeader
            title="Backup & restore"
            description="PostgreSQL procedures are documented and operator-owned."
          />
          <div className="callout">
            <DatabaseBackup size={18} />
            <p>
              Use an encrypted `pg_dump` stored outside the application host, verify the checksum,
              and test restore into an isolated database before declaring a backup usable.
            </p>
          </div>
          <p className="chart-summary">
            See docs/operations/backup-restore.md for exact commands, RPO/RTO assumptions,
            ownership, and verification.
          </p>
        </Card>
        <Card className="padded">
          <CardHeader
            title="Security responsibilities"
            description="A pilot is not a compliance certification."
          />
          <div className="callout">
            <ShieldCheck size={18} />
            <p>
              Owners must approve hosting, retention, production access, incident handling,
              real-data validation, and provider integrations before adoption.
            </p>
          </div>
          <p className="chart-summary">
            Report suspicious access, unexpected imports, or exposure immediately; rotate affected
            credentials and preserve audit evidence.
          </p>
        </Card>
      </div>
    </>
  );
}
