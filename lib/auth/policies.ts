import type { Role } from "@/lib/types";
import { hasPermission } from "@/lib/rbac";

export const roles: Role[] = [
  "ADMINISTRATOR",
  "EXECUTIVE",
  "ANALYST",
  "COMMERCIAL",
  "MARKETING",
  "MATCHDAY_OPERATIONS",
];

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && roles.includes(value as Role);
}

const pagePolicies: { prefix: string; anyOf: string[] }[] = [
  { prefix: "/settings", anyOf: ["settings:read"] },
  { prefix: "/operations", anyOf: ["operations:read"] },
  { prefix: "/scenarios", anyOf: ["scenarios:read"] },
  { prefix: "/attendance", anyOf: ["analytics:read", "funnel:read", "fixtures:read"] },
  { prefix: "/sponsors", anyOf: ["sponsors:read"] },
  { prefix: "/programs", anyOf: ["analytics:read"] },
  { prefix: "/community", anyOf: ["community:read"] },
  { prefix: "/reports", anyOf: ["reports:read"] },
  { prefix: "/ownership", anyOf: ["dashboard:read"] },
  { prefix: "/dashboard", anyOf: ["dashboard:read"] },
  { prefix: "/case-study", anyOf: ["dashboard:read"] },
  { prefix: "/help", anyOf: ["dashboard:read"] },
  { prefix: "/about", anyOf: ["dashboard:read"] },
];

export function permissionsForPath(pathname: string) {
  return pagePolicies.find(({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`))
    ?.anyOf;
}

export function canAccessPath(role: Role, pathname: string) {
  const required = permissionsForPath(pathname);
  return !required || required.some((permission) => hasPermission(role, permission));
}

export const entityPolicies = {
  seasons: { read: "fixtures:read", write: "fixtures:write" },
  teams: { read: "fixtures:read", write: "fixtures:write" },
  competitions: { read: "fixtures:read", write: "fixtures:write" },
  venues: { read: "fixtures:read", write: "fixtures:write" },
  fixtures: { read: "fixtures:read", write: "fixtures:write" },
  attendance: { read: "analytics:read", write: "attendance:write" },
  "ticket-channels": { read: "analytics:read", write: "imports:write" },
  revenue: { read: "analytics:read", write: "imports:write" },
  costs: { read: "analytics:read", write: "imports:write" },
  sponsors: { read: "sponsors:read", write: "sponsors:write" },
  "sponsor-packages": { read: "sponsors:read", write: "sponsors:write" },
  "sponsor-deliverables": { read: "sponsors:read", write: "sponsors:write" },
  campaigns: { read: "funnel:read", write: "funnel:write" },
  "funnel-metrics": { read: "funnel:read", write: "funnel:write" },
  "community-programs": { read: "community:read", write: "community:write" },
  "community-impact": { read: "community:read", write: "community:write" },
  scenarios: { read: "scenarios:read", write: "scenarios:write" },
  risks: { read: "dashboard:read", write: "governance:write" },
  recommendations: { read: "dashboard:read", write: "governance:write" },
  users: { read: "users:read", write: "users:write" },
  "organization-settings": { read: "settings:read", write: "settings:write" },
} as const;

export type EntityName = keyof typeof entityPolicies;

export function isEntityName(value: string): value is EntityName {
  return value in entityPolicies;
}

export function permissionForEntity(entity: EntityName, operation: "read" | "write") {
  return entityPolicies[entity][operation];
}
