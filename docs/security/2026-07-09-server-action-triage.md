# Server Action Triage - 2026-07-09

Scope: React Doctor `server-auth-actions` diagnostics from `npx react-doctor@latest --verbose` on branch `h1/h12-triage`. The saved baseline in this worktree reported 525 server-action diagnostics across 92 files; that is the evidence set below. The prompt referenced 543 across 89 files, which appears stale for this checkout.

The regression guard lives at `src/lib/auth/__tests__/server-action-guardrails.test.ts`. It recognizes known guard identifiers plus simple local helper delegation, and requires every intentionally public action to be listed in `PUBLIC_ACTIONS` with a reason.

## Counts

| Metric                              | Count |
| ----------------------------------- | ----: |
| React Doctor flagged actions        |   525 |
| React Doctor flagged files          |    92 |
| AUTHED-INTERNALLY                   |   284 |
| PUBLIC-BY-DESIGN                    |    45 |
| UNPROTECTED-FIXED                   |   196 |
| Checked-in PUBLIC_ACTIONS allowlist |    77 |
| Fixed with explicit guard           |    34 |
| Fixed by internal move/de-export    |   162 |

## Fixed Findings

### Guard Added

| File                                                           | Action                           | Guard evidence                                             |
| -------------------------------------------------------------- | -------------------------------- | ---------------------------------------------------------- |
| `src/components/settings/webhooks/outbound-webhook-actions.ts` | `listOutboundEndpoints`          | requireOutboundEndpointAccess -> requireAdminAccess        |
| `src/components/settings/webhooks/outbound-webhook-actions.ts` | `createOutboundEndpoint`         | requireOutboundEndpointAccess -> requireAdminAccess        |
| `src/components/settings/webhooks/outbound-webhook-actions.ts` | `toggleOutboundEndpoint`         | requireOutboundEndpointAccess -> requireAdminAccess        |
| `src/components/settings/webhooks/outbound-webhook-actions.ts` | `deleteOutboundEndpoint`         | requireOutboundEndpointAccess -> requireAdminAccess        |
| `src/components/settings/webhooks/outbound-webhook-actions.ts` | `listOutboundDeliveries`         | requireOutboundEndpointAccess -> requireAdminAccess        |
| `src/lib/auth/actions.ts`                                      | `updatePassword`                 | supabase.auth.getUser                                      |
| `src/lib/auth/actions.ts`                                      | `signOut`                        | supabase.auth.getUser                                      |
| `src/lib/auth/server-actions.ts`                               | `signOutBetterAuth`              | getSessionBetterAuth                                       |
| `src/lib/directory/actions.ts`                                 | `updateUserCoordinates`          | requireDirectoryMaintenanceAccess                          |
| `src/lib/directory/actions.ts`                                 | `updateLoanOfficerCoordinates`   | updateUserCoordinates -> requireDirectoryMaintenanceAccess |
| `src/lib/directory/actions.ts`                                 | `batchGeocodeUsers`              | requireDirectoryMaintenanceAccess                          |
| `src/lib/directory/actions.ts`                                 | `batchGeocodeLoanOfficers`       | batchGeocodeUsers -> requireDirectoryMaintenanceAccess     |
| `src/lib/directory/actions.ts`                                 | `batchGeocodeBranches`           | requireDirectoryMaintenanceAccess                          |
| `src/lib/email-ab-testing/actions.ts`                          | `getActiveTestForEmailType`      | getAdminContext -> unifiedGetUser                          |
| `src/lib/google/actions.ts`                                    | `handleGoogleOAuthCallback`      | requireManagerRole                                         |
| `src/lib/google/actions.ts`                                    | `processPendingGoogleReplies`    | requireCronSecretRequest                                   |
| `src/lib/google/actions.ts`                                    | `getAvailableLocations`          | requireManagerRole                                         |
| `src/lib/notifications/actions.ts`                             | `testSlackWebhook`               | unifiedGetUser                                             |
| `src/lib/onboarding/actions.ts`                                | `skipPayment`                    | unifiedGetUser                                             |
| `src/lib/organization/actions.ts`                              | `getSuggestedOrgSlug`            | unifiedGetUser                                             |
| `src/lib/reporting/actions.ts`                                 | `createReportShareForOrg`        | hasOrgReportAccess                                         |
| `src/lib/reporting/actions.ts`                                 | `exportAndRecordReportForOrg`    | hasOrgReportAccess                                         |
| `src/lib/reporting/engine.ts`                                  | `generateReportForOrg`           | hasReportGenerationAccess                                  |
| `src/lib/requests/unified-requests.ts`                         | `getUnifiedRequests`             | getAccessContext                                           |
| `src/lib/requests/unified-requests.ts`                         | `getUnifiedRequestStats`         | getAccessContext                                           |
| `src/lib/reviews/actions.ts`                                   | `updateReviewText`               | requireOrgUser -> getUserContext                           |
| `src/lib/reviews/auto-reply-actions.ts`                        | `enqueueReviewForAutoReply`      | getUserOrgContext                                          |
| `src/lib/salesforce/actions.ts`                                | `handleSalesforceOAuthCallback`  | requireAdminRole                                           |
| `src/lib/social-graphics/caption-actions.ts`                   | `generateCaption`                | getAuthenticatedUserResult                                 |
| `src/lib/social-graphics/publish-actions.ts`                   | `executeScheduledPosts`          | requireCronSecretRequest                                   |
| `src/lib/social-graphics/schedule-actions.ts`                  | `executeScheduledGeneration`     | requireCronSecretRequest                                   |
| `src/lib/tasks/actions.ts`                                     | `generateTasksForUser`           | unifiedGetUser                                             |
| `src/lib/video-testimonials/public-actions.ts`                 | `processVideoTestimonialAIQueue` | requireCronSecretRequest                                   |
| `src/lib/webhooks/actions.ts`                                  | `scheduleRetryWithBackoff`       | requireAdminAccess                                         |

### Removed From Public Server-Action Surface

