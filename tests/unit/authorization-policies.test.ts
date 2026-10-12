import { describe, expect, it } from "vitest";
import { canAccessPath, permissionForEntity, permissionsForPath } from "../../lib/auth/policies";

describe("route and entity authorization policies", () => {
  it("requires settings permission for the settings route", () => {
    expect(permissionsForPath("/settings")).toEqual(["settings:read"]);
    expect(canAccessPath("ADMINISTRATOR", "/settings")).toBe(true);
    expect(canAccessPath("EXECUTIVE", "/settings")).toBe(false);
  });

  it("allows any relevant analytical role to view attendance", () => {
    expect(canAccessPath("ANALYST", "/attendance")).toBe(true);
    expect(canAccessPath("MARKETING", "/attendance")).toBe(true);
    expect(canAccessPath("MATCHDAY_OPERATIONS", "/attendance")).toBe(true);
  });

  it("does not collapse sensitive entity reads into dashboard access", () => {
    expect(permissionForEntity("users", "read")).toBe("users:read");
    expect(permissionForEntity("organization-settings", "read")).toBe("settings:read");
    expect(permissionForEntity("sponsors", "read")).toBe("sponsors:read");
  });
});
