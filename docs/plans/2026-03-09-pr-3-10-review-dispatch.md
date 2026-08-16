# PR 3-10 Review Dispatch Plan

> **For Claude:** REQUIRED SUB-SKILL: Use `dispatching-parallel-agents` to split review work by PR and `code-review` for the final quality pass. Use `using-git-worktrees` before opening any PR workspace.

**Goal:** Review PRs 3 through 10 in isolated worktrees with dedicated security, DB, and general code-review lanes.

**Architecture:** Each PR gets a dedicated review worktree rooted at the PR head. The lead lane is assigned by the dominant risk area, while the other lanes validate adjacent failure modes so that security fixes do not regress correctness or database policy behavior.

**Tech Stack:** Git worktrees, GitHub CLI, Next.js, Supabase/Postgres migrations and RLS, manual code review, optional CodeRabbit once authenticated.

---

## Lane Definitions

- `security`: Authorization, tenant isolation, public data exposure, input validation, output encoding, callback tampering, XSS.
- `db`: RLS predicates, grants, migration safety, `SECURITY DEFINER` exposure, policy scope, unintended public access.
- `code-review`: Correctness, regression risk, test coverage, minimal diff, maintainability, missing edge cases.

## PR Queue

| PR | Lead lanes | Worktree | Primary surface |
| --- | --- | --- | --- |
| 3 | `security`, `db`, `code-review` | `.worktrees/pr-3-review` | `supabase/migrations/20240101000052_abandoned_action_recovery.sql` |
| 4 | `security`, `code-review` | `.worktrees/pr-4-review` | `src/app/api/v1/render/route.ts`, `src/lib/remotion/render-service.ts` |
| 5 | `db`, `security`, `code-review` | `.worktrees/pr-5-review` | `supabase/migrations/20240101000033_video_testimonials.sql` |
| 6 | `security`, `code-review` | `.worktrees/pr-6-review` | `src/lib/directory/actions.ts` |
| 7 | `security`, `code-review` | `.worktrees/pr-7-review` | `src/lib/social/actions.ts` |
| 8 | `security`, `code-review` | `.worktrees/pr-8-review` | `src/components/seo/structured-data.tsx`, tests |
| 9 | `db`, `security`, `code-review` | `.worktrees/pr-9-review` | `supabase/migrations/20240101000001_rls_policies.sql` |
| 10 | `db`, `security`, `code-review` | `.worktrees/pr-10-review` | `supabase/migrations/20240101000003_email_unsubscribes.sql` |

## PR Briefs

### PR 3

- Title: `fix(security): harden abandoned action recovery RPC authorization and grants`
- Worktree: `.worktrees/pr-3-review`
- Lead: `security` and `db`
- Focus: Confirm the RPC cannot be executed by unintended roles, `PUBLIC` access is revoked, tenant scope is explicit, and the migration does not leave a `SECURITY DEFINER` footgun behind.

### PR 4

- Title: `Enforce org scoping and role checks for render API to prevent cross-tenant exposure`
- Worktree: `.worktrees/pr-4-review`
- Lead: `security`
- Focus: Verify org identity is derived from trusted server context, render requests cannot cross tenant boundaries, and the role gate still permits legitimate render paths.

### PR 5

- Title: `fix(security): tighten public video testimonial RLS and storage policies`
- Worktree: `.worktrees/pr-5-review`
- Lead: `db`
- Focus: Validate the revised public read path only exposes intended testimonial rows and does not leave storage object access or broad public predicates in place.

### PR 6

- Title: `fix(security): remove public directory PII exposure`
- Worktree: `.worktrees/pr-6-review`
- Lead: `security`
- Focus: Check that the public directory query no longer leaks hidden or sensitive fields, and that downstream callers still receive the minimum data needed for the UI.

### PR 7

- Title: `fix: protect social OAuth callback state from tampering`
- Worktree: `.worktrees/pr-7-review`
- Lead: `security`
- Focus: Confirm OAuth state is signed and verified with replay and mismatch handling, and that failure paths do not create broken reconnect flows.

### PR 8

- Title: `fix(seo): prevent JSON-LD script break-out XSS`
- Worktree: `.worktrees/pr-8-review`
- Lead: `security`
- Focus: Ensure the JSON-LD serializer safely escapes script-breaking sequences, preserves valid structured data, and is covered by a regression test for hostile content.

### PR 9

- Title: `fix: prevent self-escalation in users RLS update policy`
- Worktree: `.worktrees/pr-9-review`
- Lead: `db`
- Focus: Verify the policy blocks role escalation without blocking legitimate profile updates, and that policy conditions do not accidentally widen cross-user update access.

### PR 10

- Title: `fix: restrict public RLS access on email_unsubscribes`
- Worktree: `.worktrees/pr-10-review`
- Lead: `db`
- Focus: Confirm unsubscribe data is no longer publicly readable, while unsubscribe flows and verification links still function for intended anonymous actors.

## Operating Notes

- CodeRabbit CLI is installed, but review automation is blocked until `coderabbit auth login` is completed.
- The main workspace is dirty, so all review work should stay inside the PR-specific worktrees.
- Run `gh pr diff <number>` or `git -C .worktrees/pr-<n>-review diff origin/claude/fullstack-nextjs-mobile-setup-UPonj...HEAD` inside the assigned worktree before leaving comments.
