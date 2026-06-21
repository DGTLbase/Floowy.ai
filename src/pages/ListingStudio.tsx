import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Sparkles, Upload, Wand2, Download, Check, Image, TrendingUp, Clock, X, ChevronRight, BookOpen, Megaphone, Target, Zap, User, ImageIcon, Type, Palette, MousePointer, Store, ArrowRight } from "lucide-react";
import GenerationDemoShowcase from "@/components/GenerationDemoShowcase";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import TestimonialsSection from "@/components/TestimonialsSection";
import PricingSection from "@/components/PricingSection";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ROICalculator from "@/components/ROICalculator";
import PlatformsSection from "@/components/PlatformsSection";
import ListingScrollingGrid from "@/components/ListingScrollingGrid";
import { useScrollAnimationInit } from "@/hooks/useScrollAnimationInit";
import logoImage from "@/assets/floowy-logo.png";
import MetaTags from "@/components/MetaTags";
import StructuredData from "@/components/StructuredData";
import listingStudioHero from "@/assets/listing-studio-hero.png";
import listingCaseStudy from "@/assets/listing-case-study.png";
import idonLogo from "@/assets/logos/idon-logo.png";
import listingFeaturePackshot from "@/assets/listing-feature-packshot.webp";
import listingFeatureLifestyle from "@/assets/listing-feature-lifestyle.webp";
import listingFeatureExport from "@/assets/listing-feature-export.webp";
import shopifyLogo from "@/assets/logo-shopify.svg";
import iconAmsterdamLogo from "@/assets/logo-icon-amsterdam.png";
import nimaniLogo from "@/assets/logo-nimani.png";
import welhofLogo from "@/assets/logo-welhof.png";
import lothLogo from "@/assets/logo-loth-fabenim.png";
import curlyGirlLogo from "@/assets/logo-curlygirl.png";
import cetaphilLogo from "@/assets/logo-cetaphil.png";
import marcelsLogo from "@/assets/logo-marcels.png";
import { Mail } from "lucide-react";

import IndustriesHighlightSection from "@/components/IndustriesHighlightSection";
const ListingStudioDemoVideo = () => {
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
            title="Listing Studio demo video"
          />
        )}
      </div>
    </div>
  );
};

