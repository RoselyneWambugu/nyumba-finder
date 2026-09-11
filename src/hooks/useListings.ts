import { useCallback, useEffect, useState } from "react";
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

  useEffect(() => {
    fetchListings();

    // Live-update the list when any owner flips availability, so search results
    // reflect "still empty / just occupied" without a manual refresh.
    const channel = supabase
      .channel("listings-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "listings" }, () => {
        fetchListings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchListings]);

  return { listings, loading, error, refetch: fetchListings };
}
