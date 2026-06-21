import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * useSubscriptionStatus
 *
 * Returns whether the current user has an active Stripe subscription.
 * Used to decide whether to apply a watermark to generated images and
 * whether to gate downloads / edits behind the upgrade paywall.
 *
 * Result is cached in sessionStorage for 60s to avoid hammering Stripe
 * across navigations.
 */

const CACHE_KEY = "floowy:subscribed";
const CACHE_TTL_MS = 60_000;

type CacheEntry = { subscribed: boolean; ts: number };

function readCache(): CacheEntry | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry;
    if (Date.now() - parsed.ts > CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(subscribed: boolean) {
  try {
    sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ subscribed, ts: Date.now() }),
    );
  } catch {
    /* no-op */
  }
}

export function useSubscriptionStatus() {
  const [subscribed, setSubscribed] = useState<boolean | null>(() => {
    const c = readCache();
    return c ? c.subscribed : null;
  });
  const [loading, setLoading] = useState(subscribed === null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      // Admin override: admins always get clean output
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setSubscribed(false);
        writeCache(false);
        return;
      }
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);
      if (roles?.some((r) => r.role === "admin")) {
        setSubscribed(true);
        writeCache(true);
        return;
      }

      // Primary source of truth: profiles.plan. Anything other than
      // 'free' (starter, professional, enterprise, etc.) counts as paid.
      // This avoids watermarking paid users when the Stripe lookup is
      // slow, fails, or the customer email doesn't match exactly.
      const { data: profile } = await supabase
        .from("profiles")
        .select("plan")
        .eq("id", session.user.id)
        .maybeSingle();

      const plan = (profile?.plan ?? "free").toLowerCase();
      const value = plan !== "free";
      setSubscribed(value);
      writeCache(value);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (subscribed === null) {
      void refresh();
    }
  }, [subscribed, refresh]);

  // Refresh on auth changes
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      sessionStorage.removeItem(CACHE_KEY);
      void refresh();
    });
    return () => sub.subscription.unsubscribe();
  }, [refresh]);

  return {
    subscribed: subscribed ?? false,
    isPaid: subscribed ?? false,
    isFree: subscribed === false,
    loading,
    refresh,
  };
}