# SMS System Security & Compliance Audit Report

**Date:** 2026-02-06
**Auditor:** Code Auditor Agent
**Scope:** All SMS-related source code, webhook routes, cron jobs, database migrations, and settings UI

---

## Executive Summary

The SMS system is well-architected with strong fundamentals: Twilio signature verification on all webhook routes, encrypted credential storage via pgcrypto, persistent database-backed rate limiting, and comprehensive audit logging. However, the audit identified **1 critical**, **2 high**, **4 medium**, and **3 low** severity findings that should be addressed before the system handles production traffic at scale.

The most urgent issue is an authentication bypass in the `check-sms-registration` cron route that could allow unauthorized access if `CRON_SECRET` is not configured. The two high-severity findings relate to TCPA consent record deletion protection and the absence of an encryption key rotation strategy.

---

## Findings

### CRITICAL

#### C1: Cron Auth Bypass via `Bearer undefined` in check-sms-registration

- **Severity:** CRITICAL
- **File:** `src/app/api/cron/check-sms-registration/route.ts:10-18`
- **Description:** The `check-sms-registration` cron route uses an inline `verifyCronSecret` function that differs from the shared utility at `src/lib/cron/verify-secret.ts`. When `CRON_SECRET` is not set in production, the inline version evaluates `authHeader === \`Bearer ${cronSecret}\`` where `cronSecret` is `undefined`, producing the comparison `authHeader === "Bearer undefined"`. An attacker who sends the header `Authorization: Bearer undefined` would pass this check, gaining unauthorized access to trigger registration status checks and view organization IDs in the response.
- **Comparison:** The shared `verifyCronSecret` at `src/lib/cron/verify-secret.ts:7-14` correctly handles this case by returning `false` when no secret is configured in non-development environments.
- **Recommended Fix:** Replace the inline function with the shared `verifyCronSecret` import from `@/lib/cron/verify-secret`, which is already used by the other three SMS cron routes. Delete lines 10-18 and add `import { verifyCronSecret } from "@/lib/cron/verify-secret";`.

---

### HIGH

#### H1: Consent Records Lack DELETE Protection (TCPA 5-Year Retention Risk)

- **Severity:** HIGH
- **File:** `supabase/migrations/20260131000001_sms_channel_schema.sql:125-138`
- **Description:** The `sms_consent` table's RLS policies grant `FOR ALL` access to admins and managers, which includes `DELETE` operations. Unlike `sms_audit_log` which has explicit `REVOKE UPDATE, DELETE ON sms_audit_log FROM authenticated` (in `20260201000003_sms_enterprise_features.sql:157`), the consent table has no such protection. Under TCPA, consent records must be retained for a minimum of 5 years as proof of opt-in. An admin could accidentally or intentionally delete consent records via direct Supabase client access.
- **Recommended Fix:** Add a migration with:
  ```sql
  REVOKE DELETE ON sms_consent FROM authenticated;
  ```
  And replace the `FOR ALL` admin policy with separate `SELECT`, `INSERT`, `UPDATE` policies (no `DELETE`).

#### H2: No Encryption Key Rotation Strategy

- **Severity:** HIGH
- **File:** `src/lib/sms/twilio-client.ts:55-68`, `supabase/migrations/20260131000001_sms_channel_schema.sql:599-614`
- **Description:** Twilio auth tokens are encrypted with `pgp_sym_encrypt` using a single `SMS_ENCRYPTION_KEY`. There is no key versioning, no re-encryption tooling, and no documented rotation procedure. If the encryption key is compromised, all org-level Twilio credentials are exposed with no ability to transparently rotate to a new key. The `decrypt_sms_token` function has no concept of key versions.
- **Recommended Fix:** Add a `key_version` column to `sms_settings`, implement a key rotation RPC that re-encrypts all tokens with the new key, and support decrypting with both old and new keys during the rotation window.

---

### MEDIUM

#### M1: Encryption Key Transmitted to Database on Every Credential Resolution

- **Severity:** MEDIUM
- **File:** `src/lib/sms/twilio-client.ts:61-64`
- **Description:** The encryption key is passed as a parameter to the `decrypt_sms_token` RPC on every call to `resolveCredentials()`. This means the raw encryption key traverses the network between the application server and the Supabase database. If database query logging is enabled (common in development/staging), the encryption key would appear in plaintext in query logs. Even in production, this increases the attack surface.
- **Recommended Fix:** Consider storing the encryption key as a Supabase Vault secret and referencing it within the database function, eliminating the need to pass it from the application layer.

#### M2: Rate Limiter Fails Open on Database Errors

- **Severity:** MEDIUM
- **File:** `src/lib/sms/rate-limiter.ts:37-41` and `src/lib/sms/rate-limiter.ts:73-76`
- **Description:** Both `checkPerNumberRateLimit` and `checkOrgRateLimit` return `{ allowed: true }` when the database query fails. During a database outage or connectivity issue, all rate limiting would be bypassed, potentially allowing message floods that could violate carrier rate limits or incur unexpected costs.
- **Recommended Fix:** Fail closed instead of open. Return `{ allowed: false, reason: "Rate limit check unavailable" }` when the database query fails. Alternatively, implement a secondary in-memory rate limiter as a fallback.

#### M3: Inbound Webhook Does Not Validate Phone Numbers via toE164

- **Severity:** MEDIUM
- **File:** `src/app/api/webhooks/twilio/inbound/route.ts:44-46`
- **Description:** The `from` and `to` phone numbers from the Twilio webhook payload (`params.From`, `params.To`) are used directly without normalization through `toE164()`. While Twilio typically sends E.164 format, this relies on an external system's behavior. The phone numbers are inserted directly into `sms_messages` (line 131-138) and used for conversation upsert (line 101) without format validation.
- **Recommended Fix:** Pass `from` through `toE164()` before using it for database operations and consent lookups in the inbound webhook handler.

