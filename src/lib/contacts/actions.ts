/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck -- TODO: Run `npm run db:types` once contacts table is in Supabase schema to remove this suppression
"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";
import {
  createContactSchema,
  updateContactSchema,
  MAX_CONTACT_IMPORT_ROWS,
  type Contact,
  type CreateContactInput,
  type UpdateContactInput,
  type ContactCSVRow,
  type ContactImportResult,
  type ContactBulkImportResult,
} from "./types";

// ==================== Auth Helpers ====================

async function getUserOrganization() {
  const user = await unifiedGetUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const supabase = createAdminClient();
  const { data: userData } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (!userData?.organization_id) {
    return { error: "No organization found" };
  }

  return { userId: user.id, organizationId: userData.organization_id, role: userData.role };
}

async function checkManagerAccess() {
  const result = await getUserOrganization();
  if ("error" in result) return result;

  if (result.role !== "admin" && result.role !== "manager") {
    return { error: "Unauthorized - requires manager or admin role" };
  }

  return result;
}

// ==================== DB → TS Mapper ====================

function mapContact(d: Record<string, unknown>): Contact {
  return {
    id: d.id as string,
    organizationId: d.organization_id as string,
    email: d.email as string,
    fullName: d.full_name as string,
    department: d.department as string | null,
    branchId: d.branch_id as string | null,
    title: d.title as string | null,
    phone: d.phone as string | null,
    isActive: d.is_active as boolean,
    userId: d.user_id as string | null,
    metadata: (d.metadata as Record<string, unknown>) ?? {},
    createdAt: d.created_at as string,
    updatedAt: d.updated_at as string,
  };
}

// ==================== CRUD Actions ====================

export async function getContacts(
  page = 1,
  pageSize = 25,
  search?: string,
): Promise<{ success: boolean; data?: Contact[]; total?: number; error?: string }> {
  const result = await getUserOrganization();
  if ("error" in result) return { success: false, error: result.error };

  const supabase = createAdminClient();
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from("contacts")
    .select("*", { count: "exact" })
    .eq("organization_id", result.organizationId)
    .order("full_name");

  if (search?.trim()) {
    const escaped = search.trim().replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
    const term = `%${escaped}%`;
    query = query.or(`full_name.ilike.${term},email.ilike.${term},department.ilike.${term}`);
  }

  query = query.range(offset, offset + pageSize - 1);

  const { data, error, count } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    data: data?.map(mapContact) ?? [],
    total: count ?? 0,
  };
}

export async function createContact(
  input: CreateContactInput,
): Promise<{ success: boolean; data?: Contact; error?: string }> {
  const result = await checkManagerAccess();
  if ("error" in result) return { success: false, error: result.error };

  const parsed = createContactSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const supabase = createAdminClient();

  // Auto-link user_id by email match
  const { data: matchedUser } = await supabase
    .from("users")
    .select("id")
    .eq("organization_id", result.organizationId)
    .eq("email", parsed.data.email)
    .single();

  const { data, error } = await supabase
    .from("contacts")
    .insert({
      organization_id: result.organizationId,
      email: parsed.data.email,
      full_name: parsed.data.fullName,
      department: parsed.data.department || null,
      branch_id: parsed.data.branchId || null,
      title: parsed.data.title || null,
      phone: parsed.data.phone || null,
      user_id: matchedUser?.id || null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "A contact with this email already exists in your organization" };
    }
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/contacts");
  return { success: true, data: mapContact(data) };
}

export async function updateContact(
  id: string,
  input: UpdateContactInput,
): Promise<{ success: boolean; data?: Contact; error?: string }> {
  const result = await checkManagerAccess();
  if ("error" in result) return { success: false, error: result.error };

  const parsed = updateContactSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const supabase = createAdminClient();

  const updateData: Record<string, unknown> = {};
  if (parsed.data.email !== undefined) updateData.email = parsed.data.email;
  if (parsed.data.fullName !== undefined) updateData.full_name = parsed.data.fullName;
  if (parsed.data.department !== undefined) updateData.department = parsed.data.department || null;
  if (parsed.data.branchId !== undefined) updateData.branch_id = parsed.data.branchId || null;
  if (parsed.data.title !== undefined) updateData.title = parsed.data.title || null;
  if (parsed.data.phone !== undefined) updateData.phone = parsed.data.phone || null;
  if (parsed.data.isActive !== undefined) updateData.is_active = parsed.data.isActive;

  const { data, error } = await supabase
    .from("contacts")
    .update(updateData)
    .eq("id", id)
    .eq("organization_id", result.organizationId)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  if (!data) {
    return { success: false, error: "Contact not found" };
  }

  revalidatePath("/dashboard/contacts");
  return { success: true, data: mapContact(data) };
}

