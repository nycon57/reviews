import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userData } = await supabase
          .from("users")
          .select("organization_id")
          .eq("id", user.id)
          .single();

        if (userData?.organization_id) {
          // Fetch organization with all columns to access onboarding_status
          const { data: orgData } = await supabase
            .from("organizations")
            .select("*")
            .eq("id", userData.organization_id)
            .single();

          // Cast to access potentially untyped columns
          const orgAny = orgData as Record<string, unknown> | null;
          const onboardingStatus = (orgAny?.onboarding_status as string) || "pending";

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
