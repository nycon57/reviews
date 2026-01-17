"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/server";
import { PRICING_TIERS, type BillingCycle } from "@/lib/stripe/types";
import {
  selectPlanSchema,
  setupProfileSchema,
  type OnboardingStatus,
  type SelectPlanInput,
  type SetupProfileInput,
} from "./schemas";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Response types
interface ActionResult {
  success: boolean;
  error?: string;
  redirectTo?: string;
}

interface OnboardingStatusResult {
  success: boolean;
  status?: OnboardingStatus;
  selectedPlan?: string | null;
  selectedBillingCycle?: string | null;
  organizationId?: string;
  shouldSkip?: boolean;
  error?: string;
}

/**
 * Get current onboarding status for the user
 */
export async function getOnboardingStatus(): Promise<OnboardingStatusResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Get user's organization ID
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (userError || !userData?.organization_id) {
    return { success: false, error: "Organization not found" };
  }

  // Fetch organization with all columns to access potentially untyped columns
  const { data: orgData, error: orgError } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", userData.organization_id)
    .single();

  if (orgError) {
    return { success: false, error: "Organization not found" };
  }

  // Cast to access potentially untyped columns
  const org = orgData as Record<string, unknown> | null;

  return {
    success: true,
    status: ((org?.onboarding_status as string) || "pending") as OnboardingStatus,
    selectedPlan: (org?.selected_plan as string) || null,
    selectedBillingCycle: (org?.selected_billing_cycle as string) || null,
    organizationId: userData.organization_id,
    shouldSkip: false, // Will be handled by middleware when invited_by is available
  };
}

/**
 * Get the redirect path based on current onboarding status
 */
export async function getOnboardingRedirect(): Promise<{ success: boolean; redirectTo?: string; error?: string }> {
  const statusResult = await getOnboardingStatus();

  if (!statusResult.success) {
    return { success: false, error: statusResult.error };
  }

  // If user should skip onboarding (invited to existing org), go to dashboard
  if (statusResult.shouldSkip) {
    return { success: true, redirectTo: "/dashboard" };
  }

  const status = statusResult.status;

  switch (status) {
    case "pending":
      return { success: true, redirectTo: "/onboarding/plan" };
    case "plan_selected":
      // All plans require payment (basic/pro with trial)
      return { success: true, redirectTo: "/onboarding/payment" };
    case "payment_complete":
      return { success: true, redirectTo: "/onboarding/profile" };
    case "profile_complete":
      return { success: true, redirectTo: "/onboarding/complete" };
    case "completed":
      return { success: true, redirectTo: "/dashboard" };
    default:
      return { success: true, redirectTo: "/onboarding/plan" };
  }
}

/**
 * Select a plan during onboarding
 */
export async function selectPlan(input: SelectPlanInput): Promise<ActionResult> {
  const validated = selectPlanSchema.safeParse(input);
  if (!validated.success) {
    return { success: false, error: validated.error.message };
  }

  const { plan, billingCycle } = validated.data;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Get user's organization
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (userError || !userData?.organization_id) {
    return { success: false, error: "Organization not found" };
  }

  // Only admins can set the plan
  if (userData.role !== "admin") {
    return { success: false, error: "Only admins can select a plan" };
  }

  // Use admin client to bypass RLS for updating organization
  const adminClient = createAdminClient();

  // Update organization with selected plan
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = await (adminClient as any)
    .from("organizations")
    .update({
      selected_plan: plan,
      selected_billing_cycle: billingCycle,
      onboarding_status: "plan_selected",
      subscription_tier: plan, // Also update subscription_tier
    })
    .eq("id", userData.organization_id);

  if (updateError) {
    console.error("Error updating plan:", updateError);
    return { success: false, error: "Failed to select plan" };
  }

  // Record the step completion (using type assertion for untyped table)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (adminClient as any)
    .from("onboarding_steps")
    .upsert({
      organization_id: userData.organization_id,
      step_name: "plan_selection",
      completed_at: new Date().toISOString(),
      data: { plan, billingCycle },
    }, { onConflict: "organization_id,step_name" });

  revalidatePath("/onboarding");

  // All plans (basic/pro) require payment with 7-day trial
  return { success: true, redirectTo: "/onboarding/payment" };
}

/**
 * Create checkout session for onboarding payment
 */
