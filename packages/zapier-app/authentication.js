const { getBaseUrl, unwrapData } = require("./utils/http");

const test = async (z) => {
  const response = await z.request({
    url: `${getBaseUrl()}/api/v1/organization`,
    method: "GET",
  });
  return response;
};

const connectionLabel = (_z, bundle) => {
  const organization = unwrapData({ data: bundle.inputData || {} });
  return organization.name || organization.slug || "RepWell";
};

module.exports = {
  type: "custom",
  fields: [
    {
      key: "api_key",
      label: "API Key",
      type: "password",
      required: true,
      helpText:
        "Create an API key in RepWell with the scopes needed by your Zap: https://repwell.ai/dashboard/organization?tab=api-keys",
    },
  ],
  test,
  connectionLabel,
};
