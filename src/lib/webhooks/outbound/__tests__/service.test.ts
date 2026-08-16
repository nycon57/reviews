import crypto from "crypto";
import { describe, expect, it, vi } from "vitest";
import {
  emitWebhookEvent,
  processWebhookDeliveryQueue,
  signWebhookPayload,
} from "@/lib/webhooks/outbound/service";
import type { Database } from "@/types/database.types";

type WebhookDelivery = Database["public"]["Tables"]["webhook_deliveries"]["Row"];
type WebhookSubscription =
  Database["public"]["Tables"]["webhook_subscriptions"]["Row"];
type WebhookServiceSupabase = NonNullable<
  Parameters<typeof emitWebhookEvent>[1]
>["supabase"];

function asServiceSupabase<TDouble>(double: TDouble): WebhookServiceSupabase {
  // SAFETY: the doubles below implement every `from(table)` branch the outbound
  // webhook service reaches for in these tests and throw on any other table, so
  // an unimplemented client member cannot be hit at runtime.
  return double as WebhookServiceSupabase;
}

function thenable<T>(response: T) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    in: vi.fn(() => query),
    lte: vi.fn(() => query),
    order: vi.fn(() => query),
    limit: vi.fn(() => query),
    maybeSingle: vi.fn(() => Promise.resolve(response)),
    single: vi.fn(() => Promise.resolve(response)),
    then: (resolve: (value: T) => void, reject?: (reason: unknown) => void) =>
      Promise.resolve(response).then(resolve, reject),
  };
  return query;
}

describe("outbound webhook service", () => {
  it("fans out one shared event id to matching subscriptions", async () => {
    const insertedRows: Array<Record<string, unknown>> = [];
    const subscriptions = [
      { id: "sub_1", events: ["review.published"] },
      { id: "sub_2", events: [] },
      { id: "sub_3", events: ["contact.created"] },
    ];

    const supabase = asServiceSupabase({
      from: vi.fn((table: string) => {
        if (table === "webhook_subscriptions") {
          return thenable({ data: subscriptions, error: null });
        }

        if (table === "webhook_deliveries") {
          return {
            insert: vi.fn((rows: Array<Record<string, unknown>>) => {
              insertedRows.push(...rows);
              return Promise.resolve({ error: null });
            }),
          };
        }

        throw new Error(`Unexpected table ${table}`);
      }),
    });

    const result = await emitWebhookEvent(
      {
        organizationId: "org_1",
        type: "review.published",
        data: {
          review_id: "review_1",
          rating: 5,
          text: "Excellent",
          reviewer_display_name: "A Customer",
          source: "google",
          review_date: "2026-01-01T00:00:00.000Z",
          professional: { id: "user_1", full_name: "A Pro" },
          public_url: null,
        },
      },
      {
        supabase,
        now: () => new Date("2026-01-01T00:00:01.000Z"),
        eventId: () => "00000000-0000-4000-8000-000000000001",
      }
    );

    expect(result).toEqual({
      success: true,
      eventId: "00000000-0000-4000-8000-000000000001",
      enqueued: 2,
    });
    expect(insertedRows).toHaveLength(2);
    expect(insertedRows.map((row) => row.subscription_id)).toEqual([
      "sub_1",
      "sub_2",
    ]);
    expect(insertedRows.every((row) => row.event_id === result.eventId)).toBe(true);
    expect(insertedRows[0]?.payload).toMatchObject({
      id: result.eventId,
      type: "review.published",
      organization_id: "org_1",
    });
  });

  it("generates deterministic sha256 signatures", () => {
    const rawBody = JSON.stringify({ id: "evt_1", type: "contact.created" });
    const expected = `sha256=${crypto
      .createHmac("sha256", "secret_123")
      .update(rawBody)
      .digest("hex")}`;

    expect(signWebhookPayload(rawBody, "secret_123")).toBe(expected);
  });

  it("marks a successful delivery delivered and updates the subscription timestamp", async () => {
    const { supabase, updates } = createQueueSupabase({
      delivery: makeDelivery({ attempt_count: 0, max_attempts: 5 }),
      subscription: makeSubscription(),
    });
    const fetchMock = vi.fn(() => Promise.resolve(new Response(null, { status: 204 })));

    const result = await processWebhookDeliveryQueue(50, {
      supabase,
      fetch: fetchMock as typeof fetch,
      now: () => new Date("2026-01-01T00:00:00.000Z"),
    });

    expect(result.delivered).toBe(1);
    expect(result.retried).toBe(0);
    expect(updates.webhook_deliveries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ status: "delivering", attempt_count: 1 }),
        expect.objectContaining({
          status: "delivering",
          last_attempt_at: "2026-01-01T00:00:00.000Z",
        }),
        expect.objectContaining({ status: "delivered", response_status: 204 }),
      ])
    );
    expect(updates.webhook_subscriptions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          last_delivery_at: "2026-01-01T00:00:00.000Z",
        }),
      ])
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.com/webhook",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "X-RepWell-Event": "review.published",
          "X-RepWell-Delivery": "delivery_1",
          "X-RepWell-Signature": expect.stringMatching(/^sha256=/),
        }),
      })
    );
  });

  it("marks a failed delivery for retry while attempts remain", async () => {
    const { supabase, updates } = createQueueSupabase({
      delivery: makeDelivery({ attempt_count: 0, max_attempts: 5 }),
      subscription: makeSubscription(),
    });

    const result = await processWebhookDeliveryQueue(50, {
      supabase,
      fetch: vi.fn(() => Promise.resolve(new Response("bad", { status: 500 }))) as typeof fetch,
      now: () => new Date("2026-01-01T00:00:00.000Z"),
    });

    expect(result.retried).toBe(1);
    expect(result.dead).toBe(0);
    expect(updates.webhook_deliveries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ status: "failed", response_status: 500 }),
      ])
    );
  });

  it("marks a failed delivery dead after the final attempt", async () => {
    const { supabase, updates } = createQueueSupabase({
      delivery: makeDelivery({ attempt_count: 4, max_attempts: 5 }),
      subscription: makeSubscription({ failure_count: 2 }),
    });

    const result = await processWebhookDeliveryQueue(50, {
      supabase,
      fetch: vi.fn(() => Promise.resolve(new Response("bad", { status: 500 }))) as typeof fetch,
      now: () => new Date("2026-01-01T00:00:00.000Z"),
    });

    expect(result.dead).toBe(1);
    expect(updates.webhook_deliveries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ status: "dead", response_status: 500 }),
      ])
    );
    expect(updates.webhook_subscriptions).toEqual(
      expect.arrayContaining([expect.objectContaining({ failure_count: 3 })])
    );
  });
});

