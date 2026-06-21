import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Upload, Wand2, Download, Check, X, ChevronRight, BookOpen, Layers, ArrowRight, Sparkles, Mail, Target, Settings } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import baskoLogo from "@/assets/logo-basko.png";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import TestimonialsSection from "@/components/TestimonialsSection";
import PricingSection from "@/components/PricingSection";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ROICalculator from "@/components/ROICalculator";
import PlatformsSection from "@/components/PlatformsSection";
import { useScrollAnimationInit } from "@/hooks/useScrollAnimationInit";
import flatlayStudioHero from "@/assets/flatlay-studio-hero.png";
import flatlayCaseStudy from "@/assets/flatlay-case-study.png";
import MetaTags from "@/components/MetaTags";
import StructuredData from "@/components/StructuredData";
import ComparisonSection from "@/components/ComparisonSection";
import FlatlayScrollingGrid from "@/components/FlatlayScrollingGrid";
import shopifyLogo from "@/assets/logo-shopify.svg";
import iconAmsterdamLogo from "@/assets/logo-icon-amsterdam.png";
import nimaniLogo from "@/assets/logo-nimani.png";
import welhofLogo from "@/assets/logo-welhof.png";
import lothLogo from "@/assets/logo-loth-fabenim.png";
import curlyGirlLogo from "@/assets/logo-curlygirl.png";
import cetaphilLogo from "@/assets/logo-cetaphil.png";
import marcelsLogo from "@/assets/logo-marcels.png";
import flatlayFeature1 from "@/assets/flatlay-feature-1.png";
import flatlayFeature2 from "@/assets/flatlay-feature-2.png";
import flatlayFeature3 from "@/assets/flatlay-feature-3.png";


import IndustriesHighlightSection from "@/components/IndustriesHighlightSection";
const FlatlayDemoVideo = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="max-w-5xl mx-auto rounded-2xl overflow-hidden shadow-2xl border border-border/50 aspect-video bg-black">
      {inView && (
        <iframe
          src="https://www.youtube-nocookie.com/embed/zAeEOkkK1ko?autoplay=1&mute=1&loop=1&playlist=zAeEOkkK1ko&controls=1&rel=0"
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="Flatlay Studio demo"
        />
      )}
    </div>
  );
};

