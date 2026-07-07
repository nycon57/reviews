import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { timingSafeEqual } from "crypto";
import {
  processRenewalReminders,
  processCancellationFeedbackRequests,
} from "@/lib/email/subscription-service";

const cronParamsSchema = z
  .object({
    renewals_only: z.coerce.boolean().default(false),
    feedback_only: z.coerce.boolean().default(false),
  })
  .refine(
    (data) => !(data.renewals_only && data.feedback_only),
    { message: "Cannot set both renewals_only and feedback_only to true" }
  );

function verifyCronSecret(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    if (process.env.NODE_ENV === "development") {
      return true;
    }
    console.error("CRON_SECRET is not configured - denying access");
    return false;
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return false;
  }

  const expectedHeader = `Bearer ${cronSecret}`;

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
 * POST /api/cron/process-subscription-lifecycle
 *
 * Processes subscription lifecycle emails:
 * - Renewal reminders (14 days before annual renewal, fallback for Stripe invoice.upcoming)
 * - Cancellation feedback requests (2 days after cancellation)
 *
 * Recommended schedule: once daily
 *
 * Query Parameters:
 * - renewals_only: Only process renewal reminders (default: false)
 * - feedback_only: Only process cancellation feedback (default: false)
 */
export async function POST(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const parseResult = cronParamsSchema.safeParse({
      renewals_only: url.searchParams.get("renewals_only") ?? undefined,
      feedback_only: url.searchParams.get("feedback_only") ?? undefined,
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

    const { renewals_only: renewalsOnly, feedback_only: feedbackOnly } =
      parseResult.data;

    const response: {
      success: boolean;
      renewalReminders?: { processed: number; failed: number; errors: string[] };
      cancellationFeedback?: { processed: number; failed: number; errors: string[] };
      timestamp: string;
    } = {
      success: true,
      timestamp: new Date().toISOString(),
    };

    if (!feedbackOnly) {
      response.renewalReminders = await processRenewalReminders();
    }

    if (!renewalsOnly) {
      response.cancellationFeedback =
        await processCancellationFeedbackRequests();
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Subscription lifecycle cron job error:", error);

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

// Vercel Cron triggers this endpoint with a GET request (carrying the
// Authorization: Bearer <CRON_SECRET> header). Delegate to POST so the job
// actually runs its work on the scheduled trigger.
export async function GET(request: NextRequest) {
  return POST(request);
}
