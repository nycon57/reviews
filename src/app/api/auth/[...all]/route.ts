import { auth } from "@/lib/auth/better-auth";
import { toNextJsHandler } from "better-auth/next-js";

/**
 * Better Auth API Route Handler
 *
 * Handles all authentication endpoints:
 * - POST /api/auth/sign-up/email - Email/password registration
 * - POST /api/auth/sign-in/email - Email/password login
 * - POST /api/auth/sign-in/magic-link - Magic link login
 * - POST /api/auth/sign-out - Sign out
 * - POST /api/auth/forget-password - Request password reset
 * - POST /api/auth/reset-password - Reset password with token
 * - POST /api/auth/verify-email - Verify email address
 * - GET /api/auth/get-session - Get current session
 * - And more...
 *
 * @see https://better-auth.com/docs/concepts/api-routes
 */
export const { GET, POST } = toNextJsHandler(auth);
