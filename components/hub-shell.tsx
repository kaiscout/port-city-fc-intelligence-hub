"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  BookOpen,
  Building2,
  CircleHelp,
  FileText,
  Gauge,
  Handshake,
  HeartHandshake,
  Menu,
  Network,
  Scale,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  Landmark,
  X,
} from "lucide-react";
import clsx from "clsx";
import { HubDataProvider } from "./data-context";
import { canAccessPath } from "@/lib/auth/policies";
import type { Role } from "@/lib/types";
import { WorkspaceRouter } from "./workspace-router";

const primaryNav = [
  { href: "/ownership", label: "Ownership Snapshot", icon: Landmark },
  { href: "/dashboard", label: "Command Center", icon: Gauge },
  { href: "/scenarios", label: "Scenario Lab", icon: Target },
  { href: "/attendance", label: "Fan Funnel", icon: BarChart3 },
  { href: "/sponsors", label: "Sponsorship", icon: Handshake },
  { href: "/programs", label: "Program Equity", icon: Scale },
  { href: "/community", label: "Community Impact", icon: HeartHandshake },
];

const secondaryNav = [
  { href: "/operations", label: "Operations Studio", icon: Building2 },
  { href: "/reports", label: "Reports & Exports", icon: FileText },
  { href: "/case-study", label: "BA Case Study", icon: Network },
  { href: "/settings", label: "Settings & Audit", icon: Settings },
  { href: "/help", label: "Help & Methods", icon: CircleHelp },
  { href: "/about", label: "About This Pilot", icon: BookOpen },
];

function ShellContent({
  children,
  publicReadOnly,
  viewer,
}: {
  children: React.ReactNode;
  publicReadOnly: boolean;
  viewer?: { role: Role; displayName: string };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const nav = (items: typeof primaryNav) =>
    items
      .filter((item) => publicReadOnly || (viewer && canAccessPath(viewer.role, item.href)))
      .map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={() => setOpen(false)}
          className={clsx("nav-link", pathname === href && "active")}
        >
          <Icon size={18} aria-hidden="true" />
          <span>
            {!publicReadOnly && href === "/attendance"
              ? "Attendance Evidence"
              : !publicReadOnly && href === "/community"
                ? "Community Evidence"
                : label}
          </span>
          {pathname === href && <span className="nav-pulse" aria-hidden="true" />}
        </Link>
      ));

  return (
    <div className="hub-shell">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <aside className={clsx("sidebar", open && "sidebar-open")} aria-label="Primary navigation">
        <div className="brand-block">
          <div className="brand-mark">
            <Image
              src="/brand/port-city-fc-logo.png"
              alt="Port City FC circular crest"
              width={52}
              height={52}
              priority
            />
          </div>
          <div>
            <strong>Port City FC</strong>
            <span>Business Intelligence &amp; Analytics</span>
          </div>
          <button
            className="sidebar-close"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>
        <div className="demo-ribbon">
          <Sparkles size={14} />
          <span>
            <b>{publicReadOnly ? "Sanitized public pilot" : "Private club workspace"}</b>
            {publicReadOnly
              ? "Synthetic data + governed workflow"
              : "Approved records · auditable changes"}
          </span>
        </div>
        <nav>
          <p className="nav-heading">Club Workspace</p>
          {nav(primaryNav)}
          <p className="nav-heading nav-heading-lower">Operate & Govern</p>
          {nav(secondaryNav)}
        </nav>
        <div className="sidebar-foot">
          <ShieldCheck size={18} />
          <div>
            <strong>Access policy active</strong>
            <span>
              {publicReadOnly ? "Portfolio viewer · read-only" : viewer?.role.replaceAll("_", " ")}
            </span>
          </div>
        </div>
      </aside>
      {open && (
        <button
          className="sidebar-scrim"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        />
      )}
      <div className="hub-main">
        <header className="topbar">
          <button
            className="mobile-menu"
            onClick={() => setOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={21} />
          </button>
          <div className="environment-indicator">
            <span className="live-dot" aria-hidden="true" />{" "}
            {publicReadOnly ? "Portfolio demonstration" : "Private organization"}{" "}
            <span>
              {publicReadOnly ? "· synthetic FY25 model" : "· approved operational records only"}
            </span>
          </div>
          <div className="topbar-actions">
            <div className="period-button">
              <span className="avatar">
                {publicReadOnly
                  ? "PV"
                  : viewer?.displayName
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((n) => n[0])
                      .join("")}
              </span>
              <span className="user-copy">
                <b>{publicReadOnly ? "Portfolio Viewer" : viewer?.displayName}</b>
                <small>
                  {publicReadOnly ? "Read-only access" : viewer?.role.replaceAll("_", " ")}
                </small>
              </span>
            </div>
            {!publicReadOnly && (
              <button
                className="button button-ghost"
                onClick={async () => {
                  const response = await fetch("/api/auth/logout", { method: "POST" });
                  if (response.ok) {
                    router.push("/login");
                    router.refresh();
                  }
                }}
              >
                Sign out
              </button>
            )}
          </div>
        </header>
        <main id="main-content" className="content-canvas" tabIndex={-1}>
          <WorkspaceRouter>{children}</WorkspaceRouter>
        </main>
        <footer className="app-footer">
          <p>
            {publicReadOnly
              ? "Independent portfolio case study. All public data is synthetic or generalized."
              : "Private workspace. Approval records data-owner review; it does not certify source accuracy. No external platforms are connected."}
          </p>
          <div>
            <Link href="/about">Data provenance</Link>
            <span>Candidate 6.0</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export function HubShell({
  children,
  publicReadOnly,
  viewer,
}: {
  children: React.ReactNode;
  publicReadOnly: boolean;
  viewer?: { role: Role; displayName: string };
}) {
  return (
    <HubDataProvider privateMode={!publicReadOnly}>
      <ShellContent publicReadOnly={publicReadOnly} viewer={viewer}>
        {children}
      </ShellContent>
    </HubDataProvider>
  );
}
