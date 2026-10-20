import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { Card, CardHeader, DataTable, PageHeader, SourceBadge, Status } from "@/components/ui";

const sections = [
  "problem",
  "objectives",
  "stakeholders",
  "process",
  "requirements",
  "solution",
  "testing",
  "findings",
  "roadmap",
];
const artifacts: [string, string, string][] = [
  ["01", "Business case & problem statement", "business-case.md"],
  ["02", "Project charter", "project-charter.md"],
  ["03", "Scope & exclusions", "scope-and-exclusions.md"],
  ["04", "Stakeholder map", "stakeholder-map.md"],
  ["05", "RACI", "raci.md"],
  ["06", "Current-state process", "current-state-process.md"],
  ["07", "Future-state process", "future-state-process.md"],
  ["08", "Requirements catalog", "requirements-catalog.md"],
  ["09", "MoSCoW prioritization", "moscow-prioritization.md"],
  ["10", "User stories", "user-stories.md"],
  ["11", "KPI dictionary", "kpi-dictionary.md"],
  ["12", "Data dictionary", "data-dictionary.md"],
  ["13", "Entity-relationship diagram", "entity-relationship-diagram.md"],
  ["14", "Traceability matrix", "traceability-matrix.md"],
  ["15", "RAID log", "raid-log.md"],
  ["16", "UAT plan", "uat-plan.md"],
  ["17", "Completed UAT results", "uat-results.md"],
  ["18", "Executive findings", "executive-findings.md"],
  ["19", "Product roadmap", "product-roadmap.md"],
  ["20", "Production readiness", "production-readiness-assessment.md"],
];

