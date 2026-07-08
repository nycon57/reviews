const { getBaseUrl, unwrapData, compact } = require("../utils/http");

const perform = async (z, bundle) => {
  const delayHours =
    bundle.inputData.delay_hours === undefined || bundle.inputData.delay_hours === ""
      ? undefined
      : Number(bundle.inputData.delay_hours);

  const response = await z.request({
    url: `${getBaseUrl()}/api/v1/surveys`,
    method: "POST",
    body: compact({
      user_id: bundle.inputData.user_id,
      user_email: bundle.inputData.user_email,
      template_id: bundle.inputData.template_id,
      customer_name: bundle.inputData.customer_name,
      customer_email: bundle.inputData.customer_email,
      customer_phone: bundle.inputData.customer_phone,
      transaction_id: bundle.inputData.transaction_id,
      transaction_type: bundle.inputData.transaction_type,
      transaction_date: bundle.inputData.transaction_date,
      delay_hours: delayHours,
    }),
  });

  return unwrapData(response);
};

module.exports = {
  key: "trigger_survey",
  noun: "Survey",
  display: {
    label: "Trigger Survey",
    description: "Creates a RepWell survey request and queues it for delivery.",
  },
  operation: {
    perform,
    inputFields: [
      {
        key: "user_email",
        label: "Professional Email",
        type: "string",
        required: true,
        helpText: "RepWell uses this to assign the survey to the right professional.",
      },
      { key: "user_id", label: "Professional User ID", type: "string", required: false },
      { key: "template_id", label: "Survey Template ID", type: "string", required: false },
      { key: "customer_name", label: "Customer Name", type: "string", required: true },
      { key: "customer_email", label: "Customer Email", type: "string", required: true },
      { key: "customer_phone", label: "Customer Phone", type: "string", required: false },
      { key: "transaction_id", label: "Transaction ID", type: "string", required: false },
      { key: "transaction_type", label: "Transaction Type", type: "string", required: false },
      { key: "transaction_date", label: "Transaction Date", type: "datetime", required: false },
      { key: "delay_hours", label: "Delay Hours", type: "integer", required: false },
    ],
    sample: {
      id: "surv_123",
      customer_name: "Taylor Morgan",
      customer_email: "taylor@example.com",
      customer_phone: "+15551234567",
      status: "pending",
      source: "api",
      created_at: "2026-07-08T12:00:00.000Z",
    },
    outputFields: [
      { key: "id", label: "Survey ID" },
      { key: "customer_name", label: "Customer Name" },
      { key: "customer_email", label: "Customer Email" },
      { key: "status", label: "Status" },
      { key: "created_at", label: "Created At" },
      { key: "expires_at", label: "Expires At" },
    ],
  },
};
