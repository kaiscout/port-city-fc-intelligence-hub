"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  clubDomains,
  type ClubEntity,
  type ClubRecord,
  type FieldSpec,
  type RecordCommand,
} from "@/lib/club";
import { permissionForEntity } from "@/lib/auth/policies";
import { hasPermission } from "@/lib/rbac";
import { importHeaders } from "@/lib/imports";
import { toCsv } from "@/lib/csv";
import { useHubData } from "./data-context";
import { Card, CardHeader, DataTable, EmptyState, PageHeader, Status } from "./ui";
import { downloadText } from "./club-workspace";
export async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    cache: "no-store",
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error ?? "The server did not confirm this request");
  return body as T;
}
function emptyDraft(entity: ClubEntity): RecordCommand {
  return {
    externalId: "",
    name: "",
    status: "DRAFT",
    payload: {
      evidence: "User-entered operational data",
      sourceRef: "",
      referenceDate: "",
      ...Object.fromEntries(
        (clubDomains[entity].fields as FieldSpec[]).map((f) => [f.key, f.options?.[0] ?? ""]),
      ),
    },
  };
}
type Preview = {
  batchId: string;
  version: number;
  rows: { row: number; valid: boolean; externalId: string; errors: string[] }[];
  valid: number;
  invalid: number;
};
type Batch = {
  id: string;
  kind: string;
  sourceFilename: string;
  rowCount: number;
  acceptedCount: number;
  status: string;
  createdAt: string;
};
export function OperationsWorkspace() {
  const { workspace: loaded, refreshWorkspace } = useHubData();
  const workspace = loaded!;
  const domains = (Object.keys(clubDomains) as ClubEntity[]).filter((e) =>
    hasPermission(workspace.user.role, permissionForEntity(e, "read")),
  );
  const [entity, setEntity] = useState<ClubEntity>(domains[0] ?? "seasons");
  const [draft, setDraft] = useState<RecordCommand>(() => emptyDraft(domains[0] ?? "seasons"));
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("name");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [csv, setCsv] = useState("");
  const [filename, setFilename] = useState("manual.csv");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [history, setHistory] = useState<Batch[]>([]);
  const canWrite = hasPermission(workspace.user.role, permissionForEntity(entity, "write"));
  const canImport = canWrite && hasPermission(workspace.user.role, "imports:write");
  const rows = useMemo(
    () =>
      workspace.records
        .filter(
          (r) =>
            r.entityType === entity &&
            `${r.externalId} ${r.name} ${r.status}`.toLowerCase().includes(query.toLowerCase()),
        )
        .sort((a, b) =>
          sort === "updated"
            ? b.updatedAt.localeCompare(a.updatedAt)
            : a.name.localeCompare(b.name),
        ),
    [workspace.records, entity, query, sort],
  );
  const loadHistory = useCallback(async () => {
    if (!hasPermission(workspace.user.role, "imports:write")) return;
    try {
      setHistory((await requestJson<{ data: Batch[] }>("/api/imports")).data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load import history");
    }
  }, [workspace.user.role]);
  useEffect(() => {
    const timer = setTimeout(() => void loadHistory(), 0);
    return () => clearTimeout(timer);
  }, [loadHistory]);
  const run = async (work: () => Promise<void>) => {
    setPending(true);
    setMessage("");
    setError("");
    try {
      await work();
    } catch (e) {
      setError(e instanceof Error ? e.message : "The server did not confirm this change");
    } finally {
      setPending(false);
    }
  };
  const updatePayload = (key: string, value: string) =>
    setDraft((current) => ({ ...current, payload: { ...current.payload, [key]: value } }));
  const save = () =>
    run(async () => {
      const result = await requestJson<{ data: ClubRecord }>(`/api/admin/entities/${entity}`, {
        method: draft.id ? "PATCH" : "POST",
        body: JSON.stringify(draft),
      });
      setDraft(result.data);
      await refreshWorkspace();
      setMessage(
        `Saved ${result.data.externalId}, version ${result.data.version}. Record and audit event committed together.`,
      );
    });
  return (
    <>
      <PageHeader
        eyebrow="Private operations studio"
        title="Operations Studio"
        description="Configure → enter or import → review → approve → reconcile. No screen-only saves and no sample records in a clean organization."
        actions={
          <button className="button button-secondary" onClick={() => void refreshWorkspace()}>
            Refresh records
          </button>
        }
      />
      <p className="callout">
        Start with Seasons, Programs, Competitions and Venues. Approve configuration before
        approving dependent fixtures. Enter one attendance count per fixture and individually
        identified receipt/cost records. Approval records your source review, not independent
        certification.
      </p>
      {error && (
        <p className="callout" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="callout" role="status">
          {message}
        </p>
      )}
      <Card className="padded">
        <CardHeader
          title="Operational Domains"
          description="Only domains available to your role are shown."
        />
        <div className="operations-tabs" role="tablist" aria-label="Operational domains">
          {domains.map((e) => (
            <button
              type="button"
              key={e}
              role="tab"
              aria-selected={entity === e}
              className={`operations-tab ${entity === e ? "active" : ""}`}
              onClick={() => {
                setEntity(e);
                setDraft(emptyDraft(e));
                setQuery("");
                setPreview(null);
                setCsv("");
                setMessage("");
                setError("");
              }}
              disabled={pending}
            >
              {clubDomains[e].label}
            </button>
          ))}
        </div>
      </Card>
      <div className="grid-3 section-gap">
        <Card className="padded span-2">
          <CardHeader
            title={clubDomains[entity].label}
            description={clubDomains[entity].description}
            action={
              canWrite ? (
                <button
                  className="button button-secondary"
                  onClick={() => setDraft(emptyDraft(entity))}
                >
                  New record
                </button>
              ) : (
                <Status tone="neutral">Read only</Status>
              )
            }
          />
          <div className="club-toolbar">
            <label>
              Search records
              <input
                aria-label="Search domain records"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <label>
              Sort
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="name">Name A–Z</option>
                <option value="updated">Recently updated</option>
              </select>
            </label>
            <button
              className="button button-secondary"
              onClick={() =>
                downloadText(
                  `pcfc-${entity}-visible.csv`,
                  toCsv(
                    rows.map((r) => ({
                      externalId: r.externalId,
                      name: r.name,
                      status: r.status,
                      version: r.version,
                      ...r.payload,
                      exportDomain: entity,
                      exportSearch: query,
                      exportedAt: new Date().toISOString(),
                    })),
                  ),
                )
              }
              disabled={!rows.length || !hasPermission(workspace.user.role, "reports:export")}
            >
              Export visible records
            </button>
          </div>
          {rows.length ? (
            <DataTable
              caption={`${clubDomains[entity].label} records`}
              headers={["ID / name", "Approval", "Reference date", "Version", "Action"]}
              rows={rows.map((r) => [
                <span key="name">
                  <strong>{r.name}</strong>
                  <br />
                  {r.externalId}
                </span>,
                <Status key="status" tone={r.status === "APPROVED" ? "success" : "neutral"}>
                  {r.status}
                </Status>,
                String(r.payload.referenceDate ?? "Unavailable"),
                r.version,
                <button
                  key="edit"
                  className="button button-ghost"
                  onClick={() => setDraft({ ...r, payload: { ...r.payload } })}
                >
                  {canWrite ? "Edit / review" : "Inspect"} {r.externalId}
                </button>,
              ])}
            />
          ) : (
            <EmptyState
              title="No Records in This Selection"
              detail="A clean organization starts empty. Create a source-backed record or import a supported CSV."
            />
          )}
        </Card>
        <Card className="padded">
          <CardHeader
            title={draft.id ? `Record version ${draft.version}` : "New source-backed record"}
            description="Drafts are excluded from analytical totals. Saves use optimistic version checks."
          />
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void save();
            }}
            className="form-grid club-record-form"
          >
            <label className="field">
              Stable external ID
              <input
                aria-label="Stable external ID"
                value={draft.externalId}
                disabled={Boolean(draft.id) || !canWrite || pending}
                onChange={(e) => setDraft({ ...draft, externalId: e.target.value })}
                required
              />
            </label>
            <label className="field">
              Display name
              <input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                disabled={!canWrite || pending}
                required
              />
            </label>
            <label className="field">
              Approval state
              <select
                value={draft.status}
                onChange={(e) =>
                  setDraft({ ...draft, status: e.target.value as RecordCommand["status"] })
                }
                disabled={!canWrite || pending}
              >
                <option>DRAFT</option>
                <option>APPROVED</option>
                {draft.id && <option>ARCHIVED</option>}
              </select>
            </label>
            {(clubDomains[entity].fields as FieldSpec[]).map((field) => (
              <label className="field" key={field.key}>
                {field.label}
                {field.optional ? " (optional)" : ""}
                {field.reference ? (
                  <select
                    value={String(draft.payload[field.key] ?? "")}
                    onChange={(e) => updatePayload(field.key, e.target.value)}
                    disabled={!canWrite || pending}
                    required
                  >
                    <option value="">Select approved record…</option>
                    {workspace.records
                      .filter((r) => r.entityType === field.reference && r.status === "APPROVED")
                      .map((r) => (
                        <option key={r.id} value={r.externalId}>
                          {r.externalId} · {r.name}
                        </option>
                      ))}
                  </select>
                ) : field.options ? (
                  <select
                    value={String(draft.payload[field.key] ?? "")}
                    onChange={(e) => updatePayload(field.key, e.target.value)}
                    disabled={!canWrite || pending}
                  >
                    {field.options.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type ?? "text"}
                    step={field.type === "number" ? "any" : undefined}
                    value={String(draft.payload[field.key] ?? "")}
                    onChange={(e) => updatePayload(field.key, e.target.value)}
                    required={!field.optional}
                    disabled={!canWrite || pending}
                  />
                )}{" "}
                {field.help && <small>{field.help}</small>}
              </label>
            ))}
            <label className="field">
              Evidence class
              <select
                value={String(draft.payload.evidence)}
                onChange={(e) => updatePayload("evidence", e.target.value)}
                disabled={!canWrite || pending}
              >
                <option>User-entered operational data</option>
                <option>Documented assumption</option>
                <option>Synthetic demonstration data</option>
              </select>
            </label>
            <label className="field">
              Source reference
              <input
                value={String(draft.payload.sourceRef ?? "")}
                onChange={(e) => updatePayload("sourceRef", e.target.value)}
                placeholder="Internal source or approval reference"
                required
                disabled={!canWrite || pending}
              />
            </label>
            <label className="field">
              Data reference date
              <input
                type="date"
                value={String(draft.payload.referenceDate ?? "")}
                onChange={(e) => updatePayload("referenceDate", e.target.value)}
                required
                disabled={!canWrite || pending}
              />
            </label>
            <button className="button button-primary" type="submit" disabled={!canWrite || pending}>
              {pending ? "Waiting for server…" : draft.id ? "Save record version" : "Create record"}
            </button>
            <button
              className="button button-ghost"
              type="button"
              onClick={() => {
                const saved = workspace.records.find((r) => r.id === draft.id);
                setDraft(saved ? { ...saved, payload: { ...saved.payload } } : emptyDraft(entity));
              }}
            >
              Reset unsaved changes
            </button>
          </form>
        </Card>
      </div>
      {canImport && (
        <Card className="padded section-gap">
          <CardHeader
            title={`Import ${clubDomains[entity].label.toLowerCase()}`}
            description="Explicit template schema · quoted fields supported · 2 MB / 10,000 rows · atomic commit."
            action={
              <button
                className="button button-secondary"
                onClick={() =>
                  downloadText(
                    `pcfc-${entity}-template.csv`,
                    importHeaders(entity).join(",") + "\r\n",
                  )
                }
              >
                Download CSV template
              </button>
            }
          />
          <p>
            Use stable external IDs and existing approved reference records. Source reference, data
            date and evidence class are mandatory. For corrections, edit the existing record instead
            of importing it again. Empty numeric cells mean unknown, not zero.
          </p>
          <label className="field">
            CSV file
            <input
              type="file"
              accept=".csv,text/csv"
              disabled={pending}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 2 * 1024 * 1024 || !file.name.toLowerCase().endsWith(".csv")) {
                  setError("Choose a CSV file no larger than 2 MB");
                  return;
                }
                void file.text().then((text) => {
                  setCsv(text);
                  setFilename(file.name);
                  setPreview(null);
                });
              }}
            />
          </label>
          <label className="field">
            CSV content
            <textarea
              aria-label="CSV import content"
              value={csv}
              onChange={(e) => {
                setCsv(e.target.value);
                setPreview(null);
              }}
              disabled={pending}
            />
          </label>
          <div className="club-toolbar">
            <button
              className="button button-secondary"
              disabled={pending || !csv.trim()}
              onClick={() =>
                void run(async () => {
                  setPreview(
                    await requestJson<Preview>("/api/imports/preview", {
                      method: "POST",
                      body: JSON.stringify({ kind: entity, csv, filename }),
                    }),
                  );
                  await loadHistory();
                  setMessage("Preview recorded. No operational records have been imported.");
                })
              }
            >
              Validate & preview
            </button>
            {preview && (
              <button
                className="button button-primary"
                disabled={pending || preview.invalid > 0 || preview.valid === 0}
                onClick={() =>
                  void run(async () => {
                    const result = await requestJson<{
                      accepted: number;
                      alreadyCommitted: boolean;
                    }>("/api/imports/commit", {
                      method: "POST",
                      body: JSON.stringify({ batchId: preview.batchId, version: preview.version }),
                    });
                    await refreshWorkspace();
                    await loadHistory();
                    setPreview(null);
                    setMessage(
                      `${result.accepted} records durably committed with import history and audit evidence${result.alreadyCommitted ? " (already completed; not repeated)" : ""}.`,
                    );
                  })
                }
              >
                Commit all {preview.valid} rows
              </button>
            )}
          </div>
          {preview && (
            <>
              <p>
                {preview.valid} valid · {preview.invalid} blocked. Any blocked row prevents the
                entire batch.
              </p>
              <DataTable
                caption="Server-validated CSV preview"
                headers={["CSV row", "External ID", "Validation", "Errors"]}
                rows={preview.rows.map((r) => [
                  r.row,
                  r.externalId,
                  r.valid ? "Valid" : "Blocked",
                  r.errors.join("; ") || "Ready for commit-time revalidation",
                ])}
              />
            </>
          )}
        </Card>
      )}
      {hasPermission(workspace.user.role, "imports:write") && (
        <Card className="padded section-gap">
          <CardHeader
            title="Persisted Import History"
            description="Previewed, invalid and committed batches are retained. Refresh reads the database."
            action={
              <button className="button button-secondary" onClick={() => void loadHistory()}>
                Refresh import history
              </button>
            }
          />
          <DataTable
            caption="Import history"
            headers={["Created", "File", "Domain", "Rows", "Accepted", "State"]}
            rows={history.map((b) => [
              new Date(b.createdAt).toLocaleString(),
              b.sourceFilename,
              b.kind,
              b.rowCount,
              b.acceptedCount,
              b.status,
            ])}
          />
        </Card>
      )}
    </>
  );
}
