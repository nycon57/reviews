"use server";

import { createUntypedAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUserWithProfile } from "@/lib/auth/actions";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ── Types ───────────────────────────────────────────────────────────────

export interface BrandedDomain {
  id: string;
  domain: string;
  cnameTarget: string;
  dnsVerified: boolean;
  dnsVerifiedAt: string | null;
  sslActive: boolean;
  sslActiveAt: string | null;
  isActive: boolean;
  createdAt: string;
}

type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

// ── Schemas ─────────────────────────────────────────────────────────────

const addDomainSchema = z.object({
  domain: z
    .string()
    .min(4, "Domain is too short")
    .max(253, "Domain is too long")
    .regex(
      /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)+$/,
      "Invalid domain format"
    ),
});

const domainIdSchema = z.object({
  domainId: z.string().uuid(),
});

// ── Auth ────────────────────────────────────────────────────────────────

async function requireAdmin(): Promise<
  { organizationId: string; userId: string; email: string } | { error: string }
> {
  const profile = await unifiedGetUserWithProfile();
  if (!profile) return { error: "Not authenticated" };
  if (!profile.organization_id) return { error: "No organization found" };
  if (profile.role !== "admin") {
    return { error: "Admin role required for domain management" };
  }
  return {
    organizationId: profile.organization_id,
    userId: profile.id,
    email: profile.email,
  };
}

// ── Actions ─────────────────────────────────────────────────────────────

/**
 * Get the branded domain for the current organization.
 */
export async function getBrandedDomain(): Promise<
  ActionResult<BrandedDomain | null>
> {
  const auth = await requireAdmin();
  if ("error" in auth) return { success: false, error: auth.error };

  const supabase = createUntypedAdminClient();

  const { data, error } = await supabase
    .from("sms_branded_domains")
    .select("*")
    .eq("organization_id", auth.organizationId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return { success: false, error: "Failed to load branded domain" };
  }

  if (!data) {
    return { success: true, data: null };
  }

  return {
    success: true,
    data: mapDomain(data),
  };
}

/**
 * Add a new branded short domain for the organization.
 */
export async function addBrandedDomain(
  input: z.infer<typeof addDomainSchema>
): Promise<ActionResult<BrandedDomain>> {
  const auth = await requireAdmin();
  if ("error" in auth) return { success: false, error: auth.error };

  const parsed = addDomainSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const domain = parsed.data.domain.toLowerCase();
  const supabase = createUntypedAdminClient();

  // Check if domain is already taken
  const { data: existing } = await supabase
    .from("sms_branded_domains")
    .select("id")
    .eq("domain", domain)
    .maybeSingle();

  if (existing) {
    return { success: false, error: "This domain is already registered" };
  }

  // Deactivate any existing domain for this org
  await supabase
    .from("sms_branded_domains")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("organization_id", auth.organizationId);

  const { data, error } = await supabase
    .from("sms_branded_domains")
    .insert({
      organization_id: auth.organizationId,
      domain,
      cname_target: "cname.repwell.com",
      dns_verified: false,
      ssl_active: false,
      is_active: false,
    })
    .select("*")
    .single();

  if (error || !data) {
    return { success: false, error: "Failed to add domain" };
  }

  // Log audit event
  await supabase.from("sms_audit_log").insert({
    organization_id: auth.organizationId,
    event_type: "settings_changed",
    actor_id: auth.userId,
    actor_email: auth.email,
    details: { action: "branded_domain_added", domain },
  });

  revalidatePath("/dashboard/settings");
  return { success: true, data: mapDomain(data) };
}

/**
 * Verify DNS configuration for a branded domain.
 * Checks if the CNAME record points to the correct target.
 */
