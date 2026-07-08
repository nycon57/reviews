import type {
  ContactCreatedWebhookData,
  OutboundWebhookDataByType,
  OutboundWebhookEnvelope,
  ReviewRespondedWebhookData,
  ReviewWebhookData,
  SurveyCompletedWebhookData,
} from "./types";

const ORGANIZATION_ID = "00000000-0000-4000-8000-000000000001";
const EVENT_ID = "00000000-0000-4000-8000-000000000101";

export const reviewPublishedSampleData: ReviewWebhookData = {
  review_id: "00000000-0000-4000-8000-000000000201",
  rating: 5,
  text: "Great communication and a smooth closing from start to finish.",
  reviewer_display_name: "Jordan Lee",
  source: "google",
  review_date: "2026-01-15T17:45:00.000Z",
  professional: {
    id: "00000000-0000-4000-8000-000000000301",
    full_name: "Avery Morgan",
  },
  public_url: "https://repwell.ai/pro/avery-morgan",
};

export const reviewNegativeSampleData: ReviewWebhookData = {
  review_id: "00000000-0000-4000-8000-000000000202",
  rating: 2,
  text: "The process took longer than expected and updates were hard to get.",
  reviewer_display_name: "Casey Rivera",
  source: "internal",
  review_date: "2026-01-16T13:20:00.000Z",
  professional: {
    id: "00000000-0000-4000-8000-000000000302",
    full_name: "Sam Patel",
  },
  public_url: null,
};

export const reviewRespondedSampleData: ReviewRespondedWebhookData = {
  review_id: "00000000-0000-4000-8000-000000000201",
  response_text:
    "Thank you for the kind words. It was a pleasure helping with your loan.",
  responded_at: "2026-01-17T15:05:00.000Z",
};

export const surveyCompletedSampleData: SurveyCompletedWebhookData = {
  survey_id: "00000000-0000-4000-8000-000000000401",
  contact_id: "00000000-0000-4000-8000-000000000501",
  completed_at: "2026-01-18T19:30:00.000Z",
  rating: 5,
  nps: 10,
};

export const contactCreatedSampleData: ContactCreatedWebhookData = {
  contact_id: "00000000-0000-4000-8000-000000000501",
  full_name: "Jordan Lee",
  email: "jordan.lee@example.com",
  phone: "+15551234567",
  source: "survey",
};

export const outboundWebhookSamplePayloads = {
  "review.published": {
    id: EVENT_ID,
    type: "review.published",
    created_at: "2026-01-15T17:45:01.000Z",
    organization_id: ORGANIZATION_ID,
    data: reviewPublishedSampleData,
  },
  "review.negative": {
    id: EVENT_ID,
    type: "review.negative",
    created_at: "2026-01-16T13:20:01.000Z",
    organization_id: ORGANIZATION_ID,
    data: reviewNegativeSampleData,
  },
  "review.responded": {
    id: EVENT_ID,
    type: "review.responded",
    created_at: "2026-01-17T15:05:01.000Z",
    organization_id: ORGANIZATION_ID,
    data: reviewRespondedSampleData,
  },
  "survey.completed": {
    id: EVENT_ID,
    type: "survey.completed",
    created_at: "2026-01-18T19:30:01.000Z",
    organization_id: ORGANIZATION_ID,
    data: surveyCompletedSampleData,
  },
  "contact.created": {
    id: EVENT_ID,
    type: "contact.created",
    created_at: "2026-01-18T20:00:01.000Z",
    organization_id: ORGANIZATION_ID,
    data: contactCreatedSampleData,
  },
} satisfies {
  [K in keyof OutboundWebhookDataByType]: OutboundWebhookEnvelope<K>;
};

export type OutboundWebhookSamplePayloads = typeof outboundWebhookSamplePayloads;
