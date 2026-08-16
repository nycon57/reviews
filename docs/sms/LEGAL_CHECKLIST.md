# SMS Legal Compliance Checklist

> **Platform:** RepWell -- Customer Experience & Review Management for Mortgage/Financial Services
> **Last Updated:** 2026-02-06
> **Status Legend:**
> - ✅ Implemented (code reference provided)
> - ⚠️ Partially Implemented (gaps noted)
> - ❌ Not Implemented
> - 📋 Requires Legal Review (manual/policy action needed)

---

## 1. Federal Requirements

### 1.1 TCPA Written Consent

| # | Requirement | Status | Priority | Code Reference / Notes |
|---|---|---|---|---|
| 1.1.1 | Prior Express Written Consent (PEWC) must be obtained before sending any marketing/review-request SMS | ✅ Implemented | P0 | `src/lib/sms/consent-service.ts` -- `ConsentService.recordConsent()` records opt-in with method, source, language, IP |
| 1.1.2 | Consent records must capture: who consented, when, how, what language was shown, IP address | ✅ Implemented | P0 | `src/lib/sms/consent-service.ts:42-135` -- `RecordConsentInput` includes `method`, `source`, `language`, `ip` |
| 1.1.3 | Consent language must clearly disclose: sender identity, message frequency, opt-out instructions, "msg & data rates may apply" | ⚠️ Partially Implemented | P0 | `src/lib/sms/compliance/actions.ts:128-154` -- `saveConsentLanguage()` stores configurable text but does NOT validate that required TCPA disclosures are present in the text. **Gap: Add server-side validation that consent language includes required elements.** |
| 1.1.4 | Consent cannot be a condition of purchase/service | 📋 Requires Legal Review | P0 | No code enforcement. **Gap: Consent collection UI/forms must include "consent is not required" language. Requires legal review of all consent touchpoints.** |
| 1.1.5 | Consent must be freely revocable at any time via any reasonable method (effective April 11, 2025) | ⚠️ Partially Implemented | P0 | `src/lib/sms/keyword-handler.ts` handles STOP/CANCEL/END/QUIT/UNSUBSCRIBE keywords. **Gap: FCC 2025 rules require honoring opt-outs via ANY reasonable method (email, voicemail, verbal) -- currently only SMS keyword opt-out is automated.** |
| 1.1.6 | Opt-out requests must be processed within 10 business days (FCC 2025 rule) | ✅ Implemented | P0 | `src/lib/sms/keyword-handler.ts:101-122` -- STOP keywords revoke consent immediately (instant, exceeds 10-day requirement) |
| 1.1.7 | Consent records must be retained for a minimum of 5 years | ✅ Implemented | P0 | `src/lib/sms/consent-service.ts:24-30` -- "Consent records are append-only... The 5-year retention policy is enforced at the database level via RLS and no DELETE permissions." |
| 1.1.8 | Double opt-in flow available | ✅ Implemented | P1 | `src/lib/sms/consent-service.ts:246-359` -- `initiateDoubleOptIn()` / `confirmDoubleOptIn()` with pending state |

### 1.2 TCPA Quiet Hours

| # | Requirement | Status | Priority | Code Reference / Notes |
|---|---|---|---|---|
| 1.2.1 | No messages before 8:00 AM or after 9:00 PM in recipient's local time | ✅ Implemented | P0 | `src/lib/sms/quiet-hours.ts` -- `QuietHoursEngine` enforces federal defaults (21:00-08:00). `src/lib/sms/timezone-lookup.ts` resolves timezone from area code |
| 1.2.2 | Quiet hours must be based on recipient's timezone, not sender's | ✅ Implemented | P0 | `src/lib/sms/quiet-hours.ts:80-82` -- `useRecipientTimezone` config with `getTimezoneForPhone()` area code lookup |
| 1.2.3 | Messages blocked by quiet hours must be queued, not dropped | ✅ Implemented | P1 | `src/lib/sms/sms-service.ts:105-116` -- blocked messages queued with `scheduled_at` set to next valid window |
| 1.2.4 | State-specific quiet hours enforced when stricter than federal | ✅ Implemented | P1 | `src/lib/sms/enterprise/state-quiet-hours.ts` -- `StateQuietHoursService` applies most restrictive window between federal and state rules |

