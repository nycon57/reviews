"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { ensureUniqueBranchSlug } from "@/lib/users/slug-utils";
import type {
  ParsedBranchData,
  ValidateBranchImportResponse,
  BranchRowValidationResult,
  BulkBranchImportResult,
  BranchImportResult,
} from "./bulk-import-types";
import { MAX_BRANCH_IMPORT_ROWS } from "./bulk-import-types";
import { branchImportRowSchema } from "./bulk-import-validation";
import { requireAccess } from "./actions";
import { generateSlug, geocodeBranchAddress } from "./utils";
import type { Json } from "@/types/database.types";

/**
 * Server-side validation: checks duplicate names, resolves managers
 */
export async function validateBranchImportData(
  branches: Partial<ParsedBranchData>[]
): Promise<ValidateBranchImportResponse> {
  const auth = await requireAccess();
  if (!auth.success) {
    return { rows: [], validCount: 0, errorCount: 0, warningCount: 0 };
  }

  const orgId = auth.organizationId;
  const supabase = createAdminClient();

  // Batch check existing branch names in org
  const names = branches
    .map((b) => b.name?.trim())
    .filter((n): n is string => !!n);
  const { data: existingBranches } = await supabase
    .from("branches")
    .select("name")
    .eq("organization_id", orgId)
    .in("name", names);

  const existingNames = new Set(
    (existingBranches ?? []).map((b) => b.name.toLowerCase())
  );

  // Resolve manager emails -> IDs
  const managerEmails = [
    ...new Set(
      branches
        .map((b) => b.manager_email?.toLowerCase().trim())
        .filter((v): v is string => !!v)
    ),
  ];
  const managerMap = new Map<string, { id: string; name: string }>();
  if (managerEmails.length > 0) {
    const { data: managers } = await supabase
      .from("users")
      .select("id, email, full_name")
      .eq("organization_id", orgId)
      .in("email", managerEmails);

    for (const mgr of managers ?? []) {
      managerMap.set(mgr.email.toLowerCase(), {
        id: mgr.id,
        name: mgr.full_name || "",
      });
    }
  }

  // Validate each row
  const seenNames = new Set<string>();
  let validCount = 0;

  const rows: BranchRowValidationResult[] = branches.map((data, rowIndex) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Zod validation
    const zodResult = branchImportRowSchema.safeParse(data);
    if (!zodResult.success) {
      for (const issue of zodResult.error.issues) {
        errors.push(`${issue.path.join(".")}: ${issue.message}`);
      }
    }

    const name = data.name?.trim().toLowerCase();

    // Duplicate within import (warning)
    if (name && seenNames.has(name)) {
      warnings.push("Duplicate branch name within import");
    }
    if (name) seenNames.add(name);

    // Already exists in org (warning)
    if (name && existingNames.has(name)) {
      warnings.push("Branch with this name already exists");
    }

    // Manager email resolution
    if (data.manager_email) {
      const mgrKey = data.manager_email.toLowerCase().trim();
      if (!managerMap.has(mgrKey)) {
        warnings.push(
          `Manager "${data.manager_email}" not found in organization`
        );
      }
    }

    const status =
      errors.length > 0 ? "error" : warnings.length > 0 ? "warning" : "valid";

    if (status !== "error") validCount++;

    return { rowIndex, data, status, errors, warnings };
  });

  const errorCount = rows.filter((r) => r.status === "error").length;
  const warningCount = rows.filter((r) => r.status === "warning").length;

  return { rows, validCount, errorCount, warningCount };
}

/**
 * Bulk import branches: create branch entries
 * Only processes rows that passed validation (no errors).
 */
