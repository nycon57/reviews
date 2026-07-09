import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

/*
 * Server-action auth tripwire.
 *
 * This is intentionally a string/AST-level guardrail, not a full security
 * proof. It walks local "use server" files, finds exported function-like
 * actions, recognizes known auth guard identifiers plus simple local helper
 * delegation, and requires every remaining public action to be listed below
 * with a reason. It cannot prove deep imported-helper semantics; it exists to
 * make new naked exported actions fail CI until a human classifies them.
 */

const KNOWN_GUARDS = [
  "checkAdminAccess",
  "checkAdminAccessBetterAuth",
  "checkPageAccess",
  "getAccessContext",
  "getAuthContext",
  "getAuthenticatedOrganizationContext",
  "getAuthenticatedUserResult",
  "getAuthedContext",
  "getEnterpriseContext",
  "getManagerContext",
  "getOrgId",
  "getSessionBetterAuth",
  "getUserBetterAuth",
  "getUserContext",
  "getUserOrgContext",
  "hasOrgReportAccess",
  "hasPageAccess",
  "hasReportGenerationAccess",
  "isPlatformAdmin",
  "requireAccess",
  "requireAdminAccess",
  "requireAdminRole",
  "requireAuthenticatedUser",
  "requireCronSecretRequest",
  "requireDirectoryMaintenanceAccess",
  "requireEnterprise",
  "requireEnterpriseAdmin",
  "requireEnterpriseManager",
  "requireIndividualOrEnterpriseAdmin",
  "requireManagerRole",
  "requirePlatformAdmin",
  "requireProTier",
  "requireSurveyAccess",
  "requireSurveyDataAccess",
  "unifiedGetUser",
  "unifiedGetUserWithProfile",
] as const;

