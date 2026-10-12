import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <main className="auth-shell">
      <section className="auth-card">
        <p className="eyebrow">Access policy</p>
        <h1>This role cannot open that workspace.</h1>
        <p>
          The route is protected by the same permission vocabulary used by the server API. Ask an
          administrator for a role change or return to an allowed view.
        </p>
        <Link className="button button-primary" href="/dashboard">
          Return to dashboard
        </Link>
      </section>
    </main>
  );
}
