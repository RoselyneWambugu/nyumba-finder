-- Nyumba Finder initial schema
-- Apply with: supabase db push  (or paste into the Supabase SQL editor)

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type availability_status as enum ('available', 'available_soon', 'occupied');
create type subscription_status as enum ('pending', 'active', 'expired');
create type mpesa_status as enum ('pending', 'success', 'failed');
create type mpesa_purpose as enum ('subscription', 'tip');

-- ---------------------------------------------------------------------------
-- profiles: one row per auth.users, created by a trigger on signup
-- ---------------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  created_at timestamptz not null default now()
);

create function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'phone');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ---------------------------------------------------------------------------
-- listings
-- ---------------------------------------------------------------------------
create table listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles (id) on delete cascade,
  title text not null,
  description text,
  location_text text not null,
  latitude double precision,
  longitude double precision,
  price_kes numeric not null check (price_kes >= 0),
  deposit_kes numeric check (deposit_kes >= 0),
  bedrooms smallint not null check (bedrooms >= 0),
  bathrooms smallint check (bathrooms >= 0),
  availability_status availability_status not null default 'available',
  available_from date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index listings_location_idx on listings using gin (to_tsvector('simple', location_text));
create index listings_price_idx on listings (price_kes);
create index listings_status_idx on listings (availability_status);

create function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger listings_set_updated_at
  before update on listings
  for each row execute procedure set_updated_at();

-- ---------------------------------------------------------------------------
-- listing_photos
-- ---------------------------------------------------------------------------
create table listing_photos (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings (id) on delete cascade,
  url text not null,
  position smallint not null default 0,
  created_at timestamptz not null default now()
);

create index listing_photos_listing_idx on listing_photos (listing_id);

-- ---------------------------------------------------------------------------
-- listing_contacts: split out from `listings` so it can carry its own RLS
-- (contact info is only readable by the owner or an active subscriber).
-- ---------------------------------------------------------------------------
create table listing_contacts (
  listing_id uuid primary key references listings (id) on delete cascade,
  caretaker_name text,
  caretaker_phone text,
  agency_name text,
  agency_phone text
);

-- ---------------------------------------------------------------------------
-- reviews
-- ---------------------------------------------------------------------------
create table reviews (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings (id) on delete cascade,
  reviewer_id uuid not null references profiles (id) on delete cascade,
  caretaker_rating smallint not null check (caretaker_rating between 0 and 5),
  repairs_rating smallint not null check (repairs_rating between 0 and 5),
  electricity_rating smallint not null check (electricity_rating between 0 and 5),
  water_rating smallint not null check (water_rating between 0 and 5),
  rent_fair_rating smallint not null check (rent_fair_rating between 0 and 5),
  deposit_returned boolean,
  lived_duration_months smallint check (lived_duration_months >= 0),
  comment text,
  created_at timestamptz not null default now(),
  unique (listing_id, reviewer_id)
);

create index reviews_listing_idx on reviews (listing_id);

-- ---------------------------------------------------------------------------
-- availability_updates: append-only history; also drives listings.availability_status
-- ---------------------------------------------------------------------------
create table availability_updates (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings (id) on delete cascade,
  status availability_status not null,
  note text,
  updated_by uuid not null references profiles (id),
  created_at timestamptz not null default now()
);

create index availability_updates_listing_idx on availability_updates (listing_id, created_at desc);

create function apply_availability_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update listings set availability_status = new.status where id = new.listing_id;
  return new;
end;
$$;

create trigger availability_updates_apply
  after insert on availability_updates
  for each row execute procedure apply_availability_update();

