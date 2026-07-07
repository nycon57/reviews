# Scope Selector Pattern

## Overview

The scope selector controls data visibility based on the user's role and account type. It determines whether a user sees personal data, team data, or organization-wide data.

**Implementation**: `src/components/analytics/scope-selector.tsx`

## Default Behavior

| User Type | Default Scope | Selector Visible? |
|---|---|---|
| Enterprise Admin | Organization-wide | Yes (can switch to team/personal) |
| Enterprise Manager | Team (their branch/reports) | Yes (can switch to personal) |
| Enterprise User | Personal only | No (forced personal) |
| Individual (any tier) | Personal only | No (forced personal) |

## Rules

1. **Individual users**: Always force personal scope. Hide the scope selector entirely.
2. **Enterprise users (role=user)**: Force personal scope. Hide selector.
3. **Enterprise managers**: Default to team scope. Allow switching to personal.
4. **Enterprise admins**: Default to org scope. Allow switching to team/personal.

## Extension Candidates

Pages that currently use or should adopt the scope selector pattern:

| Page | Current State | Recommendation |
|---|---|---|
| /dashboard/analytics | Has scope selector | Already implemented |
| /dashboard/analytics/trends | Passes role to client | Should use scope selector |
| /dashboard/reviews | No scope selector | Add for managers+ to see team reviews |
| /dashboard/requests | No scope selector | Add for managers+ to see team requests |
| /dashboard/share-studio | No scope selector | Add for managers+ to see org proof items |

## Integration Guide

```tsx
import { ScopeSelector } from "@/components/analytics/scope-selector";

// In your server component, pass role and accountType from getAccessContext()
<ScopeSelector
  userRole={ctx.role}
  accountType={ctx.accountType}
  onScopeChange={(scope) => { /* refetch data */ }}
/>
```

The scope selector auto-hides for users who can only see personal data, so it's safe to render unconditionally.
