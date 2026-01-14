# ReviewHub Development Guardrails

## Purpose
This document captures lessons learned, patterns to follow, and pitfalls to avoid during development. Update this as the project evolves.

---

## Code Standards

### TypeScript
- Always use strict mode (`strict: true` in tsconfig)
- Define explicit types - avoid `any`
- Use Zod for runtime validation at API boundaries
- Generate database types from Supabase: `npm run db:types`

### React/Next.js
- Use Server Components by default, Client Components only when needed
- Prefer Server Actions over API routes for mutations
- Use `useTransition` for non-urgent updates
- Always handle loading and error states

### ShadCN/UI
- Use ShadCN components before creating custom ones
- Follow the component composition pattern
- Keep component files focused - one component per file

### Database
- Always apply Row Level Security (RLS) policies
- Use database functions for complex operations
- Create indexes for frequently queried columns
- Keep migrations reversible when possible

---

## Patterns to Follow

### Authentication
```typescript
// Always check auth in server components
const supabase = createServerComponentClient({ cookies });
const { data: { user } } = await supabase.auth.getUser();
if (!user) redirect('/login');
```

### Data Fetching
```typescript
// Server Components - direct queries
const { data, error } = await supabase
  .from('reviews')
  .select('*')
  .eq('organization_id', user.organization_id);

// Client Components - use React Query
const { data, isLoading } = useQuery({
  queryKey: ['reviews'],
  queryFn: () => fetchReviews(),
});
```

### Forms
```typescript
// Use react-hook-form + zod
const schema = z.object({
  name: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
});

const form = useForm<z.infer<typeof schema>>({
  resolver: zodResolver(schema),
});
```

### API Routes
```typescript
// Always validate input and handle errors
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = schema.parse(body);
    // ... process
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

---

## Pitfalls to Avoid

### Security
- [ ] Never expose service role key to client
- [ ] Always validate user permissions before operations
- [ ] Sanitize user input before database queries
- [ ] Don't trust client-side data - validate on server

### Performance
- [ ] Avoid N+1 queries - use joins or batch fetching
- [ ] Don't fetch unnecessary data - use select() with specific columns
- [ ] Implement pagination for list views (default 50 items)
- [ ] Cache expensive computations (metrics, aggregations)

### Common Mistakes
- [ ] Forgetting to apply RLS policies on new tables
- [ ] Not handling loading/error states in UI
- [ ] Using client components when server components work
- [ ] Hardcoding values that should be in environment variables

---

## Testing Checklist

Before marking a story as done:
- [ ] `npm run build` passes
- [ ] `npm run lint` passes with no errors
- [ ] TypeScript compiles with no errors
- [ ] Feature works on mobile viewport
- [ ] Keyboard navigation works
- [ ] Error states handled gracefully
- [ ] RLS policies tested with different user roles

---

## Architecture Decisions

### ADR-001: Server Components First
**Context**: Next.js 14 App Router defaults to Server Components
**Decision**: Use Server Components by default, Client Components only for interactivity
**Consequence**: Better performance, simpler data fetching, smaller client bundle

### ADR-002: Supabase for Backend
**Context**: Need auth, database, and real-time capabilities
**Decision**: Use Supabase instead of building custom backend
**Consequence**: Faster development, managed infrastructure, built-in RLS

### ADR-003: ShadCN over Component Library
**Context**: Need customizable UI components
**Decision**: Use ShadCN/UI (copy-paste components) over installed libraries
**Consequence**: Full control over styling, no version conflicts, larger initial setup

---

## External Dependencies

### Critical
- **Supabase**: Database, Auth - must be available
- **Resend**: Email delivery - degraded mode without it
- **OpenAI**: AI features - optional, features degrade gracefully

### Non-Critical
- **Google Business API**: External reviews - Phase 2+
- **Zapier**: Integrations - Phase 4

---

## Notes

_Add development notes here as the project progresses._
