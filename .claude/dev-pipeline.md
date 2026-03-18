# Development Pipeline

Full 6-phase lifecycle for every feature. Chain skills in order.

---

## Phase 1: Ideation & Planning

| Step | Skill/Tool | Action |
|---|---|---|
| Understand requirements | `feature-dev:code-explorer` | Analyze existing code related to the task |
| Check PRD | Read `.agents/tasks/prd-reviews.json` | Get story details |
| Plan | `feature-dev:code-architect` | Design implementation approach |
| Write plan | Write to `tasks/todo.md` | Checkable items per Task Management rules |

---

## Phase 2: Design

| Step | Skill/Tool | Action |
|---|---|---|
| Read design system | Read `docs/design/REPWELL_DESIGN_SYSTEM` | BEFORE any UI work |
| Design UI | `frontend-design` | Generate UI designs following design system |
| Check Next.js patterns | `next-best-practices` | RSC boundaries, data patterns, async APIs |
| Check React patterns | `vercel-react-best-practices` | Composition, performance, rendering |
| Check composition | `vercel-composition-patterns` | Component structure, prop patterns, scaling |

---

## Phase 3: Development

| Step | Skill/Tool | Action |
|---|---|---|
| Database work | `supabase-postgres-best-practices` | Before writing queries/schema changes |
| Database changes | Supabase MCP `apply_migration` | Schema changes, then `npm run db:types` |
| Auth work | `better-auth-best-practices` | Any auth-related code |
| Stripe work | `stripe-best-practices` | Payment integration |
| Library docs | Context7 `resolve-library-id` → `query-docs` | Before using any external API |
| Email work | `react-email` / `send-email` | Transactional emails |

---

## Phase 4: Testing

### Automated Tests (deterministic, every PR)

| Step | Command | Action |
|---|---|---|
| Unit tests | `npm run test` | Vitest — server actions, utilities, permissions |
| Smoke tests | `npm run test:smoke` | Playwright — all pages load, no JS errors |
| Dashboard tests | `npm run test:e2e:dashboard` | Playwright — auth + dashboard + access control |
| Full E2E | `npm run test:e2e:full` | Playwright — everything including widgets |
| Quality gates | `npm run lint` && `npm run build` | Must pass before proceeding |

### agent-browser Verification (post-feature, manual trigger)

| Step | Command | Action |
|---|---|---|
| Baseline screenshot | `agent-browser screenshot --annotate` | Before building feature |
| Post-feature screenshot | `agent-browser screenshot --annotate` | After building feature |
| Visual diff | `agent-browser diff screenshot` | Compare before/after |
| Interactive audit | `agent-browser snapshot -i` | Verify all interactive elements exist |
| Console check | `agent-browser console` | Check for runtime errors |
| API verification | `agent-browser network requests --filter api` | Verify API calls |
| Dashboard sweep | `./tests/browser-verification/verify-dashboard.sh` | Screenshot all dashboard pages |

### Live Debugging

| Step | Tool | Action |
|---|---|---|
| DevTools inspection | `chrome-devtools-mcp` (MCP) | Live DOM, network, console via DevTools protocol |
| Check logs | Supabase MCP `get_logs` | Debug runtime errors |
| Supabase advisors | Supabase MCP `get_advisors` | After any DDL changes |

---

## Phase 5: Code Review & QA

| Step | Skill/Tool | Action |
|---|---|---|
| React Doctor scan | `/react-doctor` | Every task — fix errors before done |
| Error handling audit | `silent-failure-hunter` subagent | When catch blocks or error handling modified |
| Code simplification | `code-simplifier` subagent | Pre-commit polish on modified files |
| Design review | `frontend-design` + `web-design-guidelines` | UI compliance + accessibility (UI tasks) |

---

## Phase 6: Commit & Ship

| Step | Skill/Tool | Action |
|---|---|---|
| Commit | `commit` or `commit-commands:commit` | Conventional commit with clear description |
| Push + PR | `commit-commands:commit-push-pr` | Push and create PR with summary |
| PR template | GitHub MCP `create_pull_request` | Use repo PR template if exists |
| Update lessons | Write to `tasks/lessons.md` | If any corrections were made |