| File                                                 | Action                                        | Fix evidence                                                                         |
| ---------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------ |
| `src/lib/ai/actions.ts`                              | `analyzeNewReview`                            | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/ai/actions.ts`                              | `checkAIStatus`                               | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/distribution/service.ts`                    | `checkRateLimit`                              | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/distribution/service.ts`                    | `getSurveyForSending`                         | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/distribution/service.ts`                    | `processQueueItem`                            | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/distribution/service.ts`                    | `scheduleReminders`                           | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/distribution/service.ts`                    | `getPendingQueueItems`                        | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/distribution/service.ts`                    | `processDistributionQueue`                    | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/distribution/service.ts`                    | `cancelPendingDistributions`                  | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/distribution/service.ts`                    | `getDistributionStats`                        | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email-builder/actions.ts`                   | `resolveTemplateById`                         | removed from exported server-action surface                                          |
| `src/lib/email-preferences/actions.ts`               | `generateEmailPreferenceTokenForUser`         | removed from exported server-action surface                                          |
| `src/lib/email-preferences/actions.ts`               | `isUserUnsubscribed`                          | removed from exported server-action surface                                          |
| `src/lib/email-preferences/actions.ts`               | `isEmailCategoryEnabled`                      | removed from exported server-action surface                                          |
| `src/lib/email/abandoned-action-recovery-service.ts` | `trackActionStarted`                          | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/abandoned-action-recovery-service.ts` | `trackActionCompleted`                        | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/abandoned-action-recovery-service.ts` | `updateActionContext`                         | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/abandoned-action-recovery-service.ts` | `processRecoveryEmail1Queue`                  | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/abandoned-action-recovery-service.ts` | `processRecoveryEmail2Queue`                  | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/abandoned-action-recovery-service.ts` | `expireOldAbandonedActions`                   | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/abandoned-action-recovery-service.ts` | `getAbandonedAction`                          | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/abandoned-action-recovery-service.ts` | `getUserAbandonedActions`                     | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/abandoned-action-recovery-service.ts` | `getAbandonedActionStats`                     | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/orchestration/channel-router.ts`      | `routeStepToChannel`                          | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/orchestration/executor.ts`            | `updateSequenceStatus`                        | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/orchestration/executor.ts`            | `updateSequenceAfterSend`                     | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/orchestration/executor.ts`            | `updateSequenceAfterSkip`                     | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/orchestration/executor.ts`            | `updateSequenceNextEmailAt`                   | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/orchestration/executor.ts`            | `checkStandardExitConditions`                 | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/orchestration/executor.ts`            | `checkDefinitionExitConditions`               | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/orchestration/executor.ts`            | `checkStepExitConditions`                     | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/orchestration/executor.ts`            | `shouldSkipStep`                              | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/orchestration/executor.ts`            | `evaluateStepBranches`                        | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/orchestration/executor.ts`            | `executeStep`                                 | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/orchestration/executor.ts`            | `isReadyToExecute`                            | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/orchestration/queue.ts`               | `fetchAndLockSequences`                       | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/orchestration/queue.ts`               | `resetSequenceToActive`                       | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/orchestration/queue.ts`               | `processSequenceQueue`                        | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/orchestration/queue.ts`               | `processAllSequenceQueues`                    | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/orchestration/queue.ts`               | `pauseSequence`                               | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/orchestration/queue.ts`               | `resumeSequence`                              | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/orchestration/queue.ts`               | `pauseUserSequences`                          | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/orchestration/queue.ts`               | `resumeUserSequences`                         | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/orchestration/queue.ts`               | `cancelSequence`                              | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/orchestration/queue.ts`               | `cancelUserSequences`                         | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/orchestration/queue.ts`               | `getQueueStats`                               | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/orchestration/queue.ts`               | `getUserSequences`                            | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/orchestration/queue.ts`               | `getSequenceById`                             | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/orchestration/queue.ts`               | `resetStuckSequences`                         | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/orchestration/queue.ts`               | `cleanupOldSequences`                         | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/orchestration/triggers.ts`            | `evaluateTriggerConditions`                   | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/orchestration/triggers.ts`            | `createSequenceInstance`                      | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/orchestration/triggers.ts`            | `handleEventTrigger`                          | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/orchestration/triggers.ts`            | `dispatchEvent`                               | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/orchestration/triggers.ts`            | `triggerSequenceManually`                     | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/orchestration/triggers.ts`            | `checkTimeBasedTriggers`                      | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/orchestration/triggers.ts`            | `getEligibleUsers`                            | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/org-onboarding-service.ts`            | `startOrgOnboardingSequence`                  | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/org-onboarding-service.ts`            | `processOrgOnboardingSequenceQueue`           | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/org-onboarding-service.ts`            | `pauseOrgOnboardingSequence`                  | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/org-onboarding-service.ts`            | `resumeOrgOnboardingSequence`                 | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/org-onboarding-service.ts`            | `getOrgOnboardingSequenceStatus`              | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/org-onboarding-service.ts`            | `getOrgSetupProgress`                         | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/profile-setup-reminder-service.ts`    | `detectUsersAndStartReminderSequences`        | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/profile-setup-reminder-service.ts`    | `startReminderSequence`                       | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/profile-setup-reminder-service.ts`    | `processReminderSequenceQueue`                | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/profile-setup-reminder-service.ts`    | `checkAndExitSequenceOnCompletion`            | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/profile-setup-reminder-service.ts`    | `getReminderSequenceStatus`                   | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/reengagement-sequence-service.ts`     | `detectInactiveUsersAndStartSequences`        | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/reengagement-sequence-service.ts`     | `startReengagementSequence`                   | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/reengagement-sequence-service.ts`     | `processReengagementSequenceQueue`            | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/reengagement-sequence-service.ts`     | `getReengagementSequenceStatus`               | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/role-onboarding-service.ts`           | `startRoleOnboardingSequence`                 | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/role-onboarding-service.ts`           | `processRoleOnboardingSequenceQueue`          | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/role-onboarding-service.ts`           | `pauseRoleOnboardingSequence`                 | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/role-onboarding-service.ts`           | `resumeRoleOnboardingSequence`                | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/role-onboarding-service.ts`           | `getRoleOnboardingSequenceStatus`             | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/send.ts`                              | `sendSurveyInvitationEmail`                   | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/send.ts`                              | `sendSurveyReminderEmail`                     | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/send.ts`                              | `sendNewReviewNotificationEmail`              | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/send.ts`                              | `updateEmailTrackingStatus`                   | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/send.ts`                              | `sendReviewResponseEmail`                     | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/send.ts`                              | `sendVideoTestimonialInvitationEmail`         | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/send.ts`                              | `sendVideoTestimonialReminderEmail`           | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/send.ts`                              | `sendVideoTestimonialReceivedEmail`           | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/send.ts`                              | `sendVideoTestimonialApprovedEmail`           | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/send.ts`                              | `sendVideoTestimonialPendingApprovalEmail`    | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/send.ts`                              | `sendSurveyCompletionThankYouEmail`           | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/send.ts`                              | `sendSurveyHighRatingFollowUpEmail`           | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/send.ts`                              | `sendSurveyLowRatingFollowUpEmail`            | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/send.ts`                              | `sendSurveyResponseReceivedNotificationEmail` | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/send.ts`                              | `sendReviewPendingApprovalEmail`              | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/send.ts`                              | `sendReviewApprovedEmail`                     | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/send.ts`                              | `sendReviewRejectedEmail`                     | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/send.ts`                              | `sendReviewResponseSentConfirmationEmail`     | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/send.ts`                              | `sendReviewPublishedNotificationEmail`        | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/send.ts`                              | `sendReviewResponseReceivedEmail`             | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/send.ts`                              | `sendNegativeReviewAlertEnhancedEmail`        | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/send.ts`                              | `sendFirstReviewMilestoneEmail`               | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/send.ts`                              | `sendReviewCountMilestoneEmail`               | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/send.ts`                              | `sendFirst5StarMilestoneEmail`                | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/send.ts`                              | `sendRatingImprovementMilestoneEmail`         | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/send.ts`                              | `sendNpsImprovementMilestoneEmail`            | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/send.ts`                              | `sendLeaderboardMilestoneEmail`               | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/send.ts`                              | `sendBadgeEarnedMilestoneEmail`               | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/send.ts`                              | `sendStreakMilestoneEmail`                    | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/send.ts`                              | `sendProfileCompletionMilestoneEmail`         | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/send.ts`                              | `sendVideoMilestoneEmail`                     | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/send.ts`                              | `<redacted>`                                  | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/send.ts`                              | `<redacted>`                                  | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/send.ts`                              | `<redacted>`                                  | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/send.ts`                              | `<redacted>`                                  | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/send.ts`                              | `sendTrialEnding5WinbackEmail`                | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/send.ts`                              | `sendProfileReferralIntroductionEmail`        | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/send.ts`                              | `sendReviewVerificationEmail`                 | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/send.ts`                              | `sendReviewVideoUpsellEmail`                  | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/send.ts`                              | `sendReviewDisputeEscalationEmail`            | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/team-invite-service.ts`               | `sendTeamInviteInitialEmail`                  | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/team-invite-service.ts`               | `sendTeamInviteWelcomeEmail`                  | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/team-invite-service.ts`               | `processTeamInviteQueue`                      | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/team-invite-service.ts`               | `getInviteFunnelStats`                        | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/team-invite-service.ts`               | `resendTeamInvite`                            | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/trial-ending-service.ts`              | `startTrialEndingSequence`                    | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/trial-ending-service.ts`              | `processTrialEndingSequenceQueue`             | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/trial-ending-service.ts`              | `pauseTrialEndingSequence`                    | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/trial-ending-service.ts`              | `resumeTrialEndingSequence`                   | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/trial-ending-service.ts`              | `getTrialEndingSequenceStatus`                | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/trial-ending-service.ts`              | `checkAndStartTrialEndingSequences`           | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/welcome-sequence-service.ts`          | `startWelcomeSequence`                        | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/welcome-sequence-service.ts`          | `processWelcomeSequenceQueue`                 | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/welcome-sequence-service.ts`          | `pauseWelcomeSequence`                        | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/welcome-sequence-service.ts`          | `resumeWelcomeSequence`                       | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/email/welcome-sequence-service.ts`          | `getWelcomeSequenceStatus`                    | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/milestones/actions.ts`                      | `checkFirstReviewMilestone`                   | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/milestones/actions.ts`                      | `checkReviewCountMilestones`                  | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/milestones/actions.ts`                      | `checkFirst5StarMilestone`                    | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/milestones/actions.ts`                      | `checkRatingImprovementMilestone`             | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/milestones/actions.ts`                      | `checkNpsImprovementMilestone`                | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/milestones/actions.ts`                      | `checkStreakMilestones`                       | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/milestones/actions.ts`                      | `checkLeaderboardMilestones`                  | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/milestones/actions.ts`                      | `checkBadgeEarnedMilestone`                   | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/milestones/actions.ts`                      | `checkProfileCompletionMilestones`            | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/milestones/actions.ts`                      | `checkVideoMilestones`                        | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/milestones/actions.ts`                      | `updateMilestoneEmailStatus`                  | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/milestones/actions.ts`                      | `checkAllMilestonesForReview`                 | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/milestones/actions.ts`                      | `dispatchMilestoneEmail`                      | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/milestones/actions.ts`                      | `processPendingMilestoneEmails`               | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/notifications/actions.ts`                   | `createNotification`                          | removed from exported server-action surface                                          |
| `src/lib/notifications/actions.ts`                   | `sendSlackNotification`                       | removed from exported server-action surface                                          |
| `src/lib/notifications/actions.ts`                   | `getPendingDigestNotifications`               | removed from exported server-action surface                                          |
| `src/lib/notifications/actions.ts`                   | `markDigestSent`                              | removed from exported server-action surface                                          |
| `src/lib/notifications/actions.ts`                   | `getUsersNeedingDigest`                       | removed from exported server-action surface                                          |
| `src/lib/reviews/flag-actions.ts`                    | `routeNewFlag`                                | removed from exported server-action surface                                          |
| `src/lib/tasks/rules.ts`                             | `checkUnrespondedReviews`                     | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/tasks/rules.ts`                             | `checkPendingResponseCount`                   | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/tasks/rules.ts`                             | `checkIncompleteProfile`                      | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/tasks/rules.ts`                             | `checkNoRecentRequests`                       | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/tasks/rules.ts`                             | `checkSurveyVelocityDecline`                  | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/tasks/rules.ts`                             | `checkNegativeThemeSpike`                     | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/tasks/rules.ts`                             | `checkRatingImprovement`                      | converted from use-server action module to internal module (no use-server directive) |
| `src/lib/video-testimonials/public-actions.ts`       | `processVideoTestimonialAIJob`                | removed from exported server-action surface                                          |
| `src/lib/video-testimonials/public-actions.ts`       | `getPendingAIProcessingJobs`                  | removed from exported server-action surface                                          |

## Public Action Allowlist

| Action                                                                      | Reason                                                                          |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `src/app/(public)/u/c/[token]/actions.ts#getContactByUnsubscribeToken`      | Token-scoped contact preference lookup.                                         |
| `src/app/(public)/u/c/[token]/actions.ts#resubscribeContactByToken`         | Token-scoped contact resubscribe.                                               |
| `src/app/(public)/u/c/[token]/actions.ts#unsubscribeContactByToken`         | Token-scoped contact unsubscribe.                                               |
| `src/lib/auth/actions.ts#resetPassword`                                     | Auth bootstrap/password reset flow; provider owns token validation.             |
| `src/lib/auth/actions.ts#signIn`                                            | Auth bootstrap flow; provider validates credentials.                            |
| `src/lib/auth/actions.ts#signInWithMagicLink`                               | Auth bootstrap flow; provider validates email delivery/token.                   |
| `src/lib/auth/actions.ts#signUp`                                            | Auth bootstrap flow; provider validates account creation.                       |
| `src/lib/auth/actions.ts#unifiedResetPassword`                              | Auth bootstrap/password reset flow; provider owns token validation.             |
| `src/lib/auth/actions.ts#unifiedSignIn`                                     | Auth bootstrap flow; provider validates credentials.                            |
| `src/lib/auth/actions.ts#unifiedSignInWithMagicLink`                        | Auth bootstrap flow; provider validates email delivery/token.                   |
| `src/lib/auth/actions.ts#unifiedSignUp`                                     | Auth bootstrap flow; provider validates account creation.                       |
| `src/lib/auth/server-actions.ts#resetPasswordBetterAuth`                    | Auth bootstrap/password reset flow; provider owns token validation.             |
| `src/lib/auth/server-actions.ts#signInWithBetterAuth`                       | Auth bootstrap flow; provider validates credentials.                            |
| `src/lib/auth/server-actions.ts#signInWithMagicLinkBetterAuth`              | Auth bootstrap flow; provider validates email delivery/token.                   |
| `src/lib/auth/server-actions.ts#signUpWithBetterAuth`                       | Auth bootstrap flow; provider validates account creation.                       |
| `src/lib/auth/server-actions.ts#updatePasswordBetterAuth`                   | Password-reset continuation; provider validates reset token/session.            |
| `src/lib/credentials/actions.ts#getPublicCredentials`                       | Public verified profile credential read.                                        |
| `src/lib/directory/actions.ts#getAvailableIndustries`                       | Public directory facet read; applies public professional filters.               |
| `src/lib/directory/actions.ts#searchLoanOfficers`                           | Public directory search legacy alias; applies public professional filters.      |
| `src/lib/directory/actions.ts#searchProfessionals`                          | Public directory search; applies public professional filters.                   |
| `src/lib/directory/contact-action.ts#contactProfessional`                   | Public lead-capture form; schema validation and email-only side effect.         |
| `src/lib/directory/geocoding.ts#geocodeAddress`                             | Public geocode lookup helper; no tenant data read/write.                        |
| `src/lib/directory/geocoding.ts#geocodeAddressWithFallback`                 | Public geocode lookup helper; no tenant data read/write.                        |
| `src/lib/email-preferences/actions.ts#getCommunicationPreferencesByToken`   | Token-scoped communication preference lookup.                                   |
| `src/lib/email-preferences/actions.ts#getEmailPreferencesByToken`           | Token-scoped email preference lookup.                                           |
| `src/lib/email-preferences/actions.ts#resubscribeByToken`                   | Token-scoped email preference mutation.                                         |
| `src/lib/email-preferences/actions.ts#unsubscribeAllByToken`                | Token-scoped email preference mutation.                                         |
| `src/lib/email-preferences/actions.ts#updateEmailPreferencesByToken`        | Token-scoped email preference mutation.                                         |
| `src/lib/email-preferences/actions.ts#updateSmsConsentByToken`              | Token-scoped legacy SMS consent endpoint; current implementation is write-safe. |
| `src/lib/ex-surveys/public-actions.ts#getEXSurveyByToken`                   | Invitation-token scoped employee experience survey read.                        |
| `src/lib/ex-surveys/public-actions.ts#getEXSurveyStatus`                    | Invitation-token scoped employee experience survey status read.                 |
| `src/lib/ex-surveys/public-actions.ts#submitEXSurveyResponse`               | Invitation-token scoped employee experience survey submission.                  |
| `src/lib/marketing/actions.ts#submitContactForm`                            | Public lead-capture form; schema validation and email-only side effect.         |
| `src/lib/marketing/actions.ts#submitDemoRequest`                            | Public lead-capture form; schema validation and email-only side effect.         |
| `src/lib/pro-profile/actions.ts#flagReview`                                 | Public flag submission scoped to a public profile/review pair.                  |
| `src/lib/pro-profile/actions.ts#submitPublicReview`                         | Public review submission with rate limiting and email verification token.       |
| `src/lib/pro-profile/actions.ts#submitReferral`                             | Public referral form scoped to a public professional.                           |
| `src/lib/pro/contact-actions.ts#contactProfessional`                        | Public lead-capture form; schema validation and email-only side effect.         |
| `src/lib/pro/contact-actions.ts#contactRecipient`                           | Public lead-capture form; schema validation and email-only side effect.         |
| `src/lib/reporting/actions.ts#getReportShareByToken`                        | Share-token scoped report read.                                                 |
| `src/lib/reporting/export.ts#exportReportToCSV`                             | Pure serialization of caller-provided report data.                              |
| `src/lib/reviews/upsell-actions.ts#startReviewVideoUpsell`                  | Public verified-review upsell flow; checks published direct-review eligibility. |
| `src/lib/seo/actions.ts#getAllOrganizationSlugs`                            | Public SEO metadata read.                                                       |
| `src/lib/seo/actions.ts#getAllPublicBranchIds`                              | Public SEO metadata read.                                                       |
| `src/lib/seo/actions.ts#getAllPublicBranchSlugs`                            | Public SEO metadata read.                                                       |
| `src/lib/seo/actions.ts#getAllPublicLOIds`                                  | Public SEO metadata read.                                                       |
| `src/lib/seo/actions.ts#getAllPublicUserSlugs`                              | Public SEO metadata read.                                                       |
| `src/lib/seo/actions.ts#getPublicBranchOgCardData`                          | Public SEO/profile read.                                                        |
| `src/lib/seo/actions.ts#getPublicBranchProfile`                             | Public SEO/profile read.                                                        |
| `src/lib/seo/actions.ts#getPublicLOList`                                    | Public SEO/profile read.                                                        |
| `src/lib/seo/actions.ts#getPublicLOProfile`                                 | Public SEO/profile read.                                                        |
| `src/lib/seo/actions.ts#getPublicOrganizationOgCardData`                    | Public SEO/profile read.                                                        |
| `src/lib/seo/actions.ts#getPublicOrganizationProfile`                       | Public SEO/profile read.                                                        |
| `src/lib/seo/actions.ts#getPublicProfessionalOgCardData`                    | Public SEO/profile read.                                                        |
| `src/lib/stripe/actions.ts#getPricingForCheckout`                           | Public pricing configuration read.                                              |
| `src/lib/stripe/actions.ts#getPricingTiers`                                 | Public pricing configuration read.                                              |
| `src/lib/surveys/public-actions.ts#getSurveyByToken`                        | Survey-token scoped read.                                                       |
| `src/lib/surveys/public-actions.ts#recordSurveyGoogleReviewClick`           | Survey-token scoped analytics event.                                            |
| `src/lib/surveys/public-actions.ts#submitSurveyResponse`                    | Survey-token scoped submission.                                                 |
| `src/lib/users/actions.ts#getPublicUserProfile`                             | Public user profile read.                                                       |
| `src/lib/users/actions.ts#getPublicUsers`                                   | Public user listing.                                                            |
| `src/lib/video-testimonials/approval-actions.ts#getTextApprovalData`        | Approval-token scoped video testimonial read.                                   |
| `src/lib/video-testimonials/approval-actions.ts#regenerateReviewText`       | Approval-token scoped video testimonial mutation.                               |
| `src/lib/video-testimonials/approval-actions.ts#submitApprovedText`         | Approval-token scoped video testimonial mutation.                               |
| `src/lib/video-testimonials/public-actions.ts#createVideoUploadUrl`         | Video-testimonial token scoped signed upload URL.                               |
| `src/lib/video-testimonials/public-actions.ts#createVideoUploadUrls`        | Video-testimonial token scoped signed upload URLs.                              |
| `src/lib/video-testimonials/public-actions.ts#generateShareLink`            | Published-video scoped share link helper.                                       |
| `src/lib/video-testimonials/public-actions.ts#getPublicVideoMetadata`       | Public published-video metadata read.                                           |
| `src/lib/video-testimonials/public-actions.ts#getPublicVideoTestimonial`    | Public published-video read.                                                    |
| `src/lib/video-testimonials/public-actions.ts#getShareKit`                  | Video-testimonial token scoped share kit.                                       |
| `src/lib/video-testimonials/public-actions.ts#getVideoTestimonialByToken`   | Video-testimonial token scoped read.                                            |
| `src/lib/video-testimonials/public-actions.ts#recordPassthroughClick`       | Video-testimonial token scoped analytics event.                                 |
| `src/lib/video-testimonials/public-actions.ts#submitCustomerInfoAndConsent` | Video-testimonial token scoped customer consent submission.                     |
| `src/lib/video-testimonials/public-actions.ts#submitPrivateFeedback`        | Video-testimonial token scoped private feedback submission.                     |
| `src/lib/video-testimonials/public-actions.ts#submitVideoTestimonial`       | Video-testimonial token scoped media submission.                                |
| `src/lib/video-testimonials/public-actions.ts#trackVideoShare`              | Published-video scoped analytics event.                                         |
| `src/lib/widgets/ab-testing.ts#getPublicAbTestConfig`                       | Public widget A/B-test configuration read.                                      |

