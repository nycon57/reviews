<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of RepWell with PostHog analytics. The integration covers the full customer journey — from a visitor landing on a professional's public smart link, through writing a review or recording a video testimonial, through to a dashboard user activating a campaign. Server-side sign-in tracking with user identification is wired to the Supabase OAuth callback, ensuring anonymous and authenticated sessions are correlated.

**Files created/modified:**
- `instrumentation-client.ts` — PostHog client-side init (alongside existing BotID init)
- `src/lib/posthog-server.ts` — singleton server-side PostHog client
- `next.config.js` — reverse proxy rewrites for `/ingest/*` and `skipTrailingSlashRedirect`
- `.env.local` — `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST`

**Events instrumented:**

| Event | Description | File |
|---|---|---|
| `video_testimonial_started` | Customer clicks "Let's do it" on the video testimonial invitation screen | `src/app/(public)/video-testimonial/[token]/video-testimonial-form.tsx` |
| `video_testimonial_consent_submitted` | Customer submits info and consent, proceeding to the recording step | `src/app/(public)/video-testimonial/[token]/video-testimonial-form.tsx` |
| `video_testimonial_completed` | Customer's video has been successfully uploaded and processed | `src/app/(public)/video-testimonial/[token]/video-testimonial-form.tsx` |
| `review_submitted` | Customer submits a written review on a professional's public profile | `src/app/pro/[slug]/components/write-review-modal.tsx` |
| `campaign_created` | Dashboard user creates a new campaign workflow | `src/app/(dashboard)/dashboard/campaigns/new-campaign-modal.tsx` |
| `campaign_activated` | Dashboard user activates a campaign | `src/app/(dashboard)/dashboard/campaigns/campaigns-dashboard.tsx` |
| `campaign_paused` | Dashboard user pauses an active campaign | `src/app/(dashboard)/dashboard/campaigns/campaigns-dashboard.tsx` |
| `smart_link_cta_clicked` | Visitor clicks the primary CTA on a review smart link page | `src/app/s/[slug]/smart-link-content.tsx` |
| `smart_link_shared` | Visitor clicks a social share button (X, LinkedIn, Email) | `src/app/s/[slug]/smart-link-content.tsx` |
| `referral_initiated` | Visitor clicks "Introduce them" on a smart link page | `src/app/s/[slug]/smart-link-content.tsx` |
| `user_signed_in` | User completes the OAuth sign-in flow (server-side, with `identify`) | `src/app/auth/callback/route.ts` |
| `contact_form_submitted` | Visitor submits the contact form on a professional's public profile | `src/app/pro/[slug]/components/contact-form-modal.tsx` |

## Next steps

We've built insights and a dashboard to monitor user behaviour based on the events just instrumented:

- [Analytics basics (wizard) dashboard](https://us.posthog.com/project/374796/dashboard/1786215)
- [Video testimonial funnel](https://us.posthog.com/project/374796/insights/qsJZCEKg)
- [Review submissions over time](https://us.posthog.com/project/374796/insights/4hAo5jUx)
- [Campaign activity](https://us.posthog.com/project/374796/insights/DGpGlgV8)
- [Smart link engagement](https://us.posthog.com/project/374796/insights/3SMxpw1x)
- [User sign-ins over time](https://us.posthog.com/project/374796/insights/shx1kTju)

## Verify before merging

- [ ] Run a full production build (`npm run build`) and fix any lint or type errors introduced by the generated code.
- [ ] Run the test suite — call sites that were rewritten or instrumented may need updated mocks or fixtures.
- [ ] Add `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST` to `.env.example` and any CI/deployment scripts so collaborators know what to set.
- [ ] Wire source-map upload (`posthog-cli sourcemap` or your bundler's upload step) into CI so production stack traces de-minify in PostHog Error Tracking.
- [ ] Confirm the returning-visitor path also calls `identify` — the current OAuth callback only identifies users who have an `organization_id`. Users without one (mid-onboarding) will remain anonymous until they complete onboarding and sign in again.

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
