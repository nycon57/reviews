import { initBotId } from "botid/client/core";
import posthog from "posthog-js";

// Initialize Vercel BotID protection for browser-to-server API requests
// This runs client-side JavaScript challenges to detect bots
initBotId({
  protect: [
    // Protect all POST endpoints with wildcard
    // Covers: /api/email/*, /api/reports/*, /api/webhooks/*, /api/stripe/*, etc.
    { path: "/api/*", method: "POST" },
    // Also protect PUT endpoints (e.g., webhook test endpoint)
    { path: "/api/*", method: "PUT" },
  ],
});

if (process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN, {
    api_host: "/ingest",
    ui_host: "https://us.posthog.com",
    defaults: "2026-01-30",
    capture_exceptions: true,
    debug: process.env.NODE_ENV === "development",
  });
} else if (process.env.NODE_ENV === "development") {
  console.warn(
    "PostHog disabled: NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN is not set"
  );
}