#### M4: A2P Registration Error Messages May Leak Twilio Internal Details

- **Severity:** MEDIUM
- **File:** `src/lib/sms/registration/twilio-a2p.ts:62-63` and `src/lib/sms/registration/twilio-a2p.ts:117-118`
- **Description:** Error responses from Twilio's registration API are re-thrown with the original error message/detail from the Twilio response body (`errorData?.message || errorData?.detail`). These messages could contain internal Twilio error details that may be surfaced to end users through the UI.
- **Recommended Fix:** Log the full Twilio error details server-side and throw a generic user-facing error message like "Brand registration failed. Please try again or contact support."

---

### LOW

#### L1: Twilio Client Cache Has No Size Limit or TTL

- **Severity:** LOW
- **File:** `src/lib/sms/twilio-client.ts:24-34`
- **Description:** The `clientCache` Map grows unboundedly with no eviction policy. In a long-running server process, this could accumulate stale Twilio clients for organizations that have rotated credentials. In Vercel's serverless environment this is mitigated by short instance lifetimes, but could be an issue in other deployment targets.
- **Recommended Fix:** Add a TTL-based eviction (e.g., clear entries after 1 hour) or limit the cache to a reasonable size (e.g., LRU with max 100 entries).

#### L2: No Explicit CSRF Tokens on SMS Settings Forms

- **Severity:** LOW
- **File:** `src/components/settings/sms/sms-tab.tsx`
- **Description:** The SMS settings UI components use standard React form submissions. While Next.js server actions provide implicit CSRF protection by checking the Origin header, there are no explicit CSRF tokens. This is acceptable for most threat models since the forms are behind authentication.
- **Recommended Fix:** Consider adding explicit CSRF tokens if the threat model requires defense against same-origin attacks or if server actions are replaced with custom API routes.

#### L3: check-sms-registration Response Exposes Organization IDs

- **Severity:** LOW
- **File:** `src/app/api/cron/check-sms-registration/route.ts:91-96`
- **Description:** The JSON response includes `organizationId` values for all checked registrations. While UUIDs are not inherently sensitive, exposing internal identifiers in API responses (especially one that is vulnerable to C1) increases the information available to an attacker.
- **Recommended Fix:** After fixing C1, consider reducing the response to only include counts (`checked`, `updated`) without individual organization details, or move detailed results to structured logging.

---

## Summary Table

| ID | Severity | Category | File |
|----|----------|----------|------|
| C1 | CRITICAL | Auth Bypass | `src/app/api/cron/check-sms-registration/route.ts:10-18` |
| H1 | HIGH | TCPA Compliance | `supabase/migrations/20260131000001_sms_channel_schema.sql:125-138` |
| H2 | HIGH | Credential Security | `src/lib/sms/twilio-client.ts:55-68` |
| M1 | MEDIUM | Credential Security | `src/lib/sms/twilio-client.ts:61-64` |
| M2 | MEDIUM | Availability | `src/lib/sms/rate-limiter.ts:37-41` |
| M3 | MEDIUM | Input Validation | `src/app/api/webhooks/twilio/inbound/route.ts:44-46` |
| M4 | MEDIUM | Info Leakage | `src/lib/sms/registration/twilio-a2p.ts:62-63` |
| L1 | LOW | Resource Management | `src/lib/sms/twilio-client.ts:24-34` |
| L2 | LOW | CSRF | `src/components/settings/sms/sms-tab.tsx` |
| L3 | LOW | Info Leakage | `src/app/api/cron/check-sms-registration/route.ts:91-96` |

## Positive Findings (No Issues)

| Check | Status | Notes |
|-------|--------|-------|
| Webhook signature validation | PASS | Both `/status` and `/inbound` enforce Twilio signature verification and return 403 on failure |
| Encrypted credentials | PASS | pgcrypto `pgp_sym_encrypt/decrypt` used for Twilio auth tokens |
| Rate limiter persistence | PASS | Uses `sms_messages` table (database-backed), survives deploys |
| Cron auth (shared utility) | PASS | 3 of 4 SMS cron routes use correctly-implemented `verifyCronSecret` |
| Phone number sanitization (outbound) | PASS | `toE164()` enforced in `SmsService` for all outbound sends |
| PII in logs | PASS | Phone numbers masked via `maskPhone()` in error messages; structured logs use message IDs, not phone numbers |
| SQL injection | PASS | All DB operations use parameterized Supabase client queries; no raw SQL construction |
| Error message leakage (webhooks) | PASS | Generic error messages returned to external callers |
| Audit log immutability | PASS | `REVOKE UPDATE, DELETE` enforced on `sms_audit_log` table |

## Overall Risk Assessment

**Risk Level: MODERATE**

The system has a solid security foundation with proper webhook validation, encrypted credential storage, and comprehensive audit logging. The critical finding (C1) should be treated as a P0 fix since it is trivial to exploit and trivial to fix (single import change). The high-severity consent record deletion gap (H1) is a compliance risk that should be addressed before go-live. The encryption key rotation gap (H2) is a longer-term concern that should be planned into the roadmap.

**Recommended priority:**
1. **Immediate (P0):** Fix C1 (cron auth bypass) -- 5-minute fix
2. **Before launch (P1):** Fix H1 (consent DELETE protection) -- 1 migration
3. **Before launch (P1):** Fix M2 (rate limiter fail-open) -- change 2 return statements
4. **Before launch (P1):** Fix M3 (inbound phone validation) -- add toE164 calls
5. **Short-term (P2):** Fix M1, M4, H2 -- credential security improvements
6. **Backlog (P3):** Fix L1, L2, L3 -- minor improvements
