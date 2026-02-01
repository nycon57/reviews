"use server";

import { createUntypedAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUserWithProfile } from "@/lib/auth/actions";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ── Types ───────────────────────────────────────────────────────────────

export interface LoPhoneAssignment {
  phoneNumberId: string;
  phoneNumber: string;
  loanOfficerId: string | null;
  loanOfficerName: string | null;
  loanOfficerEmail: string | null;
  numberType: string;
  status: string;
}

type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

// ── Schemas ─────────────────────────────────────────────────────────────

const assignNumberSchema = z.object({
  phoneNumberId: z.string().uuid(),
  loanOfficerId: z.string().uuid(),
});

const unassignNumberSchema = z.object({
  phoneNumberId: z.string().uuid(),
});

// ── Auth helper ─────────────────────────────────────────────────────────

async function requireAdminOrManager(): Promise<
  { organizationId: string; userId: string; email: string } | { error: string }
> {
  const profile = await unifiedGetUserWithProfile();
  if (!profile) return { error: "Not authenticated" };
  if (!profile.organization_id) return { error: "No organization found" };
  if (profile.role !== "admin" && profile.role !== "manager") {
    return { error: "Admin or manager role required" };
  }
  return {
    organizationId: profile.organization_id,
    userId: profile.id,
    email: profile.email,
  };
}

// ── Actions ─────────────────────────────────────────────────────────────

/**
 * Get all phone numbers with their LO assignments for the organization.
 */
export async function getLoPhoneAssignments(): Promise<
  ActionResult<LoPhoneAssignment[]>
> {
  const auth = await requireAdminOrManager();
  if ("error" in auth) return { success: false, error: auth.error };

  const supabase = createUntypedAdminClient();

  const { data: numbers, error } = await supabase
    .from("sms_phone_numbers")
    .select("id, phone_number, number_type, status, loan_officer_id")
    .eq("organization_id", auth.organizationId)
    .eq("status", "active")
    .order("phone_number");

  if (error) {
    return { success: false, error: "Failed to load phone numbers" };
  }

  // Fetch LO details for assigned numbers
  const loIds = (numbers ?? [])
    .map((n: Record<string, unknown>) => n.loan_officer_id as string | null)
    .filter(Boolean) as string[];

  let loMap = new Map<string, { name: string; email: string }>();
  if (loIds.length > 0) {
    const { data: users } = await supabase
      .from("users")
      .select("id, full_name, email")
      .in("id", loIds);

    for (const u of users ?? []) {
      loMap.set(u.id as string, {
        name: u.full_name as string,
        email: u.email as string,
      });
    }
  }

  const assignments: LoPhoneAssignment[] = (numbers ?? []).map(
    (n: Record<string, unknown>) => {
      const loId = n.loan_officer_id as string | null;
      const lo = loId ? loMap.get(loId) : null;
      return {
        phoneNumberId: n.id as string,
        phoneNumber: n.phone_number as string,
        loanOfficerId: loId,
        loanOfficerName: lo?.name ?? null,
        loanOfficerEmail: lo?.email ?? null,
        numberType: n.number_type as string,
        status: n.status as string,
      };
    }
  );

  return { success: true, data: assignments };
}

/**
 * Assign a phone number to a loan officer.
 */
