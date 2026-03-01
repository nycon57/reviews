'use server';

/**
 * Branch Server Actions
 * CRUD operations for branch management
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { unifiedGetUser } from '@/lib/auth/actions';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type {
  Branch,
  CreateBranchInput,
  UpdateBranchInput,
  BranchFilters,
  BranchWithTeamMembers,
  ActionResult,
  BranchAddress,
} from './types';
import type { Json } from '@/types/database.types';
import { ensureUniqueBranchSlug } from '@/lib/users/slug-utils';
import { generateSlug, geocodeBranchAddress } from './utils';

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
  managerId: z.string().uuid().optional(),
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
  managerId: z.string().uuid().optional().nullable(),
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
  global_slug: string | null;
  address: Json | null;
  phone: string | null;
  email: string | null;
  website_url: string | null;
  google_place_id: string | null;
  google_maps_url: string | null;
  manager_id: string | null;
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
  total_members: number | null;
  latitude: number | null;
  longitude: number | null;
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
    globalSlug: row.global_slug,
    address: row.address as BranchAddress | null,
    phone: row.phone,
    email: row.email,
    websiteUrl: row.website_url,
    googlePlaceId: row.google_place_id,
    googleMapsUrl: row.google_maps_url,
    managerId: row.manager_id,
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
    totalMembers: row.total_members || 0,
    latitude: row.latitude,
    longitude: row.longitude,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

// Common authorization check
export async function requireAccess(): Promise<
  | { success: true; organizationId: string; userId: string; role: string }
  | { success: false; error: string }
> {
  const user = await unifiedGetUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const supabase = createAdminClient();
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

    const supabase = createAdminClient();

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

    const supabase = createAdminClient();

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
export async function getBranchWithTeamMembers(
  id: string
): Promise<ActionResult<BranchWithTeamMembers>> {
  try {
    const auth = await requireAccess();
    if (!auth.success) {
      return { success: false, error: auth.error };
    }

    const supabase = createAdminClient();

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

    // Get team members for this branch
    const { data: teamData, error: teamError } = await supabase
      .from('users')
      .select('id, full_name, email, title, photo_url, average_rating, total_reviews')
      .eq('branch_id', id)
      .eq('is_active', true)
      .order('full_name', { ascending: true });

    if (teamError) {
      console.error('Error fetching team members:', teamError);
    }

    const branch = mapRowToBranch(branchData as unknown as BranchRow);
    const teamMembers = (teamData || []).map((m) => ({
      id: m.id,
      fullName: m.full_name || 'Unknown',
      email: m.email,
      title: m.title,
      photoUrl: m.photo_url,
      averageRating: m.average_rating,
      totalReviews: m.total_reviews || 0,
    }));

    return {
      success: true,
      data: {
        ...branch,
        teamMembers,
      },
    };
  } catch (error) {
    console.error('Error fetching branch with team members:', error);
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

    // Generate global_slug for SEO-friendly URLs
    let globalSlug: string | null = null;
    const { data: orgData } = await adminSupabase
      .from('organizations')
      .select('slug')
      .eq('id', auth.organizationId)
      .single();

    if (orgData?.slug) {
      const baseGlobalSlug = `${slug}-${orgData.slug}`;
      globalSlug = await ensureUniqueBranchSlug(baseGlobalSlug);
    }

    // Validate manager_id if provided
    if (validated.data.managerId) {
      const { data: managerUser, error: managerError } = await adminSupabase
        .from('users')
        .select('id')
        .eq('id', validated.data.managerId)
        .eq('is_active', true)
        .single();

      if (managerError || !managerUser) {
        return { success: false, error: 'Manager must be an active user' };
      }
    }

    // Geocode the address if provided
    const coords = await geocodeBranchAddress(validated.data.address);

    // Create branch
    const { data, error } = await adminSupabase
      .from('branches')
      .insert({
        organization_id: auth.organizationId,
        name: validated.data.name,
        slug,
        global_slug: globalSlug,
        address: validated.data.address as Json,
        phone: validated.data.phone,
        email: validated.data.email,
        website_url: validated.data.websiteUrl,
        google_place_id: validated.data.googlePlaceId,
        manager_id: validated.data.managerId,
        manager_name: validated.data.managerName,
        manager_email: validated.data.managerEmail,
        region: validated.data.region,
        description: validated.data.description,
        is_active: true,
        is_public: true,
        latitude: coords?.latitude ?? null,
        longitude: coords?.longitude ?? null,
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

    const supabase = createAdminClient();

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (validated.data.name !== undefined) {
      updateData.name = validated.data.name;
      // Regenerate slug and global_slug when name changes
      const newSlug = generateSlug(validated.data.name);
      updateData.slug = newSlug;

      const { data: orgData } = await supabase
        .from('organizations')
        .select('slug')
        .eq('id', auth.organizationId)
        .single();

      if (orgData?.slug) {
        const baseGlobalSlug = `${newSlug}-${orgData.slug}`;
        updateData.global_slug = await ensureUniqueBranchSlug(baseGlobalSlug, id);
      }
    }
    if (validated.data.address !== undefined) {
      updateData.address = validated.data.address as Json;
      // Geocode the new address
      const coords = await geocodeBranchAddress(validated.data.address);
      updateData.latitude = coords?.latitude ?? null;
      updateData.longitude = coords?.longitude ?? null;
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
    if (validated.data.managerId !== undefined) {
      if (validated.data.managerId !== null) {
        // Validate manager is an active user at this branch
        const { data: managerUser, error: managerError } = await supabase
          .from('users')
          .select('id')
          .eq('id', validated.data.managerId)
          .eq('branch_id', id)
          .eq('is_active', true)
          .single();

        if (managerError || !managerUser) {
          return { success: false, error: 'Manager must be an active user assigned to this branch' };
        }
      }
      updateData.manager_id = validated.data.managerId;
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

    const supabase = createAdminClient();

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
export async function assignUserToBranch(
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

    const supabase = createAdminClient();

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
      .from('users')
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

    // Update branch member counts
    if (branchId) {
      await updateBranchMemberCount(branchId);
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
 * Update the total_members count for a branch
 */
