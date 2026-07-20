import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import MetaTags from "@/components/MetaTags";
import OfferPricingSection from "@/components/OfferPricingSection";
import PersonalDiscountModal from "@/components/PersonalDiscountModal";
import { useScrollAnimationInit } from "@/hooks/useScrollAnimationInit";
import CountdownTimer from "@/components/CountdownTimer";
import { Flame, Zap, ShieldCheck, ArrowRight } from "lucide-react";

const PricingOneEuroOffer = () => {
  useScrollAnimationInit();
  const [showPromo, setShowPromo] = useState(false);

  useEffect(() => {
    // Section 9: show the personal-discount popup once, right after signup.
    if (sessionStorage.getItem("floowy_show_personal_promo") === "1") {
      setShowPromo(true);
      sessionStorage.removeItem("floowy_show_personal_promo");
    }
  }, []);

  const scrollToPlans = () =>
    document.getElementById("euro1-plans")?.scrollIntoView({ behavior: "smooth" });

  const dismissPromo = () => setShowPromo(false);
  const claimPromo = () => {
    setShowPromo(false);
    // Remember to attach the 10%/3-month coupon to the subscription once the
    // €1 purchase completes (Section 9 — applied in Payment.tsx success).
    sessionStorage.setItem("floowy_apply_personal_promo", "1");
    // Scroll the €1 plan cards into view so the user can complete checkout.
    document.getElementById("euro1-plans")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background scroll-smooth">
      <MetaTags
        title="Launch your first creative for €1 — 3-day Floowy trial"
        description="Unlock 10 credits and test Floowy.ai for 3 days for just €1. Create at least 5 AI ad creatives in minutes."
        keywords="Floowy €1 trial, AI content trial, AI ad creatives trial"
        canonicalUrl="https://floowy.ai/pricing-1-euro-offer"
      />
      <PersonalDiscountModal open={showPromo} onClose={dismissPromo} onClaim={claimPromo} />
      <Navigation />

      <section className="pt-20 md:pt-24 pb-8 md:pb-12 animate-fade-in">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="relative overflow-hidden rounded-3xl bg-[#0a0a0a] px-6 py-12 md:px-12 md:py-16 shadow-2xl">
              {/* Glow accents */}
              <div className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full bg-primary/30 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-primary/20 blur-3xl" />

              <div className="relative text-center">
                {/* Pulsing urgency badge */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/15 border border-red-500/40 text-red-400 text-xs font-bold mb-6 uppercase tracking-wider">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                  </span>
                  <Flame className="w-3.5 h-3.5" />
                  Limited Offer · Ends Soon
                </div>

                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-5 text-white leading-tight">
                  Launch your first creative for{" "}
                  <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                    Just €1
                  </span>
                </h1>

                <p className="text-lg md:text-2xl text-white/80 mb-2">
                  3 days. 10 credits. 5+ studio-quality creatives.
                </p>
                <p className="text-sm md:text-base text-white/60 mb-8">
                  No long commitment. Cancel anytime before day 3.
                </p>

                {/* Countdown */}
                <div className="flex flex-col items-center gap-3 mb-8">
                  <span className="text-xs uppercase tracking-[0.2em] text-white/50 font-semibold">
                    Offer ends in
                  </span>
                  <CountdownTimer hours={4} minutes={30} />
                </div>

                {/* Primary offer CTA — scrolls down to the €1 plan cards */}
                <div className="mb-8">
                  <button
                    onClick={scrollToPlans}
                    className="inline-flex items-center gap-2 rounded-full bg-offer px-8 py-4 text-base md:text-lg font-bold text-offer-foreground shadow-glow transition-colors hover:bg-offer-hover active:bg-offer-hover"
                  >
                    Start for €1 <ArrowRight className="h-5 w-5" />
                  </button>
                </div>

                {/* Trust row */}
                <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs md:text-sm text-white/60">
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-primary" />
                    Instant access
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                    Cancel anytime
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-primary" />
                    98% off first week
                  </div>
                </div>
              </div>
            </div>

            <p className="text-center text-sm text-muted-foreground mt-6 max-w-2xl mx-auto">
              After your 3-day €1 period, your selected plan continues at the regular monthly price unless cancelled.
            </p>
          </div>
        </div>
      </section>

      <div id="euro1-plans" className="scroll-mt-24">
        <OfferPricingSection offerKind="euro1" returnPath="/pricing-1-euro-offer" />
      </div>

      <Footer />
    </div>
  );
};

export default PricingOneEuroOffer;