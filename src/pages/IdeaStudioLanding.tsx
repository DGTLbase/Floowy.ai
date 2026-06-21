import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Sparkles, Upload, Wand2, Download, Lightbulb, Zap, Image, Check, X, ChevronRight, BookOpen, ArrowRight, Mail, Settings, Layers } from "lucide-react";
import GenerationDemoShowcase from "@/components/GenerationDemoShowcase";
import IdeaScrollingGrid from "@/components/IdeaScrollingGrid";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import TestimonialsSection from "@/components/TestimonialsSection";
import PricingSection from "@/components/PricingSection";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ROICalculator from "@/components/ROICalculator";
import PlatformsSection from "@/components/PlatformsSection";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useScrollAnimationInit } from "@/hooks/useScrollAnimationInit";
import logoImage from "@/assets/floowy-logo.png";
import AutoBeforeAfterSlider from "@/components/AutoBeforeAfterSlider";
import beforeImage from "@/assets/idea-studio-hero-before.png";
import afterImage from "@/assets/idea-studio-hero-after.png";
import ideaCover from "@/assets/idea-studio-case-study.png";
import MetaTags from "@/components/MetaTags";
import StructuredData from "@/components/StructuredData";
import ComparisonSection from "@/components/ComparisonSection";
import ideaFeature1 from "@/assets/idea-feature-1.webp";
import ideaFeature2 from "@/assets/idea-feature-2.webp";
import ideaFeature3 from "@/assets/idea-feature-3.webp";
import shopifyLogo from "@/assets/logo-shopify.svg";
import iconAmsterdamLogo from "@/assets/logo-icon-amsterdam.png";
import nimaniLogo from "@/assets/logo-nimani.png";
import welhofLogo from "@/assets/logo-welhof.png";
import lothLogo from "@/assets/logo-loth-fabenim.png";
import curlyGirlLogo from "@/assets/logo-curlygirl.png";
import cetaphilLogo from "@/assets/logo-cetaphil.png";
import marcelsLogo from "@/assets/logo-marcels.png";

import IndustriesHighlightSection from "@/components/IndustriesHighlightSection";
const IdeaDemoVideo = () => {
  const videoRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold: 0.3 }
    );
    if (videoRef.current) observer.observe(videoRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={videoRef} className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl border border-border/30 bg-card">
      {inView && (
        <iframe
          src="https://www.youtube.com/embed/g_6jEFml0cY?autoplay=1&mute=1&loop=1&playlist=g_6jEFml0cY&controls=1&modestbranding=1&rel=0"
          title="Idea Studio Demo"
          className="absolute inset-0 w-full h-full"
          allow="autoplay; encrypted-media"
          allowFullScreen
        />
      )}
    </div>
  );
};

