import { describe, expect, it } from "vitest";
import { assertPermission, hasPermission } from "../../lib/rbac";

describe("role permissions", () => {
  it("grants administrators all server actions", () =>
    expect(hasPermission("ADMINISTRATOR", "users:delete")).toBe(true));
  it("allows analysts to save scenarios", () =>
    expect(hasPermission("ANALYST", "scenarios:write")).toBe(true));
  it("blocks marketing from fixture mutation", () =>
    expect(() => assertPermission("MARKETING", "fixtures:write")).toThrow("FORBIDDEN"));
  it("blocks executives from administrative mutation", () =>
    expect(hasPermission("EXECUTIVE", "*")).toBe(false));
});