export default function CaseStudyPage() {
  return (
    <>
      <PageHeader
        eyebrow="Business analysis case study"
        title="BA Case Study"
        description="A recruiter-facing account of the analysis, prioritization, controls, data model, testing, and recommendations behind the pilot."
        actions={
          <Link className="button button-primary" href="/api/artifacts/requirements-catalog">
            Open requirements <ArrowRight size={14} />
          </Link>
        }
      />
      <nav className="case-nav" aria-label="Case study sections">
        {sections.map((section) => (
          <a key={section} href={`#${section}`}>
            {section.replace("-", " ")}
          </a>
        ))}
      </nav>
      <div className="grid-2">
        <Card id="problem" className="case-section radar-panel">
          <p className="eyebrow">01 · Business problem</p>
          <h2>Growth decisions were connected—but the evidence was not.</h2>
          <p>
            Port City FC’s men’s and women’s programs create a shared commercial and community
            opportunity. Yet attendance, matchday costs, sponsor obligations, funnel behavior, and
            impact evidence would normally live across separate operational tools. Leadership needs
            one governed layer that translates those records into timely choices without replacing
            the systems already used to run the club.
          </p>
          <div className="callout">
            <ShieldCheck size={18} />
            <p>
              <strong>Boundary:</strong> decision support and operational intelligence—not
              accounting, ticketing, payments, identity provision, or outbound email.
            </p>
          </div>
        </Card>
        <Card id="objectives" className="case-section">
          <p className="eyebrow">02 · Objectives & scope</p>
          <h2>Five outcomes define value.</h2>
          <ul>
            <li>Improve matchday contribution margin and break-even visibility.</li>
            <li>Convert more first-time supporters into repeat attendees.</li>
            <li>Prove sponsor delivery and surface renewal risk early.</li>
            <li>Allocate growth investment equitably across both programs.</li>
            <li>Evidence community activity with explicit provenance.</li>
          </ul>
          <h3>Exclusions</h3>
          <p>
            No payment processing, general ledger, live ticket issuance, customer messaging, or
            unverified provider integration.
          </p>
        </Card>
      </div>
      <Card id="stakeholders" className="case-section">
        <p className="eyebrow">03 · Stakeholders & governance</p>
        <h2>Decision rights are separated from data access.</h2>
        <DataTable
          caption="Stakeholder decision map"
          headers={["Stakeholder", "Primary need", "Decision right", "Hub role"]}
          rows={[
            [
              "Board / leadership",
              "Reliable performance narrative",
              "Investment and risk appetite",
              "Executive",
            ],
            [
              "Club administrator",
              "Governed setup and access",
              "Configuration and provisioning",
              "Administrator",
            ],
            [
              "Commercial lead",
              "Fulfillment and renewal evidence",
              "Sponsor recovery actions",
              "Commercial",
            ],
            ["Marketing lead", "Funnel and campaign economics", "Channel allocation", "Marketing"],
            [
              "Matchday operations",
              "Readiness and fixture records",
              "Operational execution",
              "Matchday Operations",
            ],
            [
              "Analyst",
              "Comparable metrics and scenarios",
              "Recommendation preparation",
              "Analyst",
            ],
          ].map((row) => row.map((cell, i) => (i === 0 ? <strong key={i}>{cell}</strong> : cell)))}
        />
      </Card>
      <div className="grid-2 section-gap">
        <Card id="process" className="case-section">
          <p className="eyebrow">04 · Future-state process</p>
          <h2>Validate once; reuse the evidence.</h2>
          <div className="process-flow">
            <div className="process-node">Configure</div>
            <div className="process-node">Import & validate</div>
            <div className="process-node">Calculate</div>
            <div className="process-node">Decide</div>
            <div className="process-node">Audit & report</div>
          </div>
          <p>
            Row-level errors and duplicates are resolved before a transaction commits. Calculated
            measures retain source classification and methodology. Role controls are repeated at the
            server boundary.
          </p>
        </Card>
        <Card id="requirements" className="case-section">
          <p className="eyebrow">05 · Requirements</p>
          <h2>Traceability connects intent to proof.</h2>
          <div className="metric-list">
            <div className="metric-row">
              <span>Business requirements</span>
              <strong>12</strong>
            </div>
            <div className="metric-row">
              <span>Functional requirements</span>
              <strong>48</strong>
            </div>
            <div className="metric-row">
              <span>Non-functional requirements</span>
              <strong>22</strong>
            </div>
            <div className="metric-row">
              <span>User stories</span>
              <strong>34</strong>
            </div>
            <div className="metric-row">
              <span>UAT scenarios</span>
              <strong>24</strong>
            </div>
          </div>
          <p>
            Each critical requirement maps to a screen or service and at least one automated or UAT
            verification.
          </p>
        </Card>
      </div>
      <Card id="solution" className="case-section">
        <p className="eyebrow">06 · Solution & data model</p>
        <h2>A modular decision layer with explicit trust boundaries.</h2>
        <div className="grid-3">
          <div className="provenance-item">
            <strong>Experience layer</strong>
            <p>
              Responsive Next.js application, accessible charts and tables, role-aware controls,
              print views.
            </p>
          </div>
          <div className="provenance-item">
            <strong>Domain layer</strong>
            <p>
              Financial calculations, sponsor-risk rules, validation, RBAC, CSV safety, and
              reporting.
            </p>
          </div>
          <div className="provenance-item">
            <strong>Data layer</strong>
            <p>
              PostgreSQL relational model, constraints, migrations, transaction boundaries, and
              audit events.
            </p>
          </div>
        </div>
        <h3>Core relationships</h3>
        <p>
          Organization owns users, settings, seasons, teams, venues, commercial records, and
          community programs. Fixtures join season, team, competition, and venue; attendance,
          revenue, and cost records roll into economics. Sponsors own contacts and deliverables.
          Scenarios retain versioned assumptions.
        </p>
      </Card>
      <div className="grid-2 section-gap">
        <Card id="testing" className="case-section">
          <p className="eyebrow">07 · Testing strategy</p>
          <h2>Test the decisions, not just the pixels.</h2>
          <ul>
            <li>Unit: financial formulas, break-even, KPI rules, sponsor risk, CSV safety.</li>
            <li>
              Integration: onboarding-to-audit workflow, permissions, clean-organization behavior.
            </li>
            <li>
              End-to-end: primary navigation, scenario editing, import preview, reports, viewports.
            </li>
            <li>Visual: desktop, tablet, mobile, print, browser console, focus and overflow.</li>
          </ul>
          <Status tone="success">
            <CheckCircle2 size={12} /> Evidence recorded in UAT results
          </Status>
        </Card>
        <Card id="findings" className="case-section">
          <p className="eyebrow">08 · Findings & recommendations</p>
          <h2>Retention makes growth cheaper.</h2>
          <ul>
            <li>
              Prioritize fixture-page and ticket-start conversion over undifferentiated reach.
            </li>
            <li>
              Use sponsor delivery recovery as revenue protection, not administrative cleanup.
            </li>
            <li>Fund women’s-program growth against demand, efficiency, and community evidence.</li>
            <li>Make shared-cost allocation visible to avoid distorted program comparisons.</li>
            <li>Introduce real data through controlled templates before pursuing integrations.</li>
          </ul>
        </Card>
      </div>
      <Card id="roadmap" className="case-section">
        <p className="eyebrow">09 · Product roadmap</p>
        <h2>Move from pilot evidence to authorized integration.</h2>
        <div className="process-flow">
          <div className="process-node">
            0–30d
            <br />
            configure
          </div>
          <div className="process-node">
            31–60d
            <br />
            parallel run
          </div>
          <div className="process-node">
            61–90d
            <br />
            UAT
          </div>
          <div className="process-node">
            Quarter 2<br />
            provider discovery
          </div>
          <div className="process-node">
            Later
            <br />
            approved automation
          </div>
        </div>
        <p>
          Any future provider connection requires access approval, mapping, failure handling,
          reconciliation ownership, privacy review, and tested rollback.
        </p>
      </Card>
      <Card className="padded section-gap">
        <CardHeader
          title="Business Analysis Artifact Index"
          description="Twenty professional artifacts are stored in /docs/ba and are accessible here as plain text."
          action={<SourceBadge source="Documented assumption" />}
        />
        <DataTable
          caption="Business Analysis artifact index"
          headers={["#", "Artifact", "File", "Status"]}
          rows={artifacts.map(([id, name, file]) => [
            id,
            <strong key="name">{name}</strong>,
            <Link key="file" href={`/api/artifacts/${file.replace(".md", "")}`}>
              {file}
            </Link>,
            <Status key="status" tone="success">
              Complete
            </Status>,
          ])}
        />
      </Card>
    </>
  );
}
