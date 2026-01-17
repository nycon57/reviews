# Build

You are an autonomous coding agent. Your task is to complete the work for exactly one story and record the outcome.

## Multi-Pass Requirement (3 passes minimum)

Ralph runs multiple passes per story for iterative quality improvement. Track your pass count.

### Pass Tracking
Before each run, check {{PROGRESS_PATH}} for entries on this story ({{STORY_ID}}):
- 0 prior entries → This is Pass 1 (Implementation)
- 1 prior entry → This is Pass 2 (Quality Review)
- 2+ prior entries → This is Pass 3+ (Polish & Finalize)

### Pass-Specific Tasks

**Pass 1 - Implementation:**
- Read `docs/design/REPWELL_DESIGN_SYSTEM` for design standards
- Load `/feature-dev` for architecture planning
- Implement core functionality per acceptance criteria
- Run `npm run build && npm run lint`
- Commit with message prefix: `[Pass 1/3]`
- DO NOT output `<promise>COMPLETE</promise>`
- End the run normally

**Pass 2 - Quality Review:**
- Run `/code-review` on all changes from Pass 1
- Run `/vercel-react-best-practices` on React code
- Fix identified issues (bugs, security, logic errors)
- Verify design system compliance
- Commit with message prefix: `[Pass 2/3]`
- DO NOT output `<promise>COMPLETE</promise>`
- End the run normally

**Pass 3 - Polish & Finalize:**
- Run `/code-simplifier` on all story code
- Run `/frontend-design` audit (for UI stories)
- Browser verification for any UI changes
- Final verification of ALL acceptance criteria
- Commit with message prefix: `[Pass 3/3]`
- ONLY output `<promise>COMPLETE</promise>` if ALL criteria pass

## Paths
- PRD: {{PRD_PATH}}
- AGENTS (optional): {{AGENTS_PATH}}
- Progress Log: {{PROGRESS_PATH}}
- Guardrails: {{GUARDRAILS_PATH}}
- Guardrails Reference: {{GUARDRAILS_REF}}
- Context Reference: {{CONTEXT_REF}}
- Errors Log: {{ERRORS_LOG_PATH}}
- Activity Log: {{ACTIVITY_LOG_PATH}}
- Activity Logger: {{ACTIVITY_CMD}}
- No-commit: {{NO_COMMIT}}
- Repo Root: {{REPO_ROOT}}
- Run ID: {{RUN_ID}}
- Iteration: {{ITERATION}}
- Run Log: {{RUN_LOG_PATH}}
- Run Summary: {{RUN_META_PATH}}

## Global Quality Gates (apply to every story)
{{QUALITY_GATES}}

## Selected Story (Do not change scope)
ID: {{STORY_ID}}
Title: {{STORY_TITLE}}

Story details:
{{STORY_BLOCK}}

If the story details are empty or missing, STOP and report that the PRD story format could not be parsed.

## Rules (Non-Negotiable)
- Implement **only** the work required to complete the selected story.
- Complete all tasks associated with this story (and only this story).
- Do NOT ask the user questions.
- Do NOT change unrelated code.
- Do NOT assume something is unimplemented — confirm by reading code.
- Implement completely; no placeholders or stubs.
- If No-commit is true, do NOT commit or push changes.
- Do NOT edit the PRD JSON (status is handled by the loop).
- All changes made during the run must be committed (including updates to progress/logs).
 - Before committing, perform a final **security**, **performance**, and **regression** review of your changes.

## Plugin Strategy (Load Based on Story Phase)

Before implementing, determine which phase the story belongs to and load the appropriate plugins:

### Phase 1 (S001-S010, S012) - Foundation MVP
- Run `/feature-dev` for architecture planning on complex stories
- Use `feature-dev:code-architect` for S003 (Auth), S005 (Survey Builder)

### Phase 2 (S009, S011, S013-S016, S026, S031) - Enhanced Features
- Run `/frontend-design` for dashboard UI stories (S011, S013, S014)
- Use `/feature-dev` for integration stories (S015 Google API)

### Phase 3 (S017-S022, S032) - AI & Advanced
- ALWAYS run `/feature-dev` before AI stories - architecture is critical
- Use `feature-dev:code-architect` for S019 (Sentiment Analysis) as it sets patterns

