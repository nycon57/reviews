import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  headersMock,
  getSessionMock,
  redirectMock,
} = vi.hoisted(() => ({
  headersMock: vi.fn(),
  getSessionMock: vi.fn(),
  redirectMock: vi.fn(),
}));

vi.mock("@/lib/auth/better-auth", () => ({
  auth: {
    api: {
      getSession: getSessionMock,
    },
  },
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/users/slug-utils", () => ({
  generateUniqueUserSlug: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: headersMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

import {
  resendVerificationEmailBetterAuth,
  resetPasswordBetterAuth,
  signInWithMagicLinkBetterAuth,
} from "../server-actions";

describe("trusted app URL auth flows", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
    process.env.NEXT_PUBLIC_APP_URL = "https://trusted.example.com";
    headersMock.mockResolvedValue(new Headers({
      host: "evil.example.com",
      "x-forwarded-proto": "https",
    }));
    getSessionMock.mockResolvedValue({
      user: {
        email: "user@example.com",
      },
    });
    fetchMock.mockResolvedValue({
      ok: true,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.NEXT_PUBLIC_APP_URL;
  });

  it("uses the trusted app URL for password reset requests", async () => {
    await resetPasswordBetterAuth({ email: "user@example.com" });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://trusted.example.com/api/auth/forget-password",
      expect.objectContaining({
        method: "POST",
      })
    );

    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(body.redirectTo).toBe("https://trusted.example.com/reset-password");
  });

  it("uses the trusted app URL for magic link requests", async () => {
    await signInWithMagicLinkBetterAuth({ email: "user@example.com" });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://trusted.example.com/api/auth/sign-in/magic-link",
      expect.objectContaining({
        method: "POST",
      })
    );
  });

  it("uses the trusted app URL for verification email requests", async () => {
    await resendVerificationEmailBetterAuth();

    expect(fetchMock).toHaveBeenCalledWith(
      "https://trusted.example.com/api/auth/send-verification-email",
      expect.objectContaining({
        method: "POST",
      })
    );
  });
});
