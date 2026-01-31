// SMS Credits System
// Credit allocation, usage tracking, overage calculation, and balance checking.

export { CreditService, InsufficientCreditsError } from "./credit-service";

export {
  SMS_CREDIT_TIERS,
  CREDIT_PACKS,
  ALERT_THRESHOLDS,
  DEFAULT_BILLING_PERIOD_DAYS,
  type SmsCreditTier,
  type CreditPack,
  type AlertLevel,
} from "./constants";

export {
  checkBalanceSchema,
  deductCreditSchema,
  getUsageHistorySchema,
  getCurrentPeriodUsageSchema,
  purchaseCreditPackSchema,
  getCreditBalanceSchema,
  getCreditUsageReportSchema,
  creditAlertCheckSchema,
} from "./types";

export type {
  CreditBalance,
  UsageHistoryEntry,
  CurrentPeriodUsage,
  DailyUsageStat,
  MonthlyUsageSummary,
  CreditUsageReport,
} from "./types";
