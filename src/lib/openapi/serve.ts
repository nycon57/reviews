import { NextResponse } from "next/server";

const CACHE_MAX_AGE = process.env.NODE_ENV === "production" ? 3600 : 0;

const OPENAPI_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
} as const;

export function serveOpenApiSpec(generator: () => unknown, label = "OpenAPI") {
  return {
    async GET() {
      try {
        return NextResponse.json(generator(), {
          headers: {
            "Cache-Control": `public, max-age=${CACHE_MAX_AGE}`,
            ...OPENAPI_HEADERS,
          },
        });
      } catch (error) {
        console.error(`Failed to generate ${label} spec:`, error);
        return NextResponse.json(
          { error: `Failed to generate ${label} specification` },
          { status: 500 }
        );
      }
    },

    async OPTIONS() {
      return new NextResponse(null, {
        status: 204,
        headers: OPENAPI_HEADERS,
      });
    },
  };
}