export async function deleteContact(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  const result = await checkManagerAccess();
  if ("error" in result) return { success: false, error: result.error };

  const supabase = createAdminClient();

  // Soft delete
  const { data, error } = await supabase
    .from("contacts")
    .update({ is_active: false })
    .eq("id", id)
    .eq("organization_id", result.organizationId)
    .select("id");

  if (error) {
    return { success: false, error: error.message };
  }

  if (!data || data.length === 0) {
    return { success: false, error: "Contact not found" };
  }

  revalidatePath("/dashboard/contacts");
  return { success: true };
}

// ==================== Bulk Import ====================

export async function bulkImportContacts(
  rows: ContactCSVRow[],
): Promise<{ success: boolean; data?: ContactBulkImportResult; error?: string }> {
  const result = await checkManagerAccess();
  if ("error" in result) return { success: false, error: result.error };

  if (rows.length > MAX_CONTACT_IMPORT_ROWS) {
    return { success: false, error: `Too many rows; max is ${MAX_CONTACT_IMPORT_ROWS}` };
  }

  const supabase = createAdminClient();

  // Batch lookup: existing users by email for auto-linking
  const emails = rows.map((r) => r.email.toLowerCase().trim());
  const { data: existingUsers } = await supabase
    .from("users")
    .select("id, email")
    .eq("organization_id", result.organizationId)
    .in("email", emails);

  const userByEmail = new Map(
    (existingUsers ?? []).map((u) => [u.email.toLowerCase(), u.id]),
  );

  // Batch lookup: existing contacts to detect duplicates
  const { data: existingContacts } = await supabase
    .from("contacts")
    .select("email")
    .eq("organization_id", result.organizationId)
    .in("email", emails);

  const existingContactEmails = new Set(
    (existingContacts ?? []).map((c) => (c.email as string).toLowerCase()),
  );

  // Batch lookup: branches by name for branch_name resolution
  const branchNames = [...new Set(rows.filter((r) => r.branch_name).map((r) => r.branch_name!.toLowerCase().trim()))];
  let branchByName = new Map<string, string>();
  if (branchNames.length > 0) {
    const { data: branches } = await supabase
      .from("branches")
      .select("id, name")
      .eq("organization_id", result.organizationId);

    branchByName = new Map(
      (branches ?? []).map((b) => [(b.name as string).toLowerCase(), b.id as string]),
    );
  }

  const results: ContactImportResult[] = [];
  let successCount = 0;
  let failureCount = 0;

  for (const row of rows) {
    const email = row.email?.trim()?.toLowerCase();
    const fullName = row.full_name?.trim();

    if (!email) {
      results.push({ email: row.email || "", fullName: row.full_name || "", success: false, error: "Missing email" });
      failureCount++;
      continue;
    }

    if (!fullName) {
      results.push({ email, fullName: row.full_name || "", success: false, error: "Missing full name" });
      failureCount++;
      continue;
    }

    if (existingContactEmails.has(email)) {
      results.push({ email, fullName, success: false, error: "Contact already exists" });
      failureCount++;
      continue;
    }

    try {
      const { error } = await supabase.from("contacts").insert({
        organization_id: result.organizationId,
        email,
        full_name: fullName,
        department: row.department?.trim() || null,
        title: row.title?.trim() || null,
        phone: row.phone?.trim() || null,
        branch_id: row.branch_name ? branchByName.get(row.branch_name.toLowerCase().trim()) || null : null,
        user_id: userByEmail.get(email) || null,
      });

      if (error) {
        results.push({ email, fullName, success: false, error: error.message });
        failureCount++;
      } else {
        results.push({ email, fullName, success: true });
        successCount++;
        existingContactEmails.add(email);
      }
    } catch (err) {
      results.push({
        email,
        fullName,
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      });
      failureCount++;
    }
  }

  revalidatePath("/dashboard/contacts");
  return {
    success: true,
    data: { results, successCount, failureCount },
  };
}

// ==================== Department Helpers ====================

export async function getContactDepartments(): Promise<{
  success: boolean;
  data?: string[];
  error?: string;
}> {
  const result = await getUserOrganization();
  if ("error" in result) return { success: false, error: result.error };

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("contacts")
    .select("department")
    .eq("organization_id", result.organizationId)
    .not("department", "is", null)
    .eq("is_active", true);

  if (error) {
    return { success: false, error: error.message };
  }

  // Extract unique department names
  const departments = [...new Set(
    (data ?? [])
      .map((d) => d.department as string)
      .filter(Boolean),
  )].sort();

  return { success: true, data: departments };
}
