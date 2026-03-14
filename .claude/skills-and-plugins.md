# Skills & Plugins Reference

## Skills - Detailed Triggers

| Skill | When to Invoke |
|---|---|
| `vercel-react-best-practices` | ANY React/Next.js work: components, reviewing, refactoring, bugs, features |
| `frontend-design:frontend-design` | Creating ANY new UI: pages, components, layouts, modals, forms |
| `feature-dev:feature-dev` | Starting ANY new feature implementation |
| `feature-dev:code-explorer` | Analyzing existing code for a task |
| `feature-dev:code-architect` | Designing implementation approach |
| `feature-dev:code-reviewer` | Reviewing for bugs, logic errors, security |
| `next-best-practices` | RSC boundaries, data patterns, async APIs |
| `vercel-composition-patterns` | Refactoring components, composition patterns |
| `supabase-postgres-best-practices` | Before writing queries or schema changes |
| `better-auth-best-practices` | Any auth-related code |
| `stripe-best-practices` | Payment integration work |
| `commit` | After completing ANY task |
| `commit-commands:commit-push-pr` | Feature complete and ready for review |
| `code-review:code-review` | Before merging, after completing features |
| `web-design-guidelines` | After UI work, accessibility/UX checks |
| `agent-browser` / `dev-browser` | Browser testing, screenshots, form filling, visual verification |
| `react-email` / `send-email` | Transactional email work |
| `prd` | New features, requirements, planning |
| `cartographer:cartographer` | Exploring unfamiliar code, codebase structure |

## MCP Plugins

### Supabase (`mcp__plugin_supabase_supabase__*`)
- `execute_sql` - Read data, check schema, debug
- `apply_migration` - Schema changes (tables, columns, indexes, RLS)
- `get_logs` - Debug errors, auth issues
- `get_advisors` - Post-DDL security/performance check
- `deploy_edge_function` - Serverless functions

### GitHub (`mcp__plugin_github_github__*`)
- `create_pull_request` - After pushing feature branches
- `list_issues` / `search_issues` - Bug and feature tracking
- `search_code` - Find patterns across repo
- `pull_request_read` / `pull_request_review_write` - PR reviews
- `list_branches` / `create_branch` - Branch management

### Context7 (`mcp__plugin_context7_context7__*`)
- `resolve-library-id` → `query-docs` - Look up library docs before using any external API
- Always check: Next.js, Supabase, TanStack Query, Zod, Radix UI, Tailwind, Framer Motion

### Browser Automation (`mcp__claude-in-chrome__*`)
- Testing app in browser, screenshots, form filling, visual verification of UI changes
