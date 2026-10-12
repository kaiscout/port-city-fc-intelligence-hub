"use client";

import { useState } from "react";
import { Check, Plus, RotateCcw, Save, ShieldCheck } from "lucide-react";
import { Card, CardHeader, DataTable, PageHeader, Status } from "@/components/ui";
import { auditEvents } from "@/lib/data/demo";
import { permissions } from "@/lib/rbac";

const users = [
  ["Alex Morgan", "alex@example.test", "Administrator", "Active", "11 Oct 2026"],
  ["Dana Foster", "dana@example.test", "Analyst", "Active", "10 Oct 2026"],
  ["Jordan Bell", "jordan@example.test", "Commercial", "Active", "9 Oct 2026"],
  ["Kai Reed", "kai@example.test", "Marketing", "Active", "8 Oct 2026"],
  ["Sam Ellis", "sam@example.test", "Matchday Operations", "Invited", "Never"],
];

const matrix = [
  ["Dashboards", "✓", "✓", "✓", "✓", "✓", "✓"],
  ["Scenario write", "✓", "—", "✓", "—", "—", "—"],
  ["Sponsor manage", "✓", "—", "—", "✓", "—", "—"],
  ["Funnel manage", "✓", "—", "—", "—", "✓", "—"],
  ["Fixture / attendance", "✓", "—", "—", "—", "—", "✓"],
  ["User / settings", "✓", "—", "—", "—", "—", "—"],
  ["Reports export", "✓", "✓", "✓", "✓", "—", "—"],
];

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [mode, setMode] = useState("Demonstration");
  const save = () => {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2400);
  };
  return (
    <>
      <PageHeader
        eyebrow="Settings, users & audit"
        title="Govern the operating model."
        description="Configure targets and categories, provision role-based access, switch data modes deliberately, and inspect important changes."
        actions={
          <button className="button button-primary" onClick={save}>
            <Save size={15} /> Save configuration
          </button>
        }
      />
      {saved && (
        <div className="callout" style={{ marginBottom: 16 }}>
          <Check size={18} />
          <div>
            <strong>Configuration saved</strong>
            <p>An audit event was recorded with the actor, changed fields, and timestamp.</p>
          </div>
        </div>
      )}
      <div className="grid-3">
        <Card className="padded span-2">
          <CardHeader
            title="Organization & calculation settings"
            description="Controlled assumptions apply prospectively; historical calculations retain their recorded version."
          />
          <div className="form-grid">
            <label className="field">
              <span>Organization name</span>
              <input defaultValue="Port City FC · Pilot organization" />
            </label>
            <label className="field">
              <span>Operating mode</span>
              <select value={mode} onChange={(event) => setMode(event.target.value)}>
                <option>Demonstration</option>
                <option>Production data</option>
              </select>
              <small>Production mode hides synthetic seeded records.</small>
            </label>
            <label className="field">
              <span>Active season</span>
              <select defaultValue="2026">
                <option>2026</option>
                <option>2025</option>
              </select>
            </label>
            <label className="field">
              <span>Margin target</span>
              <input type="number" defaultValue="18" />
              <small>Percent of total matchday revenue.</small>
            </label>
            <label className="field">
              <span>Returning supporter target</span>
              <input type="number" defaultValue="50" />
            </label>
            <label className="field">
              <span>Sponsor fulfillment target</span>
              <input type="number" defaultValue="90" />
            </label>
            <label className="field">
              <span>Per-attendee variable cost</span>
              <input type="number" step=".1" defaultValue="2.40" />
            </label>
            <label className="field">
              <span>Default community allocation</span>
              <input type="number" step=".5" defaultValue="4" />
            </label>
            <label className="field">
              <span>Import file limit (MB)</span>
              <input type="number" defaultValue="2" min="1" max="10" />
            </label>
          </div>
        </Card>
        <Card className="padded radar-panel">
          <CardHeader
            title="Configuration catalogs"
            description="Locally governed operational categories"
          />
          <div className="metric-list">
            {[
              ["Ticket categories", "Adult, youth, group, complimentary"],
              ["Revenue categories", "Ticket, concession, merchandise, sponsor"],
              ["Cost categories", "Venue, staffing, security, travel, officials"],
              ["Sponsor packages", "Founding, principal, community, matchday"],
              ["Contribution rules", "Ticket-linked %, fixed event allocation"],
            ].map(([name, detail]) => (
              <div key={name} style={{ padding: "11px 0", borderBottom: "1px solid #edf3f7" }}>
                <strong style={{ display: "block", fontSize: 11 }}>{name}</strong>
                <span style={{ color: "#637283", fontSize: 9 }}>{detail}</span>
              </div>
            ))}
          </div>
          <button className="button button-secondary section-gap">
            <Plus size={13} /> Manage catalogs
          </button>
        </Card>
      </div>
      <Card className="padded">
        <CardHeader
          title="User management"
          description="Accounts are administrator-provisioned. Production mode never creates a default password."
          action={
            <button className="button button-secondary button-small">
              <Plus size={13} /> Provision user
            </button>
          }
        />
        <DataTable
          caption="User accounts"
          headers={["Name", "Email", "Role", "Status", "Last sign-in", "Action"]}
          rows={users.map((user) => [
            <strong key="name">{user[0]}</strong>,
            user[1],
            user[2],
            <Status key="status" tone={user[3] === "Active" ? "success" : "warning"}>
              {user[3]}
            </Status>,
            user[4],
            <button key="action" className="button button-ghost button-small">
              Manage
            </button>,
          ])}
        />
      </Card>
      <Card className="padded section-gap">
        <CardHeader
          title="Permission matrix"
          description="The interface hides unauthorized controls; server handlers independently enforce the same permissions."
          action={
            <Status tone="success">
              <ShieldCheck size={12} /> Server enforced
            </Status>
          }
        />
        <DataTable
          caption="Role permission matrix"
          headers={[
            "Capability",
            "Administrator",
            "Executive",
            "Analyst",
            "Commercial",
            "Marketing",
            "Matchday Ops",
          ]}
          rows={matrix.map((row) =>
            row.map((cell, index) => (index === 0 ? <strong key={index}>{cell}</strong> : cell)),
          )}
        />
        <p className="chart-summary">
          Canonical role grants:{" "}
          {Object.entries(permissions)
            .map(([role, grants]) => `${role.toLowerCase()}: ${grants.join(", ")}`)
            .join(" · ")}
        </p>
      </Card>
      <Card className="padded section-gap">
        <CardHeader
          title="Audit history"
          description="Append-only evidence for imports, access, configuration, scenarios, and commercial delivery."
          action={
            <button className="button button-ghost button-small">
              <RotateCcw size={13} /> Refresh
            </button>
          }
        />
        <DataTable
          caption="Audit events"
          headers={["Timestamp", "Actor", "Action", "Object", "Result"]}
          rows={auditEvents.map((event) => [
            event.time,
            <strong key="actor">{event.actor}</strong>,
            event.action,
            event.object,
            event.result,
          ])}
        />
      </Card>
    </>
  );
}
