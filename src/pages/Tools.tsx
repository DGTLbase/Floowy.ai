import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, ArrowRight, Sparkles } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import AutoBeforeAfterSlider from "@/components/AutoBeforeAfterSlider";
import ideaBefore from "@/assets/idea-studio-hero-before.png";
import ideaAfter from "@/assets/idea-studio-hero-after.png";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PlatformsSection from "@/components/PlatformsSection";
import ROICalculator from "@/components/ROICalculator";
import ComparisonSection from "@/components/ComparisonSection";
import PricingSection from "@/components/PricingSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import PageMeta from "@/components/PageMeta";
import { useScrollAnimationInit } from "@/hooks/useScrollAnimationInit";

import fashionStudioHero from "@/assets/fashion-studio-hero.png";
import fashionProHero from "@/assets/fashion-pro-hero.png";
import flatlayStudioHero from "@/assets/flatlay-studio-hero.png";
import ambienceStudioHero from "@/assets/ambience-studio-hero.png";
import creatorStudioHero from "@/assets/creator-studio-hero.png";
import ideaCover from "@/assets/idea-studio-case-study.png";
import adsStudioHero from "@/assets/ads-studio-hero.png";
import listingStudioHero from "@/assets/listing-studio-hero.png";
import virtualVideoHero from "@/assets/virtual-video-studio-hero.mp4";

import IndustriesHighlightSection from "@/components/IndustriesHighlightSection";
interface ToolCardProps {
  image?: string;
  video?: string;
  slider?: { before: string; after: string };
  category: string;
  name: string;
  description: string;
  bullets: string[];
  oldWay: string;
  oldPrice: string;
  link: string;
  coverBg?: string;
}

const ToolCard = ({ image, video, slider, category, name, description, bullets, oldWay, oldPrice, link, coverBg }: ToolCardProps) => (
  <Card className="group overflow-hidden border-border/50 hover:shadow-elegant transition-all duration-300 h-full flex flex-col">
    <div className="aspect-[4/3] overflow-hidden relative" style={{ backgroundColor: coverBg || 'hsl(var(--muted))' }}>
      {slider ? (
        <div className="w-full h-full pointer-events-none">
          <AutoBeforeAfterSlider beforeImage={slider.before} afterImage={slider.after} className="w-full h-full rounded-none" autoAnimate={true} />
        </div>
      ) : video ? (
        <video src={video} autoPlay muted loop playsInline preload="auto" className="w-full h-full object-cover object-[center_30%] group-hover:scale-105 transition-transform duration-500" />
      ) : (
        <img src={image} alt={name} className="w-full h-full object-cover object-[center_30%] group-hover:scale-105 transition-transform duration-500" loading="lazy" />
      )}
    </div>
    <CardContent className="p-6 flex flex-col flex-1">
      <span className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">{category}</span>
      <h3 className="text-xl font-bold text-header-dark mb-2 notranslate">{name}</h3>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>
      <ul className="space-y-2 mb-4 flex-1">
        {bullets.map((b, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
            <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <span>{b}</span>
          </li>
        ))}
      </ul>
      <div className="bg-muted/50 rounded-lg p-3 mb-4">
        <p className="text-xs text-muted-foreground">{oldWay}</p>
        <p className="text-sm font-semibold text-foreground">{oldPrice}</p>
      </div>
      <Link to={link}>
        <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 group/btn">
          Learn More
          <ArrowRight className="w-4 h-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />
        </Button>
      </Link>
    </CardContent>
  </Card>
);

interface ToolSectionProps {
  title: string;
  titleHighlight: string;
  subtext: string;
  cards: ToolCardProps[];
}

const ToolSection = ({ title, titleHighlight, subtext, cards }: ToolSectionProps) => (
  <section className="py-5 md:py-7">
    <div className="container mx-auto px-4">
      <div className="text-center mb-12 scroll-animate">
        <h2 className="text-3xl md:text-5xl font-bold text-header-dark mb-4">
          {title} <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">{titleHighlight}</span>
        </h2>
        <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto">{subtext}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto scroll-animate">
        {cards.map((card, i) => <ToolCard key={i} {...card} />)}
      </div>
    </div>
  </section>
);

