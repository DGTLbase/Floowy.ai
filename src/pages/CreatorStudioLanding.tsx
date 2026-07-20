import { Button } from "@/components/ui/button";
import CreatorScrollingGrid from "@/components/CreatorScrollingGrid";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Video, Sparkles, ArrowRight, Users, Languages, Mic, Upload, Wand2, Download, Check, X, ChevronRight, BookOpen, Film, ImageIcon, Mail } from "lucide-react";
import GenerationDemoShowcase from "@/components/GenerationDemoShowcase";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import TestimonialsSection from "@/components/TestimonialsSection";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useScrollAnimationInit } from "@/hooks/useScrollAnimationInit";
import creatorStudioCover from "@/assets/creator-studio-cover-new.mp4";
import creatorCoverNew from "@/assets/creator-feature-video-new.mp4";
import sideVideo1 from "@/assets/creator-side-video-1-new.mp4";
import sideVideo2 from "@/assets/creator-side-video-2.mp4";
import logoImage from "@/assets/floowy-logo.png";
import PricingSection from "@/components/PricingSection";
import ROICalculator from "@/components/ROICalculator";
import PlatformsSection from "@/components/PlatformsSection";
import MetaTags from "@/components/MetaTags";
import StructuredData from "@/components/StructuredData";
import ComparisonSection from "@/components/ComparisonSection";
import creatorStudioHero from "@/assets/creator-studio-hero.png";
import shopifyLogo from "@/assets/logo-shopify.svg";
import iconAmsterdamLogo from "@/assets/logo-icon-amsterdam.png";
import nimaniLogo from "@/assets/logo-nimani.png";
import welhofLogo from "@/assets/logo-welhof.png";
import lothLogo from "@/assets/logo-loth-fabenim.png";
import curlyGirlLogo from "@/assets/logo-curlygirl.png";
import cetaphilLogo from "@/assets/logo-cetaphil.png";
import marcelsLogo from "@/assets/logo-marcels.png";
const creatorFeature1 = "/videos/creator-studio-1.mp4";
const creatorFeature2 = "/videos/creator-studio-3.mp4";
const creatorFeature3 = "/videos/creator-studio-5.mp4";

import { useState, useEffect, useRef } from "react";

import IndustriesHighlightSection from "@/components/IndustriesHighlightSection";
const CreatorDemoVideo = () => {
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
            title="Creator Studio demo video"
          />
        )}
      </div>
    </div>
  );
};