## Triage Inventory

### src/app/(public)/u/c/[token]/actions.ts

| Action                      | Line | Verdict          | Evidence                          |
| --------------------------- | ---: | ---------------- | --------------------------------- |
| `unsubscribeContactByToken` |  139 | PUBLIC-BY-DESIGN | Token-scoped contact unsubscribe. |
| `resubscribeContactByToken` |  164 | PUBLIC-BY-DESIGN | Token-scoped contact resubscribe. |

### src/components/settings/webhooks/outbound-webhook-actions.ts

| Action                   | Line | Verdict           | Evidence                                                         |
| ------------------------ | ---: | ----------------- | ---------------------------------------------------------------- |
| `listOutboundEndpoints`  |   98 | UNPROTECTED-FIXED | guard added: requireOutboundEndpointAccess -> requireAdminAccess |
| `createOutboundEndpoint` |  103 | UNPROTECTED-FIXED | guard added: requireOutboundEndpointAccess -> requireAdminAccess |
| `toggleOutboundEndpoint` |  114 | UNPROTECTED-FIXED | guard added: requireOutboundEndpointAccess -> requireAdminAccess |
| `deleteOutboundEndpoint` |  118 | UNPROTECTED-FIXED | guard added: requireOutboundEndpointAccess -> requireAdminAccess |
| `listOutboundDeliveries` |  122 | UNPROTECTED-FIXED | guard added: requireOutboundEndpointAccess -> requireAdminAccess |

### src/lib/ai/actions.ts

| Action             | Line | Verdict           | Evidence                                                                             |
| ------------------ | ---: | ----------------- | ------------------------------------------------------------------------------------ |
| `analyzeNewReview` |   25 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `checkAIStatus`    |  491 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |

### src/lib/ai/insights-actions.ts

| Action                          | Line | Verdict           | Evidence       |
| ------------------------------- | ---: | ----------------- | -------------- |
| `getSentimentTrend`             |  195 | AUTHED-INTERNALLY | getUserContext |
| `getThemeFrequencies`           |  289 | AUTHED-INTERNALLY | getUserContext |
| `getTopKeyPhrases`              |  408 | AUTHED-INTERNALLY | getUserContext |
| `getSentimentDistribution`      |  494 | AUTHED-INTERNALLY | getUserContext |
| `generateAISummary`             |  542 | AUTHED-INTERNALLY | getUserContext |
| `getImprovementRecommendations` |  796 | AUTHED-INTERNALLY | getUserContext |
| `getIndustryBenchmarks`         | 1009 | AUTHED-INTERNALLY | getUserContext |
| `getAIInsightsData`             | 1141 | AUTHED-INTERNALLY | getUserContext |
| `getSmartActionItems`           | 1244 | AUTHED-INTERNALLY | getUserContext |
| `getLOPerformanceScorecard`     | 1446 | AUTHED-INTERNALLY | getUserContext |
| `getTeamActivityMonitor`        | 1734 | AUTHED-INTERNALLY | getUserContext |
| `getChannelEffectiveness`       | 2007 | AUTHED-INTERNALLY | getUserContext |

### src/lib/analytics/engine.ts

| Action                       | Line | Verdict           | Evidence       |
| ---------------------------- | ---: | ----------------- | -------------- |
| `getNPSMetrics`              |   93 | AUTHED-INTERNALLY | getUserContext |
| `getCSATMetrics`             |  147 | AUTHED-INTERNALLY | getUserContext |
| `getResponseRateMetrics`     |  201 | AUTHED-INTERNALLY | getUserContext |
| `getReviewVelocityMetrics`   |  246 | AUTHED-INTERNALLY | getUserContext |
| `getUserAnalytics`           |  289 | AUTHED-INTERNALLY | getUserContext |
| `getOrganizationAnalytics`   |  423 | AUTHED-INTERNALLY | getUserContext |
| `getNPSTrendData`            |  507 | AUTHED-INTERNALLY | getUserContext |
| `getCSATTrendData`           |  562 | AUTHED-INTERNALLY | getUserContext |
| `getReviewVelocityTrendData` |  617 | AUTHED-INTERNALLY | getUserContext |
| `getMetricComparison`        |  683 | AUTHED-INTERNALLY | getUserContext |
| `invalidateMetricsCache`     |  855 | AUTHED-INTERNALLY | getUserContext |
| `computeHistoricalSnapshots` |  886 | AUTHED-INTERNALLY | getUserContext |

### src/lib/analytics/member-analytics-actions.ts

| Action               | Line | Verdict           | Evidence       |
| -------------------- | ---: | ----------------- | -------------- |
| `getMemberAnalytics` |   75 | AUTHED-INTERNALLY | getUserContext |

### src/lib/analytics/request-funnel.ts

| Action                   | Line | Verdict           | Evidence         |
| ------------------------ | ---: | ----------------- | ---------------- |
| `getRequestFunnelRollup` |   77 | AUTHED-INTERNALLY | getAccessContext |

### src/lib/auth/actions.ts

| Action            | Line | Verdict           | Evidence                           |
| ----------------- | ---: | ----------------- | ---------------------------------- |
| `updatePassword`  |  244 | UNPROTECTED-FIXED | guard added: supabase.auth.getUser |
| `signOut`         |  269 | UNPROTECTED-FIXED | guard added: supabase.auth.getUser |
| `isPlatformAdmin` |  356 | AUTHED-INTERNALLY | isPlatformAdmin                    |

### src/lib/auth/profile-actions.ts

| Action                        | Line | Verdict           | Evidence       |
| ----------------------------- | ---: | ----------------- | -------------- |
| `updateProfile`               |   20 | AUTHED-INTERNALLY | unifiedGetUser |
| `updateOwnOrgFields`          |   38 | AUTHED-INTERNALLY | unifiedGetUser |
| `changePassword`              |   66 | AUTHED-INTERNALLY | unifiedGetUser |
| `getUserProfile`              |   87 | AUTHED-INTERNALLY | unifiedGetUser |
| `uploadAvatar`                |  114 | AUTHED-INTERNALLY | unifiedGetUser |
| `uploadCoverPhoto`            |  125 | AUTHED-INTERNALLY | unifiedGetUser |
| `removeCoverPhoto`            |  136 | AUTHED-INTERNALLY | unifiedGetUser |
| `deactivateIndividualAccount` |  184 | AUTHED-INTERNALLY | unifiedGetUser |
| `updateUserSlug`              |  271 | AUTHED-INTERNALLY | unifiedGetUser |

### src/lib/auth/server-actions.ts

| Action                     | Line | Verdict           | Evidence                                                             |
| -------------------------- | ---: | ----------------- | -------------------------------------------------------------------- |
| `updatePasswordBetterAuth` |  291 | PUBLIC-BY-DESIGN  | Password-reset continuation; provider validates reset token/session. |
| `signOutBetterAuth`        |  327 | UNPROTECTED-FIXED | guard added: getSessionBetterAuth                                    |

