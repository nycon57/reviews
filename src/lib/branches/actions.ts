'use server';

/**
 * Branch Server Actions
 * CRUD operations for branch management
 */

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type {
  Branch,
  CreateBranchInput,
  UpdateBranchInput,
  BranchFilters,
  BranchWithLoanOfficers,
  ActionResult,
  BranchAddress,
} from './types';
import type { Json } from '@/types/database.types';

// Zod schemas for validation
const addressSchema = z.object({
  street: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(50).optional(),
  postal_code: z.string().max(20).optional(),
  country: z.string().max(50).optional(),
});

const createBranchSchema = z.object({
  name: z.string().min(1, 'Branch name is required').max(200),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens')
    .max(100)
    .optional(),
  address: addressSchema.optional(),
  phone: z.string().max(30).optional(),
  email: z.string().email().optional(),
  websiteUrl: z.string().url().optional(),
  googlePlaceId: z.string().max(100).optional(),
  managerName: z.string().max(200).optional(),
  managerEmail: z.string().email().optional(),
  region: z.string().max(100).optional(),
  description: z.string().max(2000).optional(),
});

const updateBranchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  address: addressSchema.optional(),
  phone: z.string().max(30).optional().nullable(),
  email: z.string().email().optional().nullable(),
  websiteUrl: z.string().url().optional().nullable(),
  googlePlaceId: z.string().max(100).optional().nullable(),
  managerName: z.string().max(200).optional().nullable(),
  managerEmail: z.string().email().optional().nullable(),
  region: z.string().max(100).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  isActive: z.boolean().optional(),
  isPublic: z.boolean().optional(),
});

// Database row type
interface BranchRow {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  address: Json | null;
  phone: string | null;
  email: string | null;
  website_url: string | null;
  google_place_id: string | null;
  google_maps_url: string | null;
  manager_name: string | null;
  manager_email: string | null;
  region: string | null;
  description: string | null;
  photo_url: string | null;
  cover_image_url: string | null;
  hours_of_operation: Json | null;
  is_active: boolean | null;
  is_public: boolean | null;
  average_rating: number | null;
  total_reviews: number | null;
  total_loan_officers: number | null;
  created_at: string | null;
  updated_at: string | null;
}

// Map database row to Branch type
function mapRowToBranch(row: BranchRow): Branch {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    slug: row.slug,
    address: row.address as BranchAddress | null,
    phone: row.phone,
    email: row.email,
    websiteUrl: row.website_url,
    googlePlaceId: row.google_place_id,
    googleMapsUrl: row.google_maps_url,
    managerName: row.manager_name,
    managerEmail: row.manager_email,
    region: row.region,
    description: row.description,
    photoUrl: row.photo_url,
    coverImageUrl: row.cover_image_url,
    hoursOfOperation: row.hours_of_operation as Record<string, unknown> | null,
    isActive: row.is_active ?? true,
    isPublic: row.is_public ?? true,
    averageRating: row.average_rating,
    totalReviews: row.total_reviews || 0,
    totalLoanOfficers: row.total_loan_officers || 0,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

// Generate a unique slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Common authorization check
async function requireAccess(): Promise<
  | { success: true; organizationId: string; userId: string; role: string }
  | { success: false; error: string }
> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('organization_id, role')
    .eq('id', user.id)
    .single();

  if (userError || !userData?.organization_id) {
    return { success: false, error: 'Organization not found' };
  }

  return {
    success: true,
    organizationId: userData.organization_id,
    userId: user.id,
    role: userData.role,
  };
}

/**
 * Get all branches for the current organization
 */
export async function getBranches(
  filters?: BranchFilters
): Promise<ActionResult<Branch[]>> {
  try {
    const auth = await requireAccess();
    if (!auth.success) {
      return { success: false, error: auth.error };
    }

    const supabase = await createClient();

    let query = supabase
      .from('branches')
      .select('*')
      .eq('organization_id', auth.organizationId)
      .order('name', { ascending: true });

    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }

    if (filters?.region) {
      query = query.eq('region', filters.region);
    }

    if (filters?.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,manager_name.ilike.%${filters.search}%,region.ilike.%${filters.search}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching branches:', error);
      return { success: false, error: 'Failed to fetch branches' };
    }

    const branches = (data || []).map((row) =>
      mapRowToBranch(row as unknown as BranchRow)
    );

    return { success: true, data: branches };
  } catch (error) {
    console.error('Error fetching branches:', error);
    return { success: false, error: 'Failed to fetch branches' };
  }
}

/**
 * Get a single branch by ID
 */
