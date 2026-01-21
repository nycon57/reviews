import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  detectInactiveUsersAndStartSequences,
  processReengagementSequenceQueue,
} from "@/lib/email/reengagement-sequence-service";

// Zod schema for query parameters
const cronParamsSchema = z.object({
  batch_size: z.coerce
    .number()
    .int()
    .min(1, "Batch size must be at least 1")
    .max(100, "Batch size cannot exceed 100")
    .default(50),
  detect_only: z.coerce
    .boolean()
    .default(false),
  process_only: z.coerce
    .boolean()
    .default(false),
});

// Verify the request is from a valid cron job source
function verifyCronSecret(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;

  // If no secret is configured, only allow in development
  if (!cronSecret) {
    return process.env.NODE_ENV === "development";
  }

  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${cronSecret}`;
}

/**
 * POST /api/cron/process-reengagement
 *
 * This endpoint processes the re-engagement email sequence for inactive users.
 * It should be called by a cron job at regular intervals (recommended: once daily for detection,
 * every 5 minutes for queue processing).
 *
 * Features:
 * - Detects inactive users (7, 14, 30, 45 days without login)
 * - Sends personalized win-back emails
 * - Different messaging for paid vs free users
 * - Exits sequence when user logs back in
 * - Includes metrics they're missing (reviews received while away)
 *
 * Query Parameters:
 * - batch_size: Number of sequences to process (default: 50, max: 100)
 * - detect_only: Only run detection, don't process queue (default: false)
 * - process_only: Only process queue, don't detect new users (default: false)
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
      detect_only: url.searchParams.get("detect_only") ?? undefined,
      process_only: url.searchParams.get("process_only") ?? undefined,
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

    const { batch_size: batchSize, detect_only: detectOnly, process_only: processOnly } = parseResult.data;

    const response: {
      success: boolean;
      detection?: {
        newSequencesStarted: number;
        alreadyInSequence: number;
        errors: string[];
      };
      processing?: {
        processed: number;
        failed: number;
        skipped: number;
        exited: number;
        errors: string[];
      };
      timestamp: string;
    } = {
      success: true,
      timestamp: new Date().toISOString(),
    };

    // Run detection (unless process_only is true)
    if (!processOnly) {
      const detectionResult = await detectInactiveUsersAndStartSequences();
      response.detection = detectionResult;
    }

    // Process queue (unless detect_only is true)
    if (!detectOnly) {
      const processingResult = await processReengagementSequenceQueue(batchSize);
      response.processing = processingResult;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Re-engagement sequence cron job error:", error);

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
 * GET /api/cron/process-reengagement
 *
 * Health check endpoint for the re-engagement sequence processor.
 * Returns the current status of the endpoint.
 */
export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    status: "healthy",
    endpoint: "process-reengagement",
    description: "Re-engagement email sequence processor for inactive users",
    schedule: "Daily for detection, every 5 minutes for queue processing",
    features: [
      "4-email re-engagement sequence",
      "Inactive user detection (7, 14, 30, 45 days)",
      "Paid vs free user differentiation",
      "Exit on user login",
      "Missed reviews metrics",
      "Personal messaging ('from the team')",
    ],
    sequence_timing: {
      email_1: "7 days inactive - 'We miss you'",
      email_2: "14 days inactive - 'What's new'",
      email_3: "30 days inactive - 'Last chance'",
      email_4: "45 days inactive - 'Final email'",
    },
    timestamp: new Date().toISOString(),
  });
}