async function updateBranchMemberCount(branchId: string): Promise<void> {
  const adminSupabase = createAdminClient();

  const { count } = await adminSupabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('branch_id', branchId)
    .eq('is_active', true);

  await adminSupabase
    .from('branches')
    .update({
      total_members: count || 0,
      updated_at: new Date().toISOString(),
    })
    .eq('id', branchId);
}

/**
 * Upload a photo for a branch
 */
export async function uploadBranchPhoto(
  branchId: string,
  formData: FormData
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const auth = await requireAccess();
    if (!auth.success) {
      return { success: false, error: auth.error };
    }

    if (!['admin', 'manager'].includes(auth.role)) {
      return { success: false, error: 'Only admins and managers can update branch photos' };
    }

    const supabase = createAdminClient();

    const { data: branchData } = await supabase
      .from('branches')
      .select('organization_id, photo_url')
      .eq('id', branchId)
      .single();

    if (!branchData || branchData.organization_id !== auth.organizationId) {
      return { success: false, error: 'Branch not found in organization' };
    }

    const file = formData.get('file') as File;
    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: 'Invalid file type. Please upload a JPG, PNG, or WebP image.' };
    }

    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: 'File too large. Maximum size is 5MB.' };
    }

    const oldPhotoUrl = branchData.photo_url;
    const mimeToExt: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
    const fileExt = mimeToExt[file.type] || 'jpg';
    const fileName = `branches/${branchId}/photo-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { cacheControl: '3600', upsert: false });

    if (uploadError) {
      console.error('Error uploading branch photo to storage:', uploadError);
      return { success: false, error: 'Failed to upload image. Please try again.' };
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    const { error: dbError } = await supabase
      .from('branches')
      .update({
        photo_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', branchId)
      .eq('organization_id', auth.organizationId);

    if (dbError) {
      await supabase.storage.from('avatars').remove([fileName]);
      return { success: false, error: 'Failed to update branch. Please try again.' };
    }

    // Cleanup old photo
    if (oldPhotoUrl && oldPhotoUrl.includes('/avatars/')) {
      const oldPath = oldPhotoUrl.split('/avatars/').pop();
      if (oldPath && oldPath !== fileName) {
        await supabase.storage.from('avatars').remove([oldPath]);
      }
    }

    revalidatePath('/dashboard/organization');
    revalidatePath(`/dashboard/organization/branches/${branchId}`);
    return { success: true, url: publicUrl };
  } catch (error) {
    console.error('Error uploading branch photo:', error);
    return { success: false, error: 'Failed to upload branch photo' };
  }
}

/**
 * Upload a cover image for a branch
 */
export async function uploadBranchCoverImage(
  branchId: string,
  formData: FormData
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const auth = await requireAccess();
    if (!auth.success) {
      return { success: false, error: auth.error };
    }

    if (!['admin', 'manager'].includes(auth.role)) {
      return { success: false, error: 'Only admins and managers can update branch cover images' };
    }

    const supabase = createAdminClient();

    const { data: branchData } = await supabase
      .from('branches')
      .select('organization_id, cover_image_url')
      .eq('id', branchId)
      .single();

    if (!branchData || branchData.organization_id !== auth.organizationId) {
      return { success: false, error: 'Branch not found in organization' };
    }

    const file = formData.get('file') as File;
    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: 'Invalid file type. Please upload a JPG, PNG, or WebP image.' };
    }

    if (file.size > 10 * 1024 * 1024) {
      return { success: false, error: 'File too large. Maximum size is 10MB.' };
    }

    const oldCoverUrl = branchData.cover_image_url;
    const mimeToExt: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
    const fileExt = mimeToExt[file.type] || 'jpg';
    const fileName = `branches/${branchId}/cover-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { cacheControl: '3600', upsert: false });

    if (uploadError) {
      console.error('Error uploading branch cover image to storage:', uploadError);
      return { success: false, error: 'Failed to upload image. Please try again.' };
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    const { error: dbError } = await supabase
      .from('branches')
      .update({
        cover_image_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', branchId)
      .eq('organization_id', auth.organizationId);

    if (dbError) {
      await supabase.storage.from('avatars').remove([fileName]);
      return { success: false, error: 'Failed to update branch. Please try again.' };
    }

    // Cleanup old cover
    if (oldCoverUrl && oldCoverUrl.includes('/avatars/')) {
      const oldPath = oldCoverUrl.split('/avatars/').pop();
      if (oldPath && oldPath !== fileName) {
        await supabase.storage.from('avatars').remove([oldPath]);
      }
    }

    revalidatePath('/dashboard/organization');
    revalidatePath(`/dashboard/organization/branches/${branchId}`);
    return { success: true, url: publicUrl };
  } catch (error) {
    console.error('Error uploading branch cover image:', error);
    return { success: false, error: 'Failed to upload branch cover image' };
  }
}

/**
 * Update branch slug (public URL)
 */
export async function updateBranchSlug(
  branchId: string,
  newGlobalSlug: string
): Promise<ActionResult> {
  try {
    const auth = await requireAccess();
    if (!auth.success) {
      return { success: false, error: auth.error };
    }

    if (auth.role !== 'admin') {
      return { success: false, error: 'Only admins can update branch URLs' };
    }

    // Validate slug format
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(newGlobalSlug)) {
      return { success: false, error: 'URL can only contain lowercase letters, numbers, and hyphens' };
    }

    if (newGlobalSlug.length < 2 || newGlobalSlug.length > 100) {
      return { success: false, error: 'URL must be between 2 and 100 characters' };
    }

    const supabase = createAdminClient();

    // Get current branch
    const { data: branch } = await supabase
      .from('branches')
      .select('global_slug, organization_id')
      .eq('id', branchId)
      .eq('organization_id', auth.organizationId)
      .single();

    if (!branch) {
      return { success: false, error: 'Branch not found' };
    }

    const oldSlug = branch.global_slug;

    // Check uniqueness
    const uniqueSlug = await ensureUniqueBranchSlug(newGlobalSlug, branchId);
    if (uniqueSlug !== newGlobalSlug) {
      return { success: false, error: 'This URL is already taken. Please choose a different one.' };
    }

    const { error } = await supabase
      .from('branches')
      .update({
        global_slug: newGlobalSlug,
        updated_at: new Date().toISOString(),
      })
      .eq('id', branchId)
      .eq('organization_id', auth.organizationId);

    if (error) {
      console.error('Error updating branch slug:', error);
      return { success: false, error: 'Failed to update branch URL' };
    }

    revalidatePath('/dashboard/organization');
    revalidatePath(`/dashboard/organization/branches/${branchId}`);
    if (oldSlug) revalidatePath(`/branch/${oldSlug}`);
    revalidatePath(`/branch/${newGlobalSlug}`);

    return { success: true };
  } catch (error) {
    console.error('Error updating branch slug:', error);
    return { success: false, error: 'Failed to update branch URL' };
  }
}

