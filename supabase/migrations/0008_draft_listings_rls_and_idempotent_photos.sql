-- AddListingScreen published a listing via several separate inserts (listing,
-- then per-photo uploads, then contacts, then an availability record) with no
-- atomicity. A failure partway through (very plausible on mobile data) left a
-- live, publicly-visible listing missing contacts/photos, and tapping
-- "Publish" again created a second, duplicate listing rather than resuming.
--
-- Fix: listings are now inserted as 'draft' first and only flipped to a real
-- status (via the existing apply_availability_update trigger) once every step
-- succeeds. Hide drafts from the public so a failed/incomplete publish is
-- invisible instead of live. The owner can still see their own draft so a
-- retry can resume it.
drop policy "listings are publicly readable" on listings;
create policy "listings are publicly readable" on listings for select using (
  availability_status <> 'draft' or (select auth.uid()) = owner_id
);

-- A retry resumes the same draft listing (same id) and re-runs the photo
-- upload loop; without this, re-running it would insert duplicate
-- listing_photos rows per position instead of upserting over the originals.
alter table listing_photos add constraint listing_photos_listing_position_key unique (listing_id, position);
