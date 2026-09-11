-- The app subscribes to postgres_changes on `listings` (src/hooks/useListings.ts)
-- to keep search results live when a poster flips availability. Supabase tables
-- aren't in the realtime publication by default, so without this the
-- subscription silently never fires.
alter publication supabase_realtime add table listings;