function makeDelivery(
  overrides: Partial<WebhookDelivery> = {}
): WebhookDelivery {
  return {
    id: "delivery_1",
    organization_id: "org_1",
    subscription_id: "sub_1",
    event_type: "review.published",
    event_id: "00000000-0000-4000-8000-000000000001",
    payload: {
      id: "00000000-0000-4000-8000-000000000001",
      type: "review.published",
      created_at: "2026-01-01T00:00:00.000Z",
      organization_id: "org_1",
      data: {},
    },
    status: "pending",
    attempt_count: 0,
    max_attempts: 5,
    scheduled_at: "2026-01-01T00:00:00.000Z",
    last_attempt_at: null,
    delivered_at: null,
    response_status: null,
    error_message: null,
    created_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeSubscription(
  overrides: Partial<WebhookSubscription> = {}
): WebhookSubscription {
  return {
    id: "sub_1",
    organization_id: "org_1",
    target_url: "https://example.com/webhook",
    secret: "secret_123",
    events: ["review.published"],
    description: null,
    source: "api",
    api_key_id: null,
    is_active: true,
    last_delivery_at: null,
    failure_count: 0,
    created_by: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function createQueueSupabase(params: {
  delivery: WebhookDelivery;
  subscription: WebhookSubscription;
}) {
  const updates: Record<"webhook_deliveries" | "webhook_subscriptions", unknown[]> = {
    webhook_deliveries: [],
    webhook_subscriptions: [],
  };

  const client = asServiceSupabase({
    from: vi.fn((table: string) => {
      if (table === "webhook_deliveries") {
        return {
          select: vi.fn(() =>
            thenable({
              data: [
                {
                  ...params.delivery,
                  webhook_subscriptions: {
                    id: params.subscription.id,
                    target_url: params.subscription.target_url,
                    secret: params.subscription.secret,
                    is_active: params.subscription.is_active,
                  },
                },
              ],
              error: null,
            })
          ),
          update: vi.fn((values: Record<string, unknown>) => {
            updates.webhook_deliveries.push(values);
            const claimed = {
              ...params.delivery,
              ...values,
            };
            const updateQuery = {
              eq: vi.fn(() => updateQuery),
              in: vi.fn(() => updateQuery),
              lt: vi.fn(() => updateQuery),
              select: vi.fn(() => ({
                maybeSingle: vi.fn(() => Promise.resolve({ data: claimed, error: null })),
              })),
              then: (resolve: (value: { error: null }) => void) =>
                Promise.resolve({ error: null }).then(resolve),
            };
            return updateQuery;
          }),
        };
      }

      if (table === "webhook_subscriptions") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(() =>
                Promise.resolve({
                  data: { failure_count: params.subscription.failure_count },
                  error: null,
                })
              ),
            })),
          })),
          update: vi.fn((values: Record<string, unknown>) => {
            updates.webhook_subscriptions.push(values);
            return thenable({ error: null });
          }),
        };
      }

      throw new Error(`Unexpected table ${table}`);
    }),
  });

  return { supabase: client, updates };
}