const PUBLIC_ACTIONS: Record<string, string> = {
  "src/app/(public)/u/c/[token]/actions.ts#getContactByUnsubscribeToken":
    "Token-scoped contact preference lookup.",
  "src/app/(public)/u/c/[token]/actions.ts#resubscribeContactByToken":
    "Token-scoped contact resubscribe.",
  "src/app/(public)/u/c/[token]/actions.ts#unsubscribeContactByToken":
    "Token-scoped contact unsubscribe.",
  "src/lib/auth/actions.ts#unifiedResetPassword":
    "Auth bootstrap/password reset flow; provider owns token validation.",
  "src/lib/auth/actions.ts#unifiedResendVerificationEmail":
    "Authenticated auth-provider flow; Better Auth validates the current session before sending.",
  "src/lib/auth/actions.ts#unifiedSignIn": "Auth bootstrap flow; provider validates credentials.",
  "src/lib/auth/actions.ts#unifiedSignInWithMagicLink":
    "Auth bootstrap flow; provider validates email delivery/token.",
  "src/lib/auth/actions.ts#unifiedSignOut":
    "Authenticated auth-provider flow; Better Auth validates and clears the current session.",
  "src/lib/auth/actions.ts#unifiedSignUp":
    "Auth bootstrap flow; provider validates account creation.",
  "src/lib/auth/actions.ts#unifiedUpdatePassword":
    "Password-reset continuation; provider validates reset token/session.",
  "src/lib/auth/server-actions.ts#resetPasswordBetterAuth":
    "Auth bootstrap/password reset flow; provider owns token validation.",
  "src/lib/auth/server-actions.ts#signInWithBetterAuth":
    "Auth bootstrap flow; provider validates credentials.",
  "src/lib/auth/server-actions.ts#signInWithMagicLinkBetterAuth":
    "Auth bootstrap flow; provider validates email delivery/token.",
  "src/lib/auth/server-actions.ts#signUpWithBetterAuth":
    "Auth bootstrap flow; provider validates account creation.",
  "src/lib/auth/server-actions.ts#updatePasswordBetterAuth":
    "Password-reset continuation; provider validates reset token/session.",
  "src/lib/credentials/actions.ts#getPublicCredentials": "Public verified profile credential read.",
  "src/lib/directory/actions.ts#getAvailableIndustries":
    "Public directory facet read; applies public professional filters.",
  "src/lib/directory/actions.ts#searchLoanOfficers":
    "Public directory search legacy alias; applies public professional filters.",
  "src/lib/directory/actions.ts#searchProfessionals":
    "Public directory search; applies public professional filters.",
  "src/lib/directory/contact-action.ts#contactProfessional":
    "Public lead-capture form; schema validation and email-only side effect.",
  "src/lib/directory/geocoding.ts#geocodeAddress":
    "Public geocode lookup helper; no tenant data read/write.",
  "src/lib/directory/geocoding.ts#geocodeAddressWithFallback":
    "Public geocode lookup helper; no tenant data read/write.",
  "src/lib/email-preferences/actions.ts#getCommunicationPreferencesByToken":
    "Token-scoped communication preference lookup.",
  "src/lib/email-preferences/actions.ts#getEmailPreferencesByToken":
    "Token-scoped email preference lookup.",
  "src/lib/email-preferences/actions.ts#resubscribeByToken":
    "Token-scoped email preference mutation.",
  "src/lib/email-preferences/actions.ts#unsubscribeAllByToken":
    "Token-scoped email preference mutation.",
  "src/lib/email-preferences/actions.ts#updateEmailPreferencesByToken":
    "Token-scoped email preference mutation.",
  "src/lib/email-preferences/actions.ts#updateSmsConsentByToken":
    "Token-scoped legacy SMS consent endpoint; current implementation is write-safe.",
  "src/lib/ex-surveys/public-actions.ts#getEXSurveyByToken":
    "Invitation-token scoped employee experience survey read.",
  "src/lib/ex-surveys/public-actions.ts#getEXSurveyStatus":
    "Invitation-token scoped employee experience survey status read.",
  "src/lib/ex-surveys/public-actions.ts#submitEXSurveyResponse":
    "Invitation-token scoped employee experience survey submission.",
  "src/lib/marketing/actions.ts#submitContactForm":
    "Public lead-capture form; schema validation and email-only side effect.",
  "src/lib/marketing/actions.ts#submitDemoRequest":
    "Public lead-capture form; schema validation and email-only side effect.",
  "src/lib/pro-profile/actions.ts#flagReview":
    "Public flag submission scoped to a public profile/review pair.",
  "src/lib/pro-profile/actions.ts#submitPublicReview":
    "Public review submission with rate limiting and email verification token.",
  "src/lib/pro-profile/actions.ts#submitReferral":
    "Public referral form scoped to a public professional.",
  "src/lib/pro/contact-actions.ts#contactProfessional":
    "Public lead-capture form; schema validation and email-only side effect.",
  "src/lib/pro/contact-actions.ts#contactRecipient":
    "Public lead-capture form; schema validation and email-only side effect.",
  "src/lib/reporting/actions.ts#getReportShareByToken": "Share-token scoped report read.",
  "src/lib/reporting/export.ts#exportReportToCSV":
    "Pure serialization of caller-provided report data.",
  "src/lib/reviews/upsell-actions.ts#startReviewVideoUpsell":
    "Public verified-review upsell flow; checks published direct-review eligibility.",
  "src/lib/seo/actions.ts#getAllOrganizationSlugs": "Public SEO metadata read.",
  "src/lib/seo/actions.ts#getAllPublicBranchIds": "Public SEO metadata read.",
  "src/lib/seo/actions.ts#getAllPublicBranchSlugs": "Public SEO metadata read.",
  "src/lib/seo/actions.ts#getAllPublicLOIds": "Public SEO metadata read.",
  "src/lib/seo/actions.ts#getAllPublicUserSlugs": "Public SEO metadata read.",
  "src/lib/seo/actions.ts#getPublicBranchOgCardData": "Public SEO/profile read.",
  "src/lib/seo/actions.ts#getPublicBranchProfile": "Public SEO/profile read.",
  "src/lib/seo/actions.ts#getPublicLOList": "Public SEO/profile read.",
  "src/lib/seo/actions.ts#getPublicLOProfile": "Public SEO/profile read.",
  "src/lib/seo/actions.ts#getPublicOrganizationOgCardData": "Public SEO/profile read.",
  "src/lib/seo/actions.ts#getPublicOrganizationProfile": "Public SEO/profile read.",
  "src/lib/seo/actions.ts#getPublicProfessionalOgCardData": "Public SEO/profile read.",
  "src/lib/stripe/actions.ts#getPricingForCheckout": "Public pricing configuration read.",
  "src/lib/stripe/actions.ts#getPricingTiers": "Public pricing configuration read.",
  "src/lib/surveys/public-actions.ts#getSurveyByToken": "Survey-token scoped read.",
  "src/lib/surveys/public-actions.ts#recordSurveyGoogleReviewClick":
    "Survey-token scoped analytics event.",
  "src/lib/surveys/public-actions.ts#submitSurveyResponse": "Survey-token scoped submission.",
  "src/lib/users/actions.ts#getPublicUserProfile": "Public user profile read.",
  "src/lib/users/actions.ts#getPublicUsers": "Public user listing.",
  "src/lib/video-testimonials/approval-actions.ts#getTextApprovalData":
    "Approval-token scoped video testimonial read.",
  "src/lib/video-testimonials/approval-actions.ts#regenerateReviewText":
    "Approval-token scoped video testimonial mutation.",
  "src/lib/video-testimonials/approval-actions.ts#submitApprovedText":
    "Approval-token scoped video testimonial mutation.",
  "src/lib/video-testimonials/public-actions.ts#createVideoUploadUrl":
    "Video-testimonial token scoped signed upload URL.",
  "src/lib/video-testimonials/public-actions.ts#createVideoUploadUrls":
    "Video-testimonial token scoped signed upload URLs.",
  "src/lib/video-testimonials/public-actions.ts#generateShareLink":
    "Published-video scoped share link helper.",
  "src/lib/video-testimonials/public-actions.ts#getPublicVideoMetadata":
    "Public published-video metadata read.",
  "src/lib/video-testimonials/public-actions.ts#getPublicVideoTestimonial":
    "Public published-video read.",
  "src/lib/video-testimonials/public-actions.ts#getShareKit":
    "Video-testimonial token scoped share kit.",
  "src/lib/video-testimonials/public-actions.ts#getVideoTestimonialByToken":
    "Video-testimonial token scoped read.",
  "src/lib/video-testimonials/public-actions.ts#recordPassthroughClick":
    "Video-testimonial token scoped analytics event.",
  "src/lib/video-testimonials/public-actions.ts#submitCustomerInfoAndConsent":
    "Video-testimonial token scoped customer consent submission.",
  "src/lib/video-testimonials/public-actions.ts#submitPrivateFeedback":
    "Video-testimonial token scoped private feedback submission.",
  "src/lib/video-testimonials/public-actions.ts#submitVideoTestimonial":
    "Video-testimonial token scoped media submission.",
  "src/lib/video-testimonials/public-actions.ts#trackVideoShare":
    "Published-video scoped analytics event.",
  "src/lib/widgets/ab-testing.ts#getPublicAbTestConfig":
    "Public widget A/B-test configuration read.",
};

