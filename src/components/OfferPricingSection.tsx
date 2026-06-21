import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SUBSCRIPTION_PLANS, PROMO_COUPONS, EURO1_OFFER } from "@/lib/stripe-config";

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
      { text: "Access to core Floowy tools", included: true },
      { text: "Priority generation queue", included: false },
      { text: "Priority support", included: false },
      { text: "Account manager", included: false },
    ];
  }
  if (plan === "starter") {
    return [
      ...baseTrue,
      { text: "Access to all Floowy tools", included: true },
      { text: "Priority generation queue", included: false },
      { text: "Priority support", included: false },
      { text: "Account manager", included: false },
    ];
  }
  return [
    ...baseTrue,
    { text: "Access to all Floowy tools", included: true },
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
            body: { plan },
          });
          if (error) throw error;
          if (!data?.url) throw new Error("No checkout URL returned");
          window.location.href = data.url;
          return;
        }
      }

      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId, couponId, offerType },
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {planKeys.map((key) => {
            const plan = SUBSCRIPTION_PLANS[key];
            const monthlyPrice = plan.monthly.price;
            const monthlyCredits = plan.monthly.credits;
            const isPopular = key === "starter";

            return (
              <Card
                key={key}
                className={`relative transition-all duration-300 flex flex-col overflow-hidden ${
                  isPopular
                    ? "shadow-glow md:scale-105 border-2 border-primary bg-primary/[0.04] z-10"
                    : "border border-border/50"
                }`}
              >
                {isPopular && (
                  <div className="absolute top-0 inset-x-0 bg-primary text-primary-foreground text-center py-2 text-xs font-bold uppercase tracking-wider">
                    Most Popular
                  </div>
                )}
                <CardHeader className={`text-center pb-6 ${isPopular ? "pt-12" : ""}`}>
                  <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                  <CardDescription className="text-sm mb-4">{planDescriptions[key]}</CardDescription>

                  {offerKind === "euro1" ? (
                    <>
                      <div className="text-base font-semibold text-muted-foreground line-through mb-1">
                        €{monthlyPrice} / month
                      </div>
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-5xl md:text-6xl font-bold text-primary">€1</span>
                        <span className="text-sm text-muted-foreground">for 3 days</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-3 px-2 leading-relaxed">
                        Includes 10 credits to test the platform. After the 3-day €1 period, your {plan.name} plan continues at €{monthlyPrice}/month unless cancelled.
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="text-base font-semibold text-muted-foreground line-through mb-1">
                        €{monthlyPrice} / month
                      </div>
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-5xl md:text-6xl font-bold text-primary">
                          €{(monthlyPrice / 2).toFixed(monthlyPrice % 2 === 0 ? 0 : 2)}
                        </span>
                        <span className="text-sm text-muted-foreground">/month</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-3 px-2 leading-relaxed">
                        50% off your first 3 months. After that, your {plan.name} plan continues at €{monthlyPrice}/month unless cancelled.
                      </p>
                    </>
                  )}
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <ul className="space-y-3 mb-8 flex-1">
                    {planFeatures(key, monthlyCredits, monthlyImagesFor(key)).map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        {feature.included ? (
                          <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        ) : (
                          <X className="w-5 h-5 text-muted-foreground/40 shrink-0 mt-0.5" />
                        )}
                        <span className={`text-sm ${feature.included ? "text-muted-foreground" : "text-muted-foreground/40"}`}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={() => handleClick(key)}
                    disabled={loadingPlan !== null}
                    variant={isPopular ? "default" : "outline"}
                    className={`w-full ${
                      isPopular
                        ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
                        : "border-primary/40 text-foreground hover:bg-primary/10"
                    }`}
                    size="lg"
                  >
                    {loadingPlan === key ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      ctaLabel
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default OfferPricingSection;