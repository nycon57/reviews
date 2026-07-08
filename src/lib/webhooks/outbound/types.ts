import type { Json } from "@/types/database.types";

export const OUTBOUND_WEBHOOK_EVENTS = [
  "review.published",
  "review.negative",
  "review.responded",
  "survey.completed",
  "contact.created",
] as const;

export type OutboundWebhookEventType = (typeof OUTBOUND_WEBHOOK_EVENTS)[number];

export interface ReviewWebhookData {
  review_id: string;
  rating: number;
  text: string | null;
  reviewer_display_name: string | null;
  source: string;
  review_date: string;
  professional: {
    id: string | null;
    full_name: string | null;
  };
  public_url: string | null;
}

export interface ReviewRespondedWebhookData {
  review_id: string;
  response_text: string;
  responded_at: string;
}

export interface SurveyCompletedWebhookData {
  survey_id: string;
  contact_id: string | null;
  completed_at: string;
  rating: number | null;
  nps: number | null;
}

export interface ContactCreatedWebhookData {
  contact_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  source: string | null;
}

export type OutboundWebhookDataByType = {
  "review.published": ReviewWebhookData;
  "review.negative": ReviewWebhookData;
  "review.responded": ReviewRespondedWebhookData;
  "survey.completed": SurveyCompletedWebhookData;
  "contact.created": ContactCreatedWebhookData;
};

export type OutboundWebhookData<T extends OutboundWebhookEventType> =
  OutboundWebhookDataByType[T];

export interface OutboundWebhookEnvelope<T extends OutboundWebhookEventType> {
  id: string;
  type: T;
  created_at: string;
  organization_id: string;
  data: OutboundWebhookData<T>;
}

export type OutboundWebhookJson = Json;