### src/lib/branches/actions.ts

| Action          | Line | Verdict           | Evidence      |
| --------------- | ---: | ----------------- | ------------- |
| `requireAccess` |  132 | AUTHED-INTERNALLY | requireAccess |

### src/lib/campaigns/actions.ts

| Action              | Line | Verdict           | Evidence                 |
| ------------------- | ---: | ----------------- | ------------------------ |
| `createCampaign`    |  105 | AUTHED-INTERNALLY | requireEnterpriseManager |
| `updateCampaign`    |  167 | AUTHED-INTERNALLY | requireEnterpriseManager |
| `deleteCampaign`    |  226 | AUTHED-INTERNALLY | requireEnterpriseManager |
| `getCampaign`       |  279 | AUTHED-INTERNALLY | requireEnterpriseManager |
| `listCampaigns`     |  284 | AUTHED-INTERNALLY | requireEnterpriseManager |
| `duplicateCampaign` |  298 | AUTHED-INTERNALLY | requireEnterpriseManager |
| `acquireLock`       |  342 | AUTHED-INTERNALLY | requireEnterpriseManager |
| `releaseLock`       |  375 | AUTHED-INTERNALLY | requireEnterpriseManager |
| `activateCampaign`  |  396 | AUTHED-INTERNALLY | requireEnterpriseManager |
| `pauseCampaign`     |  493 | AUTHED-INTERNALLY | requireEnterpriseManager |

### src/lib/contacts/import.ts

| Action               | Line | Verdict           | Evidence         |
| -------------------- | ---: | ----------------- | ---------------- |
| `bulkImportContacts` |   54 | AUTHED-INTERNALLY | getAccessContext |

### src/lib/contacts/ui-actions.ts

| Action                   | Line | Verdict           | Evidence                                |
| ------------------------ | ---: | ----------------- | --------------------------------------- |
| `setContactDoNotContact` |   65 | AUTHED-INTERNALLY | resolveContactScope -> getAccessContext |
| `reassignContact`        |   86 | AUTHED-INTERNALLY | resolveContactScope -> getAccessContext |
| `eraseContactAction`     |  120 | AUTHED-INTERNALLY | getAccessContext                        |

### src/lib/credentials/actions.ts

| Action             | Line | Verdict           | Evidence       |
| ------------------ | ---: | ----------------- | -------------- |
| `getMyCredentials` |   54 | AUTHED-INTERNALLY | unifiedGetUser |
| `createCredential` |  138 | AUTHED-INTERNALLY | getUserContext |
| `updateCredential` |  251 | AUTHED-INTERNALLY | getUserContext |
| `deleteCredential` |  312 | AUTHED-INTERNALLY | getUserContext |

### src/lib/dashboard/manager-actions.ts

| Action                       | Line | Verdict           | Evidence             |
| ---------------------------- | ---: | ----------------- | -------------------- |
| `getTeamMetrics`             |  108 | AUTHED-INTERNALLY | getManagerContext    |
| `getReviewsBySource`         |  216 | AUTHED-INTERNALLY | getManagerContext    |
| `getUserComparison`          |  256 | AUTHED-INTERNALLY | getManagerContext    |
| `getFilterOptions`           |  369 | AUTHED-INTERNALLY | getManagerContext    |
| `getEnterpriseFilterOptions` |  379 | AUTHED-INTERNALLY | getEnterpriseContext |
| `getLeaderboard`             |  415 | AUTHED-INTERNALLY | getManagerContext    |
| `getLowPerformers`           |  472 | AUTHED-INTERNALLY | getManagerContext    |
| `getTeamNPSTrend`            |  493 | AUTHED-INTERNALLY | getManagerContext    |
| `getTeamRatingTrend`         |  589 | AUTHED-INTERNALLY | getManagerContext    |
| `getTeamReviewVolumeTrend`   |  673 | AUTHED-INTERNALLY | getManagerContext    |

### src/lib/dashboard/user-actions.ts

| Action                 | Line | Verdict           | Evidence                         |
| ---------------------- | ---: | ----------------- | -------------------------------- |
| `getUserMetrics`       |   88 | AUTHED-INTERNALLY | getUserContext                   |
| `getUserRecentReviews` |  209 | AUTHED-INTERNALLY | getUserContext                   |
| `getRatingTrend`       |  279 | AUTHED-INTERNALLY | getUserContext                   |
| `getNPSTrend`          |  366 | AUTHED-INTERNALLY | getUserContext                   |
| `getUserProfile`       |  474 | AUTHED-INTERNALLY | getUserContext                   |
| `getReviewVolumeTrend` |  543 | AUTHED-INTERNALLY | getUserContext                   |
| `getProfileCompletion` |  602 | AUTHED-INTERNALLY | getUserProfile -> getUserContext |

### src/lib/directory/actions.ts

| Action                         | Line | Verdict           | Evidence                                                                   |
| ------------------------------ | ---: | ----------------- | -------------------------------------------------------------------------- |
| `searchProfessionals`          |  237 | PUBLIC-BY-DESIGN  | Public directory search; applies public professional filters.              |
| `searchLoanOfficers`           |  453 | PUBLIC-BY-DESIGN  | Public directory search legacy alias; applies public professional filters. |
| `updateUserCoordinates`        |  465 | UNPROTECTED-FIXED | guard added: requireDirectoryMaintenanceAccess                             |
| `updateLoanOfficerCoordinates` |  491 | UNPROTECTED-FIXED | guard added: updateUserCoordinates -> requireDirectoryMaintenanceAccess    |
| `batchGeocodeUsers`            |  503 | UNPROTECTED-FIXED | guard added: requireDirectoryMaintenanceAccess                             |
| `batchGeocodeLoanOfficers`     |  574 | UNPROTECTED-FIXED | guard added: batchGeocodeUsers -> requireDirectoryMaintenanceAccess        |
| `batchGeocodeBranches`         |  582 | UNPROTECTED-FIXED | guard added: requireDirectoryMaintenanceAccess                             |
| `getAvailableIndustries`       |  655 | PUBLIC-BY-DESIGN  | Public directory facet read; applies public professional filters.          |

### src/lib/directory/contact-action.ts

| Action                | Line | Verdict          | Evidence                                                                |
| --------------------- | ---: | ---------------- | ----------------------------------------------------------------------- |
| `contactProfessional` |   16 | PUBLIC-BY-DESIGN | Public lead-capture form; schema validation and email-only side effect. |

### src/lib/directory/geocoding.ts

| Action                       | Line | Verdict          | Evidence                                                 |
| ---------------------------- | ---: | ---------------- | -------------------------------------------------------- |
| `geocodeAddress`             |   36 | PUBLIC-BY-DESIGN | Public geocode lookup helper; no tenant data read/write. |
| `geocodeAddressWithFallback` |  182 | PUBLIC-BY-DESIGN | Public geocode lookup helper; no tenant data read/write. |

### src/lib/distribution/actions.ts

| Action                      | Line | Verdict           | Evidence                             |
| --------------------------- | ---: | ----------------- | ------------------------------------ |
| `createSurveyAndQueue`      |   65 | AUTHED-INTERNALLY | unifiedGetUser                       |
| `sendSurveyManually`        |  328 | AUTHED-INTERNALLY | unifiedGetUser                       |
| `resendSurvey`              |  480 | AUTHED-INTERNALLY | sendSurveyManually -> unifiedGetUser |
| `getSurveysForDistribution` |  512 | AUTHED-INTERNALLY | unifiedGetUser                       |
| `getUsersForSend`           |  629 | AUTHED-INTERNALLY | unifiedGetUser                       |
| `getActiveTemplatesForSend` |  678 | AUTHED-INTERNALLY | unifiedGetUser                       |
| `getDistributionQueue`      |  724 | AUTHED-INTERNALLY | unifiedGetUser                       |
| `getWebhookConfigs`         |  844 | AUTHED-INTERNALLY | unifiedGetUser                       |
| `createWebhookConfig`       |  898 | AUTHED-INTERNALLY | unifiedGetUser                       |
| `toggleWebhookConfig`       |  977 | AUTHED-INTERNALLY | unifiedGetUser                       |
| `deleteWebhookConfig`       | 1021 | AUTHED-INTERNALLY | unifiedGetUser                       |
| `regenerateWebhookSecret`   | 1062 | AUTHED-INTERNALLY | unifiedGetUser                       |

### src/lib/distribution/service.ts

| Action                       | Line | Verdict           | Evidence                                                                             |
| ---------------------------- | ---: | ----------------- | ------------------------------------------------------------------------------------ |
| `checkRateLimit`             |   53 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `getSurveyForSending`        |  152 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `processQueueItem`           |  238 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `scheduleReminders`          |  446 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `getPendingQueueItems`       |  502 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `processDistributionQueue`   |  532 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `cancelPendingDistributions` |  562 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `getDistributionStats`       |  586 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |

### src/lib/email-ab-testing/actions.ts

| Action                      | Line | Verdict           | Evidence                                       |
| --------------------------- | ---: | ----------------- | ---------------------------------------------- |
| `getActiveTestForEmailType` | 1047 | UNPROTECTED-FIXED | guard added: getAdminContext -> unifiedGetUser |

### src/lib/email-builder/actions.ts

| Action                       | Line | Verdict           | Evidence                                    |
| ---------------------------- | ---: | ----------------- | ------------------------------------------- |
| `listTemplates`              |   67 | AUTHED-INTERNALLY | getUserContext                              |
| `getTemplateById`            |   80 | AUTHED-INTERNALLY | getUserContext                              |
| `createTemplate`             |  101 | AUTHED-INTERNALLY | getUserContext                              |
| `updateTemplate`             |  160 | AUTHED-INTERNALLY | getUserContext                              |
| `deleteTemplate`             |  215 | AUTHED-INTERNALLY | getUserContext                              |
| `duplicateTemplate`          |  227 | AUTHED-INTERNALLY | getTemplateById -> getUserContext           |
| `resolveTemplateById`        |  250 | UNPROTECTED-FIXED | removed from exported server-action surface |
| `previewTemplate`            |  294 | AUTHED-INTERNALLY | getUserContext                              |
| `getTeamMembersForTestEmail` |  306 | AUTHED-INTERNALLY | getUserContext                              |
| `sendTestEmail`              |  368 | AUTHED-INTERNALLY | getUserContext                              |

### src/lib/email-preferences/actions.ts

| Action                                | Line | Verdict           | Evidence                                                                        |
| ------------------------------------- | ---: | ----------------- | ------------------------------------------------------------------------------- |
| `getEmailPreferences`                 |   45 | AUTHED-INTERNALLY | unifiedGetUser                                                                  |
| `updateEmailPreferences`              |  100 | AUTHED-INTERNALLY | unifiedGetUser                                                                  |
| `getEmailPreferenceToken`             |  155 | AUTHED-INTERNALLY | unifiedGetUser                                                                  |
| `getEmailPreferencesByToken`          |  184 | PUBLIC-BY-DESIGN  | Token-scoped email preference lookup.                                           |
| `updateEmailPreferencesByToken`       |  232 | PUBLIC-BY-DESIGN  | Token-scoped email preference mutation.                                         |
| `unsubscribeAllByToken`               |  282 | PUBLIC-BY-DESIGN  | Token-scoped email preference mutation.                                         |
| `resubscribeByToken`                  |  313 | PUBLIC-BY-DESIGN  | Token-scoped email preference mutation.                                         |
| `getCommunicationPreferencesByToken`  |  357 | PUBLIC-BY-DESIGN  | Token-scoped communication preference lookup.                                   |
| `updateSmsConsentByToken`             |  374 | PUBLIC-BY-DESIGN  | Token-scoped legacy SMS consent endpoint; current implementation is write-safe. |
| `generateEmailPreferenceTokenForUser` |  391 | UNPROTECTED-FIXED | removed from exported server-action surface                                     |
| `isUserUnsubscribed`                  |  419 | UNPROTECTED-FIXED | removed from exported server-action surface                                     |
| `isEmailCategoryEnabled`              |  451 | UNPROTECTED-FIXED | removed from exported server-action surface                                     |

