import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/admin", () => ({
  createUntypedAdminClient: vi.fn(),
}));
vi.mock("@/lib/contacts/actions", () => ({
  isSuppressed: vi.fn(),
}));

import { createUntypedAdminClient } from "@/lib/supabase/admin";
import { isSuppressed } from "@/lib/contacts/actions";
import { guardAcquisitionSend } from "../send-guard";
import { sha256Email } from "../identity";

function mockInsertClient() {
  const insert = vi.fn((_row: Record<string, unknown>) =>
    Promise.resolve({ error: null })
  );
  const client = { from: vi.fn(() => ({ insert })) };
  (createUntypedAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(client);
  return { client, insert };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("guardAcquisitionSend", () => {
  it("allows the send (returns false) and writes no audit row when not suppressed", async () => {
    (isSuppressed as ReturnType<typeof vi.fn>).mockResolvedValue(false);
    const { client } = mockInsertClient();

    const blocked = await guardAcquisitionSend({
      organizationId: "org1",
      email: "jane@example.com",
      sendKind: "survey_invitation",
      contactId: "c1",
    });

    expect(blocked).toBe(false);
    // No audit insert when the send proceeds.
    expect(client.from).not.toHaveBeenCalled();
  });

  it("blocks the send (returns true) and records a skip row when suppressed", async () => {
    (isSuppressed as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    const { client, insert } = mockInsertClient();

    const blocked = await guardAcquisitionSend({
      organizationId: "org1",
      email: "Jane@Example.com",
      sendKind: "video_reminder",
      contactId: "c1",
      sourceTable: "video_testimonial_queue",
      sourceId: "q9",
    });

    expect(blocked).toBe(true);
    expect(client.from).toHaveBeenCalledWith("acquisition_send_skips");
    const row = (insert.mock.calls as unknown[][])[0][0] as Record<
      string,
      unknown
    >;
    expect(row).toMatchObject({
      organization_id: "org1",
      contact_id: "c1",
      channel: "email",
      send_kind: "video_reminder",
      source_table: "video_testimonial_queue",
      source_id: "q9",
      reason: "suppressed",
    });
    // Audit key is the normalized email hash, matching the suppression key.
    expect(row.email_sha256).toBe(sha256Email("jane@example.com"));
  });

  it("checks suppression against the requested channel", async () => {
    (isSuppressed as ReturnType<typeof vi.fn>).mockResolvedValue(false);
    mockInsertClient();

    await guardAcquisitionSend({
      organizationId: "org1",
      email: "jane@example.com",
      channel: "sms",
      sendKind: "survey_invitation",
    });

    expect(isSuppressed).toHaveBeenCalledWith("org1", "jane@example.com", "sms");
  });
});
