"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";
import { getStripe } from "@/lib/stripe/server";
import { PRICING_TIERS, type BillingCycle } from "@/lib/stripe/types";
import {
  selectPlanSchema,
  setupProfileSchema,
  type OnboardingStatus,
  type SelectPlanInput,
  type SetupProfileInput,
} from "./schemas";
import { geocodeAddressWithFallback } from "@/lib/directory/geocoding";

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
  const user = await unifiedGetUser();
  const supabase = createAdminClient();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Get user's organization ID (enterprise or individual)
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("organization_id, individual_organization_id")
    .eq("id", user.id)
    .single();

  if (userError) {
    return { success: false, error: "User not found" };
  }

  // Enterprise path: use organizations table
  if (userData?.organization_id) {
    const { data: orgData, error: orgError } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", userData.organization_id)
      .single();

    if (orgError) {
      return { success: false, error: "Organization not found" };
    }

    const org = orgData as Record<string, unknown> | null;

    return {
      success: true,
      status: ((org?.onboarding_status as string) || "pending") as OnboardingStatus,
      selectedPlan: (org?.selected_plan as string) || null,
      selectedBillingCycle: (org?.selected_billing_cycle as string) || null,
      organizationId: userData.organization_id,
      shouldSkip: false,
    };
  }

  // Individual path: use individual_organizations table
  if (userData?.individual_organization_id) {
    const { data: indivOrgData, error: indivOrgError } = await supabase
      .from("individual_organizations")
      .select("*")
      .eq("id", userData.individual_organization_id)
      .single();

    if (indivOrgError) {
      return { success: false, error: "Organization not found" };
    }

    const indivOrg = indivOrgData as Record<string, unknown> | null;

    return {
      success: true,
      // Individual orgs skip plan+payment, go straight to profile
      status: ((indivOrg?.onboarding_status as string) || "payment_complete") as OnboardingStatus,
      selectedPlan: "basic",
      selectedBillingCycle: null,
      organizationId: userData.individual_organization_id,
      shouldSkip: false,
    };
  }

  return { success: false, error: "Organization not found" };
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

  const user = await unifiedGetUser();
  const supabase = createAdminClient();

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
  const user = await unifiedGetUser();
  const supabase = createAdminClient();

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

  // Normalize plan ID (map legacy starter→basic, professional→pro for compatibility)
  const normalizedPlan = selectedPlan === "starter" ? "basic"
    : selectedPlan === "professional" ? "pro"
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
  const user = await unifiedGetUser();
  const supabase = createAdminClient();

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

  const user = await unifiedGetUser();
  const supabase = createAdminClient();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Get user's organization (enterprise or individual)
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("organization_id, individual_organization_id, role")
    .eq("id", user.id)
    .single();

  if (userError) {
    return { success: false, error: "User not found" };
  }

  const isIndividual = !userData.organization_id && !!userData.individual_organization_id;
  const orgId = userData.organization_id || userData.individual_organization_id;

  if (!orgId) {
    return { success: false, error: "Organization not found" };
  }

  if (!isIndividual && userData.role !== "admin") {
    return { success: false, error: "Only admins can setup the profile" };
  }

  const adminClient = createAdminClient();
  const { organizationName, industry, companySize, address, logoUrl, primaryColor, website, phone, companyEmail } = validated.data;

  if (isIndividual) {
    // Individual path: update individual_organizations + users table
    const { error: updateError } = await adminClient
      .from("individual_organizations")
      .update({
        name: organizationName,
        website_url: website || null,
        phone: phone || null,
        email: companyEmail || null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onboarding_status: "profile_complete" as any,
      })
      .eq("id", orgId);

    if (updateError) {
      console.error("Error updating individual org profile:", updateError);
      return { success: false, error: "Failed to save profile" };
    }

    // Geocode and write address + coordinates to the users table
    const coords = await geocodeAddressWithFallback(
      address.street,
      address.city,
      address.state,
      address.zip,
    );

    const { error: userUpdateError } = await adminClient
      .from("users")
      .update({
        address: {
          street: address.street || null,
          city: address.city,
          state: address.state,
          zip: address.zip || null,
        },
        latitude: coords?.latitude ?? null,
        longitude: coords?.longitude ?? null,
      })
      .eq("id", user.id);

    if (userUpdateError) {
      console.error("Error updating user address:", userUpdateError);
      return { success: false, error: "Failed to save address" };
    }
  } else {
    // Enterprise path: update organizations table (unchanged)
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
      .eq("id", orgId);

    if (updateError) {
      console.error("Error updating profile:", updateError);
      return { success: false, error: "Failed to save profile" };
    }
  }

  // Record the step completion (using type assertion for untyped table)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (adminClient as any)
    .from("onboarding_steps")
    .upsert({
      organization_id: orgId,
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
  const user = await unifiedGetUser();
  const supabase = createAdminClient();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("organization_id, individual_organization_id, role")
    .eq("id", user.id)
    .single();

  if (userError) {
    return { success: false, error: "User not found" };
  }

  const isIndividual = !userData.organization_id && !!userData.individual_organization_id;
  const orgId = userData.organization_id || userData.individual_organization_id;

  if (!orgId) {
    return { success: false, error: "Organization not found" };
  }

  const adminClient = createAdminClient();

  if (isIndividual) {
    // Individual path: update individual_organizations
    await adminClient
      .from("individual_organizations")
      .update({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onboarding_status: "completed" as any,
      })
      .eq("id", orgId);
  } else {
    // Enterprise path: update organizations
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (adminClient as any)
      .from("organizations")
      .update({
        onboarding_status: "completed",
        onboarding_completed_at: new Date().toISOString(),
      })
      .eq("id", orgId);
  }

  // Record the step completion (using type assertion for untyped table)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (adminClient as any)
    .from("onboarding_steps")
    .upsert({
      organization_id: orgId,
      step_name: "complete",
      completed_at: new Date().toISOString(),
    }, { onConflict: "organization_id,step_name" });

  // Start org onboarding email sequence for enterprise admins
  if (!isIndividual && userData.role === "admin") {
    const { startOrgOnboardingSequence } = await import("@/lib/email/org-onboarding-service");
    const result = await startOrgOnboardingSequence(orgId, user.id);
    if (!result.success) {
      console.warn("Failed to start org onboarding sequence:", result.error);
    }
  }

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
  const user = await unifiedGetUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = createAdminClient();
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

  // Fetch old logo URL BEFORE updating (to properly clean up old files)
  const { data: orgData } = await supabase
    .from("organizations")
    .select("logo_url")
    .eq("id", userData.organization_id)
    .single();

  const oldLogoUrl = orgData?.logo_url;

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
  if (oldLogoUrl && oldLogoUrl.includes("/logos/")) {
    const oldPath = oldLogoUrl.split("/logos/").pop();
    if (oldPath && oldPath !== fileName) {
      await supabase.storage.from("logos").remove([oldPath]);
    }
  }

  revalidatePath("/onboarding");

  return { success: true, url: publicUrl };
}
