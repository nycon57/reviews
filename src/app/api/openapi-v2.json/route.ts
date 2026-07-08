import { NextResponse } from "next/server";
import { generateOpenApiV2Spec } from "@/lib/openapi/v2";

const CACHE_MAX_AGE = process.env.NODE_ENV === "production" ? 3600 : 0;

export async function GET() {
  try {
    return NextResponse.json(generateOpenApiV2Spec(), {
      headers: {
        "Cache-Control": `public, max-age=${CACHE_MAX_AGE}`,
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    console.error("Failed to generate OpenAPI v2 spec:", error);
    return NextResponse.json(
      { error: "Failed to generate OpenAPI v2 specification" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
