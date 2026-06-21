import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Sparkles, Upload, Wand2, Download, Image, TrendingUp, Clock, Check, X, ChevronRight, BookOpen, ArrowRight, Mail, Film, Shirt, Video, Users } from "lucide-react";
import FashionScrollingGrid from "@/components/FashionScrollingGrid";
import fashionFeatureOutfit from "@/assets/fashion-feature-outfit.png";
import fashionFeatureVideo from "@/assets/fashion-feature-video.jpg";
import fashionFeatureModels from "@/assets/fashion-feature-models.png";
import GenerationDemoShowcase from "@/components/GenerationDemoShowcase";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import TestimonialsSection from "@/components/TestimonialsSection";
import PricingSection from "@/components/PricingSection";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ROICalculator from "@/components/ROICalculator";
import PlatformsSection from "@/components/PlatformsSection";

import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useScrollAnimationInit } from "@/hooks/useScrollAnimationInit";
import logoImage from "@/assets/floowy-logo.png";
import fashionStudioHero from "@/assets/fashion-studio-hero.png";
import fashionCover from "@/assets/fashion-cover-new-3.png";
import fashionCaseStudy from "@/assets/fashion-case-study.png";
import MetaTags from "@/components/MetaTags";
import StructuredData from "@/components/StructuredData";
import ComparisonSection from "@/components/ComparisonSection";
import shopifyLogo from "@/assets/logo-shopify.svg";
import iconAmsterdamLogo from "@/assets/logo-icon-amsterdam.png";
import nimaniLogo from "@/assets/logo-nimani.png";
import welhofLogo from "@/assets/logo-welhof.png";
import lothLogo from "@/assets/logo-loth-fabenim.png";
import curlyGirlLogo from "@/assets/logo-curlygirl.png";
import cetaphilLogo from "@/assets/logo-cetaphil.png";
import marcelsLogo from "@/assets/logo-marcels.png";
import baskoLogo from "@/assets/logo-basko.png";
import fashionStillImage from "@/assets/fashion-still-image.jpg";
import fashionVideoDemo from "@/assets/fashion-video-demo.mp4";

import IndustriesHighlightSection from "@/components/IndustriesHighlightSection";
const FashionDemoVideo = () => {
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
            src="https://www.youtube-nocookie.com/embed/h1Eb-M3tM3w?autoplay=1&mute=1&rel=0"
            className="w-full h-full absolute inset-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Fashion Studio demo video"
          />
        )}
      </div>
    </div>
  );
};

