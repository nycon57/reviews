import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { startWelcomeSequence } from "@/lib/email/welcome-sequence-service";
import { exitReengagementSequencesOnLogin } from "@/lib/email/reengagement-sequence-service";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Handle password recovery flow
      if (type === "recovery") {
        return NextResponse.redirect(`${origin}/reset-password`);
      }

      // Check onboarding status for new users
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("organization_id, created_at")
          .eq("id", user.id)
          .single();

        if (userError) {
          console.error("Failed to fetch user data:", userError);
          // Continue with redirect, but log the error
          return NextResponse.redirect(`${origin}${next}`);
        }

        // CRITICAL: Update last_login_at for re-engagement sequence tracking
        // This allows re-engagement sequences to exit when user logs back in
        supabase
          .from("users")
          .update({ last_login_at: new Date().toISOString() })
          .eq("id", user.id)
          .then(({ error: updateError }) => {
            if (updateError) {
              console.error("Failed to update last_login_at:", updateError);
            }
          });

        if (userData?.organization_id) {
          // Check if this is a new user (created within the last 5 minutes)
          // Using 5 minutes instead of 1 minute to account for OAuth delays
          if (userData.created_at) {
            const userCreatedAt = new Date(userData.created_at);
            const now = new Date();
            const isNewUser = now.getTime() - userCreatedAt.getTime() < 300000; // 5 minutes

            // Start welcome sequence for new users (async, don't wait)
            if (isNewUser) {
              startWelcomeSequence(user.id).catch((err) => {
                console.error("Failed to start welcome sequence:", err);
              });
            } else {
              // Exit any active re-engagement sequences for returning users (async, don't wait)
              exitReengagementSequencesOnLogin(user.id).catch((err) => {
                console.error("Failed to exit re-engagement sequences:", err);
              });
            }
          }

          // Fetch organization with all columns to access onboarding_status
          const { data: orgData } = await supabase
            .from("organizations")
            .select("*")
            .eq("id", userData.organization_id)
            .single();

          // Cast to access potentially untyped columns
          const orgAny = orgData as Record<string, unknown> | null;
          const onboardingStatus =
            (orgAny?.onboarding_status as string) || "pending";

          // Redirect to onboarding if not completed
          if (onboardingStatus !== "completed") {
            return NextResponse.redirect(`${origin}/onboarding`);
          }
        }
      }

      // Default: redirect to dashboard or next URL
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Handle error cases - redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
