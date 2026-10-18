"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { Card, Status } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@pcfc-demo.local");
  const [password, setPassword] = useState("PilotDemo!2026");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(body.error ?? "Sign-in failed.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Sign-in is temporarily unavailable.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-shell">
      <section className="auth-visual">
        <div className="auth-brand">
          <Image
            src="/brand/port-city-fc-logo.png"
            alt="Port City FC circular crest"
            width={58}
            height={58}
            priority
          />
          <div>
            <strong>Port City FC</strong>
            <span>Business Intelligence &amp; Analytics</span>
          </div>
        </div>
        <div className="auth-message">
          <p className="eyebrow" style={{ color: "#a5e2f4" }}>
            Operational clarity · commercial confidence
          </p>
          <h1>
            One club.
            <br />
            Better decisions.
          </h1>
          <p>
            Connect matchday economics, supporter momentum, sponsor value, operational readiness,
            and community impact in one governed decision layer.
          </p>
        </div>
        <p className="auth-note">
          Independent portfolio case study · Demonstration data is synthetic
        </p>
      </section>
      <section className="auth-panel">
        <Card className="auth-card">
          <Status tone="info">
            <LockKeyhole size={12} /> Secure staff access
          </Status>
          <h2 style={{ marginTop: 20 }}>Welcome back</h2>
          <p>
            Sign in with an administrator-provisioned account. Errors do not reveal whether an
            account exists.
          </p>
          <form className="auth-form" onSubmit={submit}>
            <label className="field">
              <span>Email address</span>
              <input
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            <label className="field">
              <span>Password</span>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={12}
              />
            </label>
            {error && (
              <p role="alert" style={{ margin: 0, color: "#b43b4f", fontSize: 11 }}>
                {error}
              </p>
            )}
            <button className="button button-primary" disabled={busy}>
              {busy ? (
                "Verifying…"
              ) : (
                <>
                  Sign in <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>
          <div className="auth-demo">
            <strong>Local demonstration account</strong>
            <br />
            admin@pcfc-demo.local · PilotDemo!2026
            <br />
            Available only when development demo mode is enabled; never available in production.
          </div>
        </Card>
      </section>
    </main>
  );
}
