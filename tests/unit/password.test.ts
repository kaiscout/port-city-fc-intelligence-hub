import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "../../lib/auth/password";

describe("password handling", () => {
  it("hashes with Argon2id and verifies without storing plaintext", async () => {
    const encoded = await hashPassword("A-strong-local-test-password!9");
    expect(encoded).toContain("argon2id");
    expect(encoded).not.toContain("strong-local");
    expect(await verifyPassword(encoded, "A-strong-local-test-password!9")).toBe(true);
    expect(await verifyPassword(encoded, "wrong-password")).toBe(false);
  });
});
