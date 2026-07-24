import { describe, expect, it } from "vitest";
import { changePasswordSchema } from "@/lib/validators/auth/auth";

describe("changePasswordSchema", () => {
  it("accepts matching passwords of at least 8 characters", () => {
    const result = changePasswordSchema.safeParse({
      newPassword: "password1",
      confirmPassword: "password1",
    });
    expect(result.success).toBe(true);
  });

  it("rejects passwords shorter than 8 characters", () => {
    const result = changePasswordSchema.safeParse({
      newPassword: "short",
      confirmPassword: "short",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.newPassword?.[0]).toMatch(
        /at least 8/i,
      );
    }
  });

  it("rejects mismatched confirm password", () => {
    const result = changePasswordSchema.safeParse({
      newPassword: "password1",
      confirmPassword: "password2",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.confirmPassword?.[0]).toMatch(
        /do not match/i,
      );
    }
  });
});
