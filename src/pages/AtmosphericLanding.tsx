import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import PlatformsSection from "@/components/PlatformsSection";
import { Link } from "react-router-dom";
import { Sparkles, Upload, Wand2, Download, Check, Image, TrendingUp, Clock, X, ChevronRight, BookOpen, ArrowRight, Mail, Play, Film, Target, Video, Palette } from "lucide-react";
import ambienceFeature1 from "@/assets/ambience-feature-1.png";
import ambienceFeature2 from "@/assets/ambience-feature-2.png";
import ambienceFeature3 from "@/assets/ambience-feature-3.png";
import GenerationDemoShowcase from "@/components/GenerationDemoShowcase";
import ComparisonSection from "@/components/ComparisonSection";
import AmbienceScrollingGrid from "@/components/AmbienceScrollingGrid";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import TestimonialsSection from "@/components/TestimonialsSection";
import PricingSection from "@/components/PricingSection";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ROICalculator from "@/components/ROICalculator";
import { useState, useEffect, useRef } from "react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useScrollAnimationInit } from "@/hooks/useScrollAnimationInit";
import ambienceHero1 from "@/assets/ambience-hero-1-new.jpg";
import ambienceHero2 from "@/assets/ambience-hero-2-new.jpg";
import ambienceHero3 from "@/assets/ambience-hero-3-new.jpg";
import ambienceCover from "@/assets/ambience-studio-cover-new-3.png";
import ambienceShowcase from "@/assets/ambience-showcase.png";
import ambienceStudioHero from "@/assets/ambience-studio-hero.png";
import logoImage from "@/assets/floowy-logo.png";
import MetaTags from "@/components/MetaTags";
import StructuredData from "@/components/StructuredData";
import shopifyLogo from "@/assets/logo-shopify.svg";
import iconAmsterdamLogo from "@/assets/logo-icon-amsterdam.png";
import nimaniLogo from "@/assets/logo-nimani.png";
import welhofLogo from "@/assets/logo-welhof.png";
import lothLogo from "@/assets/logo-loth-fabenim.png";
import curlyGirlLogo from "@/assets/logo-curlygirl.png";
import cetaphilLogo from "@/assets/logo-cetaphil.png";
import marcelsLogo from "@/assets/logo-marcels.png";
import ambienceStillImage from "@/assets/ambience-still-image.webp";
import ambienceVideoDemo from "@/assets/ambience-video-demo.mp4";

import IndustriesHighlightSection from "@/components/IndustriesHighlightSection";
const AmbienceDemoVideo = () => {
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
            src="https://www.youtube-nocookie.com/embed/u9dUwIsJuvA?autoplay=1&mute=1&rel=0"
            className="w-full h-full absolute inset-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Ambience Studio demo video"
          />
        )}
      </div>
    </div>
  );
};

