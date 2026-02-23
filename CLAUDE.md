# CLAUDE.md

RepWell - customer experience & review management platform for mortgage/financial services (replaces Experience.com/Birdeye).

## Commands

```bash
npm run dev              # Dev server
npm run build            # Production build (required before PR)
npm run lint             # ESLint (required before PR)
npm run lint:fix         # Auto-fix lint
npm run type-check       # TypeScript check
npm run format           # Prettier
npm run test             # Vitest unit tests
npm run test:e2e         # Playwright E2E tests
npm run db:types         # Generate types from Supabase schema
npm run db:push          # Push migrations
npm run db:generate      # New migration
npx shadcn@latest add <component>
```

**Quality Gates:** `npm run build` and `npm run lint` must pass before completing any story.

## Design System (MANDATORY)

**CRITICAL:** Read and strictly follow `docs/design/REPWELL_DESIGN_SYSTEM` for ALL UI work. Read the full document before creating or modifying ANY UI. Never deviate without explicit user approval.

## Workflow Orchestration

### 1. Plan Mode Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately - don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy
- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

### 3. Self-Improvement Loop
- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

### 4. Verification Before Done
- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes - don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests - then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

## Task Management

1. **Plan First:** Write plan to `tasks/todo.md` with checkable items
2. **Verify Plan:** Check in before starting implementation
3. **Track Progress:** Mark items complete as you go
4. **Explain Changes:** High-level summary at each step
5. **Document Results:** Add review section to `tasks/todo.md`
6. **Capture Lessons:** Update `tasks/lessons.md` after corrections

## Core Principles

- **Simplicity First:** Make every change as simple as possible. Impact minimal code.
- **No Laziness:** Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact:** Changes should only touch what's necessary. Avoid introducing bugs.

## Development Pipeline

Follow the full 6-phase lifecycle in `.claude/dev-pipeline.md`:
**Ideation** → **Design** → **Development** → **Testing** → **Code Review** → **Commit & Ship**

### Mandatory Code Review (No Exceptions)

**Tier 1 — Always (every task):**
- Run `/react-doctor` at the end of EVERY task. Fix errors before presenting work. Non-negotiable.
- `npm run lint` + `npm run build` must pass (existing quality gates).

**Tier 2 — Auto-escalate (no need to be asked):**
- Auth/payment/DB schema/API route changes → also run `coderabbit review --prompt-only`
- Error handling changes → also run `silent-failure-hunter` subagent — scans modified files for suppressed/swallowed errors (empty catch blocks, `.catch(() => {})`, missing error logging); input: list of changed files; output: list of findings with file, line, severity, and suggested fix
- New types/interfaces → also run `type-design-analyzer` subagent — inspects new/modified types for naming consistency, compatibility issues, unsafe `any`/`never` casts, missing readonly/optional modifiers; input: list of changed type definitions; output: list of suggestions with file, line, issue category, and recommended change

**Tier 3 — Pre-PR polish:**
- Run `code-simplifier` subagent on modified files before committing.

### Skill Auto-Invocation (No Exceptions)

| Phase | Skills (invoke automatically) |
|---|---|
| ANY UI work | `frontend-design` → `next-best-practices` → `vercel-react-best-practices` → `vercel-composition-patterns` |
| ANY DB work | `supabase-postgres-best-practices` + Supabase MCP |
| ANY new feature | `feature-dev:feature-dev` at start |
| ANY auth work | `better-auth-best-practices` |
| Before library use | Context7 `query-docs` |
| After UI changes | `agent-browser` for visual verification |
| End of EVERY task | `/react-doctor` — no exceptions |
| Auth/payment/DB/API changes | `coderabbit review --prompt-only` — auto-triggered |
| Error handling changes | `silent-failure-hunter` subagent on changed files |
| New types/interfaces | `type-design-analyzer` subagent on changed type defs |
| Before commit | `code-simplifier` subagent on changed files |
| Ready to ship | `commit-commands:commit-push-pr` |

## Reference

| File | Contents |
|---|---|
| `.claude/architecture.md` | Stack, auth, data patterns, route groups, integrations |
| `.claude/database.md` | Supabase, key tables, RLS, migrations |
| `.claude/skills-and-plugins.md` | Detailed skill triggers & MCP plugin reference |
| `.claude/dev-pipeline.md` | Full 6-phase development lifecycle |
| `tasks/todo.md` | Current task tracking |
| `tasks/lessons.md` | Self-improvement log |
| `.agents/tasks/prd-reviews.json` | Available stories |

## Plan Mode

- Make the plan extremely concise. Sacrifice grammar for the sake of concision.
- At the end of each plan, give me a list of unresolved questions to answer, if any.