export async function createOnboardingCheckout(): Promise<{
  success: boolean;
  sessionId?: string;
  url?: string;
  error?: string
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Get user's organization and role
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("organization_id, role, email, full_name")
    .eq("id", user.id)
    .single();

  if (userError || !userData?.organization_id) {
    return { success: false, error: "Organization not found" };
  }

  if (userData.role !== "admin") {
    return { success: false, error: "Only admins can manage billing" };
  }

  // Fetch organization with all columns
  const { data: orgData, error: orgError } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", userData.organization_id)
    .single();

  if (orgError) {
    return { success: false, error: "Organization not found" };
  }

  // Cast to access potentially untyped columns
  const org = orgData as Record<string, unknown> & {
    id: string;
    name: string;
    stripe_customer_id: string | null;
    billing_email: string | null;
  };

  const selectedPlan = org?.selected_plan as string | null;
  const selectedBillingCycle = org?.selected_billing_cycle as string | null;

  if (!selectedPlan) {
    return { success: false, error: "No plan selected" };
  }

  if (selectedPlan === "enterprise") {
    return { success: false, error: "Enterprise plan requires contacting sales" };
  }

  // Normalize plan ID (map basic→starter, pro→professional for compatibility)
  const normalizedPlan = selectedPlan === "basic" ? "starter"
    : selectedPlan === "pro" ? "professional"
    : selectedPlan;

  // Get price ID based on plan and billing cycle
  const billingCycle = (selectedBillingCycle || "month") as BillingCycle;
  const tier = PRICING_TIERS.find(t => t.id === normalizedPlan);

  if (!tier) {
    return { success: false, error: "Invalid plan selected" };
  }

  // Get price ID from environment (supports both old and new tier names)
  let priceId: string | null = null;
  if (selectedPlan === "basic" || selectedPlan === "starter") {
    priceId = (billingCycle === "year"
      ? process.env.STRIPE_BASIC_PRICE_YEARLY || process.env.STRIPE_STARTER_PRICE_YEARLY
      : process.env.STRIPE_BASIC_PRICE_MONTHLY || process.env.STRIPE_STARTER_PRICE_MONTHLY) ?? null;
  } else if (selectedPlan === "pro" || selectedPlan === "professional") {
    priceId = (billingCycle === "year"
      ? process.env.STRIPE_PRO_PRICE_YEARLY || process.env.STRIPE_PROFESSIONAL_PRICE_YEARLY
      : process.env.STRIPE_PRO_PRICE_MONTHLY || process.env.STRIPE_PROFESSIONAL_PRICE_MONTHLY) ?? null;
  }

  if (!priceId) {
    return { success: false, error: "Pricing not configured. Please contact support." };
  }

  const stripe = getStripe();
  const adminClient = createAdminClient();

  try {
    // Get or create Stripe customer
    let customerId = org.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        name: org.name,
        email: org.billing_email || userData.email,
        metadata: {
          organization_id: org.id,
          created_by: user.id,
        },
      });
      customerId = customer.id;

      // Save customer ID
      await adminClient
        .from("organizations")
        .update({ stripe_customer_id: customerId })
        .eq("id", org.id);
    }

    // Create checkout session with trial
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      payment_method_collection: "always", // Require card upfront for trial
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          organization_id: org.id,
          billing_cycle: billingCycle,
          onboarding: "true",
        },
      },
      success_url: `${APP_URL}/onboarding/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/onboarding/payment?canceled=true`,
      billing_address_collection: "required",
      allow_promotion_codes: true,
    });

    return { success: true, sessionId: session.id, url: session.url || undefined };
  } catch (error) {
    console.error("Error creating onboarding checkout session:", error);
    return { success: false, error: "Failed to create checkout session" };
  }
}

/**
 * Complete payment step after successful checkout
 */
export async function completePaymentStep(sessionId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (userError || !userData?.organization_id) {
    return { success: false, error: "Organization not found" };
  }

  // Verify the checkout session with Stripe
  const stripe = getStripe();

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Verify this session belongs to this organization
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
    if (subscription.metadata.organization_id !== userData.organization_id) {
      return { success: false, error: "Invalid checkout session" };
    }

    // Update organization onboarding status
    const adminClient = createAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (adminClient as any)
      .from("organizations")
      .update({
        onboarding_status: "payment_complete",
      })
      .eq("id", userData.organization_id);

    // Record the step completion (using type assertion for untyped table)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (adminClient as any)
      .from("onboarding_steps")
      .upsert({
        organization_id: userData.organization_id,
        step_name: "payment",
        completed_at: new Date().toISOString(),
        data: { sessionId, subscriptionId: session.subscription },
      }, { onConflict: "organization_id,step_name" });

    revalidatePath("/onboarding");
    return { success: true, redirectTo: "/onboarding/profile" };
  } catch (error) {
    console.error("Error completing payment step:", error);
    return { success: false, error: "Failed to verify payment" };
  }
}

/**
 * Setup organization profile during onboarding
 */
