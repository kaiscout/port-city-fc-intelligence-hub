"use client";
import { useCallback, useEffect, useState } from "react";
import { roles } from "@/lib/auth/policies";
import { permissions } from "@/lib/rbac";
import type { Role } from "@/lib/types";
import type { ClubSettings } from "@/lib/settings";
import { useHubData } from "./data-context";
import { requestJson } from "./operations-workspace";
import { Card, CardHeader, DataTable, PageHeader } from "./ui";
type Account = {
  id: string;
  displayName: string;
  email: string;
  role: Role;
  active: boolean;
  version: number;
};
export function SettingsWorkspace() {
  const { workspace: loaded, refreshWorkspace } = useHubData();
  const workspace = loaded!;
  const [settings, setSettings] = useState<ClubSettings | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [user, setUser] = useState({
    displayName: "",
    email: "",
    password: "",
    role: "ANALYST" as Role,
  });
  const load = useCallback(async () => {
    try {
      const [configuration, users] = await Promise.all([
        requestJson<{ data: ClubSettings }>("/api/settings"),
        requestJson<{ data: Account[] }>("/api/users"),
      ]);
      setSettings(configuration.data);
      setAccounts(users.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load settings");
    }
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);
  const run = async (work: () => Promise<void>, success: string) => {
    setPending(true);
    setMessage("");
    setError("");
    try {
      await work();
      await refreshWorkspace();
      setMessage(success);
    } catch (e) {
      setError(e instanceof Error ? e.message : "The server did not confirm this change");
    } finally {
      setPending(false);
    }
  };
  const update = <K extends keyof ClubSettings>(key: K, value: ClubSettings[K]) =>
    setSettings((current) => (current ? { ...current, [key]: value } : null));
  return (
    <>
      <PageHeader
        eyebrow="Private administration"
        title="Settings & Audit"
        description="Configuration and account changes commit with audit events. No business targets or default credentials are supplied."
        actions={
          <button className="button button-secondary" onClick={() => void load()}>
            Reload configuration
          </button>
        }
      />
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
          title="Organization & Reporting Configuration"
          description="Configure approved catalog records in Operations first. Settings do not rewrite historical records or saved scenario assumptions."
        />
        {settings ? (
          <form
            className="form-grid"
            onSubmit={(e) => {
              e.preventDefault();
              void run(async () => {
                setSettings(
                  (
                    await requestJson<{ data: ClubSettings }>("/api/settings", {
                      method: "PATCH",
                      body: JSON.stringify(settings),
                    })
                  ).data,
                );
              }, "Configuration committed and audited.");
            }}
          >
            <label className="field">
              Organization name
              <input
                value={settings.organizationName}
                onChange={(e) => update("organizationName", e.target.value)}
                required
              />
            </label>
            <label className="field">
              Active reporting season
              <select
                value={settings.activeSeasonExternalId ?? ""}
                onChange={(e) => update("activeSeasonExternalId", e.target.value || null)}
              >
                <option value="">Not configured</option>
                {workspace.records
                  .filter((r) => r.entityType === "seasons" && r.status === "APPROVED")
                  .map((s) => (
                    <option key={s.id} value={s.externalId}>
                      {s.name}
                    </option>
                  ))}
              </select>
            </label>
            <label className="field">
              Data owner
              <input
                value={settings.dataOwner}
                onChange={(e) => update("dataOwner", e.target.value)}
              />
            </label>
            <label className="field">
              Reporting reference date
              <input
                type="date"
                value={settings.referenceDate ?? ""}
                onChange={(e) => update("referenceDate", e.target.value || null)}
              />
            </label>
            <label className="field">
              Currency
              <input value={settings.currency} readOnly />
              <small>This release supports USD; no currency conversions are inferred.</small>
            </label>
            <label className="field field-full">
              Reporting scope / exclusions
              <textarea
                value={settings.reportingNote}
                onChange={(e) => update("reportingNote", e.target.value)}
              />
            </label>
            <button className="button button-primary" disabled={pending} type="submit">
              Save configuration
            </button>
            <p>
              Version {settings.version}. Targets and forecasts require separately recorded inputs.
            </p>
          </form>
        ) : (
          <p>Loading saved configuration…</p>
        )}
      </Card>
      <Card className="padded section-gap">
        <CardHeader
          title="User Administration"
          description="Administrator-provisioned accounts. No invitation email is sent; use your agreed secure credential-sharing process."
        />
        <form
          className="form-grid"
          onSubmit={(e) => {
            e.preventDefault();
            void run(async () => {
              await requestJson("/api/users", { method: "POST", body: JSON.stringify(user) });
              setUser({ displayName: "", email: "", password: "", role: "ANALYST" });
              await load();
            }, "Account provisioned and audited. No email was sent.");
          }}
        >
          <label className="field">
            Account display name
            <input
              value={user.displayName}
              onChange={(e) => setUser({ ...user, displayName: e.target.value })}
              required
            />
          </label>
          <label className="field">
            Account email
            <input
              type="email"
              value={user.email}
              onChange={(e) => setUser({ ...user, email: e.target.value })}
              required
              autoComplete="off"
            />
          </label>
          <label className="field">
            Initial password
            <input
              aria-label="Initial password"
              aria-describedby="initial-password-help"
              type="password"
              value={user.password}
              onChange={(e) => setUser({ ...user, password: e.target.value })}
              minLength={12}
              maxLength={256}
              required
              autoComplete="new-password"
            />
            <small id="initial-password-help">
              At least 12 characters. Never stored in audit metadata.
            </small>
          </label>
          <label className="field">
            Account role
            <select
              value={user.role}
              onChange={(e) => setUser({ ...user, role: e.target.value as Role })}
            >
              {roles.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
          <button type="submit" className="button button-primary" disabled={pending}>
            Provision account
          </button>
        </form>
        <DataTable
          caption="Organization user accounts"
          headers={["Account", "Role", "Active", "Version", "Action"]}
          rows={accounts.map((account) => [
            <span key="name">
              <strong>{account.displayName}</strong>
              <br />
              {account.email}
            </span>,
            <select
              key="role"
              aria-label={`Role for ${account.displayName}`}
              value={account.role}
              onChange={(e) =>
                setAccounts((current) =>
                  current.map((a) =>
                    a.id === account.id ? { ...a, role: e.target.value as Role } : a,
                  ),
                )
              }
            >
              {roles.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>,
            <input
              key="active"
              type="checkbox"
              aria-label={`Active ${account.displayName}`}
              checked={account.active}
              onChange={(e) =>
                setAccounts((current) =>
                  current.map((a) =>
                    a.id === account.id ? { ...a, active: e.target.checked } : a,
                  ),
                )
              }
            />,
            account.version,
            <button
              key="save"
              className="button button-secondary"
              disabled={pending}
              onClick={() =>
                void run(async () => {
                  await requestJson("/api/users", {
                    method: "PATCH",
                    body: JSON.stringify({
                      id: account.id,
                      version: account.version,
                      role: account.role,
                      active: account.active,
                    }),
                  });
                  await load();
                }, "Account access committed and prior sessions revoked. The last active administrator is protected.")
              }
            >
              Save access for {account.displayName}
            </button>,
          ])}
        />
      </Card>
      <Card className="padded section-gap">
        <CardHeader
          title="Server Permission Contract"
          description="Source-controlled grants; configuration does not silently change role definitions."
        />
        <DataTable
          caption="Role grants"
          headers={["Role", "Granted capabilities"]}
          rows={Object.entries(permissions).map(([role, grants]) => [role, grants.join(", ")])}
        />
      </Card>
      <Card className="padded section-gap">
        <CardHeader
          title="Audit History"
          description="Newest 100 organization events from PostgreSQL. No illustrative events are inserted."
          action={
            <button className="button button-secondary" onClick={() => void refreshWorkspace()}>
              Refresh audit history
            </button>
          }
        />
        <DataTable
          caption="Organization audit history"
          headers={["Timestamp", "Action", "Domain", "Summary"]}
          rows={workspace.audit.map((a) => [
            new Date(a.createdAt).toLocaleString(),
            a.action,
            a.entityType,
            a.summary,
          ])}
        />
      </Card>
    </>
  );
}
