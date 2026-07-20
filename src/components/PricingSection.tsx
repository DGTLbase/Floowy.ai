import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, Sparkles, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Link } from "react-router-dom";
import { SUBSCRIPTION_PLANS, EURO1_OFFER } from "@/lib/stripe-config";
import TierPlanCard from "@/components/pricing/TierPlanCard";
import { type PaidTier } from "@/lib/tier-access";

interface PricingSectionProps {
  title?: React.ReactNode;
  subtitle?: string;
  asH1?: boolean;
}

const PricingSection = ({ title, subtitle, asH1 = false }: PricingSectionProps = {}) => {
  const [isAnnual, setIsAnnual] = useState(false);

  const plans = [
    {
      name: "Lite",
      monthlyPrice: SUBSCRIPTION_PLANS.lite.monthly.price,
      yearlyPrice: SUBSCRIPTION_PLANS.lite.yearly.price,
      description: "For brands with smaller content demands",
      features: [
        { text: `${isAnnual ? SUBSCRIPTION_PLANS.lite.yearly.credits : SUBSCRIPTION_PLANS.lite.monthly.credits} credits per ${isAnnual ? "year" : "month"}`, included: true },
        { text: `Generate up to ${isAnnual ? "240" : "20"} images per ${isAnnual ? "year" : "month"}`, included: true },
        { text: "Priority generation queue", included: false },
        { text: "Priority support", included: false },
        { text: "Account manager", included: false },
      ],
      cta: EURO1_OFFER.ctaLabel,
      highlighted: false,
    },
    {
      name: "Starter",
      monthlyPrice: SUBSCRIPTION_PLANS.starter.monthly.price,
      yearlyPrice: SUBSCRIPTION_PLANS.starter.yearly.price,
      description: "Perfect for creators and small brands getting started with AI content",
      features: [
        { text: `${isAnnual ? SUBSCRIPTION_PLANS.starter.yearly.credits : SUBSCRIPTION_PLANS.starter.monthly.credits} credits per ${isAnnual ? "year" : "month"}`, included: true },
        { text: `Generate up to ${isAnnual ? "600" : "50"} images per ${isAnnual ? "year" : "month"} (2 credits per generation)`, included: true },
        { text: "Priority generation queue", included: false },
        { text: "Priority support", included: false },
        { text: "Account manager", included: false },
      ],
      cta: EURO1_OFFER.ctaLabel,
      highlighted: true,
    },
    {
      name: "Professional",
      monthlyPrice: SUBSCRIPTION_PLANS.professional.monthly.price,
      yearlyPrice: SUBSCRIPTION_PLANS.professional.yearly.price,
      description: "For growing brands scaling their content production",
      features: [
        { text: `${isAnnual ? SUBSCRIPTION_PLANS.professional.yearly.credits : SUBSCRIPTION_PLANS.professional.monthly.credits} credits per ${isAnnual ? "year" : "month"}`, included: true },
        { text: `Generate up to ${isAnnual ? "1,500" : "125"} images per ${isAnnual ? "year" : "month"}`, included: true },
        { text: "Priority generation queue", included: true },
        { text: "Priority support", included: true },
        { text: "Account manager", included: false },
      ],
      cta: EURO1_OFFER.ctaLabel,
      highlighted: false,
    },
  ];

  const customFeatures = [
    "Everything in Professional",
    "Custom credit packages",
    "AI content strategy support",
    "Custom AI model training",
    "Private generation infrastructure",
    "Team collaboration workspace",
    "Priority feature requests",
    "1-on-1 strategy calls",
  ];

  return (
    <section className="container mx-auto px-4 pt-4 pb-12 md:pt-6 md:pb-16 bg-gradient-card">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-5 px-4">
          {asH1 ? (
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 max-w-3xl mx-auto leading-tight">
              {title || (
                <>
                  <span className="text-header-dark">Scale Your Ecommerce Content, </span>
                  <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Without the Photoshoot</span>
                </>
              )}
            </h1>
          ) : (
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 max-w-3xl mx-auto leading-tight">
              {title || (
                <>
                  <span className="text-header-dark">Scale Your Ecommerce Content, </span>
                  <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Without the Photoshoot</span>
                </>
              )}
            </h2>
          )}

          {/* Monthly/Yearly Toggle */}
          <div className="inline-flex items-center gap-3 p-1 bg-muted rounded-full">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                !isAnnual
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                isAnnual
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Yearly
              <Badge className="ml-2 bg-primary text-primary-foreground">20% OFF</Badge>
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-stretch pt-2 max-w-5xl mx-auto">
          {plans.map((plan) => {
            const tier = plan.name.toLowerCase() as PaidTier;
            const sp = SUBSCRIPTION_PLANS[tier as keyof typeof SUBSCRIPTION_PLANS];
            const credits = isAnnual ? sp.yearly.credits : sp.monthly.credits;
            const images = Math.round(sp.monthly.credits / 2);
            return (
              <TierPlanCard
                key={plan.name}
                tier={tier}
                name={plan.name}
                description={plan.description}
                price={isAnnual ? plan.yearlyPrice : plan.monthlyPrice}
                priceSuffix={isAnnual ? "yr" : "mo"}
                strikePrice={isAnnual ? plan.monthlyPrice * 12 : undefined}
                credits={credits}
                images={images}
                highlighted={plan.highlighted}
                cta={
                  <Link to={EURO1_OFFER.signupHref} className="block">
                    <Button
                      size="lg"
                      className={`w-full shadow-md ${
                        plan.highlighted
                          ? "bg-offer text-offer-foreground hover:bg-offer-hover"
                          : "bg-primary text-primary-foreground hover:bg-primary/90"
                      }`}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                }
              />
            );
          })}
        </div>

        {/* Talk to Sales Card */}
        <div className="mt-8">
          <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.03] via-background to-primary-glow/[0.05] p-[1px]">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary-glow/10 opacity-50" />
            <div className="relative rounded-2xl bg-background/80 backdrop-blur-sm p-8 md:p-10">
              <div className="flex flex-col lg:flex-row items-start gap-8 lg:gap-12">
                {/* Left side - Header */}
                <div className="flex-1 min-w-0">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
                    <Sparkles className="w-3.5 h-3.5" />
                    CUSTOM SOLUTION
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold mb-3 text-foreground">
                    Talk to Sales
                  </h3>
                  <p className="text-muted-foreground text-base md:text-lg mb-6 max-w-md">
                    For agencies, brands and teams with custom AI content needs
                  </p>
                  <Link to="/contact#message" className="hidden lg:inline-block">
                    <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 px-8">
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Book A Call
                    </Button>
                  </Link>
                </div>

                {/* Right side - Features */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Everything you need</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                    {customFeatures.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 text-primary" />
                        </div>
                        <span className="text-sm text-foreground/80">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Mobile button at bottom */}
              <Link to="/contact#message" className="block lg:hidden mt-6">
                <Button size="lg" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg transition-all duration-300">
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Book A Call
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
