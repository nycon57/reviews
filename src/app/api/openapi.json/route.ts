/**
 * OpenAPI Specification Endpoint
 * Serves the OpenAPI 3.0 spec for the RepWell API
 */

import { generateOpenApiSpec } from "@/lib/openapi";
import { serveOpenApiSpec } from "@/lib/openapi/serve";

export const { GET, OPTIONS } = serveOpenApiSpec(
  generateOpenApiSpec,
  "OpenAPI"
);
