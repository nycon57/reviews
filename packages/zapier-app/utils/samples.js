const samples = require("./sample-snapshot.json");

const outputFields = [
  { key: "id", label: "Event ID" },
  { key: "type", label: "Event Type" },
  { key: "created_at", label: "Created At" },
  { key: "organization_id", label: "Organization ID" },
  { key: "data__review_id", label: "Review ID" },
  { key: "data__rating", label: "Rating", type: "integer" },
  { key: "data__text", label: "Review Text" },
  { key: "data__reviewer_display_name", label: "Reviewer Display Name" },
  { key: "data__source", label: "Source" },
  { key: "data__review_date", label: "Review Date", type: "datetime" },
  { key: "data__professional__id", label: "Professional ID" },
  { key: "data__professional__full_name", label: "Professional Full Name" },
  { key: "data__public_url", label: "Public URL" },
  { key: "data__response_text", label: "Response Text" },
  { key: "data__responded_at", label: "Responded At", type: "datetime" },
  { key: "data__survey_id", label: "Survey ID" },
  { key: "data__completed_at", label: "Completed At", type: "datetime" },
  { key: "data__nps", label: "NPS", type: "integer" },
  { key: "data__contact_id", label: "Contact ID" },
  { key: "data__full_name", label: "Full Name" },
  { key: "data__email", label: "Email" },
  { key: "data__phone", label: "Phone" },
];

module.exports = {
  samples,
  outputFields,
};