### src/lib/email/abandoned-action-recovery-service.ts

| Action                       | Line | Verdict           | Evidence                                                                             |
| ---------------------------- | ---: | ----------------- | ------------------------------------------------------------------------------------ |
| `trackActionStarted`         |  231 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `trackActionCompleted`       |  262 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `updateActionContext`        |  287 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `processRecoveryEmail1Queue` |  404 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `processRecoveryEmail2Queue` |  414 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `expireOldAbandonedActions`  |  424 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `getAbandonedAction`         |  726 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `getUserAbandonedActions`    |  750 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `getAbandonedActionStats`    |  772 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |

### src/lib/email/orchestration/channel-router.ts

| Action               | Line | Verdict           | Evidence                                                                             |
| -------------------- | ---: | ----------------- | ------------------------------------------------------------------------------------ |
| `routeStepToChannel` |   15 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |

### src/lib/email/orchestration/executor.ts

| Action                          | Line | Verdict           | Evidence                                                                             |
| ------------------------------- | ---: | ----------------- | ------------------------------------------------------------------------------------ |
| `updateSequenceStatus`          |  126 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `updateSequenceAfterSend`       |  161 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `updateSequenceAfterSkip`       |  208 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `updateSequenceNextEmailAt`     |  243 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `checkStandardExitConditions`   |  265 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `checkDefinitionExitConditions` |  310 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `checkStepExitConditions`       |  325 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `shouldSkipStep`                |  352 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `evaluateStepBranches`          |  376 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `executeStep`                   |  395 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `isReadyToExecute`              |  598 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |

### src/lib/email/orchestration/queue.ts

| Action                     | Line | Verdict           | Evidence                                                                             |
| -------------------------- | ---: | ----------------- | ------------------------------------------------------------------------------------ |
| `fetchAndLockSequences`    |   82 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `resetSequenceToActive`    |  139 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `processSequenceQueue`     |  155 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `processAllSequenceQueues` |  226 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `pauseSequence`            |  261 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `resumeSequence`           |  291 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `pauseUserSequences`       |  329 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `resumeUserSequences`      |  366 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `cancelSequence`           |  410 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `cancelUserSequences`      |  427 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `getQueueStats`            |  471 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `getUserSequences`         |  549 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `getSequenceById`          |  577 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `resetStuckSequences`      |  602 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `cleanupOldSequences`      |  629 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |

### src/lib/email/orchestration/triggers.ts

| Action                      | Line | Verdict           | Evidence                                                                             |
| --------------------------- | ---: | ----------------- | ------------------------------------------------------------------------------------ |
| `evaluateTriggerConditions` |  173 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `createSequenceInstance`    |  209 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `handleEventTrigger`        |  290 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `dispatchEvent`             |  338 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `triggerSequenceManually`   |  363 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `checkTimeBasedTriggers`    |  422 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `getEligibleUsers`          |  525 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |

### src/lib/email/org-onboarding-service.ts

| Action                              | Line | Verdict           | Evidence                                                                             |
| ----------------------------------- | ---: | ----------------- | ------------------------------------------------------------------------------------ |
| `startOrgOnboardingSequence`        |  371 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `processOrgOnboardingSequenceQueue` |  471 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `pauseOrgOnboardingSequence`        |  967 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `resumeOrgOnboardingSequence`       |  991 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `getOrgOnboardingSequenceStatus`    | 1016 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `getOrgSetupProgress`               | 1041 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |

### src/lib/email/profile-setup-reminder-service.ts

| Action                                 | Line | Verdict           | Evidence                                                                             |
| -------------------------------------- | ---: | ----------------- | ------------------------------------------------------------------------------------ |
| `detectUsersAndStartReminderSequences` |  398 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `startReminderSequence`                |  507 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `processReminderSequenceQueue`         |  577 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `checkAndExitSequenceOnCompletion`     | 1122 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `getReminderSequenceStatus`            | 1169 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |

### src/lib/email/reengagement-sequence-service.ts

| Action                                 | Line | Verdict           | Evidence                                                                             |
| -------------------------------------- | ---: | ----------------- | ------------------------------------------------------------------------------------ |
| `detectInactiveUsersAndStartSequences` |  280 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `startReengagementSequence`            |  383 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `processReengagementSequenceQueue`     |  466 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `getReengagementSequenceStatus`        | 1010 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |

### src/lib/email/role-onboarding-service.ts

| Action                               | Line | Verdict           | Evidence                                                                             |
| ------------------------------------ | ---: | ----------------- | ------------------------------------------------------------------------------------ |
| `startRoleOnboardingSequence`        |  446 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `processRoleOnboardingSequenceQueue` |  543 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `pauseRoleOnboardingSequence`        | 1136 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `resumeRoleOnboardingSequence`       | 1160 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `getRoleOnboardingSequenceStatus`    | 1185 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |

### src/lib/email/send.ts

| Action                                        | Line | Verdict           | Evidence                                                                             |
| --------------------------------------------- | ---: | ----------------- | ------------------------------------------------------------------------------------ |
| `sendSurveyInvitationEmail`                   |  179 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `sendSurveyReminderEmail`                     |  266 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `sendNewReviewNotificationEmail`              |  332 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `updateEmailTrackingStatus`                   |  386 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `sendReviewResponseEmail`                     |  415 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `sendVideoTestimonialInvitationEmail`         |  482 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `sendVideoTestimonialReminderEmail`           |  565 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `sendVideoTestimonialReceivedEmail`           |  632 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `sendVideoTestimonialApprovedEmail`           |  690 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `sendVideoTestimonialPendingApprovalEmail`    |  769 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `sendSurveyCompletionThankYouEmail`           |  852 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `sendSurveyHighRatingFollowUpEmail`           |  936 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `sendSurveyLowRatingFollowUpEmail`            | 1027 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `sendSurveyResponseReceivedNotificationEmail` | 1111 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `sendReviewPendingApprovalEmail`              | 1199 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `sendReviewApprovedEmail`                     | 1280 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `sendReviewRejectedEmail`                     | 1361 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `sendReviewResponseSentConfirmationEmail`     | 1442 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `sendReviewPublishedNotificationEmail`        | 1525 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `sendReviewResponseReceivedEmail`             | 1606 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `sendNegativeReviewAlertEnhancedEmail`        | 1687 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `sendFirstReviewMilestoneEmail`               | 1853 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `sendReviewCountMilestoneEmail`               | 1871 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `sendFirst5StarMilestoneEmail`                | 1890 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `sendRatingImprovementMilestoneEmail`         | 1908 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `sendNpsImprovementMilestoneEmail`            | 1929 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `sendLeaderboardMilestoneEmail`               | 1950 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `sendBadgeEarnedMilestoneEmail`               | 1970 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `sendStreakMilestoneEmail`                    | 1990 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `sendProfileCompletionMilestoneEmail`         | 2010 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `sendVideoMilestoneEmail`                     | 2029 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `<redacted>`                                  | 2052 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `<redacted>`                                  | 2126 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `<redacted>`                                  | 2200 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `<redacted>`                                  | 2275 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `sendTrialEnding5WinbackEmail`                | 2349 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `sendProfileReferralIntroductionEmail`        | 2434 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `sendReviewVerificationEmail`                 | 2499 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `sendReviewVideoUpsellEmail`                  | 2550 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `sendReviewDisputeEscalationEmail`            | 2601 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |

### src/lib/email/team-invite-service.ts

| Action                       | Line | Verdict           | Evidence                                                                             |
| ---------------------------- | ---: | ----------------- | ------------------------------------------------------------------------------------ |
| `sendTeamInviteInitialEmail` |  298 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `sendTeamInviteWelcomeEmail` |  354 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `processTeamInviteQueue`     |  494 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `getInviteFunnelStats`       |  617 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `resendTeamInvite`           |  686 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |

### src/lib/email/trial-ending-service.ts

| Action                              | Line | Verdict           | Evidence                                                                             |
| ----------------------------------- | ---: | ----------------- | ------------------------------------------------------------------------------------ |
| `startTrialEndingSequence`          |  561 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `processTrialEndingSequenceQueue`   |  693 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `pauseTrialEndingSequence`          | 1205 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `resumeTrialEndingSequence`         | 1229 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `getTrialEndingSequenceStatus`      | 1254 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `checkAndStartTrialEndingSequences` | 1284 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |

### src/lib/email/welcome-sequence-service.ts

| Action                        | Line | Verdict           | Evidence                                                                             |
| ----------------------------- | ---: | ----------------- | ------------------------------------------------------------------------------------ |
| `startWelcomeSequence`        |  314 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `processWelcomeSequenceQueue` |  412 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `pauseWelcomeSequence`        |  913 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `resumeWelcomeSequence`       |  937 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `getWelcomeSequenceStatus`    |  962 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |

### src/lib/employees/actions.ts

| Action                   | Line | Verdict           | Evidence                              |
| ------------------------ | ---: | ----------------- | ------------------------------------- |
| `getEmployees`           |   87 | AUTHED-INTERNALLY | getUserOrganization -> unifiedGetUser |
| `getEmployeeDepartments` |  365 | AUTHED-INTERNALLY | getUserOrganization -> unifiedGetUser |

### src/lib/ex-surveys/actions.ts

| Action                         | Line | Verdict           | Evidence                              |
| ------------------------------ | ---: | ----------------- | ------------------------------------- |
| `getEXSurveyTemplate`          |   55 | AUTHED-INTERNALLY | getUserOrganization -> unifiedGetUser |
| `getEXSurveyTemplates`         |  102 | AUTHED-INTERNALLY | getUserOrganization -> unifiedGetUser |
| `initializeDefaultEXTemplates` |  145 | AUTHED-INTERNALLY | getUserOrganization -> unifiedGetUser |

### src/lib/ex-surveys/public-actions.ts

| Action                   | Line | Verdict          | Evidence                                                        |
| ------------------------ | ---: | ---------------- | --------------------------------------------------------------- |
| `getEXSurveyByToken`     |   41 | PUBLIC-BY-DESIGN | Invitation-token scoped employee experience survey read.        |
| `submitEXSurveyResponse` |  140 | PUBLIC-BY-DESIGN | Invitation-token scoped employee experience survey submission.  |
| `getEXSurveyStatus`      |  237 | PUBLIC-BY-DESIGN | Invitation-token scoped employee experience survey status read. |

### src/lib/gamification/actions.ts

| Action                    | Line | Verdict           | Evidence                                 |
| ------------------------- | ---: | ----------------- | ---------------------------------------- |
| `getAvailableBadges`      |   92 | AUTHED-INTERNALLY | getUserContext                           |
| `getUserBadges`           |  131 | AUTHED-INTERNALLY | getUserContext                           |
| `getBadgeProgress`        |  206 | AUTHED-INTERNALLY | getUserContext                           |
| `getEnhancedLeaderboard`  |  337 | AUTHED-INTERNALLY | getUserContext                           |
| `getReputationBreakdown`  |  479 | AUTHED-INTERNALLY | getUserContext                           |
| `getImprovementTips`      |  588 | AUTHED-INTERNALLY | getReputationBreakdown -> getUserContext |
| `getReputationHistory`    |  687 | AUTHED-INTERNALLY | getUserContext                           |
| `getGamificationStats`    |  730 | AUTHED-INTERNALLY | getUserContext                           |
| `saveLeaderboardSnapshot` |  838 | AUTHED-INTERNALLY | getUserContext                           |
| `checkAndAwardBadges`     |  943 | AUTHED-INTERNALLY | getUserContext                           |

