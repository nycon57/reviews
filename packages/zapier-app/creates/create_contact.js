const { getBaseUrl, unwrapData, compact } = require("../utils/http");

const perform = async (z, bundle) => {
  const response = await z.request({
    url: `${getBaseUrl()}/api/v1/contacts`,
    method: "POST",
    body: compact({
      full_name: bundle.inputData.full_name,
      email: bundle.inputData.email,
      phone: bundle.inputData.phone,
      external_id: bundle.inputData.external_id,
    }),
  });

  return unwrapData(response);
};

module.exports = {
  key: "create_contact",
  noun: "Contact",
  display: {
    label: "Create Contact",
    description: "Creates or updates a contact in RepWell.",
  },
  operation: {
    perform,
    inputFields: [
      { key: "full_name", label: "Full Name", type: "string", required: false },
      { key: "email", label: "Email", type: "string", required: false },
      { key: "phone", label: "Phone", type: "string", required: false },
      { key: "external_id", label: "External ID", type: "string", required: false },
    ],
    sample: {
      id: "contact_123",
      full_name: "Avery Stone",
      email: "avery@example.com",
      phone: "+15551234567",
      external_id: "crm_123",
      created_at: "2026-07-08T12:00:00.000Z",
    },
    outputFields: [
      { key: "id", label: "Contact ID" },
      { key: "full_name", label: "Full Name" },
      { key: "email", label: "Email" },
      { key: "phone", label: "Phone" },
      { key: "external_id", label: "External ID" },
      { key: "created_at", label: "Created At" },
    ],
  },
};
