"use client";

import { createAuthClient } from "better-auth/react";
import { adminClient, magicLinkClient } from "better-auth/client/plugins";

/**
 * Better Auth Client for React
 *
 * Provides hooks and methods for client-side authentication:
 * - useSession() - Get current session with reactive updates
 * - signIn.email() - Sign in with email/password
 * - signIn.magicLink() - Sign in with magic link
 * - signUp.email() - Register with email/password
 * - signOut() - Sign out current session
 * - forgetPassword() - Request password reset
 * - resetPassword() - Reset password with token
 *
 * @see https://better-auth.com/docs/concepts/client
 */
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  plugins: [
    // Admin operations (impersonation, user management)
    adminClient(),
    // Magic link authentication
    magicLinkClient(),
  ],
});

// Export commonly used methods and hooks
export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
  // Admin methods
  admin,
} = authClient;

// Password reset methods are accessed via server actions, not client
// The client doesn't have forgetPassword/resetPassword directly

// Re-export the full client for advanced use cases
export default authClient;
