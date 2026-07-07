# Context

Glossary of domain terms. Terms are added as they are resolved in design sessions.

## Video Testimonials

**Video Testimonial Request** — An invitation sent by a professional to a customer asking them to record a video. Identified by a token; carries the prompt, max duration, and expiry.

**Video Testimonial Response** — The customer's submission against a request: the video, consents, customer rating, transcript, and AI-generated review draft.

**Customer Rating** — A required 1–5 star rating the customer gives on the About-you step of the recording flow, before recording. Stored on the response. Distinct from AI sentiment, which is inferred from the transcript.

**Celebration Threshold** — The minimum customer rating (org setting, default 4) at which a response takes the High Path. Stored in `organizations.settings` alongside auto-approval rules.

**High Path** — The post-submission experience for responses at or above the celebration threshold: celebration thank-you screen with share, platform passthrough, contact card, and referral CTAs.

**Low Path** — The post-submission experience below the threshold: gracious thank-you with a private feedback box, no public-sharing CTAs. The response is quarantined, the professional is notified, and a follow-up task is created.

**Review** — The single canonical concept for customer feedback, stored in `reviews` regardless of medium. A video testimonial is a review with media attached: its rating, text draft, status, and sentiment live on a `reviews` row created when AI processing completes.

**Quarantine** — The state of a low-path response: its review stays pending and is skipped by auto-approval, flagged needs-attention in the dashboard, until explicitly approved by a human. Not a second publishing gate. Consent remains on file.

**Private Feedback** — Optional free-text the customer leaves on the Low Path. Goes only to the professional; never published.

**Passthrough Review** — The high-path flow where the customer copies their AI-generated review text and is deep-linked to an external platform (Google via `google_place_id` write-review link, Zillow via profile URL) to post it there.

**Review Kit** — The bundle of the customer's AI-generated review text plus platform deep links. Offered on-screen first; emailed as a Recapture Email if the customer doesn't use the passthrough.

**Recapture Email** — A delayed follow-up email containing the Review Kit, sent only to high-path customers who did not click a platform passthrough button on the thank-you screen.

**Smart Link** — The public `/s/[slug]` page for a single review or video testimonial. For videos it doubles as a landing page: player plus the professional's contact card and referral prompt.

**Share Caption** — A first-person caption generated from the customer's own transcript, used when the customer shares their video to social with their smart link.

## Acquisition

**Contact** — The canonical record of an external person a professional asks for feedback (text review or video testimonial). Every acquisition request references a Contact; deduplication, suppression, and funnel identity hang off it. Strictly external people — an Employee is never a Contact. "Customer" is not a distinct concept: it is informal role language for a Contact within a specific feedback flow (as in Customer Rating).

**Employee** — An internal member of an organization, invited to Employee Experience surveys and recognition. A deliberately separate concept from Contact: different consent, anonymity, and suppression semantics. Employees are never enrolled in acquisition sends.

**Contact Owner** — The single professional responsible for the relationship with a Contact. Reassignable (e.g., when a professional leaves or the customer returns with someone else). Contacts are scoped to the organization — an individual professional's scope is their individual organization — with admins and managers able to see all of the org's Contacts, while professionals see the Contacts they own.

**Contact Identity** — Within an organization, a Contact is identified by email address: the same email seen again is the same Contact (details update; request history accrues). Phone is an attribute today and a second identifier once SMS exists; the model is designed so phone-only Contacts become possible without upheaval.

**Suppression** — A per-channel "do not contact" state on a Contact, honored by every professional in the organization and enforced by a single send-time check. Carries a reason: unsubscribed (self-serve), do-not-contact (marked by a professional), or bounced/complained (system). An unsubscribe from one professional's request suppresses acquisition sends from the whole org on that channel.

**Send-Time Snapshot** — The name/email (later phone) recorded on a request row at the moment it was sent. Immutable audit truth of what went where, deliberately distinct from the living Contact, whose details may change afterward.

**Acquisition Sequence** — A campaign whose enrollees are Contacts rather than professionals: a cadence of feedback asks (invitation, reminders, thank-you) for text reviews or video testimonials. Runs on the same sequence engine as internal lifecycle campaigns; every step honors Suppression. The classic invitation + 3-day + 7-day reminder cadence is the default template.

**Held Request** — An automatically created feedback request (e.g., from a CRM trigger) that could not be attributed to a professional. It sits visibly in a queue awaiting assignment and is never sent while held: a wrong-name ask is worse than a delayed ask.

**Review-Generating Survey** — A survey template that must contain a star-rating question (enforced at the template level); every completion can therefore become a publishable Review. The only kind of survey an Acquisition Sequence sends.

**Feedback Survey** — A survey without a rating question (e.g., NPS or free-text only). Its responses are internal insight and never become public Reviews; the builder and funnel state this plainly. Ratings are never manufactured from NPS or sentiment.

**Acquisition Funnel** — The per-request lifecycle a professional can see end to end: sent → opened → started → submitted → published, with Held and stuck requests surfaced as attention states. Lives operationally beside Requests in the content hub, with per-professional rollups in Analytics.

## Platform & IA

**Workspace** — The org-scoped area of the dashboard, one name for both account types: billing, branding, integrations, webhooks, API keys, and templates live here ("Us"). Settings is personal-only ("Me"). Every account has exactly one Workspace.

**Member** — A person with a platform account in an organization (invited, holds a role, can log in). Managed in People → Members. Distinct from Employee (EX-survey roster, may never log in) and from Contact (external).

**Platform Admin** — RepWell staff. A dedicated flag, never inferable from an org role; platform tooling lives under /staff. Inside an organization, "admin" always and only means the org-admin role.

## Asset Generation

**Asset Kit** — The set of share-ready assets auto-generated when a review is approved. For video reviews: one 9:16 captioned Clip. For text reviews: quote-card images in 1:1 and 9:16. Additional formats and variants are rendered on demand. Kit assets are for the professional (review detail page and Share Studio); the customer's share kit continues to use the raw video.

**Clip** — A rendered, branded video built from a video testimonial: auto-trimmed source video with burned-in captions, music bed, branded intro, AI-quote segment, and End Card. Look is derived entirely from org brand tokens; only functional options (captions, music, trim, format, transcript fix) are adjustable.

**End Card** — The closing segment of a Clip: the professional's photo, name, title, org logo, their CTA text, and a QR code pointing at the review's Smart Link.

**Caption Correction** — A text-only edit to the transcript made before regenerating a Clip. Corrected words inherit the original word timings; timing itself is never hand-edited.

**Auto-Trim** — Silence removal at the head and tail of the source video, derived from the first and last word timestamps plus a small margin. Manually overridable with start/end handles.

**Adaptive Framing** — How a Clip frames the source video per format: portrait sources fill 9:16 edge to edge; landscape sources sit in a styled card on the brand background with captions in the freed space. Faces are never cropped away.

**Music Bed** — A track from the curated, license-verified instrumental bundle, played across the whole Clip and ducked under the customer's speech. Org setting picks the default; per-render override or off.
