/**
 * Email Services
 *
 * Service modules for sending various types of emails.
 */

export {
  sendWeeklyLOSummaries,
  sendWeeklyManagerSummaries,
  sendAllWeeklySummaries,
  sendTestWeeklySummary,
} from "./weekly-summary";

export {
  sendAdminAlert,
  sendNegativeReviewAlert,
  sendTeamStrugglingAlert,
  sendComplianceViolationAlert,
  sendUsageLimitAlert,
  sendTeamMemberJoinedAlert,
  sendTeamMemberLeftAlert,
  sendUnusualActivityAlert,
  sendIntegrationDisconnectedAlert,
} from "./admin-alerts";

export {
  sendAdminAlertDigests,
  getDigestPreview,
} from "./admin-alert-digest";
