/**
 * API Keys Module
 * Public exports for API key management
 */

// Types
export * from './types';

// Generation utilities
export {
  generateApiKey,
  hashApiKey,
  extractKeyPrefix,
  getKeyEnvironment,
  isValidKeyFormat,
  generateRequestId,
  timingSafeCompare,
} from './generate';

// Validation utilities
export {
  extractApiKey,
  validateApiKey,
  checkRateLimit,
  logApiKeyUsage,
  createRateLimitHeaders,
  withApiAuth,
  hasScope,
  hasAllScopes,
  hasAnyScope,
  RATE_LIMIT_HEADERS,
  type ApiAuthContext,
  type AuthenticatedHandler,
} from './validate';

// Server actions
export {
  getApiKeys,
  getApiKey,
  createApiKey,
  updateApiKey,
  deleteApiKey,
  rotateApiKey,
  getApiKeyStats,
  hasActiveApiKeys,
} from './actions';
