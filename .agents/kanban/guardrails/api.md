# API Guardrails — RepWell

## Patterns
- Always validate input with Zod at API boundaries
- Handle errors with proper HTTP status codes (400 for validation, 401/403 for auth, 500 for server)
- Use Server Actions for in-app mutations, Route Handlers for public API/webhooks
- All request APIs are async in Next.js 16: `await cookies()`, `await headers()`, `await params`

## Security
- Always check authentication before processing
- Validate user permissions (organization membership, role) before data access
- Sanitize user input before database queries
- Never expose internal error details to clients
- Rate limit public endpoints
