"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";
import { revalidatePath } from "next/cache";
import { generateUniqueUserSlug } from "@/lib/users/slug-utils";
import { TIER_LIMITS, type SubscriptionTier } from "./types";
import type {
  ParsedUserData,
  ValidateImportResponse,
  RowValidationResult,
  BulkImportResult,
  UserImportResult,
} from "./bulk-import-types";
import { MAX_IMPORT_ROWS } from "./bulk-import-types";
import { importRowSchema } from "./bulk-import-validation";
import crypto from "crypto";

/**
 * Server-side validation: checks duplicate emails, resolves branches/managers, enforces tier limits
 */
export async function validateImportData(
  users: Partial<ParsedUserData>[]
): Promise<ValidateImportResponse> {
  const authUser = await unifiedGetUser();
  if (!authUser) {
    return {
      rows: [],
      validCount: 0,
      errorCount: 0,
      warningCount: 0,
      tierLimitExceeded: false,
      remainingSeats: 0,
    };
  }

  const supabase = createAdminClient();

  // Get current user's org + role
  const { data: userData } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("id", authUser.id)
    .single();

  if (!userData?.organization_id || userData.role !== "admin") {
    return {
      rows: [],
      validCount: 0,
      errorCount: 0,
      warningCount: 0,
      tierLimitExceeded: false,
      remainingSeats: 0,
    };
  }

  const orgId = userData.organization_id;

  // Get org tier + current user count
  const [{ data: org }, { count: currentUserCount }] = await Promise.all([
    supabase
      .from("organizations")
      .select("subscription_tier")
      .eq("id", orgId)
      .single(),
    supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId),
  ]);

  const tier = (org?.subscription_tier as SubscriptionTier) ?? "free";
  const maxUsers = TIER_LIMITS[tier].max_users;
  const currentCount = currentUserCount ?? 0;
  const remainingSeats = maxUsers === -1 ? Infinity : maxUsers - currentCount;

  // Batch check existing emails in org
  const emails = users.map((u) => u.email?.toLowerCase().trim()).filter((e): e is string => !!e);
  const { data: existingUsers } = await supabase
    .from("users")
    .select("email")
    .eq("organization_id", orgId)
    .in("email", emails);

  const existingEmails = new Set(
    (existingUsers ?? []).map((u) => u.email.toLowerCase())
  );

  // Also check auth.users for globally existing emails
  // We can't query auth.users table directly with .in(), so we'll check per-row below
  // But we can batch check the users table globally
  const { data: globalUsers } = await supabase
    .from("users")
    .select("email")
    .in("email", emails);

  const globalEmails = new Set(
    (globalUsers ?? []).map((u) => u.email.toLowerCase())
  );

  // Resolve branch names → IDs
  const branchNames = [
    ...new Set(
      users.map((u) => u.branch_name).filter((v): v is string => !!v)
    ),
  ];
  const branchMap = new Map<string, string>();
  if (branchNames.length > 0) {
    const { data: branches } = await supabase
      .from("branches")
      .select("id, name")
      .eq("organization_id", orgId)
      .in("name", branchNames);

    for (const branch of branches ?? []) {
      branchMap.set(branch.name.toLowerCase(), branch.id);
    }
  }

  // Resolve manager emails → IDs
  const managerEmails = [
    ...new Set(
      users
        .map((u) => u.manager_email?.toLowerCase())
        .filter((v): v is string => !!v)
    ),
  ];
  const managerMap = new Map<string, string>();
  if (managerEmails.length > 0) {
    const { data: managers } = await supabase
      .from("users")
      .select("id, email")
      .eq("organization_id", orgId)
      .in("email", managerEmails);

    for (const mgr of managers ?? []) {
      managerMap.set(mgr.email.toLowerCase(), mgr.id);
    }
  }

  // Validate each row
  const seenEmails = new Set<string>();
  let validCount = 0;

  const rows: RowValidationResult[] = users.map((data, rowIndex) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Zod validation
    const zodResult = importRowSchema.safeParse(data);
    if (!zodResult.success) {
      for (const issue of zodResult.error.issues) {
        errors.push(`${issue.path.join(".")}: ${issue.message}`);
      }
    }

    const email = data.email?.toLowerCase().trim();

    // Duplicate within import
    if (email && seenEmails.has(email)) {
      errors.push("Duplicate email within import");
    }
    if (email) seenEmails.add(email);

    // Already exists in org
    if (email && existingEmails.has(email)) {
      errors.push("Email already exists in your organization");
    }

    // Already exists globally (different org)
    if (email && !existingEmails.has(email) && globalEmails.has(email)) {
      errors.push("Email already registered in the system");
    }

    // Branch name resolution
    if (data.branch_name && !branchMap.has(data.branch_name.toLowerCase())) {
      warnings.push(`Branch "${data.branch_name}" not found — will be skipped`);
    }

    // Manager email resolution
    if (
      data.manager_email &&
      !managerMap.has(data.manager_email.toLowerCase())
    ) {
      warnings.push(
        `Manager "${data.manager_email}" not found — will be skipped`
      );
    }

    const status =
      errors.length > 0 ? "error" : warnings.length > 0 ? "warning" : "valid";

    if (status !== "error") validCount++;

    return { rowIndex, data, status, errors, warnings };
  });

  const errorCount = rows.filter((r) => r.status === "error").length;
  const warningCount = rows.filter((r) => r.status === "warning").length;
  const tierLimitExceeded = maxUsers !== -1 && validCount > remainingSeats;

  return {
    rows,
    validCount,
    errorCount,
    warningCount,
    tierLimitExceeded,
    remainingSeats: maxUsers === -1 ? -1 : remainingSeats,
  };
}

