import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SUBSCRIPTION_PLANS } from "@/lib/stripe-config";
import { Link } from "react-router-dom";
import { Sparkles, Upload, Wand2, Download, Check, Image, TrendingUp, Clock, X, ChevronRight, BookOpen, Megaphone, Target, Zap, User, ImageIcon, Type, Palette, MousePointer, ArrowRight, Mail } from "lucide-react";
import GenerationDemoShowcase from "@/components/GenerationDemoShowcase";
import KBVideoHero from "@/components/KBVideoHero";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import TestimonialsSection from "@/components/TestimonialsSection";

import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ROICalculator from "@/components/ROICalculator";
import ComparisonSection from "@/components/ComparisonSection";
import PlatformsSection from "@/components/PlatformsSection";
import PricingSection from "@/components/PricingSection";
import { useScrollAnimationInit } from "@/hooks/useScrollAnimationInit";
import logoImage from "@/assets/floowy-logo.png";
import MetaTags from "@/components/MetaTags";
import StructuredData from "@/components/StructuredData";
import adsStudioHero from "@/assets/ads-studio-hero.png";
import adsStudioUiMockup from "@/assets/ads-studio-ui-mockup.jpg";
import shopifyLogo from "@/assets/logo-shopify.svg";
import iconAmsterdamLogo from "@/assets/logo-icon-amsterdam.png";
import nimaniLogo from "@/assets/logo-nimani.png";
import welhofLogo from "@/assets/logo-welhof.png";
import lothLogo from "@/assets/logo-loth-fabenim.png";
import caseStudyImage from "@/assets/ads-studio-case-study.png";
import curlyGirlLogo from "@/assets/logo-curlygirl.png";
import cetaphilLogo from "@/assets/logo-cetaphil.png";
import curlyGirlLogoFull from "@/assets/curlygirlmovement-logo.png";
import marcelsLogo from "@/assets/logo-marcels.png";
import adFormatsGrid from "@/assets/ad-formats-grid.jpg";
import AdScrollingGrid from "@/components/AdScrollingGrid";
import adsFeatureCreatives from "@/assets/ads-feature-creatives.jpg";
import adsFeatureCopy from "@/assets/ads-feature-copy.jpg";
import adsFeaturePlatforms from "@/assets/ads-feature-platforms.webp";

import IndustriesHighlightSection from "@/components/IndustriesHighlightSection";
const AdsStudioDemoVideo = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect(); } },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="max-w-5xl mx-auto">
      <div className="rounded-2xl overflow-hidden shadow-2xl border border-border/50 aspect-video relative bg-black">
        {inView && (
          <iframe
            src="https://www.youtube-nocookie.com/embed/YijEcAaEc10?autoplay=1&mute=1&rel=0"
            className="w-full h-full absolute inset-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Ads Studio demo video"
          />
        )}
      </div>
    </div>
  );
};

