import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  SUBSCRIPTION_PLANS,
  ULTRA_UPSELL,
  ADDON_UPSELL,
} from "@/lib/stripe-config";
import { useCountdown } from "@/hooks/useCountdown";
import {
  Check,
  X,
  Clock,
  Sparkles,
  Infinity as InfinityIcon,
  Lock,
  Info,
} from "lucide-react";

const pad = (n: number) => String(n).padStart(2, "0");

type PlanKey = "lite" | "starter" | "professional";

/**
 * Sections 10 & 11 — post-purchase upsell sequence.
 * Shown after a successful €1 purchase, before the dashboard.
 *  - Step "ultra": full-page "Secret Ultra Plan" takeover (Section 10)
 *  - Step "addon": second-chance "Save €X / 3X" modal (Section 11), only if
 *    the user skips the Ultra offer.
 * Both "Continue to Payment" actions call create-checkout when the Stripe
 * price/coupon are configured (Phase 2); otherwise they fall through to the
 * dashboard so the flow never dead-ends.
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
      const { data: profile } = await supabase
        .from("profiles")
        .select("plan")
        .eq("id", user.id)
        .single();
      const p = (profile?.plan as string | undefined)?.toLowerCase();
      if (p === "lite" || p === "starter" || p === "professional") {
        setPlanKey(p);
      }
    })();
  }, []);

  const finish = () => navigate("/home");

  // Upgrade the user's EXISTING €1 subscription to Ultra (modify in place, no
  // second subscription). The discount coupon is applied to the upgrade invoice.
  // change-subscription returns { success } when it modified the live sub, or
  // { url } if the user somehow has no active sub yet (falls back to checkout).
  const upgradeToUltra = async (couponId: string, label: string) => {
    if (!ULTRA_UPSELL.priceId) {
      toast({ title: "Almost there", description: "Taking you to your dashboard…" });
      finish();
      return;
    }
    try {
      const { data, error } = await supabase.functions.invoke("change-subscription", {
        body: { priceId: ULTRA_UPSELL.priceId, couponId: couponId || undefined },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      toast({ title: "Upgrade complete", description: `${label} is now active.` });
      finish();
    } catch (err) {
      console.error("[WelcomeOffer] ultra upgrade error", err);
      toast({ title: "Something went wrong", description: "Please try again.", variant: "destructive" });
    }
  };

  const buyUltra = () => upgradeToUltra(ULTRA_UPSELL.couponId, "Ultra Monthly Plan");
  const buyAddon = () => upgradeToUltra(ADDON_UPSELL.couponId, "Ultra add-on");

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {step === "ultra" ? (
        <UltraTakeover
          planKey={planKey}
          onContinue={buyUltra}
          onSkip={() => setStep("addon")}
        />
      ) : (
        <>
          {/* keep the takeover dimly behind the modal for visual continuity */}
          <UltraTakeover planKey={planKey} onContinue={buyUltra} onSkip={() => {}} dimmed />
          <AddonModal onContinue={buyAddon} onSkip={finish} />
        </>
      )}
    </div>
  );
};

/* ── Section 10: Ultra full-page takeover ─────────────────────────────────── */

