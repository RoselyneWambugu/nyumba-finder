-- Wrap auth.uid() as (select auth.uid()) so Postgres evaluates it once per query
-- instead of once per row (see: RLS "Auth RLS Initialization Plan" lint).
-- Also split the owner "for all" policies on listing_photos/listing_contacts into
-- insert/update/delete only, since a separate public policy already covers select
-- and having both was flagged as redundant overlapping permissive policies.

drop policy "users manage their own profile" on profiles;
create policy "users manage their own profile" on profiles for update using ((select auth.uid()) = id);

drop policy "owners insert their own listings" on listings;
create policy "owners insert their own listings" on listings for insert with check ((select auth.uid()) = owner_id);
drop policy "owners update their own listings" on listings;
create policy "owners update their own listings" on listings for update using ((select auth.uid()) = owner_id);
drop policy "owners delete their own listings" on listings;
create policy "owners delete their own listings" on listings for delete using ((select auth.uid()) = owner_id);

drop policy "owners manage their listing photos" on listing_photos;
create policy "owners insert their listing photos" on listing_photos for insert with check (
  exists (select 1 from listings l where l.id = listing_id and l.owner_id = (select auth.uid()))
);
create policy "owners update their listing photos" on listing_photos for update using (
  exists (select 1 from listings l where l.id = listing_id and l.owner_id = (select auth.uid()))
);
create policy "owners delete their listing photos" on listing_photos for delete using (
  exists (select 1 from listings l where l.id = listing_id and l.owner_id = (select auth.uid()))
);

drop policy "contacts visible to owner or subscriber" on listing_contacts;
create policy "contacts visible to owner or subscriber" on listing_contacts for select using (
  exists (select 1 from listings l where l.id = listing_id and l.owner_id = (select auth.uid()))
  or has_active_subscription((select auth.uid()))
);
drop policy "owners manage their listing contacts" on listing_contacts;
create policy "owners insert their listing contacts" on listing_contacts for insert with check (
  exists (select 1 from listings l where l.id = listing_id and l.owner_id = (select auth.uid()))
);
create policy "owners update their listing contacts" on listing_contacts for update using (
  exists (select 1 from listings l where l.id = listing_id and l.owner_id = (select auth.uid()))
);
create policy "owners delete their listing contacts" on listing_contacts for delete using (
  exists (select 1 from listings l where l.id = listing_id and l.owner_id = (select auth.uid()))
);

drop policy "authenticated users can review" on reviews;
create policy "authenticated users can review" on reviews for insert with check ((select auth.uid()) = reviewer_id);
drop policy "authors update their own review" on reviews;
create policy "authors update their own review" on reviews for update using ((select auth.uid()) = reviewer_id);
drop policy "authors delete their own review" on reviews;
create policy "authors delete their own review" on reviews for delete using ((select auth.uid()) = reviewer_id);

drop policy "owners post availability updates" on availability_updates;
create policy "owners post availability updates" on availability_updates for insert with check (
  (select auth.uid()) = updated_by
  and exists (select 1 from listings l where l.id = listing_id and l.owner_id = (select auth.uid()))
);

drop policy "users manage their own saved listings" on saved_listings;
create policy "users manage their own saved listings" on saved_listings for all using ((select auth.uid()) = user_id);

drop policy "users read their own subscriptions" on subscriptions;
create policy "users read their own subscriptions" on subscriptions for select using ((select auth.uid()) = user_id);

drop policy "users read their own mpesa transactions" on mpesa_transactions;
create policy "users read their own mpesa transactions" on mpesa_transactions for select using ((select auth.uid()) = user_id);
