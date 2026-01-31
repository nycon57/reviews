import { z } from "zod";
import type { SmsTemplateCategory } from "../types";

// ── Template category enum ────────────────────────────────────────────

const templateCategories: [SmsTemplateCategory, ...SmsTemplateCategory[]] = [
  "review_request",
  "follow_up",
  "thank_you",
  "video_request",
  "custom",
];

// ── Schemas ───────────────────────────────────────────────────────────

export const createSmsTemplateSchema = z.object({
  name: z
    .string()
    .min(1, "Template name is required")
    .max(100, "Template name must be 100 characters or fewer"),
  category: z.enum(templateCategories),
  body: z
    .string()
    .min(1, "Template body is required")
    .max(480, "Template body must be 480 characters or fewer (3 SMS segments)"),
});

export const updateSmsTemplateSchema = z.object({
  id: z.string().uuid("Invalid template ID"),
  name: z
    .string()
    .min(1, "Template name is required")
    .max(100, "Template name must be 100 characters or fewer")
    .optional(),
  category: z.enum(templateCategories).optional(),
  body: z
    .string()
    .min(1, "Template body is required")
    .max(480, "Template body must be 480 characters or fewer (3 SMS segments)")
    .optional(),
});

export const archiveSmsTemplateSchema = z.object({
  id: z.string().uuid("Invalid template ID"),
});

export const getSmsTemplateSchema = z.object({
  id: z.string().uuid("Invalid template ID"),
});

export const listSmsTemplatesSchema = z.object({
  category: z.enum(templateCategories).optional(),
  status: z.enum(["active", "archived"]).optional().default("active"),
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(50),
});

export const renderTemplatePreviewSchema = z.object({
  id: z.string().uuid("Invalid template ID").optional(),
  body: z.string().min(1).max(480).optional(),
});

// ── Inferred types ────────────────────────────────────────────────────

export type CreateSmsTemplateInput = z.infer<typeof createSmsTemplateSchema>;
export type UpdateSmsTemplateInput = z.infer<typeof updateSmsTemplateSchema>;
export type ArchiveSmsTemplateInput = z.infer<typeof archiveSmsTemplateSchema>;
export type GetSmsTemplateInput = z.infer<typeof getSmsTemplateSchema>;
export type ListSmsTemplatesInput = z.infer<typeof listSmsTemplatesSchema>;
export type RenderTemplatePreviewInput = z.infer<typeof renderTemplatePreviewSchema>;
