import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";
import { verifyNotBot } from "@/lib/botid";
import { unsubscribeContactByToken } from "@/app/(public)/u/c/[token]/actions";

/**
 * Unsubscribe flow map (Grill #2.6 — two purpose-built flows; legacy consolidated).
 *
 * There are two suppression systems, reached by two purpose-built human flows:
 *   • Platform users  → token preference center: /unsubscribe/[token] +
 *     /email-preferences/[token] (real resubscribe). NOT handled here.
 *   • Acquisition Contacts → /u/c/[token] page (human) writing per-Contact
 *     suppression (contact_suppressions).
 *
 * This route is the shared machine/fallback endpoint:
 *   GET  ?token=<t>  → resubscribe: delete the email_unsubscribes row, land on
 *                      /unsubscribed?action=resubscribed
 *   GET  ?email=<e>  → unsubscribe that email (email_unsubscribes), land on
 *                      /unsubscribed?action=unsubscribed
 *   GET  ?c=<token>  → 302 to the human Contact page /u/c/<token>
 *   POST ?c=<token>  → RFC-8058 one-click: suppress the Contact (same write as
 *                      the /u/c page — one suppression system, human + machine)
 *   POST ?email=<e>  → RFC-8058 one-click: unsubscribe that email
 *   POST {json body} → programmatic API (bot-checked): unsubscribe by email
 *   DELETE {json}    → programmatic API: resubscribe by token
 *
 * RFC 8058 one-click MUST NOT require a JSON body or a bot check — Gmail/Apple
 * Mail POST an empty or form-encoded body to the List-Unsubscribe URL. So POST
 * reads identity from the QUERY string first and only falls back to the JSON
 * path for real programmatic callers. The List-Unsubscribe header for a Contact
 * points at this route's `?c=<token>` form because a Next.js page route (/u/c)
 * cannot accept the one-click POST.
 */

const unsubscribeSchema = z.object({
  email: z.string().email("Invalid email address"),
  reason: z.string().optional(),
  organizationId: z.string().uuid().optional(),
});

const resubscribeSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

/** Idempotent legacy email suppression write (email_unsubscribes). */
async function upsertEmailUnsubscribe(email: string, reason: string): Promise<void> {
  const supabase = createAdminClient();
  await supabase.from("email_unsubscribes").upsert(
    { email: email.toLowerCase(), reason },
    { onConflict: "email,organization_id", ignoreDuplicates: true }
  );
}

// Handle unsubscribe requests
export async function POST(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const contactToken = params.get("c");
  const emailParam = params.get("email");

  // RFC 8058 one-click: identity in the query string, no JSON body, no bot
  // check. Always answer 200 so we never leak whether a token/email exists.
  if (contactToken) {
    const result = await unsubscribeContactByToken(contactToken);
    if (!result.success) {
      console.error("One-click contact unsubscribe failed:", result.error);
    }
    return NextResponse.json({ success: true, message: "Unsubscribed" });
  }

  if (emailParam) {
    const validated = z.string().email().safeParse(emailParam);
    if (validated.success) {
      await upsertEmailUnsubscribe(emailParam, "one_click");
    }
    return NextResponse.json({ success: true, message: "Unsubscribed" });
  }

  // Programmatic JSON API for real callers (bot-checked, structured response).
  try {
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
  const contactToken = searchParams.get("c");

  // Contact link clicked in a browser: send the human to the purpose-built
  // Contact page, which writes the same suppression system as the one-click POST.
  if (contactToken) {
    return NextResponse.redirect(
      new URL(`/u/c/${encodeURIComponent(contactToken)}`, request.url)
    );
  }

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

    await upsertEmailUnsubscribe(email, "email_link");

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
