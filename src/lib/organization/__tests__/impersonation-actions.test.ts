import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createAdminClientMock,
  unifiedGetUserMock,
  headersMock,
  impersonateUserMock,
  stopImpersonatingMock,
  getSessionMock,
  revalidatePathMock,
} = vi.hoisted(() => ({
  createAdminClientMock: vi.fn(),
  unifiedGetUserMock: vi.fn(),
  headersMock: vi.fn(),
  impersonateUserMock: vi.fn(),
  stopImpersonatingMock: vi.fn(),
  getSessionMock: vi.fn(),
  revalidatePathMock: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: createAdminClientMock,
}));

vi.mock("@/lib/auth/actions", () => ({
  unifiedGetUser: unifiedGetUserMock,
}));

vi.mock("@/lib/auth/better-auth", () => ({
  auth: {
    api: {
      impersonateUser: impersonateUserMock,
      stopImpersonating: stopImpersonatingMock,
      getSession: getSessionMock,
    },
  },
}));

vi.mock("next/headers", () => ({
  headers: headersMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

import { startUserImpersonation, stopUserImpersonation } from "@/lib/organization/actions";

type QueryResponse = {
  data: Record<string, unknown> | null;
  error: { message: string } | null;
};

function createSupabaseClient(userResponses: QueryResponse[]) {
  const singleMock = vi.fn();
  userResponses.forEach((response) => {
    singleMock.mockResolvedValueOnce(response);
  });

  const auditInsertMock = vi.fn().mockResolvedValue({ error: null });

  const fromMock = vi.fn((table: string) => {
    if (table === "users") {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: singleMock,
          })),
        })),
      };
    }

    if (table === "organization_audit_logs") {
      return {
        insert: auditInsertMock,
      };
    }

    throw new Error(`Unexpected table: ${table}`);
  });

  return {
    client: {
      from: fromMock,
    },
    auditInsertMock,
  };
}

