/**
 * OpenAPI Specification Endpoint
 * Serves the OpenAPI 3.0 spec for the RepWell API
 */

import { NextResponse } from 'next/server';
import { generateOpenApiSpec } from '@/lib/openapi';

// Cache the spec for 1 hour in production
const CACHE_MAX_AGE = process.env.NODE_ENV === 'production' ? 3600 : 0;

export async function GET() {
  try {
    const spec = generateOpenApiSpec();

    return NextResponse.json(spec, {
      headers: {
        'Cache-Control': `public, max-age=${CACHE_MAX_AGE}`,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Failed to generate OpenAPI spec:', error);
    return NextResponse.json(
      { error: 'Failed to generate OpenAPI specification' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
