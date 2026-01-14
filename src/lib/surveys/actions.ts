"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  createSurveyTemplateSchema,
  updateSurveyTemplateSchema,
  DEFAULT_TEMPLATES,
  type CreateSurveyTemplateInput,
  type UpdateSurveyTemplateInput,
  type SurveyTemplate,
  type Question,
  type SurveyBranding,
  type ThankYouConfig,
} from "@/types/survey.types";

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

// Get all survey templates for the current organization
export async function getSurveyTemplates(): Promise<ActionResult<SurveyTemplate[]>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Get user's organization_id
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (userError || !userData?.organization_id) {
      return { success: false, error: "Organization not found" };
    }

    const { data, error } = await supabase
      .from("survey_templates")
      .select("*")
      .eq("organization_id", userData.organization_id)
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    // Transform database rows to SurveyTemplate type
    const templates: SurveyTemplate[] = (data || []).map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description || undefined,
      questions: (row.questions as unknown as Question[]) || [],
      branding: row.branding as unknown as SurveyBranding | undefined,
      thankYouConfig: row.thank_you_config as unknown as ThankYouConfig | undefined,
      isActive: row.is_active ?? true,
      isDefault: row.is_default ?? false,
    }));

    return { success: true, data: templates };
  } catch (error) {
    console.error("Error fetching survey templates:", error);
    return { success: false, error: "Failed to fetch survey templates" };
  }
}

// Get a single survey template by ID
export async function getSurveyTemplate(id: string): Promise<ActionResult<SurveyTemplate>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data, error } = await supabase
      .from("survey_templates")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: "Survey template not found" };
    }

    const template: SurveyTemplate = {
      id: data.id,
      name: data.name,
      description: data.description || undefined,
      questions: (data.questions as unknown as Question[]) || [],
      branding: data.branding as unknown as SurveyBranding | undefined,
      thankYouConfig: data.thank_you_config as unknown as ThankYouConfig | undefined,
      isActive: data.is_active ?? true,
      isDefault: data.is_default ?? false,
    };

    return { success: true, data: template };
  } catch (error) {
    console.error("Error fetching survey template:", error);
    return { success: false, error: "Failed to fetch survey template" };
  }
}

// Create a new survey template
export async function createSurveyTemplate(
  input: CreateSurveyTemplateInput
): Promise<ActionResult<SurveyTemplate>> {
  try {
    const validated = createSurveyTemplateSchema.safeParse(input);
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0]?.message || "Validation failed" };
    }

    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Get user's organization_id
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (userError || !userData?.organization_id) {
      return { success: false, error: "Organization not found" };
    }

    const insertData = {
      name: validated.data.name,
      description: validated.data.description || null,
      questions: JSON.parse(JSON.stringify(validated.data.questions)),
      branding: validated.data.branding ? JSON.parse(JSON.stringify(validated.data.branding)) : null,
      thank_you_config: validated.data.thankYouConfig ? JSON.parse(JSON.stringify(validated.data.thankYouConfig)) : null,
      is_active: validated.data.isActive ?? true,
      is_default: validated.data.isDefault ?? false,
      organization_id: userData.organization_id,
      created_by: user.id,
    };

    const { data, error } = await supabase
      .from("survey_templates")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/surveys");

    const template: SurveyTemplate = {
      id: data.id,
      name: data.name,
      description: data.description || undefined,
      questions: (data.questions as unknown as Question[]) || [],
      branding: data.branding as unknown as SurveyBranding | undefined,
      thankYouConfig: data.thank_you_config as unknown as ThankYouConfig | undefined,
      isActive: data.is_active ?? true,
      isDefault: data.is_default ?? false,
    };

    return { success: true, data: template };
  } catch (error) {
    console.error("Error creating survey template:", error);
    return { success: false, error: "Failed to create survey template" };
  }
}

