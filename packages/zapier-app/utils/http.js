const API_BASE_URL = "https://repwell.ai";

const getBaseUrl = () => (process.env.BASE_URL || API_BASE_URL).replace(/\/+$/, "");

const unwrapData = (response) => {
  const body = response.data;
  if (body && typeof body === "object" && Object.prototype.hasOwnProperty.call(body, "data")) {
    return body.data;
  }
  return body;
};

const includeApiKey = (request, _z, bundle) => {
  request.headers = request.headers || {};
  if (bundle.authData && bundle.authData.api_key) {
    request.headers["X-API-Key"] = bundle.authData.api_key;
  }
  return request;
};

const handleHttpError = (response, z) => {
  if (response.status >= 400) {
    const detail =
      response.data && response.data.error
        ? response.data.error.message || response.data.error
        : response.content;
    throw new z.errors.Error(
      detail || `RepWell API request failed with ${response.status}`,
      "RepWellApiError",
      response.status
    );
  }
  return response;
};

const compact = (input) =>
  Object.fromEntries(
    Object.entries(input).filter(
      ([, value]) => value !== undefined && value !== null && value !== ""
    )
  );

module.exports = {
  getBaseUrl,
  unwrapData,
  includeApiKey,
  handleHttpError,
  compact,
};