const IdeaStudioLanding = () => {
  useScrollAnimationInit();
  
  return (
    <div className="min-h-screen bg-background">
      <MetaTags 
        title="AI Creative Content Rewriter for Ecommerce | Floowy AI"
        description="Recreate winning ad concepts, hooks, and copy variations with AI. Scale your creative output without starting from scratch every time."
        keywords="AI creative content rewriter, AI image recreation, AI product recreation, creative concepts"
        canonicalUrl="https://floowy.ai/idea-studio"
      />
      <StructuredData type="organization" />
      <StructuredData 
        type="breadcrumb" 
        breadcrumbs={[
          { name: "Home", url: "https://floowy.ai" },
          { name: "Idea Studio", url: "https://floowy.ai/idea-studio" }
        ]}
      />
      <Navigation />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#e8f0e8]">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-start gap-8 lg:gap-12 pt-8 md:pt-12 pb-12 md:pb-20">
            <div className="flex w-full min-w-0 flex-1 flex-col items-center space-y-6 pt-4 text-center lg:items-start lg:pt-8 lg:text-left">
            
              <h1 className="max-w-full text-[2.15rem] font-bold tracking-tight leading-[1.05] text-header-dark sm:text-4xl md:text-5xl lg:text-[3.25rem] xl:text-6xl">
                Turn One Winning Idea Into Dozens of<br /> <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">High-Performing Variations</span>
              </h1>
            
              <p className="max-w-xl px-1 text-base text-muted-foreground sm:text-lg md:text-xl">
                Recreate your best-performing ads, hooks, and campaign concepts with AI. Generate fresh variations of what already works instead of starting from scratch every time. Built for ecommerce brands that need creative content at scale.
              </p>

              {/* Hero image - mobile only */}
              <div className="lg:hidden relative flex w-full max-w-full flex-col items-center overflow-hidden">
                <div className="w-full max-w-[22rem]">
                  <AutoBeforeAfterSlider 
                    beforeImage={beforeImage}
                    afterImage={afterImage}
                    autoAnimate={true}
                    animationDuration={3000}
                  />
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#e8f0e8] to-transparent pointer-events-none" />
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
                  <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#e8f0e8] to-transparent z-10" />
                  <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#e8f0e8] to-transparent z-10" />
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
            <div className="flex-1 hidden lg:flex flex-col items-center justify-center relative">
              <div className="w-full max-w-lg mt-20">
                <AutoBeforeAfterSlider 
                  beforeImage={beforeImage}
                  afterImage={afterImage}
                  autoAnimate={true}
                  animationDuration={3000}
                />
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#e8f0e8] to-transparent pointer-events-none" />
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
                Stop Reinventing the Wheel With Every <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Campaign</span>
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto">
                Your best ads already exist. The problem is producing enough variations to scale them. Idea Studio recreates your winning concepts in fresh ways so you never run out of creative ammunition.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center scroll-animate">
              {/* Left: UI screenshot */}
              <div className="rounded-2xl overflow-hidden shadow-2xl border border-border/30 bg-card p-3 sm:p-4 max-w-md lg:max-w-lg mx-auto">
                <img 
                  src={ideaCover} 
                  alt="Idea Studio showing ad concept recreation with AI-generated variations" 
                  className="block w-full h-auto object-cover rounded-xl"
                  loading="lazy"
                />
              </div>

              {/* Right: Case stats */}
              <div className="space-y-5 text-center lg:text-left">
                <h3 className="text-2xl md:text-3xl font-bold text-header-dark">
                  One winning idea. Unlimited fresh angles.
                </h3>

                <p className="text-muted-foreground leading-relaxed text-base md:text-lg">
                  Upload your best-performing ad, campaign visual, or hook and let AI generate dozens of new variations. Different angles, different copy, different styling, same winning formula. Test more, find winners faster, and never hit a creative wall again.
                </p>

                <div className="bg-muted/50 rounded-xl p-5">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <p className="text-4xl md:text-5xl font-extrabold leading-none bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">+18%</p>
                      <p className="text-xs md:text-sm font-semibold text-primary uppercase tracking-wide mt-1">ROAS increase</p>
                    </div>
                    <p className="text-sm md:text-base text-muted-foreground">By iterating on proven concepts instead of starting from scratch, Welhof significantly increased creative output and improved return on ad spend across all paid channels.</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <img src={welhofLogo} alt="Welhof" className="h-14 object-contain" loading="lazy" decoding="async" />
                  <Link to="/cases/welhof" className="inline-flex items-center gap-1 text-sm font-medium text-foreground hover:text-primary transition-colors">
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
                Four simple steps to scaling your best creative ideas
              </p>
            </div>

            {/* Demo Video */}
            <div className="mb-16 scroll-animate">
              <IdeaDemoVideo />
            </div>

            {/* 4 Steps - circular node layout */}
            <div className="relative scroll-animate">
              {/* Desktop connecting line */}
              <div className="hidden md:block absolute top-[60px] left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" />

              <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-6">
                {[
                  { icon: Upload, step: "1", title: "Upload Your Best Creative", desc: "Upload an ad, campaign visual, social post, or hook that already performs well for your brand." },
                  { icon: Layers, step: "2", title: "Choose What to Recreate", desc: "Select what you want to iterate on: the visual concept, the copy angle, the hook, or the full creative." },
                  { icon: Wand2, step: "3", title: "Generate Variations", desc: "AI analyzes what makes your creative work and generates dozens of fresh variations with new angles, styling, and messaging." },
                  { icon: Download, step: "4", title: "Test & Scale", desc: "Download your new creatives and launch them. A/B test the variations to find your next winners." },
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
                  <Link to="/knowledge-base/idea-studio">
                    <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                      View Idea Studio Guide <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Every Content Type Section */}
      <section className="py-8 md:py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              <div className="scroll-animate space-y-5 text-center lg:text-left order-first lg:order-last">
                <span className="inline-block text-xs font-mono tracking-[0.3em] uppercase text-primary">
                  Unlimited Iterations
                </span>
                <h2 className="text-3xl md:text-5xl font-bold text-header-dark">
                  Every Content Type,<br /><span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Endless Variations</span>
                </h2>
                <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
                  From ad creatives and campaign concepts to hooks, captions, and copy. Idea Studio recreates any content type you feed it. Upload a winning Meta ad and get 20 fresh variations. Paste a high-performing hook and get new angles for TikTok, Reels, and Stories. Your best ideas deserve to be scaled, not shelved after one campaign.
                </p>
                <div className="pt-2 hidden lg:flex justify-start">
                  <Link to="/auth?mode=signup">
                    <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground rounded-full px-6">
                      Learn more <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="scroll-animate rounded-2xl overflow-hidden order-last lg:order-first">
                <IdeaScrollingGrid />
              </div>
              <div className="pt-2 flex lg:hidden justify-center order-last">
                <Link to="/auth?mode=signup">
                  <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground rounded-full px-6">
                    Learn more <ArrowRight className="w-4 h-4 ml-2" />
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

      {/* Our Main Features */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14 scroll-animate">
              <span className="inline-block text-xs font-mono tracking-[0.3em] uppercase text-primary mb-4">
                Our Main Features
              </span>
              <h2 className="text-3xl md:text-5xl font-bold text-header-dark mb-4">
                Everything You Need to Scale{" "}<br />
                <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Creative Iteration</span>
              </h2>
              <p className="text-muted-foreground text-base md:text-lg leading-relaxed max-w-3xl mx-auto">
                Stop starting from scratch. Recreate, iterate, and scale your best-performing content with AI. From ad concepts to hooks and copy, produce unlimited variations of what already works.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 - Recreate Ad Concepts */}
              <div className="scroll-animate text-center md:text-left" style={{ transitionDelay: '0.1s' }}>
                <div className="rounded-2xl overflow-hidden shadow-xl border border-border/30 mb-5 aspect-[3/4]">
                  <img src={ideaFeature1} alt="Recreate Ad Concepts" className="block w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-3">
                  <Image className="w-4 h-4" />
                  Recreate Ad Concepts
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-header-dark mb-2">
                  Generate fresh variations of your winning ads in seconds.
                </h3>
                <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                  Upload a winning ad and let AI generate dozens of fresh visual and copy variations. Same winning formula, completely new executions ready for testing across Meta, TikTok, and Google.
                </p>
              </div>

              {/* Feature 2 - Rewrite Hooks & Copy */}
              <div className="scroll-animate text-center md:text-left" style={{ transitionDelay: '0.2s' }}>
                <div className="rounded-2xl overflow-hidden shadow-xl border border-border/30 mb-5 aspect-[3/4]">
                  <img src={ideaFeature2} alt="Rewrite Hooks and Copy" className="block w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-3">
                  <Sparkles className="w-4 h-4" />
                  Rewrite Hooks & Copy
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-header-dark mb-2">
                  Turn one great hook into dozens of platform-optimized variations.
                </h3>
                <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                  Paste your best-performing hooks, headlines, or ad copy and get new variations optimized for different platforms, audiences, and tones.
                </p>
              </div>

              {/* Feature 3 - Generate Campaign Variations */}
              <div className="scroll-animate text-center md:text-left" style={{ transitionDelay: '0.3s' }}>
                <div className="rounded-2xl overflow-hidden shadow-xl border border-border/30 mb-5 aspect-[3/4]">
                  <img src={ideaFeature3} alt="Generate Campaign Variations" className="block w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-3">
                  <Zap className="w-4 h-4" />
                  Generate Campaign Variations
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-header-dark mb-2">
                  Scale your creative output without scaling your team.
                </h3>
                <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                  Take one campaign concept and generate dozens of variations across formats and styles. Scale your creative output without scaling your team or budget.
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

      <PlatformsSection />


      <div id="pricing">
        <PricingSection />
      </div>
      
      <ComparisonSection
        headline={<h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-header-dark mb-4">Why Scaling Brands <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Switch to Floowy</span></h2>}
        subtitle="Everyone's talking about it. AI content creation made simple."
        floowyItems={[
          "Unlimited creative variations from one idea",
          "AI rewrites hooks, copy, and concepts",
          "No agency or creative team needed",
          "Instant iteration on proven winners",
          "A/B test at scale",
          "Cost-efficient",
          "Consistent brand voice across variations",
          "Works across all ad platforms",
          "Data-informed creative iteration",
        ]}
        othersItems={[
          "Expensive agency brainstorm sessions",
          "Days or weeks for new creative rounds",
          "Inconsistent quality across iterations",
          "Limited variations per brief",
          "Manual copywriting for each variation",
          "Creative fatigue from starting from scratch",
          "High per-concept production costs",
          "No data-driven iteration process",
          "Difficult to maintain brand voice at scale",
        ]}
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
              Everything you need to know about Idea Studio
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-4">
            {[
              { q: "What is an AI creative content rewriter?", a: "An AI creative content rewriter is a tool that takes your existing ads, hooks, copy, or campaign concepts and generates fresh variations while keeping the core winning elements intact. Instead of creating new content from scratch, the AI analyzes what makes your content work and produces dozens of new executions based on that formula. Floowy's Idea Studio is built specifically for ecommerce marketing teams that need to scale their best-performing creatives without running out of ideas." },
              { q: "How does AI content recreation differ from regular content generation?", a: "Regular AI content generation creates something entirely new from a prompt. AI content recreation starts with something that already works. You upload a proven ad, hook, or campaign concept, and the AI produces variations that build on that success. This approach is more effective for performance marketing because it scales what's already converting instead of rolling the dice on completely new ideas. Idea Studio is designed around this iterate-on-winners philosophy." },
              { q: "Can AI rewrite hooks for ads and social media?", a: "Yes. Floowy's AI hook rewriter takes your best-performing hooks and generates dozens of new variations with different angles, tones, and structures. Whether you need hooks for TikTok, Instagram Reels, Facebook ads, or Google Ads, the AI keeps the persuasive core while producing fresh copy that fights ad fatigue. Brands report generating 20+ hook variations from a single winning hook in minutes." },
              { q: "Can AI rewrite ad copy to improve performance?", a: "Absolutely. Floowy's AI ad copy rewriter analyzes your existing ad copy and produces new versions optimized for different audiences, platforms, and campaign objectives. The AI maintains your brand voice while testing different angles, emotional triggers, and calls to action. This is especially powerful for ecommerce brands running Meta and Google campaigns that need constant copy refreshes to maintain performance." },
              { q: "Can AI generate multiple hook variations for A/B testing?", a: "Yes. The AI hook generator in Idea Studio produces multiple hook variations from a single input, each with a different angle or approach. This lets performance marketers run proper A/B tests on hooks at scale without manually writing dozens of variations. More hooks tested means finding winners faster, reducing ad fatigue, and keeping your CTR high across all platforms." },
              { q: "Can AI rewrite captions for different platforms?", a: "Yes. Floowy's AI caption rewriter takes a caption that works on one platform and adapts it for others. A caption that converts on Instagram might need a different tone for TikTok or a different structure for LinkedIn. The AI understands platform-specific conventions and rewrites your captions accordingly while keeping the core message and selling points intact." },
              { q: "How does AI generate creative concept variations at scale?", a: "Floowy's AI creative variations generator analyzes your campaign concept and produces multiple fresh executions. This includes new visual directions, different messaging angles, alternative hooks, and varied styling. The AI content variations generator lets you go from one proven concept to dozens of testable variations in minutes, something that would take a creative team days or weeks to produce manually." },
              { q: "Can AI recreate campaign concepts for different audiences?", a: "Yes. Floowy's AI campaign concept generator takes a winning campaign and adapts it for different target audiences, demographics, or market segments. The AI adjusts messaging, visual style, and tone while keeping the core concept intact. This is ideal for ecommerce brands that sell to multiple customer segments or are expanding into new markets with proven campaign frameworks." },
              { q: "How can AI help marketing teams recreate content faster?", a: "AI marketing content rewriting eliminates the bottleneck of manual creative production. Instead of briefing designers and copywriters for every new variation, your team uploads what works and gets fresh versions in seconds. Floowy's Idea Studio integrates with the rest of the Floowy platform, so you can recreate ad visuals, hooks, and copy all in one workflow. Marketing teams report producing 10x more creative variations without increasing headcount or agency spend." },
              { q: "Is Floowy's Idea Studio available for ecommerce brands in the Netherlands?", a: "Yes. Floowy is founded and based in the Netherlands and is used by hundreds of Dutch ecommerce brands for scaling their creative output. Whether you're running performance campaigns from Amsterdam, managing ad accounts from Rotterdam, or iterating on creatives from Utrecht, Idea Studio is built for the Dutch market. All pricing is in EUR, support is in Dutch and English." },
              { q: "Can ecommerce brands in Belgium use Floowy's Idea Studio?", a: "Absolutely. Floowy serves a growing number of ecommerce brands in Belgium, from performance marketing teams in Antwerp and Brussels to DTC brands in Ghent and Leuven. The platform works in Dutch, French, and English, making it ideal for Belgian brands that need to iterate on creatives for the Benelux market and beyond." },
              { q: "Does Floowy work for German ecommerce brands?", a: "Yes. Floowy is used by ecommerce brands across Germany, from Berlin and Hamburg to Munich and Frankfurt. Idea Studio supports EUR pricing and generates content variations in any language, making it perfect for German brands running campaigns across Meta, TikTok, and Google targeting DACH consumers. Scale your creative iteration without a local agency." },
              { q: "Is Floowy suitable for UK ecommerce brands?", a: "Yes. Floowy works with ecommerce brands across the United Kingdom, including London, Manchester, Birmingham, and Edinburgh. Idea Studio generates creative variations optimized for UK audiences, whether you're iterating on Meta ads, TikTok hooks, or Google Shopping copy for the UK market." },
              { q: "Which European countries does Floowy support?", a: "Floowy supports ecommerce brands across all of Europe. The platform is actively used in the Netherlands, Belgium, Germany, the United Kingdom, France, Spain, Italy, and the Nordics. With EUR and GBP pricing, multilingual content variation generation, and export options for all major European ad platforms, Floowy is the AI creative content rewriter of choice for brands scaling across the EU." },
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
      <section className="container mx-auto px-4 py-5 md:py-6">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-primary/10 via-accent/20 to-primary-glow/10 rounded-3xl p-6 md:p-12 text-center border border-primary/20">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            <span className="text-header-dark">Ready to Scale Your Best</span> <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Creative Ideas?</span>
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join ecommerce brands iterating on winning content with AI
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

export default IdeaStudioLanding;