### src/lib/gamification/profile-completion-actions.ts

| Action                            | Line | Verdict           | Evidence                                    |
| --------------------------------- | ---: | ----------------- | ------------------------------------------- |
| `getProfileCompletionScore`       |   56 | AUTHED-INTERNALLY | getUserContext                              |
| `getProfileCompletionLeaderboard` |  354 | AUTHED-INTERNALLY | getUserContext                              |
| `getProfileCompletionSummary`     |  520 | AUTHED-INTERNALLY | getProfileCompletionScore -> getUserContext |

### src/lib/google/actions.ts

| Action                        | Line | Verdict           | Evidence                              |
| ----------------------------- | ---: | ----------------- | ------------------------------------- |
| `handleGoogleOAuthCallback`   |  121 | UNPROTECTED-FIXED | guard added: requireManagerRole       |
| `processPendingGoogleReplies` |  671 | UNPROTECTED-FIXED | guard added: requireCronSecretRequest |
| `getAvailableLocations`       |  816 | UNPROTECTED-FIXED | guard added: requireManagerRole       |

### src/lib/groups/actions.ts

| Action                | Line | Verdict           | Evidence       |
| --------------------- | ---: | ----------------- | -------------- |
| `getGroups`           |   65 | AUTHED-INTERNALLY | getUserContext |
| `getGroup`            |  105 | AUTHED-INTERNALLY | getUserContext |
| `getGroupWithMembers` |  134 | AUTHED-INTERNALLY | getUserContext |
| `getUserGroups`       |  202 | AUTHED-INTERNALLY | getUserContext |

### src/lib/marketing/actions.ts

| Action              | Line | Verdict          | Evidence                                                                |
| ------------------- | ---: | ---------------- | ----------------------------------------------------------------------- |
| `submitContactForm` |   37 | PUBLIC-BY-DESIGN | Public lead-capture form; schema validation and email-only side effect. |
| `submitDemoRequest` |   94 | PUBLIC-BY-DESIGN | Public lead-capture form; schema validation and email-only side effect. |

### src/lib/media/actions.ts

| Action                | Line | Verdict           | Evidence       |
| --------------------- | ---: | ----------------- | -------------- |
| `uploadMediaAsset`    |   77 | AUTHED-INTERNALLY | getUserContext |
| `listMediaAssets`     |  138 | AUTHED-INTERNALLY | getUserContext |
| `deleteMediaAsset`    |  155 | AUTHED-INTERNALLY | getUserContext |
| `getMediaLibraryData` |  202 | AUTHED-INTERNALLY | getUserContext |
| `getMediaStats`       |  310 | AUTHED-INTERNALLY | getUserContext |

### src/lib/milestones/actions.ts

| Action                             | Line | Verdict           | Evidence                                                                             |
| ---------------------------------- | ---: | ----------------- | ------------------------------------------------------------------------------------ |
| `checkFirstReviewMilestone`        |  158 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `checkReviewCountMilestones`       |  203 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `checkFirst5StarMilestone`         |  255 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `checkRatingImprovementMilestone`  |  294 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `checkNpsImprovementMilestone`     |  360 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `checkStreakMilestones`            |  426 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `checkLeaderboardMilestones`       |  465 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `checkBadgeEarnedMilestone`        |  570 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `checkProfileCompletionMilestones` |  602 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `checkVideoMilestones`             |  640 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `getUserMilestones`                |  693 | AUTHED-INTERNALLY | getUserContext                                                                       |
| `getPendingMilestoneEmails`        |  722 | AUTHED-INTERNALLY | getUserContext                                                                       |
| `updateMilestoneEmailStatus`       |  751 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `recordMilestoneSocialShare`       |  785 | AUTHED-INTERNALLY | getUserContext                                                                       |
| `getMilestoneEmailPreferences`     |  819 | AUTHED-INTERNALLY | getUserContext                                                                       |
| `updateMilestoneEmailPreferences`  |  885 | AUTHED-INTERNALLY | getUserContext                                                                       |
| `checkAllMilestonesForReview`      |  943 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `getMilestoneStats`                |  994 | AUTHED-INTERNALLY | getUserContext                                                                       |
| `dispatchMilestoneEmail`           | 1465 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `processPendingMilestoneEmails`    | 1678 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |

### src/lib/notifications/actions.ts

| Action                          | Line | Verdict           | Evidence                                    |
| ------------------------------- | ---: | ----------------- | ------------------------------------------- |
| `getNotifications`              |   38 | AUTHED-INTERNALLY | unifiedGetUser                              |
| `getUnreadNotificationCount`    |   97 | AUTHED-INTERNALLY | unifiedGetUser                              |
| `markNotificationsAsRead`       |  120 | AUTHED-INTERNALLY | unifiedGetUser                              |
| `archiveNotification`           |  151 | AUTHED-INTERNALLY | unifiedGetUser                              |
| `unarchiveNotification`         |  176 | AUTHED-INTERNALLY | unifiedGetUser                              |
| `getNotificationPreferences`    |  201 | AUTHED-INTERNALLY | unifiedGetUser                              |
| `updateNotificationPreferences` |  223 | AUTHED-INTERNALLY | unifiedGetUser                              |
| `createNotification`            |  272 | UNPROTECTED-FIXED | removed from exported server-action surface |
| `sendSlackNotification`         |  329 | UNPROTECTED-FIXED | removed from exported server-action surface |
| `testSlackWebhook`              |  446 | UNPROTECTED-FIXED | guard added: unifiedGetUser                 |
| `getPendingDigestNotifications` |  490 | UNPROTECTED-FIXED | removed from exported server-action surface |
| `markDigestSent`                |  533 | UNPROTECTED-FIXED | removed from exported server-action surface |
| `getUsersNeedingDigest`         |  563 | UNPROTECTED-FIXED | removed from exported server-action surface |

### src/lib/onboarding/actions.ts

| Action                     | Line | Verdict           | Evidence                              |
| -------------------------- | ---: | ----------------- | ------------------------------------- |
| `getOnboardingStatus`      |   40 | AUTHED-INTERNALLY | unifiedGetUser                        |
| `getOnboardingRedirect`    |   87 | AUTHED-INTERNALLY | getOnboardingStatus -> unifiedGetUser |
| `selectPlan`               |  121 | AUTHED-INTERNALLY | unifiedGetUser                        |
| `createOnboardingCheckout` |  192 | AUTHED-INTERNALLY | unifiedGetUser                        |
| `completePaymentStep`      |  335 | AUTHED-INTERNALLY | unifiedGetUser                        |
| `setupProfile`             |  398 | AUTHED-INTERNALLY | unifiedGetUser                        |
| `completeOnboarding`       |  528 | AUTHED-INTERNALLY | unifiedGetUser                        |
| `skipPayment`              |  606 | UNPROTECTED-FIXED | guard added: unifiedGetUser           |
| `uploadLogo`               |  613 | AUTHED-INTERNALLY | unifiedGetUser                        |

### src/lib/organization/actions.ts

| Action                         | Line | Verdict           | Evidence                                 |
| ------------------------------ | ---: | ----------------- | ---------------------------------------- |
| `getCurrentOrganization`       |  138 | AUTHED-INTERNALLY | unifiedGetUser                           |
| `updateOrganizationSettings`   |  175 | AUTHED-INTERNALLY | unifiedGetUser                           |
| `updateOrganizationBranding`   |  254 | AUTHED-INTERNALLY | unifiedGetUser                           |
| `uploadOrganizationLogo`       |  310 | AUTHED-INTERNALLY | unifiedGetUser                           |
| `removeOrganizationLogo`       |  410 | AUTHED-INTERNALLY | unifiedGetUser                           |
| `uploadOrganizationAvatar`     |  469 | AUTHED-INTERNALLY | unifiedGetUser                           |
| `removeOrganizationAvatar`     |  569 | AUTHED-INTERNALLY | unifiedGetUser                           |
| `uploadOrganizationBanner`     |  625 | AUTHED-INTERNALLY | unifiedGetUser                           |
| `removeOrganizationBanner`     |  723 | AUTHED-INTERNALLY | unifiedGetUser                           |
| `updateOrganizationBilling`    |  779 | AUTHED-INTERNALLY | unifiedGetUser                           |
| `getOrganizationMembers`       |  828 | AUTHED-INTERNALLY | unifiedGetUser                           |
| `updateMemberRole`             |  908 | AUTHED-INTERNALLY | unifiedGetUser                           |
| `updateMemberDetails`          |  982 | AUTHED-INTERNALLY | unifiedGetUser                           |
| `deactivateMember`             | 1034 | AUTHED-INTERNALLY | unifiedGetUser                           |
| `reactivateMember`             | 1086 | AUTHED-INTERNALLY | unifiedGetUser                           |
| `createInvitation`             | 1133 | AUTHED-INTERNALLY | unifiedGetUser                           |
| `getPendingInvitations`        | 1207 | AUTHED-INTERNALLY | unifiedGetUser                           |
| `revokeInvitation`             | 1246 | AUTHED-INTERNALLY | unifiedGetUser                           |
| `getOrganizationStats`         | 1283 | AUTHED-INTERNALLY | unifiedGetUser                           |
| `getAuditLogs`                 | 1347 | AUTHED-INTERNALLY | unifiedGetUser                           |
| `isOrganizationAdmin`          | 1625 | AUTHED-INTERNALLY | unifiedGetUser                           |
| `updateOrganizationSlug`       | 1644 | AUTHED-INTERNALLY | unifiedGetUser                           |
| `getOrganizationMemberFull`    | 1713 | AUTHED-INTERNALLY | unifiedGetUser                           |
| `updateMemberProfile`          | 1788 | AUTHED-INTERNALLY | unifiedGetUser                           |
| `uploadMemberAvatar`           | 1823 | AUTHED-INTERNALLY | unifiedGetUser                           |
| `uploadMemberBanner`           | 1850 | AUTHED-INTERNALLY | unifiedGetUser                           |
| `getSuggestedOrgSlug`          | 1879 | UNPROTECTED-FIXED | guard added: unifiedGetUser              |
| `createOrganizationUser`       | 1907 | AUTHED-INTERNALLY | unifiedGetUser                           |
| `getOrgIntegrationSettings`    | 1988 | AUTHED-INTERNALLY | unifiedGetUser                           |
| `updateOrgIntegrationSettings` | 2043 | AUTHED-INTERNALLY | unifiedGetUser                           |
| `getEmailBrandingConfig`       | 2101 | AUTHED-INTERNALLY | getCurrentOrganization -> unifiedGetUser |

### src/lib/organization/bulk-import-actions.ts

| Action               | Line | Verdict           | Evidence       |
| -------------------- | ---: | ----------------- | -------------- |
| `validateImportData` |   22 | AUTHED-INTERNALLY | unifiedGetUser |
| `bulkImportUsers`    |  216 | AUTHED-INTERNALLY | unifiedGetUser |

### src/lib/pro-profile/actions.ts

| Action           | Line | Verdict          | Evidence                                                       |
| ---------------- | ---: | ---------------- | -------------------------------------------------------------- |
| `submitReferral` |  215 | PUBLIC-BY-DESIGN | Public referral form scoped to a public professional.          |
| `flagReview`     |  338 | PUBLIC-BY-DESIGN | Public flag submission scoped to a public profile/review pair. |

### src/lib/pro/contact-actions.ts

| Action                | Line | Verdict          | Evidence                                                                |
| --------------------- | ---: | ---------------- | ----------------------------------------------------------------------- |
| `contactProfessional` |   59 | PUBLIC-BY-DESIGN | Public lead-capture form; schema validation and email-only side effect. |
| `contactRecipient`    |   76 | PUBLIC-BY-DESIGN | Public lead-capture form; schema validation and email-only side effect. |