const CreatorStudioLanding = () => {
  useScrollAnimationInit();
  
  return (
    <div className="min-h-screen bg-background">
      <MetaTags 
        title="AI Product Video Generator for Ecommerce | Floowy AI"
        description="Turn product images into scroll-stopping videos with AI. Create TikTok, Reels, and ad videos in seconds. No editing skills needed."
        keywords="AI product video generator, UGC content creator, AI video creator, user generated content"
        canonicalUrl="https://floowy.ai/creator-studio"
      />
      <StructuredData type="organization" />
      <StructuredData 
        type="breadcrumb" 
        breadcrumbs={[
          { name: "Home", url: "https://floowy.ai" },
          { name: "Creator Studio", url: "https://floowy.ai/creator-studio" }
        ]}
      />
      <Navigation />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#e3efe3]">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-start gap-8 lg:gap-12 pt-8 md:pt-12 pb-12 md:pb-20">
            <div className="flex w-full min-w-0 flex-1 flex-col items-center space-y-6 pt-4 text-center lg:items-start lg:pt-8 lg:text-left">
            
            <h1 className="max-w-full text-[2.15rem] font-bold tracking-tight leading-[1.05] text-header-dark sm:text-4xl md:text-5xl lg:text-[3.25rem] xl:text-6xl">
              Turn Any Product Image Into <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Scroll-Stopping Video Content</span>
            </h1>
            
            <p className="max-w-xl px-1 text-base text-muted-foreground sm:text-lg md:text-xl">
              Create product videos, TikTok content, Instagram Reels, and video ads from a single product photo. No filming, no editing, no production team. Built for ecommerce brands that need video content at scale.
            </p>

            {/* Hero image - mobile only */}
            <div className="lg:hidden relative flex w-full max-w-full flex-col items-center overflow-hidden">
              <img 
                src={creatorStudioHero} 
                alt="AI Creator Studio - Product Video Generation" 
                className="w-full max-w-[22rem] object-contain" loading="lazy" decoding="async"
              />
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#e3efe3] to-transparent pointer-events-none" />
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
                <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#e3efe3] to-transparent z-10" />
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#e3efe3] to-transparent z-10" />
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
                src={creatorStudioHero} 
                alt="AI Creator Studio - Product Video Generation" 
                className="w-full max-w-2xl object-contain" loading="lazy" decoding="async"
              />
              <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-[#e3efe3] via-[#e3efe3]/60 to-transparent pointer-events-none" />
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
                Stop Paying Thousands for <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">UGC Video Production</span>
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto">
                Create authentic, scroll-stopping UGC style videos without creators, scripts, or lengthy production timelines. AI generates professional UGC videos in minutes, not weeks.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center scroll-animate">
              {/* Left: Video UI */}
              <div className="rounded-2xl overflow-hidden shadow-2xl border border-border/30 bg-card p-3 sm:p-4 max-w-md lg:max-w-lg mx-auto">
                <video
                  src={creatorStudioCover}
                  className="block w-full h-auto object-cover rounded-xl"
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              </div>

              {/* Right: Case stats */}
              <div className="space-y-5 text-center lg:text-left">
                <h3 className="text-2xl md:text-3xl font-bold text-header-dark">
                  Upload your product. Get UGC videos instantly.
                </h3>

                <p className="text-muted-foreground leading-relaxed text-base md:text-lg">
                  Upload your product photos and let AI generate realistic UGC style videos featuring AI presenters. Authentic talking head content, unboxing styles, and testimonial formats that feel genuine, all without hiring a single creator.
                </p>

                <div className="bg-muted/50 rounded-xl p-5">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <p className="text-4xl md:text-5xl font-extrabold leading-none bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">+29%</p>
                      <p className="text-xs md:text-sm font-semibold text-primary uppercase tracking-wide mt-1">Ad engagement</p>
                    </div>
                    <p className="text-sm md:text-base text-muted-foreground">By replacing traditional UGC production with AI generated video content, Loth Fabenim scaled their creative output and saw a significant lift in engagement across paid social campaigns.</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <img src={lothLogo} alt="Loth Fabenim" className="h-10 md:h-12 w-auto dark:invert-0" style={{ filter: 'brightness(0)' }} loading="lazy" decoding="async" />
                  <Link to="/cases" className="inline-flex items-center gap-1 text-sm font-medium text-foreground hover:text-primary transition-colors">
                    Read case study <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 scroll-animate">
              <h2 className="text-3xl md:text-5xl font-bold text-header-dark mb-4">
                How It <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Works</span>
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
                Four simple steps to professional product videos
              </p>
            </div>

            <div className="mb-16 scroll-animate">
              <CreatorDemoVideo />
            </div>

            <div className="relative scroll-animate">
              <div className="hidden md:block absolute top-[60px] left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" />
              <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-6">
                {[
                  { icon: Upload, step: "1", title: "Upload Your Image", desc: "Upload a product photo or select a visual you've already created in Floowy." },
                  { icon: Film, step: "2", title: "Choose Video Style", desc: "Select your format: product showcase, lifestyle video, social content, or ad creative." },
                  { icon: Wand2, step: "3", title: "Customize", desc: "Adjust motion, duration, aspect ratio, and styling to match your platform and brand." },
                  { icon: Download, step: "4", title: "Generate & Export", desc: "Get your video in seconds. Export in vertical (9:16), square (1:1), or landscape (16:9) for any platform." },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center text-center group relative">
                    {i < 3 && (
                      <div className="md:hidden absolute -bottom-7 left-1/2 -translate-x-1/2 flex flex-col items-center">
                        <div className="w-[2px] h-5 bg-gradient-to-b from-primary/40 to-primary/10" />
                        <ChevronRight className="w-4 h-4 text-primary/30 rotate-90" />
                      </div>
                    )}
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

            <div className="mt-16 scroll-animate">
              <div className="relative rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-accent/10 p-8 md:p-10 text-center overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.08),transparent_70%)]" />
                <div className="relative z-10">
                  <BookOpen className="w-8 h-8 text-primary mx-auto mb-4" />
                  <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2">Need More Clarity?</h3>
                  <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                    Check our detailed knowledge base guide for step-by-step instructions.
                  </p>
                  <Link to="/knowledge-base/creator-studio">
                    <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                      View Creator Studio Guide <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Every Video Format Section */}
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
                  Every Video Format,<br /><span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">One Tool</span>
                </h2>
                <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
                  From 6-second product teasers to full ad videos. Generate vertical content for TikTok and Instagram Reels, square videos for feeds, and landscape formats for YouTube and Google Ads. Floowy's AI video creator handles every format your ecommerce brand needs to scale video content across every platform and placement.
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
                <CreatorScrollingGrid />
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


      <IndustriesHighlightSection />
      <ROICalculator />

      {/* Our Main Features */}
      <section className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 scroll-animate">
            <span className="inline-block text-xs font-mono tracking-[0.3em] uppercase text-primary mb-4">
              Our Main Features
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-header-dark mb-4">
              Everything You{" "}<span className="hidden md:inline">Need to Scale</span><br className="md:hidden" /><span className="md:hidden">Need to Scale</span><br />
              <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Video Content</span>
            </h2>
            <p className="text-muted-foreground text-base md:text-lg leading-relaxed max-w-3xl mx-auto">
              Generate product videos, social content, and video ads from a single product image. No filming, no editing software, no production team needed.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="scroll-animate text-center md:text-left" style={{ transitionDelay: '0.1s' }}>
              <div className="rounded-2xl overflow-hidden shadow-xl border border-border/30 mb-5 aspect-[3/4]">
                <video src={creatorFeature1} className="block w-full h-full object-cover" autoPlay loop muted playsInline />
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-3">
                <Film className="w-4 h-4" />
                Image to Video
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-header-dark mb-2">
                From photo to motion in seconds.
              </h3>
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                Transform any product photo into dynamic video content in seconds. The AI adds natural motion, smooth transitions, and professional styling to bring your products to life.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="scroll-animate text-center md:text-left" style={{ transitionDelay: '0.2s' }}>
              <div className="rounded-2xl overflow-hidden shadow-xl border border-border/30 mb-5 aspect-[3/4]">
                <video src={creatorFeature2} className="block w-full h-full object-cover" autoPlay loop muted playsInline />
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-3">
                <Video className="w-4 h-4" />
                Social Video Creator
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-header-dark mb-2">
                Native content for every platform.
              </h3>
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                Generate scroll-stopping short-form videos optimized for TikTok, Instagram Reels, and YouTube Shorts. Native-feeling content that matches each platform's style.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="scroll-animate text-center md:text-left" style={{ transitionDelay: '0.3s' }}>
              <div className="rounded-2xl overflow-hidden shadow-xl border border-border/30 mb-5 aspect-[3/4]">
                <video src={creatorFeature3} className="block w-full h-full object-cover" autoPlay loop muted playsInline />
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-3">
                <Sparkles className="w-4 h-4" />
                Video Ads Generator
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-header-dark mb-2">
                A/B test video creatives at scale.
              </h3>
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                Create performance-ready video ads for Meta, TikTok, Google, and Snapchat. Multiple variations from one product image so you can A/B test video creatives at scale.
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
              <Button size="lg" className="bg-offer text-offer-foreground hover:bg-offer-hover text-lg px-8 h-14 w-full sm:w-auto">
                Claim Your Premium Model <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <PlatformsSection />


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
          "Unlimited video generation from images",
          "Every platform format covered (9:16, 1:1, 16:9)",
          "No filming or editing skills needed",
          "Product videos in seconds, not weeks",
          "A/B test video creatives at scale",
          "Cost-efficient",
          "Consistent brand styling across all videos",
          "TikTok, Reels, and Shorts ready",
          "One tool for the full video workflow",
        ]}
        othersItems={[
          "Expensive videographers and editors",
          "Days or weeks per video production",
          "Inconsistent quality across deliverables",
          "Limited variations per shoot",
          "Manual editing and post-production",
          "Platform-specific reformatting needed",
          "High per-video production costs",
          "€300+ per UGC or product video",
          "Complex coordination with production teams",
        ]}
        ctaText="Start for €1"
      />

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
              Everything you need to know about Creator Studio
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-4">
            <AccordionItem value="item-1" className="border-border/50 bg-card/50 backdrop-blur-sm rounded-lg px-6 border">
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">What is an AI product video generator?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">An AI product video generator is a tool that transforms static product images into dynamic video content using artificial intelligence. Instead of hiring a videographer or learning editing software, you upload a product photo and the AI creates professional video content in seconds. Floowy's Creator Studio is specifically built for ecommerce brands that need AI product videos for TikTok, Instagram Reels, YouTube Shorts, and paid ad campaigns at scale.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2" className="border-border/50 bg-card/50 backdrop-blur-sm rounded-lg px-6 border">
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">How does image to video AI work?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">Floowy's image to video AI analyzes your product photo and adds natural motion, smooth camera movements, transitions, and professional styling to create a dynamic video. You upload a single image, choose your video style and platform format, and the AI image to video generator produces a ready-to-publish video in seconds. The result looks like professionally filmed content without any filming or editing.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3" className="border-border/50 bg-card/50 backdrop-blur-sm rounded-lg px-6 border">
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">Can AI turn a photo into a video automatically?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">Yes. Floowy's photo to video AI converts any product image into engaging video content with one click. The AI handles everything: motion, pacing, transitions, and format optimization. Whether you need a 6-second product teaser or a longer showcase video, the AI creates it from your static image. This is especially powerful for ecommerce brands that have thousands of product photos but no video content.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4" className="border-border/50 bg-card/50 backdrop-blur-sm rounded-lg px-6 border">
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">Can AI generate TikTok videos for ecommerce brands?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">Absolutely. Floowy's AI TikTok video generator creates native-feeling vertical video content optimized for the TikTok feed and TikTok Shop. Generate product showcase videos, trending format content, and video ads that match the organic style TikTok users engage with. Produce fresh TikTok content daily from your existing product images without a content creator or video editor.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-5" className="border-border/50 bg-card/50 backdrop-blur-sm rounded-lg px-6 border">
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">Can AI create Instagram Reels from product images?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">Yes. Floowy's AI Instagram Reels generator transforms product photos into vertical video content optimized for Instagram Reels. The AI creates scroll-stopping short-form video that matches the visual style and pacing Instagram's algorithm favors. Generate multiple Reels variations from a single product image to keep your content fresh and test what performs best with your audience.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-6" className="border-border/50 bg-card/50 backdrop-blur-sm rounded-lg px-6 border">
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">Can AI generate YouTube Shorts?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">Yes. Floowy's AI YouTube Shorts generator produces vertical video content formatted for YouTube's short-form platform. Create product teasers, brand content, and video ads that capture attention in the YouTube Shorts feed. The AI optimizes timing, motion, and visual hooks specifically for how viewers consume content on YouTube Shorts.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-7" className="border-border/50 bg-card/50 backdrop-blur-sm rounded-lg px-6 border">
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">How can AI generate video ads for ecommerce?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">Floowy's AI video ads generator creates performance-ready video ad creatives from a single product image. Generate video ads optimized for Meta, TikTok, Google, and Snapchat in seconds. Each video is designed to stop the scroll and drive conversions. The AI produces multiple video ad variations so you can A/B test at scale and find your best performers faster, without the cost of traditional video ad production.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-8" className="border-border/50 bg-card/50 backdrop-blur-sm rounded-lg px-6 border">
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">Can AI create product demo videos?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">Yes. Floowy's AI product demo video tool generates engaging product showcase videos from your product images. The AI creates dynamic presentations that highlight product features, textures, and details with professional motion and styling. These AI product demo videos are perfect for product pages, marketplace listings on bol.com and Amazon, and social media content that drives purchase decisions.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-9" className="border-border/50 bg-card/50 backdrop-blur-sm rounded-lg px-6 border">
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">How does an AI video creator save time and money for ecommerce?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">Traditional product video production requires planning, filming, editing, and formatting for each platform. This typically costs hundreds per video and takes days or weeks. Floowy's AI video creator tool produces the same output in seconds from a single product image. Ecommerce brands report saving thousands per month on video production while generating 10x more video content. The AI handles motion, styling, and multi-platform formatting so your team can focus on strategy and scaling.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-10" className="border-border/50 bg-card/50 backdrop-blur-sm rounded-lg px-6 border">
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">Is Floowy's Creator Studio available for ecommerce brands in the Netherlands?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">Yes. Floowy is founded and based in the Netherlands and is used by hundreds of Dutch ecommerce brands for their video content production. Whether you're creating TikTok content from Amsterdam, product videos for bol.com listings from Rotterdam, or Instagram Reels from Utrecht, Floowy's AI product video generator is built for the Dutch market. All pricing is in EUR, support is available in Dutch and English.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-11" className="border-border/50 bg-card/50 backdrop-blur-sm rounded-lg px-6 border">
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">Can ecommerce brands in Belgium use Floowy's AI video creator?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">Absolutely. Floowy serves a growing number of ecommerce brands in Belgium, from online retailers in Antwerp and Brussels to DTC brands in Ghent and Leuven. The platform works in Dutch, French, and English, making it ideal for Belgian brands creating video content for the Benelux market. Generate AI product videos, TikTok content, and Instagram Reels for Belgian and pan-European audiences from one tool.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-12" className="border-border/50 bg-card/50 backdrop-blur-sm rounded-lg px-6 border">
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">Does Floowy work for German ecommerce brands?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">Yes. Floowy is used by ecommerce brands across Germany, from Berlin and Hamburg to Munich, Frankfurt, and Cologne. The AI video generator supports EUR pricing and produces video content in all formats needed for the German market, including TikTok DE, Instagram, YouTube Shorts, and video ads targeting German consumers on Meta and Google. Scale your video content production without a local videographer or editor.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-13" className="border-border/50 bg-card/50 backdrop-blur-sm rounded-lg px-6 border">
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">Is Floowy suitable for UK ecommerce brands?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">Yes. Floowy works with ecommerce brands across the United Kingdom, including London, Manchester, Birmingham, Leeds, and Edinburgh. The Creator Studio generates AI product videos that meet the quality standards of UK-targeted campaigns on TikTok, Instagram, YouTube, Meta, and Amazon UK. Create professional product videos and social content for the UK market without a local production team.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-14" className="border-border/50 bg-card/50 backdrop-blur-sm rounded-lg px-6 border">
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">Which European countries does Floowy support?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">Floowy supports ecommerce brands across all of Europe. The platform is actively used in the Netherlands, Belgium, Germany, the United Kingdom, France, Spain, Italy, Portugal, and the Nordics. With EUR and GBP pricing, multilingual support, and export options optimized for all major European social platforms, ad networks, and marketplaces, Floowy is the AI product video generator of choice for brands scaling their video content across the EU.</AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-primary/10 via-accent/20 to-primary-glow/10 rounded-3xl p-6 md:p-12 text-center border border-primary/20">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            <span className="text-header-dark">Ready to Scale Your</span> <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Video Content?</span>
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join ecommerce brands creating product videos with AI
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

export default CreatorStudioLanding;