const AdsStudioLanding = () => {
  useScrollAnimationInit();
  
  
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <MetaTags 
        title="AI Ad Creative Generator for Ecommerce | Floowy AI"
        description="Generate high-converting ad creatives, copy, and variations with AI. Scale your ecommerce ads across Meta, TikTok, and Google."
        keywords="AI ad creative generator, ads ai, ai powered ads, facebook ads ai, tiktok ai ads, ai social media ad generator"
        canonicalUrl="https://floowy.ai/ads-studio"
      />
      <StructuredData type="organization" />
      <StructuredData 
        type="breadcrumb" 
        breadcrumbs={[
          { name: "Home", url: "https://floowy.ai" },
          { name: "Ads Studio", url: "https://floowy.ai/ads-studio" }
        ]}
      />
      <Navigation />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#e0f2e9]">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-start gap-8 lg:gap-12 pt-8 md:pt-12 pb-12 md:pb-20">
            <div className="flex w-full min-w-0 flex-1 flex-col items-center space-y-6 pt-4 text-center lg:items-start lg:pt-8 lg:text-left">
            
            <h1 className="max-w-full text-[2.15rem] font-bold tracking-tight leading-[1.05] text-header-dark sm:text-4xl md:text-5xl lg:text-[3.25rem] xl:text-6xl">
               Generate<br /> High-Converting<br /> Ad Creatives in<br /> <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Minutes, Not Days</span>
              </h1>
            
            <p className="max-w-xl px-1 text-base text-muted-foreground sm:text-lg md:text-xl">
              Create scroll-stopping ad creatives, headlines, and copy variations for Meta, TikTok, Google, and Instagram with AI. Built for ecommerce brands that need winning ads at scale without the creative bottleneck.
            </p>

            {/* Hero image - mobile only */}
            <div className="lg:hidden relative flex w-full max-w-full flex-col items-center overflow-hidden">
              <img 
                src={adsStudioHero} 
                alt="AI Ad Creatives" 
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
                <Button size="lg" className="h-12 w-full bg-offer text-offer-foreground hover:bg-offer-hover shadow-glow text-base px-6 sm:h-14 sm:w-auto sm:text-lg sm:px-8">
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
                src={adsStudioHero} 
                alt="AI Ad Creatives" 
                className="w-full max-w-2xl object-contain" loading="lazy" decoding="async"
              />
              <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#e0f2e9] to-transparent pointer-events-none" />
              {/* Trust metrics - overlaid on fade */}
              <div className="absolute -bottom-[60px] left-0 right-0 grid grid-cols-3 gap-6 w-full max-w-2xl z-10">
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
                Stop Guessing Which Ad Creative Will <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Win</span>
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto">
                Your best ads already exist. The problem is testing enough variations to find what works. Ads Studio lets you generate and test dozens of creatives in hours instead of weeks.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center scroll-animate">
              {/* Left: Actual UI screenshot */}
              <div className="rounded-2xl overflow-hidden shadow-2xl border border-border/30 bg-card p-3 sm:p-4 max-w-md lg:max-w-lg mx-auto">
                <img 
                  src={caseStudyImage} 
                  alt="Ads Studio interface showing ad creative generation for Curlygirlmovement" 
                  className="block w-full h-auto object-cover rounded-xl"
                  loading="lazy"
                />
              </div>

              {/* Right: Case stats */}
              <div className="space-y-5 text-center lg:text-left">
                <h3 className="text-2xl md:text-3xl font-bold text-header-dark">
                  One winning idea. Dozens of variations to test.
                </h3>

                <p className="text-muted-foreground leading-relaxed text-base md:text-lg">
                  Upload your best-performing ad or campaign visual and let AI generate fresh variations instantly. Launch A/B tests faster, kill underperformers sooner, and double down on what converts. No more waiting weeks for new creatives before you can start testing.
                </p>

                <div className="bg-muted/50 rounded-xl p-5">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <p className="text-4xl md:text-5xl font-extrabold leading-none bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">+21%</p>
                      <p className="text-xs md:text-sm font-semibold text-primary uppercase tracking-wide mt-1">ROAS increase</p>
                    </div>
                    <p className="text-sm md:text-base text-muted-foreground">By rapidly A/B testing AI generated ad variations, Curlygirlmovement identified winning creatives faster and improved return on ad spend across all paid social channels.</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <img src={curlyGirlLogoFull} alt="Curlygirlmovement" className="h-10 md:h-12 w-auto dark:invert-0" style={{ filter: 'brightness(0)' }} loading="lazy" decoding="async" />
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
                Four simple steps to high-performing ad creatives
              </p>
            </div>

            {/* Demo Video */}
            <div className="mb-16 scroll-animate">
              <AdsStudioDemoVideo />
            </div>

            {/* 4 Steps - circular node layout */}
            <div className="relative scroll-animate">
              {/* Desktop connecting line */}
              <div className="hidden md:block absolute top-[60px] left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" />

              <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-6">
                {[
                  { icon: Upload, step: "1", title: "Upload Your Product", desc: "Upload a product image or enter your product URL. The AI analyzes your product to generate relevant ad creatives." },
                  { icon: Target, step: "2", title: "Choose Your Platform", desc: "Select the platform you're creating for: Meta, TikTok, Google, Instagram, LinkedIn, or Snapchat." },
                  { icon: Wand2, step: "3", title: "Generate Creatives", desc: "AI creates multiple ad variations with visuals, headlines, copy, and hooks optimized for your selected platform." },
                  { icon: Download, step: "4", title: "Launch & Test", desc: "Download your ad creatives and launch them directly. A/B test at scale to find your best performers." },
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
                  <Link to="/knowledge-base/ads-studio">
                    <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                      View Ads Studio Guide <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Every Ad Format Section */}
      <section className="py-8 md:py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              {/* Text - shown first on mobile, second on desktop */}
              <div className="scroll-animate space-y-5 text-center lg:text-left order-first lg:order-last">
                <span className="inline-block text-xs font-mono tracking-[0.3em] uppercase text-primary">
                  Unlimited Formats
                </span>
                <h2 className="text-3xl md:text-5xl font-bold text-header-dark">
                  Every Ad Format,<br /><span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">One Tool</span>
                </h2>
                <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
                  From static image ads and carousels to story formats and video thumbnails. Generate ad creatives optimized for every major platform and placement. Facebook feed, Instagram Stories, TikTok in-feed, Google Display, LinkedIn sponsored posts, and more. Floowy's AI ads generator handles every format your ecommerce brand needs to scale.
                </p>
                <div className="pt-2 hidden lg:flex justify-start">
                  <Link to="/auth?mode=signup">
                    <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground rounded-full px-6">
                      Start Creating <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Scrolling grid - shown second on mobile, first on desktop */}
              <div className="scroll-animate rounded-2xl overflow-hidden order-last lg:order-first">
                <AdScrollingGrid />
              </div>

              {/* CTA button - below scrolling images on mobile only */}
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


      {/* ROI Calculator */}
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
                Everything You{" "}<span className="hidden md:inline">Need to Scale</span><br className="md:hidden" /><span className="md:hidden">Need to Scale</span><br />
                <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Ad Creative Production</span>
              </h2>
              <p className="text-muted-foreground text-base md:text-lg leading-relaxed max-w-3xl mx-auto">
                Generate ad creatives, copy, and variations without agencies or designers. From concept to launch-ready ads in minutes, optimized for performance across every platform.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="scroll-animate text-center md:text-left" style={{ transitionDelay: '0.1s' }}>
                <div className="rounded-2xl overflow-hidden shadow-xl border border-border/30 mb-5">
                  <img src={adsFeatureCreatives} alt="AI generated ad creative example" className="block w-full h-auto object-cover" loading="lazy" />
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-3">
                  <ImageIcon className="w-4 h-4" />
                  Generate Ad Creatives
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-header-dark mb-2">
                  One product image. Dozens of ad variations.
                </h3>
                <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                  Create dozens of ad variations from a single product image. AI generates scroll-stopping visuals with on-brand styling, optimized layouts, and platform-specific formats.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="scroll-animate text-center md:text-left" style={{ transitionDelay: '0.2s' }}>
                <div className="rounded-2xl overflow-hidden shadow-xl border border-border/30 mb-5">
                  <img src={adsFeatureCopy} alt="AI generated ad copy and headlines" className="block w-full h-auto object-cover" loading="lazy" />
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-3">
                  <Type className="w-4 h-4" />
                  Generate Ad Copy & Headlines
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-header-dark mb-2">
                  Headlines that convert. Copy that clicks.
                </h3>
                <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                  Get high-converting ad copy, headlines, and hooks generated by AI. Test different angles, tones, and messaging to find what resonates with your audience.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="scroll-animate text-center md:text-left" style={{ transitionDelay: '0.3s' }}>
                <div className="rounded-2xl overflow-hidden shadow-xl border border-border/30 mb-5 aspect-[3/4]">
                  <img src={adsFeaturePlatforms} alt="Ad creatives scaled across platforms" className="block w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-3">
                  <Target className="w-4 h-4" />
                  Scale Across Platforms
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-header-dark mb-2">
                  One workflow. Every platform covered.
                </h3>
                <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                  Export ad creatives in the right dimensions for Meta, TikTok, Google, Instagram, LinkedIn, and Snapchat. One workflow, every platform covered.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* More Models, Bigger Reach */}
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
              <Button size="lg" className="bg-offer text-offer-foreground hover:bg-offer-hover text-lg px-8 h-14 w-full sm:w-auto">
                Claim Your Premium Model <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Create Once, Launch Anywhere */}
      <PlatformsSection />


      {/* Pricing Section */}
      <PricingSection 
        title={<><span className="text-header-dark">Less Than One Agency Brief.</span>{" "}<span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Unlimited Ad Creatives.</span></>}
        subtitle="Most ecommerce brands spend thousands per month on creative agencies and freelancers. Floowy replaces that and scales far beyond it."
      />

      <ComparisonSection
        headline={
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-header-dark mb-4">
            Why Scaling Brands <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Switch to Floowy</span>
          </h2>
        }
        ctaText="Start for €1"
        floowyItems={[
          "Unlimited ad creative generation",
          "AI ad copy, headlines, and hooks included",
          "No agency or freelancer needed",
          "Instant A/B testing at scale",
          "Seconds from product to finished ad",
          "Cost-efficient",
          "Consistent brand visuals across all ads",
          "Every platform format covered",
          "Respond to trends instantly",
        ]}
        othersItems={[
          "Expensive agency retainers",
          "Days or weeks per creative brief",
          "Inconsistent quality across deliverables",
          "Limited variations per round",
          "Manual copy and design iterations",
          "Long feedback and approval cycles",
          "High per-creative production costs",
          "Platform-specific reformatting needed",
          "Difficult to test at scale",
        ]}
      />

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* FAQ Section */}
      <section className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 px-4 scroll-animate">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-header-dark mb-4">
              Frequently Asked <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Questions</span>
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground">
              Everything you need to know about Ads Studio
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-4 scroll-animate" style={{ transitionDelay: '0.1s' }}>
            {[
              {
                q: "What is an AI ad creative generator?",
                a: "An AI ad creative generator is a tool that uses artificial intelligence to produce ready-to-launch ad creatives, including visuals, headlines, and copy. Instead of briefing a designer or agency, you upload your product image and the AI generates multiple ad variations optimized for platforms like Meta, TikTok, Google, and Instagram. Floowy's Ads Studio is built specifically for ecommerce brands that need high-converting AI ad creatives at scale."
              },
              {
                q: "How does an AI ads generator create multiple ad variations?",
                a: "Floowy's AI ads generator analyzes your product, brand styling, and target platform to produce dozens of unique ad creatives in minutes. Each variation includes different visual compositions, headlines, hooks, and copy angles. This lets you A/B test at scale and find winning ads faster than manually creating each version with a designer or agency."
              },
              {
                q: "Can AI generate ad copy that converts?",
                a: "Yes. Floowy's AI ad copy generator creates performance-focused headlines, body text, hooks, and calls to action based on proven copywriting frameworks. The AI generates multiple copy variations for each creative so you can test different angles, tones, and messaging. Brands using AI-generated ad copy report faster iteration cycles and improved click-through rates compared to manually written copy."
              },
              {
                q: "Can AI create Facebook and Instagram ads automatically?",
                a: "Absolutely. Floowy's AI Facebook ads generator and AI Instagram ads generator create platform-optimized ad creatives in the correct dimensions and formats. Generate feed ads, Stories, Reels covers, and carousel creatives for Meta platforms in seconds. Each ad is designed to stop the scroll and drive ecommerce conversions."
              },
              {
                q: "Can AI generate Google Ads creatives?",
                a: "Yes. Floowy's AI Google ads generator produces display ads, Shopping visuals, and responsive ad assets optimized for the Google Ads ecosystem. Generate multiple size variations for Display Network campaigns, product images for Google Shopping, and compelling visual assets for Performance Max campaigns. All from a single product upload."
              },
              {
                q: "Can AI create TikTok ads for ecommerce brands?",
                a: "Yes. Floowy's AI TikTok ads generator creates native-feeling ad creatives optimized for the TikTok feed. Generate vertical video thumbnails, in-feed ad visuals, and Spark Ad assets that match the organic content style TikTok users engage with. This is especially valuable for ecommerce brands running TikTok Shop campaigns and needing fresh creatives daily."
              },
              {
                q: "How can AI help with A/B testing ad creatives at scale?",
                a: "Traditional ad production limits how many variations you can test. Floowy's AI ad variations generator produces dozens of unique creatives from a single product image, each with different visual styles, copy angles, and hooks. This lets performance marketers run proper A/B tests across audiences, placements, and messaging without the bottleneck of manual creative production. More variations tested means finding winners faster and lowering your cost per acquisition."
              },
              {
                q: "Can AI generate product ads for ecommerce automatically?",
                a: "Yes. Floowy's AI product ads generator is specifically built for ecommerce. Upload a product photo and the AI generates ad creatives tailored for product promotion across Meta, TikTok, Google Shopping, Instagram, and LinkedIn. Each creative includes product-focused visuals with compelling copy and clear CTAs designed to drive clicks and conversions for your online store."
              },
              {
                q: "How does AI advertising automation save time and money?",
                a: "AI advertising automation eliminates the manual work of briefing designers, waiting for revisions, and reformatting ads for different platforms. With Floowy, what used to take days or weeks of creative production now happens in minutes. Ecommerce brands report saving thousands per month on agency fees and freelancer costs while producing 10x more ad variations. The AI handles creative generation, copy writing, and multi-platform formatting so your team can focus on strategy and optimization."
              },
              {
                q: "Is Floowy's Ads Studio available for ecommerce brands in the Netherlands?",
                a: "Yes. Floowy is founded and based in the Netherlands and is used by hundreds of Dutch ecommerce brands for their ad creative production. Whether you're running Meta Ads from Amsterdam, managing Google Shopping campaigns from Rotterdam, or scaling TikTok ads from Utrecht, Floowy's AI ads generator is built for the Dutch market. All pricing is in EUR, support is available in Dutch and English, and the platform is optimized for the platforms and marketplaces Dutch brands sell on."
              },
              {
                q: "Can ecommerce brands in Belgium use Floowy's AI ads generator?",
                a: "Absolutely. Floowy serves a growing number of ecommerce brands in Belgium, from online retailers in Antwerp and Brussels to DTC brands in Ghent and Leuven. The platform works in Dutch, French, and English, making it ideal for Belgian brands running ad campaigns across the Benelux market. Generate AI ad creatives for Meta, TikTok, and Google targeting Belgian, Dutch, and French-speaking audiences from one tool."
              },
              {
                q: "Does Floowy work for German ecommerce brands?",
                a: "Yes. Floowy is used by ecommerce brands across Germany, from Berlin and Hamburg to Munich, Frankfurt, and Cologne. The AI ad creative generator supports EUR pricing and produces ad creatives optimized for the German market, including Google Shopping DE, Meta campaigns targeting German consumers, and TikTok ads for the DACH region. Scale your ad creative production without a local agency."
              },
              {
                q: "Is Floowy suitable for UK ecommerce brands?",
                a: "Yes. Floowy works with ecommerce brands across the United Kingdom, including London, Manchester, Birmingham, Leeds, and Edinburgh. The Ads Studio generates AI ad creatives that meet the quality and format requirements of UK-targeted campaigns on Meta, TikTok, Google Shopping UK, and Amazon Sponsored Display. Produce high-performing ad creatives for the UK market without a local creative team."
              },
              {
                q: "Which European countries does Floowy support?",
                a: "Floowy supports ecommerce brands across all of Europe. The platform is actively used in the Netherlands, Belgium, Germany, the United Kingdom, France, Spain, Italy, Portugal, and the Nordics. With EUR and GBP pricing, multilingual AI ad copy generation, and export options optimized for all major European ad platforms and marketplaces, Floowy is the AI ad creative generator of choice for brands scaling their paid advertising across the EU."
              },
            ].map((item, index) => (
              <AccordionItem key={index} value={`item-${index + 1}`} className="border-border/50 bg-card/50 backdrop-blur-sm rounded-xl px-6 border data-[state=open]:shadow-md data-[state=open]:border-primary/25">
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

      {/* Final CTA */}
      <section className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-primary/10 via-accent/20 to-primary-glow/10 rounded-3xl p-6 md:p-12 text-center border border-primary/20">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            <span className="text-header-dark">Ready to Scale Your</span> <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Ad Creatives?</span>
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join ecommerce brands generating winning ads with AI
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

export default AdsStudioLanding;