const FashionLanding = () => {
  useScrollAnimationInit();
  return <div className="min-h-screen bg-background">
      <MetaTags 
        title="AI Fashion Image Generator for Ecommerce | Floowy AI"
        description="Generate on-model product images and ad creatives with AI. No photoshoots needed. Scale your ecommerce visuals with Floowy.ai."
        keywords="AI fashion image generator, AI photoshoot, fashion mockups, ai model photography"
        canonicalUrl="https://floowy.ai/fashion-studio"
      />
      <StructuredData type="organization" />
      <StructuredData 
        type="breadcrumb" 
        breadcrumbs={[
          { name: "Home", url: "https://floowy.ai" },
          { name: "Fashion Studio", url: "https://floowy.ai/fashion-studio" }
        ]}
      />
      <Navigation />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#e0f2e9]">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-start gap-8 lg:gap-12 pt-8 md:pt-12 pb-12 md:pb-20">
            <div className="flex w-full min-w-0 flex-1 flex-col items-center space-y-6 pt-4 text-center lg:items-start lg:pt-8 lg:text-left">
            
            <h1 className="max-w-full text-[2.15rem] font-bold tracking-tight leading-[1.05] text-header-dark sm:text-4xl md:text-5xl lg:text-[3.25rem] xl:text-6xl">
              Turn Your Products Into<br /> High-Converting Creatives<br /> <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Without a Photoshoot</span>
            </h1>
            
            <p className="max-w-xl px-1 text-base text-muted-foreground sm:text-lg md:text-xl">
              Scale your ecommerce creatives with AI. Generate models, campaign visuals, and ad variations in minutes. Built for brands spending +€3K per month on ads.
            </p>

            {/* Hero image - mobile only */}
            <div className="lg:hidden relative flex w-full max-w-full flex-col items-center overflow-hidden">
              <img 
                src={fashionStudioHero} 
                alt="AI Fashion Studio - Product to model photography" 
                className="w-full max-w-[22rem] object-contain" loading="lazy" decoding="async"
              />
              
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
                src={fashionStudioHero} 
                alt="AI Fashion Studio - Product to model photography" 
                className="w-full max-w-2xl object-contain" loading="lazy" decoding="async"
              />
              
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
                Stop Paying for Fashion Shoots That Don't <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Scale</span>
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto">
                Create unlimited on-model shots and campaign creatives without studios, models, or expensive production teams. AI generates professional fashion visuals in minutes, not weeks.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center scroll-animate">
              {/* Left: UI screenshot */}
              <div className="rounded-2xl overflow-hidden shadow-2xl border border-border/30 bg-card p-3 sm:p-4 max-w-md lg:max-w-lg mx-auto">
                <img 
                  src={fashionCaseStudy} 
                  alt="Fashion Studio interface showing AI model photography generation" 
                  className="block w-full h-auto object-cover rounded-xl"
                  loading="lazy"
                />
              </div>

              {/* Right: Case stats */}
              <div className="space-y-5 text-center lg:text-left">
                <h3 className="text-2xl md:text-3xl font-bold text-header-dark">
                  Spend less, produce more.
                </h3>

                <p className="text-muted-foreground leading-relaxed text-base md:text-lg">
                  Create studio-quality fashion shots without booking models, locations, or photographers. AI generated models give you the same professional look with endless styling options, minus the production overhead.
                </p>

                <div className="bg-muted/50 rounded-xl p-5">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <p className="text-4xl md:text-5xl font-extrabold leading-none bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">+11%</p>
                      <p className="text-xs md:text-sm font-semibold text-primary uppercase tracking-wide mt-1">website conversion</p>
                    </div>
                    <p className="text-sm md:text-base text-muted-foreground">By replacing traditional photoshoots with AI generated on-model visuals, Baskostore improved the shopping experience and saw a measurable lift in conversion rates across their webshop.</p>
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

      {/* Video Showcase */}
      <section className="py-8 md:py-12 bg-background overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Video Walkthroughs</p>
            <h2 className="text-3xl md:text-5xl font-bold text-header-dark mb-4">
              See What AI Can Do With Your <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Product Photos</span>
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              Watch how Floowy transforms static product images into scroll-stopping video content for TikTok, Reels, and paid social.
            </p>
          </div>
          <div className="flex flex-col md:flex-row justify-center items-center gap-6 md:gap-8 max-w-5xl mx-auto md:items-end">
            {[
              { id: "3DOSHzMk7W8", label: "Fashion Shoots", delay: "0s" },
              { id: "jD8HRe-6vWg", label: "Campaign Visuals", delay: "1.3s" },
              { id: "KNWqysiHYvg", label: "Product Videos", delay: "2.6s" },
            ].map((video, i) => (
              <div
                key={i}
                className="group transition-all duration-500 hover:scale-105 hover:z-10"
              >
                <div className="w-[240px] sm:w-[260px] rounded-2xl overflow-hidden shadow-xl shadow-primary/5 group-hover:shadow-2xl group-hover:shadow-primary/15 aspect-[9/16] relative transition-all duration-500">
                  <div className="w-full h-full rounded-2xl overflow-hidden bg-black relative">
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&mute=1&loop=1&playlist=${video.id}&controls=0&rel=0&showinfo=0&modestbranding=1&iv_load_policy=3&disablekb=1`}
                      className="w-full h-full pointer-events-none"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      title={`Floowy demo: ${video.label}`}
                      loading="lazy"
                    />
                    <div className="absolute inset-0 z-10" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12 scroll-animate">
              <h2 className="text-3xl md:text-5xl font-bold text-header-dark mb-4">
                How It <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Works</span>
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
                Four simple steps to stunning fashion mockups
              </p>
            </div>

            {/* Demo Video - autoplay on scroll */}
            <div className="mb-16 scroll-animate">
              <FashionDemoVideo />
            </div>

            {/* 4 Steps - circular node layout */}
            <div className="relative scroll-animate">
              {/* Desktop connecting line */}
              <div className="hidden md:block absolute top-[60px] left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" />

              <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-6">
                {[
                  { icon: Upload, step: "1", title: "Upload", desc: "Upload your clothing or accessory product photos." },
                  { icon: Image, step: "2", title: "Select Model", desc: "Choose from our diverse library of professional models." },
                  { icon: Wand2, step: "3", title: "Customize", desc: "Add accessories, choose backgrounds, and select output size." },
                  { icon: Download, step: "4", title: "Generate", desc: "Get your professional mockup in seconds, ready to use." },
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
                  <Link to="/knowledge-base/fashion-studio">
                    <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                      View Fashion Studio Guide <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Every On-Model Shot, One Tool */}
      <section className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-last lg:order-first">
              <FashionScrollingGrid />
            </div>
            <div className="space-y-6 text-center lg:text-left order-first lg:order-last">
              <p className="text-xs font-bold text-primary uppercase tracking-wider">Unlimited Fashion Visuals</p>
              <h2 className="text-3xl md:text-5xl font-bold text-header-dark">
                Every On-Model Shot,<br /> <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">One Tool</span>
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                From single product shots and full outfit styling to campaign visuals and social media content. Generate professional on-model fashion photography with diverse AI models, custom backgrounds, and brand-consistent styling. Floowy's AI fashion studio handles every look, every model, and every angle your ecommerce brand needs to scale fashion content.
              </p>
              <Link to="/auth?mode=signup" className="w-full sm:w-auto hidden lg:flex justify-start">
                <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground rounded-full px-6 mt-2">
                  Start Creating <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
            <Link to="/auth?mode=signup" className="w-full sm:w-auto flex lg:hidden justify-center order-last">
              <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground rounded-full px-6">
                Start Creating <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
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
                Everything You Need to Scale{" "}<br />
                <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Ecommerce Creatives</span>
              </h2>
              <p className="text-muted-foreground text-base md:text-lg leading-relaxed max-w-3xl mx-auto">
                Generate production-grade, photorealistic imagery for your brand without expensive photoshoots. Style your products and easily match backgrounds, maximizing ROI and attracting visual attention.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 - Create an Outfit */}
              <div className="scroll-animate text-center md:text-left" style={{ transitionDelay: '0.1s' }}>
                <div className="rounded-2xl overflow-hidden shadow-xl border border-border/30 mb-5">
                  <img src={fashionFeatureOutfit} alt="AI styled outfit creation" className="block w-full h-auto object-cover" loading="lazy" />
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-3">
                  <Shirt className="w-4 h-4" />
                  Create an Outfit
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-header-dark mb-2">
                  Mix and match pieces to create perfectly styled looks in seconds.
                </h3>
                <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                  Upload your clothing items and accessories, then let AI combine them into complete, styled outfits ready for your campaign.
                </p>
              </div>

              {/* Feature 2 - Create a Video */}
              <div className="scroll-animate text-center md:text-left" style={{ transitionDelay: '0.2s' }}>
                <div className="rounded-2xl overflow-hidden shadow-xl border border-border/30 mb-5">
                  <img src={fashionFeatureVideo} alt="AI generated fashion video" className="block w-full h-auto object-cover" loading="lazy" />
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-3">
                  <Video className="w-4 h-4" />
                  Create a Video
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-header-dark mb-2">
                  Bring your collections to life with cinematic AI-generated fashion videos.
                </h3>
                <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                  Transform any fashion shot into a 6-second video optimized for TikTok, Reels, and paid social campaigns.
                </p>
              </div>

              {/* Feature 3 - Choose an AI Model */}
              <div className="scroll-animate text-center md:text-left" style={{ transitionDelay: '0.3s' }}>
                <div className="rounded-2xl overflow-hidden shadow-xl border border-border/30 mb-5 aspect-[3/4]">
                  <img src={fashionFeatureModels} alt="Diverse AI model library" className="block w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-3">
                  <Users className="w-4 h-4" />
                  Choose an AI Model
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-header-dark mb-2">
                  Browse our extensive library of diverse AI models.
                </h3>
                <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                  Find the perfect fit for your brand, audience, and campaign style from our diverse collection of professional AI models.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* From Still Image to Video */}
      <section className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 scroll-animate">
            <h2 className="text-3xl md:text-5xl font-bold text-header-dark mb-4">
              From Still Image to <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">6-Second Video</span> in One Click
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
              Transform any fashion shot into dynamic video content for TikTok, Instagram Reels, and paid social campaigns.
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-0 max-w-5xl mx-auto">
            {/* Left - Still Image */}
            <div className="relative group w-full md:w-[40%] flex-shrink-0">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-border/30 aspect-[3/4]">
                <img 
                  src={fashionStillImage} 
                  alt="Fashion still image" 
                  className="absolute inset-0 w-full h-full object-cover" loading="lazy" decoding="async"
                />
                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                  <Image className="w-3.5 h-3.5" />
                  Input: Still Image
                </div>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex items-center justify-center md:mx-8 flex-shrink-0">
              <div className="flex flex-col md:flex-row items-center gap-2">
                <div className="hidden md:block w-12 h-0.5 bg-gradient-to-r from-border to-primary/50" />
                <div className="md:hidden h-8 w-0.5 bg-gradient-to-b from-border to-primary/50" />
                <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                  <Sparkles className="w-6 h-6 text-primary-foreground" />
                </div>
                <div className="hidden md:block w-12 h-0.5 bg-gradient-to-r from-primary/50 to-primary" />
                <div className="md:hidden h-8 w-0.5 bg-gradient-to-b from-primary/50 to-primary" />
                <div className="hidden md:flex items-center">
                  <div className="w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[10px] border-l-primary" />
                </div>
                <div className="md:hidden flex items-center">
                  <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[10px] border-t-primary" />
                </div>
              </div>
            </div>

            {/* Right - Video Output */}
            <div className="relative group w-full md:w-[40%] flex-shrink-0">
              <div className="absolute -inset-2 bg-gradient-to-r from-primary/15 to-primary-glow/10 rounded-2xl blur-xl" />
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-primary/40 aspect-[3/4]">
                <video
                  src={fashionVideoDemo}
                  className="absolute inset-0 w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                />
                <div className="absolute top-4 left-4 bg-primary/80 backdrop-blur-sm text-primary-foreground text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                  <Film className="w-3.5 h-3.5" />
                  Output: 6s Video
                </div>
                <div className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <div className="w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[12px] border-l-white ml-1" />
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-10">
            <Link to="/auth?mode=signup">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 h-14">
                Start for €1 <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

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

      {/* Create Once, Launch Anywhere */}
      <PlatformsSection />


      {/* Pricing Section */}
      <div id="pricing">
        <PricingSection />
      </div>
      <ComparisonSection
        headline={
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-header-dark mb-4">
            Why Scaling Brands <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Switch to Floowy</span>
          </h2>
        }
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

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* FAQ Section */}
      <section className="container mx-auto px-4 py-8 md:py-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 px-4">
              <h2 className="text-3xl md:text-5xl font-bold text-header-dark mb-4">
                Frequently Asked <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Questions</span>
              </h2>
            <p className="text-lg sm:text-xl text-muted-foreground">
              Everything you need to know about Fashion Studio
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-4">
            <AccordionItem value="item-1" className="border-border/50 bg-card/50 backdrop-blur-sm rounded-lg px-6 border">
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">What is an AI fashion studio and how does it work?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">An AI fashion studio is a platform that uses artificial intelligence to generate professional fashion photography and on-model product images without a traditional photoshoot. Floowy's AI fashion studio lets ecommerce brands upload a product photo, select from a library of AI fashion models, and generate studio-quality visuals in seconds. The output is optimized for product pages, ad campaigns, lookbooks, and social media content.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2" className="border-border/50 bg-card/50 backdrop-blur-sm rounded-lg px-6 border">
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">Can AI generate realistic clothing on model images?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">Yes. Floowy's AI on-model generator places your clothing on photorealistic AI models with accurate fabric draping, natural lighting, and true-to-life proportions. The AI clothing image generator is trained specifically on fashion and apparel, which means the results look like professional studio photography. Brands across Europe use this to replace traditional on-model photoshoots entirely.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3" className="border-border/50 bg-card/50 backdrop-blur-sm rounded-lg px-6 border">
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">How does AI fashion photography compare to traditional photoshoots?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">AI fashion photography produces studio-quality results at a fraction of the cost and time. Where a traditional shoot requires model booking, studio rental, a photographer, and post-production, Floowy's AI fashion photography tool delivers the same output in minutes. Brands report 3x faster creative production and significant savings on their monthly content budget. For ecommerce performance marketing, AI-generated visuals often outperform traditional photos in CTR and conversion tests.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4" className="border-border/50 bg-card/50 backdrop-blur-sm rounded-lg px-6 border">
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">Can AI create fashion ads for Meta, TikTok, and Google?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">Absolutely. Floowy generates AI fashion ads and campaign visuals optimized for every major advertising platform. Create scroll-stopping content for Meta Ads, TikTok, Google Shopping, Instagram, and Snapchat from one workflow. Each AI fashion campaign visual is designed to increase CTR and drive ecommerce conversions. You can generate dozens of ad variations in minutes to A/B test at scale.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-5" className="border-border/50 bg-card/50 backdrop-blur-sm rounded-lg px-6 border">
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">Can AI create fashion lookbooks and catalog images?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">Yes. Floowy's AI lookbook generator produces complete fashion lookbooks with on-model images, consistent styling, and professional quality. Whether you need seasonal collection visuals, campaign lookbooks, or AI fashion catalog images for your webshop, you can generate everything without booking a studio or photographer. This is especially valuable for brands launching new collections frequently.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-6" className="border-border/50 bg-card/50 backdrop-blur-sm rounded-lg px-6 border">
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">What is an AI fashion model generator?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">An AI fashion model generator creates photorealistic virtual models for your product images. With Floowy, you can select from a diverse library of AI virtual fashion models with different ethnicities, body types, ages, and styles. This lets you represent your full customer base in your marketing visuals without the costs and logistics of booking multiple real models for every shoot.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-7" className="border-border/50 bg-card/50 backdrop-blur-sm rounded-lg px-6 border">
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">How can AI help scale fashion ecommerce visuals?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">AI transforms fashion ecommerce by removing the creative production bottleneck. Instead of waiting weeks for a photoshoot, you generate professional AI ecommerce fashion images, on-model shots, and ad creatives in minutes. This means you can test more variations, find winning ads faster, and produce content for every channel without increasing your team or budget. Brands using Floowy report scaling from a handful of creatives per week to 30+ without adding headcount.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-8" className="border-border/50 bg-card/50 backdrop-blur-sm rounded-lg px-6 border">
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">Is Floowy the best AI fashion photography tool for ecommerce brands?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">Floowy is purpose-built for ecommerce and fashion brands that need high-converting creatives at scale. Unlike generic AI image generators, Floowy's AI fashion photography tool is specifically trained on fashion, apparel, and product imagery. It includes features like AI on-model photography, virtual model selection, background customization, and multi-platform export. Brands across the Netherlands, Belgium, Germany, and the rest of Europe use Floowy as their primary AI fashion content creation tool.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-9" className="border-border/50 bg-card/50 backdrop-blur-sm rounded-lg px-6 border">
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">Can AI match my brand guidelines for fashion visuals?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">Yes. Floowy lets you customize backgrounds, styling, and model selection to stay consistent with your AI fashion branding visuals. You can create a cohesive look across all your product images, ads, and social content. Whether you need clean white studio backgrounds for your webshop or lifestyle scenes for AI fashion social media visuals, the tool adapts to your brand identity.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-10" className="border-border/50 bg-card/50 backdrop-blur-sm rounded-lg px-6 border">
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">Is Floowy available for fashion brands in the Netherlands?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">Yes. Floowy is founded and based in the Netherlands and is used by hundreds of Dutch ecommerce and fashion brands. Whether you're a DTC brand in Amsterdam, a fashion startup in Rotterdam, or an online retailer in Utrecht, Floowy's AI fashion studio is built for the Dutch market. All pricing is in EUR, support is available in Dutch and English, and the platform is optimized for selling on Dutch marketplaces like bol.com.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-11" className="border-border/50 bg-card/50 backdrop-blur-sm rounded-lg px-6 border">
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">Can fashion brands in Belgium use Floowy?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">Absolutely. Floowy serves a growing number of ecommerce and fashion brands in Belgium, from fashion labels in Antwerp to online retailers in Brussels and Ghent. The platform works in both Dutch and English, making it a perfect fit for Belgian brands targeting the Benelux market. Generate AI fashion visuals for your Belgian webshop, marketplaces, and ad campaigns without the need for local photoshoot studios.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-12" className="border-border/50 bg-card/50 backdrop-blur-sm rounded-lg px-6 border">
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">Does Floowy work for German fashion ecommerce brands?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">Yes. Floowy is used by fashion and ecommerce brands across Germany, from Berlin to Munich. The platform supports EUR pricing and exports visuals in all formats needed for German marketplaces like Zalando and About You, as well as for Google Shopping DE, Meta, and TikTok campaigns targeting the German market. Generate AI product images and on-model fashion photography at scale without a local production team.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-13" className="border-border/50 bg-card/50 backdrop-blur-sm rounded-lg px-6 border">
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">Is Floowy suitable for UK based fashion brands?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">Yes. Floowy works with fashion and ecommerce brands in the United Kingdom, including London, Manchester, and Birmingham. The platform generates AI fashion visuals that meet the quality standards of UK marketplaces like ASOS Marketplace and Amazon UK. Whether you're running ads on Meta, TikTok, or Google Shopping UK, Floowy produces campaign-ready creatives without the overhead of traditional UK studio photoshoots.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-14" className="border-border/50 bg-card/50 backdrop-blur-sm rounded-lg px-6 border">
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">Which European countries does Floowy support?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">Floowy supports ecommerce and fashion brands across all of Europe. The platform is actively used in the Netherlands, Belgium, Germany, the United Kingdom, France, Spain, Italy, and the Nordics. With EUR and GBP pricing support, multilingual AI fashion content creation, and export options for all major European ad platforms and marketplaces, Floowy is the AI fashion image generator of choice for brands scaling across the EU.</AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-primary/10 via-accent/20 to-primary-glow/10 rounded-3xl p-6 md:p-12 text-center border border-primary/20">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            <span className="text-header-dark">Ready to Transform Your</span> <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Fashion Products?</span>
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join fashion brands creating stunning mockups with AI
          </p>
          <Link to="/auth?mode=signup">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow text-lg px-10 h-14 font-semibold">
              Start for €1
            </Button>
          </Link>
        </div>
      </section>
      <Footer />
    </div>;
};
export default FashionLanding;