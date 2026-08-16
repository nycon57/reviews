-- Better Auth cutover prep: the 20240101000054 password import was a
-- point-in-time copy; users created via Supabase auth AFTER it ran have no
-- credential row and would be locked out at cutover. Idempotent re-import —
-- safe to run repeatedly.

insert into public.accounts (id, user_id, account_id, provider_id, password, created_at, updated_at)
select
  gen_random_uuid()::text,
  au.id,
  au.id::text,
  'credential',
  au.encrypted_password,
  now(),
  now()
from auth.users au
join public.users pu on pu.id = au.id
where au.encrypted_password is not null
  and not exists (
    select 1 from public.accounts a
    where a.user_id = au.id and a.provider_id = 'credential'
  );

-- Keep verified-at in sync for the same stragglers.
update public.users pu
set email_verified_at = au.email_confirmed_at
from auth.users au
where au.id = pu.id
  and pu.email_verified_at is null
  and au.email_confirmed_at is not null;
