// SMS Template Management
// Template CRUD, merge field engine, and validation for SMS messaging.

export {
  createSmsTemplate,
  updateSmsTemplate,
  archiveSmsTemplate,
  getSmsTemplate,
  listSmsTemplates,
  previewSmsTemplate,
  renderSmsTemplate,
  seedDefaultTemplates,
} from "./actions";

export {
  extractMergeFields,
  validateMergeFields,
  renderTemplate,
  renderTemplatePreview,
  SUPPORTED_MERGE_FIELDS,
  SAMPLE_MERGE_DATA,
} from "./merge-engine";

export type {
  MergeFieldKey,
  MergeContext,
  RenderResult,
  MergeFieldValidation,
} from "./merge-engine";

export {
  validateTemplateBody,
  checkRespaCompliance,
  checkOptOutLanguage,
  checkBodyLength,
  checkMergeFields,
  MAX_TEMPLATE_BODY_LENGTH,
  RESPA_PROHIBITED_PATTERNS,
} from "./validators";

export type {
  ValidationIssue,
  TemplateValidationResult,
} from "./validators";

export {
  createSmsTemplateSchema,
  updateSmsTemplateSchema,
  archiveSmsTemplateSchema,
  getSmsTemplateSchema,
  listSmsTemplatesSchema,
  renderTemplatePreviewSchema,
} from "./schemas";

export type {
  CreateSmsTemplateInput,
  UpdateSmsTemplateInput,
  ArchiveSmsTemplateInput,
  GetSmsTemplateInput,
  ListSmsTemplatesInput,
  RenderTemplatePreviewInput,
} from "./schemas";

export { DEFAULT_SMS_TEMPLATES } from "./default-templates";
export type { DefaultTemplate } from "./default-templates";
