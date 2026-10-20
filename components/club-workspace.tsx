"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useHubData } from "./data-context";
import { Card, CardHeader, DataTable, EmptyState, KpiCard, PageHeader, Status } from "./ui";
import { summarizeClub } from "@/lib/workspace";
import { toCsv } from "@/lib/csv";
import { currency, number } from "@/lib/format";
import { hasPermission } from "@/lib/rbac";
export const downloadText = (name: string, content: string, type = "text/csv;charset=utf-8") => {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
const value = (n: number | null, money = false) =>
  n === null ? "Unavailable" : money ? currency(n) : number(n);
const titles: Record<string, string> = {
  "/ownership": "Ownership Snapshot",
  "/dashboard": "Command Center",
  "/attendance": "Fan Funnel",
  "/programs": "Program Equity",
  "/sponsors": "Sponsorship",
  "/community": "Community Impact",
  "/reports": "Reports & Exports",
  "/case-study": "BA Case Study",
  "/help": "Help & Methods",
  "/about": "About This Project",
};
export function ClubWorkspace({ path }: { path: string }) {
  const { workspace: loaded, refreshWorkspace } = useHubData();
  const workspace = loaded!;
  const reportingView = [
    "/ownership",
    "/dashboard",
    "/attendance",
    "/programs",
    "/reports",
  ].includes(path);
  const [program, setProgram] = useState("All");
  const [season, setSeason] = useState(workspace.reporting.activeSeasonExternalId ?? "All");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState(path === "/sponsors" ? "name" : "date");
  const [detail, setDetail] = useState<string | null>(null);
  const fixtures = useMemo(
    () =>
      workspace.fixtures
        .filter(
          (f) =>
            (program === "All" || f.program === program) &&
            (season === "All" || f.seasonId === season) &&
            `${f.id} ${f.name} ${f.venue} ${f.date} ${f.program} ${f.competition} ${f.classification}`
              .toLowerCase()
              .includes(query.toLowerCase()),
        )
        .sort((a, b) =>
          sort === "name"
            ? a.name.localeCompare(b.name)
            : sort === "revenue"
              ? (b.revenue ?? -Infinity) - (a.revenue ?? -Infinity)
              : a.date.localeCompare(b.date),
        ),
    [workspace.fixtures, program, season, query, sort],
  );
  const canInspect =
    hasPermission(workspace.user.role, "analytics:read") ||
    hasPermission(workspace.user.role, "fixtures:read");
  const summary = canInspect ? summarizeClub(fixtures) : workspace.summary;
  const record = workspace.records.find((r) => r.id === detail || r.externalId === detail);
  const approved = workspace.records.filter((r) => r.status === "APPROVED");
  const sponsors = approved
    .filter(
      (r) =>
        r.entityType === "sponsors" &&
        (program === "All" || r.payload.program === program || r.payload.program === "Club-wide") &&
        r.name.toLowerCase().includes(query.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "value"
        ? Number(b.payload.contractValue ?? -1) - Number(a.payload.contractValue ?? -1) ||
          a.name.localeCompare(b.name)
        : a.name.localeCompare(b.name),
    );
  const actions = approved.filter(
    (r) => r.entityType === "recommendations" && r.payload.actionStatus !== "Done",
  );
  const exportReport = () => {
    const stamp = new Date().toISOString();
    const rows =
      path === "/sponsors"
        ? sponsors.map((r) => ({
            recordId: r.externalId,
            name: r.name,
            ...r.payload,
            version: r.version,
            scope: `Sponsors; ${program}; search=${query}`,
            exportedAt: stamp,
          }))
        : canInspect
          ? fixtures.map((f) => ({
              ...f,
              unit: "USD / fixture; people",
              scope: `${program}; ${season}; search=${query}`,
              exportedAt: stamp,
            }))
          : [{ ...summary, scope: "Approved organization-wide aggregates", exportedAt: stamp }];
    downloadText(
      "pcfc-private-meeting-report.csv",
      toCsv(
        rows.length
          ? rows
          : [
              {
                scope: `${program}; ${season}; search=${query}`,
                availability: "No approved records match this selection",
                evidence: "No demonstration data substituted",
                exportedAt: stamp,
              },
            ],
      ),
    );
  };
  return (
    <>
      <PageHeader
        eyebrow={workspace.organization.name}
        title={titles[path] ?? "Club workspace"}
        description="Private reporting from approved operational records. Source references and recorded assumptions remain visible; approval is not independent source certification."
        actions={
          <>
            <button className="button button-secondary" onClick={() => void refreshWorkspace()}>
              Refresh records
            </button>
            {hasPermission(workspace.user.role, "reports:export") &&
              (reportingView || path === "/sponsors") && (
                <button className="button button-secondary" onClick={exportReport}>
                  {path === "/sponsors" ? "Export contract rows" : "Export meeting data"}
                </button>
              )}
            {(reportingView || path === "/sponsors") && (
              <button className="button button-primary" onClick={() => window.print()}>
                Print meeting report
              </button>
            )}
          </>
        }
      />
      <div className="callout">
        <div>
          <strong>Approved records only · USD · no live integrations</strong>
          <details>
            <summary>Sources, exclusions & reporting ownership</summary>
            {!canInspect && path !== "/sponsors" && (
              <p>
                Your role has aggregate-only access. Fixture filters and detailed source records are
                restricted.
              </p>
            )}
            <p>
              Fixture receipts and costs are not the synthetic FY24/FY25 cash model, contract face
              value, bank balance or accounting profit. Blank values remain unavailable. Reference
              dates belong to records; exports carry a separate generation timestamp.
            </p>
            <p>
              Reporting owner: {workspace.reporting.dataOwner || "Not assigned"} · reporting
              reference: {workspace.reporting.referenceDate || "Not set"}.{" "}
              {workspace.reporting.reportingNote}
            </p>
            <p>
              Calculated results inherit every input’s evidence limits. Synthetic or assumed records
              are never certified actuals; inspect the linked records for each class and reference
              date.
            </p>
          </details>
        </div>
      </div>
      {(reportingView || path === "/sponsors") && (
        <p className="report-scope">
          Report scope:{" "}
          {canInspect || path === "/sponsors"
            ? `${program}; ${path === "/sponsors" ? "contract register" : season}; search=${query || "none"}`
            : "Organization-wide approved aggregates"}
          . USD / people. Reporting owner: {workspace.reporting.dataOwner || "Not assigned"};
          reporting reference: {workspace.reporting.referenceDate || "Not set"}. Record reference
          dates are retained in evidence. Prepared {new Date().toISOString()}.
        </p>
      )}
      {((reportingView && canInspect) || path === "/sponsors") && (
        <section className="filter-bar club-report-filters" aria-label="Operational report filters">
          <label>
            Program
            <select
              aria-label="Operational program"
              value={program}
              onChange={(e) => {
                setProgram(e.target.value);
                setDetail(null);
              }}
            >
              <option>All</option>
              <option>Men</option>
              <option>Women</option>
            </select>
          </label>
          {path !== "/sponsors" && (
            <label>
              Season
              <select
                aria-label="Operational season"
                value={season}
                onChange={(e) => setSeason(e.target.value)}
              >
                <option>All</option>
                {season !== "All" && !workspace.fixtures.some((f) => f.seasonId === season) && (
                  <option value={season}>Active season · no approved fixtures</option>
                )}
                {[...new Map(workspace.fixtures.map((f) => [f.seasonId, f.season])).entries()].map(
                  ([id, name]) => (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  ),
                )}
              </select>
            </label>
          )}
          <label>
            Search
            <input
              aria-label="Search operational records"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <label>
            Sort
            <select
              aria-label="Operational sort"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              {path !== "/sponsors" && <option value="date">Date</option>}
              <option value="name">Name</option>
              {path !== "/sponsors" ? (
                <option value="revenue">Receipts: high first</option>
              ) : (
                <option value="value">Face value: high first</option>
              )}
            </select>
          </label>
          <button
            className="button button-ghost"
            onClick={() => {
              setProgram("All");
              setSeason("All");
              setQuery("");
              setSort(path === "/sponsors" ? "name" : "date");
            }}
          >
            Reset filters
          </button>
        </section>
      )}
      {path === "/sponsors" ? (
        <>
          <Card className="padded">
            <CardHeader
              title="Contract Register"
              description="Club-wide contracts appear once. Face value is not cash collected."
              action={
                <Link className="button button-secondary" href="/operations">
                  Manage sponsor records
                </Link>
              }
            />
            {sponsors.length ? (
              <DataTable
                caption="Approved sponsor contracts"
                headers={[
                  "Contract",
                  "Program",
                  "Face value USD",
                  "Owner",
                  "Reference date",
                  "Evidence",
                ]}
                rows={sponsors.map((s) => [
                  <button
                    key="name"
                    className="button button-ghost"
                    onClick={() => setDetail(s.id)}
                  >
                    {s.name}
                  </button>,
                  String(s.payload.program),
                  s.payload.contractValue === undefined
                    ? "Unavailable"
                    : currency(Number(s.payload.contractValue)),
                  String(s.payload.owner),
                  String(s.payload.referenceDate),
                  String(s.payload.evidence),
                ])}
              />
            ) : (
              <EmptyState
                title="No Approved Sponsor Contracts"
                detail="Enter a contract and approve it after source review. No sample accounts are substituted."
              />
            )}
          </Card>
          <Card className="padded section-gap">
            <CardHeader
              title="Sponsor Delivery Register"
              description="Recorded statuses, owners, due dates and evidence, including completed items. No probabilistic renewal score is inferred."
            />
            <DataTable
              caption="Sponsor deliverables"
              headers={["Deliverable", "Sponsor", "Owner", "Due", "Status", "Evidence"]}
              rows={approved
                .filter(
                  (r) =>
                    r.entityType === "sponsor-deliverables" &&
                    sponsors.some((s) => s.externalId === r.payload.sponsorExternalId),
                )
                .map((d) => [
                  d.name,
                  String(d.payload.sponsorExternalId),
                  String(d.payload.owner),
                  String(d.payload.dueOn),
                  String(d.payload.deliveryStatus),
                  String(d.payload.evidenceNote) || "No delivery evidence recorded",
                ])}
            />
          </Card>
        </>
      ) : reportingView ? (
        <>
          <div className="kpi-grid club-kpi-grid">
            {[
              [
                "Recorded paid attendance",
                value(summary.paid),
                "Sum of recorded paid counts; missing fixture attendance is excluded, not inferred",
              ],
              [
                "Recorded receipts",
                value(summary.receipts, true),
                "Sum of approved fixture receipt records; missing records do not establish zero receipts",
              ],
              [
                "Recorded costs",
                value(summary.costs, true),
                "Sum of approved direct and explicitly allocated shared fixture cost records",
              ],
              [
                "Recorded contribution",
                value(summary.contribution, true),
                "Receipts less recorded costs; unavailable unless every selected fixture has both kinds of record. Omitted overhead may remain",
              ],
            ].map(([label, display, definition]) => (
              <KpiCard
                key={label}
                label={label!}
                value={display!}
                change="Recorded"
                positive={null}
                source="Calculated metric"
                definition={definition!}
              />
            ))}
          </div>
          <p className="chart-summary">
            Approved fixture records in scope: {summary.fixtures}. Completeness:{" "}
            {summary.completeFixtures} of {summary.fixtures} fixtures have both receipts and costs
            recorded. This is record coverage, not assurance that every expense has been captured.
          </p>
          {path === "/programs" && canInspect && (
            <Card className="padded section-gap">
              <CardHeader
                title="Like-for-like Program Comparison"
                description="Selected season and search scope. Returning share is weighted by recorded paid attendance, not an average of fixture percentages; missing counts make the share unavailable."
              />
              <DataTable
                caption="Program comparison"
                headers={[
                  "Program",
                  "Fixtures",
                  "Recorded paid",
                  "Recorded receipts USD",
                  "Recorded costs USD",
                  "Recorded contribution USD",
                  "Returning / paid",
                ]}
                rows={["Men", "Women"].map((p) => {
                  const rows = fixtures.filter((f) => f.program === p),
                    s = summarizeClub(rows);
                  const returning =
                    rows.length &&
                    rows.every((f) => f.returning !== null && f.paid !== null) &&
                    (s.paid ?? 0) > 0
                      ? rows.reduce((sum, f) => sum + f.returning!, 0) / s.paid!
                      : null;
                  return [
                    p,
                    String(s.fixtures),
                    value(s.paid),
                    value(s.receipts, true),
                    value(s.costs, true),
                    value(s.contribution, true),
                    returning === null ? "Unavailable" : `${(returning * 100).toFixed(1)}%`,
                  ];
                })}
              />
            </Card>
          )}
          {canInspect && (
            <Card className="padded section-gap">
              <CardHeader
                title="Receipts By Fixture"
                description="USD · fixture date order unless another sort is selected. Select a fixture for source evidence."
              />
              {fixtures.length ? (
                <div className="club-chart">
                  {fixtures.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      className="club-chart-row"
                      onClick={() => setDetail(f.id)}
                      aria-label={`Inspect ${f.name}, ${f.date}, receipts ${value(f.revenue, true)}`}
                    >
                      <span>
                        {f.date} · {f.name}
                      </span>
                      <span className="club-chart-track">
                        <i
                          style={{
                            width: `${f.revenue === null ? 0 : (Math.max(0, f.revenue) / Math.max(1, ...fixtures.map((x) => x.revenue ?? 0))) * 100}%`,
                          }}
                        />
                      </span>
                      <b>{value(f.revenue, true)}</b>
                    </button>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="Your Reporting Dataset Is Empty"
                  detail="Configure a season, program, competition and venue; enter or import fixtures and approved attendance, receipts and costs in Operations studio."
                />
              )}
            </Card>
          )}
          {canInspect && (
            <Card className="padded section-gap">
              <CardHeader
                title="Fixture Reporting Register"
                description="Each number comes from the approved records created through Operations studio."
                action={
                  hasPermission(workspace.user.role, "operations:read") ? (
                    <Link href="/operations" className="button button-secondary">
                      Enter or import records
                    </Link>
                  ) : undefined
                }
              />
              <DataTable
                caption="Approved fixture analytics"
                headers={[
                  "Fixture",
                  "Program",
                  "Date",
                  "Home / away",
                  "Paid",
                  "Receipts USD",
                  "Costs USD",
                  "Contribution USD",
                  "Evidence",
                ]}
                rows={fixtures.map((f) => [
                  f.name,
                  f.program,
                  f.date,
                  f.classification,
                  value(f.paid),
                  value(f.revenue, true),
                  value(f.cost, true),
                  value(f.contribution, true),
                  <button
                    key="evidence"
                    className="button button-ghost"
                    onClick={() => setDetail(f.id)}
                  >
                    Source & definition
                  </button>,
                ])}
              />
            </Card>
          )}
        </>
      ) : null}
      {detail && (
        <Card className="padded section-gap" role="region" aria-label="Operational evidence">
          <CardHeader
            title="Source & Calculation Evidence"
            action={
              <button className="button button-secondary" onClick={() => setDetail(null)}>
                Close evidence
              </button>
            }
          />
          {record ? (
            <>
              {record.entityType === "sponsors" ? (
                <p>
                  Grain: one contract, USD face value, with its recorded program and start/end
                  dates. Face value is not sponsorship cash received, recognized revenue or a
                  renewal probability. Club-wide accounts are not allocated to programs.
                </p>
              ) : (
                <p>
                  Unit and grain: USD and people per fixture; scope: {program} / {season}. Receipts
                  = sum of linked approved receipt amounts; costs = linked approved direct and
                  allocated shared costs; contribution = receipts − costs only if both are recorded.
                  Paid attendance excludes complimentary entrants. Omitted overhead, bank balances
                  and accounting adjustments are not inferred. No historical comparison exists
                  without matching records.
                </p>
              )}
              <dl className="club-evidence">
                {Object.entries({
                  externalId: record.externalId,
                  domain: record.entityType,
                  approval: record.status,
                  version: record.version,
                  ...record.payload,
                  updatedAt: record.updatedAt,
                }).map(([key, v]) => (
                  <div key={key}>
                    <dt>{key}</dt>
                    <dd>{String(v)}</dd>
                  </div>
                ))}
              </dl>
              <h3>Linked analytical source records</h3>
              <DataTable
                caption="Linked source records"
                headers={["Record", "Domain", "Evidence", "Source", "Reference date", "Version"]}
                rows={approved
                  .filter((r) => r.payload.fixtureExternalId === record.externalId)
                  .map((r) => [
                    r.name,
                    r.entityType,
                    String(r.payload.evidence),
                    String(r.payload.sourceRef),
                    String(r.payload.referenceDate),
                    String(r.version),
                  ])}
              />
            </>
          ) : (
            <p>
              Fixture source: {fixtures.find((f) => f.id === detail)?.sourceRef}. Receipts = sum of
              approved linked receipt amounts; costs = sum of linked approved direct/allocated
              costs; contribution = receipts − costs only when both have recorded inputs. Attendance
              is one approved count per fixture. Shared overhead not explicitly recorded is
              excluded.
            </p>
          )}
        </Card>
      )}
      {(reportingView || path === "/sponsors") && (
        <Card className="padded section-gap">
          <CardHeader
            title="Accountable Next Actions"
            description="Organization-wide open approved actions; not filtered by fixture, season or sponsor search. These are entered actions, not generated business recommendations."
            action={
              hasPermission(workspace.user.role, "governance:write") ? (
                <Link href="/operations" className="button button-secondary">
                  Assign an action
                </Link>
              ) : undefined
            }
          />
          <DataTable
            caption="Open decisions and actions"
            headers={["Action", "Priority", "Owner", "Due", "Status", "Evidence and next step"]}
            rows={actions.map((a) => [
              a.name,
              String(a.payload.priority),
              String(a.payload.owner),
              String(a.payload.dueOn),
              <Status key="status" tone="warning">
                {String(a.payload.actionStatus)}
              </Status>,
              String(a.payload.rationale),
            ])}
          />
          {!actions.length && (
            <p>
              No open approved actions are recorded. An empty register is not proof that no risks
              exist.
            </p>
          )}
        </Card>
      )}
      {["/community", "/help", "/about", "/case-study", "/reports"].includes(path) && (
        <Card className="padded section-gap">
          <CardHeader title="Evidence and Operating Method" />
          <p>
            Configure → enter or import → validate → approve → reconcile → review → assign an action
            → save a conditional scenario → export → inspect Settings & audit. Community allocation
            is a scenario input, not measured community impact. No community reach, acquired
            supporters, ROI or causal effect is inferred from fixture records.
          </p>
          <p>
            Approval requires a named source reference and data reference date. New records start as
            drafts; reviewed records must be explicitly approved. Use correction versions instead of
            repeat imports. Organization data is isolated on the server.
          </p>
          <div className="club-toolbar">
            <a
              className="button button-secondary"
              href="/api/artifacts/club-handover"
              download="pcfc-club-handover.md"
            >
              Download club handover
            </a>
            <a
              className="button button-secondary"
              href="/api/artifacts/calculation-methodology"
              download="pcfc-calculation-methodology.md"
            >
              Calculation methodology
            </a>
            <a
              className="button button-secondary"
              href="/api/artifacts/kpi-dictionary"
              download="pcfc-kpi-dictionary.md"
            >
              KPI definitions
            </a>
          </div>
          {path === "/about" && (
            <p>
              Next.js and TypeScript present an organization-scoped PostgreSQL workspace. Domain
              payloads are typed JSONB records; application validation and transaction locks enforce
              their references. Legacy pilot tables are retained for compatibility, not combined
              into reporting. Audit writes are atomic with changes, while scenario snapshots retain
              earlier versions. These controls do not imply connected accounting/ticket systems,
              database-level team RLS or independent source certification.
            </p>
          )}
        </Card>
      )}
    </>
  );
}
