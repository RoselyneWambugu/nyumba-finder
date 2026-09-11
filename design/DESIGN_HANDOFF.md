# Handoff: Nyumba Finder — Mobile App Design

## Overview
Nyumba Finder is a peer-to-peer apartment listing app for Kenya. Instead of landlords/agents posting, current tenants who are moving out (or who know of an empty unit in their building) post the listing. Other tenants who lived there leave honest reviews. Caretaker/agency contact info is paywalled behind a KES 250/month subscription. The core value proposition is live, trustworthy availability status — not stale listing-site data.

## About the Design Files
The files in this bundle are **design references created in HTML** — high-fidelity mockups showing intended look, layout, copy, and basic interaction states. They are not production code to copy directly. The task is to **recreate these designs in the target codebase's environment** (React Native, Flutter, native iOS/Android, etc.) using its established patterns and libraries — or, if no mobile framework exists yet, to choose the most appropriate one and implement the designs there.

## Fidelity
**High-fidelity.** Colors, typography, spacing, and copy are final/near-final. Recreate pixel-accurately using the design tokens below, adapted to the target framework's layout system (flex/grid concepts map directly to most mobile UI frameworks).

## Screens / Views

All screens are mobile portrait, designed at a 360×780 logical viewport (roughly a mid-size Android/iPhone screen — scale proportionally for other device sizes).

1. **Onboarding 1–3** — 3-slide intro carousel. Full-bleed striped placeholder illustration (top ~460px), headline (24px/800 weight), subcopy (14px, secondary color), pagination dots. Slide 3 replaces dots with a primary "Get started" button.
   - Slide 1: "Real reviews from real tenants." / "No agent spin. Ratings on the caretaker, repairs, electricity and water come from people who actually lived there."
   - Slide 2: "Know before you move in." / "See if rent, deposits, water and power have been fair — and whether the unit is actually free right now."
   - Slide 3: "List your old place in minutes." / "Moving out? Help the next tenant find it — and get paid nothing, it's free to post."

2. **Sign Up / Login** — Segmented tab (Sign up / Log in), fields: Full name, Phone number (+254 prefix), Email, Password. Primary button "Create account". Footer link to switch mode.

3. **Home / Search** — Header with area name ("Nairobi") + avatar. Search bar (placeholder "Search by area, e.g. Kilimani"). Horizontal filter chip row: Location (active/accent), Price, Bedrooms, Availability. Scrollable listing card list. Each card:
   - Cover photo (130px tall)
   - "NEW" rotated sticker badge, top-left, on newly-posted listings only
   - Save/heart toggle icon, top-right, over photo
   - Price badge overlay, top-right, above the price
   - Live availability badge (small pulsing dot + label) bottom-left over photo — dot color: green = available now, amber = available from a date, gray = occupied
   - Title, location · bed count below photo
   - Bottom tab bar: Home / Listings / Profile

4. **Listing Detail** — Photo carousel (230px, dot pagination, back + save icons overlaid). Title/subtitle + price. 3-up stat grid (Bedrooms, Bathrooms, Deposit). Live availability card (pulsing dot, status, "Updated 2 hours ago" timestamp). "Posted by" row (avatar, name, "Tip [name]" button — see Send a Tip screen). Ratings section: 5 horizontal bar meters (Caretaker, Repairs, Electricity, Water, Rent fairness, each 0–5 scored) + a separate "Deposit returned" percentage stat. Full review list (avatar, name, months lived, star rating, comment, "Deposit returned" / "Deposit not returned in full" chip). Locked contact card at the bottom: shows a lock icon + "Unlock caretaker & agency contact" + "Subscribe to unlock — KES 250/mo" CTA when not subscribed; shows real caretaker/agency phone numbers when subscribed.

5. **Send a Tip** — Reached from the "Tip [name]" button on Listing Detail. Poster card (avatar, name, "Posted the listing that got you in"). Explainer copy ("100% goes to [name], no fees"). Preset amount pills (KES 50 / 100 / 200, one pre-selected) + custom amount field. M-Pesa phone number field. Primary button "Send KES [amount] tip".

6. **Add Listing — Step 1/4 (Basics)** — Progress bar (4 segments). Fields: Listing title, Location/estate, Rent/month, Deposit, Bedrooms stepper, Bathrooms stepper. "Continue" button.

7. **Add Listing — Step 2/4 (Photos)** — Progress bar. Copy: "Photos are the main thing tenants trust — add at least 4...". 2-column photo grid: filled placeholder tiles (living room / bedroom / kitchen) + a dashed "+" add tile. "Continue" button.

8. **Add Listing — Step 3/4 (Availability)** — Progress bar. Two selectable radio cards: "Already empty" (selected state shown) vs "Moving out on a set date". Helper note about flipping status later from My Listings. "Continue" button.

9. **Add Listing — Step 4/4 (Contacts)** — Progress bar (complete). Privacy note ("stays hidden... until they subscribe"). Fields: Caretaker name, Caretaker phone, Agency name (optional), Agency phone (optional). "Publish listing" button.

10. **My Listings** — List of the user's own posted listings. Each card: photo, title, "Last updated [time]" timestamp, and a big two-option segmented toggle — "Still empty" / "Now occupied" — the core one-tap freshness action. Bottom tab bar (Listings tab active).