describe("organization impersonation actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ENABLE_USER_IMPERSONATION = "true";
    process.env.NEXT_PUBLIC_ENABLE_USER_IMPERSONATION = "true";
    headersMock.mockResolvedValue(new Headers());
    unifiedGetUserMock.mockResolvedValue({ id: "admin-1", email: "admin@example.com" });
  });

  it("starts impersonation for enterprise admin in same organization", async () => {
    const { client, auditInsertMock } = createSupabaseClient([
      {
        data: {
          id: "admin-1",
          organization_id: "org-1",
          role: "admin",
          organizations: { account_type: "enterprise" },
        },
        error: null,
      },
      {
        data: {
          id: "user-1",
          organization_id: "org-1",
          role: "user",
          is_active: true,
        },
        error: null,
      },
    ]);

    createAdminClientMock.mockReturnValue(client);
    impersonateUserMock.mockResolvedValue({});

    const result = await startUserImpersonation("user-1");

    expect(result).toEqual({ success: true, error: null });
    expect(impersonateUserMock).toHaveBeenCalledWith({
      body: { userId: "user-1" },
      headers: expect.any(Headers),
    });
    expect(auditInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "impersonation_started",
        entity_id: "user-1",
      })
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/dashboard");
    expect(revalidatePathMock).toHaveBeenCalledWith("/dashboard/organization");
  });

  it("rejects impersonation when actor is not admin", async () => {
    const { client, auditInsertMock } = createSupabaseClient([
      {
        data: {
          id: "manager-1",
          organization_id: "org-1",
          role: "manager",
          organizations: { account_type: "enterprise" },
        },
        error: null,
      },
    ]);

    createAdminClientMock.mockReturnValue(client);
    unifiedGetUserMock.mockResolvedValue({ id: "manager-1" });

    const result = await startUserImpersonation("user-1");

    expect(result).toEqual({
      success: false,
      error: "You don't have permission to impersonate users.",
    });
    expect(impersonateUserMock).not.toHaveBeenCalled();
    expect(auditInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "impersonation_start_denied",
      })
    );
  });

  it("rejects impersonation when actor is not enterprise", async () => {
    const { client, auditInsertMock } = createSupabaseClient([
      {
        data: {
          id: "admin-1",
          organization_id: "org-1",
          role: "admin",
          organizations: { account_type: "individual" },
        },
        error: null,
      },
    ]);

    createAdminClientMock.mockReturnValue(client);

    const result = await startUserImpersonation("user-1");

    expect(result).toEqual({
      success: false,
      error: "You don't have permission to impersonate users.",
    });
    expect(impersonateUserMock).not.toHaveBeenCalled();
    expect(auditInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "impersonation_start_denied",
        new_values: expect.objectContaining({
          reason: "actor_not_enterprise_admin",
        }),
      })
    );
  });

  it("rejects cross-organization targets", async () => {
    const { client, auditInsertMock } = createSupabaseClient([
      {
        data: {
          id: "admin-1",
          organization_id: "org-1",
          role: "admin",
          organizations: { account_type: "enterprise" },
        },
        error: null,
      },
      {
        data: {
          id: "user-2",
          organization_id: "org-2",
          role: "user",
          is_active: true,
        },
        error: null,
      },
    ]);

    createAdminClientMock.mockReturnValue(client);

    const result = await startUserImpersonation("user-2");

    expect(result).toEqual({
      success: false,
      error: "This user can't be impersonated.",
    });
    expect(impersonateUserMock).not.toHaveBeenCalled();
    expect(auditInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "impersonation_start_denied",
        new_values: expect.objectContaining({
          reason: "cross_organization_target_blocked",
        }),
      })
    );
  });

  it("rejects admin targets", async () => {
    const { client, auditInsertMock } = createSupabaseClient([
      {
        data: {
          id: "admin-1",
          organization_id: "org-1",
          role: "admin",
          organizations: { account_type: "enterprise" },
        },
        error: null,
      },
      {
        data: {
          id: "admin-2",
          organization_id: "org-1",
          role: "admin",
          is_active: true,
        },
        error: null,
      },
    ]);

    createAdminClientMock.mockReturnValue(client);

    const result = await startUserImpersonation("admin-2");

    expect(result).toEqual({
      success: false,
      error: "This user can't be impersonated.",
    });
    expect(impersonateUserMock).not.toHaveBeenCalled();
    expect(auditInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "impersonation_start_denied",
        new_values: expect.objectContaining({
          reason: "admin_target_blocked",
        }),
      })
    );
  });

  it("rejects inactive targets", async () => {
    const { client, auditInsertMock } = createSupabaseClient([
      {
        data: {
          id: "admin-1",
          organization_id: "org-1",
          role: "admin",
          organizations: { account_type: "enterprise" },
        },
        error: null,
      },
      {
        data: {
          id: "user-1",
          organization_id: "org-1",
          role: "user",
          is_active: false,
        },
        error: null,
      },
    ]);

    createAdminClientMock.mockReturnValue(client);

    const result = await startUserImpersonation("user-1");

    expect(result).toEqual({
      success: false,
      error: "This user can't be impersonated.",
    });
    expect(impersonateUserMock).not.toHaveBeenCalled();
    expect(auditInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "impersonation_start_denied",
        new_values: expect.objectContaining({
          reason: "inactive_target_blocked",
        }),
      })
    );
  });

  it("rejects self impersonation", async () => {
    const { client, auditInsertMock } = createSupabaseClient([
      {
        data: {
          id: "admin-1",
          organization_id: "org-1",
          role: "admin",
          organizations: { account_type: "enterprise" },
        },
        error: null,
      },
      {
        data: {
          id: "admin-1",
          organization_id: "org-1",
          role: "user",
          is_active: true,
        },
        error: null,
      },
    ]);

    createAdminClientMock.mockReturnValue(client);

    const result = await startUserImpersonation("admin-1");

    expect(result).toEqual({
      success: false,
      error: "This user can't be impersonated.",
    });
    expect(impersonateUserMock).not.toHaveBeenCalled();
    expect(auditInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "impersonation_start_denied",
        new_values: expect.objectContaining({
          reason: "self_impersonation_blocked",
        }),
      })
    );
  });

  it("stops impersonation and writes audit log", async () => {
    const { client, auditInsertMock } = createSupabaseClient([
      {
        data: {
          organization_id: "org-1",
        },
        error: null,
      },
    ]);

    createAdminClientMock.mockReturnValue(client);
    getSessionMock.mockResolvedValue({
      session: {
        impersonatedBy: "admin-1",
      },
      user: {
        id: "user-1",
      },
    });
    stopImpersonatingMock.mockResolvedValue({});

    const result = await stopUserImpersonation();

    expect(result).toEqual({ success: true, error: null });
    expect(stopImpersonatingMock).toHaveBeenCalledWith({
      headers: expect.any(Headers),
    });
    expect(auditInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "impersonation_stopped",
        entity_id: "user-1",
      })
    );
  });

  it("returns an error when stop impersonation fails", async () => {
    const { client } = createSupabaseClient([
      {
        data: {
          organization_id: "org-1",
        },
        error: null,
      },
    ]);
    createAdminClientMock.mockReturnValue(client);

    getSessionMock.mockResolvedValue({
      session: {
        impersonatedBy: "admin-1",
      },
      user: {
        id: "user-1",
      },
    });
    stopImpersonatingMock.mockRejectedValue(new Error("stop failed"));

    const result = await stopUserImpersonation();

    expect(result).toEqual({
      success: false,
      error: "Couldn't stop impersonation. Try again.",
    });
  });
});
