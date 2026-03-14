import { betterAuth } from "better-auth";
import { admin, magicLink } from "better-auth/plugins";
import { Pool } from "pg";
import { nextCookies } from "better-auth/next-js";
import { getResendClient, emailConfig, getFromAddress } from "@/lib/email/client";
import bcrypt from "bcrypt";
import crypto from "crypto";

// PostgreSQL connection pool for Better Auth
// Parse URL and configure SSL explicitly for Supabase Supavisor compatibility
function createPool() {
  const connectionUrl = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;

  if (!connectionUrl) {
    throw new Error("DATABASE_URL or DIRECT_DATABASE_URL must be set");
  }

  // Parse the connection URL
  const url = new URL(connectionUrl);
  const [username, projectRef] = url.username.split(".");

  // Log connection info only in development for debugging
  if (process.env.NODE_ENV === "development") {
    console.log("[Better Auth Pool] Connecting to Supabase:", url.hostname);
  }

  // Configure pool with explicit options to ensure proper SSL/routing
  return new Pool({
    host: url.hostname,
    port: parseInt(url.port) || 5432,
    user: url.username, // Keep full username including project ref
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1) || "postgres",
    ssl: {
      rejectUnauthorized: false, // Accept Supabase's self-signed pooler cert
    },
    // Connection timeout
    connectionTimeoutMillis: 10000,
  });
}

// Singleton pool to prevent connection spam in dev mode
let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    pool = createPool();
  }
  return pool;
}

/**
 * Better Auth configuration for RepWell
 *
 * Maps to existing database schema:
 * - users table with all profile fields
 * - organizations table for multi-tenant support
 * - New tables: sessions, accounts, verifications (created by migration)
 */
