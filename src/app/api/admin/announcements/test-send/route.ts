/**
 * Announcement Test Send API Route (S088)
 *
 * Sends a test email for an announcement to a specified email address.
 * Admin-only endpoint.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import {
  createAnnouncement,
  sendTestAnnouncement,
} from "@/lib/email/announcement-service";
import type { AnnouncementType, AnnouncementAudience } from "@/lib/email/types";

// Test send request schema
const testSendSchema = z.object({
  // Announcement data (for creating temp announcement)
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
  ]).optional(),
  // Test recipient info
  testEmail: z.string().email(),
  testFirstName: z.string().optional(),
  testOrganizationName: z.string().optional(),
  // Existing announcement ID (if testing an existing draft)
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
    const validated = testSendSchema.safeParse(body);

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
      testEmail,
      testFirstName,
      testOrganizationName,
      announcementId,
    } = validated.data;

    let finalAnnouncementId = announcementId;

    // If no existing announcement ID, create a draft announcement
    if (!finalAnnouncementId) {
      const createResult = await createAnnouncement({
        title,
        subtitle: subtitle || undefined,
        content,
        type: type as AnnouncementType,
        audience: (audience || "all") as AnnouncementAudience,
        imageUrl: imageUrl || undefined,
        gifUrl: gifUrl || undefined,
        ctaText: ctaText || undefined,
        ctaUrl: ctaUrl || undefined,
        secondaryCtaText: secondaryCtaText || undefined,
        secondaryCtaUrl: secondaryCtaUrl || undefined,
        maintenanceStartAt: maintenanceStartAt || undefined,
        maintenanceEndAt: maintenanceEndAt || undefined,
        affectedServices: affectedServices || undefined,
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

    // Send test email
    const result = await sendTestAnnouncement({
      announcementId: finalAnnouncementId,
      testEmail,
      testFirstName: testFirstName || "Test",
      testOrganizationName: testOrganizationName || "Test Company",
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to send test email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      emailId: result.emailId,
      announcementId: finalAnnouncementId,
      message: `Test email sent to ${testEmail}`,
    });
  } catch (error) {
    console.error("Test send announcement error:", error);
    return NextResponse.json(
      { error: "Failed to send test email" },
      { status: 500 }
    );
  }
}
