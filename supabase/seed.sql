-- Demo/dev seed data: one poster with 5 listings (varied locations, prices,
-- bedroom counts and availability states), plus two reviewers leaving reviews
-- on a couple of them. Safe to run once against a freshly migrated database
-- (via `supabase db reset` locally, or paste into the SQL editor on a fresh
-- remote project) — re-running it will fail on the unique email constraint,
-- which is expected for seed data.
--
-- These auth.users rows have no password and can't be used to sign in; they
-- exist only so seeded listings/reviews have a real profiles.id to reference
-- (profiles are created automatically by the on_auth_user_created trigger).
--
-- Listing photos are intentionally left empty here — the app falls back to a
-- placeholder image per listing until real photos are uploaded through the
-- Add Listing flow (see src/components/PlaceholderPhoto.tsx).

with poster as (
  insert into auth.users (id, email, raw_user_meta_data)
  values (gen_random_uuid(), 'wanjiku.demo@nyumbafinder.test', '{"full_name":"Wanjiku Kamau","phone":"254712345678"}'::jsonb)
  returning id
),
reviewer as (
  insert into auth.users (id, email, raw_user_meta_data)
  values (gen_random_uuid(), 'brian.demo@nyumbafinder.test', '{"full_name":"Brian Otieno","phone":"254798765432"}'::jsonb)
  returning id
),
reviewer2 as (
  insert into auth.users (id, email, raw_user_meta_data)
  values (gen_random_uuid(), 'achieng.demo@nyumbafinder.test', '{"full_name":"Achieng Odhiambo","phone":"254701122334"}'::jsonb)
  returning id
),
listing1 as (
  insert into public.listings (owner_id, title, location_text, price_kes, deposit_kes, bedrooms, bathrooms, availability_status)
  select id, 'Kilimani, 2-bed apartment', 'Kilimani', 45000, 90000, 2, 2, 'available' from poster
  returning id, owner_id
),
listing2 as (
  insert into public.listings (owner_id, title, location_text, price_kes, deposit_kes, bedrooms, bathrooms, availability_status, available_from)
  select id, 'Kileleshwa, studio', 'Kileleshwa', 22000, 44000, 0, 1, 'available_soon', '2026-10-01' from poster
  returning id, owner_id
),
listing3 as (
  insert into public.listings (owner_id, title, location_text, price_kes, deposit_kes, bedrooms, bathrooms, availability_status)
  select id, 'Roysambu, studio', 'Roysambu', 15000, 15000, 0, 1, 'occupied' from poster
  returning id, owner_id
),
listing4 as (
  insert into public.listings (owner_id, title, location_text, price_kes, deposit_kes, bedrooms, bathrooms, availability_status)
  select id, 'Nyeri outskirts, 3-bed bungalow', 'Nyeri', 35000, 70000, 3, 2, 'available' from poster
  returning id, owner_id
),
listing5 as (
  insert into public.listings (owner_id, title, location_text, price_kes, deposit_kes, bedrooms, bathrooms, availability_status)
  select id, 'Karen, modern 4-bed villa with pool', 'Karen', 250000, 500000, 4, 4, 'available' from poster
  returning id, owner_id
),
contacts as (
  insert into public.listing_contacts (listing_id, caretaker_name, caretaker_phone, agency_name, agency_phone)
  select id, 'Peter Mwangi', '254722111222', null, null from listing1
  union all
  select id, 'Grace Wambui', '254733222333', 'Kileleshwa Homes Agency', '254700111000' from listing2
  union all
  select id, 'Samuel Kiptoo', '254744333444', null, null from listing3
  union all
  select id, 'Mary Nyokabi', '254755444555', null, null from listing4
  union all
  select id, 'James Kariuki', '254766555666', 'Karen Prime Properties', '254700222111' from listing5
),
avail1 as (
  insert into public.availability_updates (listing_id, status, updated_by)
  select id, 'available', owner_id from listing1
),
avail2 as (
  insert into public.availability_updates (listing_id, status, updated_by)
  select id, 'available_soon', owner_id from listing2
),
avail3 as (
  insert into public.availability_updates (listing_id, status, updated_by)
  select id, 'occupied', owner_id from listing3
),
avail4 as (
  insert into public.availability_updates (listing_id, status, updated_by)
  select id, 'available', owner_id from listing4
),
avail5 as (
  insert into public.availability_updates (listing_id, status, updated_by)
  select id, 'available', owner_id from listing5
)
insert into public.reviews (listing_id, reviewer_id, caretaker_rating, repairs_rating, electricity_rating, water_rating, rent_fair_rating, deposit_returned, lived_duration_months, comment)
select listing1.id, reviewer.id, 4, 4, 3, 5, 4, true, 14, 'Lived here over a year, caretaker Peter is responsive. Power trips occasionally when it rains but otherwise solid.'
from listing1, reviewer
union all
select listing1.id, reviewer2.id, 5, 3, 4, 4, 3, true, 8, 'Good value for Kilimani. Repairs took a while when the shower broke but got sorted eventually.'
from listing1, reviewer2
union all
select listing3.id, reviewer.id, 2, 2, 3, 3, 2, false, 6, 'Caretaker was hard to reach and deposit was only partially refunded when I moved out.'
from listing3, reviewer;
