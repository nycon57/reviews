import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { timingSafeEqual } from "crypto";
import {
  processRecoveryEmail1Queue,
  processRecoveryEmail2Queue,
  expireOldAbandonedActions,
} from "@/lib/email/abandoned-action-recovery-service";

// Zod schema for query parameters
const cronParamsSchema = z.object({
  batch_size: z.coerce
    .number()
    .int()
    .min(1, "Batch size must be at least 1")
    .max(100, "Batch size cannot exceed 100")
    .default(50),
  email_1_only: z.coerce.boolean().default(false),
  email_2_only: z.coerce.boolean().default(false),
  skip_expire: z.coerce.boolean().default(false),
});

/**
 * Verify the request is from a valid cron job source
 * Uses timing-safe comparison to prevent timing attacks
 */
function verifyCronSecret(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;

  // SECURITY: Require CRON_SECRET in production to prevent unauthorized access
  if (!cronSecret) {
    if (process.env.NODE_ENV === "development") {
      return true; // Allow in development only
    }
    console.error("CRON_SECRET is not configured - denying access");
    return false;
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return false;
  }

  const expectedHeader = `Bearer ${cronSecret}`;

  // Use timing-safe comparison to prevent timing attacks
  if (authHeader.length !== expectedHeader.length) {
    return false;
  }

  try {
    return timingSafeEqual(
      Buffer.from(authHeader, "utf8"),
      Buffer.from(expectedHeader, "utf8")
    );
  } catch {
    return false;
  }
}

/**
 * POST /api/cron/process-abandoned-actions
 *
 * This endpoint processes the abandoned action recovery email queue.
 * It should be called by a cron job at regular intervals (recommended: every 5 minutes).
 *
 * Features:
 * - Processes recovery email 1 queue (1 hour after action start)
 * - Processes recovery email 2 queue (24 hours after action start)
 * - Expires old abandoned actions (after 7 days)
 *
 * Action Types:
 * - survey_creation: Started creating a survey template
 * - survey_send: Selected contacts but didn't send
 * - video_request: Started video testimonial request
 * - billing_upgrade: Visited pricing/upgrade page
 * - profile_completion: Started editing profile
 * - integration_setup: Started OAuth/integration setup
 *
 * Email Schedule:
 * - Email 1: 1 hour after action start (gentle reminder)
 * - Email 2: 24 hours after action start (more urgency)
 *
 * Query Parameters:
 * - batch_size: Number of actions to process per queue (default: 50, max: 100)
 * - email_1_only: Only process email 1 queue (default: false)
 * - email_2_only: Only process email 2 queue (default: false)
 * - skip_expire: Skip expiring old actions (default: false)
 */
export async function POST(request: NextRequest) {
  // Verify the request is authorized
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Validate and parse query params with Zod
    const url = new URL(request.url);
    const parseResult = cronParamsSchema.safeParse({
      batch_size: url.searchParams.get("batch_size") ?? undefined,
      email_1_only: url.searchParams.get("email_1_only") ?? undefined,
      email_2_only: url.searchParams.get("email_2_only") ?? undefined,
      skip_expire: url.searchParams.get("skip_expire") ?? undefined,
    });

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: parseResult.error.errors[0]?.message || "Invalid parameters",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const {
      batch_size: batchSize,
      email_1_only: email1Only,
      email_2_only: email2Only,
      skip_expire: skipExpire,
    } = parseResult.data;

    const response: {
      success: boolean;
      email1Queue?: {
        processed: number;
        failed: number;
        skipped: number;
        errors: string[];
      };
      email2Queue?: {
        processed: number;
        failed: number;
        skipped: number;
        errors: string[];
      };
      expiredActions?: number;
      timestamp: string;
    } = {
      success: true,
      timestamp: new Date().toISOString(),
    };

    // Process email 1 queue (unless email_2_only is true)
    if (!email2Only) {
      const email1Result = await processRecoveryEmail1Queue(batchSize);
      response.email1Queue = email1Result;
    }

    // Process email 2 queue (unless email_1_only is true)
    if (!email1Only) {
      const email2Result = await processRecoveryEmail2Queue(batchSize);
      response.email2Queue = email2Result;
    }

    // Expire old actions (unless skip_expire is true)
    if (!skipExpire) {
      const expiredCount = await expireOldAbandonedActions();
      response.expiredActions = expiredCount;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Abandoned action recovery cron job error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cron/process-abandoned-actions
 *
 * Health check endpoint for the abandoned action recovery processor.
 * Returns the current status of the endpoint.
 */
export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    status: "healthy",
    endpoint: "process-abandoned-actions",
    description: "Abandoned action recovery email processor",
    schedule: "Every 5 minutes for queue processing",
    features: [
      "Recovery email 1: 1 hour after action start",
      "Recovery email 2: 24 hours after action start",
      "Action expiration: 7 days without completion",
      "Tracks: survey_creation, survey_send, video_request, billing_upgrade, profile_completion, integration_setup",
    ],
    query_params: {
      batch_size: "Number of actions to process per queue (default: 50, max: 100)",
      email_1_only: "Only process email 1 queue (default: false)",
      email_2_only: "Only process email 2 queue (default: false)",
      skip_expire: "Skip expiring old actions (default: false)",
    },
    timestamp: new Date().toISOString(),
  });
}