const fashionCards: ToolCardProps[] = [
  {
    image: fashionStudioHero, category: "Perfect for E-commerce", name: "Fashion Studio",
    description: "Create professional fashion photography with AI-powered styling",
    bullets: ["On-model product images in seconds", "Diverse AI model library", "Campaign-ready visuals"],
    oldWay: "Old way: Models + studio + photographer", oldPrice: "€1K–€5K/shoot", link: "/fashion-studio"
  },
  {
    image: fashionProHero, category: "Perfect for Bulk Fashion", name: "Fashion Studio Pro",
    description: "Create complete AI-powered fashion shoots at scale with multi-angle output",
    bullets: ["Full campaign and lookbook production", "Consistent styling across collections", "Multi-angle output per product"],
    oldWay: "Old way: Agency + multiple shoot days", oldPrice: "€3K–€10K/campaign", link: "/fashion-studio-pro"
  },
  {
    image: flatlayStudioHero, category: "Perfect for Website & Social Media", name: "Flatlay Studio",
    description: "Create stunning flatlay photography for your products",
    bullets: ["Professional top-down compositions", "Any surface, any style", "Packshots and styled arrangements"],
    oldWay: "Old way: Props + styling + photographer", oldPrice: "€300–€1K/session", link: "/flatlay-studio"
  },
];

const contentCards: ToolCardProps[] = [
  {
    image: ambienceStudioHero, category: "Perfect for Product Photography", name: "Ambience Studio",
    description: "Transform products into stunning atmospheric photos",
    bullets: ["Create any setting instantly", "Perfect for A/B testing", "Respond to trends quickly"],
    oldWay: "Old way: Studio + location shoot", oldPrice: "€500–€2K/shoot", link: "/ambience-studio"
  },
  {
    image: creatorStudioHero, category: "Perfect for UGC Content", name: "Creator Studio",
    description: "Create authentic user-generated content videos for your products",
    bullets: ["Image to video in seconds", "TikTok, Reels, and Shorts ready", "Social-native vertical formats"],
    oldWay: "Old way: UGC creators + coordination", oldPrice: "€300+ per video", link: "/creator-studio",
    coverBg: "#e1f3ea"
  },
  {
    slider: { before: ideaBefore, after: ideaAfter }, category: "Perfect for Brand Visuals", name: "Idea Studio",
    description: "Recreate inspired visuals for your brand and bring your ideas to life with AI",
    bullets: ["Iterate on winning creatives", "Rewrite hooks and copy variations", "Scale what already works"],
    oldWay: "Old way: Creative agency brainstorms", oldPrice: "€1K–€3K/round", link: "/idea-studio"
  },
];

const adsCards: ToolCardProps[] = [
  {
    image: adsStudioHero, category: "Perfect for Advertising", name: "Ads Studio",
    description: "Generate high-converting ad creatives for all platforms",
    bullets: ["Ad visuals, copy, and headlines", "Meta, TikTok, Google, Instagram", "Dozens of variations in minutes"],
    oldWay: "Old way: Creative agency + designer", oldPrice: "€500–€2K/brief", link: "/ads-studio"
  },
  {
    image: listingStudioHero, category: "Perfect for Marketplaces", name: "Listing Studio",
    description: "Create marketplace-ready product listings that convert",
    bullets: ["White background packshots", "Amazon, bol.com, Zalando compliant", "Multi-marketplace export"],
    oldWay: "Old way: Product photographer + retoucher", oldPrice: "€200–€500/product", link: "/listing-studio"
  },
  {
    video: virtualVideoHero, category: "Perfect for Video Marketing", name: "Virtual Video Studio",
    description: "Turn product images into cinematic marketing videos automatically",
    bullets: ["Photos become 4-second cinematic clips", "7 music styles included", "Complete rendered video output"],
    oldWay: "Old way: Videographer + editor + music license", oldPrice: "€1K–€5K/video", link: "/virtual-video-studio"
  },
];