export async function bulkImportBranches(
  branches: Partial<ParsedBranchData>[]
): Promise<BulkBranchImportResult> {
  const auth = await requireAccess();
  if (!auth.success) {
    return { results: [], successCount: 0, failureCount: 0 };
  }

  // Only admins and managers can import branches
  if (!["admin", "manager"].includes(auth.role)) {
    return { results: [], successCount: 0, failureCount: 0 };
  }

  const orgId = auth.organizationId;
  const supabase = createAdminClient();

  // Enforce max import size
  const toImport = branches.slice(0, MAX_BRANCH_IMPORT_ROWS);

  // Resolve manager emails in bulk
  const managerEmails = [
    ...new Set(
      toImport
        .map((b) => b.manager_email?.toLowerCase().trim())
        .filter((v): v is string => !!v)
    ),
  ];
  const managerMap = new Map<
    string,
    { id: string; name: string; email: string }
  >();
  if (managerEmails.length > 0) {
    const { data: managers } = await supabase
      .from("users")
      .select("id, email, full_name")
      .eq("organization_id", orgId)
      .in("email", managerEmails);

    for (const m of managers ?? []) {
      managerMap.set(m.email.toLowerCase(), {
        id: m.id,
        name: m.full_name || "",
        email: m.email,
      });
    }
  }

  // Get org slug for global_slug generation
  const { data: orgData } = await supabase
    .from("organizations")
    .select("slug")
    .eq("id", orgId)
    .single();

  // Phase 1: Prepare all rows (validate, generate slugs, geocode)
  const preparedRows: {
    insertData: {
      organization_id: string;
      name: string;
      slug: string;
      global_slug: string | null;
      address: Json;
      phone: string | null;
      email: string | null;
      manager_id: string | null;
      manager_name: string | null;
      manager_email: string | null;
      region: string | null;
      description: string | null;
      is_active: boolean;
      is_public: boolean;
      latitude: number | null;
      longitude: number | null;
    };
    name: string;
    region?: string;
  }[] = [];
  const preparationFailures: BranchImportResult[] = [];
  const usedSlugs = new Set<string>();

  for (const branch of toImport) {
    try {
      // Re-validate
      const zodResult = branchImportRowSchema.safeParse(branch);
      if (!zodResult.success) {
        preparationFailures.push({
          name: branch.name || "Unknown",
          region: branch.region,
          success: false,
          error: zodResult.error.errors[0]?.message || "Validation failed",
        });
        continue;
      }

      const name = branch.name!.trim();

      // Generate slug with uniqueness check (DB + within-batch)
      let slug = generateSlug(name);
      const slugTaken = async (s: string) => {
        if (usedSlugs.has(s)) return true;
        const { data } = await supabase
          .from("branches")
          .select("id")
          .eq("organization_id", orgId)
          .eq("slug", s)
          .single();
        return !!data;
      };

      if (await slugTaken(slug)) {
        let counter = 1;
        while (await slugTaken(`${slug}-${counter}`)) {
          counter++;
          if (counter > 1000) {
            throw new Error(`Unable to generate unique slug for branch "${name}" after 1000 attempts`);
          }
        }
        slug = `${slug}-${counter}`;
      }
      usedSlugs.add(slug);

      // Generate global_slug
      let globalSlug: string | null = null;
      if (orgData?.slug) {
        const baseGlobalSlug = `${slug}-${orgData.slug}`;
        globalSlug = await ensureUniqueBranchSlug(baseGlobalSlug);
      }

      // Resolve manager
      let managerId: string | null = null;
      let managerName: string | null = null;
      let managerEmail: string | null = null;
      if (branch.manager_email) {
        const mgr = managerMap.get(branch.manager_email.toLowerCase().trim());
        if (mgr) {
          managerId = mgr.id;
          managerName = mgr.name;
          managerEmail = mgr.email;
        }
      }

      // Build address
      const address =
        branch.street || branch.city || branch.state || branch.postal_code
          ? {
              street: branch.street || undefined,
              city: branch.city || undefined,
              state: branch.state || undefined,
              postal_code: branch.postal_code || undefined,
            }
          : null;

      // Geocode address
      const coords = address ? await geocodeBranchAddress(address) : null;

      preparedRows.push({
        insertData: {
          organization_id: orgId,
          name,
          slug,
          global_slug: globalSlug,
          address: address as Json,
          phone: branch.phone || null,
          email: branch.email || null,
          manager_id: managerId,
          manager_name: managerName,
          manager_email: managerEmail,
          region: branch.region || null,
          description: branch.description || null,
          is_active: true,
          is_public: true,
          latitude: coords?.latitude ?? null,
          longitude: coords?.longitude ?? null,
        },
        name,
        region: branch.region,
      });
    } catch (err) {
      preparationFailures.push({
        name: branch.name || "Unknown",
        region: branch.region,
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  // Phase 2: Atomic batch insert — all or nothing
  if (preparedRows.length > 0) {
    const { error: batchError } = await supabase
      .from("branches")
      .insert(preparedRows.map((r) => r.insertData));

    if (batchError) {
      // If unique constraint violation (slug conflict from TOCTOU), retry with fresh slugs
      const isUniqueViolation =
        batchError.code === "23505" || batchError.message?.includes("duplicate key");

      if (isUniqueViolation) {
        // Regenerate slugs for all rows and retry once
        const retryUsedSlugs = new Set<string>();
        const retryFailedIndices: number[] = [];
        for (let ri = 0; ri < preparedRows.length; ri++) {
          const row = preparedRows[ri];
          try {
            let retrySlug = generateSlug(row.name);
            const retrySlugTaken = async (s: string) => {
              if (retryUsedSlugs.has(s)) return true;
              const { data } = await supabase
                .from("branches")
                .select("id")
                .eq("organization_id", orgId)
                .eq("slug", s)
                .single();
              return !!data;
            };

            if (await retrySlugTaken(retrySlug)) {
              let counter = 1;
              while (await retrySlugTaken(`${retrySlug}-${counter}`)) {
                counter++;
                if (counter > 1000) {
                  throw new Error(`Exceeded slug retry limit for branch "${row.name}"`);
                }
              }
              retrySlug = `${retrySlug}-${counter}`;
            }
            retryUsedSlugs.add(retrySlug);
            row.insertData.slug = retrySlug;

            // Regenerate global_slug
            if (orgData?.slug) {
              row.insertData.global_slug = await ensureUniqueBranchSlug(
                `${retrySlug}-${orgData.slug}`
              );
            }
          } catch (err) {
            retryFailedIndices.push(ri);
            preparationFailures.push({
              name: row.name,
              region: row.region,
              success: false,
              error: err instanceof Error ? err.message : "Slug generation failed",
            });
          }
        }
        // Remove rows that failed slug regeneration (reverse to preserve indices)
        for (let i = retryFailedIndices.length - 1; i >= 0; i--) {
          preparedRows.splice(retryFailedIndices[i], 1);
        }

        if (preparedRows.length === 0) {
          return {
            results: preparationFailures,
            successCount: 0,
            failureCount: preparationFailures.length,
          };
        }

        const { error: retryError } = await supabase
          .from("branches")
          .insert(preparedRows.map((r) => r.insertData));

        if (retryError) {
          return {
            results: [
              ...preparationFailures,
              ...preparedRows.map((r) => ({
                name: r.name,
                region: r.region,
                success: false as const,
                error: retryError.message,
              })),
            ],
            successCount: 0,
            failureCount: preparationFailures.length + preparedRows.length,
          };
        }

        revalidatePath("/dashboard/organization");
        return {
          results: [
            ...preparationFailures,
            ...preparedRows.map((r) => ({
              name: r.name,
              region: r.region,
              success: true as const,
            })),
          ],
          successCount: preparedRows.length,
          failureCount: preparationFailures.length,
        };
      }

      return {
        results: [
          ...preparationFailures,
          ...preparedRows.map((r) => ({
            name: r.name,
            region: r.region,
            success: false as const,
            error: batchError.message,
          })),
        ],
        successCount: 0,
        failureCount: preparationFailures.length + preparedRows.length,
      };
    }

    revalidatePath("/dashboard/organization");
    return {
      results: [
        ...preparationFailures,
        ...preparedRows.map((r) => ({
          name: r.name,
          region: r.region,
          success: true as const,
        })),
      ],
      successCount: preparedRows.length,
      failureCount: preparationFailures.length,
    };
  }

  return {
    results: preparationFailures,
    successCount: 0,
    failureCount: preparationFailures.length,
  };
}
