import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";
import { verifyNotBot } from "@/lib/botid";

const unsubscribeSchema = z.object({
  email: z.string().email("Invalid email address"),
  reason: z.string().optional(),
  organizationId: z.string().uuid().optional(),
});

const resubscribeSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

// Handle unsubscribe requests
export async function POST(request: NextRequest) {
  try {
    // Verify request is not from a bot
    const botResponse = await verifyNotBot();
    if (botResponse) return botResponse;

    const body = await request.json();
    const validated = unsubscribeSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const { email, reason, organizationId } = validated.data;
    const supabase = createAdminClient();

    // Insert unsubscribe record
    const { data, error } = await supabase
      .from("email_unsubscribes")
      .insert({
        email: email.toLowerCase(),
        reason: reason || "user_unsubscribed",
        organization_id: organizationId || null,
      })
      .select("id, token")
      .single();

    if (error) {
      // Check if it's a duplicate error (already unsubscribed)
      if (error.code === "23505") {
        return NextResponse.json({
          success: true,
          message: "Already unsubscribed",
        });
      }
      console.error("Unsubscribe error:", error);
      return NextResponse.json(
        { error: "Failed to unsubscribe" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Successfully unsubscribed",
      resubscribeToken: data.token,
    });
  } catch (error) {
    console.error("Unsubscribe error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

// Handle unsubscribe via GET (for email links)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const email = searchParams.get("email");
  const token = searchParams.get("token");

  // If token is provided, this is a resubscribe request
  if (token) {
    const validated = resubscribeSchema.safeParse({ token });
    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const { error } = await supabase
      .from("email_unsubscribes")
      .delete()
      .eq("token", token);

    if (error) {
      console.error("Resubscribe error:", error);
      return NextResponse.json(
        { error: "Failed to resubscribe" },
        { status: 500 }
      );
    }

    // Redirect to a success page
    return NextResponse.redirect(
      new URL("/unsubscribed?action=resubscribed", request.url)
    );
  }

  // If email is provided, this is an unsubscribe request
  if (email) {
    const validated = z.string().email().safeParse(email);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Insert unsubscribe record
    const { error } = await supabase.from("email_unsubscribes").upsert(
      {
        email: email.toLowerCase(),
        reason: "email_link",
      },
      {
        onConflict: "email,organization_id",
        ignoreDuplicates: true,
      }
    );

    if (error) {
      console.error("Unsubscribe error:", error);
      return NextResponse.json(
        { error: "Failed to unsubscribe" },
        { status: 500 }
      );
    }

    // Redirect to unsubscribe confirmation page
    return NextResponse.redirect(
      new URL("/unsubscribed?action=unsubscribed", request.url)
    );
  }

  return NextResponse.json(
    { error: "Email or token parameter required" },
    { status: 400 }
  );
}

// Handle DELETE for resubscribing
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = resubscribeSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const { token } = validated.data;
    const supabase = createAdminClient();

    const { error } = await supabase
      .from("email_unsubscribes")
      .delete()
      .eq("token", token);

    if (error) {
      console.error("Resubscribe error:", error);
      return NextResponse.json(
        { error: "Failed to resubscribe" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Successfully resubscribed",
    });
  } catch (error) {
    console.error("Resubscribe error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
