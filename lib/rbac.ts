import type { Role } from "./types";

export const permissions = {
  ADMINISTRATOR: ["*"],
  EXECUTIVE: [
    "dashboard:read",
    "analytics:read",
    "reports:read",
    "reports:export",
    "scenarios:read",
  ],
  ANALYST: [
    "dashboard:read",
    "analytics:read",
    "scenarios:read",
    "scenarios:write",
    "reports:read",
    "reports:export",
    "operations:read",
    "fixtures:read",
    "fixtures:write",
    "attendance:write",
    "imports:write",
    "revenue:write",
    "costs:write",
    "governance:read",
    "governance:write",
  ],
  COMMERCIAL: [
    "dashboard:read",
    "sponsors:read",
    "sponsors:write",
    "reports:export",
    "imports:write",
    "governance:read",
    "governance:write",
  ],
  MARKETING: ["dashboard:read", "funnel:read", "funnel:write", "community:read", "community:write"],
  MATCHDAY_OPERATIONS: [
    "dashboard:read",
    "operations:read",
    "fixtures:read",
    "analytics:read",
    "fixtures:write",
    "attendance:write",
    "imports:write",
    "revenue:write",
    "costs:write",
  ],
} satisfies Record<Role, string[]>;

export function hasPermission(role: Role, permission: string) {
  const granted = permissions[role];
  return granted.includes("*") || granted.includes(permission);
}

export function assertPermission(role: Role, permission: string) {
  if (!hasPermission(role, permission)) {
    throw new Error("FORBIDDEN");
  }
}
