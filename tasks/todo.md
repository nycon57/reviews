# Task Tracking

## Enterprise vs Individual Architecture Refactor

### Workstream A: Public Visibility Rules (no schema changes)

- [x] A1: `getPublicLOProfile()` — add `account_type` to org join, return `OrgDisplay` shape with `href` (null for individual)
- [x] A1: `getPublicOrganizationProfile()` — early return notFound for individual orgs, `.neq("role", "admin")` on professionals + total count
- [x] A1: `getPublicBranchProfile()` — `.neq("role", "admin")` to exclude enterprise admins from branch lists
- [x] A1: `searchProfessionals()` — add `account_type`+`role` to query, post-filter enterprise admins, add `is_enterprise` to `DirectoryProfessional`
- [x] A1: `getAllOrganizationSlugs()` — filter to non-individual orgs for sitemap
- [x] A2: `contact-cta-card.tsx` — org link vs plain text driven by `href` presence
- [x] A2: `pro-profile-content.tsx` — accept `OrgDisplay` type, update `logoUrl` refs
- [x] A2: `pro/[slug]/page.tsx` — breadcrumbs only link to org for enterprise (href present)
- [x] A2: `directory-card.tsx` — org badge only shown when `is_enterprise` (both list + grid variants)

### Workstream B: Branch Manager Auto-Assignment

- [x] B1: DB trigger `fn_auto_assign_branch_manager()` — auto-assign on branch_id/is_active changes

### Workstream C: Contacts + EX Survey + Department Deprecation

- [ ] C1: contacts table migration
- [ ] C2: contacts CRUD + bulk import
- [ ] C3: EX survey refactor to use contacts
- [ ] C4: department deprecation

### Verification

- [x] `npm run build` passes
- [x] `npm run lint` passes (17 pre-existing errors, 0 from our changes)

## Completed

- Workstream A: Public Visibility Rules
- Workstream B: Branch Manager Auto-Assignment Migration