export async function getBranch(id: string): Promise<ActionResult<Branch>> {
  try {
    const auth = await requireAccess();
    if (!auth.success) {
      return { success: false, error: auth.error };
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .eq('id', id)
      .eq('organization_id', auth.organizationId)
      .single();

    if (error || !data) {
      return { success: false, error: 'Branch not found' };
    }

    return {
      success: true,
      data: mapRowToBranch(data as unknown as BranchRow),
    };
  } catch (error) {
    console.error('Error fetching branch:', error);
    return { success: false, error: 'Failed to fetch branch' };
  }
}

/**
 * Get a branch with its loan officers
 */
export async function getBranchWithLoanOfficers(
  id: string
): Promise<ActionResult<BranchWithLoanOfficers>> {
  try {
    const auth = await requireAccess();
    if (!auth.success) {
      return { success: false, error: auth.error };
    }

    const supabase = await createClient();

    // Get branch
    const { data: branchData, error: branchError } = await supabase
      .from('branches')
      .select('*')
      .eq('id', id)
      .eq('organization_id', auth.organizationId)
      .single();

    if (branchError || !branchData) {
      return { success: false, error: 'Branch not found' };
    }

    // Get loan officers for this branch
    const { data: loData, error: loError } = await supabase
      .from('loan_officers')
      .select('id, full_name, email, title, photo_url, average_rating, total_reviews')
      .eq('branch_id', id)
      .eq('is_active', true)
      .order('full_name', { ascending: true });

    if (loError) {
      console.error('Error fetching loan officers:', loError);
    }

    const branch = mapRowToBranch(branchData as unknown as BranchRow);
    const loanOfficers = (loData || []).map((lo) => ({
      id: lo.id,
      fullName: lo.full_name,
      email: lo.email,
      title: lo.title,
      photoUrl: lo.photo_url,
      averageRating: lo.average_rating,
      totalReviews: lo.total_reviews || 0,
    }));

    return {
      success: true,
      data: {
        ...branch,
        loanOfficers,
      },
    };
  } catch (error) {
    console.error('Error fetching branch with loan officers:', error);
    return { success: false, error: 'Failed to fetch branch' };
  }
}

/**
 * Create a new branch
 */
export async function createBranch(
  input: CreateBranchInput
): Promise<ActionResult<Branch>> {
  try {
    const auth = await requireAccess();
    if (!auth.success) {
      return { success: false, error: auth.error };
    }

    // Only admins and managers can create branches
    if (!['admin', 'manager'].includes(auth.role)) {
      return { success: false, error: 'Insufficient permissions' };
    }

    // Validate input
    const validated = createBranchSchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.errors[0]?.message || 'Invalid input',
      };
    }

    const adminSupabase = createAdminClient();

    // Generate slug if not provided
    let slug = validated.data.slug || generateSlug(validated.data.name);

    // Check if slug already exists, if so append a number
    const { data: existingSlug } = await adminSupabase
      .from('branches')
      .select('id')
      .eq('organization_id', auth.organizationId)
      .eq('slug', slug)
      .single();

    if (existingSlug) {
      // Find a unique slug
      let counter = 1;
      let newSlug = `${slug}-${counter}`;
      let exists = true;

      while (exists && counter < 100) {
        const { data } = await adminSupabase
          .from('branches')
          .select('id')
          .eq('organization_id', auth.organizationId)
          .eq('slug', newSlug)
          .single();

        if (!data) {
          exists = false;
          slug = newSlug;
        } else {
          counter++;
          newSlug = `${slug}-${counter}`;
        }
      }
    }

    // Create branch
    const { data, error } = await adminSupabase
      .from('branches')
      .insert({
        organization_id: auth.organizationId,
        name: validated.data.name,
        slug,
        address: validated.data.address as Json,
        phone: validated.data.phone,
        email: validated.data.email,
        website_url: validated.data.websiteUrl,
        google_place_id: validated.data.googlePlaceId,
        manager_name: validated.data.managerName,
        manager_email: validated.data.managerEmail,
        region: validated.data.region,
        description: validated.data.description,
        is_active: true,
        is_public: true,
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating branch:', error);
      return { success: false, error: 'Failed to create branch' };
    }

    revalidatePath('/dashboard/branches');
    revalidatePath('/dashboard/settings');

    return {
      success: true,
      data: mapRowToBranch(data as unknown as BranchRow),
    };
  } catch (error) {
    console.error('Error creating branch:', error);
    return { success: false, error: 'Failed to create branch' };
  }
}

/**
 * Update an existing branch
 */
