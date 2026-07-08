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

const professionalPayload = (review) => ({
  id: (review.professional && review.professional.id) || review.user_id || null,
  full_name:
    review.professional_full_name ||
    review.user_full_name ||
    (review.professional && review.professional.full_name) ||
    null,
});

const reviewPayload = (review) => ({
  review_id: review.id || review.review_id,
  rating: review.rating,
  text: review.review_text || review.text || null,
  reviewer_display_name:
    review.reviewer_display_name ||
    review.reviewer_name ||
    null,
  source: review.platform || review.source || null,
  review_date: review.review_date || review.created_at || null,
  professional: professionalPayload(review),
  public_url: review.public_url || review.source_url || null,
});

const reviewRespondedPayload = (review) => ({
  review_id: review.id || review.review_id,
  response_text: review.response_text || null,
  responded_at: review.responded_at || review.response_date || review.updated_at || null,
});

const contactPayload = (contact) => ({
  contact_id: contact.id || contact.contact_id,
  full_name: contact.full_name || contact.name || null,
  email: contact.email || null,
  phone: contact.phone || null,
  source: contact.source || null,
});

const dataPayload = (eventType, resource) => {
  if (eventType === "contact.created") return contactPayload(resource);
  if (eventType === "review.responded") return reviewRespondedPayload(resource);
  return reviewPayload(resource);
};

const toEnvelope = (eventType, resource) => ({
  id: `evt_${eventType.replace(".", "_")}_${resource.id || resource.contact_id || "sample"}`,
  type: eventType,
  created_at: resource.created_at || new Date().toISOString(),
  organization_id: resource.organization_id || "org_unknown",
  data: dataPayload(eventType, resource),
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
