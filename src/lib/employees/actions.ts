"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";
import type { Database } from "@/types/database.types";
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  employeeSchema,
  MAX_EMPLOYEE_IMPORT_ROWS,
  type Employee,
  type CreateEmployeeInput,
  type UpdateEmployeeInput,
  type EmployeeCSVRow,
  type EmployeeImportResult,
  type EmployeeBulkImportResult,
} from "./types";

type EmployeeRow = Database["public"]["Tables"]["employees"]["Row"];
type EmployeeUpdate = Database["public"]["Tables"]["employees"]["Update"];

// ==================== Auth Helpers ====================

async function getUserOrganization() {
  const user = await unifiedGetUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const supabase = createAdminClient();
  const { data: userData } = await supabase
    .from("users")
    .select("organization_id, role, organizations(account_type)")
    .eq("id", user.id)
    .single();

  if (!userData?.organization_id) {
    return { error: "No organization found" };
  }

  // Employees is enterprise-only
  const org = userData.organizations as { account_type: string | null } | null;
  if (!org) {
    return { error: "Organization not found" };
  }
  if (org.account_type !== "enterprise") {
    return { error: "Employees requires an enterprise account" };
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

function mapEmployee(d: EmployeeRow): Employee {
  return employeeSchema.parse({
    id: d.id,
    organizationId: d.organization_id,
    email: d.email,
    fullName: d.full_name,
    department: d.department ?? null,
    branchId: d.branch_id ?? null,
    title: d.title ?? null,
    phone: d.phone ?? null,
    isActive: d.is_active,
    userId: d.user_id ?? null,
    metadata: (d.metadata as Record<string, unknown>) ?? {},
    createdAt: d.created_at,
    updatedAt: d.updated_at,
  });
}

// ==================== CRUD Actions ====================

export async function getEmployees(
  page = 1,
  pageSize = 25,
  search?: string,
): Promise<{ success: boolean; data?: Employee[]; total?: number; error?: string }> {
  const result = await getUserOrganization();
  if ("error" in result) return { success: false, error: result.error };

  const supabase = createAdminClient();
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from("employees")
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
    data: data?.map(mapEmployee) ?? [],
    total: count ?? 0,
  };
}

export async function createEmployee(
  input: CreateEmployeeInput,
): Promise<{ success: boolean; data?: Employee; error?: string }> {
  const result = await checkManagerAccess();
  if ("error" in result) return { success: false, error: result.error };

  const parsed = createEmployeeSchema.safeParse(input);
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
    .from("employees")
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
      return { success: false, error: "An employee with this email already exists in your organization" };
    }
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/people");
  return { success: true, data: mapEmployee(data) };
}

export async function updateEmployee(
  id: string,
  input: UpdateEmployeeInput,
): Promise<{ success: boolean; data?: Employee; error?: string }> {
  const result = await checkManagerAccess();
  if ("error" in result) return { success: false, error: result.error };

  const parsed = updateEmployeeSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const supabase = createAdminClient();

  const updateData: EmployeeUpdate = {};
  if (parsed.data.email !== undefined) updateData.email = parsed.data.email;
  if (parsed.data.fullName !== undefined) updateData.full_name = parsed.data.fullName;
  if (parsed.data.department !== undefined) updateData.department = parsed.data.department || null;
  if (parsed.data.branchId !== undefined) updateData.branch_id = parsed.data.branchId || null;
  if (parsed.data.title !== undefined) updateData.title = parsed.data.title || null;
  if (parsed.data.phone !== undefined) updateData.phone = parsed.data.phone || null;
  if (parsed.data.isActive !== undefined) updateData.is_active = parsed.data.isActive;

  const { data, error } = await supabase
    .from("employees")
    .update(updateData)
    .eq("id", id)
    .eq("organization_id", result.organizationId)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  if (!data) {
    return { success: false, error: "Employee not found" };
  }

  revalidatePath("/dashboard/people");
  return { success: true, data: mapEmployee(data) };
}

export async function deleteEmployee(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  const result = await checkManagerAccess();
  if ("error" in result) return { success: false, error: result.error };

  const supabase = createAdminClient();

  // Soft delete
  const { data, error } = await supabase
    .from("employees")
    .update({ is_active: false })
    .eq("id", id)
    .eq("organization_id", result.organizationId)
    .select("id");

  if (error) {
    return { success: false, error: error.message };
  }

  if (!data || data.length === 0) {
    return { success: false, error: "Employee not found" };
  }

  revalidatePath("/dashboard/people");
  return { success: true };
}

// ==================== Bulk Import ====================

export async function bulkImportEmployees(
  rows: EmployeeCSVRow[],
): Promise<{ success: boolean; data?: EmployeeBulkImportResult; error?: string }> {
  const result = await checkManagerAccess();
  if ("error" in result) return { success: false, error: result.error };

  if (rows.length > MAX_EMPLOYEE_IMPORT_ROWS) {
    return { success: false, error: `Too many rows; max is ${MAX_EMPLOYEE_IMPORT_ROWS}` };
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

  // Batch lookup: existing employees to detect duplicates
  const { data: existingEmployees } = await supabase
    .from("employees")
    .select("email")
    .eq("organization_id", result.organizationId)
    .in("email", emails);

  const existingEmployeeEmails = new Set(
    (existingEmployees ?? []).map((e) => e.email.toLowerCase()),
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
      (branches ?? []).map((b) => [b.name.toLowerCase(), b.id]),
    );
  }

  const results: EmployeeImportResult[] = [];
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

    if (existingEmployeeEmails.has(email)) {
      results.push({ email, fullName, success: false, error: "Employee already exists" });
      failureCount++;
      continue;
    }

    try {
      const { error } = await supabase.from("employees").insert({
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
        if (error.code === "23505") {
          existingEmployeeEmails.add(email);
          results.push({ email, fullName, success: false, error: "Employee already exists" });
        } else {
          results.push({ email, fullName, success: false, error: error.message });
        }
        failureCount++;
      } else {
        results.push({ email, fullName, success: true });
        successCount++;
        existingEmployeeEmails.add(email);
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

  revalidatePath("/dashboard/people");
  return {
    success: true,
    data: { results, successCount, failureCount },
  };
}

// ==================== Department Helpers ====================

export async function getEmployeeDepartments(): Promise<{
  success: boolean;
  data?: string[];
  error?: string;
}> {
  const result = await getUserOrganization();
  if ("error" in result) return { success: false, error: result.error };

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("employees")
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
      .map((d) => d.department)
      .filter((d): d is string => d !== null && d !== undefined),
  )].sort();

  return { success: true, data: departments };
}
