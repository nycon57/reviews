-- Fix: public professional visibility filter was unenforceable via PostgREST.
--
-- The ADR 0006 filter needed "role <> 'admin' OR organizations.account_type =
-- 'individual'", but PostgREST cannot reference embedded-table columns inside
-- a top-level or=() logic tree — every query using the old
-- PUBLIC_PROFESSIONAL_OR_FILTER failed with PGRST100, so all public
-- directory/profile listings returned empty.
--
-- A computed column encapsulates the cross-table OR server-side; PostgREST
-- exposes it as a filterable virtual column on users
-- (?is_public_professional=is.true).

create or replace function public.is_public_professional(u public.users)
returns boolean
language sql
stable
as $$
  select u.role <> 'admin'
      or exists (
        select 1
        from public.organizations o
        where o.id = u.organization_id
          and o.account_type = 'individual'
      );
$$;

comment on function public.is_public_professional(public.users) is
  'Computed column: user is visible as a public professional (any non-admin role, or an individual-account admin — ADR 0006). Used by applyPublicProfessionalFilters.';

notify pgrst, 'reload schema';