export async function updateBranch(
  id: string,
  input: UpdateBranchInput
): Promise<ActionResult<Branch>> {
  try {
    const auth = await requireAccess();
    if (!auth.success) {
      return { success: false, error: auth.error };
    }

    // Only admins and managers can update branches
    if (!['admin', 'manager'].includes(auth.role)) {
      return { success: false, error: 'Insufficient permissions' };
    }

    // Validate input
    const validated = updateBranchSchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.errors[0]?.message || 'Invalid input',
      };
    }

    const supabase = await createClient();

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (validated.data.name !== undefined) {
      updateData.name = validated.data.name;
    }
    if (validated.data.address !== undefined) {
      updateData.address = validated.data.address as Json;
    }
    if (validated.data.phone !== undefined) {
      updateData.phone = validated.data.phone;
    }
    if (validated.data.email !== undefined) {
      updateData.email = validated.data.email;
    }
    if (validated.data.websiteUrl !== undefined) {
      updateData.website_url = validated.data.websiteUrl;
    }
    if (validated.data.googlePlaceId !== undefined) {
      updateData.google_place_id = validated.data.googlePlaceId;
    }
    if (validated.data.managerName !== undefined) {
      updateData.manager_name = validated.data.managerName;
    }
    if (validated.data.managerEmail !== undefined) {
      updateData.manager_email = validated.data.managerEmail;
    }
    if (validated.data.region !== undefined) {
      updateData.region = validated.data.region;
    }
    if (validated.data.description !== undefined) {
      updateData.description = validated.data.description;
    }
    if (validated.data.isActive !== undefined) {
      updateData.is_active = validated.data.isActive;
    }
    if (validated.data.isPublic !== undefined) {
      updateData.is_public = validated.data.isPublic;
    }

    const { data, error } = await supabase
      .from('branches')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', auth.organizationId)
      .select('*')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { success: false, error: 'Branch not found' };
      }
      console.error('Error updating branch:', error);
      return { success: false, error: 'Failed to update branch' };
    }

    revalidatePath('/dashboard/branches');
    revalidatePath(`/dashboard/branches/${id}`);

    return {
      success: true,
      data: mapRowToBranch(data as unknown as BranchRow),
    };
  } catch (error) {
    console.error('Error updating branch:', error);
    return { success: false, error: 'Failed to update branch' };
  }
}

/**
 * Delete (soft delete) a branch
 */
export async function deleteBranch(id: string): Promise<ActionResult> {
  try {
    const auth = await requireAccess();
    if (!auth.success) {
      return { success: false, error: auth.error };
    }

    // Only admins can delete branches
    if (auth.role !== 'admin') {
      return { success: false, error: 'Only admins can delete branches' };
    }

    const supabase = await createClient();

    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('branches')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('organization_id', auth.organizationId);

    if (error) {
      console.error('Error deleting branch:', error);
      return { success: false, error: 'Failed to delete branch' };
    }

    revalidatePath('/dashboard/branches');

    return { success: true };
  } catch (error) {
    console.error('Error deleting branch:', error);
    return { success: false, error: 'Failed to delete branch' };
  }
}

/**
 * Assign a loan officer to a branch
 */
export async function assignLoanOfficerToBranch(
  loanOfficerId: string,
  branchId: string | null
): Promise<ActionResult> {
  try {
    const auth = await requireAccess();
    if (!auth.success) {
      return { success: false, error: auth.error };
    }

    // Only admins and managers can assign loan officers
    if (!['admin', 'manager'].includes(auth.role)) {
      return { success: false, error: 'Insufficient permissions' };
    }

    const supabase = await createClient();

    // Verify branch exists (if assigning to a branch)
    if (branchId) {
      const { data: branch, error: branchError } = await supabase
        .from('branches')
        .select('id')
        .eq('id', branchId)
        .eq('organization_id', auth.organizationId)
        .single();

      if (branchError || !branch) {
        return { success: false, error: 'Branch not found' };
      }
    }

    // Update loan officer
    const { error } = await supabase
      .from('loan_officers')
      .update({
        branch_id: branchId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', loanOfficerId)
      .eq('organization_id', auth.organizationId);

    if (error) {
      console.error('Error assigning loan officer:', error);
      return { success: false, error: 'Failed to assign loan officer' };
    }

    // Update branch loan officer counts
    if (branchId) {
      await updateBranchLoanOfficerCount(branchId);
    }

    revalidatePath('/dashboard/branches');
    revalidatePath('/dashboard/loan-officers');

    return { success: true };
  } catch (error) {
    console.error('Error assigning loan officer:', error);
    return { success: false, error: 'Failed to assign loan officer' };
  }
}

/**
 * Update the total_loan_officers count for a branch
 */
async function updateBranchLoanOfficerCount(branchId: string): Promise<void> {
  const adminSupabase = createAdminClient();

  const { count } = await adminSupabase
    .from('loan_officers')
    .select('*', { count: 'exact', head: true })
    .eq('branch_id', branchId)
    .eq('is_active', true);

  await adminSupabase
    .from('branches')
    .update({
      total_loan_officers: count || 0,
      updated_at: new Date().toISOString(),
    })
    .eq('id', branchId);
}

/**
 * Get unique regions for filter dropdown
 */
export async function getBranchRegions(): Promise<ActionResult<string[]>> {
  try {
    const auth = await requireAccess();
    if (!auth.success) {
      return { success: false, error: auth.error };
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('branches')
      .select('region')
      .eq('organization_id', auth.organizationId)
      .not('region', 'is', null);

    if (error) {
      console.error('Error fetching regions:', error);
      return { success: false, error: 'Failed to fetch regions' };
    }

    const regions = [...new Set((data || []).map((b) => b.region).filter(Boolean))] as string[];

    return { success: true, data: regions.sort() };
  } catch (error) {
    console.error('Error fetching regions:', error);
    return { success: false, error: 'Failed to fetch regions' };
  }
}