### Phase 4 (S023-S030) - Mobile & Integrations
- Run `/frontend-design` for all mobile UI stories (S023-S025)
- Use `/feature-dev` for API/integration stories (S027-S030)

### Phase 10 (E15) - Video Testimonials Epic
**Focus**: Video recording, processing, and testimonial management
**Stories**: S050-S059 (approximately)

**Required Plugins (ALL stories):**
- `/feature-dev` - ALWAYS run at start for architecture planning
- `/vercel-react-best-practices` - ALWAYS run for React component optimization
- `/frontend-design` - For video player UI, recording interface, gallery components
- `/code-review` - Run during Pass 2 for quality assurance
- `/code-simplifier` - Run during Pass 3 for clean, maintainable code

**Mandatory Requirements:**
- **Design System**: Read `docs/design/REPWELL_DESIGN_SYSTEM` BEFORE any UI work
- **React Patterns**: All components must follow Vercel React best practices
- **3-Pass Minimum**: No story completes until Pass 3 verification passes

**Technical Guidelines:**
- Use native MediaRecorder API for video capture
- Implement proper loading/processing states for video uploads
- Ensure mobile-first responsive design for recording UI
- Apply accessibility standards for video controls (WCAG 2.1 AA)
- Use ShadCN components as foundation, style per design system

### After Every Story
- Run `/code-simplifier` to ensure clean, maintainable code
- For complex stories, consider running `/code-review` before committing

## RepWell Design System (MANDATORY)

**CRITICAL:** You MUST read and follow `docs/design/REPWELL_DESIGN_SYSTEM` for ALL UI work.

Before any UI implementation:
1. Read the full design system document
2. Follow all specifications exactly (colors, typography, spacing, components, motion)
3. Never deviate from the design system without documented justification
4. Match the polish level of Stripe Dashboard or Linear

**Key Design Principles:**
- Clean, spacious layouts with clear hierarchy
- Consistent 8px spacing grid
- Strategic use of accent colors (not rainbow)
- Polished micro-interactions and hover states
- Proper loading/empty/error states
- Accessibility WCAG 2.1 AA compliance

## React Best Practices (MANDATORY)

**CRITICAL:** Run `/vercel-react-best-practices` on ALL React components.

**Required Patterns:**
- Use Server Components by default, Client Components only when needed
- Implement proper Suspense boundaries for loading states
- Minimize client-side JavaScript bundle size
- Use `useCallback` and `useMemo` for expensive operations
- Avoid prop drilling - use context or composition
- Implement proper error boundaries

**Performance Checklist:**
- [ ] No unnecessary re-renders (React DevTools profiling)
- [ ] Images optimized with `next/image`
- [ ] Dynamic imports for heavy components
- [ ] Proper data fetching (Server Components or React Query)
- [ ] No memory leaks in useEffect cleanups

## Your Task (Do this in order)
1. Read {{GUARDRAILS_PATH}} before any code changes.
2. Read {{ERRORS_LOG_PATH}} for repeated failures to avoid.
3. Read {{PRD_PATH}} for global context (do not edit).
4. **Determine the story's phase and load appropriate plugins** (see Plugin Strategy above).
5. Fully audit and read all necessary files to understand the task end-to-end before implementing. Do not assume missing functionality.
6. If {{AGENTS_PATH}} exists, follow its build/test instructions.
8. Implement only the tasks that belong to {{STORY_ID}}.
9. Run verification commands listed in the story, the global quality gates, and in {{AGENTS_PATH}} (if required).
10. If the project has a build or dev workflow, run what applies:
    - Build step (e.g., `npm run build`) if defined.
    - Dev server (e.g., `npm run dev`, `wrangler dev`) if it is the normal validation path.
    - Confirm no runtime/build errors in the console.
11. **Run `/code-simplifier`** to refine the code for clarity, consistency, and maintainability.
12. Perform a brief audit before committing:
    - **Security:** check for obvious vulnerabilities or unsafe handling introduced by your changes.
    - **Performance:** check for avoidable regressions (extra queries, heavy loops, unnecessary re-renders).
    - **Regression:** verify existing behavior that could be impacted still works.