export async function verifyDomainDns(
  input: z.infer<typeof domainIdSchema>
): Promise<ActionResult<{ verified: boolean; message: string }>> {
  const auth = await requireAdmin();
  if ("error" in auth) return { success: false, error: auth.error };

  const parsed = domainIdSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const supabase = createUntypedAdminClient();

  const { data: domainRecord } = await supabase
    .from("sms_branded_domains")
    .select("*")
    .eq("id", parsed.data.domainId)
    .eq("organization_id", auth.organizationId)
    .single();

  if (!domainRecord) {
    return { success: false, error: "Domain not found" };
  }

  // DNS verification via DNS lookup
  // In production, this would call a DNS resolution API
  // For now, we simulate the check and mark as verified if the domain is configured
  try {
    const domain = domainRecord.domain as string;
    const response = await fetch(
      `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=CNAME`,
      { next: { revalidate: 0 } }
    );

    if (!response.ok) {
      return {
        success: true,
        data: {
          verified: false,
          message: "Unable to verify DNS. Please check your CNAME record and try again.",
        },
      };
    }

    const dnsResult = await response.json();
    const cnameTarget = domainRecord.cname_target as string;
    const answers = dnsResult.Answer ?? [];
    const hasCname = answers.some(
      (a: { type: number; data: string }) =>
        a.type === 5 && a.data.replace(/\.$/, "") === cnameTarget
    );

    if (hasCname) {
      const now = new Date().toISOString();
      await supabase
        .from("sms_branded_domains")
        .update({
          dns_verified: true,
          dns_verified_at: now,
          is_active: true,
          ssl_active: true,
          ssl_active_at: now,
          updated_at: now,
        })
        .eq("id", parsed.data.domainId);

      await supabase.from("sms_audit_log").insert({
        organization_id: auth.organizationId,
        event_type: "domain_verified",
        actor_id: auth.userId,
        actor_email: auth.email,
        details: { domain, dns_verified: true },
      });

      revalidatePath("/dashboard/settings");
      return {
        success: true,
        data: { verified: true, message: "DNS verified. Your domain is now active." },
      };
    }

    return {
      success: true,
      data: {
        verified: false,
        message: `CNAME record not found. Add a CNAME record pointing ${domain} to ${cnameTarget}.`,
      },
    };
  } catch {
    return {
      success: true,
      data: {
        verified: false,
        message: "DNS check failed. Please try again in a few minutes.",
      },
    };
  }
}

/**
 * Remove a branded domain.
 */
export async function removeBrandedDomain(
  input: z.infer<typeof domainIdSchema>
): Promise<ActionResult> {
  const auth = await requireAdmin();
  if ("error" in auth) return { success: false, error: auth.error };

  const parsed = domainIdSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const supabase = createUntypedAdminClient();

  const { data: domainRecord } = await supabase
    .from("sms_branded_domains")
    .select("domain")
    .eq("id", parsed.data.domainId)
    .eq("organization_id", auth.organizationId)
    .single();

  if (!domainRecord) {
    return { success: false, error: "Domain not found" };
  }

  const { error } = await supabase
    .from("sms_branded_domains")
    .delete()
    .eq("id", parsed.data.domainId)
    .eq("organization_id", auth.organizationId);

  if (error) {
    return { success: false, error: "Failed to remove domain" };
  }

  await supabase.from("sms_audit_log").insert({
    organization_id: auth.organizationId,
    event_type: "settings_changed",
    actor_id: auth.userId,
    actor_email: auth.email,
    details: {
      action: "branded_domain_removed",
      domain: domainRecord.domain,
    },
  });

  revalidatePath("/dashboard/settings");
  return { success: true };
}

/**
 * Resolve the short link base URL for an organization.
 * Returns custom domain if configured and active, otherwise the default.
 */
export async function resolveShortLinkDomain(
  organizationId: string
): Promise<string> {
  const supabase = createUntypedAdminClient();

  const { data } = await supabase
    .from("sms_branded_domains")
    .select("domain")
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .eq("dns_verified", true)
    .limit(1)
    .maybeSingle();

  if (data?.domain) {
    return `https://${data.domain as string}`;
  }

  return process.env.NEXT_PUBLIC_APP_URL ?? "https://app.repwell.com";
}

// ── Helpers ─────────────────────────────────────────────────────────────

function mapDomain(row: Record<string, unknown>): BrandedDomain {
  return {
    id: row.id as string,
    domain: row.domain as string,
    cnameTarget: row.cname_target as string,
    dnsVerified: row.dns_verified as boolean,
    dnsVerifiedAt: (row.dns_verified_at as string) ?? null,
    sslActive: row.ssl_active as boolean,
    sslActiveAt: (row.ssl_active_at as string) ?? null,
    isActive: row.is_active as boolean,
    createdAt: row.created_at as string,
  };
}
