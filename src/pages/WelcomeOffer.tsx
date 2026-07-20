import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SUBSCRIPTION_PLANS, UPSELL, nextTier, type PlanKey } from "@/lib/stripe-config";
import { useCountdown } from "@/hooks/useCountdown";
import { Check, X, Clock, Sparkles, Star, Lock, Info } from "lucide-react";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Sections 10 & 11 — post-purchase upsell sequence (real plans).
 * After the €1 purchase, offer an upgrade to the NEXT real tier above the plan
 * they chose, with that plan's real credits/price:
 *  - Step "ultra": full-page takeover — X% off the first month.
 *  - Step "addon": second-chance modal — 50% off the first 3 months.
 * Both modify the existing subscription in place via change-subscription.
 */
const WelcomeOffer = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<"ultra" | "addon">("ultra");
  const [planKey, setPlanKey] = useState<PlanKey>("starter");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from("profiles").select("plan").eq("id", user.id).single();
      const p = (profile?.plan as string | undefined)?.toLowerCase();
      if (p && p in SUBSCRIPTION_PLANS) setPlanKey(p as PlanKey);
    })();
  }, []);

  const current = SUBSCRIPTION_PLANS[planKey];
  const targetKey = nextTier(planKey);
  const target = SUBSCRIPTION_PLANS[targetKey];
  const finish = () => navigate("/home");

  // Upgrade the existing subscription to the target plan with a discount coupon.
  const upgrade = async (couponId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("change-subscription", {
        body: { priceId: target.monthly.priceId, couponId: couponId || undefined },
      });
      if (error) throw error;
      if (data?.url) { window.location.href = data.url; return; }
      toast({ title: "Upgrade complete", description: `${target.name} Monthly is now active.` });
      finish();
    } catch (err) {
      console.error("[WelcomeOffer] upgrade error", err);
      toast({ title: "Something went wrong", description: "Please try again.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {step === "ultra" ? (
        <Takeover current={current} target={target} onContinue={() => upgrade(UPSELL.ultraCouponId)} onSkip={() => setStep("addon")} />
      ) : (
        <>
          <Takeover current={current} target={target} onContinue={() => upgrade(UPSELL.ultraCouponId)} onSkip={() => {}} dimmed />
          <AddonModal target={target} onContinue={() => upgrade(UPSELL.addonCouponId)} onSkip={finish} />
        </>
      )}
    </div>
  );
};

type Plan = typeof SUBSCRIPTION_PLANS[PlanKey];

