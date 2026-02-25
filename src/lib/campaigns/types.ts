import { z } from "zod";

export const CAMPAIGN_STATUS_VALUES = [
  "draft",
  "active",
  "paused",
  "completed",
  "archived",
] as const;

export type CampaignStatus = (typeof CAMPAIGN_STATUS_VALUES)[number];

export const CampaignStatusSchema = z.enum(CAMPAIGN_STATUS_VALUES);

export const WORKFLOW_TEMPLATE_CATEGORY_VALUES = [
  "review_collection",
  "onboarding",
  "retention",
  "win_back",
  "testimonial",
  "payment",
] as const;

export type WorkflowTemplateCategory = (typeof WORKFLOW_TEMPLATE_CATEGORY_VALUES)[number];

export const WorkflowTemplateCategorySchema = z.enum(WORKFLOW_TEMPLATE_CATEGORY_VALUES);

const JsonObjectSchema = z.record(z.unknown());

export const CreateCampaignInputSchema = z.object({
  name: z.string().trim().min(1, "Campaign name is required").max(120),
  description: z.string().trim().max(500).optional(),
  templateId: z.string().uuid().optional(),
});

export type CreateCampaignInput = z.infer<typeof CreateCampaignInputSchema>;

export const UpdateCampaignInputSchema = z.object({
  name: z.string().trim().min(1, "Campaign name is required").max(120).optional(),
  description: z.string().trim().max(500).nullable().optional(),
  sequenceDefinition: JsonObjectSchema.optional(),
  canvasMetadata: JsonObjectSchema.optional(),
});

export type UpdateCampaignInput = z.infer<typeof UpdateCampaignInputSchema>;

export interface CampaignWorkflow {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  status: CampaignStatus;
  sequenceDefinition: Record<string, unknown>;
  canvasMetadata: Record<string, unknown>;
  triggerType: string | null;
  createdBy: string | null;
  createdByName: string | null;
  updatedBy: string | null;
  updatedByName: string | null;
  lockedBy: string | null;
  lockedByName: string | null;
  lockedAt: string | null;
  activatedAt: string | null;
  activatedBy: string | null;
  activatedByName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignListItem {
  id: string;
  name: string;
  status: CampaignStatus;
  triggerType: string | null;
  updatedAt: string;
  createdByName: string | null;
  lockedByName: string | null;
  lockedAt: string | null;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string | null;
  category: WorkflowTemplateCategory;
  iconName: string;
  sequenceDefinition: Record<string, unknown>;
  canvasMetadata: Record<string, unknown>;
  isSystem: boolean;
  popularity: number;
  createdAt: string;
}

export interface CampaignLockResult {
  acquired: boolean;
  lockedByName: string | null;
  lockedAt: string | null;
}