### 1.3 CAN-SPAM Crossover

| # | Requirement | Status | Priority | Code Reference / Notes |
|---|---|---|---|---|
| 1.3.1 | If SMS contains commercial content, must comply with CAN-SPAM identification requirements | 📋 Requires Legal Review | P2 | No code enforcement. Review request SMS is transactional (triggered by a specific borrower interaction) but could be classified as commercial. **Requires legal opinion on whether review solicitation SMS qualifies as "commercial."** |

### 1.4 FCC 10DLC Registration

| # | Requirement | Status | Priority | Code Reference / Notes |
|---|---|---|---|---|
| 1.4.1 | Brand registration with The Campaign Registry (TCR) via Twilio | ✅ Implemented | P0 | `src/lib/sms/registration/twilio-a2p.ts:24-72` -- `submitBrandRegistration()` with EIN, company info |
| 1.4.2 | Campaign registration (use case) with sample messages, opt-in/out/help keywords | ✅ Implemented | P0 | `src/lib/sms/registration/twilio-a2p.ts:78-128` -- `submitCampaignRegistration()` with message samples, keyword sets |
| 1.4.3 | Registration status tracking and blocking unregistered sending | ⚠️ Partially Implemented | P0 | `src/lib/sms/registration/twilio-a2p.ts:133-215` -- `checkRegistrationStatus()` tracks brand/campaign approval. `src/lib/sms/compliance/actions.ts:309` checks `registration_status`. **Gap: `sms-service.ts` send pipeline does NOT gate on `registration_status === "fully_registered"` -- unregistered orgs can still attempt sends (carriers will block, but app should prevent).** |
| 1.4.4 | Use case must be "CUSTOMER_CARE" or appropriate category | ✅ Implemented | P1 | `src/lib/sms/registration/twilio-a2p.ts:98` -- hardcoded `UseCase: "CUSTOMER_CARE"` |

### 1.5 ISV / CSP (Communications Service Provider) Obligations

> **Critical context:** RepWell is an ISV (Independent Software Vendor) sending SMS on behalf of mortgage companies. This means RepWell must follow Twilio's ISV registration workflow, NOT the direct brand workflow. The current code uses the direct brand registration API, which is incorrect for an ISV.