const faqItems = [
  { q: "What is an AI content creation platform?", a: "An AI content creation platform is an all-in-one tool that uses artificial intelligence to produce marketing content at scale. Instead of hiring separate photographers, designers, videographers, and agencies, you use one platform to generate product images, fashion photography, ad creatives, videos, and more. Floowy combines 9 specialized AI studios in a single platform built specifically for ecommerce brands that need to produce visual content faster and more cost-effectively than traditional methods." },
  { q: "How is Floowy different from generic AI image generators?", a: "Generic AI image generators like Midjourney or DALL-E are built for general creative use. Floowy is purpose-built for ecommerce and marketing content. Every studio is optimized for commercial output: on-model fashion photography, marketplace-compliant packshots, conversion-optimized ad creatives, and platform-ready video content. The AI understands product accuracy, brand consistency, and commercial quality standards that generic tools simply don't deliver." },
  { q: "Can one platform really replace a full creative team?", a: "For the majority of ecommerce visual production, yes. Floowy's 9 studios cover the entire content creation workflow: product photography (Fashion, Flatlay, Listing Studio), backgrounds and scenes (Ambience Studio), campaign visuals (Fashion Studio Pro), ad creatives (Ads Studio), content iteration (Idea Studio), and video production (Creator Studio, Virtual Video Studio). Brands using Floowy report replacing agency retainers of €2K to €10K per month while producing 10x more content." },
  { q: "How does AI-powered marketing content compare to traditional production?", a: "AI marketing content generation is faster (seconds vs weeks), cheaper (credits vs per-shoot fees), and more scalable (unlimited variations vs limited deliverables per brief). In A/B tests, AI-generated ecommerce visuals consistently perform at the same level or better than traditionally produced content in CTR and conversion metrics. The real advantage is volume: you can test 50 ad variations instead of 5, find winners faster, and iterate daily instead of monthly." },
  { q: "Is AI-generated content suitable for premium and luxury brands?", a: "Yes. Floowy's AI is specifically trained to produce visuals that meet premium brand standards. Fashion Studio Pro offers editorial-level campaign imagery with brand-consistent art direction. You can control lighting, styling, model aesthetics, backgrounds, and color palettes to maintain the visual quality luxury consumers expect. Multiple European fashion and beauty brands already use Floowy for their premium product content." },
  { q: "How does Floowy help with creative testing and optimization?", a: "Creative testing at scale is one of Floowy's biggest advantages. Instead of producing 3 to 5 ad variations per campaign (typical with agencies), you can generate 30 to 50 variations in minutes. Idea Studio lets you iterate on proven winners with fresh angles. Ads Studio produces platform-specific ad creatives. This volume of creative testing means faster optimization, lower cost per acquisition, and higher return on ad spend across Meta, TikTok, and Google campaigns." },
  { q: "Can I use Floowy content on marketplaces like Amazon, bol.com, and Zalando?", a: "Yes. Listing Studio generates product images that meet the specific requirements of Amazon, bol.com, Zalando, About You, eBay, and other major European marketplaces. This includes white background packshots, proper dimensions, and resolution standards. All content generated with Floowy is fully licensed for commercial use across any sales channel." },
  { q: "How does Floowy compare to AdCreative.ai, Photoroom, and other AI tools?", a: "Most AI content tools focus on one thing: AdCreative.ai on ads, Photoroom on background removal, Botika on fashion models. Floowy combines all of these into one unified platform with 9 specialized studios. This means one subscription, one workflow, one brand profile, and consistent quality across product images, fashion photography, ads, and video. For ecommerce brands that need multiple content types, Floowy replaces an entire stack of separate tools." },
  { q: "What industries does Floowy work best for?", a: "Floowy is built for ecommerce and fashion brands, but works for any business that needs product visuals at scale. Fashion and apparel, beauty and cosmetics, home and lifestyle, electronics, food and beverage, real estate, and DTC companies all use Floowy. Any business that sells products online and needs visual content for their webshop, marketplaces, social media, and ad campaigns benefits from the platform." },
  { q: "Is Floowy available for ecommerce brands in the Netherlands and Europe?", a: "Yes. Floowy is founded and based in the Netherlands and serves ecommerce brands across the Netherlands, Belgium, Germany, the United Kingdom, France, Spain, Italy, and the Nordics. All pricing is in EUR, support is available in Dutch and English, and every studio generates content optimized for European marketplaces and ad platforms. Whether you're a fashion brand in Amsterdam, a DTC company in Antwerp, or an ecommerce retailer in Berlin, Floowy's AI studio suite is built for your market." },
  { q: "Can I try Floowy before committing to a plan?", a: "Yes. You can launch your first creative for just €1 and test Floowy for 3 days before committing. This lets you see the quality of AI-generated content before continuing on a full plan. After the 3-day €1 period, your selected plan continues at the regular monthly price unless cancelled. Plans start at €19/month." },
];

