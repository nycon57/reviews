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