const FlatlayLanding = () => {
  useScrollAnimationInit();
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <MetaTags 
        title="AI Flat Lay Photography for Ecommerce | Floowy AI"
        description="Create professional flat lay product photos with AI. No studio setup needed. Scale your ecommerce product images with Floowy AI."
        keywords="AI flat lay photography, ai flat lay generator, flat lay generator ai, ai product photography for fashion"
        canonicalUrl="https://floowy.ai/flatlay-studio"
      />
      <StructuredData type="organization" />
      <StructuredData 
        type="breadcrumb" 
        breadcrumbs={[
          { name: "Home", url: "https://floowy.ai" },
          { name: "Flat Lay Studio", url: "https://floowy.ai/flatlay-studio" }
        ]}
      />
      <Navigation />

      {/* Hero Section + Trust Bar */}
      <section className="relative overflow-hidden bg-[#e0f2e9]">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-start gap-8 lg:gap-12 pt-8 md:pt-12 pb-12 md:pb-20">
            <div className="flex w-full min-w-0 flex-1 flex-col items-center space-y-6 pt-4 text-center lg:items-start lg:pt-8 lg:text-left">
            
              <h1 className="max-w-full text-[2.15rem] font-bold tracking-tight leading-[1.05] text-header-dark sm:text-4xl md:text-5xl lg:text-[3.25rem] xl:text-6xl">
                Create Studio-Quality<br /> Flat Lay Product<br /> Photos <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">With AI</span>
              </h1>
            
              <p className="max-w-xl px-1 text-base text-muted-foreground sm:text-lg md:text-xl">
                Generate professional flat lay images for your product pages, ads, and social media in seconds. Upload your product, choose your style, and let AI handle the rest. Built for ecommerce brands that need polished product visuals at scale.
              </p>

              {/* Hero image - mobile only */}
              <div className="lg:hidden relative flex w-full max-w-full flex-col items-center overflow-hidden">
                <img 
                  src={flatlayStudioHero} 
                  alt="AI Flat Lay Photography" 
                  className="w-full max-w-[22rem] object-contain" loading="lazy" decoding="async"
                />
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#e0f2e9] to-transparent pointer-events-none" />
              </div>
              {/* Trust metrics - mobile */}
              <div className="lg:hidden grid grid-cols-3 gap-4 w-full max-w-md mx-auto px-4">
                <div className="text-center">
                  <p className="text-xl font-extrabold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">+32%</p>
                  <p className="text-xs text-muted-foreground">higher CTR on average</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-extrabold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">3x</p>
                  <p className="text-xs text-muted-foreground">faster creative production</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-extrabold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent whitespace-nowrap">€2K–€10K</p>
                  <p className="text-xs text-muted-foreground">/month saved on shoots</p>
                </div>
              </div>
              
              <div className="flex w-full flex-col items-center gap-3 pt-2 sm:w-auto sm:flex-row sm:justify-center lg:justify-start">
                <Link to="/auth?mode=signup" className="w-full sm:w-auto">
                  <Button size="lg" className="h-12 w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow text-base px-6 sm:h-14 sm:w-auto sm:text-lg sm:px-8">
                    <Sparkles className="w-5 h-5 mr-2" />
                    Start for €1
                  </Button>
                </Link>
                <Link to="/request-demo" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="h-12 w-full text-base px-6 backdrop-blur-sm border-foreground text-foreground hover:bg-foreground hover:text-background sm:h-14 sm:w-auto sm:text-lg sm:px-8">
                    <Mail className="w-5 h-5 mr-2" />
                    Book a Call
                  </Button>
                </Link>
              </div>
              <div className="text-center">
                <p className="text-base font-semibold text-foreground">€1 for your first 3 days</p>
                <p className="text-sm text-muted-foreground">Cancel anytime</p>
              </div>

              <div className="w-full max-w-full pt-4">
                <div className="flex w-full flex-wrap items-center justify-center gap-3 mb-3 lg:justify-start">
                  <img src={shopifyLogo} alt="Shopify" className="h-6 w-auto" loading="lazy" decoding="async" />
                  <span className="text-center text-sm sm:text-base lg:text-lg text-muted-foreground">Trusted by 1000+ brands with €10m in revenue</span>
                </div>
                <div className="relative w-full overflow-hidden max-w-md lg:max-w-lg">
                  <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#e0f2e9] to-transparent z-10" />
                  <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#e0f2e9] to-transparent z-10" />
                  <div className="flex items-center gap-8 animate-[scroll-left_15s_linear_infinite] w-max">
                    <img src={iconAmsterdamLogo} alt="ICON Amsterdam" className="h-10 lg:h-12 w-auto opacity-90 shrink-0" loading="lazy" decoding="async" />
                    <img src={nimaniLogo} alt="Nimani" className="h-8 lg:h-10 w-auto opacity-90 shrink-0" loading="lazy" decoding="async" />
                    <img src={welhofLogo} alt="Welhof" className="h-8 lg:h-10 w-auto opacity-90 shrink-0" loading="lazy" decoding="async" />
                    <img src={lothLogo} alt="Loth Fabernim" className="h-8 lg:h-10 w-auto opacity-90 shrink-0" loading="lazy" decoding="async" />
                    <img src={curlyGirlLogo} alt="CurlyGirl" className="h-8 lg:h-10 w-auto opacity-90 shrink-0" loading="lazy" decoding="async" />
                    <img src={cetaphilLogo} alt="Cetaphil" className="h-8 lg:h-10 w-auto opacity-90 shrink-0" loading="lazy" decoding="async" />
                    <img src={marcelsLogo} alt="Marcels Green Soap" className="h-8 lg:h-10 w-auto opacity-90 shrink-0" loading="lazy" decoding="async" />
                    <img src={iconAmsterdamLogo} alt="ICON Amsterdam" className="h-10 lg:h-12 w-auto opacity-90 shrink-0" loading="lazy" decoding="async" />
                    <img src={nimaniLogo} alt="Nimani" className="h-8 lg:h-10 w-auto opacity-90 shrink-0" loading="lazy" decoding="async" />
                    <img src={welhofLogo} alt="Welhof" className="h-8 lg:h-10 w-auto opacity-90 shrink-0" loading="lazy" decoding="async" />
                    <img src={lothLogo} alt="Loth Fabernim" className="h-8 lg:h-10 w-auto opacity-90 shrink-0" loading="lazy" decoding="async" />
                    <img src={curlyGirlLogo} alt="CurlyGirl" className="h-8 lg:h-10 w-auto opacity-90 shrink-0" loading="lazy" decoding="async" />
                    <img src={cetaphilLogo} alt="Cetaphil" className="h-8 lg:h-10 w-auto opacity-90 shrink-0" loading="lazy" decoding="async" />
                    <img src={marcelsLogo} alt="Marcels Green Soap" className="h-8 lg:h-10 w-auto opacity-90 shrink-0" loading="lazy" decoding="async" />
                  </div>
                </div>
              </div>

            </div>
            {/* Hero image - desktop only */}
            <div className="flex-1 hidden lg:flex flex-col items-end relative">
              <img 
                src={flatlayStudioHero} 
                alt="AI Flat Lay Photography" 
                className="w-full max-w-2xl object-contain" loading="lazy" decoding="async"
              />
              <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#e0f2e9] to-transparent pointer-events-none" />
              {/* Trust metrics - overlaid on fade */}
              <div className="absolute -bottom-[20px] left-0 right-0 grid grid-cols-3 gap-6 w-full max-w-2xl z-10">
                <div className="text-center">
                  <p className="text-xl md:text-2xl font-extrabold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent whitespace-nowrap">+32%</p>
                  <p className="text-sm text-muted-foreground">higher CTR on average</p>
                </div>
                <div className="text-center">
                  <p className="text-xl md:text-2xl font-extrabold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent whitespace-nowrap">3x</p>
                  <p className="text-sm text-muted-foreground">faster creative production</p>
                </div>
                <div className="text-center">
                  <p className="text-xl md:text-2xl font-extrabold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent whitespace-nowrap">€2K–€10K</p>
                  <p className="text-sm text-muted-foreground">/month saved on shoots</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Case Study Block */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16 scroll-animate">
              <h2 className="text-3xl md:text-5xl font-bold text-header-dark mb-4">
                Stop Wasting Hours on Product Photography <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Setup</span>
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto">
                Create unlimited flat lay product images without props, studio lighting, or hours of arrangement. Generate clean, professional product photos that convert.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center scroll-animate">
              {/* Left: UI screenshot */}
              <div className="rounded-2xl overflow-hidden shadow-2xl border border-border/30 bg-card p-3 sm:p-4 max-w-md lg:max-w-lg mx-auto">
                <img 
                  src={flatlayCaseStudy} 
                  alt="Flat Lay Studio showing product upload and AI-generated flat lay result" 
                  className="block w-full h-auto object-cover rounded-xl"
                  loading="lazy"
                />
              </div>

              {/* Right: Case stats */}
              <div className="space-y-5 text-center lg:text-left">
                <h3 className="text-2xl md:text-3xl font-bold text-header-dark">
                  One upload. Endless flat lay styles.
                </h3>

                <p className="text-muted-foreground leading-relaxed text-base md:text-lg">
                  Upload a single product photo and generate perfectly styled flat lay compositions in seconds. Clean white backgrounds, textured surfaces, or styled arrangements with complementary props, all without touching a camera.
                </p>

                <div className="bg-muted/50 rounded-xl p-5">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <p className="text-4xl md:text-5xl font-extrabold leading-none bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">+7%</p>
                      <p className="text-xs md:text-sm font-semibold text-primary uppercase tracking-wide mt-1">conversion increase</p>
                    </div>
                    <p className="text-sm md:text-base text-muted-foreground">By producing more product image variations and launching campaigns faster, Baskostore significantly improved conversion rates and reduced content production costs.</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <img src={baskoLogo} alt="Baskostore" className="h-14 object-contain" loading="lazy" decoding="async" />
                  <Link to="/cases" className="inline-flex items-center gap-1 text-sm font-medium text-foreground hover:text-primary transition-colors">
                    Read case study <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* How It Works Section */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12 scroll-animate">
              <h2 className="text-3xl md:text-5xl font-bold text-header-dark mb-4">
                How It <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Works</span>
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
                Four simple steps to professional flat lay product photos
              </p>
            </div>

            {/* Demo Video */}
            <div className="mb-16 scroll-animate">
              <FlatlayDemoVideo />
            </div>

            {/* 4 Steps - circular node layout */}
            <div className="relative scroll-animate">
              {/* Desktop connecting line */}
              <div className="hidden md:block absolute top-[60px] left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" />

              <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-6">
                {[
                  { icon: Upload, step: "1", title: "Upload", desc: "Upload your product photo. Clothing, accessories, beauty products, or any item." },
                  { icon: Layers, step: "2", title: "Choose Layout", desc: "Select a flat lay style: clean packshot, styled arrangement, or custom composition." },
                  { icon: Settings, step: "3", title: "Customize", desc: "Pick your background surface, add complementary props, and adjust the styling." },
                  { icon: Wand2, step: "4", title: "Generate", desc: "Get your studio-quality flat lay image in seconds, ready for your webshop or ads." },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center text-center group relative">
                    {/* Mobile connecting line */}
                    {i < 3 && (
                      <div className="md:hidden absolute -bottom-7 left-1/2 -translate-x-1/2 flex flex-col items-center">
                        <div className="w-[2px] h-5 bg-gradient-to-b from-primary/40 to-primary/10" />
                        <ChevronRight className="w-4 h-4 text-primary/30 rotate-90" />
                      </div>
                    )}
                    {/* Circle node */}
                    <div className="relative w-[100px] h-[100px] md:w-[120px] md:h-[120px] rounded-full bg-gradient-to-b from-card to-muted flex items-center justify-center border border-border/50 shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all duration-500 mb-5">
                      <item.icon className="w-8 h-8 md:w-10 md:h-10 text-primary" />
                      <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shadow-md">
                        {item.step}
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-[260px]">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Callout block */}
            <div className="mt-16 scroll-animate">
              <div className="relative rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-accent/10 p-8 md:p-10 text-center overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.08),transparent_70%)]" />
                <div className="relative z-10">
                  <BookOpen className="w-8 h-8 text-primary mx-auto mb-4" />
                  <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2">Need More Clarity?</h3>
                  <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                    Check our detailed knowledge base guide for step-by-step instructions.
                  </p>
                  <Link to="/knowledge-base/flatlay-studio">
                    <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                      View Flatlay Studio Guide <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Every Style, One Tool Section */}
      <section className="py-8 md:py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              <div className="scroll-animate space-y-5 text-center lg:text-left order-first lg:order-last">
                <span className="inline-block text-xs font-mono tracking-[0.3em] uppercase text-primary">
                  Unlimited Styles
                </span>
                <h2 className="text-3xl md:text-5xl font-bold text-header-dark">
                  Every Flat Lay Style,<br /><span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">One Tool</span>
                </h2>
                <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
                  From clean white packshots for your webshop to beautifully styled arrangements for social media. Generate flat lay images on marble, wood, linen, or any surface you can imagine. Add complementary props, seasonal elements, or keep it minimal. Floowy's AI flat lay generator handles every style your ecommerce brand needs.
                </p>
                <div className="pt-2 hidden lg:flex justify-start">
                  <Link to="/auth?mode=signup">
                    <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground rounded-full px-6">
                      Start Creating <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="scroll-animate rounded-2xl overflow-hidden order-last lg:order-first">
                <FlatlayScrollingGrid />
              </div>
              <div className="pt-2 flex lg:hidden justify-center order-last">
                <Link to="/auth?mode=signup">
                  <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground rounded-full px-6">
                    Start Creating <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <IndustriesHighlightSection />
      <ROICalculator />

      {/* Our Main Features Section */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14 scroll-animate">
              <span className="inline-block text-xs font-mono tracking-[0.3em] uppercase text-primary mb-4">
                Our Main Features
              </span>
              <h2 className="text-3xl md:text-5xl font-bold text-header-dark mb-4">
                Everything You Need to Scale<br /><span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Product Photography</span>
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto">
                Generate production-grade flat lay product images without expensive photoshoots. From clean packshots to styled compositions, create visuals that drive conversions across every sales channel.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 scroll-animate">
              {[
                {
                  title: "Create a Packshot",
                  desc: "Generate clean, professional product images on white or solid color backgrounds. Perfect for webshop listings, marketplace requirements, and product detail pages.",
                  icon: Layers,
                  image: flatlayFeature1,
                },
                {
                  title: "Create a Styled Flat Lay",
                  desc: "Build beautiful product arrangements with complementary props, textures, and surfaces. Ideal for social media, ads, and editorial content.",
                  icon: Sparkles,
                  image: flatlayFeature2,
                },
                {
                  title: "Match Your Brand",
                  desc: "Keep every product image consistent with your brand identity. Set preferred surfaces, color palettes, and styling to maintain a cohesive look across your entire catalog.",
                  icon: Wand2,
                  image: flatlayFeature3,
                },
              ].map((feature, i) => (
                <Card key={i} className="bg-card border-border/50 hover:shadow-lg transition-all duration-300 group overflow-hidden">
                  <div className="aspect-[3/4] overflow-hidden">
                    <img src={feature.image} alt={feature.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" decoding="async" />
                  </div>
                  <CardContent className="p-6 md:p-8 space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      <PlatformsSection />



      <div id="pricing">
        <PricingSection />
      </div>

      <ComparisonSection
        headline={<h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-header-dark mb-4">Why Scaling Brands <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Switch to Floowy</span></h2>}
        subtitle="Everyone's talking about it. AI content creation made simple."
        othersLabel="Others"
        floowyItems={[
          "Unlimited flat lay generation",
          "Any surface, any style, any composition",
          "No props or studio setup needed",
          "Instant A/B testing at scale",
          "Seconds from upload to finished image",
          "Cost-efficient",
          "Consistent product photography",
          "Seasonal styles on demand",
          "One tool for all channels",
        ]}
        othersItems={[
          "Expensive studio setups and prop sourcing",
          "Hours of arrangement and styling per shot",
          "Inconsistent lighting across sessions",
          "Limited variations per shoot",
          "Manual retouching and editing",
          "Long turnaround times",
          "High per-image production costs",
          "Storage and transport of props",
          "Difficult to maintain consistency at scale",
        ]}
        ctaText="Start for €1"
      />

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* FAQ Section */}
      <section className="container mx-auto px-4 py-6 md:py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 px-4">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-header-dark mb-4">
              Frequently Asked <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Questions</span>
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground">
              Everything you need to know about Flatlay Studio
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-4">
            {[
              { q: "What is AI flat lay photography?", a: "AI flat lay photography uses artificial intelligence to generate professional top-down product images without a traditional studio setup. Instead of manually arranging products, props, and lighting, you upload your product photo and the AI creates a perfectly composed flat lay image in seconds. Floowy's Flatlay Studio is built specifically for ecommerce brands that need high-quality AI product photography for webshops, marketplace listings, ads, and social media at scale." },
              { q: "How does an AI flat lay generator create realistic product images?", a: "Floowy's AI flat lay generator analyzes your product photo for shape, color, texture, and proportions. It then generates a photorealistic flat lay composition with accurate shadows, natural lighting, and true-to-product details. You can choose the background surface, add complementary props, and select the overall styling. The result is a studio-quality flat lay image that looks like it was professionally photographed." },
              { q: "Can AI flat lay photography replace traditional product photoshoots?", a: "For the majority of ecommerce product photography use cases, yes. AI flat lay tools like Floowy generate images that are visually indistinguishable from traditional flat lay photography. Brands report 3x faster content production and significant savings on studio setups, prop sourcing, and photographer fees. AI is especially powerful for generating multiple product image variations from a single upload, something that would take hours with a traditional setup." },
              { q: "What types of products work best with AI flat lay photography?", a: "Floowy's Flatlay Studio works with all types of products. Clothing and apparel, shoes, bags, jewelry, beauty products, accessories, food packaging, electronics, and home goods all produce excellent results. The AI is trained to handle different fabric textures, materials, and product shapes. For best results, upload a clean, well-lit product photo where the item is clearly visible." },
              { q: "Can I create flat lay images for marketplace listings on bol.com, Amazon, and Zalando?", a: "Yes. Floowy generates AI product images that meet the requirements of all major ecommerce marketplaces. Whether you need clean white background packshots for bol.com and Amazon, or styled flat lay visuals for Zalando and About You, the Flatlay Studio exports in the correct dimensions and quality. This is especially useful for brands selling across multiple European marketplaces with different image guidelines." },
              { q: "Can AI create styled flat lay compositions with props?", a: "Absolutely. Floowy's AI doesn't just place your product on a plain background. You can generate styled flat lay arrangements with complementary props, seasonal elements, and different surface textures like marble, wood, linen, or concrete. This makes it easy to create editorial-quality product photos for Instagram, Pinterest, and ad campaigns without sourcing physical props or setting up a studio." },
              { q: "How does AI flat lay photography help with ecommerce conversion rates?", a: "High-quality product images are one of the biggest drivers of ecommerce conversions. AI flat lay photography lets you create more product image variations, test different visual styles, and optimize your listings faster than with traditional photography. Brands using Floowy report +32% higher CTR on product listings that use AI-generated flat lay images compared to basic product shots. More visual variety means more chances to stop the scroll and convert browsers into buyers." },
              { q: "Can AI generate flat lay images for social media and ad campaigns?", a: "Yes. Floowy generates flat lay visuals optimized for every major platform. Create Instagram-ready styled arrangements, Pinterest-optimized product shots, and ad creatives for Meta, TikTok, Google Shopping, and Snapchat. The AI produces flat lay images in the correct aspect ratios for each platform, so you can go from upload to published in minutes instead of days." },
              { q: "How does Floowy's Flatlay Studio compare to generic AI image generators?", a: "Unlike generic AI image tools, Floowy's Flatlay Studio is purpose-built for ecommerce product photography. The AI is specifically trained on product images, flat lay compositions, and commercial photography standards. This means accurate product proportions, realistic textures, proper shadow placement, and outputs that are ready to use on your webshop and ads without additional editing. Generic AI tools often produce results that look artificial or require heavy manual corrections." },
              { q: "Is Floowy's Flatlay Studio available for ecommerce brands in the Netherlands?", a: "Yes. Floowy is founded and based in the Netherlands and is used by hundreds of Dutch ecommerce brands for their product photography needs. Whether you're selling on bol.com, running a Shopify store from Amsterdam, or managing product listings from Rotterdam, The Hague, or Utrecht, Floowy's AI flat lay generator is built for the Dutch market. All pricing is in EUR, support is available in Dutch and English, and the tool generates images that meet bol.com and other Dutch marketplace requirements." },
              { q: "Can ecommerce brands in Belgium use Floowy's Flatlay Studio?", a: "Absolutely. Floowy serves a growing number of ecommerce brands in Belgium, from online retailers in Antwerp and Brussels to fashion and beauty brands in Ghent, Bruges, and Leuven. The platform works in Dutch, French, and English, making it ideal for Belgian brands selling on bol.com Belgium, Amazon BE, or their own webshops. Generate professional AI flat lay product images for the Benelux market and beyond." },
              { q: "Does Floowy work for German ecommerce brands?", a: "Yes. Floowy is used by ecommerce brands across Germany, from Berlin and Hamburg to Munich, Frankfurt, and Cologne. The AI flat lay generator supports EUR pricing and produces images that meet the requirements of Zalando, About You, Amazon DE, and Otto. Whether you need clean packshots for your German webshop or styled flat lays for social media campaigns targeting German consumers, Floowy delivers at scale." },
              { q: "Is Floowy suitable for UK ecommerce brands?", a: "Yes. Floowy works with ecommerce brands across the United Kingdom, including London, Manchester, Birmingham, Leeds, and Edinburgh. The Flatlay Studio generates AI product images that meet the quality and format requirements of Amazon UK, ASOS Marketplace, and Etsy UK. Create professional flat lay product photos and styled compositions for UK-targeted ads on Meta, TikTok, and Google Shopping without a local studio." },
              { q: "Which European countries does Floowy support?", a: "Floowy supports ecommerce brands across all of Europe. The platform is actively used in the Netherlands, Belgium, Germany, the United Kingdom, France, Spain, Italy, Portugal, and the Nordics. With EUR and GBP pricing, multilingual support, and export options optimized for all major European marketplaces and ad platforms, Floowy is the AI flat lay photography tool of choice for brands scaling their product visuals across the EU." },
            ].map((item, i) => (
              <AccordionItem key={i} value={`item-${i + 1}`} className="border-border/50 bg-card/50 backdrop-blur-sm rounded-lg px-6 border">
                <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-primary/10 via-accent/20 to-primary-glow/10 rounded-3xl p-6 md:p-12 text-center border border-primary/20">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            <span className="text-header-dark">Ready to Transform Your</span> <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Product Photography?</span>
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join ecommerce brands creating stunning flat lay visuals with AI
          </p>
          <Link to="/auth?mode=signup">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow text-lg px-10 h-14 font-semibold">
              Start for €1
            </Button>
          </Link>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default FlatlayLanding;