const Tools = () => {
  useScrollAnimationInit();

  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title="AI Content Creation Tools for Ecommerce | Floowy.ai"
        description="Generate product images, ad creatives, and fashion photography with AI. Create marketplace-ready ecommerce visuals in seconds with Floowy.ai."
        keywords="AI content creation platform ecommerce, ecommerce tools, fashion photography AI, ad creative generator"
        canonicalUrl="https://floowy.ai/tools"
        breadcrumbs={[
          { name: "Home", url: "https://floowy.ai" },
          { name: "Tools", url: "https://floowy.ai/tools" }
        ]}
      />
      <Navigation />

      {/* Section 1: H1 + Intro */}
      <section className="pt-12 md:pt-20 pb-2 md:pb-4 px-4">
        <div className="container mx-auto max-w-4xl text-center scroll-animate">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-header-dark mb-6 leading-tight">
            AI Tools for <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">E-commerce & Fashion Content</span>
          </h1>
        </div>
      </section>

      {/* Section 2: Fashion Solutions */}
      <ToolSection
        title="Our Fashion"
        titleHighlight="Solutions"
        subtext="Everything fashion and ecommerce brands need for professional product photography at scale."
        cards={fashionCards}
      />

      {/* Section 3: Content & Creative Solutions */}
      <ToolSection
        title="Our Content & Creative"
        titleHighlight="Solutions"
        subtext="Generate product backgrounds, short-form video content, and creative variations to keep your content fresh across every channel."
        cards={contentCards}
      />

      {/* Section 4: Ads, Listing & Video Solutions */}
      <ToolSection
        title="Our Ads, Listing & Video"
        titleHighlight="Solutions"
        subtext="Create ad creatives, marketplace-ready product images, and cinematic showcase videos from one platform."
        cards={adsCards}
      />

      {/* Section 5: Platforms */}
      <PlatformsSection />


      {/* Section 6: More Models */}
      <section className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left - Scrolling 3-Column Model Grid */}
            <div className="h-[500px] md:h-[600px] overflow-hidden relative order-last lg:order-first">
              <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />
              
              <div className="grid grid-cols-3 gap-2 h-full">
                {(() => {
                  const col1 = ["/images/models/maya.webp", "/images/models/malik.webp", "/images/models/aiko.webp", "/images/models/layla.webp", "/images/models/lucas.webp", "/images/models/kenji.webp"];
                  return (
                    <div className="overflow-hidden">
                      <div className="animate-scroll-models-up flex flex-col gap-2">
                        {[...col1, ...col1].map((url, i) => (
                          <div key={i} className="aspect-[3/4] rounded-xl overflow-hidden border border-border/30 shadow-md flex-shrink-0">
                            <img src={url} alt="AI Model" className="w-full h-full object-cover object-top" loading="lazy" />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
                {(() => {
                  const col2 = ["/images/models/hanna.webp", "/images/models/gabriela.webp", "/images/models/camila.webp", "/images/models/bas.webp", "/images/models/adrian.webp", "/images/models/isabella.webp"];
                  return (
                    <div className="overflow-hidden">
                      <div className="animate-scroll-models-down flex flex-col gap-2">
                        {[...col2, ...col2].map((url, i) => (
                          <div key={i} className="aspect-[3/4] rounded-xl overflow-hidden border border-border/30 shadow-md flex-shrink-0">
                            <img src={url} alt="AI Model" className="w-full h-full object-cover object-top" loading="lazy" />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
                {(() => {
                  const col3 = ["/images/models/julian.webp", "/images/models/marcus.webp", "/images/models/mei.webp", "/images/models/mia.webp", "/images/models/omar.webp"];
                  return (
                    <div className="overflow-hidden">
                      <div className="animate-scroll-models-up flex flex-col gap-2" style={{ animationDuration: '28s' }}>
                        {[...col3, ...col3].map((url, i) => (
                          <div key={i} className="aspect-[3/4] rounded-xl overflow-hidden border border-border/30 shadow-md flex-shrink-0">
                            <img src={url} alt="AI Model" className="w-full h-full object-cover object-top" loading="lazy" />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Right - Text Content */}
            <div className="space-y-6 text-center lg:text-left order-first lg:order-last">
              <p className="text-xs font-bold text-primary uppercase tracking-wider">Increase Diversity</p>
              <h2 className="text-3xl md:text-5xl font-bold text-header-dark">
                More Models,<br /> <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Bigger Reach</span>
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Feature various looks and styles without hiring dozens of models. Get access to an exclusive and diverse AI model portfolio. Generate virtual fashion models with different ethnicities, body types, and styling so your creatives represent your entire customer base.
              </p>
              <Link to="/custom-models" className="w-full sm:w-auto hidden lg:flex justify-start">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 h-14 mt-2 w-full sm:w-auto">
                  Claim Your Premium Model <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>

            {/* CTA button - below scrolling images on mobile */}
            <Link to="/custom-models" className="w-full sm:w-auto flex lg:hidden justify-center order-last">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 h-14 w-full sm:w-auto">
                Claim Your Premium Model <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Section 7: ROI Calculator */}
      <IndustriesHighlightSection />
      <ROICalculator />

      {/* Section 8: Comparison */}
      <ComparisonSection
        headline={<h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-header-dark mb-4">Why Scaling Brands <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Switch to Floowy</span></h2>}
        subtitle="Everyone's talking about it. AI content creation made simple."
        floowyItems={[
          "9 specialized AI studios in one platform",
          "Product images, fashion, ads, video all covered",
          "No agency, no studio, no freelancers needed",
          "A/B testing at scale across all content types",
          "One upload, unlimited content",
          "Cost-efficient",
          "Consistent brand visuals",
          "Every platform format covered",
          "Respond to trends instantly",
        ]}
        othersItems={[
          "Separate tools for each content type",
          "Expensive agencies and freelancer stacks",
          "Inconsistent quality across tools",
          "Slow production and revision cycles",
          "Manual reformatting per platform",
          "High per-asset costs",
          "Complex multi-vendor coordination",
          "Limited creative testing capacity",
          "No unified workflow",
        ]}
      />

      {/* Section 9: Pricing */}
      <PricingSection />

      {/* Section 10: Testimonials */}
      <TestimonialsSection />

      {/* Section 11: FAQ */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12 scroll-animate">
            <h2 className="text-3xl md:text-5xl font-bold text-header-dark mb-4">
              Frequently Asked <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Questions</span>
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground">Everything you need to know about Floowy's AI studio suite</p>
          </div>
          <Accordion type="single" collapsible className="space-y-3 scroll-animate">
            {faqItems.map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="bg-card rounded-xl border border-border/50 px-6 data-[state=open]:shadow-md data-[state=open]:border-primary/25">
                <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline py-5">{item.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Section 12: Final CTA */}
      <section className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-primary/10 via-accent/20 to-primary-glow/10 rounded-3xl p-6 md:p-12 text-center border border-primary/20">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            <span className="text-header-dark">Ready to Scale Your</span> <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Ecommerce Content?</span>
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join 1000+ brands using Floowy's AI studio suite to create product images, fashion photography, ads, and videos at scale
          </p>
          <Link to="/auth?mode=signup">
            <Button size="lg" className="bg-offer text-offer-foreground hover:bg-offer-hover shadow-glow text-lg px-10 h-14 font-semibold">
              Start for €1
            </Button>
          </Link>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Tools;
