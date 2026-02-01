// SMS Service Layer
// Core Twilio integration and SMS business logic for RepWell.

export { TwilioService, resolveCredentials, mapTwilioError } from "./twilio-client";
export {
  SmsService,
  ConsentRequiredError,
  QuietHoursError,
  InsufficientCreditsError,
  RateLimitError,
} from "./sms-service";
export { toE164, isValidE164, formatForDisplay, maskPhone, getAreaCode } from "./phone-utils";
export { calculateSegments, detectEncoding, gsm7Length } from "./segment-calculator";
export type { SegmentInfo } from "./segment-calculator";
export { checkRateLimits, checkPerNumberRateLimit, checkOrgRateLimit } from "./rate-limiter";
export type { RateLimitResult } from "./rate-limiter";

export type {
  // Row types
  SmsPhoneNumber,
  SmsConsent,
  SmsMessage,
  SmsSettings,
  SmsCredits,
  SmsTemplate,
  // Service types
  TwilioCredentials,
  SendSmsOptions,
  SendSmsResult,
  SmsSendResult,
  SmsLogEntry,
  SendReviewRequestInput,
  SendCustomMessageInput,
  AvailablePhoneNumber,
  PhoneNumberCapabilities,
  PurchasePhoneNumberOptions,
  // Enums
  SmsNumberType,
  SmsNumberStatus,
  SmsConsentStatus,
  SmsConsentMethod,
  SmsDirection,
  SmsMessageStatus,
  SmsTemplateCategory,
} from "./types";

export {
  // Zod schemas
  e164PhoneSchema,
  sendSmsSchema,
  sendReviewRequestSchema,
  sendCustomMessageSchema,
  purchasePhoneNumberSchema,
} from "./types";

// Consent service
export { ConsentService } from "./consent-service";
export type {
  ConsentRecord,
  RecordConsentInput,
  RevokeConsentInput,
  ConsentReportRow,
} from "./types";

// Quiet hours engine
export { QuietHoursEngine } from "./quiet-hours";
export type { QuietHoursConfig, QuietHoursCheckResult } from "./quiet-hours";

// Keyword handler
export { KeywordHandler } from "./keyword-handler";
export type { KeywordType, KeywordResult } from "./keyword-handler";

// Timezone lookup
export { getTimezoneForPhone, TCPA_DEFAULT_QUIET_START, TCPA_DEFAULT_QUIET_END } from "./timezone-lookup";

// Webhook validation
export {
  validateTwilioSignature,
  buildWebhookUrl,
  OPT_OUT_KEYWORDS,
  OPT_IN_KEYWORDS,
  HELP_KEYWORDS,
} from "./webhook-validation";

// Short links
export { ShortLinkService } from "./short-links/service";
export type {
  SmsShortLink,
  CreateShortLinkInput,
  ShortLinkClickStats,
} from "./short-links/types";

// Credits system
export {
  CreditService,
  SMS_CREDIT_TIERS,
  CREDIT_PACKS,
  ALERT_THRESHOLDS,
  deductCreditSchema,
  getUsageHistorySchema,
  getCurrentPeriodUsageSchema,
  purchaseCreditPackSchema,
  getCreditBalanceSchema,
  creditAlertCheckSchema,
} from "./credits";
export type {
  CreditBalance,
  UsageHistoryEntry,
  CurrentPeriodUsage,
  DailyUsageStat,
  MonthlyUsageSummary,
  CreditUsageReport,
  SmsCreditTier,
  CreditPack,
  AlertLevel,
} from "./credits";
