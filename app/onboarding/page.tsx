"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, ShieldCheck } from "lucide-react";
import { Card, Status } from "@/components/ui";

const labels = ["Organization", "Programs & venues", "Targets & categories", "Review"];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    organization: "Port City FC · Pilot organization",
    season: "2026",
    men: true,
    women: true,
    venue: "Legion Stadium",
    capacity: "6000",
    marginTarget: "18",
    retentionTarget: "50",
    sponsorTarget: "90",
    mode: "Demonstration",
  });
  const update = (key: keyof typeof form, value: string | boolean) =>
    setForm((current) => ({ ...current, [key]: value }));
  const complete = () => {
    window.localStorage.setItem(
      "pcfc-onboarding",
      JSON.stringify({ ...form, completedAt: new Date().toISOString() }),
    );
    router.push("/dashboard");
  };

  return (
    <main className="onboarding-shell">
      <Card className="onboarding-card">
        <header className="onboarding-head">
          <Status tone="info">
            <ShieldCheck size={12} /> First-run setup
          </Status>
          <h1 style={{ marginTop: 17 }}>Configure the decision layer.</h1>
          <p>
            Four deliberate steps create a clean organization. Demonstration data is optional and
            never required.
          </p>
        </header>
        <div className="stepper">
          {labels.map((label, index) => (
            <div key={label} className={`step ${index <= step ? "active" : ""}`}>
              {index + 1}. {label}
            </div>
          ))}
        </div>
        <section className="onboarding-body">
          {step === 0 && (
            <div className="form-grid">
              <label className="field field-full">
                <span>Organization name</span>
                <input
                  value={form.organization}
                  onChange={(event) => update("organization", event.target.value)}
                />
              </label>
              <label className="field">
                <span>Initial season</span>
                <input
                  value={form.season}
                  onChange={(event) => update("season", event.target.value)}
                />
              </label>
              <label className="field">
                <span>Data mode</span>
                <select value={form.mode} onChange={(event) => update("mode", event.target.value)}>
                  <option>Demonstration</option>
                  <option>Production data</option>
                </select>
                <small>Production data creates no synthetic records or default password.</small>
              </label>
            </div>
          )}
          {step === 1 && (
            <div className="form-grid">
              <label className="field">
                <span>Men’s program</span>
                <select
                  value={form.men ? "Enabled" : "Disabled"}
                  onChange={(event) => update("men", event.target.value === "Enabled")}
                >
                  <option>Enabled</option>
                  <option>Disabled</option>
                </select>
              </label>
              <label className="field">
                <span>Women’s program</span>
                <select
                  value={form.women ? "Enabled" : "Disabled"}
                  onChange={(event) => update("women", event.target.value === "Enabled")}
                >
                  <option>Enabled</option>
                  <option>Disabled</option>
                </select>
              </label>
              <label className="field">
                <span>Primary venue</span>
                <input
                  value={form.venue}
                  onChange={(event) => update("venue", event.target.value)}
                />
              </label>
              <label className="field">
                <span>Venue capacity</span>
                <input
                  type="number"
                  value={form.capacity}
                  onChange={(event) => update("capacity", event.target.value)}
                />
              </label>
            </div>
          )}
          {step === 2 && (
            <div className="form-grid">
              <label className="field">
                <span>Operating margin target (%)</span>
                <input
                  type="number"
                  value={form.marginTarget}
                  onChange={(event) => update("marginTarget", event.target.value)}
                />
              </label>
              <label className="field">
                <span>Returning supporter target (%)</span>
                <input
                  type="number"
                  value={form.retentionTarget}
                  onChange={(event) => update("retentionTarget", event.target.value)}
                />
              </label>
              <label className="field">
                <span>Sponsor fulfillment target (%)</span>
                <input
                  type="number"
                  value={form.sponsorTarget}
                  onChange={(event) => update("sponsorTarget", event.target.value)}
                />
              </label>
              <div className="callout field-full">
                <p>
                  Default catalogs will include adult, youth, group and complimentary tickets;
                  ticket, concession, merchandise and sponsor revenue; and venue, staffing,
                  security, travel and officials costs. All are editable.
                </p>
              </div>
            </div>
          )}
          {step === 3 && (
            <div>
              <h2 style={{ marginTop: 0 }}>Ready to create {form.organization}</h2>
              <div className="metric-list">
                <div className="metric-row">
                  <span>Season</span>
                  <strong>{form.season}</strong>
                </div>
                <div className="metric-row">
                  <span>Programs</span>
                  <strong>
                    {[form.men && "Men", form.women && "Women"].filter(Boolean).join(" + ")}
                  </strong>
                </div>
                <div className="metric-row">
                  <span>Primary venue</span>
                  <strong>
                    {form.venue} · {form.capacity}
                  </strong>
                </div>
                <div className="metric-row">
                  <span>Targets</span>
                  <strong>
                    {form.marginTarget}% margin · {form.retentionTarget}% return ·{" "}
                    {form.sponsorTarget}% fulfillment
                  </strong>
                </div>
                <div className="metric-row">
                  <span>Mode</span>
                  <strong>{form.mode}</strong>
                </div>
              </div>
              <div className="callout section-gap">
                <Check size={18} />
                <p>
                  The administrator account performing setup will be recorded as the configuration
                  owner. Production mode creates a clean organization with no seeded synthetic
                  records.
                </p>
              </div>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginTop: 28 }}>
            <button
              className="button button-secondary"
              disabled={step === 0}
              onClick={() => setStep((value) => value - 1)}
            >
              <ArrowLeft size={14} /> Back
            </button>
            {step < labels.length - 1 ? (
              <button
                className="button button-primary"
                onClick={() => setStep((value) => value + 1)}
              >
                Continue <ArrowRight size={14} />
              </button>
            ) : (
              <button className="button button-primary" onClick={complete}>
                <Check size={14} /> Complete setup
              </button>
            )}
          </div>
        </section>
      </Card>
    </main>
  );
}
