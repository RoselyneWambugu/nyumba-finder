-- Public bucket for listing photos. Files are uploaded by the app under
-- `<owner_id>/<listing_id>/<filename>` so the RLS policy can check ownership by path.
insert into storage.buckets (id, name, public)
values ('listing-photos', 'listing-photos', true)
on conflict (id) do nothing;

create policy "listing photos are publicly viewable"
on storage.objects for select
using (bucket_id = 'listing-photos');

create policy "authenticated users upload their own listing photos"
on storage.objects for insert
with check (
  bucket_id = 'listing-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "owners manage their own listing photo files"
on storage.objects for update using (
  bucket_id = 'listing-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "owners delete their own listing photo files"
on storage.objects for delete using (
  bucket_id = 'listing-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);
