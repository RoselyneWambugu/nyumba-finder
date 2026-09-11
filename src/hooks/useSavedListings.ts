import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/config/supabase";

export function useSavedListings(userId: string | undefined) {
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    if (!userId) {
      setSavedIds(new Set());
      return;
    }
    const { data } = await supabase.from("saved_listings").select("listing_id").eq("user_id", userId);
    setSavedIds(new Set((data ?? []).map((row) => row.listing_id)));
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function toggleSave(listingId: string) {
    if (!userId) return;
    const isSaved = savedIds.has(listingId);

    // Optimistic: the heart should flip instantly, matching the mock's client-side toggle.
    setSavedIds((prev) => {
      const next = new Set(prev);
      isSaved ? next.delete(listingId) : next.add(listingId);
      return next;
    });

    if (isSaved) {
      await supabase.from("saved_listings").delete().eq("user_id", userId).eq("listing_id", listingId);
    } else {
      await supabase.from("saved_listings").insert({ user_id: userId, listing_id: listingId });
    }
  }

  return { savedIds, toggleSave, refresh };
}
