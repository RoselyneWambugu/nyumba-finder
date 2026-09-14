import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/config/supabase";
import type { ListingFilters, ListingWithPhotos } from "@/types";

export function useListings(filters: ListingFilters) {
  const [listings, setListings] = useState<ListingWithPhotos[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError(null);

    let query = supabase
      .from("listings")
      .select("*, listing_photos(*)")
      .order("created_at", { ascending: false });

    if (filters.location) {
      query = query.ilike("location_text", `%${filters.location}%`);
    }
    if (filters.minPrice != null) {
      query = query.gte("price_kes", filters.minPrice);
    }
    if (filters.maxPrice != null) {
      query = query.lte("price_kes", filters.maxPrice);
    }
    if (filters.bedrooms != null) {
      query = query.eq("bedrooms", filters.bedrooms);
    }
    if (filters.availability) {
      query = query.eq("availability_status", filters.availability);
    }

    const { data, error: queryError } = await query;
    if (queryError) {
      setError(queryError.message);
    } else {
      setListings((data as unknown as ListingWithPhotos[]) ?? []);
    }
    setLoading(false);
  }, [filters.location, filters.minPrice, filters.maxPrice, filters.bedrooms, filters.availability]);

  // Re-fetch whenever the filters (and therefore fetchListings) change.
  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // Subscribe to live availability changes exactly once per mount, independent
  // of filter changes. A ref keeps the callback pointed at the latest
  // fetchListings without needing to tear down and resubscribe the channel —
  // doing that on every filter change (e.g. every keystroke in the search bar)
  // raced the channel's async unsubscribe and threw "cannot add postgres_changes
  // callbacks ... after subscribe()". The random suffix also protects against
  // React's dev-mode double-invoked effects colliding on the same channel name.
  const fetchListingsRef = useRef(fetchListings);
  fetchListingsRef.current = fetchListings;

  useEffect(() => {
    const channel = supabase
      .channel(`listings-changes-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "listings" }, () => {
        fetchListingsRef.current();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { listings, loading, error, refetch: fetchListings };
}
