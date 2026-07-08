"use server";

export type OutboundWebhookEvent =
  | "review.published"
  | "review.negative"
  | "review.responded"
  | "survey.completed"
  | "contact.created";

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface OutboundWebhookSubscription {
  id: string;
  targetUrl: string;
  events: OutboundWebhookEvent[];
  description: string | null;
  isActive: boolean;
  failureCount: number;
  lastDeliveryAt: string | null;
  createdAt: string;
  secret?: string;
}

export interface OutboundWebhookDelivery {
  id: string;
  eventId: string;
  eventType: OutboundWebhookEvent;
  status: string;
  responseStatus: number | null;
  attemptCount: number;
  maxAttempts: number;
  errorMessage: string | null;
  createdAt: string;
  lastAttemptAt: string | null;
  deliveredAt: string | null;
}

export interface CreateOutboundWebhookSubscriptionInput {
  targetUrl: string;
  events: OutboundWebhookEvent[];
  description?: string;
}

type OutboundWebhookActions = {
  listOutboundWebhookSubscriptions: () => Promise<ActionResult<OutboundWebhookSubscription[]>>;
  createOutboundWebhookSubscription: (
    input: CreateOutboundWebhookSubscriptionInput
  ) => Promise<ActionResult<OutboundWebhookSubscription>>;
  toggleOutboundWebhookSubscription: (
    id: string,
    isActive: boolean
  ) => Promise<ActionResult<OutboundWebhookSubscription>>;
  deleteOutboundWebhookSubscription: (id: string) => Promise<ActionResult>;
  listOutboundWebhookDeliveries: (
    subscriptionId: string
  ) => Promise<ActionResult<OutboundWebhookDelivery[]>>;
};

const OUTBOUND_ACTIONS_MODULE = "../../../lib/webhooks/outbound/actions";

function unavailableResult<T>(): ActionResult<T> {
  return {
    success: false,
    error: "Outbound webhook actions are not available in this isolated worktree yet.",
  };
}

async function loadActions(): Promise<OutboundWebhookActions | null> {
  try {
    return (await import(OUTBOUND_ACTIONS_MODULE)) as OutboundWebhookActions;
  } catch (error) {
    console.warn("Outbound webhook actions module is not available", error);
    return null;
  }
}

export async function listOutboundEndpoints(): Promise<
  ActionResult<OutboundWebhookSubscription[]>
> {
  const actions = await loadActions();
  if (!actions) return unavailableResult();
  return actions.listOutboundWebhookSubscriptions();
}

export async function createOutboundEndpoint(
  input: CreateOutboundWebhookSubscriptionInput
): Promise<ActionResult<OutboundWebhookSubscription>> {
  const actions = await loadActions();
  if (!actions) return unavailableResult();
  return actions.createOutboundWebhookSubscription(input);
}

export async function toggleOutboundEndpoint(
  id: string,
  isActive: boolean
): Promise<ActionResult<OutboundWebhookSubscription>> {
  const actions = await loadActions();
  if (!actions) return unavailableResult();
  return actions.toggleOutboundWebhookSubscription(id, isActive);
}

export async function deleteOutboundEndpoint(id: string): Promise<ActionResult> {
  const actions = await loadActions();
  if (!actions) return unavailableResult();
  return actions.deleteOutboundWebhookSubscription(id);
}

export async function listOutboundDeliveries(
  subscriptionId: string
): Promise<ActionResult<OutboundWebhookDelivery[]>> {
  const actions = await loadActions();
  if (!actions) return unavailableResult();
  return actions.listOutboundWebhookDeliveries(subscriptionId);
}