type ExportedAction = {
  filePath: string;
  guard?: string;
  key: string;
  name: string;
};

function walkTypeScriptFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if ([".git", ".next", "node_modules"].includes(entry.name)) {
      continue;
    }

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...walkTypeScriptFiles(fullPath));
      continue;
    }

    if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith(".d.ts")) {
      files.push(fullPath);
    }
  }

  return files;
}

function toRepoPath(filePath: string): string {
  return path.relative(process.cwd(), filePath).split(path.sep).join("/");
}

function hasUseServerDirective(sourceFile: ts.SourceFile): boolean {
  for (const statement of sourceFile.statements) {
    if (ts.isExpressionStatement(statement) && ts.isStringLiteral(statement.expression)) {
      if (statement.expression.text === "use server") {
        return true;
      }

      continue;
    }

    break;
  }

  return false;
}

function isExported(node: ts.Node): boolean {
  return Boolean(
    ts.canHaveModifiers(node) &&
    ts.getModifiers(node)?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)
  );
}

function identifierName(name: ts.PropertyName | ts.BindingName | undefined): string | null {
  return name && ts.isIdentifier(name) ? name.text : null;
}

function containsAsyncFunction(node: ts.Node): boolean {
  let found = false;

  function visit(child: ts.Node): void {
    if (found) {
      return;
    }

    if (
      (ts.isFunctionExpression(child) || ts.isArrowFunction(child)) &&
      ts.getModifiers(child)?.some((modifier) => modifier.kind === ts.SyntaxKind.AsyncKeyword)
    ) {
      found = true;
      return;
    }

    ts.forEachChild(child, visit);
  }

  visit(node);

  return found;
}

