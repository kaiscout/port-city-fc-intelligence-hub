"use client";

import { useMemo, useState } from "react";
import {
  ClipboardCheck,
  Download,
  FileUp,
  Pencil,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { Card, CardHeader, DataTable, PageHeader, Status } from "@/components/ui";
import { type ImportKind, validateRows } from "@/lib/csv";
import { matchdayNeeds, openStaffRoles, staffRoles } from "@/lib/data/pcfc-reference";

const entities = [
  "Seasons",
  "Teams",
  "Competitions",
  "Venues",
  "Fixtures",
  "Attendance",
  "Ticket channels",
  "Revenue",
  "Costs",
  "Sponsors",
  "Sponsor packages",
  "Sponsor deliverables",
  "Campaigns",
  "Funnel metrics",
  "Community programs",
  "Community impact",
  "Scenarios",
  "Risks",
  "Recommendations",
  "Users",
  "Organization settings",
] as const;

type RecordRow = { id: string; name: string; status: string; owner: string; updated: string };

const initialRecords: Record<string, RecordRow[]> = Object.fromEntries(
  entities.map((entity, entityIndex) => [
    entity,
    [
      {
        id: `${entity.slice(0, 3).toUpperCase()}-001`,
        name:
          entity === "Seasons"
            ? "2026 inaugural USL season"
            : entity === "Teams"
              ? "Port City FC Women"
              : entity === "Competitions"
                ? "USL W League"
                : entity === "Venues"
                  ? "Legion Stadium"
                  : entity === "Fixtures"
                    ? "PCFC Women vs Charlotte Eagles"
                    : entity === "Users"
                      ? "Alex Morgan · Administrator"
                      : `${entity} primary record`,
        status: "Active",
        owner: entityIndex % 2 ? "Operations" : "Administrator",
        updated: "11 Oct 2026",
      },
      {
        id: `${entity.slice(0, 3).toUpperCase()}-002`,
        name:
          entity === "Seasons"
            ? "2025 legacy reference"
            : entity === "Teams"
              ? "Port City FC Men"
              : entity === "Competitions"
                ? "USL League Two"
                : entity === "Venues"
                  ? "UNCW Soccer Stadium"
                  : entity === "Fixtures"
                    ? "PCFC Men vs Wake FC"
                    : entity === "Users"
                      ? "Jordan Bell · Commercial"
                      : `${entity} secondary record`,
        status: entity === "Risks" ? "Open" : "Active",
        owner: entityIndex % 3 ? "Analyst" : "Administrator",
        updated: "10 Oct 2026",
      },
    ],
  ]),
);

const templates: Record<ImportKind, string> = {
  fixtures:
    "externalId,date,program,opponent,venue,capacity\nFIX-009,2026-07-18T19:00:00Z,Women,Charlotte Eagles,Legion Stadium,6000\nFIX-009,invalid-date,Women,Duplicate row,Legion Stadium,6000",
  attendance:
    "fixtureExternalId,paid,complimentary,returning\nFIX-009,1480,120,690\nFIX-010,-4,20,5",
  revenue:
    "fixtureExternalId,category,amount\nFIX-009,Ticket revenue,28120\nFIX-010,Concessions,=SUM(A1:A2)",
};

function parseCsv(text: string) {
  const [headerLine, ...lines] = text.trim().split(/\r?\n/);
  const headers = (headerLine ?? "").split(",").map((header) => header.trim());
  return lines
    .filter(Boolean)
    .map((line) =>
      Object.fromEntries(line.split(",").map((value, index) => [headers[index], value.trim()])),
    );
}

export default function OperationsPage() {
  const [active, setActive] = useState<string>("Fixtures");
  const [records, setRecords] = useState(initialRecords);
  const [draft, setDraft] = useState<RecordRow>({
    id: "",
    name: "",
    status: "Active",
    owner: "Administrator",
    updated: "11 Oct 2026",
  });
  const [editId, setEditId] = useState<string | null>(null);
  const [importKind, setImportKind] = useState<ImportKind>("fixtures");
  const [csv, setCsv] = useState(templates.fixtures);
  const [previewed, setPreviewed] = useState(false);
  const [committed, setCommitted] = useState(0);
  const parsedRows = useMemo(() => parseCsv(csv), [csv]);
  const preview = useMemo(() => validateRows(importKind, parsedRows), [importKind, parsedRows]);

  const save = () => {
    if (!draft.name.trim()) return;
    const next = {
      ...draft,
      id:
        editId ??
        `${active.slice(0, 3).toUpperCase()}-${String((records[active]?.length ?? 0) + 1).padStart(3, "0")}`,
    };
    setRecords((current) => ({
      ...current,
      [active]: editId
        ? current[active]!.map((item) => (item.id === editId ? next : item))
        : [...current[active]!, next],
    }));
    setDraft({
      id: "",
      name: "",
      status: "Active",
      owner: "Administrator",
      updated: "11 Oct 2026",
    });
    setEditId(null);
  };
  const edit = (row: RecordRow) => {
    setEditId(row.id);
    setDraft({ ...row });
  };
  const remove = (id: string) =>
    setRecords((current) => ({
      ...current,
      [active]: current[active]!.filter((item) => item.id !== id),
    }));
  const downloadTemplate = () => {
    const url = URL.createObjectURL(new Blob([templates[importKind]], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${importKind}-template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const commit = () => {
    const count = preview.filter((row) => row.valid).length;
    setCommitted(count);
    setPreviewed(false);
  };

  return (
    <>
      <PageHeader
        eyebrow="Administrative data management"
        title="Operate the hub without replacing core systems."
        description="Maintain master data, enter records manually, preview validated CSV imports, block duplicates, and preserve a traceable audit history."
        actions={<Status tone="success">Administrator access</Status>}
      />
      <div className="callout">
        <ShieldCheck size={18} />
        <div>
          <strong>Public role-coverage directory</strong>
          <p>
            The public repository contains roles and coverage status only. Names, phone numbers,
            email addresses and private roster notes were excluded before the repository was
            created.
          </p>
        </div>
      </div>
      <div className="grid-3 section-gap">
        <Card className="padded span-2">
          <CardHeader
            title="Operating role coverage"
            description={`${staffRoles.length} generalized covered roles`}
            action={<Status tone="success">Sanitized</Status>}
          />
          <DataTable
            caption="Public operating role coverage"
            headers={["Role", "Coverage", "Public treatment"]}
            rows={staffRoles.map((item) => [
              item.role,
              <strong key="coverage">{item.coverage}</strong>,
              item.publicTreatment,
            ])}
          />
        </Card>
        <div style={{ display: "grid", gap: 16 }}>
          <Card className="padded">
            <CardHeader
              title="Matchday supply baseline"
              description="Synthetic home and away requirements"
            />
            <DataTable
              caption="Matchday supply baseline"
              headers={["Scope", "Item", "Qty"]}
              rows={matchdayNeeds.map((need) => [
                <Status key="scope" tone={need.scope === "Home" ? "info" : "neutral"}>
                  {need.scope}
                </Status>,
                need.item,
                need.quantity ?? "Confirm",
              ])}
            />
          </Card>
          <Card className="padded radar-panel">
            <CardHeader
              title="Open staffing records"
              description="Roles listed without an assigned name"
            />
            <ul className="metric-list">
              {openStaffRoles.map((role) => (
                <li className="metric-row" key={role}>
                  <span>{role}</span>
                  <Status tone="warning">Unassigned</Status>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
      <Card className="padded">
        <CardHeader
          title="Data domains"
          description="Every required administrative workflow is available from one governed workspace."
        />
        <div className="operations-tabs" role="tablist" aria-label="Data domains">
          {entities.map((entity) => (
            <button
              key={entity}
              role="tab"
              aria-selected={active === entity}
              className={`operations-tab ${active === entity ? "active" : ""}`}
              onClick={() => {
                setActive(entity);
                setEditId(null);
                setDraft({
                  id: "",
                  name: "",
                  status: "Active",
                  owner: "Administrator",
                  updated: "11 Oct 2026",
                });
              }}
            >
              {entity}
            </button>
          ))}
        </div>
      </Card>
      <div className="grid-3 section-gap">
        <Card className="padded span-2">
          <CardHeader
            title={active}
            description={`${records[active]?.length ?? 0} records · historical seasons are retained, never overwritten`}
            action={
              <button
                className="button button-secondary button-small"
                onClick={() =>
                  setDraft({
                    id: "",
                    name: "",
                    status: "Active",
                    owner: "Administrator",
                    updated: "11 Oct 2026",
                  })
                }
              >
                <Plus size={13} /> Add record
              </button>
            }
          />
          <DataTable
            caption={`${active} records`}
            headers={["ID", "Name", "Status", "Owner", "Updated", "Actions"]}
            rows={(records[active] ?? []).map((row) => [
              <strong key="id">{row.id}</strong>,
              row.name,
              <Status key="status" tone={row.status === "Active" ? "success" : "warning"}>
                {row.status}
              </Status>,
              row.owner,
              row.updated,
              <span key="actions" style={{ display: "flex", gap: 4 }}>
                <button
                  className="icon-button"
                  aria-label={`Edit ${row.name}`}
                  onClick={() => edit(row)}
                >
                  <Pencil size={14} />
                </button>
                <button
                  className="icon-button"
                  aria-label={`Delete ${row.name}`}
                  onClick={() => remove(row.id)}
                >
                  <Trash2 size={14} />
                </button>
              </span>,
            ])}
          />
        </Card>
        <Card className="padded">
          <CardHeader
            title={editId ? "Edit record" : "Create record"}
            description="Validated changes create an audit event."
          />
          <div className="form-grid" style={{ gridTemplateColumns: "1fr" }}>
            <label className="field">
              <span>Display name</span>
              <input
                value={draft.name}
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                placeholder={`${active} name`}
              />
            </label>
            <label className="field">
              <span>Status</span>
              <select
                value={draft.status}
                onChange={(event) => setDraft({ ...draft, status: event.target.value })}
              >
                <option>Active</option>
                <option>Draft</option>
                <option>Archived</option>
                <option>Open</option>
                <option>Resolved</option>
              </select>
            </label>
            <label className="field">
              <span>Record owner</span>
              <select
                value={draft.owner}
                onChange={(event) => setDraft({ ...draft, owner: event.target.value })}
              >
                <option>Administrator</option>
                <option>Operations</option>
                <option>Analyst</option>
                <option>Commercial</option>
                <option>Marketing</option>
              </select>
            </label>
            <button className="button button-primary" onClick={save} disabled={!draft.name.trim()}>
              <Save size={14} /> {editId ? "Save changes" : "Create record"}
            </button>
          </div>
        </Card>
      </div>
      <Card className="padded">
        <CardHeader
          title="Validated CSV import"
          description="Files are restricted to CSV, capped at 2 MB, parsed as data, and committed only after row-level preview."
          action={
            <button className="button button-secondary button-small" onClick={downloadTemplate}>
              <Download size={13} /> CSV template
            </button>
          }
        />
        {committed > 0 && (
          <div className="callout" style={{ marginBottom: 14 }}>
            <ClipboardCheck size={18} />
            <div>
              <strong>{committed} records committed safely</strong>
              <p>
                The import batch and actor were added to audit history. Invalid or duplicate rows
                were excluded.
              </p>
            </div>
          </div>
        )}
        <div className="grid-3">
          <label className="field">
            <span>Import type</span>
            <select
              value={importKind}
              onChange={(event) => {
                const next = event.target.value as ImportKind;
                setImportKind(next);
                setCsv(templates[next]);
                setPreviewed(false);
              }}
            >
              <option value="fixtures">Fixtures</option>
              <option value="attendance">Attendance</option>
              <option value="revenue">Revenue</option>
            </select>
            <small>Supported pilot templates use stable external IDs.</small>
          </label>
          <label className="field span-2">
            <span>CSV content · pilot preview</span>
            <textarea
              value={csv}
              onChange={(event) => {
                setCsv(event.target.value);
                setPreviewed(false);
              }}
              aria-label="CSV import content"
            />
          </label>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 15 }}>
          <button className="button button-secondary" onClick={() => setPreviewed(true)}>
            <FileUp size={14} /> Preview {parsedRows.length} rows
          </button>
          {previewed && (
            <button
              className="button button-primary"
              onClick={commit}
              disabled={!preview.some((row) => row.valid)}
            >
              Commit {preview.filter((row) => row.valid).length} valid rows
            </button>
          )}
        </div>
        {previewed && (
          <DataTable
            caption="CSV validation preview"
            headers={["Row", "Status", "Identity", "Validation result"]}
            rows={preview.map((row) => [
              row.row,
              <Status key="status" tone={row.valid ? "success" : "danger"}>
                {row.valid ? "Valid" : "Blocked"}
              </Status>,
              String(
                (row.data as Record<string, unknown>).externalId ??
                  (row.data as Record<string, unknown>).fixtureExternalId ??
                  "—",
              ),
              row.errors.length ? row.errors.join("; ") : "Ready to commit",
            ])}
          />
        )}
      </Card>
      <div className="callout section-gap">
        <ClipboardCheck size={18} />
        <div>
          <strong>Integration boundary</strong>
          <p>
            CSV and manual entry make this pilot independent. Ticketing, accounting, website
            analytics, email, payments, and social platforms remain systems of record until
            separately authorized and tested integrations are configured.
          </p>
        </div>
      </div>
    </>
  );
}
