const { getBaseUrl, unwrapData } = require("./http");
const { samples, outputFields } = require("./samples");

const normalizeList = (data) => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.items)) return data.items;
  if (data && Array.isArray(data.reviews)) return data.reviews;
  if (data && Array.isArray(data.contacts)) return data.contacts;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
};

const reviewPayload = (review, eventType) => ({
  review_id: review.id || review.review_id,
  rating: review.rating,
  text: review.review_text || review.text || null,
  customer_name: review.reviewer_name || review.customer_name || review.customer || null,
  source: review.platform || review.source || null,
  published_at: review.published_at || review.review_date || review.created_at || null,
  response_text: review.response_text || null,
  responded_at: review.response_date || review.responded_at || null,
  status: review.status || null,
  event_context: eventType,
});

const contactPayload = (contact) => ({
  contact_id: contact.id || contact.contact_id,
  full_name: contact.full_name || contact.name || null,
  email: contact.email || null,
  phone: contact.phone || null,
  external_id: contact.external_id || null,
  created_at: contact.created_at || null,
});

const toEnvelope = (eventType, resource) => ({
  id: `evt_${eventType.replace(".", "_")}_${resource.id || resource.contact_id || "sample"}`,
  type: eventType,
  created_at: resource.created_at || new Date().toISOString(),
  organization_id: resource.organization_id || "org_unknown",
  data:
    eventType === "contact.created" ? contactPayload(resource) : reviewPayload(resource, eventType),
});

const getSampleList = async (z, eventType) => {
  if (eventType === "survey.completed") {
    return [samples[eventType]];
  }

  const endpoint = eventType === "contact.created" ? "/api/v1/contacts" : "/api/v1/reviews";
  const response = await z.request({
    url: `${getBaseUrl()}${endpoint}`,
    method: "GET",
    params: { page_size: 3 },
  });

  const resources = normalizeList(unwrapData(response));
  if (resources.length === 0) {
    return [samples[eventType]];
  }

  return resources.map((resource) => toEnvelope(eventType, resource));
};

const createRestHookTrigger = ({ key, noun, label, description, eventType }) => {
  const performSubscribe = async (z, bundle) => {
    const response = await z.request({
      url: `${getBaseUrl()}/api/v1/webhooks/subscriptions`,
      method: "POST",
      body: {
        target_url: bundle.targetUrl,
        events: [eventType],
        description: `Zapier ${label}`,
      },
    });

    return unwrapData(response);
  };

  const performUnsubscribe = async (z, bundle) => {
    const subscriptionId = bundle.subscribeData && bundle.subscribeData.id;
    if (!subscriptionId) return {};

    await z.request({
      url: `${getBaseUrl()}/api/v1/webhooks/subscriptions/${subscriptionId}`,
      method: "DELETE",
    });

    return {};
  };

  const perform = (_z, bundle) => [bundle.cleanedRequest];

  const performList = (z) => getSampleList(z, eventType);

  return {
    key,
    noun,
    display: {
      label,
      description,
    },
    operation: {
      type: "hook",
      performSubscribe,
      performUnsubscribe,
      perform,
      performList,
      sample: samples[eventType],
      outputFields,
    },
  };
};

module.exports = {
  createRestHookTrigger,
};
