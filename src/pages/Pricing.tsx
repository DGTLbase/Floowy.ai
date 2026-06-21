import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Check, X, ChevronRight } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import ComparisonSection from "@/components/ComparisonSection";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PlatformsSection from "@/components/PlatformsSection";
import PricingSection from "@/components/PricingSection";
import OfferCountdownSection from "@/components/OfferCountdownSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import ROICalculator from "@/components/ROICalculator";
import { useScrollAnimationInit } from "@/hooks/useScrollAnimationInit";
import logoImage from "@/assets/floowy-logo.png";
import MetaTags from "@/components/MetaTags";
import StructuredData from "@/components/StructuredData";

import IndustriesHighlightSection from "@/components/IndustriesHighlightSection";
const Pricing = () => {
  useScrollAnimationInit();
  
  return (
    <div className="min-h-screen bg-background scroll-smooth">
      <MetaTags 
        title="AI content platform pricing for scalable content plans | Floowy"
        description="Explore AI content platform pricing and choose a plan that fits your marketing goals. Create visuals, shoots and concepts quickly with AI power."
        keywords="AI content platform pricing, AI marketing pricing, content creation pricing"
        canonicalUrl="https://floowy.ai/pricing"
      />
      <StructuredData type="organization" />
      <StructuredData 
        type="breadcrumb" 
        breadcrumbs={[
          { name: "Home", url: "https://floowy.ai" },
          { name: "Pricing", url: "https://floowy.ai/pricing" }
        ]}
      />
      <Navigation />

      {/* €1 urgency countdown */}
      <div className="pt-3 md:pt-4">
        <OfferCountdownSection />
      </div>

      {/* Pricing Section */}
      <div id="pricing" className="scroll-mt-20 pt-2 md:pt-4">
        <PricingSection
          asH1
          title={
            <>
              <span className="text-header-dark">Scale Your Ecommerce Content, </span>
              <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Without the Photoshoot</span>
            </>
          }
        />
      </div>

      {/* ROI Calculator */}
      <ROICalculator />

      <ComparisonSection
        floowyItems={[
          "A/B testing",
          "Faster scaling",
          "Builds trust and recognisability",
          "Brings personas to life",
          "No set or team required",
          "Fast production",
          "Cost-efficient",
          "Create any setting",
          "Respond to trends",
          "Storytelling",
        ]}
        othersItems={[
          "Expensive freelancers, creators & editors",
          "Slow shoots, edits, and approvals",
          "Inconsistent tone & quality",
          "€300+ per UGC video",
          "Manual content editing",
          "Guesswork, delays, and fatigue",
          "High setup and location costs",
          "Limited flexibility",
          "Long turnaround times",
          "Complex coordination needed",
        ]}
      />

      <PlatformsSection />

      <IndustriesHighlightSection />

      {/* Reviews */}
      <div id="reviews" className="scroll-mt-20">
        <TestimonialsSection />
      </div>

      {/* FAQ Section */}
      <section id="faq" className="py-12 md:py-16 scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 animate-fade-in text-header-dark">
              Frequently Asked <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Questions</span>
            </h2>
            <Accordion type="single" collapsible className="w-full space-y-4">
              <AccordionItem value="item-1" className="bg-card rounded-lg border border-border px-6 hover-scale">
                <AccordionTrigger className="text-left hover:no-underline py-6">
                  <span className="text-lg font-semibold text-foreground">What is Floowy.ai?</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6">
                  Floowy.ai is an AI-powered platform that helps marketers and brands create high-performing ad content in seconds. From atmospheric product photography to authentic UGC videos and fashion shoots, our tools enable you to produce professional-quality content without the traditional costs and time investment.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="bg-card rounded-lg border border-border px-6 hover-scale">
                <AccordionTrigger className="text-left hover:no-underline py-6">
                  <span className="text-lg font-semibold text-foreground">How does the credit system work?</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6">
                  Each plan comes with a monthly credit allocation. Credits are used when you generate content with our AI tools. Different tools may consume different amounts of credits based on complexity. Unused credits typically roll over within your billing period, depending on your plan.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="bg-card rounded-lg border border-border px-6 hover-scale">
                <AccordionTrigger className="text-left hover:no-underline py-6">
                  <span className="text-lg font-semibold text-foreground">Can I cancel my subscription anytime?</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6">
                  Yes, you can cancel your subscription at any time. If you cancel, you'll continue to have access to your plan benefits until the end of your current billing period. No refunds are provided for partial months.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="bg-card rounded-lg border border-border px-6 hover-scale">
                <AccordionTrigger className="text-left hover:no-underline py-6">
                  <span className="text-lg font-semibold text-foreground">Do I own the content I create?</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6">
                  Yes! All content generated with Floowy.ai is yours to use commercially. You retain full rights to download, edit, and publish the content across any platform or campaign without attribution requirements.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5" className="bg-card rounded-lg border border-border px-6 hover-scale">
                <AccordionTrigger className="text-left hover:no-underline py-6">
                  <span className="text-lg font-semibold text-foreground">What if I need more credits?</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6">
                  You can purchase additional credit packs at any time or upgrade to a higher-tier plan for more monthly credits. We also offer custom enterprise plans for high-volume users with specific needs.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6" className="bg-card rounded-lg border border-border px-6 hover-scale">
                <AccordionTrigger className="text-left hover:no-underline py-6">
                  <span className="text-lg font-semibold text-foreground">Is there a free trial?</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6">
                  Yes! We offer a free trial with limited credits so you can experience the platform before committing to a paid plan. Sign up to get started and see how Floowy.ai can transform your content creation workflow.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-16 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-primary-foreground mb-6">
            Make your content in seconds.
          </h2>
          <p className="text-xl text-primary-foreground/95 mb-8 max-w-2xl mx-auto">
            Watch how fast AI makes content people can't scroll past.
          </p>
          <Link to="/auth?mode=signup" className="inline-block w-full sm:w-auto px-4">
            <Button 
              size="lg" 
              className="w-full sm:w-auto text-lg px-8 py-6 bg-background text-primary hover:bg-background/95 rounded-full font-semibold shadow-glow"
            >
              Create Your First Ad
            </Button>
          </Link>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Pricing;
