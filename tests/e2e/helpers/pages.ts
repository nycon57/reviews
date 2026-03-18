/**
 * Route URL constants for all testable pages.
 * Grouped by section for smoke and interaction tests.
 */

export const MARKETING_PAGES = [
  { path: "/", name: "Homepage" },
  { path: "/about", name: "About" },
  { path: "/pricing", name: "Pricing" },
  { path: "/features", name: "Features" },
  { path: "/blog", name: "Blog" },
  { path: "/contact", name: "Contact" },
  { path: "/demo", name: "Demo" },
  { path: "/api-docs", name: "API Docs" },
  { path: "/terms", name: "Terms" },
  { path: "/privacy", name: "Privacy" },
  { path: "/directory", name: "Directory" },
  { path: "/developers", name: "Developers" },
] as const;

export const AUTH_PAGES = [
  { path: "/login", name: "Login" },
  { path: "/signup", name: "Signup" },
  { path: "/forgot-password", name: "Forgot Password" },
] as const;

export const PUBLIC_PAGES = [
  ...MARKETING_PAGES,
  ...AUTH_PAGES,
] as const;

// Dashboard pages accessible to ALL authenticated users
export const DASHBOARD_COMMON_PAGES = [
  { path: "/dashboard", name: "Dashboard Home" },
  { path: "/dashboard/reviews", name: "Reviews" },
  { path: "/dashboard/analytics", name: "Analytics" },
  { path: "/dashboard/surveys", name: "Surveys" },
  { path: "/dashboard/social-graphics", name: "Social Graphics" },
  { path: "/dashboard/widgets", name: "Widgets" },
  { path: "/dashboard/settings", name: "Settings" },
  { path: "/dashboard/help", name: "Help" },
  { path: "/dashboard/notifications", name: "Notifications" },
  { path: "/dashboard/reports", name: "Reports" },
] as const;

// Pages requiring Pro+ tier (basic users see upgrade prompt)
export const DASHBOARD_PRO_PAGES = [
  { path: "/dashboard/insights", name: "AI Insights" },
  { path: "/dashboard/geo", name: "Geo Visibility" },
  { path: "/dashboard/analytics/website", name: "Website Analytics" },
] as const;

// Pages requiring enterprise account type
export const DASHBOARD_ENTERPRISE_PAGES = [
  { path: "/dashboard/team", name: "Team Management" },
  { path: "/dashboard/campaigns", name: "Campaigns" },
  { path: "/dashboard/approvals", name: "Approvals" },
  { path: "/dashboard/ex-surveys", name: "EX Surveys" },
  { path: "/dashboard/employees", name: "Employees" },
  { path: "/dashboard/recognition", name: "Recognition" },
  { path: "/dashboard/analytics/leaderboard", name: "Leaderboard" },
] as const;

// Pages requiring enterprise admin role
export const DASHBOARD_ADMIN_PAGES = [
  { path: "/dashboard/organization", name: "Organization" },
] as const;

// All dashboard pages combined
export const ALL_DASHBOARD_PAGES = [
  ...DASHBOARD_COMMON_PAGES,
  ...DASHBOARD_PRO_PAGES,
  ...DASHBOARD_ENTERPRISE_PAGES,
  ...DASHBOARD_ADMIN_PAGES,
] as const;

// Test user roles for auth fixtures
export const TEST_USERS = {
  "individual-basic": {
    email: "individual-basic@test.com",
    password: "TestPassword123!",
    storageState: ".auth/individual-basic.json",
    accountType: "individual" as const,
    role: "admin" as const,
    tier: "basic" as const,
  },
  "individual-pro": {
    email: "individual-pro@test.com",
    password: "TestPassword123!",
    storageState: ".auth/individual-pro.json",
    accountType: "individual" as const,
    role: "admin" as const,
    tier: "pro" as const,
  },
  "enterprise-user": {
    email: "enterprise-user@test.com",
    password: "TestPassword123!",
    storageState: ".auth/enterprise-user.json",
    accountType: "enterprise" as const,
    role: "user" as const,
    tier: "enterprise" as const,
  },
  "enterprise-manager": {
    email: "enterprise-manager@test.com",
    password: "TestPassword123!",
    storageState: ".auth/enterprise-manager.json",
    accountType: "enterprise" as const,
    role: "manager" as const,
    tier: "enterprise" as const,
  },
  "enterprise-admin": {
    email: "enterprise-admin@test.com",
    password: "TestPassword123!",
    storageState: ".auth/enterprise-admin.json",
    accountType: "enterprise" as const,
    role: "admin" as const,
    tier: "enterprise" as const,
  },
} as const;

export type TestUserKey = keyof typeof TEST_USERS;
