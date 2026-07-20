import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SUBSCRIPTION_PLANS } from "@/lib/stripe-config";
import { behaviourUpsell, lockedToolUpsell, type Upsell } from "@/lib/upsell-catalog";
import UpsellPopup from "@/components/UpsellPopup";

/**
 * In-app upsell manager. Enforces the frequency caps from the briefing (once per
 * session, ~3-day cooldown per upsell, cooldown after a dismiss) and exposes the
 * triggers: trackStudioUse (behaviour) and showLockedToolUpsell (locked click).
 * Never blocks the canvas — the popup is always dismissible.
 */

const GEN_THRESHOLD = 3;               // generations before a behaviour upsell
const COOLDOWN_MS = 3 * 24 * 60 * 60 * 1000; // per-upsell cooldown (~3 days)
const CAPS_KEY = "floowy_upsell_caps_v1";
const SESSION_KEY = "floowy_upsell_shown_session";

type Caps = Record<string, { last?: number; until?: number }>;

const readCaps = (): Caps => {
  try { return JSON.parse(localStorage.getItem(CAPS_KEY) || "{}"); } catch { return {}; }
};
const writeCaps = (c: Caps) => {
  try { localStorage.setItem(CAPS_KEY, JSON.stringify(c)); } catch { /* ignore */ }
};

const track = (event: string, upsell: Upsell) => {
  try {
    (window as any).dataLayer = (window as any).dataLayer || [];
    (window as any).dataLayer.push({
      event,
      upsell_id: upsell.id,
      upsell_trigger: upsell.trigger,
      upsell_to_plan: upsell.toTier,
    });
  } catch { /* ignore */ }
};

interface UpsellContextValue {
  /** Count a generation in a studio; may surface a behaviour upsell after N. */
  trackStudioUse: (studioId: string) => void;
  /** Show the contextual upsell for a locked tool. Returns true if shown. */
  showLockedToolUpsell: (toolId: string) => boolean;
}

const UpsellContext = createContext<UpsellContextValue>({
  trackStudioUse: () => {},
  showLockedToolUpsell: () => false,
});

export const useUpsell = () => useContext(UpsellContext);

export const UpsellProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [plan, setPlan] = useState<string | null>(null);
  const [current, setCurrent] = useState<Upsell | null>(null);
  const [open, setOpen] = useState(false);
  const genCounts = useRef<Record<string, number>>({});

  // Track the current user's plan (drives which upsells apply). Anonymous = null.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!session?.user) { setPlan(null); return; }
      const { data } = await supabase.from("profiles").select("plan").eq("id", session.user.id).maybeSingle();
      if (!cancelled) setPlan((data?.plan || "free").toLowerCase());
    };
    load();
    // Defer — load() runs supabase queries; calling it inside the callback deadlocks the auth lock.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => setTimeout(() => load(), 0));
    return () => { cancelled = true; subscription.unsubscribe(); };
  }, []);

  const canShow = useCallback((id: string): boolean => {
    if (sessionStorage.getItem(SESSION_KEY) === "1") return false; // one per session
    const caps = readCaps();
    const rec = caps[id];
    const now = Date.now();
    if (rec?.until && now < rec.until) return false;   // dismiss cooldown
    if (rec?.last && now - rec.last < COOLDOWN_MS) return false; // per-upsell cooldown
    return true;
  }, []);

  const request = useCallback((u: Upsell) => {
    if (!canShow(u.id)) return false;
    const caps = readCaps();
    caps[u.id] = { ...caps[u.id], last: Date.now() };
    writeCaps(caps);
    sessionStorage.setItem(SESSION_KEY, "1");
    setCurrent(u);
    setOpen(true);
    track("upsell_view", u);
    return true;
  }, [canShow]);

  const trackStudioUse = useCallback((studioId: string) => {
    genCounts.current[studioId] = (genCounts.current[studioId] || 0) + 1;
    if (genCounts.current[studioId] % GEN_THRESHOLD !== 0) return;
    const u = behaviourUpsell(plan, studioId);
    if (u) request(u);
  }, [plan, request]);

  const showLockedToolUpsell = useCallback((toolId: string): boolean => {
    const u = lockedToolUpsell(plan, toolId);
    return u ? request(u) : false;
  }, [plan, request]);

  const onDismiss = useCallback((stepReached: number) => {
    if (current) {
      const caps = readCaps();
      caps[current.id] = { ...caps[current.id], until: Date.now() + COOLDOWN_MS };
      writeCaps(caps);
      track("upsell_dismiss", { ...current });
    }
    setOpen(false);
    setTimeout(() => setCurrent(null), 250);
  }, [current]);

  const onUpgrade = useCallback(async (discounted: boolean): Promise<boolean> => {
    if (!current) return false;
    try {
      const priceId = SUBSCRIPTION_PLANS[current.toTier].monthly.priceId;
      let couponId: string | undefined;
      if (discounted) {
        const { data: cd } = await supabase.functions.invoke("ensure-upsell-coupon");
        couponId = cd?.couponId;
      }
      const { data, error } = await supabase.functions.invoke("change-subscription", { body: { priceId, couponId } });
      if (error) throw error;
      if (data?.url) { window.location.href = data.url; return true; }
      if (data?.success) {
        track("upsell_upgrade", current);
        // Refresh the tracked plan so gating updates without a reload.
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: p } = await supabase.from("profiles").select("plan").eq("id", session.user.id).maybeSingle();
          setPlan((p?.plan || current.toTier).toLowerCase());
        }
        return true;
      }
      toast({ title: "Could not upgrade", description: data?.message || "Please try again.", variant: "destructive" });
      return false;
    } catch {
      toast({ title: "Error", description: "Failed to upgrade. Please try again.", variant: "destructive" });
      return false;
    }
  }, [current, toast]);

  const onOpenStudio = useCallback(() => {
    const route = current?.openRoute;
    setOpen(false);
    setTimeout(() => setCurrent(null), 250);
    if (route) navigate(route);
  }, [current, navigate]);

  return (
    <UpsellContext.Provider value={{ trackStudioUse, showLockedToolUpsell }}>
      {children}
      {current && (
        <UpsellPopup
          upsell={current}
          open={open}
          onDismiss={onDismiss}
          onUpgrade={onUpgrade}
          onOpenStudio={onOpenStudio}
        />
      )}
    </UpsellContext.Provider>
  );
};
