/**
 * Code Sample Generators
 * Generates code samples in multiple languages for API endpoints
 */

export type CodeLanguage = "curl" | "javascript" | "python";

export interface CodeSampleParams {
  method: string;
  path: string;
  baseUrl?: string;
  queryParams?: Record<string, string>;
  body?: Record<string, unknown>;
  description?: string;
}

/**
 * Generate a cURL code sample
 */
export function generateCurlSample(params: CodeSampleParams): string {
  const { method, path, baseUrl = "https://app.repwell.com", queryParams, body } = params;

  let url = `${baseUrl}${path}`;
  if (queryParams && Object.keys(queryParams).length > 0) {
    const qs = new URLSearchParams(queryParams).toString();
    url += `?${qs}`;
  }

  const lines: string[] = [
    `curl -X ${method.toUpperCase()} "${url}" \\`,
    `  -H "X-API-Key: YOUR_API_KEY" \\`,
    `  -H "Content-Type: application/json"`,
  ];

  if (body && Object.keys(body).length > 0) {
    lines[lines.length - 1] += " \\";
    lines.push(`  -d '${JSON.stringify(body, null, 2).split("\n").join("\n  ")}'`);
  }

  return lines.join("\n");
}

/**
 * Generate a JavaScript/TypeScript code sample using fetch
 */
export function generateJavaScriptSample(params: CodeSampleParams): string {
  const { method, path, baseUrl = "https://app.repwell.com", queryParams, body } = params;

  let url = `${baseUrl}${path}`;
  if (queryParams && Object.keys(queryParams).length > 0) {
    const qs = new URLSearchParams(queryParams).toString();
    url += `?${qs}`;
  }

  const options: string[] = [
    `  method: "${method.toUpperCase()}",`,
    `  headers: {`,
    `    "X-API-Key": "YOUR_API_KEY",`,
    `    "Content-Type": "application/json",`,
    `  },`,
  ];

  if (body && Object.keys(body).length > 0) {
    options.push(`  body: JSON.stringify(${JSON.stringify(body, null, 4).split("\n").join("\n  ")}),`);
  }

  return `const response = await fetch("${url}", {
${options.join("\n")}
});

const data = await response.json();
console.log(data);`;
}

/**
 * Generate a Python code sample using requests library
 */
export function generatePythonSample(params: CodeSampleParams): string {
  const { method, path, baseUrl = "https://app.repwell.com", queryParams, body } = params;

  const lines: string[] = ["import requests", ""];

  let url = `${baseUrl}${path}`;
  lines.push(`url = "${url}"`);

  lines.push(`headers = {`);
  lines.push(`    "X-API-Key": "YOUR_API_KEY",`);
  lines.push(`    "Content-Type": "application/json",`);
  lines.push(`}`);

  if (queryParams && Object.keys(queryParams).length > 0) {
    lines.push("");
    lines.push(`params = ${JSON.stringify(queryParams, null, 4).replace(/"/g, '"')}`);
  }

  if (body && Object.keys(body).length > 0) {
    lines.push("");
    lines.push(`payload = ${JSON.stringify(body, null, 4)}`);
  }

  lines.push("");

  const methodLower = method.toLowerCase();
  const requestArgs: string[] = ["url", "headers=headers"];

  if (queryParams && Object.keys(queryParams).length > 0) {
    requestArgs.push("params=params");
  }

  if (body && Object.keys(body).length > 0) {
    requestArgs.push("json=payload");
  }

  lines.push(`response = requests.${methodLower}(${requestArgs.join(", ")})`);
  lines.push(`data = response.json()`);
  lines.push(`print(data)`);

  return lines.join("\n");
}

/**
 * Generate code samples for all supported languages
 */
export function generateCodeSamples(params: CodeSampleParams): Record<CodeLanguage, string> {
  return {
    curl: generateCurlSample(params),
    javascript: generateJavaScriptSample(params),
    python: generatePythonSample(params),
  };
}

/**
 * Example request bodies for different endpoints
 */
export const exampleRequestBodies: Record<string, Record<string, unknown>> = {
  "POST /api/v1/surveys": {
    user_email: "john.smith@company.com",
    customer_name: "Jane Doe",
    customer_email: "jane.doe@example.com",
    customer_phone: "+1 (555) 123-4567",
    transaction_id: "LOAN-2024-001",
    transaction_type: "Purchase",
    delay_hours: 24,
  },
  "POST /api/v1/branches": {
    name: "Downtown Branch",
    slug: "downtown-branch",
    address: {
      street: "123 Main Street",
      city: "New York",
      state: "NY",
      postal_code: "10001",
      country: "US",
    },
    phone: "+1 (555) 123-4567",
    email: "downtown@example.com",
  },
  "POST /api/v1/reviews/{id}/respond": {
    response_text: "Thank you for your wonderful review! We truly appreciate your business and look forward to serving you again.",
  },
  "POST /api/v1/users/invite": {
    email: "newuser@company.com",
    role: "user",
    first_name: "John",
    last_name: "Smith",
  },
  "PATCH /api/v1/loan-officers/{id}": {
    full_name: "John Smith",
    title: "Senior Loan Officer",
    bio: "Experienced mortgage professional with 10+ years in the industry.",
    is_active: true,
  },
};

/**
 * Example query parameters for list endpoints
 */
export const exampleQueryParams: Record<string, Record<string, string>> = {
  "GET /api/v1/surveys": {
    page: "1",
    page_size: "25",
    status: "completed",
  },
  "GET /api/v1/reviews": {
    page: "1",
    page_size: "25",
    min_rating: "4",
    platform: "google",
  },
  "GET /api/v1/branches": {
    page: "1",
    is_active: "true",
  },
  "GET /api/v1/loan-officers": {
    page: "1",
    is_active: "true",
  },
  "GET /api/v1/users": {
    page: "1",
    role: "user",
  },
};
