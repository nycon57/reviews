"use client";

import { webMcpToolSchemas, type WebMcpToolName } from "./schemas";

/** A parsed JSON response body, handed to the WebMCP host verbatim. */
type JsonBody =
  | string
  | number
  | boolean
  | null
  | JsonBody[]
  | { [key: string]: JsonBody };

type ModelContextTool = (typeof webMcpToolSchemas)[number] & {
  annotations: {
    readOnlyHint: true;
    untrustedContentHint: true;
  };
  execute: (input: unknown) => Promise<JsonBody>;
};

type WebMcpModelContext = {
  registerTool?: (
    tool: ModelContextTool,
    options?: { signal?: AbortSignal }
  ) => void | Promise<void>;
  provideContext?: (context: { tools: ModelContextTool[] }) => void | Promise<void>;
};

// WebMCP is a draft browser API, so `modelContext` is absent from lib.dom. Agents
// expose it on either navigator or document depending on the implementation.
declare global {
  interface Navigator {
    modelContext?: WebMcpModelContext;
  }
  interface Document {
    modelContext?: WebMcpModelContext;
  }
}

function getModelContext(): WebMcpModelContext | null {
  const modelContext =
    globalThis.navigator?.modelContext ?? globalThis.document?.modelContext;

  if (!modelContext) return null;
  if (
    typeof modelContext.registerTool !== "function" &&
    typeof modelContext.provideContext !== "function"
  ) {
    return null;
  }

  return modelContext;
}

function inputRecord(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  return input as Record<string, unknown>;
}

function stringInput(input: Record<string, unknown>, key: string): string | null {
  const value = input[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function numberInput(input: Record<string, unknown>, key: string): number | null {
  const value = input[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function integerInput(
  input: Record<string, unknown>,
  key: string,
  defaultValue: number,
  max?: number
): number {
  const value = numberInput(input, key);
  const integer = value === null ? defaultValue : Math.floor(value);
  const lowerBounded = Math.max(1, integer);
  return max ? Math.min(max, lowerBounded) : lowerBounded;
}

function appendString(params: URLSearchParams, name: string, value: string | null): void {
  if (value) params.set(name, value);
}

async function fetchJson(path: string): Promise<JsonBody> {
  const response = await fetch(path, {
    headers: {
      Accept: "application/json",
    },
  });
  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      body &&
      typeof body === "object" &&
      "message" in body &&
      typeof body.message === "string"
        ? body.message
        : `RepWell WebMCP request failed with ${response.status}`;
    throw new Error(message);
  }

  return body;
}

const executors: Record<WebMcpToolName, (input: unknown) => Promise<JsonBody>> = {
  searchProfessionals: async (input) => {
    const record = inputRecord(input);
    const params = new URLSearchParams();
    appendString(params, "name", stringInput(record, "name"));
    appendString(params, "industry", stringInput(record, "industry"));
    appendString(params, "location", stringInput(record, "location"));
    const minRating = numberInput(record, "min_rating");
    if (minRating !== null) {
      params.set("min_rating", String(Math.min(5, Math.max(1, minRating))));
    }

    const query = params.toString();
    return fetchJson(`/api/v2/professionals${query ? `?${query}` : ""}`);
  },
  getProfessionalProfile: async (input) => {
    const id = stringInput(inputRecord(input), "id");
    if (!id) throw new Error("id is required");
    return fetchJson(`/api/webmcp/professionals/${encodeURIComponent(id)}`);
  },
  getProfessionalReviews: async (input) => {
    const record = inputRecord(input);
    const id = stringInput(record, "id");
    if (!id) throw new Error("id is required");

    const params = new URLSearchParams({
      page: String(integerInput(record, "page", 1)),
      per_page: String(integerInput(record, "per_page", 10, 10)),
    });

    return fetchJson(
      `/api/webmcp/professionals/${encodeURIComponent(id)}/reviews?${params}`
    );
  },
  getCompanyProfile: async (input) => {
    const id = stringInput(inputRecord(input), "id");
    if (!id) throw new Error("id is required");
    return fetchJson(`/api/webmcp/companies/${encodeURIComponent(id)}`);
  },
};

const tools: ModelContextTool[] = webMcpToolSchemas.map((tool) => ({
  ...tool,
  annotations: {
    readOnlyHint: true,
    untrustedContentHint: true,
  },
  execute: executors[tool.name],
}));

export async function registerRepWellWebMcpTools(options?: {
  signal?: AbortSignal;
}): Promise<void> {
  const modelContext = getModelContext();
  if (!modelContext) return;

  try {
    if (typeof modelContext.registerTool === "function") {
      await Promise.all(
        tools.map((tool) =>
          Promise.resolve(modelContext.registerTool?.(tool, options)).catch(() => {
            // Duplicate or draft-API registration errors must not affect page UX.
          })
        )
      );
      return;
    }

    if (typeof modelContext.provideContext === "function") {
      await Promise.resolve(modelContext.provideContext({ tools })).catch(() => {
        // WebMCP is draft-only; unsupported shapes are intentionally silent.
      });
    }
  } catch {
    // Feature-detected WebMCP should never surface runtime errors to visitors.
  }
}