| # | Requirement | Status | Priority | Code Reference / Notes |
|---|---|---|---|---|
| 1.5.1 | RepWell must register a Primary Customer Profile as "ISV Reseller or Partner" in Twilio TrustHub | ❌ Not Implemented | P0 | Current code (`src/lib/sms/registration/twilio-a2p.ts`) uses direct brand registration APIs (`/a2p/BrandRegistrations`). **ISVs must instead use TrustHub API to create a Primary Business Profile with `business_type: "isv_reseller_or_partner"` and achieve "Twilio Approved" status before onboarding any customers.** |
| 1.5.2 | Each customer org must have a Secondary Customer Profile via TrustHub API | ❌ Not Implemented | P0 | No Secondary Customer Profile creation. **ISVs must create a Secondary Customer Profile (policy SID `RNdfbf3fae0e1107f8aded0e7cead80bf5`) for each customer org with their own business details (name, EIN, address), NOT RepWell's details.** |
| 1.5.3 | Secondary profiles must include: business info EndUser, authorized representative EndUser, messaging profile EndUser, supporting documents | ❌ Not Implemented | P0 | **Gap: The current `BrandRegistrationInput` schema collects some of this data, but it submits directly to Brand Registration API instead of the TrustHub Secondary Customer Profile workflow. Needs full refactor to use TrustHub API.** |
| 1.5.4 | Brand registration must be created under customer's Secondary Customer Profile, not under ISV profile | ❌ Not Implemented | P0 | `src/lib/sms/registration/twilio-a2p.ts:51` submits brand registration without linking to a TrustProduct/Secondary Customer Profile. **Must create TrustProduct -> attach SecondaryCustomerProfile -> submit for TCR evaluation -> then create BrandRegistration.** |
| 1.5.5 | Status change notifications should go to ISV email, not customer email | ❌ Not Implemented | P1 | Per Twilio docs: "The email parameter... should not be your customer's email address." **ISV must receive status change notifications to manage registration lifecycle.** |
| 1.5.6 | ISV must use compatible Twilio account architecture (#1, #2, or #4) | 📋 Requires Legal Review | P0 | **Twilio states architectures #3, #5, #6 are "incompatible with A2P 10DLC." Must verify RepWell's Twilio account structure. Architecture #1 (customer subaccounts) is recommended.** |
| 1.5.7 | ISV retains compliance responsibility for all customer messaging | 📋 Requires Legal Review | P0 | **RepWell is responsible for ensuring all customer orgs comply with TCPA, 10DLC, and special use case requirements. Requires: (1) customer compliance agreement, (2) platform-level enforcement of compliance rules, (3) ability to suspend non-compliant customers.** |
| 1.5.8 | Customer website URL must be provided for brand registration (customer's URL, not ISV's) | ⚠️ Partially Implemented | P1 | `src/lib/sms/registration/twilio-a2p.ts:45` includes `websiteUrl` field. **Must ensure this is validated as the customer's website, not RepWell's.** |

---

## 2. State-Specific Requirements

### 2.1 State Quiet Hours Overrides

| # | Requirement | Status | Priority | Code Reference / Notes |
|---|---|---|---|---|
| 2.1.1 | Connecticut: No messages before 9:00 AM or after 8:00 PM | ⚠️ Partially Implemented | P1 | `src/lib/sms/enterprise/state-quiet-hours.ts` -- loads rules from `sms_state_quiet_hours` DB table. **Requires verification that CT rule (start=20:00, end=09:00) is seeded in the database.** |
| 2.1.2 | Oklahoma: No messages before 8:00 AM or after 8:00 PM; max 3 messages per 24h on same subject | ⚠️ Partially Implemented | P1 | Quiet hours rule (start=20:00, end=08:00) supported by state override system. **Gap: 3-message-per-24h-per-subject limit is NOT enforced. Rate limiter (`src/lib/sms/rate-limiter.ts`) limits per-number but not per-subject.** |
| 2.1.3 | Washington: No messages before 8:00 AM or after 8:00 PM | ⚠️ Partially Implemented | P1 | Same as OK -- quiet hours rule supported. **Requires verification that WA rule is seeded in the database.** |
| 2.1.4 | Florida: No messages before 8:00 AM or after 8:00 PM; max 3 messages per 24h on same topic | ⚠️ Partially Implemented | P1 | Quiet hours supported via state override system. **Gap: 3-message-per-24h limit NOT enforced (same as OK).** |
| 2.1.5 | Connecticut: Single unsolicited text = $20,000 penalty | 📋 Requires Legal Review | P0 | No code-level mitigation beyond consent check. **Requires extra caution with CT recipients -- consider requiring double opt-in for CT numbers.** |

### 2.2 State Consent Variations

| # | Requirement | Status | Priority | Code Reference / Notes |
|---|---|---|---|---|
| 2.2.1 | California (CCPA): Consumers can request deletion of data; must stop texts within 15 days of opt-out | ⚠️ Partially Implemented | P1 | Opt-out is immediate (exceeds 15-day requirement). **Gap: CCPA data deletion requests cannot delete consent records (5-year retention). Requires legal guidance on reconciling CCPA deletion rights with TCPA retention requirements.** |
| 2.2.2 | Florida: Express written consent required; detailed consent records must be maintained | ✅ Implemented | P1 | Consent records include method, language, source, IP, timestamps |
| 2.2.3 | New York: Prior express written consent required; DNC registry applies to texts | ⚠️ Partially Implemented | P1 | Consent tracking implemented. **Gap: No integration with NY State DNC registry.** |
| 2.2.4 | Texas: SMS marketing laws expanded September 2025; requires business registration and bonding | 📋 Requires Legal Review | P1 | **Requires legal review of TX Business and Commerce Code text messaging provisions (effective Sept 1, 2025). May require TX-specific registration.** |

### 2.3 RESPA Section 8

| # | Requirement | Status | Priority | Code Reference / Notes |
|---|---|---|---|---|
| 2.3.1 | No quid pro quo incentive language in review solicitation SMS (e.g., "leave a review and receive...") | ❌ Not Implemented | P0 | No template content validation to prevent RESPA-violating language. **Gap: SMS templates (`sms_templates` table) have no content policy filter. A loan officer could create a template offering incentives for reviews, violating RESPA Section 8(a).** |
| 2.3.2 | Review solicitation must not be conditioned on or linked to a referral of settlement services | 📋 Requires Legal Review | P0 | No code enforcement. **Requires: (1) legal-approved template library with pre-vetted language, (2) policy prohibiting custom templates that tie reviews to referrals.** |
| 2.3.3 | No value exchange for reviews (gift cards, discounts, fee reductions) | 📋 Requires Legal Review | P1 | **Requires: Terms of Service prohibition on incentivized reviews. Admin training materials.** |

---

## 3. Mortgage/Financial Industry Requirements

### 3.1 ECOA / Fair Lending

| # | Requirement | Status | Priority | Code Reference / Notes |
|---|---|---|---|---|
| 3.1.1 | SMS review requests must be distributed uniformly across all borrowers regardless of race, ethnicity, age, sex, etc. | ❌ Not Implemented | P0 | No fairness monitoring in the send pipeline. **Gap: If loan officers selectively choose which borrowers receive review requests, this creates fair lending risk. Requires: (1) audit logging of send patterns by demographic proxy, (2) admin dashboard showing distribution analysis, or (3) automated review requests triggered by CRM events for ALL closed loans.** |
| 3.1.2 | No disparate treatment in SMS messaging frequency or content | 📋 Requires Legal Review | P1 | **Requires policy and training that all borrowers receive the same messaging. Consider automated CRM-triggered sends to ensure uniform distribution.** |

### 3.2 GLB Act (Gramm-Leach-Bliley) -- NPI Protection

| # | Requirement | Status | Priority | Code Reference / Notes |
|---|---|---|---|---|
| 3.2.1 | Phone numbers are Nonpublic Personal Information (NPI) -- must be protected in transit and at rest | ⚠️ Partially Implemented | P0 | Phone numbers stored in plaintext in `sms_consent`, `sms_messages` tables. Twilio auth tokens are encrypted (`src/lib/sms/twilio-client.ts:54-68` using `decrypt_sms_token` RPC). **Gap: Phone numbers themselves are NOT encrypted at rest. Supabase provides encryption-at-rest for the underlying database, but column-level encryption is not applied.** |
| 3.2.2 | Phone masking for logs and exports | ✅ Implemented | P1 | `src/lib/sms/phone-utils.ts:41-45` -- `maskPhone()` masks last 2 digits. `src/lib/sms/compliance/actions.ts:373-375` -- `maskPhoneForExport()` masks all but last 4 for CSV exports |
| 3.2.3 | Access controls -- only authorized personnel can view NPI | ✅ Implemented | P1 | `src/lib/sms/settings/actions.ts:23-33` and `src/lib/sms/compliance/actions.ts:26-36` -- Admin/Manager role checks on all SMS settings and compliance endpoints |
| 3.2.4 | Privacy notice must disclose SMS data collection and sharing with Twilio | 📋 Requires Legal Review | P0 | **Requires Privacy Policy update to disclose: (1) phone number collection for SMS, (2) sharing with Twilio as processor, (3) retention periods, (4) data subject rights.** |

### 3.3 NMLS Disclosure

| # | Requirement | Status | Priority | Code Reference / Notes |
|---|---|---|---|---|
| 3.3.1 | NMLS# must be included in SMS messages where required by state law | ❌ Not Implemented | P1 | NMLS badges are implemented for web widgets (`src/embed/components/nmls-badge.ts`) but NOT for SMS message body. **Gap: SMS templates do not include NMLS# merge field. Some states (e.g., CA, TX) require NMLS identification in all advertising, which may include SMS.** |
| 3.3.2 | Company NMLS# displayed in marketing materials | ⚠️ Partially Implemented | P1 | Web widgets include NMLS (`src/embed/components/compliance-footer.ts`). **Gap: SMS channel lacks NMLS merge field support.** |

### 3.4 UDAAP (Unfair, Deceptive, or Abusive Acts or Practices)

| # | Requirement | Status | Priority | Code Reference / Notes |
|---|---|---|---|---|
| 3.4.1 | SMS content must not be deceptive or misleading | 📋 Requires Legal Review | P1 | No automated content filtering. **Requires: (1) legal-approved template library, (2) admin review process for custom templates, (3) training on UDAAP-compliant messaging.** |
| 3.4.2 | SMS must clearly identify the sender | ⚠️ Partially Implemented | P1 | Templates support `{{org_name}}` merge field. **Gap: Not enforced that sender identity appears in every message.** |
| 3.4.3 | No abusive timing or frequency of messages | ✅ Implemented | P1 | Rate limiter (`src/lib/sms/rate-limiter.ts`) enforces per-number (1/hour) and org-level (200/min) limits |

---

## 4. Platform Requirements

### 4.1 Terms of Service

| # | Requirement | Status | Priority | Code Reference / Notes |
|---|---|---|---|---|
| 4.1.1 | TOS must disclose SMS messaging capabilities and consent requirements | 📋 Requires Legal Review | P0 | **Requires legal counsel to draft/update TOS with SMS-specific sections covering: consent collection, message types, opt-out rights, data retention.** |
| 4.1.2 | TOS must prohibit incentivized reviews (RESPA compliance) | 📋 Requires Legal Review | P0 | **Requires TOS clause explicitly prohibiting customers from using SMS to offer incentives for reviews.** |

### 4.2 Privacy Policy

| # | Requirement | Status | Priority | Code Reference / Notes |
|---|---|---|---|---|
| 4.2.1 | Privacy Policy must disclose phone number collection and use for SMS | 📋 Requires Legal Review | P0 | **Requires Privacy Policy update.** |
| 4.2.2 | Must disclose third-party processor (Twilio) involvement | 📋 Requires Legal Review | P0 | **Requires Privacy Policy update naming Twilio as sub-processor.** |
| 4.2.3 | Must describe data retention periods (5-year consent, message logs) | 📋 Requires Legal Review | P1 | **Requires Privacy Policy update with specific retention schedules.** |

### 4.3 Consent Language

| # | Requirement | Status | Priority | Code Reference / Notes |
|---|---|---|---|---|
| 4.3.1 | Customer-facing consent language reviewed by legal counsel | ⚠️ Partially Implemented | P0 | `src/lib/sms/types.ts:111` -- `consent_language_text` field exists in `sms_settings`. Configurable via `saveConsentLanguage()`. **Gap: No default TCPA-compliant consent language is provided out of the box. Orgs must write their own.** |
| 4.3.2 | Consent language must include: sender name, message types, frequency, "msg & data rates may apply", opt-out instructions | 📋 Requires Legal Review | P0 | **Requires legal-approved default consent language template. Example: "By providing your phone number, you consent to receive review request text messages from [Company Name] at NMLS# [number]. Message frequency varies. Msg & data rates may apply. Reply STOP to opt out. Consent is not a condition of service."** |

### 4.4 Opt-Out Confirmation Language

| # | Requirement | Status | Priority | Code Reference / Notes |
|---|---|---|---|---|
| 4.4.1 | STOP response must confirm unsubscription | ✅ Implemented | P1 | `src/lib/sms/keyword-handler.ts:21-22` -- Default: "You have been unsubscribed and will no longer receive messages. Reply START to resubscribe." |
| 4.4.2 | HELP response must provide support contact info | ✅ Implemented | P1 | `src/lib/sms/keyword-handler.ts:25-26` -- Default: "Reply STOP to unsubscribe or START to resubscribe. For support, contact your loan officer directly." |
| 4.4.3 | Opt-out confirmation language reviewed by legal counsel | 📋 Requires Legal Review | P1 | Configurable via `saveOptOutSettings()`. **Requires legal review of default STOP/HELP response text.** |

### 4.5 Data Retention Policy

| # | Requirement | Status | Priority | Code Reference / Notes |
|---|---|---|---|---|
| 4.5.1 | Consent records retained for minimum 5 years | ✅ Implemented | P0 | `src/lib/sms/consent-service.ts:29` -- Append-only, no DELETE permissions, DB-level enforcement |
| 4.5.2 | Audit log entries retained with immutable append-only policy | ✅ Implemented | P1 | `src/lib/sms/audit/audit-logger.ts:52-57` -- "no UPDATE or DELETE permissions... retained for a minimum of 5 years, with automated archival to cold storage after 2 years" |
| 4.5.3 | Message logs retained for compliance and dispute resolution | ✅ Implemented | P1 | `sms_messages` table persists all sent/received messages with Twilio SIDs for cross-reference |
| 4.5.4 | Formal data retention policy document | 📋 Requires Legal Review | P1 | **Requires written data retention policy documenting: what is retained, for how long, archival process, destruction procedures.** |

### 4.6 Incident Response

| # | Requirement | Status | Priority | Code Reference / Notes |
|---|---|---|---|---|
| 4.6.1 | Incident response plan for SMS data breaches | ❌ Not Implemented | P1 | **Requires: (1) documented incident response plan, (2) breach notification procedures per state laws, (3) designated incident response team, (4) Twilio incident monitoring.** |
| 4.6.2 | Breach notification procedures (state-specific timelines) | ❌ Not Implemented | P1 | **Requires legal counsel to document notification obligations per state (e.g., CA requires 72-hour notice).** |

### 4.7 Twilio Data Processing Agreement

| # | Requirement | Status | Priority | Code Reference / Notes |
|---|---|---|---|---|
| 4.7.1 | Twilio DPA executed covering phone numbers and message content | 📋 Requires Legal Review | P0 | **Requires: Executed Data Processing Agreement with Twilio. Twilio provides a standard DPA at twilio.com/legal/data-protection-addendum -- must be signed.** |
| 4.7.2 | Twilio sub-processor list reviewed | 📋 Requires Legal Review | P2 | **Twilio publishes a sub-processor list. Should be reviewed and monitored for changes.** |

---

## 5. Security Controls

### 5.1 Credential Management

| # | Requirement | Status | Priority | Code Reference / Notes |
|---|---|---|---|---|
| 5.1.1 | Twilio auth tokens encrypted at rest | ✅ Implemented | P0 | `src/lib/sms/twilio-client.ts:54-68` -- `twilio_auth_token_encrypted` column, decrypted via `decrypt_sms_token` DB RPC with `SMS_ENCRYPTION_KEY` |
| 5.1.2 | Encryption key stored in environment variables, not code | ✅ Implemented | P0 | `src/lib/sms/constants.ts:77` -- `ENV_SMS_ENCRYPTION_KEY = "SMS_ENCRYPTION_KEY"` |
| 5.1.3 | Webhook signature validation | ✅ Implemented | P0 | `src/lib/sms/webhook-validation.ts:11-25` -- `validateTwilioSignature()` using Twilio SDK `validateRequest()` |

### 5.2 Access Controls

| # | Requirement | Status | Priority | Code Reference / Notes |
|---|---|---|---|---|
| 5.2.1 | SMS settings restricted to Admin/Manager roles | ✅ Implemented | P0 | All settings/compliance actions require `requireAdminOrManager()` auth check |
| 5.2.2 | CSV export prevents formula injection | ✅ Implemented | P1 | `src/lib/sms/compliance/actions.ts:378-385` -- `csvEscape()` prefixes formula characters with single quote |
| 5.2.3 | Audit logging of all compliance-relevant events | ✅ Implemented | P1 | `src/lib/sms/audit/audit-logger.ts` -- 15 event types logged including consent, sends, opt-outs, settings changes |

---

## 6. Summary & Priority Matrix

### P0 -- Launch Blockers (Must resolve before SMS goes live)

| # | Item | Status |
|---|---|---|
| 1 | **ISV/CSP registration**: Refactor 10DLC registration from direct brand API to TrustHub ISV workflow (Primary Profile + Secondary Customer Profiles) | ❌ |
| 2 | **ISV/CSP account architecture**: Verify Twilio account structure is compatible (#1, #2, or #4) | 📋 |
| 3 | **ISV compliance responsibility**: Customer compliance agreement + platform enforcement + suspension capability | 📋 |
| 4 | TCPA consent language validation (required elements in consent text) | ⚠️ |
| 5 | Multi-channel opt-out support (FCC 2025 rule: any reasonable method) | ⚠️ |
| 6 | 10DLC registration gating in send pipeline | ⚠️ |
| 7 | RESPA Section 8 template content safeguards | ❌ |
| 8 | ECOA/Fair Lending: uniform review request distribution monitoring | ❌ |
| 9 | GLB Act: Privacy Policy update for SMS data / Twilio disclosure | 📋 |
| 10 | Twilio DPA execution | 📋 |
| 11 | Terms of Service update | 📋 |
| 12 | Legal-approved default consent language | 📋 |
| 13 | CT unsolicited text penalty risk ($20K/msg) mitigation | 📋 |

### P1 -- Required within 30 days of launch

| # | Item | Status |
|---|---|---|
| 1 | State quiet hours rules seeded and verified (CT, OK, WA, FL) | ⚠️ |
| 2 | OK/FL per-subject message frequency limits | ❌ |
| 3 | NMLS# merge field for SMS templates | ❌ |
| 4 | Incident response plan | ❌ |
| 5 | NY State DNC registry integration | ⚠️ |
| 6 | CCPA vs TCPA retention reconciliation | 📋 |
| 7 | TX SMS law compliance (effective Sept 2025) | 📋 |
| 8 | Data retention policy document | 📋 |
| 9 | UDAAP template review process | 📋 |

### P2 -- Required within 90 days of launch

| # | Item | Status |
|---|---|---|
| 1 | CAN-SPAM crossover analysis for review request SMS | 📋 |
| 2 | Twilio sub-processor list review | 📋 |
| 3 | State DNC registry integrations (beyond NY) | ❌ |

---

## 7. Appendix: Code File Reference Map

| File | Purpose |
|---|---|
| `src/lib/sms/consent-service.ts` | TCPA consent lifecycle (opt-in, opt-out, double opt-in, history, reporting) |
| `src/lib/sms/quiet-hours.ts` | TCPA quiet hours enforcement engine |
| `src/lib/sms/enterprise/state-quiet-hours.ts` | State-specific quiet hours overrides |
| `src/lib/sms/keyword-handler.ts` | STOP/START/HELP/YES keyword processing |
| `src/lib/sms/sms-service.ts` | Full send pipeline (consent -> quiet hours -> rate limit -> send -> audit) |
| `src/lib/sms/registration/twilio-a2p.ts` | 10DLC brand and campaign registration |
| `src/lib/sms/audit/audit-logger.ts` | Immutable compliance audit log |
| `src/lib/sms/rate-limiter.ts` | Per-number and org-level rate limiting |
| `src/lib/sms/webhook-validation.ts` | Twilio webhook signature verification |
| `src/lib/sms/twilio-client.ts` | Credential management with encrypted token storage |
| `src/lib/sms/phone-utils.ts` | Phone number normalization, masking, area code extraction |
| `src/lib/sms/timezone-lookup.ts` | Area code to IANA timezone mapping |
| `src/lib/sms/compliance/actions.ts` | Compliance settings and reporting server actions |
| `src/lib/sms/compliance/schemas.ts` | Zod validation schemas for compliance settings |
| `src/lib/sms/settings/actions.ts` | Twilio credential and phone number management |
| `src/lib/sms/send/actions.ts` | SMS send readiness checks and inline consent recording |
| `src/lib/sms/types.ts` | TypeScript types mirroring database schema |
| `src/embed/components/nmls-badge.ts` | NMLS badge for web widgets (not SMS) |
| `src/embed/components/compliance-footer.ts` | Equal Housing Lender / disclaimer for web widgets |

### External References

| Resource | URL |
|---|---|
| Twilio ISV A2P 10DLC Onboarding Overview | https://www.twilio.com/docs/messaging/compliance/a2p-10dlc/onboarding-isv |
| Twilio ISV API Registration Guide (Standard/Low-Volume) | https://www.twilio.com/docs/messaging/compliance/a2p-10dlc/onboarding-isv-api |
| Twilio 10DLC Business Info Requirements | https://www.twilio.com/docs/messaging/compliance/a2p-10dlc/collect-business-info |
| FCC TCPA Opt-Out Rules (April 2025) | https://www.bclplaw.com/en-US/events-insights-news/the-tcpas-new-opt-out-rules-take-effect-on-april-11-2025-what-does-this-mean-for-businesses.html |
| RESPA Section 8 Key Considerations | https://www.forvismazars.us/forsights/2025/01/respa-section-8-key-considerations-best-practices |
| State SMS Marketing Laws (2025) | https://sakari.io/blog/sms-marketing-laws-by-state-a-2025-compliance-guide |
| SMS Compliance for Mortgage (ICE) | https://mortgagetech.ice.com/blog/7-sms-best-practices-for-tcpa-compliance |
