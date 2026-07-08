const now = "2026-07-08T12:00:00.000Z";

const reviewData = {
  review_id: "rev_123",
  rating: 5,
  text: "Clear communication and a smooth process from start to finish.",
  customer_name: "Jordan Lee",
  source: "google",
  published_at: now,
  response_text: null,
  responded_at: null,
};

const negativeReviewData = {
  ...reviewData,
  review_id: "rev_negative_123",
  rating: 2,
  text: "The timeline changed and I did not know what to expect.",
};

const responseData = {
  ...reviewData,
  review_id: "rev_response_123",
  response_text: "Thank you for sharing your experience. We appreciate the kind words.",
  responded_at: now,
};

const surveyData = {
  survey_id: "surv_123",
  customer_name: "Taylor Morgan",
  customer_email: "taylor@example.com",
  score: 10,
  completed_at: now,
  professional_id: "user_123",
};

const contactData = {
  contact_id: "contact_123",
  full_name: "Avery Stone",
  email: "avery@example.com",
  phone: "+15551234567",
  external_id: "crm_123",
  created_at: now,
};

const envelope = (type, data) => ({
  id: `evt_${type.replace(".", "_")}_sample`,
  type,
  created_at: now,
  organization_id: "org_123",
  data,
});

const samples = {
  "review.published": envelope("review.published", reviewData),
  "review.negative": envelope("review.negative", negativeReviewData),
  "review.responded": envelope("review.responded", responseData),
  "survey.completed": envelope("survey.completed", surveyData),
  "contact.created": envelope("contact.created", contactData),
};

const outputFields = [
  { key: "id", label: "Event ID" },
  { key: "type", label: "Event Type" },
  { key: "created_at", label: "Created At" },
  { key: "organization_id", label: "Organization ID" },
  { key: "data__review_id", label: "Review ID" },
  { key: "data__rating", label: "Rating", type: "integer" },
  { key: "data__text", label: "Review Text" },
  { key: "data__customer_name", label: "Customer Name" },
  { key: "data__source", label: "Source" },
  { key: "data__response_text", label: "Response Text" },
  { key: "data__survey_id", label: "Survey ID" },
  { key: "data__score", label: "Survey Score", type: "integer" },
  { key: "data__contact_id", label: "Contact ID" },
  { key: "data__full_name", label: "Full Name" },
  { key: "data__email", label: "Email" },
  { key: "data__phone", label: "Phone" },
  { key: "data__external_id", label: "External ID" },
];

module.exports = {
  samples,
  outputFields,
};