const UltraTakeover = ({
  planKey,
  onContinue,
  onSkip,
  dimmed = false,
}: {
  planKey: PlanKey;
  onContinue: () => void;
  onSkip: () => void;
  dimmed?: boolean;
}) => {
  const { minutes, seconds } = useCountdown({
    totalSeconds: ULTRA_UPSELL.countdownSeconds,
    persistKey: "floowy_ultra_countdown",
  });
  const plan = SUBSCRIPTION_PLANS[planKey];

  const currentFeatures = [
    { text: `Standard ${plan.name} monthly plan`, included: true },
    { text: `${plan.monthly.credits.toLocaleString()} credits per month`, included: true },
    { text: "Access to your plan's studios", included: true },
    { text: "No additional monthly unlimited models", included: false },
  ];

  return (
    <div className={`relative ${dimmed ? "pointer-events-none select-none blur-[2px] opacity-60" : ""}`}>
      {/* Progress + skip */}
      <div className="flex items-center justify-between px-5 md:px-10 py-4 text-xs">
        <div className="flex items-center gap-3 md:gap-5 text-white/50">
          <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-primary-glow" /> Create an account</span>
          <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-primary-glow" /> Set up your plan</span>
          <span className="flex items-center gap-1.5 text-primary-glow font-semibold">Get maximum value</span>
        </div>
        <button onClick={onSkip} className="text-white/30 hover:text-white/60 transition-colors">
          Skip One-time Offer
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4 pb-16 text-center">
        {/* Countdown pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/40 text-primary-glow text-xs font-bold mb-7">
          <Clock className="w-3.5 h-3.5" />
          One-time offer Expires in {pad(minutes)}:{pad(seconds)}
        </div>

        <h1 className="text-3xl md:text-5xl font-extrabold uppercase leading-tight mb-3">
          Exclusive <span className="text-primary-glow">{ULTRA_UPSELL.discountPct}% discount</span> to get{" "}
          <span className="text-primary-glow">secret</span> ultra plan offer
        </h1>
        <p className="text-sm md:text-base text-white/50 max-w-xl mx-auto mb-10">
          Unlock "Secret" Ultra Monthly offer with additional value — for a price you will never see again.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
          {/* Current plan card */}
          <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-6">
            <div className="flex justify-center mb-3">
              <span className="bg-white/90 text-foreground text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                Current Plan
              </span>
            </div>
            <h3 className="text-2xl font-extrabold uppercase text-center mb-5">{plan.name} Monthly Plan</h3>
            <Button disabled className="w-full mb-5 bg-white/5 text-white/40 border border-white/10 cursor-not-allowed">
              <Check className="w-4 h-4 mr-1.5" /> Already Purchased
            </Button>
            <ul className="space-y-2.5">
              {currentFeatures.map((f, i) => (
                <li
                  key={i}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm ${
                    f.included ? "bg-white/[0.04] text-white/80" : "bg-white/[0.02] text-white/30"
                  }`}
                >
                  {f.included ? (
                    <Check className="w-4 h-4 text-white/60 shrink-0" />
                  ) : (
                    <X className="w-4 h-4 text-white/25 shrink-0" />
                  )}
                  {f.text}
                </li>
              ))}
            </ul>
          </div>

          {/* Ultra upgrade card */}
          <div className="relative rounded-2xl bg-gradient-to-br from-primary/15 via-[#0d160f] to-[#0a0a0a] border-2 border-primary/50 p-6 shadow-glow">
            <div className="flex justify-center mb-3">
              <span className="bg-primary text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                {ULTRA_UPSELL.discountPct}% Discount
              </span>
            </div>
            <h3 className="text-2xl font-extrabold uppercase text-center mb-5">Ultra Monthly Plan</h3>
            <Button
              onClick={onContinue}
              className="w-full mb-5 bg-primary text-primary-foreground font-bold hover:bg-primary/90 h-11"
            >
              Continue to Payment
            </Button>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-center gap-2.5 rounded-lg bg-white/[0.05] px-3 py-2.5">
                <Sparkles className="w-4 h-4 text-primary-glow shrink-0" />
                <span className="text-primary-glow font-semibold">
                  GET ULTRA MONTHLY WITH {ULTRA_UPSELL.discountPct}% OFF
                </span>
                <span className="ml-auto bg-primary text-white text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                  SPECIAL OFFER
                </span>
              </li>
              <li className="flex items-center gap-2.5 rounded-lg bg-white/[0.05] px-3 py-2.5">
                <InfinityIcon className="w-4 h-4 text-primary-glow shrink-0" />
                <span className="text-white/90 font-semibold">
                  {ULTRA_UPSELL.credits.toLocaleString()} credits per month
                </span>
              </li>
              <li className="flex items-center gap-2.5 rounded-lg bg-white/[0.05] px-3 py-2.5">
                <InfinityIcon className="w-4 h-4 text-primary-glow shrink-0" />
                <span className="text-white/90 font-semibold">30-day unlimited generations</span>
              </li>
              <li className="flex items-center gap-2.5 rounded-lg bg-white/[0.05] px-3 py-2.5">
                <InfinityIcon className="w-4 h-4 text-primary-glow shrink-0" />
                <span className="text-white/90 font-semibold">Access to ALL Floowy studios</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Section 11: Add-on second-chance modal ──────────────────────────────── */

const AddonModal = ({
  onContinue,
  onSkip,
}: {
  onContinue: () => void;
  onSkip: () => void;
}) => {
  const { minutes, seconds } = useCountdown({
    totalSeconds: ADDON_UPSELL.countdownSeconds,
    persistKey: "floowy_addon_countdown",
  });

  // Decorative bar-chart heights (without add-on → with add-on x3).
  const greyBars = [28, 34, 40, 46, 52, 60, 70];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" />
      <div className="relative w-full max-w-xl rounded-3xl bg-[#0d0d0d] border border-white/10 shadow-2xl p-6 md:p-8 animate-fade-in max-h-[92vh] overflow-y-auto">
        {/* Countdown + close */}
        <div className="flex items-center justify-between mb-5">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/40 text-primary-glow text-xs font-bold">
            <Clock className="w-3.5 h-3.5" />
            One-time offer Expires in {pad(minutes)}:{pad(seconds)}
          </div>
          <button onClick={onSkip} aria-label="Close" className="text-white/30 hover:text-white/60 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <h2 className="text-2xl md:text-4xl font-extrabold uppercase leading-tight mb-2">
          Save <span className="text-primary-glow">€{ADDON_UPSELL.savings}</span> and get{" "}
          <span className="text-primary-glow">3X</span> better results with Ultra upgrade
        </h2>
        <p className="text-sm text-white/50 mb-6">
          <span className="text-white/70 font-semibold">Heads up:</span> We really want you to
          succeed, so we're adding an extra {ADDON_UPSELL.additionalDiscountPct}% discount.
        </p>

        {/* Bar chart visual */}
        <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-5 mb-6">
          <div className="text-primary-glow text-sm font-bold mb-4">Save €{ADDON_UPSELL.savings}</div>
          <div className="flex items-end justify-between gap-2 h-40">
            {greyBars.map((h, i) => (
              <div key={i} className="flex-1 rounded-t bg-white/10" style={{ height: `${h}%` }} />
            ))}
            <div className="flex-1 rounded-t bg-primary shadow-glow" style={{ height: "100%" }} />
          </div>
          <div className="flex justify-between text-[11px] text-white/40 mt-3">
            <span>WITHOUT ADD-ON</span>
            <span className="text-primary-glow font-bold">WITH ADD-ON x3</span>
          </div>
        </div>

        <Button
          onClick={onContinue}
          className="w-full bg-primary text-primary-foreground font-bold hover:bg-primary/90 h-12 text-base mb-3"
        >
          <Lock className="w-4 h-4 mr-2" />
          Get for €{ADDON_UPSELL.price}{" "}
          <span className="ml-2 text-primary-foreground/50 line-through font-semibold">€{ADDON_UPSELL.originalPrice}</span>
        </Button>
        <button
          onClick={onSkip}
          className="w-full text-center text-sm text-white/40 hover:text-white/70 transition-colors py-2 mb-4"
        >
          Skip the offer
        </button>

        <div className="rounded-xl bg-primary/5 border border-primary/20 px-4 py-2.5 text-center text-xs text-primary-glow flex items-center justify-center gap-2 mb-4">
          <Info className="w-3.5 h-3.5" />
          Get Unlimited Video Models, +1800 credits and more
        </div>

        <p className="text-[11px] leading-relaxed text-white/30 text-center">
          Click "Get for €{ADDON_UPSELL.price}" to complete the one-time €{ADDON_UPSELL.price} Ultra
          add-on. Unlimited models last 1 month; your subscription then renews at the standard
          plan rate with your monthly credits.
        </p>
      </div>
    </div>
  );
};

export default WelcomeOffer;
