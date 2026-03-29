# Auth Guardrails — RepWell

## Stack
- Better Auth for authentication
- Session-based auth with secure cookies
- Role-based access control (admin, manager, member)

## Rules
- Always check auth in server components before rendering protected content
- Use proxy.ts (Next.js 16) for route protection middleware
- Never store session tokens in a way that doesn't meet compliance requirements
- Enterprise vs Individual user distinction is critical — see database guardrails
