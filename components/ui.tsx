"use client";

import clsx from "clsx";
import type { ComponentPropsWithoutRef } from "react";
import { ArrowDownRight, ArrowUpRight, Info, Minus, Sparkles } from "lucide-react";
import type { SourceClass } from "@/lib/types";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="page-lede">{description}</p>
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}

export function Card({
  children,
  className,
  interactive = false,
  ...props
}: ComponentPropsWithoutRef<"section"> & { interactive?: boolean }) {
  return (
    <section {...props} className={clsx("card", interactive && "card-interactive", className)}>
      {children}
    </section>
  );
}

export function CardHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="card-header">
      <div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function SourceBadge({ source }: { source: SourceClass }) {
  const short: Record<SourceClass, string> = {
    "Official public information": "Official",
    "User-provided source document": "Source ledger",
    "Synthetic demonstration data": "Synthetic demo",
    "User-entered operational data": "User-entered",
    "Calculated metric": "Calculated",
    "Forecast or scenario": "Forecast",
    "Documented assumption": "Assumption",
  };
  return (
    <span className="source-badge" title={source}>
      <Sparkles size={11} aria-hidden="true" /> {short[source]}
    </span>
  );
}

export function KpiCard({
  label,
  value,
  change,
  positive = true,
  source = "Calculated metric",
  definition,
}: {
  label: string;
  value: string;
  change: string;
  positive?: boolean | null;
  source?: SourceClass;
  definition: string;
}) {
  const Icon = positive === null ? Minus : positive ? ArrowUpRight : ArrowDownRight;
  return (
    <Card className="kpi-card" interactive>
      <div className="kpi-label">
        <span>{label}</span>
        <details className="kpi-definition">
          <summary className="icon-button" aria-label={`Definition for ${label}`}>
            <Info size={14} />
          </summary>
          <p>{definition}</p>
        </details>
      </div>
      <strong className="kpi-value">{value}</strong>
      <div className="kpi-foot">
        <span
          className={clsx(
            "trend",
            positive === false && "negative",
            positive === null && "neutral",
          )}
        >
          <Icon size={14} aria-hidden="true" /> {change}
        </span>
        <SourceBadge source={source} />
      </div>
    </Card>
  );
}

export function Status({
  children,
  tone = "info",
}: {
  children: React.ReactNode;
  tone?: "success" | "warning" | "danger" | "info" | "neutral";
}) {
  return (
    <span className={`status status-${tone}`}>
      <span aria-hidden="true" />
      {children}
    </span>
  );
}

export function DataTable({
  caption,
  headers,
  rows,
}: {
  caption: string;
  headers: string[];
  rows: React.ReactNode[][];
}) {
  return (
    <div className="table-wrap" tabIndex={0} aria-label={`${caption}, horizontally scrollable`}>
      <table>
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header} scope="col">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="empty-state">
      <span className="empty-orbit" aria-hidden="true" />
      <h3>{title}</h3>
      <p>{detail}</p>
    </div>
  );
}
