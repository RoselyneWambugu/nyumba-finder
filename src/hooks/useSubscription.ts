import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/config/supabase";
import type { Subscription } from "@/types";

export function useSubscription(userId: string | undefined) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) {
      setSubscription(null);
      setIsActive(false);
      setLoading(false);
      return;
    }
    setLoading(true);

    const [{ data: sub }, { data: activeFlag }] = await Promise.all([
      supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.rpc("has_active_subscription", { uid: userId })
    ]);

    setSubscription(sub ?? null);
    setIsActive(Boolean(activeFlag));
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { subscription, isActive, loading, refresh };
}
