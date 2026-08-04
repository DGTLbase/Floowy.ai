import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getAttribution } from "@/lib/ga-attribution";
import { SUBSCRIPTION_PLANS, PROMO_COUPONS, EURO1_OFFER } from "@/lib/stripe-config";
import TierPlanCard from "@/components/pricing/TierPlanCard";

type OfferKind = "euro1" | "fifty_off";

interface OfferPricingSectionProps {
  offerKind: OfferKind;
  returnPath: string;
}

const planKeys = ["lite", "starter", "professional"] as const;
type PlanKey = typeof planKeys[number];

const planDescriptions: Record<PlanKey, string> = {
  lite: "For brands with smaller content demands",
  starter: "Perfect for creators and small brands getting started with AI content",
  professional: "For growing brands scaling their content production",
};

const planFeatures = (plan: PlanKey, monthlyCredits: number, monthlyImages: number): { text: string; included: boolean }[] => {
  const baseTrue = [
    { text: `${monthlyCredits} credits per month`, included: true },
    { text: `Generate up to ${monthlyImages} images per month`, included: true },
  ];
  if (plan === "lite") {
    return [
      ...baseTrue,
      { text: "Priority generation queue", included: false },
      { text: "Priority support", included: false },
      { text: "Account manager", included: false },
    ];
  }
  if (plan === "starter") {
    return [
      ...baseTrue,
      { text: "Priority generation queue", included: false },
      { text: "Priority support", included: false },
      { text: "Account manager", included: false },
    ];
  }
  return [
    ...baseTrue,
    { text: "Priority generation queue", included: true },
    { text: "Priority support", included: true },
    { text: "Account manager", included: false },
  ];
};

const monthlyImagesFor = (plan: PlanKey): number => {
  if (plan === "lite") return 20;
  if (plan === "starter") return 50;
  return 125;
};

const OfferPricingSection = ({ offerKind, returnPath }: OfferPricingSectionProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loadingPlan, setLoadingPlan] = useState<PlanKey | null>(null);

  const ctaLabel = offerKind === "euro1" ? "Start for €1" : "Start with 50% Off";

  // Reverse-flow resume (UX briefing Feature 2): a logged-out visitor picks a
  // plan first, signs up (details captured), and lands back here — continue
  // straight into checkout for the stashed plan. No re-click, zero extra steps.
  const resumed = useRef(false);
  useEffect(() => {
    (async () => {
      if (resumed.current) return;
      const raw = sessionStorage.getItem("pendingOffer");
      if (!raw) return;
      try {
        const pending = JSON.parse(raw);
        if (pending?.offerKind !== offerKind || !planKeys.includes(pending?.plan)) return;
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        resumed.current = true;
        sessionStorage.removeItem("pendingOffer");
        handleClick(pending.plan as PlanKey);
      } catch { /* corrupt stash — ignore */ }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offerKind]);

  const handleClick = async (plan: PlanKey) => {
    setLoadingPlan(plan);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        sessionStorage.setItem("pendingOffer", JSON.stringify({ offerKind, plan, returnPath }));
        navigate(`/auth?mode=signup&next=${encodeURIComponent(returnPath)}`);
        return;
      }

      const priceId = SUBSCRIPTION_PLANS[plan].monthly.priceId;
      const couponId =
        offerKind === "euro1"
          ? PROMO_COUPONS.EURO1_TRIAL[plan]
          : PROMO_COUPONS.FIFTY_OFF_3M;
      const offerType = offerKind === "euro1" ? "euro1_trial" : "fifty_off_3m";

      // €1 funnel: flag the post-purchase upsell sequence (Section 10/11).
      if (offerKind === "euro1") {
        sessionStorage.setItem("floowy_post_purchase_upsell", "1");

        // True 3-day €1 cycle: €1 now → chosen plan after 3 days (subscription
        // schedule). Falls back to the first-invoice-€1 flow when disabled.
        if (EURO1_OFFER.trueTrial) {
          const { data, error } = await supabase.functions.invoke("create-euro1-checkout", {
            // Captured here because checkout.stripe.com cannot see our cookies
            // and the webhook that reports the sale cannot read them either.
            body: { plan, ...getAttribution() },
          });
          if (error) throw error;
          if (!data?.url) throw new Error("No checkout URL returned");
          window.location.href = data.url;
          return;
        }
      }

      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId, couponId, offerType, ...getAttribution() },
      });

      if (error) throw error;
      if (!data?.url) throw new Error("No checkout URL returned");
      window.location.href = data.url;
    } catch (err) {
      console.error("[OfferPricing] checkout error", err);
      toast({
        title: "Something went wrong",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
      setLoadingPlan(null);
    }
  };

  return (
    <section className="container mx-auto px-4 pt-10 pb-12 md:pt-[52px] md:pb-16 bg-gradient-card">
      <div className="max-w-5xl mx-auto">
        <p className="mb-4 text-center text-xs font-semibold uppercase tracking-wide text-primary">
          Step 1 of 3 — choose your plan
        </p>
        {/* Extra top gap so the Starter card's floating "Best Value" pill clears
            the text above it instead of overlapping it. */}
        <div className="mt-8 md:mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {planKeys.map((key) => {
            const plan = SUBSCRIPTION_PLANS[key];
            const monthlyPrice = plan.monthly.price;
            const monthlyCredits = plan.monthly.credits;
            const isPopular = key === "starter";

            const halfPrice = (monthlyPrice / 2).toFixed(monthlyPrice % 2 === 0 ? 0 : 2);
            const priceContent =
              offerKind === "euro1" ? (
                <>
                  <div className="text-base font-semibold text-muted-foreground line-through">€{monthlyPrice} / month</div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-bold text-primary">€1</span>
                    <span className="text-sm text-muted-foreground">for 3 days</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-base font-semibold text-muted-foreground line-through">€{monthlyPrice} / month</div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-bold text-primary">€{halfPrice}</span>
                    <span className="text-sm text-muted-foreground">/month</span>
                  </div>
                </>
              );

            return (
              <TierPlanCard
                key={key}
                tier={key}
                name={plan.name}
                description={planDescriptions[key]}
                price={monthlyPrice}
                priceContent={priceContent}
                credits={monthlyCredits}
                images={monthlyImagesFor(key)}
                highlighted={isPopular}
                showEuroTag={false}
                cta={
                  <Button
                    onClick={() => handleClick(key)}
                    disabled={loadingPlan !== null}
                    size="lg"
                    className={`w-full shadow-md ${
                      isPopular
                        ? "bg-offer text-offer-foreground hover:bg-offer-hover"
                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                    }`}
                  >
                    {loadingPlan === key ? <Loader2 className="w-4 h-4 animate-spin" /> : ctaLabel}
                  </Button>
                }
              />
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default OfferPricingSection;