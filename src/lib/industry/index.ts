// Industry system exports
// Re-export all types
export * from "./types";

// Re-export all configs
export {
  getIndustryConfig,
  getSupportedIndustries,
  industryConfigs,
  industryOptions,
  mortgageConfig,
  realEstateConfig,
  insuranceConfig,
  financialAdvisoryConfig,
  healthcareConfig,
  homeServicesConfig,
  legalConfig,
  consultingConfig,
} from "./configs";

// Re-export context and hooks
export {
  IndustryProvider,
  useIndustry,
  useIndustrySafe,
  useHasIndustryContext,
} from "./context";

// Re-export utilities
export {
  getProfessionalLabel,
  getProfessionalLabelWithFallback,
  DEFAULT_PROFESSIONAL_LABEL,
  DEFAULT_PROFESSIONAL_LABEL_PLURAL,
  getCustomerLabel,
  getTransactionLabel,
  hasIntegration,
  getAvailableIntegrations,
  getReviewSources,
  getSyncableReviewSources,
  getRequiredCredentials,
  getCredentials,
  validateCredential,
  getIndustryBenchmarks,
  getDefaultSurveyQuestions,
  getAnalysisThemes,
  slugToIndustry,
  industryToSlug,
  getIndustryIcon,
  getIndustryAccentColor,
  getAllIndustries,
  isValidIndustry,
  replaceIndustryVariables,
  createIndustryCopy,
} from "./utils";
