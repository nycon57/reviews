# 3. Remotion Lambda for production video rendering

Date: 2026-06-09

## Status

Accepted

## Context

Clip rendering uses Remotion's `renderMedia`, which drives headless Chrome.
The existing render worker (`src/lib/share-studio/render-worker.ts`) runs it
in-process behind the `proof_render_jobs` queue. That works on a developer
machine but cannot run inside a standard Vercel function: Chrome is not
available, bundles are too large, and renders routinely exceed function
limits.

We evaluated switching the rendering engine entirely (HeyGen's hyperframes,
HTML-to-video) and rejected it: our centerpiece composition overlays a
recorded source video with frame-accurate captions, which is exactly
Remotion's `OffthreadVideo` strength, and we have six composition families,
typed props, and in-app Player preview already built on Remotion.

Remaining infra options: Remotion Lambda (official AWS-based distributed
rendering), or a dedicated render box (VM/container with Chrome running the
existing worker loop).

## Decision

Render videos with Remotion Lambda in production. The cron worker keeps
ownership of the `proof_render_jobs` queue but dispatches render jobs to
Lambda, polls progress, and stores the resulting MP4 in Supabase Storage as
it does today. Local development may keep the in-process renderer.

## Consequences

- Renders scale per-job with no Chrome dependency on Vercel; cost is
  pay-per-render rather than a fixed monthly box.
- Adds an AWS account and Remotion Lambda deployment (site + function) to
  the infrastructure, plus AWS credentials in the environment.
- Remotion's company license applies (free below the revenue/employee
  threshold; paid above). Must be revisited as the company grows.
- The worker becomes a dispatcher: job status now reflects remote progress,
  so failures split into dispatch failures (retryable in-queue) and remote
  render failures (surfaced from Lambda).
- Audio preprocessing (loudness normalization) must happen where FFmpeg is
  available; Lambda renders from a prepared source URL, so normalization
  runs as a preparation step before dispatch.
