import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { timingSafeEqual } from "crypto";
import {
  detectInactiveUsersAndStartSequences,
  processReengagementSequenceQueue,
} from "@/lib/email/reengagement-sequence-service";
import { withCronHeartbeat } from "@/lib/cron/heartbeat";

// Zod schema for query parameters
const cronParamsSchema = z.object({
  batch_size: z.coerce
    .number()
    .int()
    .min(1, "Batch size must be at least 1")
    .max(100, "Batch size cannot exceed 100")
    .default(50),
  detect_only: z.coerce.boolean().default(false),
  process_only: z.coerce.boolean().default(false),
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
    return timingSafeEqual(Buffer.from(authHeader, "utf8"), Buffer.from(expectedHeader, "utf8"));
  } catch {
    return false;
  }
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

  return withCronHeartbeat("process-reengagement", async () => {
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

      const {
        batch_size: batchSize,
        detect_only: detectOnly,
        process_only: processOnly,
      } = parseResult.data;

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
  });
}

// Vercel Cron triggers this endpoint with a GET request (carrying the
// Authorization: Bearer <CRON_SECRET> header). Delegate to POST so the job
// actually runs its work on the scheduled trigger.
export async function GET(request: NextRequest) {
  return POST(request);
}