### src/lib/recognition/actions.ts

| Action                    | Line | Verdict           | Evidence                              |
| ------------------------- | ---: | ----------------- | ------------------------------------- |
| `getRecognitionBadges`    |   58 | AUTHED-INTERNALLY | getUserOrganization -> unifiedGetUser |
| `initializeDefaultBadges` |   93 | AUTHED-INTERNALLY | getUserOrganization -> unifiedGetUser |
| `getRecognitions`         |  141 | AUTHED-INTERNALLY | getUserOrganization -> unifiedGetUser |
| `createRecognition`       |  267 | AUTHED-INTERNALLY | getUserOrganization -> unifiedGetUser |
| `deleteRecognition`       |  321 | AUTHED-INTERNALLY | getUserOrganization -> unifiedGetUser |
| `toggleReaction`          |  340 | AUTHED-INTERNALLY | getUserOrganization -> unifiedGetUser |
| `searchUsers`             |  715 | AUTHED-INTERNALLY | getUserOrganization -> unifiedGetUser |

### src/lib/reporting/actions.ts

| Action                        | Line | Verdict           | Evidence                        |
| ----------------------------- | ---: | ----------------- | ------------------------------- |
| `createScheduledReport`       |  233 | AUTHED-INTERNALLY | getUserContext                  |
| `updateScheduledReport`       |  293 | AUTHED-INTERNALLY | getUserContext                  |
| `deleteScheduledReport`       |  375 | AUTHED-INTERNALLY | getUserContext                  |
| `getScheduledReports`         |  404 | AUTHED-INTERNALLY | getUserContext                  |
| `createReportShare`           |  431 | AUTHED-INTERNALLY | getUserContext                  |
| `createReportShareForOrg`     |  461 | UNPROTECTED-FIXED | guard added: hasOrgReportAccess |
| `getReportShareByToken`       |  505 | PUBLIC-BY-DESIGN  | Share-token scoped report read. |
| `revokeReportShare`           |  546 | AUTHED-INTERNALLY | getUserContext                  |
| `getReportShares`             |  571 | AUTHED-INTERNALLY | getUserContext                  |
| `exportAndRecordReport`       |  598 | AUTHED-INTERNALLY | getUserContext                  |
| `exportAndRecordReportForOrg` |  624 | UNPROTECTED-FIXED | guard added: hasOrgReportAccess |
| `getReportExports`            |  737 | AUTHED-INTERNALLY | getUserContext                  |

### src/lib/reporting/engine.ts

| Action                       | Line | Verdict           | Evidence                               |
| ---------------------------- | ---: | ----------------- | -------------------------------------- |
| `getReportTemplate`          |  146 | AUTHED-INTERNALLY | getUserContext                         |
| `getReportTemplates`         |  160 | AUTHED-INTERNALLY | getUserContext                         |
| `generateReportForOrg`       |  305 | UNPROTECTED-FIXED | guard added: hasReportGenerationAccess |
| `generateReport`             |  444 | AUTHED-INTERNALLY | getUserContext                         |
| `initializeDefaultTemplates` |  468 | AUTHED-INTERNALLY | getUserContext                         |

### src/lib/reporting/export.ts

| Action              | Line | Verdict          | Evidence                                           |
| ------------------- | ---: | ---------------- | -------------------------------------------------- |
| `exportReportToCSV` |   16 | PUBLIC-BY-DESIGN | Pure serialization of caller-provided report data. |

### src/lib/requests/bulk-request-actions.ts

| Action                          | Line | Verdict           | Evidence                          |
| ------------------------------- | ---: | ----------------- | --------------------------------- |
| `bulkSendTextReviewsViaEmail`   |   85 | AUTHED-INTERNALLY | processBulkRows -> getAuthContext |
| `bulkSendVideoRequestsViaEmail` |  125 | AUTHED-INTERNALLY | processBulkRows -> getAuthContext |

### src/lib/requests/unified-requests.ts

| Action                   | Line | Verdict           | Evidence                      |
| ------------------------ | ---: | ----------------- | ----------------------------- |
| `getUnifiedRequests`     |   90 | UNPROTECTED-FIXED | guard added: getAccessContext |
| `getUnifiedRequestStats` |  386 | UNPROTECTED-FIXED | guard added: getAccessContext |

### src/lib/reviews/actions.ts

| Action             | Line | Verdict           | Evidence                                      |
| ------------------ | ---: | ----------------- | --------------------------------------------- |
| `updateReviewText` |  633 | UNPROTECTED-FIXED | guard added: requireOrgUser -> getUserContext |

### src/lib/reviews/auto-reply-actions.ts

| Action                      | Line | Verdict           | Evidence                       |
| --------------------------- | ---: | ----------------- | ------------------------------ |
| `cancelAutoReply`           |  246 | AUTHED-INTERNALLY | getUserOrgContext              |
| `enqueueReviewForAutoReply` |  375 | UNPROTECTED-FIXED | guard added: getUserOrgContext |

### src/lib/reviews/dispute-status.ts

| Action               | Line | Verdict           | Evidence       |
| -------------------- | ---: | ----------------- | -------------- |
| `getMyDisputeStatus` |   40 | AUTHED-INTERNALLY | unifiedGetUser |

### src/lib/reviews/flag-actions.ts

| Action              | Line | Verdict           | Evidence                                    |
| ------------------- | ---: | ----------------- | ------------------------------------------- |
| `reportReviewAsPro` |  373 | AUTHED-INTERNALLY | getUserContext                              |
| `routeNewFlag`      |  428 | UNPROTECTED-FIXED | removed from exported server-action surface |

### src/lib/reviews/upsell-actions.ts

| Action                   | Line | Verdict          | Evidence                                                                        |
| ------------------------ | ---: | ---------------- | ------------------------------------------------------------------------------- |
| `startReviewVideoUpsell` |   15 | PUBLIC-BY-DESIGN | Public verified-review upsell flow; checks published direct-review eligibility. |

### src/lib/salesforce/actions.ts

| Action                          | Line | Verdict           | Evidence                      |
| ------------------------------- | ---: | ----------------- | ----------------------------- |
| `handleSalesforceOAuthCallback` |   76 | UNPROTECTED-FIXED | guard added: requireAdminRole |
| `getSalesforceConnection`       |  159 | AUTHED-INTERNALLY | getUserContext                |
| `syncReviewToSalesforce`        |  328 | AUTHED-INTERNALLY | getUserContext                |
| `getSalesforceSyncLogs`         |  455 | AUTHED-INTERNALLY | getUserContext                |

### src/lib/seo/actions.ts

| Action                    | Line | Verdict          | Evidence                  |
| ------------------------- | ---: | ---------------- | ------------------------- |
| `getAllOrganizationSlugs` |  674 | PUBLIC-BY-DESIGN | Public SEO metadata read. |

### src/lib/seo/audit-actions.ts

| Action        | Line | Verdict           | Evidence       |
| ------------- | ---: | ----------------- | -------------- |
| `runSEOAudit` |   13 | AUTHED-INTERNALLY | unifiedGetUser |

### src/lib/share-studio/actions.ts

| Action                    | Line | Verdict           | Evidence                                                                               |
| ------------------------- | ---: | ----------------- | -------------------------------------------------------------------------------------- |
| `shareReviewAsSmartLink`  |  120 | AUTHED-INTERNALLY | shareReviewAsSmartLink -> ensureReviewSmartLink -> getAuthenticatedOrganizationContext |
| `listSmartLinks`          |  176 | AUTHED-INTERNALLY | getShareStudioHubActionContext -> getAccessContext                                     |
| `bulkUpdateSmartLinks`    |  195 | AUTHED-INTERNALLY | getShareStudioHubActionContext -> getAccessContext                                     |
| `getSmartLinkAnalytics`   |  221 | AUTHED-INTERNALLY | getShareStudioHubActionContext -> getAccessContext                                     |
| `listShareStudioAssets`   |  243 | AUTHED-INTERNALLY | getShareStudioHubActionContext -> getAccessContext                                     |
| `deleteShareStudioAsset`  |  265 | AUTHED-INTERNALLY | getShareStudioHubActionContext -> getAccessContext                                     |
| `queueReviewRenderJob`    |  504 | AUTHED-INTERNALLY | queueRenderJobForSource -> getAuthenticatedOrganizationContext                         |
| `queueVideoRenderJob`     |  515 | AUTHED-INTERNALLY | queueRenderJobForSource -> getAuthenticatedOrganizationContext                         |
| `getSmartLinkSettings`    |  815 | AUTHED-INTERNALLY | unifiedGetUser                                                                         |
| `updateSmartLinkSettings` |  840 | AUTHED-INTERNALLY | unifiedGetUser                                                                         |

### src/lib/social-graphics/actions.ts

| Action             | Line | Verdict           | Evidence         |
| ------------------ | ---: | ----------------- | ---------------- |
| `getAuthedContext` |   24 | AUTHED-INTERNALLY | getAuthedContext |

### src/lib/social-graphics/auto-generate.ts

| Action                   | Line | Verdict           | Evidence       |
| ------------------------ | ---: | ----------------- | -------------- |
| `autoGenerateFromReview` |   73 | AUTHED-INTERNALLY | unifiedGetUser |

### src/lib/social-graphics/batch-generate.ts

| Action                     | Line | Verdict           | Evidence       |
| -------------------------- | ---: | ----------------- | -------------- |
| `batchGenerateFromReviews` |   16 | AUTHED-INTERNALLY | unifiedGetUser |

### src/lib/social-graphics/caption-actions.ts

| Action            | Line | Verdict           | Evidence                                |
| ----------------- | ---: | ----------------- | --------------------------------------- |
| `generateCaption` |    6 | UNPROTECTED-FIXED | guard added: getAuthenticatedUserResult |

### src/lib/social-graphics/publish-actions.ts

| Action                  | Line | Verdict           | Evidence                              |
| ----------------------- | ---: | ----------------- | ------------------------------------- |
| `executeScheduledPosts` |  220 | UNPROTECTED-FIXED | guard added: requireCronSecretRequest |

### src/lib/social-graphics/schedule-actions.ts

| Action                       | Line | Verdict           | Evidence                              |
| ---------------------------- | ---: | ----------------- | ------------------------------------- |
| `setSchedule`                |   24 | AUTHED-INTERNALLY | unifiedGetUser                        |
| `removeSchedule`             |   72 | AUTHED-INTERNALLY | unifiedGetUser                        |
| `executeScheduledGeneration` |  106 | UNPROTECTED-FIXED | guard added: requireCronSecretRequest |

### src/lib/social/actions.ts

| Action                   | Line | Verdict           | Evidence       |
| ------------------------ | ---: | ----------------- | -------------- |
| `getSocialPostTemplates` |  604 | AUTHED-INTERNALLY | getUserContext |
| `generatePostPreview`    |  655 | AUTHED-INTERNALLY | getUserContext |
| `getSocialPosts`         |  985 | AUTHED-INTERNALLY | getUserContext |

### src/lib/stripe/actions.ts

| Action                      | Line | Verdict           | Evidence                                    |
| --------------------------- | ---: | ----------------- | ------------------------------------------- |
| `getOrCreateStripeCustomer` |   30 | AUTHED-INTERNALLY | unifiedGetUser                              |
| `createCheckoutSession`     |  110 | AUTHED-INTERNALLY | getOrCreateStripeCustomer -> unifiedGetUser |
| `createPortalSession`       |  181 | AUTHED-INTERNALLY | getOrCreateStripeCustomer -> unifiedGetUser |
| `cancelSubscription`        |  215 | AUTHED-INTERNALLY | unifiedGetUser                              |
| `resumeSubscription`        |  267 | AUTHED-INTERNALLY | unifiedGetUser                              |
| `updateSubscription`        |  307 | AUTHED-INTERNALLY | unifiedGetUser                              |
| `getBillingOverview`        |  396 | AUTHED-INTERNALLY | unifiedGetUser                              |
| `getPricingTiers`           |  539 | PUBLIC-BY-DESIGN  | Public pricing configuration read.          |
| `getPricingForCheckout`     |  551 | PUBLIC-BY-DESIGN  | Public pricing configuration read.          |
| `checkSubscriptionAccess`   |  593 | AUTHED-INTERNALLY | unifiedGetUser                              |

