import { describe, expect, it } from "vitest";
import {
  PERMISSIONS,
  canImpersonateUsers,
  hasPermission,
  type UserContext,
} from "@/lib/permissions";

function makeContext(overrides: Partial<UserContext> = {}): UserContext {
  return {
    userId: "user-1",
    role: "user",
    accountType: "individual",
    isOwner: false,
    subscriptionTier: "basic",
    organizationId: "org-1",
    ...overrides,
  };
}

describe("permissions - impersonation", () => {
  it("allows impersonation for enterprise admins", () => {
    const ctx = makeContext({
      role: "admin",
      accountType: "enterprise",
      subscriptionTier: "enterprise",
    });

    expect(hasPermission(ctx, PERMISSIONS.IMPERSONATE_USER)).toBe(true);
    expect(canImpersonateUsers(ctx)).toBe(true);
  });

  it("denies impersonation for enterprise managers", () => {
    const ctx = makeContext({
      role: "manager",
      accountType: "enterprise",
      subscriptionTier: "enterprise",
    });

    expect(hasPermission(ctx, PERMISSIONS.IMPERSONATE_USER)).toBe(false);
    expect(canImpersonateUsers(ctx)).toBe(false);
  });

  it("denies impersonation for individual admins", () => {
    const ctx = makeContext({
      role: "admin",
      accountType: "individual",
      isOwner: true,
      subscriptionTier: "pro",
    });

    expect(hasPermission(ctx, PERMISSIONS.IMPERSONATE_USER)).toBe(false);
    expect(canImpersonateUsers(ctx)).toBe(false);
  });

  it("denies impersonation with no context", () => {
    expect(hasPermission(null, PERMISSIONS.IMPERSONATE_USER)).toBe(false);
    expect(canImpersonateUsers(null)).toBe(false);
  });
});

describe("permissions - Share Studio", () => {
  it("allows individual accounts", () => {
    const ctx = makeContext({
      role: "admin",
      accountType: "individual",
      isOwner: true,
      subscriptionTier: "basic",
    });

    expect(hasPermission(ctx, PERMISSIONS.VIEW_SHARE_STUDIO)).toBe(true);
  });

  it("allows enterprise managers and admins", () => {
    const manager = makeContext({
      role: "manager",
      accountType: "enterprise",
      subscriptionTier: "enterprise",
    });
    const admin = makeContext({
      role: "admin",
      accountType: "enterprise",
      subscriptionTier: "enterprise",
    });

    expect(hasPermission(manager, PERMISSIONS.VIEW_SHARE_STUDIO)).toBe(true);
    expect(hasPermission(admin, PERMISSIONS.VIEW_SHARE_STUDIO)).toBe(true);
  });

  it("denies enterprise users", () => {
    const ctx = makeContext({
      role: "user",
      accountType: "enterprise",
      subscriptionTier: "enterprise",
    });

    expect(hasPermission(ctx, PERMISSIONS.VIEW_SHARE_STUDIO)).toBe(false);
  });
});

describe("permissions - Reports", () => {
  it("allows individual admins", () => {
    const ctx = makeContext({
      role: "admin",
      accountType: "individual",
      isOwner: true,
    });

    expect(hasPermission(ctx, PERMISSIONS.VIEW_REPORTS)).toBe(true);
  });

  it("allows enterprise managers and admins", () => {
    const manager = makeContext({
      role: "manager",
      accountType: "enterprise",
      subscriptionTier: "enterprise",
    });
    const admin = makeContext({
      role: "admin",
      accountType: "enterprise",
      subscriptionTier: "enterprise",
    });

    expect(hasPermission(manager, PERMISSIONS.VIEW_REPORTS)).toBe(true);
    expect(hasPermission(admin, PERMISSIONS.VIEW_REPORTS)).toBe(true);
  });

  it("denies enterprise users", () => {
    const ctx = makeContext({
      role: "user",
      accountType: "enterprise",
      subscriptionTier: "enterprise",
    });

    expect(hasPermission(ctx, PERMISSIONS.VIEW_REPORTS)).toBe(false);
  });
});