/**
 * Bulk import users: create auth users + users table entries
 * Only processes rows that passed validation (no errors).
 */
export async function bulkImportUsers(
  users: ParsedUserData[]
): Promise<BulkImportResult> {
  const authUser = await unifiedGetUser();
  if (!authUser) {
    return { results: [], successCount: 0, failureCount: 0 };
  }

  const supabase = createAdminClient();

  // Verify admin role
  const { data: userData } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("id", authUser.id)
    .single();

  if (!userData?.organization_id || userData.role !== "admin") {
    return { results: [], successCount: 0, failureCount: 0 };
  }

  const orgId = userData.organization_id;

  // Enforce max import size
  const toImport = users.slice(0, MAX_IMPORT_ROWS);

  // Re-check tier limits
  const [{ data: org }, { count: currentUserCount }] = await Promise.all([
    supabase
      .from("organizations")
      .select("subscription_tier")
      .eq("id", orgId)
      .single(),
    supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId),
  ]);

  const tier = (org?.subscription_tier as SubscriptionTier) ?? "free";
  const maxUsers = TIER_LIMITS[tier].max_users;
  const currentCount = currentUserCount ?? 0;

  if (maxUsers !== -1 && currentCount + toImport.length > maxUsers) {
    return {
      results: toImport.map((u) => ({
        email: u.email,
        full_name: u.full_name,
        success: false,
        error: "Tier user limit exceeded",
      })),
      successCount: 0,
      failureCount: toImport.length,
    };
  }

  // Resolve branch names and manager emails in bulk
  const branchNames = [
    ...new Set(
      toImport.map((u) => u.branch_name).filter((v): v is string => !!v)
    ),
  ];
  const managerEmails = [
    ...new Set(
      toImport
        .map((u) => u.manager_email?.toLowerCase())
        .filter((v): v is string => !!v)
    ),
  ];

  const branchMap = new Map<string, string>();
  const managerMap = new Map<string, string>();

  if (branchNames.length > 0) {
    const { data: branches } = await supabase
      .from("branches")
      .select("id, name")
      .eq("organization_id", orgId)
      .in("name", branchNames);

    for (const b of branches ?? []) {
      branchMap.set(b.name.toLowerCase(), b.id);
    }
  }

  if (managerEmails.length > 0) {
    const { data: managers } = await supabase
      .from("users")
      .select("id, email")
      .eq("organization_id", orgId)
      .in("email", managerEmails);

    for (const m of managers ?? []) {
      managerMap.set(m.email.toLowerCase(), m.id);
    }
  }

  // Process each user sequentially, tracking created auth users for rollback
  const results: UserImportResult[] = [];
  let successCount = 0;
  let failureCount = 0;
  const createdAuthIds: string[] = [];

  let localUserCount = currentCount;

  try {
    for (const user of toImport) {
      try {
        const email = user.email.toLowerCase().trim();
        const randomPassword = crypto.randomBytes(20).toString("hex");

        // Check tier limit using local counter
        if (maxUsers !== -1 && localUserCount >= maxUsers) {
          results.push({
            email,
            full_name: user.full_name,
            success: false,
            error: "Tier user limit exceeded",
          });
          failureCount++;
          continue;
        }

        // Create auth user
        const { data: authData, error: authError } =
          await supabase.auth.admin.createUser({
            email,
            password: randomPassword,
            email_confirm: true,
          });

        if (authError || !authData.user) {
          results.push({
            email,
            full_name: user.full_name,
            success: false,
            error: authError?.message ?? "Failed to create auth user",
          });
          failureCount++;
          continue;
        }

        createdAuthIds.push(authData.user.id);

        // Generate unique slug
        const slug = await generateUniqueUserSlug(user.full_name);

        // Resolve optional fields
        const branchId = user.branch_name
          ? branchMap.get(user.branch_name.toLowerCase()) ?? null
          : null;
        const managerId = user.manager_email
          ? managerMap.get(user.manager_email.toLowerCase()) ?? null
          : null;

        // Insert into users table
        const { error: insertError } = await supabase.from("users").insert({
          id: authData.user.id,
          organization_id: orgId,
          email,
          full_name: user.full_name.trim(),
          role: user.role as "admin" | "manager" | "user",
          is_active: false,
          slug,
          phone: user.phone || null,
          title: user.title || null,
          nmls_id: user.nmls_id || null,
          branch_id: branchId,
          manager_id: managerId,
          hire_date: user.hire_date || null,
          region: user.region || null,
        });

        if (insertError) {
          // Clean up: delete auth user if users table insert fails
          try {
            await supabase.auth.admin.deleteUser(authData.user.id);
          } catch (deleteErr) {
            const deleteMsg = deleteErr instanceof Error ? deleteErr.message : "Unknown cleanup error";
            console.error(`Failed to clean up auth user ${authData.user.id}:`, deleteMsg);
            results.push({
              email,
              full_name: user.full_name,
              success: false,
              error: `${insertError.message}; cleanup also failed: ${deleteMsg}`,
            });
            failureCount++;
            // Remove from tracking since we already attempted cleanup
            const idx = createdAuthIds.indexOf(authData.user.id);
            if (idx !== -1) createdAuthIds.splice(idx, 1);
            continue;
          }
          // Successfully cleaned up, remove from tracking
          const idx = createdAuthIds.indexOf(authData.user.id);
          if (idx !== -1) createdAuthIds.splice(idx, 1);
          results.push({
            email,
            full_name: user.full_name,
            success: false,
            error: insertError.message,
          });
          failureCount++;
          continue;
        }

        results.push({
          email,
          full_name: user.full_name,
          success: true,
        });
        successCount++;
        localUserCount++;
      } catch (err) {
        results.push({
          email: user.email,
          full_name: user.full_name,
          success: false,
          error: err instanceof Error ? err.message : "Unknown error",
        });
        failureCount++;
      }
    }
  } catch (outerErr) {
    // Unexpected failure — clean up orphaned auth users that don't have a users row yet
    console.error("Bulk import unexpected failure, cleaning up orphaned auth users:", outerErr);
    for (const authId of createdAuthIds) {
      try {
        // Check if user row exists before deleting auth
        const { data: existingRow } = await supabase
          .from("users")
          .select("id")
          .eq("id", authId)
          .maybeSingle();
        if (!existingRow) {
          await supabase.auth.admin.deleteUser(authId);
        }
      } catch (cleanupErr) {
        console.error(`Failed to clean up orphaned auth user ${authId}:`, cleanupErr);
      }
    }
  }

  revalidatePath("/dashboard/organization");

  return { results, successCount, failureCount };
}