export const auth = betterAuth({
  database: getPool(),

  // Use Next.js cookies for SSR support
  plugins: [
    nextCookies(),

    // Admin plugin for user management and impersonation
    admin({
      impersonationSessionDuration: 60 * 60, // 1 hour
      // Admin plugin fields use camelCase by default; map them to our snake_case schema.
      schema: {
        user: {
          modelName: "users",
          fields: {
            role: "role",
            banned: "banned",
            banReason: "ban_reason",
            banExpires: "ban_expires",
          },
        },
        session: {
          modelName: "sessions",
          fields: {
            impersonatedBy: "impersonated_by",
          },
        },
      },
    }),

    // Magic link authentication
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        const resend = getResendClient();

        await resend.emails.send({
          from: getFromAddress(),
          to: email,
          subject: "Sign in to RepWell",
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Sign in to RepWell</h2>
              <p>Click the link below to sign in to your account:</p>
              <p>
                <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #3B82F6; color: white; text-decoration: none; border-radius: 6px;">
                  Sign In
                </a>
              </p>
              <p style="color: #666; font-size: 14px;">
                This link will expire in 15 minutes. If you didn't request this, you can safely ignore this email.
              </p>
            </div>
          `,
        });
      },
      expiresIn: 60 * 15, // 15 minutes
    }),
  ],

  // Email and password authentication
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,

    // Supabase uses bcrypt for password hashing
    password: {
      hash: async (password) => {
        return await bcrypt.hash(password, 10);
      },
      verify: async ({ hash, password }) => {
        return await bcrypt.compare(password, hash);
      },
    },

    // Password reset email
    sendResetPassword: async ({ user, url }) => {
      const resend = getResendClient();

      await resend.emails.send({
        from: getFromAddress(),
        to: user.email,
        subject: "Reset your RepWell password",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Reset Your Password</h2>
            <p>Hi ${user.name || "there"},</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <p>
              <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #3B82F6; color: white; text-decoration: none; border-radius: 6px;">
                Reset Password
              </a>
            </p>
            <p style="color: #666; font-size: 14px;">
              This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.
            </p>
          </div>
        `,
      });
    },
  },

  // Email verification configuration
  emailVerification: {
    sendOnSignUp: true,

    sendVerificationEmail: async ({ user, url }) => {
      const resend = getResendClient();

      await resend.emails.send({
        from: getFromAddress(),
        to: user.email,
        subject: "Verify your RepWell email",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Welcome to RepWell!</h2>
            <p>Hi ${user.name || "there"},</p>
            <p>Thanks for signing up. Please verify your email address by clicking the button below:</p>
            <p>
              <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #3B82F6; color: white; text-decoration: none; border-radius: 6px;">
                Verify Email
              </a>
            </p>
            <p style="color: #666; font-size: 14px;">
              If you didn't create an account, you can safely ignore this email.
            </p>
          </div>
        `,
      });
    },
  },

  // Session configuration - map to existing sessions table with snake_case
  session: {
    modelName: "sessions",
    fields: {
      userId: "user_id",
      expiresAt: "expires_at",
      ipAddress: "ip_address",
      userAgent: "user_agent",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
    expiresIn: 60 * 60 * 48, // 48 hours
    updateAge: 60 * 60 * 4, // Refresh after 4 hours of activity
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minute cache
    },
  },

  // Verification configuration - map to existing verifications table with snake_case
  verification: {
    modelName: "verifications",
    fields: {
      expiresAt: "expires_at",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },

  // User model configuration - map to existing users table with snake_case
  user: {
    modelName: "users",
    fields: {
      email: "email",
      emailVerified: "email_verified_at",
      name: "full_name",
      image: "avatar_url",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
    additionalFields: {
      // Core fields
      organization_id: { type: "string", required: false },
      role: { type: "string", defaultValue: "user" },
      is_active: { type: "boolean", defaultValue: true },
      is_owner: { type: "boolean", defaultValue: false },

      // Profile fields
      phone: { type: "string", required: false },
      title: { type: "string", required: false },
      bio: { type: "string", required: false },
      photo_url: { type: "string", required: false },
      timezone: { type: "string", required: false },
      industry: { type: "string", required: false },

      // Employment fields
      branch_id: { type: "string", required: false },
      manager_user_id: { type: "string", required: false },
      hire_date: { type: "date", required: false },

      // External profiles
      linkedin_url: { type: "string", required: false },
      zillow_profile_url: { type: "string", required: false },
      personal_website_url: { type: "string", required: false },
      google_place_id: { type: "string", required: false },
      google_business_id: { type: "string", required: false },

      // Performance metrics
      average_rating: { type: "number", required: false },
      total_reviews: { type: "number", required: false },
      nps_score: { type: "number", required: false },
      reputation_score: { type: "number", required: false },

      // Preferences
      notification_preferences: { type: "string", required: false }, // JSON stored as string
      receive_notifications: { type: "boolean", defaultValue: true },
      auto_request_reviews: { type: "boolean", required: false },

      // Address (JSON)
      address: { type: "string", required: false },

      // Timestamps
      last_login_at: { type: "date", required: false },
    },
  },

  // Account model for credentials - map to snake_case columns
  account: {
    modelName: "accounts",
    fields: {
      userId: "user_id",
      accountId: "account_id",
      providerId: "provider_id",
      accessToken: "access_token",
      refreshToken: "refresh_token",
      accessTokenExpiresAt: "access_token_expires_at",
      refreshTokenExpiresAt: "refresh_token_expires_at",
      idToken: "id_token",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
    },
  },

  // Advanced security settings
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    generateId: () => crypto.randomUUID(),
  },

  // Rate limiting - disabled for now as it causes issues with session checks
  // The get-session endpoint is called frequently by the client and triggers 429 errors
  // TODO: Re-enable with custom rules that exempt read-only endpoints like get-session
  rateLimit: {
    enabled: false,
  },

  // Trusted origins for CSRF
  trustedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ],

  // Database hooks for custom logic
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // Update last_login_at on user creation
          console.log("[Better Auth] User created:", user.id);
        },
      },
    },
    session: {
      create: {
        after: async (session) => {
          // Could track session creation for analytics
          console.log("[Better Auth] Session created for user:", session.userId);
        },
      },
    },
  },
});

// Export types for use throughout the application
export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