const ListingStudio = () => {
  useScrollAnimationInit();
  
  return (
    <div className="min-h-screen bg-background">
      <MetaTags 
        title="AI Product Listing Image Generator for Ecommerce | Floowy AI"
        description="Generate marketplace-ready product listing images with AI. White backgrounds, lifestyle shots, and packshots for Amazon, bol.com, Ebay & more."
        keywords="AI product listing image generator, ai listing image generator, ai ecommerce product images, amazon listing generator ai, bol.com listing generator"
        canonicalUrl="https://floowy.ai/listing-studio"
      />
      <StructuredData type="organization" />
      <StructuredData 
        type="breadcrumb" 
        breadcrumbs={[
          { name: "Home", url: "https://floowy.ai" },
          { name: "Listing Studio", url: "https://floowy.ai/listing-studio" }
        ]}
      />
      <Navigation />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#e0f2e9]">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-start gap-8 lg:gap-12 pt-8 md:pt-12 pb-12 md:pb-20">
            <div className="flex w-full min-w-0 flex-1 flex-col items-center space-y-6 pt-4 text-center lg:items-start lg:pt-8 lg:text-left">
            
            <h1 className="max-w-full text-[2.15rem] font-bold tracking-tight leading-[1.05] text-header-dark sm:text-4xl md:text-5xl lg:text-[3.25rem] xl:text-6xl">
              Generate Marketplace-Ready Product Listing Images <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">With AI</span>
            </h1>
            
            <p className="max-w-xl px-1 text-base text-muted-foreground sm:text-lg md:text-xl">
              Create professional packshots, white background images, and lifestyle product photos for Amazon, bol.com, and every marketplace your brand sells on. Upload your product, choose your style, and get listing-ready images in seconds. Built for ecommerce brands that need product images at scale.
            </p>

            {/* Hero image - mobile only */}
            <div className="lg:hidden relative flex w-full max-w-full flex-col items-center overflow-hidden">
              <img 
                src={listingStudioHero} 
                alt="AI Product Listing Images" 
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
                src={listingStudioHero} 
                alt="AI Product Listing Images" 
                className="w-full max-w-xl object-contain" loading="lazy" decoding="async"
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
                Stop Losing Sales to <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Bad Product Images</span>
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto">
                Create unlimited product listing images, packshots, and lifestyle visuals without photographers, studios, or weeks of production time.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center scroll-animate">
              {/* Left: UI screenshot */}
              <div className="rounded-2xl overflow-hidden shadow-2xl border border-border/30 bg-card p-3 sm:p-4 max-w-md lg:max-w-lg mx-auto">
                <img
                  src={listingCaseStudy}
                  alt="IDON Listing Studio case study - AI product listing image workflow"
                  className="block w-full h-auto object-cover rounded-xl"
                  loading="lazy"
                />
              </div>

              {/* Right: Case stats */}
              <div className="space-y-5 text-center lg:text-left">
                <h3 className="text-2xl md:text-3xl font-bold text-header-dark">
                  One product photo. Every image your listing needs.
                </h3>

                <p className="text-muted-foreground leading-relaxed text-base md:text-lg">
                  Upload a single product photo and generate your entire listing image set: clean white background packshots, lifestyle context images, and in-use product visuals. Everything your marketplace listing needs to convert, produced in seconds.
                </p>

                <div className="bg-muted/50 rounded-xl p-5">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <p className="text-4xl md:text-5xl font-extrabold leading-none bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">+6,3%</p>
                      <p className="text-xs md:text-sm font-semibold text-primary uppercase tracking-wide mt-1">conversion</p>
                    </div>
                    <p className="text-sm md:text-base text-muted-foreground">By upgrading product listing images with AI generated visuals, IDON improved click-through rates and conversion across all marketplace listings.</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <img src={idonLogo} alt="IDON" className="h-14 object-contain" loading="lazy" decoding="async" />
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
                Four simple steps to professional product listing images
              </p>
            </div>

            {/* Demo Video */}
            <div className="mb-16 scroll-animate">
              <ListingStudioDemoVideo />
            </div>

            {/* 4 Steps - circular node layout */}
            <div className="relative scroll-animate">
              {/* Desktop connecting line */}
              <div className="hidden md:block absolute top-[60px] left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" />

              <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-6">
                {[
                  { icon: Upload, step: "1", title: "Upload Your Product", desc: "Upload your product photo. Any product, any angle. Works with phone photos, flat lays, or existing product shots." },
                  { icon: Image, step: "2", title: "Choose Listing Style", desc: "Select your image type: white background packshot, lifestyle context image, in-use product visual, or multi-angle set." },
                  { icon: Wand2, step: "3", title: "Customize", desc: "Adjust the background, lighting, and composition to match your marketplace requirements and brand style." },
                  { icon: Download, step: "4", title: "Generate & Export", desc: "Get your listing-ready product images in seconds. Export in the exact dimensions your marketplace requires." },
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
                  <Link to="/knowledge-base/listing-studio">
                    <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                      View Listing Studio Guide <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Every Listing Image Type Section */}
      <section className="py-8 md:py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              {/* Text - shown first on mobile, second on desktop */}
              <div className="scroll-animate space-y-5 text-center lg:text-left order-first lg:order-last">
                <span className="inline-block text-xs font-mono tracking-[0.3em] uppercase text-primary">
                  Unlimited Image Types
                </span>
                <h2 className="text-3xl md:text-5xl font-bold leading-tight tracking-tight">
                  <span className="block whitespace-nowrap text-header-dark">Every Listing Image Type,</span>
                  <span className="block bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">One Tool</span>
                </h2>
                <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
                  From clean white background packshots that meet Amazon and bol.com requirements to lifestyle product images that show your product in context. Generate in-use visuals, multi-angle product photos, and conversion-optimized listing images for every marketplace your brand sells on. Floowy's AI product listing image generator handles every image type your ecommerce listings need.
                </p>
                <div className="pt-2 hidden lg:flex justify-start">
                  <Link to="/auth?mode=signup">
                    <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground rounded-full px-6">
                      Learn More <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Scrolling grid - shown second on mobile, first on desktop */}
              <div className="scroll-animate rounded-2xl overflow-hidden order-last lg:order-first">
                <ListingScrollingGrid />
              </div>

              {/* CTA button - below scrolling images on mobile only */}
              <div className="pt-2 flex lg:hidden justify-center order-last">
                <Link to="/auth?mode=signup">
                  <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground rounded-full px-6">
                    Learn More <ArrowRight className="w-4 h-4 ml-2" />
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
                Everything You Need to Scale<br />
                <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Product Listing Images</span>
              </h2>
              <p className="text-muted-foreground text-base md:text-lg leading-relaxed max-w-3xl mx-auto">
                Generate marketplace-compliant product photos, lifestyle visuals, and conversion-optimized listing images without a studio or photographer. One upload, every image your listing needs.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="scroll-animate text-center md:text-left" style={{ transitionDelay: '0.1s' }}>
                <div className="rounded-2xl overflow-hidden shadow-xl border border-border/30 mb-5">
                  <img src={listingFeaturePackshot} alt="AI generated product packshot on white background" className="block w-full h-auto object-cover" loading="lazy" />
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-3">
                  <ImageIcon className="w-4 h-4" />
                  AI Packshot Generator
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-header-dark mb-2">
                  Clean packshots that meet every marketplace standard.
                </h3>
                <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                  Generate clean, professional product images on pure white backgrounds that meet Amazon, bol.com, Zalando, and other marketplace requirements. Consistent lighting, accurate colors, and pixel-perfect backgrounds every time.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="scroll-animate text-center md:text-left" style={{ transitionDelay: '0.2s' }}>
                <div className="rounded-2xl overflow-hidden shadow-xl border border-border/30 mb-5">
                  <img src={listingFeatureLifestyle} alt="Product in lifestyle context setting" className="block w-full h-auto object-cover" loading="lazy" />
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-3">
                  <Image className="w-4 h-4" />
                  Lifestyle Listing Images
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-header-dark mb-2">
                  Show your product in real-life context.
                </h3>
                <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                  Place your product in realistic lifestyle contexts that help customers visualize using it. Kitchen counters, living rooms, outdoor settings, or any scene that makes your product feel real and desirable.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="scroll-animate text-center md:text-left" style={{ transitionDelay: '0.3s' }}>
                <div className="rounded-2xl overflow-hidden shadow-xl border border-border/30 mb-5">
                  <img src={listingFeatureExport} alt="Multi-marketplace export formats" className="block w-full h-auto object-cover" loading="lazy" />
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-3">
                  <Target className="w-4 h-4" />
                  Multi-Marketplace Export
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-header-dark mb-2">
                  One workflow. Every marketplace covered.
                </h3>
                <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                  Export your listing images in the exact dimensions and formats each marketplace requires. Amazon, bol.com, eBay, Zalando, Shopify, and more. One workflow, every marketplace covered.
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
            <Link to="/custom-models" className="w-full sm:w-auto flex lg:hidden justify-center order-last">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 h-14 w-full sm:w-auto">
                Claim Your Premium Model <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Platforms Section */}
      <PlatformsSection />



      <div id="pricing">
        <PricingSection />
      </div>

      {/* Comparison Section */}
      <section className="container mx-auto px-4 py-8 md:py-12 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 px-4">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-header-dark mb-4">
              Why Scaling Brands <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Switch to Floowy</span>
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground">
              Everyone's talking about it. AI content creation made simple.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 md:gap-6">
            {/* Floowy.ai Benefits */}
            <Card className="border-border/50 bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 backdrop-blur-sm overflow-hidden relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-primary-glow" />
              <CardContent className="p-4 md:p-8">
                <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                  <img src={logoImage} alt="Floowy.ai" className="h-6 md:h-8 w-auto" loading="lazy" decoding="async" />
                  <span className="font-bold text-sm md:text-xl text-foreground">Floowy.ai</span>
                </div>
                <div className="space-y-2 md:space-y-3">
                  {[
                    "Unlimited listing image generation",
                    "White background packshots in seconds",
                    "No photographer or studio needed",
                    "Marketplace-compliant exports",
                    "Lifestyle and in-use images included",
                    "Cost-efficient",
                    "Consistent quality across entire catalog",
                    "Multi-marketplace formatting",
                    "A/B test listing images at scale",
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2 md:gap-3">
                      <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3 md:w-4 md:h-4 text-primary" />
                      </div>
                      <p className="text-xs md:text-base text-foreground">{item}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Others Disadvantages */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-muted-foreground/20" />
              <CardContent className="p-4 md:p-8">
                <div className="mb-4 md:mb-6">
                  <span className="font-bold text-sm md:text-xl text-foreground">Others</span>
                </div>
                <div className="space-y-2 md:space-y-3">
                  {[
                    "Expensive per-product photography costs",
                    "Days per product for studio shoots",
                    "Inconsistent lighting across sessions",
                    "Manual background removal and retouching",
                    "Separate shoots for lifestyle images",
                    "High cost per image variation",
                    "Reformatting for each marketplace",
                    "Difficult to scale for large catalogs",
                    "Long turnaround for new product launches",
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2 md:gap-3">
                      <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <X className="w-3 h-3 md:w-4 md:h-4 text-destructive" />
                      </div>
                      <p className="text-xs md:text-base text-muted-foreground">{item}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-10">
            <Link to="/auth?mode=signup">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow text-lg px-8 h-14">
                Start Creating Listing Images for €1
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* FAQ Section */}
      <section className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 px-4">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-header-dark mb-4">
              Frequently Asked <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Questions</span>
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground">
              Everything you need to know about Listing Studio
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-4">
            {[
              { q: "What is an AI product listing image generator?", a: "An AI product listing image generator creates marketplace-ready product photos from a single upload. Instead of hiring a photographer or setting up a studio, you upload your product image and the AI generates professional listing photos including white background packshots, lifestyle context images, and in-use product visuals. Floowy's Listing Studio is built specifically for ecommerce brands that need high-quality AI product listing images for Amazon, bol.com, Zalando, and other marketplaces at scale." },
              { q: "Can AI generate white background product images for marketplaces?", a: "Yes. Floowy's AI packshot generator creates clean, pure white background product images that meet the strict requirements of Amazon, bol.com, eBay, and other major marketplaces. The AI handles background removal, shadow placement, and color accuracy automatically, producing AI white background product images that pass marketplace compliance checks without manual retouching." },
              { q: "Can AI replace traditional product photography for ecommerce listings?", a: "For the majority of ecommerce listing use cases, yes. AI product photography tools like Floowy generate listing images that are visually indistinguishable from traditional studio photography. Brands report 3x faster image production and significant savings compared to per-product studio shoots. The AI product photography generator is especially powerful for brands with large catalogs that need consistent quality across hundreds or thousands of product listings." },
              { q: "Can AI create Amazon-compliant listing images?", a: "Yes. Floowy's AI Amazon listing image generator produces images that meet Amazon's specific image requirements, including pure white backgrounds (RGB 255,255,255), minimum resolution standards, and proper product framing. Generate your main image, additional lifestyle shots, and infographic-style images all from a single product photo. This is equally valuable for Amazon US, Amazon DE, Amazon UK, and all European Amazon marketplaces." },
              { q: "Can AI generate product images for bol.com listings?", a: "Absolutely. Floowy generates AI bol.com product images that meet bol.com's listing standards. Clean backgrounds, proper dimensions, and consistent quality across your entire product catalog. For Dutch and Belgian ecommerce brands selling on bol.com, Listing Studio eliminates the need for separate product photography sessions and produces marketplace-ready images in seconds." },
              { q: "Can AI generate lifestyle product images for listings?", a: "Yes. Floowy's AI lifestyle product images tool places your product in realistic context settings that help customers visualize using it. A kitchen appliance on a countertop, a skincare product in a bathroom setting, or electronics on a desk. These AI product in-use images are proven to increase conversion rates because they help shoppers imagine the product in their own lives." },
              { q: "Can AI generate images for multiple marketplaces at once?", a: "Yes. Floowy generates AI marketplace product images with multi-marketplace export built in. Create your product images once and export them in the exact dimensions and formats required by Amazon, bol.com, Zalando, eBay, Shopify, WooCommerce, and more. No more manually reformatting images for each platform. One workflow covers every marketplace your brand sells on." },
              { q: "Can AI generate product image variations for A/B testing?", a: "Yes. Floowy's AI product image variations tool generates multiple versions of your listing images with different backgrounds, angles, lighting, and compositions. This lets you A/B test which product images drive the highest click-through and conversion rates on each marketplace. More image variations tested means finding your best-performing listing visuals faster." },
              { q: "How does AI optimize listing images for higher conversion?", a: "AI listing image optimization works on multiple levels. Floowy ensures proper lighting, accurate colors, and clean backgrounds that meet marketplace standards. Beyond technical quality, the AI generates lifestyle context images and in-use visuals that have been shown to increase conversion rates by helping customers visualize the product. The ability to quickly generate and test multiple image variations means you can continuously optimize your listings based on real performance data." },
              { q: "Is Listing Studio available for ecommerce brands in the Netherlands?", a: "Yes. Floowy is founded and based in the Netherlands and is used by hundreds of Dutch ecommerce brands for their product listing images. Whether you're selling on bol.com from Amsterdam, managing Amazon NL listings from Rotterdam, or running a Shopify store from Utrecht, Listing Studio is built for the Dutch market. Generate bol.com-compliant packshots, Amazon-ready white background images, and lifestyle visuals for all your Dutch marketplace listings. All pricing is in EUR, support is in Dutch and English." },
              { q: "Can ecommerce brands in Belgium use Listing Studio?", a: "Absolutely. Floowy serves a growing number of Belgian ecommerce brands, from bol.com Belgium sellers in Antwerp and Brussels to Amazon BE merchants in Ghent and Leuven. The platform works in Dutch, French, and English, making it ideal for Belgian brands selling across bol.com, Amazon, and other Benelux and European marketplaces. Generate professional listing images for all your Belgian marketplace accounts from one tool." },
              { q: "Does Floowy work for German ecommerce brands?", a: "Yes. Floowy is used by ecommerce brands across Germany, from Berlin and Hamburg to Munich, Frankfurt, and Cologne. Listing Studio generates product images that meet the requirements of Amazon DE, Zalando, About You, Otto, and other German marketplaces. Whether you need white background packshots for Amazon Germany or lifestyle images for your Zalando listings, Floowy produces them at scale without a local photographer." },
              { q: "Is Floowy suitable for UK ecommerce brands?", a: "Yes. Floowy works with ecommerce brands across the United Kingdom, including London, Manchester, Birmingham, and Edinburgh. Listing Studio generates AI product listing images that meet the quality and format requirements of Amazon UK, eBay UK, ASOS Marketplace, and other UK marketplaces. Create professional listing photos for the UK market without a local studio." },
              { q: "Which European countries does Floowy support?", a: "Floowy supports ecommerce brands across all of Europe. The platform is actively used in the Netherlands, Belgium, Germany, the United Kingdom, France, Spain, Italy, Portugal, and the Nordics. With EUR and GBP pricing, multi-marketplace export capabilities, and compliance with all major European marketplace image requirements, Floowy is the AI product listing image generator of choice for brands scaling their ecommerce presence across the EU." },
            ].map((item, i) => (
              <AccordionItem key={i} value={`item-${i + 1}`} className="border-border/50 bg-card/50 backdrop-blur-sm rounded-xl px-6 border data-[state=open]:shadow-md data-[state=open]:border-primary/25">
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
            <span className="text-header-dark">Ready to Scale Your</span> <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Product Listing Images?</span>
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join ecommerce brands creating marketplace-ready visuals with AI
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

export default ListingStudio;
