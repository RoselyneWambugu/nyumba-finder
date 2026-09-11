import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/config/supabase";
import type { Review } from "@/types";

export interface ReviewWithReviewer extends Review {
  profiles: { full_name: string | null } | null;
}

export function useReviews(listingId: string) {
  const [reviews, setReviews] = useState<ReviewWithReviewer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("reviews")
      .select("*, profiles(full_name)")
      .eq("listing_id", listingId)
      .order("created_at", { ascending: false });
    setReviews((data as unknown as ReviewWithReviewer[]) ?? []);
    setLoading(false);
  }, [listingId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  async function submitReview(input: Omit<Review, "id" | "created_at" | "listing_id" | "reviewer_id">) {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("Must be signed in to leave a review");

    const { error } = await supabase.from("reviews").upsert(
      {
        ...input,
        listing_id: listingId,
        reviewer_id: userData.user.id
      },
      { onConflict: "listing_id,reviewer_id" }
    );
    if (error) throw error;
    await fetchReviews();
  }

  return { reviews, loading, submitReview, refetch: fetchReviews };
}
