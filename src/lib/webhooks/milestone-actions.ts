"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface MilestoneMapping {
  id: string;
  organizationId: string;
  milestoneName: string;
  templateId: string | null;
  delayHours: number;
  isActive: boolean;
  description: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  template?: {
    id: string;
    name: string;
  } | null;
}

export interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Get all milestone mappings for the current organization
 */
export async function getMilestoneMappings(): Promise<ActionResult<MilestoneMapping[]>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data: userData } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!userData?.organization_id) {
      return { success: false, error: "No organization found" };
    }

    const { data, error } = await supabase
      .from("milestone_survey_mappings")
      .select(`
        id,
        organization_id,
        milestone_name,
        template_id,
        delay_hours,
        is_active,
        description,
        created_at,
        updated_at,
        survey_templates:template_id (
          id,
          name
        )
      `)
      .eq("organization_id", userData.organization_id)
      .order("milestone_name");

    if (error) {
      console.error("Error fetching milestone mappings:", error);
      return { success: false, error: error.message };
    }

    const mappings: MilestoneMapping[] = (data || []).map((row) => ({
      id: row.id,
      organizationId: row.organization_id,
      milestoneName: row.milestone_name,
      templateId: row.template_id,
      delayHours: row.delay_hours ?? 24,
      isActive: row.is_active ?? false,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      template: row.survey_templates as { id: string; name: string } | null,
    }));

    return { success: true, data: mappings };
  } catch (error) {
    console.error("Error in getMilestoneMappings:", error);
    return { success: false, error: "Failed to fetch milestone mappings" };
  }
}

/**
 * Update a milestone mapping
 */
export async function updateMilestoneMapping(
  id: string,
  updates: {
    templateId?: string | null;
    delayHours?: number;
    isActive?: boolean;
  }
): Promise<ActionResult<MilestoneMapping>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data: userData } = await supabase
      .from("users")
      .select("organization_id, role")
      .eq("id", user.id)
      .single();

    if (!userData?.organization_id) {
      return { success: false, error: "No organization found" };
    }

    // Check permission
    if (!["admin", "manager"].includes(userData.role)) {
      return { success: false, error: "Insufficient permissions" };
    }

    // Verify the mapping belongs to this organization
    const { data: existing } = await supabase
      .from("milestone_survey_mappings")
      .select("id, organization_id")
      .eq("id", id)
      .single();

    if (!existing || existing.organization_id !== userData.organization_id) {
      return { success: false, error: "Milestone mapping not found" };
    }

    const updateData: Record<string, unknown> = {};
    if (updates.templateId !== undefined) updateData.template_id = updates.templateId;
    if (updates.delayHours !== undefined) updateData.delay_hours = updates.delayHours;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

    const { data, error } = await supabase
      .from("milestone_survey_mappings")
      .update(updateData)
      .eq("id", id)
      .select(`
        id,
        organization_id,
        milestone_name,
        template_id,
        delay_hours,
        is_active,
        description,
        created_at,
        updated_at,
        survey_templates:template_id (
          id,
          name
        )
      `)
      .single();

    if (error) {
      console.error("Error updating milestone mapping:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/webhooks");

    const mapping: MilestoneMapping = {
      id: data.id,
      organizationId: data.organization_id,
      milestoneName: data.milestone_name,
      templateId: data.template_id,
      delayHours: data.delay_hours ?? 24,
      isActive: data.is_active ?? false,
      description: data.description,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      template: data.survey_templates as { id: string; name: string } | null,
    };

    return { success: true, data: mapping };
  } catch (error) {
    console.error("Error in updateMilestoneMapping:", error);
    return { success: false, error: "Failed to update milestone mapping" };
  }
}

/**
 * Create a new milestone mapping
 */
export async function createMilestoneMapping(
  milestoneName: string,
  options?: {
    templateId?: string | null;
    delayHours?: number;
    isActive?: boolean;
    description?: string;
  }
): Promise<ActionResult<MilestoneMapping>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data: userData } = await supabase
      .from("users")
      .select("organization_id, role")
      .eq("id", user.id)
      .single();

    if (!userData?.organization_id) {
      return { success: false, error: "No organization found" };
    }

    // Check permission
    if (!["admin", "manager"].includes(userData.role)) {
      return { success: false, error: "Insufficient permissions" };
    }

    const { data, error } = await supabase
      .from("milestone_survey_mappings")
      .insert({
        organization_id: userData.organization_id,
        milestone_name: milestoneName,
        template_id: options?.templateId ?? null,
        delay_hours: options?.delayHours ?? 24,
        is_active: options?.isActive ?? false,
        description: options?.description ?? null,
      })
      .select(`
        id,
        organization_id,
        milestone_name,
        template_id,
        delay_hours,
        is_active,
        description,
        created_at,
        updated_at,
        survey_templates:template_id (
          id,
          name
        )
      `)
      .single();

    if (error) {
      if (error.code === "23505") {
        return { success: false, error: "A mapping for this milestone already exists" };
      }
      console.error("Error creating milestone mapping:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/webhooks");

    const mapping: MilestoneMapping = {
      id: data.id,
      organizationId: data.organization_id,
      milestoneName: data.milestone_name,
      templateId: data.template_id,
      delayHours: data.delay_hours ?? 24,
      isActive: data.is_active ?? false,
      description: data.description,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      template: data.survey_templates as { id: string; name: string } | null,
    };

    return { success: true, data: mapping };
  } catch (error) {
    console.error("Error in createMilestoneMapping:", error);
    return { success: false, error: "Failed to create milestone mapping" };
  }
}

/**
 * Delete a milestone mapping
 */
export async function deleteMilestoneMapping(id: string): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data: userData } = await supabase
      .from("users")
      .select("organization_id, role")
      .eq("id", user.id)
      .single();

    if (!userData?.organization_id) {
      return { success: false, error: "No organization found" };
    }

    // Check permission
    if (!["admin", "manager"].includes(userData.role)) {
      return { success: false, error: "Insufficient permissions" };
    }

    // Verify the mapping belongs to this organization
    const { data: existing } = await supabase
      .from("milestone_survey_mappings")
      .select("id, organization_id")
      .eq("id", id)
      .single();

    if (!existing || existing.organization_id !== userData.organization_id) {
      return { success: false, error: "Milestone mapping not found" };
    }

    const { error } = await supabase
      .from("milestone_survey_mappings")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting milestone mapping:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/webhooks");

    return { success: true };
  } catch (error) {
    console.error("Error in deleteMilestoneMapping:", error);
    return { success: false, error: "Failed to delete milestone mapping" };
  }
}