function collectServerActions(filePath: string): ExportedAction[] {
  const source = fs.readFileSync(filePath, "utf8");
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );

  if (!hasUseServerDirective(sourceFile)) {
    return [];
  }

  const localFunctions = new Map<string, string>();
  const exportedFunctions: Array<{ name: string; text: string }> = [];

  for (const statement of sourceFile.statements) {
    if (ts.isFunctionDeclaration(statement)) {
      const name = identifierName(statement.name);

      if (name) {
        localFunctions.set(name, statement.getText(sourceFile));

        if (isExported(statement)) {
          exportedFunctions.push({ name, text: statement.getText(sourceFile) });
        }
      }
    }

    if (ts.isVariableStatement(statement)) {
      const exported = isExported(statement);

      for (const declaration of statement.declarationList.declarations) {
        const name = identifierName(declaration.name);
        const initializer = declaration.initializer;

        if (!name || !initializer) {
          continue;
        }

        if (
          ts.isArrowFunction(initializer) ||
          ts.isFunctionExpression(initializer) ||
          containsAsyncFunction(initializer)
        ) {
          localFunctions.set(name, initializer.getText(sourceFile));

          if (exported) {
            exportedFunctions.push({ name, text: initializer.getText(sourceFile) });
          }
        }
      }
    }
  }

  const repoPath = toRepoPath(filePath);

  return exportedFunctions.map(({ name, text }) => ({
    filePath: repoPath,
    guard: findGuard(text, localFunctions),
    key: `${repoPath}#${name}`,
    name,
  }));
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function directGuardIn(text: string): string | undefined {
  for (const guard of KNOWN_GUARDS) {
    if (new RegExp(`\\b${escapeRegex(guard)}\\b`).test(text)) {
      return guard;
    }
  }

  if (/\.auth\.getUser\s*\(/.test(text)) {
    return "supabase.auth.getUser";
  }

  if (/\.auth\.getSession\s*\(/.test(text) || /auth\.api\.getSession\s*\(/.test(text)) {
    return "auth session";
  }

  return undefined;
}

function findGuard(
  text: string,
  localFunctions: Map<string, string>,
  seen = new Set<string>()
): string | undefined {
  const directGuard = directGuardIn(text);

  if (directGuard) {
    return directGuard;
  }

  for (const [name, body] of localFunctions) {
    if (seen.has(name)) {
      continue;
    }

    if (new RegExp(`\\b${escapeRegex(name)}\\s*\\(`).test(text)) {
      seen.add(name);

      const nestedGuard = findGuard(body, localFunctions, seen);

      if (nestedGuard) {
        return `${name} -> ${nestedGuard}`;
      }
    }
  }

  return undefined;
}

function collectAllServerActions(): ExportedAction[] {
  return walkTypeScriptFiles(path.join(process.cwd(), "src")).flatMap(collectServerActions);
}

describe("server action authentication guardrail", () => {
  it("requires exported server actions to be guarded or explicitly public", () => {
    const actions = collectAllServerActions();
    const actionKeys = new Set(actions.map((action) => action.key));

    const stalePublicActions = Object.keys(PUBLIC_ACTIONS).filter((key) => !actionKeys.has(key));
    const unclassifiedActions = actions
      .filter((action) => !action.guard && !PUBLIC_ACTIONS[action.key])
      .map((action) => action.key)
      .sort();

    expect(stalePublicActions).toEqual([]);
    expect(unclassifiedActions).toEqual([]);
  });
});