// Update an existing survey template
export async function updateSurveyTemplate(
  input: UpdateSurveyTemplateInput
): Promise<ActionResult<SurveyTemplate>> {
  try {
    const validated = updateSurveyTemplateSchema.safeParse(input);
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0]?.message || "Validation failed" };
    }

    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {};
    if (validated.data.name !== undefined) updateData.name = validated.data.name;
    if (validated.data.description !== undefined) updateData.description = validated.data.description;
    if (validated.data.questions !== undefined) updateData.questions = validated.data.questions;
    if (validated.data.branding !== undefined) updateData.branding = validated.data.branding;
    if (validated.data.thankYouConfig !== undefined) updateData.thank_you_config = validated.data.thankYouConfig;
    if (validated.data.isActive !== undefined) updateData.is_active = validated.data.isActive;
    if (validated.data.isDefault !== undefined) updateData.is_default = validated.data.isDefault;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("survey_templates")
      .update(updateData)
      .eq("id", validated.data.id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/surveys");
    revalidatePath(`/dashboard/surveys/${validated.data.id}`);

    const template: SurveyTemplate = {
      id: data.id,
      name: data.name,
      description: data.description || undefined,
      questions: (data.questions as unknown as Question[]) || [],
      branding: data.branding as unknown as SurveyBranding | undefined,
      thankYouConfig: data.thank_you_config as unknown as ThankYouConfig | undefined,
      isActive: data.is_active ?? true,
      isDefault: data.is_default ?? false,
    };

    return { success: true, data: template };
  } catch (error) {
    console.error("Error updating survey template:", error);
    return { success: false, error: "Failed to update survey template" };
  }
}

// Delete a survey template
export async function deleteSurveyTemplate(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Check if template is in use by any surveys
    const { count, error: countError } = await supabase
      .from("surveys")
      .select("*", { count: "exact", head: true })
      .eq("template_id", id);

    if (countError) {
      return { success: false, error: "Failed to check template usage" };
    }

    if (count && count > 0) {
      return { success: false, error: `Cannot delete: template is used by ${count} survey(s)` };
    }

    const { error } = await supabase
      .from("survey_templates")
      .delete()
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/surveys");
    return { success: true };
  } catch (error) {
    console.error("Error deleting survey template:", error);
    return { success: false, error: "Failed to delete survey template" };
  }
}

// Duplicate a survey template
export async function duplicateSurveyTemplate(id: string): Promise<ActionResult<SurveyTemplate>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Fetch the original template
    const { data: original, error: fetchError } = await supabase
      .from("survey_templates")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !original) {
      return { success: false, error: "Template not found" };
    }

    // Create a copy with a new name
    const { data, error } = await supabase
      .from("survey_templates")
      .insert({
        name: `${original.name} (Copy)`,
        description: original.description,
        questions: original.questions,
        branding: original.branding,
        thank_you_config: original.thank_you_config,
        is_active: false, // Start as inactive
        is_default: false,
        organization_id: original.organization_id,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/surveys");

    const template: SurveyTemplate = {
      id: data.id,
      name: data.name,
      description: data.description || undefined,
      questions: (data.questions as unknown as Question[]) || [],
      branding: data.branding as unknown as SurveyBranding | undefined,
      thankYouConfig: data.thank_you_config as unknown as ThankYouConfig | undefined,
      isActive: data.is_active ?? true,
      isDefault: data.is_default ?? false,
    };

    return { success: true, data: template };
  } catch (error) {
    console.error("Error duplicating survey template:", error);
    return { success: false, error: "Failed to duplicate survey template" };
  }
}

// Toggle template active status
export async function toggleTemplateStatus(id: string, isActive: boolean): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { error } = await supabase
      .from("survey_templates")
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/surveys");
    return { success: true };
  } catch (error) {
    console.error("Error toggling template status:", error);
    return { success: false, error: "Failed to toggle template status" };
  }
}

// Create from default template
export async function createFromDefaultTemplate(
  templateKey: keyof typeof DEFAULT_TEMPLATES
): Promise<ActionResult<SurveyTemplate>> {
  try {
    const defaultTemplate = DEFAULT_TEMPLATES[templateKey];
    if (!defaultTemplate) {
      return { success: false, error: "Invalid template key" };
    }

    return createSurveyTemplate({
      name: defaultTemplate.name,
      description: defaultTemplate.description,
      questions: defaultTemplate.questions as Question[],
      isActive: defaultTemplate.isActive,
      isDefault: defaultTemplate.isDefault,
    });
  } catch (error) {
    console.error("Error creating from default template:", error);
    return { success: false, error: "Failed to create from default template" };
  }
}
