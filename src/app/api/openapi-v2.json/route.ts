import { generateOpenApiV2Spec } from "@/lib/openapi/v2";
import { serveOpenApiSpec } from "@/lib/openapi/serve";

export const { GET, OPTIONS } = serveOpenApiSpec(
  generateOpenApiV2Spec,
  "OpenAPI v2"
);
