-- Fix mutable search_path warning
create or replace function set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- handle_new_user and apply_availability_update are trigger-only functions;
-- Postgres invokes trigger functions regardless of the triggering role's EXECUTE
-- grant, so revoking public/anon/authenticated EXECUTE here only closes the
-- accidental /rest/v1/rpc/* exposure, it doesn't break the triggers.
revoke execute on function handle_new_user() from public, anon, authenticated;
revoke execute on function apply_availability_update() from public, anon, authenticated;

-- has_active_subscription(uid) is legitimately called both from RLS policies and
-- from the app's own RPC call, but as written a caller could pass an arbitrary
-- uid and learn a stranger's subscription status. Pin it to the caller's own id.
create or replace function has_active_subscription(uid uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from subscriptions
    where user_id = uid
      and uid = auth.uid()
      and status = 'active'
      and expires_at > now()
  );
$$;