/* ── Section 10: full-page upgrade takeover ───────────────────────────────── */
const Takeover = ({ current, target, onContinue, onSkip, dimmed = false }: {
  current: Plan; target: Plan; onContinue: () => void; onSkip: () => void; dimmed?: boolean;
}) => {
  const { minutes, seconds } = useCountdown({ totalSeconds: UPSELL.ultraCountdownSeconds, persistKey: "floowy_ultra_countdown" });
  const pct = UPSELL.ultraDiscountPct;
  const firstMonth = Math.round(target.monthly.price * (1 - pct / 100));

  const currentFeatures = [
    { text: `Standard ${current.name} monthly plan`, included: true },
    { text: `${current.monthly.credits.toLocaleString()} credits per month`, included: true },
    { text: "Access to your plan's studios", included: true },
    { text: `Only ${current.monthly.credits.toLocaleString()} credits — vs ${target.monthly.credits.toLocaleString()} on ${target.name}`, included: false },
  ];

  return (
    <div className={`relative ${dimmed ? "pointer-events-none select-none blur-[2px] opacity-60" : ""}`}>
      <div className="flex items-center justify-between px-5 md:px-10 py-4 text-xs">
        <div className="flex items-center gap-3 md:gap-5 text-white/50">
          <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-primary-glow" /> Create an account</span>
          <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-primary-glow" /> Set up your plan</span>
          <span className="flex items-center gap-1.5 text-primary-glow font-semibold">Get maximum value</span>
        </div>
        <button onClick={onSkip} className="text-white/30 hover:text-white/60 transition-colors">Skip One-time Offer</button>
      </div>

      <div className="max-w-5xl mx-auto px-4 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/40 text-primary-glow text-xs font-bold mb-7">
          <Clock className="w-3.5 h-3.5" /> One-time offer expires in {pad(minutes)}:{pad(seconds)}
        </div>

        <h1 className="text-3xl md:text-5xl font-extrabold uppercase leading-tight mb-3">
          Exclusive <span className="text-primary-glow">{pct}% discount</span> to upgrade to{" "}
          <span className="text-primary-glow">{target.name}</span>
        </h1>
        <p className="text-sm md:text-base text-white/50 max-w-xl mx-auto mb-10">
          Unlock the {target.name} plan with {target.monthly.credits.toLocaleString()} credits/month —
          {pct}% off your first month, a price you'll only see once.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
          {/* Current plan */}
          <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-6">
            <div className="flex justify-center mb-3">
              <span className="bg-white/90 text-foreground text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">Current Plan</span>
            </div>
            <h3 className="text-2xl font-extrabold uppercase text-center mb-5">{current.name} Monthly Plan</h3>
            <Button disabled className="w-full mb-5 bg-white/5 text-white/40 border border-white/10 cursor-not-allowed">
              <Check className="w-4 h-4 mr-1.5" /> Already Purchased
            </Button>
            <ul className="space-y-2.5">
              {currentFeatures.map((f, i) => (
                <li key={i} className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm ${f.included ? "bg-white/[0.04] text-white/80" : "bg-white/[0.02] text-white/30"}`}>
                  {f.included ? <Check className="w-4 h-4 text-white/60 shrink-0" /> : <X className="w-4 h-4 text-white/25 shrink-0" />}
                  {f.text}
                </li>
              ))}
            </ul>
          </div>

          {/* Upgrade plan */}
          <div className="relative rounded-2xl bg-gradient-to-br from-primary/15 via-[#0d160f] to-[#0a0a0a] border-2 border-primary/50 p-6 shadow-glow">
            <div className="flex justify-center mb-3">
              <span className="bg-primary text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">{pct}% Discount</span>
            </div>
            <h3 className="text-2xl font-extrabold uppercase text-center mb-1">{target.name} Monthly Plan</h3>
            <p className="text-center text-sm text-white/60 mb-4">
              <span className="text-primary-glow font-bold text-lg">€{firstMonth}</span> first month
              <span className="line-through ml-2 text-white/35">€{target.monthly.price}</span>
            </p>
            <Button onClick={onContinue} className="w-full mb-5 bg-offer text-offer-foreground font-bold hover:bg-offer-hover h-11">
              Continue to Payment
            </Button>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-center gap-2.5 rounded-lg bg-white/[0.05] px-3 py-2.5">
                <Sparkles className="w-4 h-4 text-primary-glow shrink-0" />
                <span className="text-primary-glow font-semibold">GET {target.name.toUpperCase()} WITH {pct}% OFF</span>
                <span className="ml-auto bg-primary text-white text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">SPECIAL OFFER</span>
              </li>
              <li className="flex items-center gap-2.5 rounded-lg bg-white/[0.05] px-3 py-2.5">
                <Star className="w-4 h-4 text-primary-glow shrink-0" />
                <span className="text-white/90 font-semibold">{target.monthly.credits.toLocaleString()} credits per month</span>
              </li>
              <li className="flex items-center gap-2.5 rounded-lg bg-white/[0.05] px-3 py-2.5">
                <Star className="w-4 h-4 text-primary-glow shrink-0" />
                <span className="text-white/90 font-semibold">
                  +{(target.monthly.credits - current.monthly.credits).toLocaleString()} more credits than {current.name}
                </span>
              </li>
              <li className="flex items-center gap-2.5 rounded-lg bg-white/[0.05] px-3 py-2.5">
                <Star className="w-4 h-4 text-primary-glow shrink-0" />
                <span className="text-white/90 font-semibold">Access to all Floowy studios</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Section 11: second-chance modal ─────────────────────────────────────── */
const AddonModal = ({ target, onContinue, onSkip }: { target: Plan; onContinue: () => void; onSkip: () => void; }) => {
  const { minutes, seconds } = useCountdown({ totalSeconds: UPSELL.addonCountdownSeconds, persistKey: "floowy_addon_countdown" });
  const half = Math.round(target.monthly.price * (1 - UPSELL.addonDiscountPct / 100));
  const savings = (target.monthly.price - half) * UPSELL.addonMonths;
  const greyBars = [28, 34, 40, 46, 52, 60, 70];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" />
      <div className="relative w-full max-w-xl rounded-3xl bg-[#0d0d0d] border border-white/10 shadow-2xl p-6 md:p-8 animate-fade-in max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/40 text-primary-glow text-xs font-bold">
            <Clock className="w-3.5 h-3.5" /> One-time offer expires in {pad(minutes)}:{pad(seconds)}
          </div>
          <button onClick={onSkip} aria-label="Close" className="text-white/30 hover:text-white/60 transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <h2 className="text-2xl md:text-4xl font-extrabold uppercase leading-tight mb-2">
          Save <span className="text-primary-glow">€{savings}</span> on your first 3 months of{" "}
          <span className="text-primary-glow">{target.name}</span>
        </h2>
        <p className="text-sm text-white/50 mb-6">
          <span className="text-white/70 font-semibold">Heads up:</span> last chance —
          {UPSELL.addonDiscountPct}% off the {target.name} plan for {UPSELL.addonMonths} months.
        </p>

        <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-5 mb-6">
          <div className="text-primary-glow text-sm font-bold mb-4">Save €{savings}</div>
          <div className="flex items-end justify-between gap-2 h-40">
            {greyBars.map((h, i) => <div key={i} className="flex-1 rounded-t bg-white/10" style={{ height: `${h}%` }} />)}
            <div className="flex-1 rounded-t bg-primary shadow-glow" style={{ height: "100%" }} />
          </div>
          <div className="flex justify-between text-[11px] text-white/40 mt-3">
            <span>{target.monthly.credits.toLocaleString()} credits/mo</span>
            <span className="text-primary-glow font-bold">{UPSELL.addonDiscountPct}% OFF · 3 MONTHS</span>
          </div>
        </div>

        <Button onClick={onContinue} className="w-full bg-offer text-offer-foreground font-bold hover:bg-offer-hover h-12 text-base mb-3">
          <Lock className="w-4 h-4 mr-2" /> Get for €{half}/mo
          <span className="ml-2 text-offer-foreground/50 line-through font-semibold">€{target.monthly.price}</span>
        </Button>
        <button onClick={onSkip} className="w-full text-center text-sm text-white/40 hover:text-white/70 transition-colors py-2 mb-4">Skip the offer</button>

        <div className="rounded-xl bg-primary/5 border border-primary/20 px-4 py-2.5 text-center text-xs text-primary-glow flex items-center justify-center gap-2 mb-4">
          <Info className="w-3.5 h-3.5" /> {target.monthly.credits.toLocaleString()} credits/month on {target.name}
        </div>

        <p className="text-[11px] leading-relaxed text-white/30 text-center">
          Click "Get for €{half}/mo" to upgrade to {target.name}. You get {UPSELL.addonDiscountPct}% off for{" "}
          {UPSELL.addonMonths} months, then it renews at the standard €{target.monthly.price}/mo with{" "}
          {target.monthly.credits.toLocaleString()} credits.
        </p>
      </div>
    </div>
  );
};

export default WelcomeOffer;
