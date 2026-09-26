-- Several UPDATE policies checked only that the CURRENT row belongs to the
-- caller, with no WITH CHECK on the resulting row. That let an owner reassign
-- listings.owner_id, listing_photos/listing_contacts.listing_id, or
-- reviews.listing_id/reviewer_id to a different target -- e.g. transplanting
-- a review onto someone else's listing, or handing a listing to another
-- account without their consent. These columns should never change after
-- the row is created, so enforce that directly with a trigger rather than
-- relying on RLS predicates (which can't easily compare old vs. new values).

create function prevent_column_change()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  col text;
begin
  foreach col in array TG_ARGV loop
    if to_jsonb(OLD) ->> col is distinct from to_jsonb(NEW) ->> col then
      raise exception '% cannot be changed after creation', col;
    end if;
  end loop;
  return NEW;
end;
$$;

create trigger listings_owner_immutable
  before update on listings
  for each row execute function prevent_column_change('owner_id');

create trigger listing_photos_listing_immutable
  before update on listing_photos
  for each row execute function prevent_column_change('listing_id');

create trigger listing_contacts_listing_immutable
  before update on listing_contacts
  for each row execute function prevent_column_change('listing_id');

create trigger reviews_immutable_fields
  before update on reviews
  for each row execute function prevent_column_change('listing_id', 'reviewer_id');
