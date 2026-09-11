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
- **M-Pesa**: both edge functions are deployed and ACTIVE on the live project, but
  no Daraja credentials are set yet — the Safaricom developer portal wasn't loading
  when last tried. Until `MPESA_CONSUMER_KEY` etc. are set as function secrets (see
  below), the Subscription and Send-a-Tip screens will call a live endpoint that
  fails cleanly rather than completing a real payment.
- **Listing photos**: still placeholders. The 5 seeded listings have no photos yet —
  real photos need to go through the Storage API (RLS-gated by uploader), which
  needs either a real user session or the project's service-role key.
- **App icon/splash**: generated placeholders in brand colors (`assets/icon.png`,
  `adaptive-icon.png`, `splash.png`, `favicon.png`) — a simple house pictogram, teal
  on cream. Fine for dev builds; swap for real branding before shipping.
- **Verified**: `npx tsc --noEmit` is clean, the app bundles through Metro for both
  Android and web targets, and the onboarding/auth screens render correctly in a
  browser smoke test. Live network calls from this sandboxed dev environment to
  Supabase are blocked by its egress policy (only the Supabase MCP tooling can
  reach it here) — this is a constraint of the container, not the app; it works
  normally from a real device or simulator on the internet.
- **One manual fix still needed**: enable "Leaked password protection" in the
  Supabase dashboard under Authentication → Policies → Password Security. No
  tool available in this session can toggle it, and it can't be set via SQL.

### Bug-fix pass (post-build review)

Found and fixed while reviewing the whole app before handoff:

- Listing detail and My Listings both rendered the *placeholder* graphic even for
  listings with real uploaded photos — neither screen actually read `listing_photos[].url`.
- Realtime was never enabled for `listings` on the Supabase side (tables aren't in
  the realtime publication by default), so the "live availability updates without
  a manual refresh" subscription in `useListings` silently did nothing. Fixed with
  `0005_enable_realtime_listings.sql`.
- Sign-up gave zero feedback when Supabase requires email confirmation (no session
  comes back) — the screen just sat there looking broken. Now shows a "check your
  email" message and switches to the Log in tab.
- Add Listing had no validation: an empty rent field silently became `KES 0`
  (`Number("")` is `0`, not `NaN`), and a listing could publish with a blank title.
  Now validates title/location/price/deposit before continuing, and validates the
  move-out date format for "available soon" listings.
- Subscription and Send-a-Tip silently did nothing if you tapped Pay/Send with an
  empty phone number or invalid amount — now shows a clear alert instead.
- The Location/Price filter sheets in the search filter bar could show a stale
  value if you typed directly into the main search bar first, then opened the
  sheet — its draft state wasn't re-synced on open.
- Bottom tab bar had no icons (React Navigation's default is a title-only tab) —
  added icons matching the design using `@expo/vector-icons` (already bundled
  with Expo, no new dependency).

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

- All listing photos are placeholders (`src/components/PlaceholderPhoto.tsx`) until
  real photo uploads are tested end-to-end against a live Supabase Storage bucket.
- The subscription/tip payment flow polls `mpesa_transactions` for the callback
  result; swap this for a Supabase Realtime subscription once latency matters.
- `src/types/database.ts` is hand-written to match the SQL migrations. Once the
  Supabase project exists, regenerate it with:
  `supabase gen types typescript --project-id <ref> > src/types/database.ts`
