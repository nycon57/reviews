/**
 * Announcement Send API Route (S088)
 *
 * Sends or schedules an announcement to the selected audience.
 * Admin-only endpoint.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import {
  createAnnouncement,
  sendAnnouncement,
} from "@/lib/email/announcement-service";
import type { AnnouncementType, AnnouncementAudience } from "@/lib/email/types";

// Send request schema
const sendSchema = z.object({
  // Announcement data
  type: z.enum(["feature", "update", "maintenance", "security"]),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  content: z.string().min(1),
  imageUrl: z.string().url().optional().or(z.literal("")),
  gifUrl: z.string().url().optional().or(z.literal("")),
  ctaText: z.string().optional(),
  ctaUrl: z.string().url().optional().or(z.literal("")),
  secondaryCtaText: z.string().optional(),
  secondaryCtaUrl: z.string().url().optional().or(z.literal("")),
  maintenanceStartAt: z.string().optional(),
  maintenanceEndAt: z.string().optional(),
  affectedServices: z.array(z.string()).optional(),
  // Audience targeting
  audience: z.enum([
    "all",
    "admins_only",
    "managers_only",
    "loan_officers_only",
    "free_tier",
    "starter_tier",
    "professional_tier",
    "enterprise_tier",
    "trial_users",
    "custom",
  ]),
  customFilter: z.record(z.unknown()).optional(),
  // Scheduling
  scheduledAt: z.string().datetime().optional(),
  // Existing announcement ID (if sending an existing draft)
  announcementId: z.string().uuid().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated and is admin
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userError || userData?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const validated = sendSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const {
      type,
      title,
      subtitle,
      content,
      imageUrl,
      gifUrl,
      ctaText,
      ctaUrl,
      secondaryCtaText,
      secondaryCtaUrl,
      maintenanceStartAt,
      maintenanceEndAt,
      affectedServices,
      audience,
      customFilter,
      scheduledAt,
      announcementId,
    } = validated.data;

    let finalAnnouncementId = announcementId;

    // If no existing announcement ID, create announcement
    if (!finalAnnouncementId) {
      const createResult = await createAnnouncement({
        title,
        subtitle: subtitle || undefined,
        content,
        type: type as AnnouncementType,
        audience: audience as AnnouncementAudience,
        customFilter: customFilter || undefined,
        imageUrl: imageUrl || undefined,
        gifUrl: gifUrl || undefined,
        ctaText: ctaText || undefined,
        ctaUrl: ctaUrl || undefined,
        secondaryCtaText: secondaryCtaText || undefined,
        secondaryCtaUrl: secondaryCtaUrl || undefined,
        maintenanceStartAt: maintenanceStartAt || undefined,
        maintenanceEndAt: maintenanceEndAt || undefined,
        affectedServices: affectedServices || undefined,
        scheduledAt: scheduledAt || undefined,
        createdBy: user.id,
      });

      if (!createResult.success || !createResult.announcementId) {
        return NextResponse.json(
          { error: createResult.error || "Failed to create announcement" },
          { status: 500 }
        );
      }

      finalAnnouncementId = createResult.announcementId;
    }

    // If scheduled for later, return success with scheduled status
    if (scheduledAt) {
      const scheduledDate = new Date(scheduledAt);
      if (scheduledDate > new Date()) {
        return NextResponse.json({
          success: true,
          announcementId: finalAnnouncementId,
          status: "scheduled",
          scheduledAt,
          message: `Announcement scheduled for ${scheduledDate.toLocaleString()}`,
        });
      }
    }

    // Send immediately
    const result = await sendAnnouncement(finalAnnouncementId);

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.errors.length > 0 ? result.errors[0] : "Failed to send announcement",
          details: result,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      announcementId: finalAnnouncementId,
      status: "sent",
      recipientCount: result.recipientCount,
      sentCount: result.sentCount,
      failedCount: result.failedCount,
      message: `Announcement sent to ${result.sentCount} of ${result.recipientCount} recipients`,
    });
  } catch (error) {
    console.error("Send announcement error:", error);
    return NextResponse.json(
      { error: "Failed to send announcement" },
      { status: 500 }
    );
  }
}
