import Link from "next/link";
import { ExternalLink, ShieldCheck } from "lucide-react";
import { Card, CardHeader, DataTable, PageHeader, SourceBadge } from "@/components/ui";
import { sourceDocuments } from "@/lib/data/pcfc-reference";

const provenance = [
  [
    "Official public information",
    "Club location, league entries, stated community orientation, venues and public partnerships",
    "USL League Two, USL W League, official club site",
  ],
  [
    "User-provided source document",
    "Private evidence class used in the internal model but deliberately excluded from this repository",
    "No private source rows, filenames, hashes, payees, contacts or attributed messages are copied",
  ],
  [
    "Synthetic demonstration data",
    "Attendance, supporter behavior, contract workflow, campaigns, forecasts and impact values",
    "Deterministic seed; never claimed as club results",
  ],
  [
    "User-entered operational data",
    "Validated manual and CSV records entered by authorized staff",
    "Attributed to actor, batch, and timestamp",
  ],
  [
    "Calculated metric",
    "KPI and financial result derived from stored records",
    "Formula and calculation version retained",
  ],
  [
    "Forecast or scenario",
    "Planning result driven by explicit assumptions",
    "Editable; never presented as an actual result",
  ],
  [
    "Documented assumption",
    "Operating or methodological choice awaiting stakeholder validation",
    "Recorded in BA and production-readiness artifacts",
  ],
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="About & provenance"
        title="Independent by design. Explicit about evidence."
        description="This portfolio case study demonstrates a credible operating model while keeping official facts, synthetic records, calculations, and assumptions unmistakably separate."
      />
      <div className="grid-2">
        <Card className="case-section radar-panel">
          <p className="eyebrow">Portfolio disclosure</p>
          <h2>Not an official Port City FC product.</h2>
          <p>
            Independent portfolio case study. Not an official Port City FC product. Demonstration
            commercial and supporter data is synthetic.
          </p>
          <p>
            The configurable `PORTFOLIO_DISCLAIMER` presentation flag allows an authorized future
            implementation to remove this framing only after ownership, legal, data, security,
            hosting, and acceptance approvals.
          </p>
        </Card>
        <Card className="case-section">
          <p className="eyebrow">Verified public context</p>
          <h2>Facts used in this case study</h2>
          <ul>
            <li>Port City FC is based in Wilmington, North Carolina.</li>
            <li>The men’s program joined USL League Two for the 2026 season.</li>
            <li>The women’s program joined the USL W League for the 2026 season.</li>
            <li>
              Official USL sources describe a player pathway, youth-program partnerships, nonprofit
              collaboration, and ticket-linked charitable giving.
            </li>
          </ul>
        </Card>
      </div>
      <Card className="padded">
        <CardHeader
          title="Data provenance classification"
          description="Every metric, record, or claim must fall into one of these seven classes."
        />
        <div className="provenance-grid">
          {provenance.map(([name, content, control]) => (
            <div className="provenance-item" key={name}>
              <SourceBadge source={name as Parameters<typeof SourceBadge>[0]["source"]} />
              <p style={{ marginTop: 10 }}>{content}</p>
              <p style={{ marginTop: 7 }}>
                <strong>Control:</strong> {control}
              </p>
            </div>
          ))}
        </div>
      </Card>
      <Card className="padded section-gap">
        <CardHeader
          title="Published data-asset register"
          description="Only sanitized, reproducible inputs and outputs available in this repository"
          action={<ShieldCheck size={18} />}
        />
        <DataTable
          caption="Published data asset register"
          headers={["Source", "Coverage", "File", "SHA-256"]}
          rows={sourceDocuments.map((source) => [
            <strong key="name">{source.name}</strong>,
            source.coverage,
            source.file,
            <code key="hash" title={source.sha256}>
              {source.sha256.slice(0, 12)}…
            </code>,
          ])}
        />
        <div className="callout section-gap">
          <ShieldCheck size={18} />
          <div>
            <strong>Interpretation controls</strong>
            <p>
              These assets are synthetic demonstration data, not audited club financial statements.
              Monthly and category views reconcile to the same annual controls and must not be
              summed together. Generalized operating values remain planning assumptions, not club
              results or approved forecasts. Run <code>npm run data:build</code> and inspect the
              reconciliation output before using any figure.
            </p>
          </div>
        </div>
      </Card>
      <Card className="padded section-gap">
        <CardHeader
          title="Official source register"
          description="Sources were reviewed on 11 October 2026. Public facts should be revalidated before any external presentation."
          action={<ShieldCheck size={18} />}
        />
        <DataTable
          caption="Official source register"
          headers={["Source", "Evidence used", "Link"]}
          rows={[
            [
              "USL League Two",
              "2026 entry, Wilmington, pathways, community links, venues",
              "https://www.uslleaguetwo.com/news_article/show/1351811",
            ],
            [
              "USL W League",
              "2026 entry, women’s program, Wilmington, mission, community links",
              "https://www.uslwleague.com/news_article/show/1339867",
            ],
            [
              "Port City FC",
              "Current public identity and official site context",
              "https://portcityfc.com/",
            ],
          ].map(([source, evidence, url]) => [
            <strong key="source">{source}</strong>,
            evidence,
            <a key="url" href={url} target="_blank" rel="noreferrer">
              Open official source <ExternalLink size={11} />
            </a>,
          ])}
        />
      </Card>
      <Card className="padded section-gap">
        <CardHeader
          title="Brand asset boundary"
          description="The circular crest is an unaltered local copy served by the club’s current official site."
        />
        <p style={{ color: "#637283", fontSize: 11, lineHeight: 1.65 }}>
          The application preserves the crest’s proportions and colors, provides clear space, and
          does not redraw or recolor it. The asset lives at{" "}
          <code>public/brand/port-city-fc-logo.png</code> and can be replaced by an authorized
          rights-holder without changing the interface.
        </p>
        <Link href="/case-study" className="button button-secondary">
          Explore the case study
        </Link>
      </Card>
    </>
  );
}
