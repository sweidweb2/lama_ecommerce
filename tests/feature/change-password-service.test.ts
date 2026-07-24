import { beforeEach, describe, expect, it, vi } from "vitest";

const signInWithPassword = vi.fn();
const updatePassword = vi.fn();
const resetPasswordForEmail = vi.fn();
const signOut = vi.fn();
const signUp = vi.fn();
const getOwnProfileAuth = vi.fn();

vi.mock("@/repositories/auth.client.repository", () => ({
  signInWithPassword: (...args: unknown[]) => signInWithPassword(...args),
  updatePassword: (...args: unknown[]) => updatePassword(...args),
  resetPasswordForEmail: (...args: unknown[]) =>
    resetPasswordForEmail(...args),
  signOut: (...args: unknown[]) => signOut(...args),
  signUp: (...args: unknown[]) => signUp(...args),
  getOwnProfileAuth: (...args: unknown[]) => getOwnProfileAuth(...args),
}));

describe("changePasswordService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("re-auths then updates password on success", async () => {
    signInWithPassword.mockResolvedValue({ data: {}, error: null });
    updatePassword.mockResolvedValue({ data: {}, error: null });
    const { changePasswordService } = await import("@/services/auth.service");

    const result = await changePasswordService({
      email: "user@example.com",
      currentPassword: "oldpassword",
      newPassword: "newpassword",
    });

    expect(result).toEqual({ success: true });
    expect(signInWithPassword).toHaveBeenCalledWith({
      email: "user@example.com",
      password: "oldpassword",
    });
    expect(updatePassword).toHaveBeenCalledWith("newpassword");
  });

  it("returns friendly error when current password is wrong", async () => {
    signInWithPassword.mockResolvedValue({
      data: {},
      error: { message: "Invalid login credentials" },
    });
    const { changePasswordService } = await import("@/services/auth.service");

    const result = await changePasswordService({
      email: "user@example.com",
      currentPassword: "wrong",
      newPassword: "newpassword",
    });

    expect(result).toEqual({
      success: false,
      error: "Current password is incorrect.",
    });
    expect(updatePassword).not.toHaveBeenCalled();
  });

  it("maps updatePassword repo errors", async () => {
    signInWithPassword.mockResolvedValue({ data: {}, error: null });
    updatePassword.mockResolvedValue({
      data: {},
      error: { message: "Password is too weak" },
    });
    const { changePasswordService } = await import("@/services/auth.service");

    const result = await changePasswordService({
      email: "user@example.com",
      currentPassword: "oldpassword",
      newPassword: "newpassword",
    });

    expect(result).toEqual({
      success: false,
      error: "Password is too weak",
    });
  });
});

describe("confirmPasswordResetService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("updates password when schema is valid", async () => {
    updatePassword.mockResolvedValue({ data: {}, error: null });
    const { confirmPasswordResetService } = await import(
      "@/services/auth.service"
    );

    const result = await confirmPasswordResetService({
      newPassword: "password1",
      confirmPassword: "password1",
    });

    expect(result).toEqual({ success: true });
    expect(updatePassword).toHaveBeenCalledWith("password1");
    expect(signInWithPassword).not.toHaveBeenCalled();
  });

  it("rejects invalid schema without calling repo", async () => {
    const { confirmPasswordResetService } = await import(
      "@/services/auth.service"
    );

    const result = await confirmPasswordResetService({
      newPassword: "short",
      confirmPassword: "short",
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/at least 8/i);
    expect(updatePassword).not.toHaveBeenCalled();
  });

  it("maps repo errors to failure", async () => {
    updatePassword.mockResolvedValue({
      data: {},
      error: { message: "Session expired" },
    });
    const { confirmPasswordResetService } = await import(
      "@/services/auth.service"
    );

    const result = await confirmPasswordResetService({
      newPassword: "password1",
      confirmPassword: "password1",
    });

    expect(result).toEqual({
      success: false,
      error: "Session expired",
    });
  });
});
