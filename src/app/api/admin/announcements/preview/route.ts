/**
 * Announcement Preview API Route (S088)
 *
 * Generates an HTML preview of an announcement email.
 * Admin-only endpoint.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { previewAnnouncement } from "@/lib/email/announcement-service";
import type { AnnouncementType, AnnouncementAudience } from "@/lib/email/types";

// Preview request schema
const previewSchema = z.object({
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
  // Preview recipient info
  recipientEmail: z.string().email().optional(),
  recipientFirstName: z.string().optional(),
  organizationName: z.string().optional(),
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
    const validated = previewSchema.safeParse(body);

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
      recipientEmail,
      recipientFirstName,
      organizationName,
    } = validated.data;

    // Build announcement object for preview
    const announcement = {
      id: "preview",
      title,
      subtitle: subtitle || undefined,
      content,
      type: type as AnnouncementType,
      audience: "all" as AnnouncementAudience,
      imageUrl: imageUrl || undefined,
      gifUrl: gifUrl || undefined,
      ctaText: ctaText || undefined,
      ctaUrl: ctaUrl || undefined,
      secondaryCtaText: secondaryCtaText || undefined,
      secondaryCtaUrl: secondaryCtaUrl || undefined,
      maintenanceStartAt: maintenanceStartAt || undefined,
      maintenanceEndAt: maintenanceEndAt || undefined,
      affectedServices: affectedServices || undefined,
    };

    // Generate preview
    const { subject, html } = await previewAnnouncement({
      announcement,
      recipientEmail: recipientEmail || "preview@example.com",
      recipientFirstName: recipientFirstName || "Preview",
      organizationName: organizationName || "Your Company",
    });

    return NextResponse.json({
      success: true,
      subject,
      html,
    });
  } catch (error) {
    console.error("Preview announcement error:", error);
    return NextResponse.json(
      { error: "Failed to generate preview" },
      { status: 500 }
    );
  }
}
