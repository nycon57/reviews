import { initBotId } from "botid/client/core";

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