export async function setupProfile(input: SetupProfileInput): Promise<ActionResult> {
  const validated = setupProfileSchema.safeParse(input);
  if (!validated.success) {
    return { success: false, error: validated.error.errors[0].message };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Get user's organization
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (userError || !userData?.organization_id) {
    return { success: false, error: "Organization not found" };
  }

  if (userData.role !== "admin") {
    return { success: false, error: "Only admins can setup the profile" };
  }

  const adminClient = createAdminClient();
  const { organizationName, industry, companySize, address, logoUrl, primaryColor, website, phone, companyEmail } = validated.data;

  // Update organization
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = await (adminClient as any)
    .from("organizations")
    .update({
      name: organizationName,
      logo_url: logoUrl || null,
      primary_color: primaryColor || "#52796f",
      domain: website || null,
      onboarding_status: "profile_complete",
      settings: {
        industry,
        companySize,
        address,
        phone,
        companyEmail,
      },
    })
    .eq("id", userData.organization_id);

  if (updateError) {
    console.error("Error updating profile:", updateError);
    return { success: false, error: "Failed to save profile" };
  }

  // Record the step completion (using type assertion for untyped table)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (adminClient as any)
    .from("onboarding_steps")
    .upsert({
      organization_id: userData.organization_id,
      step_name: "profile",
      completed_at: new Date().toISOString(),
      data: validated.data,
    }, { onConflict: "organization_id,step_name" });

  revalidatePath("/onboarding");
  return { success: true, redirectTo: "/onboarding/complete" };
}

/**
 * Complete onboarding and mark as finished
 */
export async function completeOnboarding(): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (userError || !userData?.organization_id) {
    return { success: false, error: "Organization not found" };
  }

  const adminClient = createAdminClient();

  // Update organization to completed
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (adminClient as any)
    .from("organizations")
    .update({
      onboarding_status: "completed",
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq("id", userData.organization_id);

  // Record the step completion (using type assertion for untyped table)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (adminClient as any)
    .from("onboarding_steps")
    .upsert({
      organization_id: userData.organization_id,
      step_name: "complete",
      completed_at: new Date().toISOString(),
    }, { onConflict: "organization_id,step_name" });

  revalidatePath("/onboarding");
  revalidatePath("/dashboard");

  return { success: true, redirectTo: "/dashboard" };
}

/**
 * Skip payment - no longer supported since all plans require payment
 * Kept for backwards compatibility but now returns error
 */
export async function skipPayment(): Promise<ActionResult> {
  return { success: false, error: "Payment required for all plans" };
}

/**
 * Upload organization logo during onboarding
 */
export async function uploadLogo(
  formData: FormData
): Promise<{ success: boolean; url?: string; error?: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Get user's organization
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (userError || !userData?.organization_id) {
    return { success: false, error: "Organization not found" };
  }

  if (userData.role !== "admin") {
    return { success: false, error: "Only admins can upload logos" };
  }

  const file = formData.get("file") as File;
  if (!file) {
    return { success: false, error: "No file provided" };
  }

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
  if (!allowedTypes.includes(file.type)) {
    return { success: false, error: "Invalid file type. Please upload a JPG, PNG, SVG, or WebP image." };
  }

  // Validate file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    return { success: false, error: "File too large. Maximum size is 5MB." };
  }

  // Generate unique filename
  const fileExt = file.name.split(".").pop() || "png";
  const fileName = `${userData.organization_id}/logo-${Date.now()}.${fileExt}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from("logos")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    console.error("Upload error:", uploadError);
    return { success: false, error: "Failed to upload image. Please try again." };
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from("logos")
    .getPublicUrl(fileName);

  // Update organization's logo_url in database
  const adminClient = createAdminClient();
  const { error: dbError } = await adminClient
    .from("organizations")
    .update({
      logo_url: publicUrl,
    })
    .eq("id", userData.organization_id);

  if (dbError) {
    console.error("Database update error:", dbError);
    // Try to delete the uploaded file if database update fails
    await supabase.storage.from("logos").remove([fileName]);
    return { success: false, error: "Failed to update profile. Please try again." };
  }

  // Delete old logo if it exists and is from our storage
  const { data: orgData } = await supabase
    .from("organizations")
    .select("logo_url")
    .eq("id", userData.organization_id)
    .single();

  if (orgData?.logo_url && orgData.logo_url.includes("/logos/")) {
    const oldPath = orgData.logo_url.split("/logos/").pop();
    if (oldPath && oldPath !== fileName) {
      await supabase.storage.from("logos").remove([oldPath]);
    }
  }

  revalidatePath("/onboarding");

  return { success: true, url: publicUrl };
}