const AtmosphericLanding = () => {
  useScrollAnimationInit();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const heroImages = [ambienceHero1, ambienceHero2, ambienceHero3];
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex(prev => (prev + 1) % heroImages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);
  const getImagePosition = (imageIndex: number) => {
    const diff = (imageIndex - currentImageIndex + heroImages.length) % heroImages.length;
    if (diff === 0) return 'center';
    if (diff === 1) return 'right';
    return 'left';
  };
  return <div className="min-h-screen bg-background">
      <MetaTags 
        title="AI Product Background Generator for Ecommerce | Floowy AI"
        description="Generate stunning product backgrounds and lifestyle scenes with AI. No studio needed. Scale your ecommerce visuals with Floowy.ai."
        keywords="AI product background generator, atmospheric product photos, AI product photography"
        canonicalUrl="https://floowy.ai/ambience-studio"
      />
      <StructuredData type="organization" />
      <StructuredData 
        type="breadcrumb" 
        breadcrumbs={[
          { name: "Home", url: "https://floowy.ai" },
          { name: "Ambience Studio", url: "https://floowy.ai/ambience-studio" }
        ]}
      />
      <Navigation />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#e1f3ea]">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-start gap-8 lg:gap-12 pt-8 md:pt-12 pb-12 md:pb-20">
            <div className="flex w-full min-w-0 flex-1 flex-col items-center space-y-6 pt-4 text-center lg:items-start lg:pt-8 lg:text-left">
            
            <h1 className="max-w-full text-[2.15rem] font-bold tracking-tight leading-[1.05] text-header-dark sm:text-4xl md:text-5xl lg:text-[3.25rem] xl:text-6xl">
              Place Your Products<br /> in Any Scene<br /> <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Without a Photoshoot</span>
            </h1>
            
            <p className="max-w-xl px-1 text-base text-muted-foreground sm:text-lg md:text-xl">
              Generate lifestyle backgrounds, product scenes, and campaign visuals with AI. Upload your product, describe your setting, and get studio-quality results in seconds. Built for ecommerce brands that need visuals at scale.
            </p>

            {/* Hero image - mobile only */}
            <div className="lg:hidden relative flex w-full max-w-full flex-col items-center overflow-hidden">
              <img 
                src={ambienceStudioHero} 
                alt="AI Atmospheric Product Photography" 
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
                src={ambienceStudioHero} 
                alt="AI Atmospheric Product Photography" 
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
                Stop Settling for Flat, Lifeless <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Product Images</span>
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto">
                Transform standard product photos into atmospheric lifestyle visuals that connect emotionally with your customers. No photoshoots, no studio setups, no waiting.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center scroll-animate">
              {/* Left: Product UI screenshot */}
              <div className="max-w-lg lg:max-w-xl mx-auto rounded-2xl border border-border/40 p-4 bg-card/50 shadow-lg">
                <img 
                  src={ambienceShowcase} 
                  alt="Upload product and generate multiple atmospheric lifestyle scenes with Floowy.ai" 
                  className="block w-full h-auto object-contain rounded-xl"
                  loading="lazy"
                />
              </div>

              {/* Right: Case stats */}
              <div className="space-y-5 text-center lg:text-left">
                <h3 className="text-2xl md:text-3xl font-bold text-header-dark">
                  One product photo. Endless atmosphere.
                </h3>

                <p className="text-muted-foreground leading-relaxed text-base md:text-lg">
                  Upload a standard product image and let AI place it in a realistic lifestyle setting that matches your brand identity. From a washing machine in a modern laundry room to a coffee maker on a styled kitchen counter. Give every product the visual warmth it needs to convert.
                </p>

                <div className="bg-muted/50 rounded-xl p-5">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <p className="text-4xl md:text-5xl font-extrabold leading-none bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">+22%</p>
                      <p className="text-xs md:text-sm font-semibold text-primary uppercase tracking-wide mt-1">Conversion rate</p>
                    </div>
                    <p className="text-sm md:text-base text-muted-foreground">By replacing standard product images with AI generated ambience photos, Welhof boosted conversion rates and saw a 40% increase in ROAS across campaigns.</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <img src={welhofLogo} alt="Welhof" className="h-10 md:h-12 w-auto" loading="lazy" decoding="async" />
                  <Link to="/cases/welhof" className="inline-flex items-center gap-1 text-sm font-medium text-foreground hover:text-primary transition-colors">
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
              See How AI Transforms Your <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Products</span>
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              Watch how Floowy places your products in stunning lifestyle scenes, creative backgrounds, and campaign-ready settings in seconds.
            </p>
          </div>
          <div className="flex flex-col md:flex-row justify-center items-center gap-6 md:gap-8 max-w-5xl mx-auto md:items-end">
            {[
              { id: "3qpPAxNrKHA", label: "Lifestyle Scenes", delay: "0s" },
              { id: "UbidAV2ZPY0", label: "Creative Backgrounds", delay: "1.3s" },
              { id: "BNC-JuIkPBA", label: "Campaign Visuals", delay: "2.6s" },
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
                Four simple steps to stunning product scenes
              </p>
            </div>

            {/* Demo Video - autoplay on scroll */}
            <div className="mb-16 scroll-animate">
              <AmbienceDemoVideo />
            </div>

            {/* 4 Steps - circular node layout */}
            <div className="relative scroll-animate">
              {/* Desktop connecting line */}
              <div className="hidden md:block absolute top-[60px] left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" />

              <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-6">
                {[
                  { icon: Upload, step: "1", title: "Upload Your Product", desc: "Upload your product photo. Any product, any angle." },
                  { icon: Wand2, step: "2", title: "Describe Your Scene", desc: "Type a short description of the background or setting you want." },
                  { icon: Sparkles, step: "3", title: "Customize", desc: "Adjust lighting, colors, and composition to match your brand." },
                  { icon: Download, step: "4", title: "Generate", desc: "Get your product-in-scene visual in seconds, ready for ads and product pages." },
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
                  <Link to="/knowledge-base/ambience-studio">
                    <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                      View Ambience Studio Guide <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Image to Video */}
      <section className="container mx-auto px-4 py-8 md:py-12 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 scroll-animate">
            <h2 className="text-3xl md:text-5xl font-bold text-header-dark mb-4">
              From Still Image to <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">6-Second Video</span> in One Click
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
              Transform any product scene into dynamic video content optimized for TikTok, Instagram Reels, and paid social campaigns. No video editing skills needed.
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-0 max-w-5xl mx-auto">
            <div className="relative group w-full md:w-[40%] flex-shrink-0">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-border/30 aspect-[3/4]">
                <img src={ambienceStillImage} alt="Product still image" className="absolute inset-0 w-full h-full object-cover" loading="lazy" decoding="async" />
                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                  <Image className="w-3.5 h-3.5" />
                  Input: Still Image
                </div>
              </div>
            </div>
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
            <div className="relative group w-full md:w-[40%] flex-shrink-0">
              <div className="absolute -inset-2 bg-gradient-to-r from-primary/15 to-primary-glow/10 rounded-2xl blur-xl" />
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-primary/40 aspect-[3/4]">
                <video src={ambienceVideoDemo} className="absolute inset-0 w-full h-full object-cover" autoPlay loop muted playsInline />
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

          <div className="text-center mt-10">
            <Link to="/auth?mode=signup">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 h-14">
                Start for €1 <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Endless Scenes, One Tool */}
      <section className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-last lg:order-first">
              <AmbienceScrollingGrid />
            </div>
            <div className="text-center lg:text-left order-first lg:order-last">
              <span className="inline-block text-xs font-mono tracking-[0.3em] uppercase text-primary mb-4">
                Unlimited Creativity
              </span>
              <h2 className="text-3xl md:text-5xl font-bold text-header-dark mb-6">
                Endless Scenes,<br />
                <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">One Tool</span>
              </h2>
              <p className="text-muted-foreground text-base md:text-lg leading-relaxed mb-8 max-w-lg mx-auto lg:mx-0">
                Place your products in any environment you can imagine. From minimalist studio backgrounds to rich lifestyle settings, outdoor scenery to seasonal campaign scenes. Generate AI backgrounds that match your brand identity and convert browsers into buyers. No photographer, no studio rental, no location scouting needed.
              </p>
              <Link to="/auth?mode=signup" className="order-last lg:order-none">
                <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground rounded-full px-6">
                  Start Creating <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ROI Calculator */}
      <IndustriesHighlightSection />
      <ROICalculator />

      {/* Our Main Features */}
      <section className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 scroll-animate">
            <span className="inline-block text-xs font-mono tracking-[0.3em] uppercase text-primary mb-4">
              Our Main Features
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-header-dark mb-4">
              Everything You{" "}<span className="hidden md:inline">Need to Scale</span><br className="md:hidden" /><span className="md:hidden">Need to Scale</span><br />
              <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Product Visuals</span>
            </h2>
            <p className="text-muted-foreground text-base md:text-lg leading-relaxed max-w-3xl mx-auto">
              Generate production-grade product scenes and lifestyle visuals without expensive photoshoots. Place your products in any setting, match any mood, and produce campaign-ready content that drives conversions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="scroll-animate text-center md:text-left" style={{ transitionDelay: '0.1s' }}>
              <div className="rounded-2xl overflow-hidden shadow-xl border border-border/30 mb-5">
                <img src={ambienceFeature1} alt="AI generated product background example" className="block w-full h-auto object-cover" loading="lazy" />
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-3">
                <Image className="w-4 h-4" />
                Generate Any Background
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-header-dark mb-2">
                Describe it. AI creates it.
              </h3>
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                Describe your ideal scene and let AI create a photorealistic product background in seconds. Studio, outdoor, lifestyle, seasonal, or completely custom.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="scroll-animate text-center md:text-left" style={{ transitionDelay: '0.2s' }}>
              <div className="rounded-2xl overflow-hidden shadow-xl border border-border/30 mb-5">
                <img src={ambienceFeature2} alt="Product scene turned into video content" className="block w-full h-auto object-cover" loading="lazy" />
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-3">
                <Video className="w-4 h-4" />
                Create a Video
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-header-dark mb-2">
                From scene to scroll-stopping video.
              </h3>
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                Turn your product scenes into dynamic video content for TikTok, Reels, and paid social campaigns.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="scroll-animate text-center md:text-left" style={{ transitionDelay: '0.3s' }}>
              <div className="rounded-2xl overflow-hidden shadow-xl border border-border/30 mb-5 aspect-[3/4]">
                <img src={ambienceFeature3} alt="Brand-consistent product visuals" className="block w-full h-full object-cover" loading="lazy" />
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-3">
                <Palette className="w-4 h-4" />
                Match Your Brand
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-header-dark mb-2">
                On-brand visuals, every time.
              </h3>
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                Keep your visual identity consistent across every product image. Set brand colors, preferred styles, and lighting to generate on-brand visuals every time.
              </p>
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
        subtitle="Everyone's talking about it. AI content creation made simple."
        floowyItems={[
          "Unlimited background generation",
          "Any scene, any setting, any mood",
          "No studio or location needed",
          "Instant A/B testing at scale",
          "Fast production in seconds",
          "Cost-efficient",
          "Consistent brand visuals",
          "Respond to trends and seasons instantly",
          "One tool for all channels",
        ]}
        othersItems={[
          "Expensive studio rentals and location fees",
          "Slow shoots, edits, and approvals",
          "Inconsistent lighting and quality",
          "Limited backgrounds per shoot",
          "Manual editing and retouching",
          "Guesswork, delays, and fatigue",
          "High setup and travel costs",
          "Limited flexibility for seasonal content",
          "Complex coordination with photographers",
        ]}
        ctaText="Start for €1"
      />


      <TestimonialsSection />

      {/* FAQ Section */}
      <section className="container mx-auto px-4 py-6 md:py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 px-4">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-header-dark mb-4">
                Frequently Asked <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Questions</span>
              </h2>
            <p className="text-lg sm:text-xl text-muted-foreground">
              Everything you need to know about Ambience Studio
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-4">
            <AccordionItem value="item-1" className="border-border/50 bg-card/50 backdrop-blur-sm rounded-lg px-6 border">
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                What is an AI product background generator?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                An AI product background generator is a tool that automatically creates professional backgrounds and scenes for your product photos. Instead of booking a studio or hiring a photographer, you upload your product image, describe the setting you want, and the AI generates a photorealistic background in seconds. Floowy's Ambience Studio is specifically built for ecommerce brands that need high-quality AI product backgrounds for ads, product pages, and marketing campaigns at scale.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="border-border/50 bg-card/50 backdrop-blur-sm rounded-lg px-6 border">
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                How does an AI scene generator place products in realistic settings?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Floowy's AI scene generator analyzes your product photo, removes the existing background, and places the product into a new AI-generated environment. The AI matches lighting, shadows, perspective, and reflections to make the placement look natural and photorealistic. You can generate anything from clean studio backgrounds to outdoor lifestyle scenes, kitchen countertops, living rooms, or seasonal campaign settings.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="border-border/50 bg-card/50 backdrop-blur-sm rounded-lg px-6 border">
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                Can AI replace traditional product photography for ecommerce?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                For the majority of ecommerce and marketing use cases, yes. AI product photography tools like Floowy generate studio-quality visuals that perform as well or better than traditional photos in conversion tests. Brands report 3x faster creative production and significant savings on studio rentals, photographers, and location fees. The AI background generator is especially powerful for creating multiple scene variations from a single product shot, something that would cost thousands with traditional shoots.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="border-border/50 bg-card/50 backdrop-blur-sm rounded-lg px-6 border">
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                What kind of backgrounds and scenes can AI generate?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Floowy's AI ambience generator creates virtually any background or setting you can describe. This includes minimalist studio backgrounds, outdoor scenery, indoor lifestyle environments like kitchens, bathrooms, and living rooms, seasonal settings for holiday campaigns, and branded scenes with specific color palettes and moods. The AI scenery generator handles everything from clean product-on-white to rich, atmospheric lifestyle visuals.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="border-border/50 bg-card/50 backdrop-blur-sm rounded-lg px-6 border">
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                Can AI generate lifestyle product photos for ads and social media?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Absolutely. Floowy's AI lifestyle image generator creates in-context product visuals that are optimized for Meta Ads, TikTok, Google Shopping, Instagram, and Snapchat. Instead of organizing a full lifestyle photoshoot, you generate AI lifestyle product photos with the exact mood, setting, and atmosphere your campaign needs. This lets you test more visual variations and find winning ad creatives faster than competitors still relying on traditional shoots.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6" className="border-border/50 bg-card/50 backdrop-blur-sm rounded-lg px-6 border">
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                How does AI help create consistent brand visuals?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                With Floowy you can set preferred backgrounds, lighting styles, and color palettes that match your brand identity. The AI brand visuals tool ensures every product image has a consistent look across your entire catalog, whether you're creating content for your webshop, marketplaces, or ad campaigns. This consistency in AI visual branding builds recognition and trust with your customers across every touchpoint.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7" className="border-border/50 bg-card/50 backdrop-blur-sm rounded-lg px-6 border">
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                Can AI generate backgrounds for marketing campaigns and ads?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes. Floowy generates AI ad backgrounds and AI campaign visuals that are specifically optimized for performance marketing. Create scroll-stopping AI marketing visuals for Meta, TikTok, Google, and Snapchat from one workflow. Generate dozens of background variations to A/B test at scale, finding the settings and scenes that drive the highest CTR and conversion rates for your ecommerce store.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-8" className="border-border/50 bg-card/50 backdrop-blur-sm rounded-lg px-6 border">
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                Is there a free AI background generator?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Floowy lets you launch your first AI background creative for just €1 and test the generator for 3 days. This lets you see the quality of AI-generated product backgrounds before continuing on a full plan. After the 3-day €1 period, your selected plan continues at the regular monthly price; plans start at €19/month for ongoing content production, a fraction of what a single studio photoshoot costs.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-9" className="border-border/50 bg-card/50 backdrop-blur-sm rounded-lg px-6 border">
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                How is Floowy's AI ambience generator different from generic AI image tools?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Unlike generic AI image generators, Floowy's Ambience Studio is purpose-built for ecommerce product visuals. The AI is specifically trained to handle product placement, accurate shadows, natural lighting, and brand-consistent backgrounds. Generic tools often struggle with product accuracy, proportions, and commercial-quality output. Floowy's AI environment generator is designed to produce visuals that are ready to use on your webshop, marketplaces, and ad platforms without additional editing.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-10" className="border-border/50 bg-card/50 backdrop-blur-sm rounded-lg px-6 border">
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                Is Floowy's Ambience Studio available for brands in the Netherlands?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes. Floowy is founded and based in the Netherlands and is used by hundreds of Dutch ecommerce brands. Whether you're selling on bol.com, running Meta Ads targeting Dutch consumers, or building your own webshop from Amsterdam, Rotterdam, or Utrecht, Floowy's AI product background generator is built for the Dutch market. All pricing is in EUR, support is available in Dutch and English, and the AI generates scenes that match the visual style Dutch consumers expect.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-11" className="border-border/50 bg-card/50 backdrop-blur-sm rounded-lg px-6 border">
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                Can ecommerce brands in Belgium use Floowy's AI background generator?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Absolutely. Floowy serves a growing number of ecommerce brands in Belgium, from online retailers in Antwerp and Brussels to DTC brands in Ghent and Leuven. The platform works in Dutch, French, and English, making it ideal for Belgian brands targeting the Benelux market or selling across multiple European countries. Generate AI product backgrounds, lifestyle scenes, and campaign visuals for your Belgian webshop and marketplace listings.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-12" className="border-border/50 bg-card/50 backdrop-blur-sm rounded-lg px-6 border">
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                Does Floowy work for German ecommerce brands?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes. Floowy is used by ecommerce brands across Germany, from Berlin and Hamburg to Munich and Frankfurt. The AI product scene generator supports EUR pricing and exports visuals in all formats needed for German marketplaces like Zalando, About You, and Amazon DE, as well as Google Shopping DE, Meta, and TikTok campaigns targeting German consumers. Generate professional AI product backgrounds at scale without a local studio.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-13" className="border-border/50 bg-card/50 backdrop-blur-sm rounded-lg px-6 border">
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                Is Floowy suitable for UK based ecommerce brands?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes. Floowy works with ecommerce brands across the United Kingdom, including London, Manchester, Birmingham, and Edinburgh. The AI background generator produces visuals that meet the quality standards of UK marketplaces like Amazon UK and ASOS Marketplace, as well as UK-targeted ads on Meta, TikTok, and Google Shopping. Create professional product backgrounds and lifestyle scenes without the overhead of traditional UK studio photography.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-14" className="border-border/50 bg-card/50 backdrop-blur-sm rounded-lg px-6 border">
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                Which European countries does Floowy support?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Floowy supports ecommerce brands across all of Europe. The platform is actively used in the Netherlands, Belgium, Germany, the United Kingdom, France, Spain, Italy, and the Nordics. With EUR and GBP pricing support, multilingual AI content creation, and export options for all major European ad platforms and marketplaces, Floowy is the AI product background generator of choice for brands scaling their ecommerce visuals across the EU.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-primary/10 via-accent/20 to-primary-glow/10 rounded-3xl p-6 md:p-12 text-center border border-primary/20">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            <span className="text-header-dark">Ready to Transform Your</span> <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Product Visuals?</span>
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join ecommerce brands creating stunning product scenes with AI
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
export default AtmosphericLanding;