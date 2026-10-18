"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  BookOpen,
  Building2,
  ChevronDown,
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

const primaryNav = [
  { href: "/ownership", label: "Ownership snapshot", icon: Landmark },
  { href: "/dashboard", label: "Command center", icon: Gauge },
  { href: "/scenarios", label: "Scenario lab", icon: Target },
  { href: "/attendance", label: "Fan funnel", icon: BarChart3 },
  { href: "/sponsors", label: "Sponsorship", icon: Handshake },
  { href: "/programs", label: "Program equity", icon: Scale },
  { href: "/community", label: "Community impact", icon: HeartHandshake },
];

const secondaryNav = [
  { href: "/operations", label: "Operations studio", icon: Building2 },
  { href: "/reports", label: "Reports & exports", icon: FileText },
  { href: "/case-study", label: "BA case study", icon: Network },
  { href: "/settings", label: "Settings & audit", icon: Settings },
  { href: "/help", label: "Help & methods", icon: CircleHelp },
  { href: "/about", label: "About this pilot", icon: BookOpen },
];

function ShellContent({
  children,
  publicReadOnly,
}: {
  children: React.ReactNode;
  publicReadOnly: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const nav = (items: typeof primaryNav) =>
    items.map(({ href, label, icon: Icon }) => (
      <Link
        key={href}
        href={href}
        onClick={() => setOpen(false)}
        className={clsx("nav-link", pathname === href && "active")}
      >
        <Icon size={18} aria-hidden="true" />
        <span>{label}</span>
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
            <b>Sanitized public pilot</b>Synthetic data + governed workflow
          </span>
        </div>
        <nav>
          <p className="nav-heading">Decision workspace</p>
          {nav(primaryNav)}
          <p className="nav-heading nav-heading-lower">Operate & govern</p>
          {nav(secondaryNav)}
        </nav>
        <div className="sidebar-foot">
          <ShieldCheck size={18} />
          <div>
            <strong>Access policy active</strong>
            <span>{publicReadOnly ? "Portfolio viewer · read-only" : "Administrator · demo"}</span>
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
            <span className="live-dot" aria-hidden="true" /> Portfolio demonstration{" "}
            <span>· synthetic FY25 model</span>
          </div>
          <div className="topbar-actions">
            <button className="period-button">
              <span className="avatar">{publicReadOnly ? "PV" : "AM"}</span>
              <span className="user-copy">
                <b>{publicReadOnly ? "Portfolio Viewer" : "Alex Morgan"}</b>
                <small>{publicReadOnly ? "Read-only access" : "Administrator"}</small>
              </span>
              <ChevronDown size={15} />
            </button>
          </div>
        </header>
        <main id="main-content" className="content-canvas" tabIndex={-1}>
          {children}
        </main>
        <footer className="app-footer">
          <p>
            Independent portfolio case study. All public data is synthetic or generalized; the
            source-to-model pipeline, controls and permission design are reproducible.
          </p>
          <div>
            <Link href="/about">Data provenance</Link>
            <span>v1.0 pilot</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export function HubShell({
  children,
  publicReadOnly,
}: {
  children: React.ReactNode;
  publicReadOnly: boolean;
}) {
  return (
    <HubDataProvider>
      <ShellContent publicReadOnly={publicReadOnly}>{children}</ShellContent>
    </HubDataProvider>
  );
}
