-- WriteReviewScreen hides the "Write a review" button for a listing's own
-- owner, but that's a UI convenience only -- nothing stopped a poster from
-- calling the API directly and reviewing their own listing. Since the whole
-- product pitch is "real reviews from real tenants," this needs a real,
-- server-side guarantee, not just a hidden button.
--
-- security definer so the ownership check doesn't depend on whether the
-- reviewer's own RLS visibility happens to include the listing row.
create function prevent_self_review()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if exists (
    select 1 from listings where id = new.listing_id and owner_id = new.reviewer_id
  ) then
    raise exception 'You cannot review your own listing';
  end if;
  return new;
end;
$$;

create trigger reviews_no_self_review
  before insert on reviews
  for each row execute function prevent_self_review();
