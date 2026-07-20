import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Zap, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SUBSCRIPTION_PLANS, EURO1_OFFER, type PlanKey } from "@/lib/stripe-config";
import { useToast } from "@/hooks/use-toast";

const SNOOZE_KEY = "floowy_upgrade_banner_snooze";
const STATUS_KEY = "floowy_upgrade_banner_status";
const STATUS_TTL_MS = 15 * 60 * 1000;

const PLAN_KEYS: PlanKey[] = ["lite", "starter", "professional", "enterprise"];

function planFromPriceId(priceId: string | null): PlanKey | null {
  if (!priceId) return null;
  for (const key of PLAN_KEYS) {
    const p = SUBSCRIPTION_PLANS[key];
    if (p?.monthly?.priceId === priceId || p?.yearly?.priceId === priceId) return key;
  }
  return null;
}

/**
 * UX briefing Feature 1: sticky upgrade banner for €1-trial subscribers.
 * Explains why they only have the 10 starter credits, shows unlocked vs total,
 * and lets them pay the remaining plan balance in ONE click (ends the Stripe
 * trial immediately — the webhook then grants the full credit bundle).
 * Snoozable for 24h; disappears permanently once the plan is fully active.
 */
const UpgradePlanBanner = () => {
  const { pathname } = useLocation();
  const [plan, setPlan] = useState<PlanKey | null>(null);
  const [visible, setVisible] = useState(false);
  const [paying, setPaying] = useState(false);
  const { toast } = useToast();

  const evaluate = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setVisible(false); return; }

    const snooze = Number(localStorage.getItem(SNOOZE_KEY) || 0);
    if (snooze > Date.now()) { setVisible(false); return; }

    // Cache the Stripe lookup briefly so the banner doesn't hit the API on
    // every route change.
    let status: { trialing: boolean; trial_price_id: string | null } | null = null;
    try {
      const cached = JSON.parse(sessionStorage.getItem(STATUS_KEY) || "null");
      if (cached && cached.at > Date.now() - STATUS_TTL_MS) status = cached.value;
    } catch { /* ignore */ }

    if (!status) {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error || !data) { setVisible(false); return; }
      status = { trialing: !!data.trialing, trial_price_id: data.trial_price_id ?? null };
      sessionStorage.setItem(STATUS_KEY, JSON.stringify({ at: Date.now(), value: status }));
    }

    if (!status.trialing) { setVisible(false); return; }

    let key = planFromPriceId(status.trial_price_id);
    if (!key) {
      const { data: profile } = await supabase
        .from("profiles").select("plan").eq("id", session.user.id).single();
      key = (PLAN_KEYS as string[]).includes(profile?.plan) ? (profile!.plan as PlanKey) : null;
    }
    if (!key) { setVisible(false); return; }
    setPlan(key);
    setVisible(true);
  }, []);

  useEffect(() => { evaluate(); }, [evaluate]);

  const unlock = async () => {
    setPaying(true);
    try {
      const { data, error } = await supabase.functions.invoke("change-subscription", {
        body: { activateNow: true },
      });
      if (error || !data?.activated) throw new Error(error?.message || "Activation failed");
      sessionStorage.removeItem(STATUS_KEY);
      setVisible(false);
      // Credits were granted server-side — tell the header/credit displays to
      // refresh immediately so the new balance shows without a reload.
      window.dispatchEvent(new Event("credits:refresh"));
      toast({
        title: "Plan activated 🎉",
        description: "Payment confirmed — your full credits are being added now.",
      });
    } catch (e) {
      toast({
        title: "Payment failed",
        description: e instanceof Error ? e.message : "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setPaying(false);
    }
  };

  const snooze = () => {
    localStorage.setItem(SNOOZE_KEY, String(Date.now() + 24 * 60 * 60 * 1000));
    setVisible(false);
  };

  if (pathname.startsWith("/admin")) return null;
  if (!visible || !plan) return null;

  const total = SUBSCRIPTION_PLANS[plan].monthly.credits;
  const unlocked = EURO1_OFFER.trialCredits;
  const remaining = total - unlocked;
  const pct = Math.max(4, Math.round((unlocked / total) * 100));

  return (
    <div className="sticky top-0 z-[59] w-full border-b border-border bg-background shadow-sm">
      <div className="container mx-auto flex flex-col gap-2 px-4 py-2.5 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Zap className="h-4 w-4 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium sm:text-sm">
              You've unlocked <span className="font-bold text-primary">{unlocked}</span> of{" "}
              <span className="font-bold">{total}</span> credits. Complete your plan to get the rest — no need to wait 3 days.
            </p>
            <div className="mt-1 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <button
            onClick={unlock}
            disabled={paying}
            className="rounded-lg bg-offer px-4 py-2 text-xs font-bold text-offer-foreground transition hover:bg-offer-hover disabled:opacity-60 sm:text-sm"
          >
            {paying ? "Processing…" : `Unlock my ${remaining} credits now →`}
          </button>
          <button
            onClick={snooze}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            aria-label="Remind me later"
          >
            <X className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Remind me later</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpgradePlanBanner;