### src/lib/surveys/actions.ts

| Action               | Line | Verdict           | Evidence       |
| -------------------- | ---: | ----------------- | -------------- |
| `getSurveyTemplates` |  112 | AUTHED-INTERNALLY | unifiedGetUser |
| `getSurveyTemplate`  |  156 | AUTHED-INTERNALLY | unifiedGetUser |

### src/lib/surveys/public-actions.ts

| Action                          | Line | Verdict          | Evidence                             |
| ------------------------------- | ---: | ---------------- | ------------------------------------ |
| `getSurveyByToken`              |   28 | PUBLIC-BY-DESIGN | Survey-token scoped read.            |
| `submitSurveyResponse`          |  186 | PUBLIC-BY-DESIGN | Survey-token scoped submission.      |
| `recordSurveyGoogleReviewClick` |  415 | PUBLIC-BY-DESIGN | Survey-token scoped analytics event. |

### src/lib/tasks/actions.ts

| Action                 | Line | Verdict           | Evidence                    |
| ---------------------- | ---: | ----------------- | --------------------------- |
| `getTasks`             |   54 | AUTHED-INTERNALLY | unifiedGetUser              |
| `getPendingTaskCount`  |  106 | AUTHED-INTERNALLY | unifiedGetUser              |
| `completeTask`         |  129 | AUTHED-INTERNALLY | unifiedGetUser              |
| `dismissTask`          |  156 | AUTHED-INTERNALLY | unifiedGetUser              |
| `snoozeTask`           |  183 | AUTHED-INTERNALLY | unifiedGetUser              |
| `generateTasksForUser` |  218 | UNPROTECTED-FIXED | guard added: unifiedGetUser |

### src/lib/tasks/rules.ts

| Action                       | Line | Verdict           | Evidence                                                                             |
| ---------------------------- | ---: | ----------------- | ------------------------------------------------------------------------------------ |
| `checkUnrespondedReviews`    |   13 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `checkPendingResponseCount`  |   51 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `checkIncompleteProfile`     |   80 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `checkNoRecentRequests`      |  113 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `checkSurveyVelocityDecline` |  149 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `checkNegativeThemeSpike`    |  195 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |
| `checkRatingImprovement`     |  236 | UNPROTECTED-FIXED | converted from use-server action module to internal module (no use-server directive) |

### src/lib/users/actions.ts

| Action              | Line | Verdict           | Evidence       |
| ------------------- | ---: | ----------------- | -------------- |
| `getCurrentUser`    |   85 | AUTHED-INTERNALLY | unifiedGetUser |
| `getUser`           |  108 | AUTHED-INTERNALLY | getUserContext |
| `getUserWithBranch` |  137 | AUTHED-INTERNALLY | getUserContext |
| `updateMyProfile`   |  316 | AUTHED-INTERNALLY | unifiedGetUser |
| `updateMySettings`  |  366 | AUTHED-INTERNALLY | unifiedGetUser |
| `getDirectReports`  |  524 | AUTHED-INTERNALLY | getUserContext |

### src/lib/video-testimonials/actions.ts

| Action                                  | Line | Verdict           | Evidence                             |
| --------------------------------------- | ---: | ----------------- | ------------------------------------ |
| `getVideoTestimonialRequests`           |  593 | AUTHED-INTERNALLY | unifiedGetUser                       |
| `getVideoTestimonialRequestStats`       |  753 | AUTHED-INTERNALLY | unifiedGetUser                       |
| `getVideoTestimonialRequest`            |  835 | AUTHED-INTERNALLY | unifiedGetUser                       |
| `cancelVideoTestimonialRequest`         |  904 | AUTHED-INTERNALLY | unifiedGetUser                       |
| `resendVideoTestimonialRequest`         |  998 | AUTHED-INTERNALLY | unifiedGetUser                       |
| `getVideoTestimonialQueue`              | 1136 | AUTHED-INTERNALLY | unifiedGetUser                       |
| `getUsersForVideoRequests`              | 1239 | AUTHED-INTERNALLY | unifiedGetUser                       |
| `getVideoTestimonialResponses`          | 1350 | AUTHED-INTERNALLY | unifiedGetUser                       |
| `getVideoTestimonialResponse`           | 1601 | AUTHED-INTERNALLY | unifiedGetUser                       |
| `updateVideoApprovalStatus`             | 1711 | AUTHED-INTERNALLY | unifiedGetUser                       |
| `deleteVideoTestimonialResponse`        | 1997 | AUTHED-INTERNALLY | unifiedGetUser                       |
| `getVideoSignedUrl`                     | 2096 | AUTHED-INTERNALLY | unifiedGetUser                       |
| `updateVideoAIText`                     | 2167 | AUTHED-INTERNALLY | unifiedGetUser                       |
| `bulkUpdateVideoApprovalStatus`         | 2276 | AUTHED-INTERNALLY | unifiedGetUser                       |
| `getVideosPendingApproval`              | 2366 | AUTHED-INTERNALLY | unifiedGetUser                       |
| `getVideoTestimonialQueueStatus`        | 2564 | AUTHED-INTERNALLY | unifiedGetUser                       |
| `pauseVideoTestimonialQueue`            | 2711 | AUTHED-INTERNALLY | setQueuePauseState -> unifiedGetUser |
| `resumeVideoTestimonialQueue`           | 2719 | AUTHED-INTERNALLY | setQueuePauseState -> unifiedGetUser |
| `retryFailedVideoTestimonialQueueItems` | 2727 | AUTHED-INTERNALLY | unifiedGetUser                       |

### src/lib/video-testimonials/analytics-actions.ts

| Action                             | Line | Verdict           | Evidence       |
| ---------------------------------- | ---: | ----------------- | -------------- |
| `getVideoTestimonialFunnelMetrics` |  132 | AUTHED-INTERNALLY | unifiedGetUser |
| `getVideoTestimonialTrends`        |  306 | AUTHED-INTERNALLY | unifiedGetUser |
| `getVideoTestimonialStatsByUser`   |  494 | AUTHED-INTERNALLY | unifiedGetUser |

### src/lib/video-testimonials/approval-actions.ts

| Action                 | Line | Verdict          | Evidence                                          |
| ---------------------- | ---: | ---------------- | ------------------------------------------------- |
| `getTextApprovalData`  |   88 | PUBLIC-BY-DESIGN | Approval-token scoped video testimonial read.     |
| `submitApprovedText`   |  210 | PUBLIC-BY-DESIGN | Approval-token scoped video testimonial mutation. |
| `regenerateReviewText` |  332 | PUBLIC-BY-DESIGN | Approval-token scoped video testimonial mutation. |

### src/lib/video-testimonials/public-actions.ts

| Action                           | Line | Verdict           | Evidence                                                    |
| -------------------------------- | ---: | ----------------- | ----------------------------------------------------------- |
| `submitCustomerInfoAndConsent`   |  367 | PUBLIC-BY-DESIGN  | Video-testimonial token scoped customer consent submission. |
| `trackVideoShare`                |  640 | PUBLIC-BY-DESIGN  | Published-video scoped analytics event.                     |
| `generateShareLink`              |  670 | PUBLIC-BY-DESIGN  | Published-video scoped share link helper.                   |
| `createVideoUploadUrl`           |  713 | PUBLIC-BY-DESIGN  | Video-testimonial token scoped signed upload URL.           |
| `createVideoUploadUrls`          |  779 | PUBLIC-BY-DESIGN  | Video-testimonial token scoped signed upload URLs.          |
| `submitVideoTestimonial`         | 1197 | PUBLIC-BY-DESIGN  | Video-testimonial token scoped media submission.            |
| `processVideoTestimonialAIJob`   | 1594 | UNPROTECTED-FIXED | removed from exported server-action surface                 |
| `getPendingAIProcessingJobs`     | 1797 | UNPROTECTED-FIXED | removed from exported server-action surface                 |
| `processVideoTestimonialAIQueue` | 1871 | UNPROTECTED-FIXED | guard added: requireCronSecretRequest                       |
| `getShareKit`                    | 1955 | PUBLIC-BY-DESIGN  | Video-testimonial token scoped share kit.                   |
| `recordPassthroughClick`         | 2122 | PUBLIC-BY-DESIGN  | Video-testimonial token scoped analytics event.             |
| `submitPrivateFeedback`          | 2188 | PUBLIC-BY-DESIGN  | Video-testimonial token scoped private feedback submission. |

### src/lib/webhooks/actions.ts

| Action                     | Line | Verdict           | Evidence                        |
| -------------------------- | ---: | ----------------- | ------------------------------- |
| `requireAdminAccess`       |   85 | AUTHED-INTERNALLY | requireAdminAccess              |
| `scheduleRetryWithBackoff` |  438 | UNPROTECTED-FIXED | guard added: requireAdminAccess |

### src/lib/webhooks/milestone-actions.ts

| Action                   | Line | Verdict           | Evidence       |
| ------------------------ | ---: | ----------------- | -------------- |
| `getMilestoneMappings`   |   32 | AUTHED-INTERNALLY | unifiedGetUser |
| `updateMilestoneMapping` |   98 | AUTHED-INTERNALLY | unifiedGetUser |
| `createMilestoneMapping` |  195 | AUTHED-INTERNALLY | unifiedGetUser |
| `deleteMilestoneMapping` |  286 | AUTHED-INTERNALLY | unifiedGetUser |

### src/lib/website-analytics/actions.ts

| Action                  | Line | Verdict           | Evidence       |
| ----------------------- | ---: | ----------------- | -------------- |
| `getWebsiteAnalytics`   |   81 | AUTHED-INTERNALLY | getUserContext |
| `getWebsiteSEOOverview` |  302 | AUTHED-INTERNALLY | getUserContext |
| `getPageSEOAudit`       |  563 | AUTHED-INTERNALLY | getUserContext |
| `recordAnalytics`       |  681 | AUTHED-INTERNALLY | getUserContext |

### src/lib/website-analytics/seo-audit.ts

| Action             | Line | Verdict           | Evidence       |
| ------------------ | ---: | ----------------- | -------------- |
| `runPageSEOAudit`  |  506 | AUTHED-INTERNALLY | getUserContext |
| `runBatchSEOAudit` |  728 | AUTHED-INTERNALLY | getUserContext |

### src/lib/widgets/analytics-actions.ts

| Action                      | Line | Verdict           | Evidence                               |
| --------------------------- | ---: | ----------------- | -------------------------------------- |
| `getWidgetAnalyticsCsvData` |  729 | AUTHED-INTERNALLY | getWidgetTableData -> getAuthedContext |

### src/lib/widgets/seo-actions.ts

| Action                | Line | Verdict           | Evidence                        |
| --------------------- | ---: | ----------------- | ------------------------------- |
| `getWidgetSeoData`    |  328 | AUTHED-INTERNALLY | getOrgId                        |
| `bulkValidateWidgets` |  387 | AUTHED-INTERNALLY | getOrgId                        |
| `exportValidationCsv` |  495 | AUTHED-INTERNALLY | bulkValidateWidgets -> getOrgId |
| `exportValidationPdf` |  542 | AUTHED-INTERNALLY | bulkValidateWidgets -> getOrgId |
| `applyQuickFix`       |  610 | AUTHED-INTERNALLY | getOrgId                        |
| `getValidationAlerts` |  659 | AUTHED-INTERNALLY | getOrgId                        |