export async function assignNumberToLo(
  input: z.infer<typeof assignNumberSchema>
): Promise<ActionResult> {
  const auth = await requireAdminOrManager();
  if ("error" in auth) return { success: false, error: auth.error };

  const parsed = assignNumberSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const supabase = createUntypedAdminClient();

  // Verify the number belongs to this org
  const { data: number } = await supabase
    .from("sms_phone_numbers")
    .select("id, phone_number")
    .eq("id", parsed.data.phoneNumberId)
    .eq("organization_id", auth.organizationId)
    .eq("status", "active")
    .single();

  if (!number) {
    return { success: false, error: "Phone number not found" };
  }

  // Verify the LO belongs to this org
  const { data: lo } = await supabase
    .from("users")
    .select("id, full_name")
    .eq("id", parsed.data.loanOfficerId)
    .eq("organization_id", auth.organizationId)
    .single();

  if (!lo) {
    return { success: false, error: "Loan officer not found in your organization" };
  }

  // Unassign this number from any other LO first
  await supabase
    .from("sms_phone_numbers")
    .update({ loan_officer_id: null, updated_at: new Date().toISOString() })
    .eq("loan_officer_id", parsed.data.loanOfficerId)
    .eq("organization_id", auth.organizationId);

  // Assign the number
  const { error: updateError } = await supabase
    .from("sms_phone_numbers")
    .update({
      loan_officer_id: parsed.data.loanOfficerId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.phoneNumberId)
    .eq("organization_id", auth.organizationId);

  if (updateError) {
    return { success: false, error: "Failed to assign number" };
  }

  // Log to audit
  await logAuditEvent(supabase, {
    organizationId: auth.organizationId,
    eventType: "number_assigned",
    phoneNumber: number.phone_number as string,
    actorId: auth.userId,
    actorEmail: auth.email,
    loanOfficerId: parsed.data.loanOfficerId,
    details: {
      phone_number_id: parsed.data.phoneNumberId,
      loan_officer_name: lo.full_name,
    },
  });

  revalidatePath("/dashboard/team");
  revalidatePath("/dashboard/settings");
  return { success: true };
}

/**
 * Unassign a phone number from its current LO.
 */
export async function unassignNumber(
  input: z.infer<typeof unassignNumberSchema>
): Promise<ActionResult> {
  const auth = await requireAdminOrManager();
  if ("error" in auth) return { success: false, error: auth.error };

  const parsed = unassignNumberSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const supabase = createUntypedAdminClient();

  const { data: number } = await supabase
    .from("sms_phone_numbers")
    .select("id, phone_number, loan_officer_id")
    .eq("id", parsed.data.phoneNumberId)
    .eq("organization_id", auth.organizationId)
    .single();

  if (!number) {
    return { success: false, error: "Phone number not found" };
  }

  const { error: updateError } = await supabase
    .from("sms_phone_numbers")
    .update({
      loan_officer_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.phoneNumberId)
    .eq("organization_id", auth.organizationId);

  if (updateError) {
    return { success: false, error: "Failed to unassign number" };
  }

  await logAuditEvent(supabase, {
    organizationId: auth.organizationId,
    eventType: "number_unassigned",
    phoneNumber: number.phone_number as string,
    actorId: auth.userId,
    actorEmail: auth.email,
    loanOfficerId: number.loan_officer_id as string | null,
    details: { phone_number_id: parsed.data.phoneNumberId },
  });

  revalidatePath("/dashboard/team");
  revalidatePath("/dashboard/settings");
  return { success: true };
}

/**
 * Resolve the from number for a loan officer.
 * Returns the LO's dedicated number, or null to fall back to org default.
 */
export async function resolveLoFromNumber(
  organizationId: string,
  loanOfficerId: string
): Promise<string | null> {
  const supabase = createUntypedAdminClient();

  const { data } = await supabase
    .from("sms_phone_numbers")
    .select("phone_number")
    .eq("organization_id", organizationId)
    .eq("loan_officer_id", loanOfficerId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  return (data?.phone_number as string) ?? null;
}

// ── Audit helper ────────────────────────────────────────────────────────

async function logAuditEvent(
  supabase: ReturnType<typeof createUntypedAdminClient>,
  event: {
    organizationId: string;
    eventType: string;
    phoneNumber?: string | null;
    actorId: string;
    actorEmail: string;
    loanOfficerId?: string | null;
    messageId?: string | null;
    details?: Record<string, unknown>;
  }
): Promise<void> {
  await supabase.from("sms_audit_log").insert({
    organization_id: event.organizationId,
    event_type: event.eventType,
    phone_number: event.phoneNumber ?? null,
    actor_id: event.actorId,
    actor_email: event.actorEmail,
    loan_officer_id: event.loanOfficerId ?? null,
    message_id: event.messageId ?? null,
    details: event.details ?? {},
  });
}
