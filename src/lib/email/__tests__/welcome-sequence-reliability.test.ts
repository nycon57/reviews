import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("../send-utils", () => ({
  getUnsubscribeUrl: vi.fn(async () => "https://app.example.com/unsubscribe/token"),
  getEmailPreferencesUrl: vi.fn(async () => "https://app.example.com/email-preferences/token"),
  sendWithReliability: vi.fn(async () => ({
    success: true,
    messageId: "resend-1",
    effectiveSubject: "Welcome aboard",
    abTestId: "ab-test-1",
    abTestVariant: "B",
  })),
}));

import { createAdminClient } from "@/lib/supabase/admin";
import { sendWithReliability } from "../send-utils";
import { processWelcomeSequenceQueue } from "../welcome-sequence-service";

type QueryState = {
  table: string;
  operation?: "select" | "insert" | "update";
};

const sequence = {
  id: "sequence-1",
  user_id: "user-1",
  organization_id: "org-1",
  sequence_type: "welcome",
  status: "active",
  current_step: 0,
  total_steps: 5,
  steps_completed: [],
  ab_test_assignments: { email_1: "B" },
  skipped_steps: [],
  metadata: {
    firstName: "Jane",
    organizationName: "Acme Lending",
    role: "admin",
  },
  started_at: "2026-01-01T00:00:00Z",
  next_email_at: "2026-01-01T00:00:00Z",
};

function createSupabaseMock() {
  function makeBuilder(table: string) {
    const state: QueryState = { table };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test double
    const builder: any = {};
    builder.select = vi.fn(() => {
      state.operation = state.operation || "select";
      return builder;
    });
    builder.insert = vi.fn(() => {
      state.operation = "insert";
      return builder;
    });
    builder.update = vi.fn(() => {
      state.operation = "update";
      return builder;
    });
    for (const method of ["eq", "lte", "order", "limit"]) {
      builder[method] = vi.fn(() => builder);
    }
    builder.single = vi.fn(() => Promise.resolve(resolve(state, true)));
    builder.then = (resolveValue: (value: unknown) => unknown, reject?: (error: unknown) => unknown) =>
      Promise.resolve(resolve(state, false)).then(resolveValue, reject);
    return builder;
  }

  return {
    from: vi.fn((table: string) => makeBuilder(table)),
    rpc: vi.fn(() =>
      Promise.resolve({
        data: {
          first_survey_sent: false,
          profile_completed: false,
        },
        error: null,
      })
    ),
  };
}

function resolve(state: QueryState, single: boolean) {
  if (state.table === "email_sequences" && state.operation === "select") {
    return { data: [sequence], error: null };
  }
  if (state.table === "email_sequences" && state.operation === "update") {
    return { data: null, error: null };
  }
  if (state.table === "users") {
    return {
      data: {
        id: "user-1",
        email: "jane@example.com",
        full_name: "Jane Pro",
        receive_notifications: true,
      },
      error: null,
    };
  }
  if (state.table === "email_unsubscribes") {
    return { data: null, error: null };
  }
  if (state.table === "email_logs" && state.operation === "insert") {
    return { data: { id: "email-log-1" }, error: null };
  }
  return { data: single ? null : [], error: null };
}

beforeEach(() => {
  vi.clearAllMocks();
  (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(createSupabaseMock());
});

describe("welcome sequence reliability conversion", () => {
  it("passes organizationId and emailType to sendWithReliability", async () => {
    const result = await processWelcomeSequenceQueue(1);

    expect(result.processed).toBe(1);
    expect(sendWithReliability).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: "org-1",
        emailType: "welcome_1_access",
        idempotencyKey: "welcome-sequence-sequence-1-step-1",
        tags: expect.arrayContaining([
          { name: "template", value: "welcome_1_access" },
          { name: "sequence_id", value: "sequence-1" },
          { name: "sequence_step", value: "1" },
          { name: "ab_variant", value: "B" },
          { name: "organization_id", value: "org-1" },
        ]),
      })
    );
  });
});
