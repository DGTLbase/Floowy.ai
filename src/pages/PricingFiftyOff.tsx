import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import MetaTags from "@/components/MetaTags";
import OfferPricingSection from "@/components/OfferPricingSection";
import { useScrollAnimationInit } from "@/hooks/useScrollAnimationInit";

const PricingFiftyOff = () => {
  useScrollAnimationInit();

  return (
    <div className="min-h-screen bg-background scroll-smooth">
      <MetaTags
        title="50% Off Floowy.ai — first 3 months on any plan"
        description="Come back to Floowy.ai with 50% off your first 3 months. Scale ad creatives, ecommerce visuals and campaign concepts for less."
        keywords="Floowy 50% off, AI content discount, AI ads discount"
        canonicalUrl="https://floowy.ai/pricing-50-off"
      />
      <Navigation />

      <section className="pt-20 pb-6 md:pt-24 md:pb-8 animate-fade-in">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-6 uppercase tracking-wider">
              Welcome Back Offer
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-header-dark">
              50% Off Your First{" "}
              <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                3 Months
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-3">
              Test and scale ad creatives for a fraction of traditional production costs.
            </p>
            <p className="text-base text-muted-foreground/80 max-w-2xl mx-auto">
              Discount auto-applied at checkout. After 3 months, your plan continues at the regular price unless cancelled.
            </p>
          </div>
        </div>
      </section>

      <OfferPricingSection offerKind="fifty_off" returnPath="/pricing-50-off" />

      <Footer />
    </div>
  );
};

export default PricingFiftyOff;