11. **Write a Review** — Context line naming the listing. 5 slider-style rating rows (Caretaker, Repairs, Electricity, Water, Rent fairness; 0–5, draggable-handle visual). "Was your deposit returned?" Yes/No toggle. "Months lived there" field. Free-text comment textarea. "Submit review" button.

12. **Subscription / Plan** — Single highlighted plan card: "KES 250/month", bullet benefits. M-Pesa phone field. "Pay with M-Pesa" button. On tap (demo), a 3-step status list appears and progresses: "STK push sent" → "Confirm on your phone" → "Subscription active" (each step's dot fills green as it completes).

13. **Profile** — Avatar, name, phone. Subscription status card (active/renewal date, live pulsing dot). Menu rows: Edit profile, Payment history, Help & support, Terms & privacy. "Sign out" (muted red text, no fill).

## Interactions & Behavior (demonstrated in the HTML prototype)
- **Save/heart toggle**: tapping the heart icon on a listing card or the listing detail page toggles a filled/outlined state (client-side only in the mock).
- **Subscribe/unlock**: tapping the locked contact card's CTA toggles the listing detail contact card between locked (CTA) and unlocked (shows real phone numbers) — represents what happens after a successful subscription payment.
- **My Listings status toggle**: tapping "Still empty" / "Now occupied" switches the active segment instantly — this should be a single, immediate, optimistic-UI API call in production (no confirmation step), since one-tap freshness is the core value prop.
- **M-Pesa payment flow**: tapping "Pay with M-Pesa" on the Subscription screen animates through 3 states over ~2.8s (sent → confirm → active) as a stand-in for the real STK push / callback flow.
- **Live availability dot**: a small colored dot uses a ~2s pulsing box-shadow animation (`@keyframes livepulse`) anywhere availability is shown (home cards, listing detail, profile subscription status) — this pulse should be persistent/looping in production, not a one-off, to keep reinforcing "this is live data."

## State Management
Minimum state needed per screen:
- **Home/Search**: search query, active filters, listing list (with computed `isNew` and per-user `saved` flag), pagination/infinite scroll.
- **Listing Detail**: listing id, current viewer's subscription status (drives locked/unlocked contact card), saved/unsaved, photo carousel index.
- **Send a Tip**: selected preset amount or custom amount, M-Pesa number, payment status (idle/pending/success/failed).
- **Add Listing flow**: multi-step form state persisted across steps 1–4 until final submit.
- **My Listings**: per-listing status (empty/occupied) + last-updated timestamp, updated optimistically on toggle then confirmed by API.
- **Write a Review**: 5 numeric ratings (0–5), deposit-returned boolean, months-lived number, comment text.
- **Subscription**: current plan status, renewal date, M-Pesa payment state machine (idle → stk_sent → awaiting_confirmation → active/failed).
- **Profile**: user name/phone, subscription summary.

## Design Tokens

**Colors** (given as OKLCH; convert to hex/RGB as needed for the target platform):
- Background (screen): `oklch(0.975 0.006 60)` — warm off-white
- Canvas/page background (design-file only, not app UI): `oklch(0.93 0.006 60)`
- Card surface: `oklch(0.995 0.003 60)`
- Border/divider: `oklch(0.88 0.01 50)` (subtle), `oklch(0.9 0.008 50)` (card borders)
- Primary ink (headings/body): `oklch(0.22 0.015 50)`
- Secondary ink (labels/meta): `oklch(0.52 0.012 50)`
- Tertiary ink (placeholders): `oklch(0.68 0.01 50)`
- Accent (brand teal): `oklch(0.42 0.07 185)` — buttons, active states, links, price accents
- Accent tint (backgrounds): `oklch(0.94 0.03 185)`
- Live/positive green (available now, deposit-returned, subscription active): `oklch(0.6 0.15 150)`, tint `oklch(0.94 0.05 150)`
- Amber (available from a date): `oklch(0.68 0.14 70)`, tint `oklch(0.94 0.06 70)`
- Gray (occupied/inactive): `oklch(0.65 0.01 50)`
- Red (deposit not returned, sign out): `oklch(0.55 0.16 25)`, tint `oklch(0.94 0.05 25)`

**Typography**: Manrope (Google Font), weights 400/500/600/700/800. Headings 17–30px/800, body 13–15px/400–600, meta/labels 10.5–12.5px/700 (labels often uppercase with slight letter-spacing).

**Radii**: Cards/sections 12–18px, pills/badges 8–20px, phone-frame chrome 36px, small icon buttons 14–16px (circular).

**Shadows**: Card/phone-frame shadow `0 20px 40px rgba(0,0,0,0.12)` (design-file device mockup only); small overlay chips use a translucent dark scrim background rather than a shadow.

**Spacing**: Screen horizontal padding 20–24px. Card internal padding 12–16px. Vertical rhythm between sections ~14–22px.

## Assets
No real photography is used — all imagery in the prototype is a diagonal-stripe CSS placeholder (`repeating-linear-gradient`) with a monospace label (e.g. "living room", "product shot" equivalents) marking where a real photo goes. Replace every placeholder with real apartment photography before shipping; apartment photos are the primary trust signal in this product, so image quality matters more than any other visual element.

## Files
- `Nyumba Finder.dc.html` — full source for all 16 screens (single file; each screen is a labeled `data-screen-label` section within one scrollable gallery). Search this file for screen names in comments (`<!-- HOME / SEARCH -->` etc.) to find each screen's markup, and for the `class Component extends DCLogic` block for the toggle/demo logic described above.