13. If No-commit is false, commit changes using the `$commit` skill.
    - Stage everything: `git add -A`
    - Confirm a clean working tree after commit: `git status --porcelain` should be empty.
    - After committing, capture the commit hash and subject using:
      `git show -s --format="%h %s" HEAD`.
14. Append a progress entry to {{PROGRESS_PATH}} with run/commit/test details (format below).
    If No-commit is true, skip committing and note it in the progress entry.

## Progress Entry Format (Append Only)
```
## [Date/Time] - {{STORY_ID}}: {{STORY_TITLE}}
Thread: [codex exec session id if available, otherwise leave blank]
Run: {{RUN_ID}} (iteration {{ITERATION}})
Pass: [1/3, 2/3, or 3/3] - [Implementation/Quality Review/Polish & Finalize]
Run log: {{RUN_LOG_PATH}}
Run summary: {{RUN_META_PATH}}
- Guardrails reviewed: yes
- No-commit run: {{NO_COMMIT}}
- Commit: <hash> <subject> (or `none` + reason)
- Post-commit status: `clean` or list remaining files
- Skills invoked:
  - /feature-dev: [yes/no]
  - /code-review: [yes/no]
  - /vercel-react-best-practices: [yes/no]
  - /code-simplifier: [yes/no]
  - /frontend-design: [yes/no]
- Verification:
  - Command: <exact command> -> PASS/FAIL
  - Command: <exact command> -> PASS/FAIL
- Files changed:
  - <file path>
  - <file path>
- What was implemented
- **Learnings for future iterations:**
  - Patterns discovered
  - Gotchas encountered
  - Useful context
---
```

## Completion Signal
Only output the completion signal when the **selected story** is fully complete and verified.
When the selected story is complete, output:
<promise>COMPLETE</promise>

Otherwise, end normally without the signal.

## Additional Guardrails
- When authoring documentation, capture the why (tests + implementation intent).
- If you learn how to run/build/test the project, update {{AGENTS_PATH}} briefly (operational only).
- Keep AGENTS operational only; progress notes belong in {{PROGRESS_PATH}}.
- If you hit repeated errors, log them in {{ERRORS_LOG_PATH}} and add a Sign to {{GUARDRAILS_PATH}} using {{GUARDRAILS_REF}} as the template.

## Activity Logging (Required)
Log major actions to {{ACTIVITY_LOG_PATH}} using the helper:
```
{{ACTIVITY_CMD}} "message"
```
Log at least:
- Start of work on the story
- After major code changes
- After tests/verification
- After updating progress log

## Browser Testing (Required for Frontend Stories)
If the selected story changes UI, you MUST verify it in the browser:
1. Load the `dev-browser` skill.
2. Navigate to the relevant page.
3. Verify the UI changes work as expected.
4. Take a screenshot if helpful for the progress log.

A frontend story is NOT complete until browser verification passes.

## Mobbin UI Reference (Required for Frontend Stories)
Before implementing any UI components, you MUST research design patterns on Mobbin:

1. Read `{{REPO_ROOT}}/.agents/ralph/MOBBIN_REFERENCE.md` for story-specific search queries
2. Use browser automation (claude-in-chrome MCP) to:
   - Navigate to https://mobbin.com
   - Login with Google OAuth (jarrett.stanley@gmail.com - see MOBBIN_EMAIL in .env)
   - Search for relevant patterns using the queries in MOBBIN_REFERENCE.md
3. Study 3-5 top examples from leading apps (Stripe, Linear, Notion)
4. Apply these patterns:
   - Clean, spacious layouts with clear hierarchy
   - Consistent 8px spacing grid
   - Strategic use of accent colors
   - Polished micro-interactions
5. Document design decisions in your progress entry

**UI Quality Standards** (enforced for all frontend stories):
- No generic "starter template" aesthetics
- Match the polish level of Stripe Dashboard or Linear
- Use subtle shadows, borders, and hover states
- Implement proper loading/empty/error states
- Ensure accessibility (WCAG 2.1 AA)

A frontend story is NOT complete until it meets Mobbin-quality standards.
