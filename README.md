# Nyumba Finder

A mobile app for finding apartments in Kenya — built on tenant-reported listings
instead of landlord/agent posts. A tenant who's moving out (or knows of an empty
unit in their building) lists it, other tenants who've lived there leave honest
reviews (caretaker, repairs, electricity, water, rent fairness, deposit returned),
and the poster flips a single toggle to keep availability live. Caretaker/agency
contact info is unlocked with a KES 250/month subscription paid via M-Pesa.

See `design/DESIGN_HANDOFF.md` and `design/screenshots/` for the full design spec
this app is built against.

## Stack

- **App**: React Native + Expo (TypeScript), React Navigation
- **Backend**: Supabase (Postgres, Auth, Storage, Realtime, Edge Functions)
- **Payments**: Safaricom Daraja API (M-Pesa STK Push)

## Project layout

```
App.tsx                      # entry point
src/
  components/                # ListingCard, AvailabilityBadge, RatingBar, ...
  screens/                   # one file per screen
  hooks/                     # useAuth, useListings, useSubscription, ...
  navigation/RootNavigator.tsx
  config/supabase.ts         # Supabase client
  theme.ts                   # design tokens (colors, radii, spacing)
  types/                     # Database + domain types
supabase/
  migrations/                # SQL schema, RLS policies, storage bucket
  functions/                 # mpesa-stk-push, mpesa-callback edge functions
```

## Status

- **Supabase project**: live (`nyumba-finder`, ref `htltyfuidmdmblpztsqa`). All four
  migrations are applied and `supabase/seed.sql` has been run, so the project has 3
  demo users, 5 listings across Kilimani/Kileleshwa/Roysambu/Nyeri/Karen (one of
  each availability state), contacts, and a few reviews. `.env` in this repo (not
  committed) already points at it.
- **M-Pesa**: not wired up yet — the Daraja sandbox registration was flaky when last
  tried. `mpesa-stk-push` / `mpesa-callback` are written but not deployed, so the
  Subscription and Send-a-Tip screens won't complete a real payment until that's
  redone (see below).
- **Listing photos**: still placeholders. The 5 seeded listings have no photos yet —
  real photos need to go through the Storage API (RLS-gated by uploader), which
  needs either a real user session or the project's service-role key.

## Setup

### 1. Supabase project

Already provisioned for this repo (see Status above). To point at a different
project instead:

1. Create a project at [supabase.com](https://supabase.com).
2. Apply the schema in order: `supabase/migrations/0001_init.sql` through
   `0004_rls_performance_cleanup.sql` (`supabase link --project-ref <ref>` then
   `supabase db push`, or paste each file into the SQL editor).
3. Optionally run `supabase/seed.sql` for demo data.
4. Copy `.env.example` to `.env` and fill in `SUPABASE_URL` / `SUPABASE_ANON_KEY`
   from Settings → API.

### 2. M-Pesa (Daraja) credentials

1. Register an app at the [Safaricom Developer Portal](https://developer.safaricom.co.ke)
   to get sandbox `Consumer Key`/`Consumer Secret`, a test shortcode, and passkey.
2. Set them as Supabase Edge Function secrets (never in the app itself):
   ```
   supabase secrets set \
     MPESA_CONSUMER_KEY=... \
     MPESA_CONSUMER_SECRET=... \
     MPESA_SHORTCODE=... \
     MPESA_PASSKEY=... \
     MPESA_CALLBACK_URL=https://<project-ref>.functions.supabase.co/mpesa-callback \
     MPESA_ENV=sandbox
   ```
3. Deploy the functions:
   ```
   supabase functions deploy mpesa-stk-push
   supabase functions deploy mpesa-callback --no-verify-jwt
   ```
   (`mpesa-callback` must allow unauthenticated requests — Safaricom calls it directly.)

### 3. Run the app

```
npm install
npm start
```

Then press `i`/`a` in the Expo CLI, or scan the QR code with Expo Go.

## Notes

- `app.config.js` references `./assets/icon.png` for the app icon/splash, which doesn't
  exist yet (`assets/` is empty) — add real icon/splash assets before a native build;
  Metro bundling and `expo start` work fine without them in the meantime.
- All listing photos are placeholders (`src/components/PlaceholderPhoto.tsx`) until
  real photo uploads are tested end-to-end against a live Supabase Storage bucket.
- The subscription/tip payment flow polls `mpesa_transactions` for the callback
  result; swap this for a Supabase Realtime subscription once latency matters.
- `src/types/database.ts` is hand-written to match the SQL migrations. Once the
  Supabase project exists, regenerate it with:
  `supabase gen types typescript --project-id <ref> > src/types/database.ts`
