# 0004. Contact is the first-class acquisition identity

Date: 2026-07-07

## Status

Accepted

## Context

"A person we asked for feedback" existed as six unrelated shapes with no shared
identity: `surveys` rows (inline name/email/phone), `video_testimonial_requests`,
`salesforce_contact_mappings`, `profile_referrals`, `reviews` with
`source='direct'`, and `survey_responses`. There was no cross-table
deduplication or suppression: the same customer could receive a survey, a video
request, and a Salesforce-triggered survey simultaneously, and unsubscribing
from one path touched none of the others. A table named `contacts` previously
existed but was renamed `employees` (2026-03) and now serves Employee
Experience surveys — the original Workstream C plan (tasks/todo.md C3) had
called for EX surveys to share the contacts table.

## Decision

Introduce `contacts` as a first-class table: the canonical record of an
external person a professional asks for feedback.

- **Separate from Employee — C3 is overruled.** Employees (EX surveys,
  recognition) and Contacts (acquisition) have opposite consent, anonymity,
  and suppression semantics; they stay distinct concepts and tables. The new
  `contacts` table is unrelated to the one renamed `employees`.
- **Org-scoped with a single reassignable Owner.** Contacts belong to the
  organization (an individual professional's scope is their individual
  organization); each has one owning professional. Admins/managers see all org
  Contacts; professionals see their own.
- **Email identity, phone-ready.** Unique per org on normalized email (required
  for now); phone stored E.164 with per-org uniqueness, and the schema permits
  email to become nullable so phone-only Contacts are non-breaking when SMS
  returns (ADR 0005).
- **Org-level, channel-scoped Suppression with reasons** (unsubscribed /
  do-not-contact / bounced-complained), enforced by a single send-time check.
  An unsubscribe suppresses acquisition sends from the entire org on that
  channel, not just the requesting professional.
- **Backfill + link + send-time snapshots.** A one-time backfill creates
  Contacts from all six stores (owner = professional on the most recent
  request); request rows gain `contact_id` but keep inline name/email as the
  immutable send-time snapshot; `email_unsubscribes` folds into Suppression;
  all new writes require `contact_id`.

## Considered options

- **Suppression overlay only** (shared suppression table keyed on org+email, no
  identity consolidation) — rejected: fixes compliance but leaves sequences,
  funnel, and dedup unbuildable.
- **Unify with employees** (one people table with a role discriminator, per the
  original C3) — rejected: opposite privacy semantics; a bug that enrolls
  employee PII in acquisition campaigns is an HR incident.
- **Professional-private books** — rejected: breaks enterprise oversight and
  org-level compliance.
- **Full normalization** (drop inline request columns) — rejected: rewrites
  every read path at once and loses the send-time snapshot distinction.

## Consequences

- Acquisition Sequences (Contact enrollment in the campaign engine), the
  Acquisition Funnel, and Salesforce owner-attribution all key off
  `contact_id`.
- Every send path must pass the single suppression check; adding a send path
  that skips it is a compliance bug.
- The `contacts`→`employees` rename history means migration archaeology shows
  two unrelated tables carrying the name `contacts` at different times; this
  ADR is the disambiguation record.
- Glossary terms (CONTEXT.md § Acquisition): Contact, Employee, Contact Owner,
  Contact Identity, Suppression, Send-Time Snapshot.