-- ---------------------------------------------------------------------------
-- saved_listings: per-user heart/save toggle
-- ---------------------------------------------------------------------------
create table saved_listings (
  user_id uuid not null references profiles (id) on delete cascade,
  listing_id uuid not null references listings (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

-- ---------------------------------------------------------------------------
-- subscriptions: the KES 250/month plan. Rows are written only by the
-- mpesa-callback edge function (service role), never directly by clients.
-- ---------------------------------------------------------------------------
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  status subscription_status not null default 'pending',
  plan_code text not null default 'basic_250',
  started_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index subscriptions_user_idx on subscriptions (user_id, created_at desc);

create function has_active_subscription(uid uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from subscriptions
    where user_id = uid
      and status = 'active'
      and expires_at > now()
  );
$$;

-- ---------------------------------------------------------------------------
-- mpesa_transactions: one row per Daraja STK push, for both the subscription
-- payment and the "tip a poster" flow. Written only by edge functions.
-- ---------------------------------------------------------------------------
create table mpesa_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  purpose mpesa_purpose not null,
  amount_kes numeric not null check (amount_kes > 0),
  phone text not null,
  status mpesa_status not null default 'pending',
  checkout_request_id text unique,
  merchant_request_id text,
  receipt_number text,
  listing_id uuid references listings (id),
  recipient_id uuid references profiles (id),
  raw_callback jsonb,
  created_at timestamptz not null default now()
);

create index mpesa_transactions_user_idx on mpesa_transactions (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table profiles enable row level security;
alter table listings enable row level security;
alter table listing_photos enable row level security;
alter table listing_contacts enable row level security;
alter table reviews enable row level security;
alter table availability_updates enable row level security;
alter table saved_listings enable row level security;
alter table subscriptions enable row level security;
alter table mpesa_transactions enable row level security;

-- profiles: publicly readable (names shown on listings/reviews), self-editable
create policy "profiles are publicly readable" on profiles for select using (true);
create policy "users manage their own profile" on profiles for update using (auth.uid() = id);

-- listings: publicly readable (it's a discovery product), only the owner can write
create policy "listings are publicly readable" on listings for select using (true);
create policy "owners insert their own listings" on listings for insert with check (auth.uid() = owner_id);
create policy "owners update their own listings" on listings for update using (auth.uid() = owner_id);
create policy "owners delete their own listings" on listings for delete using (auth.uid() = owner_id);

-- listing_photos: publicly readable, only the parent listing's owner can write
create policy "listing photos are publicly readable" on listing_photos for select using (true);
create policy "owners manage their listing photos" on listing_photos for all using (
  exists (select 1 from listings l where l.id = listing_id and l.owner_id = auth.uid())
);

-- listing_contacts: the core paywall. Visible to the listing owner or an active subscriber only.
create policy "contacts visible to owner or subscriber" on listing_contacts for select using (
  exists (select 1 from listings l where l.id = listing_id and l.owner_id = auth.uid())
  or has_active_subscription(auth.uid())
);
create policy "owners manage their listing contacts" on listing_contacts for all using (
  exists (select 1 from listings l where l.id = listing_id and l.owner_id = auth.uid())
);

-- reviews: publicly readable (social proof drives signups), authors manage their own
create policy "reviews are publicly readable" on reviews for select using (true);
create policy "authenticated users can review" on reviews for insert with check (auth.uid() = reviewer_id);
create policy "authors update their own review" on reviews for update using (auth.uid() = reviewer_id);
create policy "authors delete their own review" on reviews for delete using (auth.uid() = reviewer_id);

-- availability_updates: publicly readable, only the listing owner can post an update
create policy "availability history is publicly readable" on availability_updates for select using (true);
create policy "owners post availability updates" on availability_updates for insert with check (
  auth.uid() = updated_by
  and exists (select 1 from listings l where l.id = listing_id and l.owner_id = auth.uid())
);

-- saved_listings: private to each user
create policy "users manage their own saved listings" on saved_listings for all using (auth.uid() = user_id);

-- subscriptions: users can read their own; writes come only from the service role (edge functions)
create policy "users read their own subscriptions" on subscriptions for select using (auth.uid() = user_id);

-- mpesa_transactions: users can read their own; writes come only from the service role
create policy "users read their own mpesa transactions" on mpesa_transactions for select using (auth.uid() = user_id);