/**
 * Update branch hours of operation
 */
export async function updateBranchHours(
  branchId: string,
  hours: Record<string, { open: string; close: string; is24hr: boolean } | null>
): Promise<ActionResult> {
  try {
    const auth = await requireAccess();
    if (!auth.success) {
      return { success: false, error: auth.error };
    }

    if (!['admin', 'manager'].includes(auth.role)) {
      return { success: false, error: 'Insufficient permissions' };
    }

    // Validate hours format
    const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
    const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    for (const [day, schedule] of Object.entries(hours)) {
      if (!validDays.includes(day)) {
        return { success: false, error: `Invalid day: ${day}` };
      }
      if (schedule && !schedule.is24hr) {
        if (!timeRegex.test(schedule.open)) {
          return { success: false, error: `Invalid open time for ${day}` };
        }
        if (!timeRegex.test(schedule.close)) {
          return { success: false, error: `Invalid close time for ${day}` };
        }
      }
    }

    const supabase = createAdminClient();

    const { error } = await supabase
      .from('branches')
      .update({
        hours_of_operation: hours as unknown as Json,
        updated_at: new Date().toISOString(),
      })
      .eq('id', branchId)
      .eq('organization_id', auth.organizationId);

    if (error) {
      console.error('Error updating branch hours:', error);
      return { success: false, error: 'Failed to update hours of operation' };
    }

    revalidatePath('/dashboard/organization');
    revalidatePath(`/dashboard/organization/branches/${branchId}`);

    return { success: true };
  } catch (error) {
    console.error('Error updating branch hours:', error);
    return { success: false, error: 'Failed to update hours of operation' };
  }
}

/**
 * Get organization members not assigned to any branch (for branch assignment)
 */
export async function getUnassignedMembers(): Promise<
  ActionResult<{ id: string; fullName: string; email: string; title: string | null; photoUrl: string | null }[]>
> {
  try {
    const auth = await requireAccess();
    if (!auth.success) {
      return { success: false, error: auth.error };
    }

    if (!['admin', 'manager'].includes(auth.role)) {
      return { success: false, error: 'Insufficient permissions' };
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, email, title, photo_url')
      .eq('organization_id', auth.organizationId)
      .eq('is_active', true)
      .is('branch_id', null)
      .order('full_name', { ascending: true });

    if (error) {
      console.error('Error fetching unassigned members:', error);
      return { success: false, error: 'Failed to fetch members' };
    }

    return {
      success: true,
      data: (data || []).map((m) => ({
        id: m.id,
        fullName: m.full_name || 'Unknown',
        email: m.email,
        title: m.title,
        photoUrl: m.photo_url,
      })),
    };
  } catch (error) {
    console.error('Error fetching unassigned members:', error);
    return { success: false, error: 'Failed to fetch members' };
  }
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

    const supabase = createAdminClient();

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
