
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Sparkles, ArrowRight, Upload, Users, Wand2, Download, Check, X, ChevronRight, BookOpen, Image, Layers, RotateCw, Camera, Shirt, Grid3X3, Mail, Film } from "lucide-react";
import fashionStillImage from "@/assets/fashion-still-image.jpg";
import fashionVideoDemo from "@/assets/fashion-video-demo.mp4";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import TestimonialsSection from "@/components/TestimonialsSection";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useScrollAnimationInit } from "@/hooks/useScrollAnimationInit";
import logoImage from "@/assets/floowy-logo.png";
import PricingSection from "@/components/PricingSection";
import ROICalculator from "@/components/ROICalculator";
import PlatformsSection from "@/components/PlatformsSection";
import MetaTags from "@/components/MetaTags";
import StructuredData from "@/components/StructuredData";
import fashionCover from "@/assets/fashion-cover-new-5.png";
import fspShoes from "@/assets/fsp-before-shoes.webp";
import fspBag from "@/assets/fsp-before-bag.jpg";
import fspBlazerFront from "@/assets/fsp-before-blazer-front.jpg";
import fspBlazerBack from "@/assets/fsp-before-blazer-back.jpg";
import fspTshirt from "@/assets/fsp-before-tshirt.webp";
import fspJeans from "@/assets/fsp-before-jeans.jpg";
import fspOutput from "@/assets/fsp-output-mockup.png";
import ComparisonSection from "@/components/ComparisonSection";
import fashionProHero from "@/assets/fashion-pro-hero.png";
import shopifyLogo from "@/assets/logo-shopify.svg";
import iconAmsterdamLogo from "@/assets/logo-icon-amsterdam.png";
import nimaniLogo from "@/assets/logo-nimani.png";
import welhofLogo from "@/assets/logo-welhof.png";
import lothLogo from "@/assets/logo-loth-fabenim.png";
import curlyGirlLogo from "@/assets/logo-curlygirl.png";
import cetaphilLogo from "@/assets/logo-cetaphil.png";
import marcelsLogo from "@/assets/logo-marcels.png";
import baskoLogo from "@/assets/logo-basko.png";
import fashionProCaseStudy from "@/assets/fashion-pro-case-study.png";
import FashionProScrollingGrid from "@/components/FashionProScrollingGrid";
import fspFeatureCampaign from "@/assets/fsp-feature-campaign.png";
import fspFeatureLookbook from "@/assets/fsp-feature-lookbook.png";
import fspFeatureBrand from "@/assets/fsp-feature-brand.png";

import IndustriesHighlightSection from "@/components/IndustriesHighlightSection";
const FashionStudioProLanding = () => {
  useScrollAnimationInit();


  return (
    <div className="min-h-screen bg-background">
      <MetaTags
        title="AI Fashion Campaign & Lookbook Generator | Floowy AI"
        description="Create high-end fashion campaigns, lookbooks, and catalog visuals with AI. Scale your brand photography without studios or agencies."
        keywords="ai fashion image generator, ai fashion photography generator, ai fashion model generator, ai clothing image generator, ai apparel product images, ai fashion product photography, ai multi angle product images ai, ai outfit image generator, ai fashion shoot generator, ai bulk fashion image generator, ai bulk product image generator, ai bulk fashion photography, ai multi angle clothing images, ai front back side product images, ai fashion photoshoot generator, ai model photography ai tool, ai clothing mockup generator, ai fashion catalog generator, ai ecommerce fashion photography, ai fashion lookbook generator, ai model photoshoot ai, ai apparel photography generator, generate multiple product angles ai, ai fashion studio generator, bulk ecommerce product images ai, ai product images multiple angles"
        canonicalUrl="https://floowy.ai/fashion-studio-pro"
      />
      <StructuredData type="organization" />
      <StructuredData
        type="breadcrumb"
        breadcrumbs={[
          { name: "Home", url: "https://floowy.ai" },
          { name: "Fashion Studio Pro", url: "https://floowy.ai/fashion-studio-pro" },
        ]}
      />
      <Navigation />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#e0f2e9]">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-start gap-8 lg:gap-12 pt-8 md:pt-12 pb-12 md:pb-20">
            <div className="flex w-full min-w-0 flex-1 flex-col items-center space-y-6 pt-4 text-center lg:items-start lg:pt-8 lg:text-left">
            
            <h1 className="max-w-full text-[2.15rem] font-bold tracking-tight leading-[1.05] text-header-dark sm:text-4xl md:text-5xl lg:text-[3.25rem] xl:text-6xl">
              Create High-End Fashion Campaigns <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Without a Studio or Agency</span>
            </h1>
            
            <p className="max-w-xl px-1 text-base text-muted-foreground sm:text-lg md:text-xl">
              Generate lookbooks, catalog visuals, and campaign-ready fashion photography with AI. From collection launches to seasonal campaigns, produce premium brand content at scale. Built for fashion brands that need editorial-quality visuals without the production overhead.
            </p>

            {/* Hero image - mobile only */}
            <div className="lg:hidden relative flex w-full max-w-full flex-col items-center overflow-hidden">
              <img 
                src={fashionProHero} 
                alt="AI Fashion Studio Pro - Professional fashion campaign photography" 
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
                src={fashionProHero} 
                alt="AI Fashion Studio Pro - Professional fashion campaign photography" 
                className="w-full max-w-2xl object-contain" loading="lazy" decoding="async"
              />
              <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#e0f2e9] to-transparent pointer-events-none" />
              
              {/* Trust metrics - overlaid on image */}
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
                Stop Paying for Full Lookbook <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Productions</span>
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto">
                Get complete front, back, and side views of every product on AI generated models without scheduling a single shoot. Full 360 coverage in minutes, not days.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center scroll-animate">
              {/* Left: Campaign UI */}
              <div className="rounded-2xl overflow-hidden shadow-2xl border border-border/30 bg-card p-3 sm:p-4 max-w-md lg:max-w-lg mx-auto">
                <img 
                  src={fashionProCaseStudy} 
                  alt="Fashion Studio Pro interface showing multi-angle AI fashion photography" 
                  className="block w-full h-auto object-cover rounded-xl"
                  loading="lazy"
                />
              </div>

              {/* Right: Case stats */}
              <div className="space-y-5 text-center lg:text-left">
                <h3 className="text-2xl md:text-3xl font-bold text-header-dark">
                  One product. Four angles. Zero shoots.
                </h3>

                <p className="text-muted-foreground leading-relaxed text-base md:text-lg">
                  Upload a single product photo and get professional on-model shots from every angle. Front, back, left, and right views generated automatically so your customers see the full picture before they buy.
                </p>

                <div className="bg-muted/50 rounded-xl p-5">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <p className="text-4xl md:text-5xl font-extrabold leading-none bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">-24%</p>
                      <p className="text-xs md:text-sm font-semibold text-primary uppercase tracking-wide mt-1">product return rate</p>
                    </div>
                    <p className="text-sm md:text-base text-muted-foreground">By showing products from all angles on AI generated models, Baskostore reduced returns and gave customers the confidence to buy without hesitation.</p>
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

      {/* See Floowy in Action - YouTube Videos */}
      <section className="py-8 md:py-12 bg-background overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Video Walkthroughs</p>
            <h2 className="text-3xl md:text-5xl font-bold text-header-dark mb-4">
              See Floowy in <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Action</span>
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              Watch how ecommerce brands create stunning visuals in seconds.
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
      <section className="py-8 md:py-12 bg-background overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 scroll-animate">
              <span className="inline-block text-xs font-mono tracking-[0.3em] uppercase text-primary mb-4">Process</span>
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                <span className="text-header-dark">How It</span> <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Works</span>
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
                Four simple steps to premium fashion campaign visuals
              </p>
            </div>

            {/* Demo Video - Primary Element */}
            <div className="max-w-4xl mx-auto mb-16 scroll-animate">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-primary/10 border border-border/30 aspect-video bg-black">
                <iframe
                  src="https://www.youtube-nocookie.com/embed/h1Eb-M3tM3w?autoplay=1&mute=1&loop=1&playlist=h1Eb-M3tM3w&controls=1&rel=0&showinfo=0&modestbranding=1&iv_load_policy=3"
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="Fashion Studio Pro demo walkthrough"
                  loading="lazy"
                />
              </div>
            </div>

            {/* 4 Step Cards */}
            <div className="max-w-6xl mx-auto mb-12">
              {/* Connecting line - desktop */}
              <div className="hidden md:block relative mb-0">
                <div className="absolute top-[60px] left-[10%] right-[10%] h-[2px] bg-gradient-to-r from-primary/20 via-primary to-primary/20 z-0" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-6 relative z-10">
                {[
                  { num: "01", title: "Upload Your Product", desc: "Upload your clothing or accessory product photos. Works with flat lays, hangers, or ghost mannequin shots.", icon: Upload },
                  { num: "02", title: "Choose Campaign Style", desc: "Select your visual direction: editorial campaign, lookbook, catalog, social media, or custom brand style.", icon: Camera },
                  { num: "03", title: "Customize", desc: "Set your brand colors, preferred model look, background mood, and art direction to match your campaign brief.", icon: Wand2 },
                  { num: "04", title: "Generate", desc: "Get campaign-ready fashion visuals in seconds. Export in any format for ads, lookbooks, or your webshop.", icon: Sparkles },
                ].map((step, i) => (
                  <div key={i} className="flex flex-col items-center text-center group">
                    {/* Step circle */}
                    <div className="relative mb-6">
                      <div className="w-[120px] h-[120px] rounded-full bg-gradient-to-br from-card to-muted border-2 border-border/50 flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:border-primary/50 transition-all duration-500">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center group-hover:from-primary/20 group-hover:to-primary/10 transition-all duration-500">
                          <step.icon className="w-7 h-7 text-primary group-hover:scale-110 transition-transform duration-300" />
                        </div>
                      </div>
                      {/* Step number badge */}
                      <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shadow-md">
                        {step.num}
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2">{step.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed max-w-[220px]">{step.desc}</p>

                    {/* Mobile connector */}
                    {i < 3 && (
                      <div className="md:hidden flex flex-col items-center mt-6">
                        <div className="w-[2px] h-8 bg-gradient-to-b from-primary to-primary/20" />
                        <div className="w-6 h-6 rounded-full border-2 border-primary/30 flex items-center justify-center">
                          <ChevronRight className="w-3 h-3 text-primary rotate-90" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Knowledge Base Callout */}
            <div className="max-w-lg mx-auto bg-gradient-to-br from-primary/5 via-accent/5 to-background rounded-2xl p-8 border border-border/50 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--primary)/0.06),transparent_70%)]" />
              <div className="relative z-10">
                <BookOpen className="w-8 h-8 text-primary mx-auto mb-3" />
                <p className="text-foreground font-medium mb-2 text-center">
                  Need More Clarity?
                </p>
                <p className="text-sm text-muted-foreground mb-5 text-center">
                  Check our detailed knowledge base guide for step-by-step instructions.
                </p>
                <div className="text-center">
                  <Link to="/knowledge-base/fashion-studio-pro">
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow gap-2">
                      View Fashion Studio Pro Guide
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Every Campaign Style, One Tool */}
      <section className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-last lg:order-first">
              <FashionProScrollingGrid />
            </div>
            <div className="space-y-6 text-center lg:text-left order-first lg:order-last">
              <p className="text-xs font-bold text-primary uppercase tracking-wider">Unlimited Campaign Visuals</p>
              <h2 className="text-3xl md:text-5xl font-bold text-header-dark">
                Every Fashion<br />Campaign, <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">One Studio</span>
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                From multi-angle product shoots and complete lookbooks to seasonal collections and catalog photography. Generate editorial-quality fashion visuals from every angle with consistent styling across your entire range. Floowy's Fashion Studio Pro handles every campaign, every collection, and every angle your fashion brand needs to produce at scale.
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
                <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Fashion Campaign Production</span>
              </h2>
              <p className="text-muted-foreground text-base md:text-lg leading-relaxed max-w-3xl mx-auto">
                Generate editorial-quality fashion visuals, lookbooks, and catalog images without agencies, photographers, or studios. From concept to campaign in minutes.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 - Create Campaign Visuals */}
              <div className="scroll-animate text-center md:text-left" style={{ transitionDelay: '0.1s' }}>
                <div className="rounded-2xl overflow-hidden shadow-xl border border-border/30 mb-5 aspect-[3/4]">
                  <img src={fspFeatureCampaign} alt="Fashion campaign visual" className="block w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-3">
                  <Camera className="w-4 h-4" />
                  Create Campaign Visuals
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-header-dark mb-2">
                  Generate high-end fashion campaign images with editorial styling.
                </h3>
                <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                  Professional lighting and brand-consistent art direction. Perfect for seasonal launches, brand campaigns, and ad creatives.
                </p>
              </div>

              {/* Feature 2 - Create Lookbooks & Catalogs */}
              <div className="scroll-animate text-center md:text-left" style={{ transitionDelay: '0.2s' }}>
                <div className="rounded-2xl overflow-hidden shadow-xl border border-border/30 mb-5 aspect-[3/4]">
                  <img src={fspFeatureLookbook} alt="Lookbook and catalog production" className="block w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-3">
                  <Layers className="w-4 h-4" />
                  Create Lookbooks & Catalogs
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-header-dark mb-2">
                  Produce complete lookbook spreads and catalog photography.
                </h3>
                <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                  Consistent styling across every product, every page, every season. Generate your entire collection's visuals at once.
                </p>
              </div>

              {/* Feature 3 - Match Your Brand Identity */}
              <div className="scroll-animate text-center md:text-left" style={{ transitionDelay: '0.3s' }}>
                <div className="rounded-2xl overflow-hidden shadow-xl border border-border/30 mb-5 aspect-[3/4]">
                  <img src={fspFeatureBrand} alt="Brand-consistent fashion visuals" className="block w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-3">
                  <Wand2 className="w-4 h-4" />
                  Match Your Brand Identity
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-header-dark mb-2">
                  Set your brand's visual DNA once and stay on-brand every time.
                </h3>
                <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                  Colors, mood, styling, and art direction stay consistent across your entire catalog and all campaigns.
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
          "Unlimited campaign visual production",
          "Lookbooks and catalogs in minutes",
          "No agency or studio dependency",
          "Consistent brand identity across collections",
          "Instant seasonal campaign refreshes",
          "Cost-efficient",
          "Editorial-quality output",
          "Every format for every channel",
          "Full creative control",
        ]}
        othersItems={[
          "Expensive agency retainers and photographer fees",
          "Weeks of production per campaign",
          "Inconsistent styling across shoots",
          "Limited variations per budget",
          "Model booking and scheduling overhead",
          "Studio rental and location costs",
          "Long post-production timelines",
          "Difficult to scale for multiple collections",
          "Complex coordination across teams",
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
              Everything you need to know about Fashion Studio Pro
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-4">
            <AccordionItem value="item-1" className="border-border/50 bg-card/50 backdrop-blur-sm rounded-xl px-6 border data-[state=open]:shadow-md data-[state=open]:border-primary/25">
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                What is Fashion Studio Pro and how is it different from Fashion Studio?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Fashion Studio Pro is Floowy's advanced AI fashion photography tool built for brands that need campaign-level visuals, lookbooks, and catalog imagery. While Fashion Studio focuses on generating individual on-model product images for ecommerce listings, Fashion Studio Pro is designed for creating complete fashion campaign visuals with editorial styling, consistent brand identity, and collection-wide visual coherence. It's the tool for brands that need more than product shots.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="border-border/50 bg-card/50 backdrop-blur-sm rounded-xl px-6 border data-[state=open]:shadow-md data-[state=open]:border-primary/25">
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                Can AI create fashion campaign visuals that look editorial?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes. Floowy's Fashion Studio Pro generates AI fashion campaign visuals with professional art direction, editorial lighting, and brand-consistent styling. The AI produces visuals that match the quality of traditional campaign photoshoots, from seasonal collection launches to brand awareness campaigns. Fashion brands use these visuals for social media, paid ads, lookbooks, and brand websites.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="border-border/50 bg-card/50 backdrop-blur-sm rounded-xl px-6 border data-[state=open]:shadow-md data-[state=open]:border-primary/25">
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                Can AI generate fashion lookbooks?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Absolutely. Floowy's AI lookbook generator creates complete fashion lookbooks with consistent on-model styling, coordinated backgrounds, and professional quality across every page. Whether you're producing a seasonal lookbook, a capsule collection preview, or a wholesale catalog, the AI maintains visual coherence across your entire collection without a single photoshoot.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="border-border/50 bg-card/50 backdrop-blur-sm rounded-xl px-6 border data-[state=open]:shadow-md data-[state=open]:border-primary/25">
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                Can AI produce catalog-ready fashion images?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes. Floowy generates AI fashion catalog images that meet the standards of wholesale buyers, online retailers, and print production. The AI produces consistent lighting, backgrounds, and styling across hundreds of products, making it ideal for brands managing large catalogs that need frequent updates. What used to take weeks of studio time now happens in minutes.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="border-border/50 bg-card/50 backdrop-blur-sm rounded-xl px-6 border data-[state=open]:shadow-md data-[state=open]:border-primary/25">
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                How does AI help with fashion branding visuals?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Fashion Studio Pro lets you define your brand's visual DNA, including preferred styling, color palettes, lighting mood, and model aesthetics. The AI fashion branding visuals tool then generates every visual to match your brand identity consistently. This ensures your campaigns, lookbooks, social media content, and ad creatives all share a cohesive look that builds brand recognition.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6" className="border-border/50 bg-card/50 backdrop-blur-sm rounded-xl px-6 border data-[state=open]:shadow-md data-[state=open]:border-primary/25">
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                Can AI create fashion ads for Meta, TikTok, and Google?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes. Fashion Studio Pro generates AI fashion ads and campaign images optimized for every major advertising platform. Create scroll-stopping visuals for Meta Ads, TikTok, Google Shopping, Instagram, and Snapchat from one workflow. The AI produces multiple campaign variations so you can A/B test visual styles and find what drives the highest CTR and conversions for your fashion brand.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7" className="border-border/50 bg-card/50 backdrop-blur-sm rounded-xl px-6 border data-[state=open]:shadow-md data-[state=open]:border-primary/25">
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                Can AI generate visuals for fashion collections and seasonal launches?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Absolutely. Floowy's AI fashion collection visuals tool is built for exactly this. Generate complete visual sets for new collection launches, seasonal campaigns, and capsule drops. The AI creates consistent, on-brand imagery across your entire range, from hero campaign shots to individual product visuals, so you can launch faster and with more visual variety than any traditional production allows.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-8" className="border-border/50 bg-card/50 backdrop-blur-sm rounded-xl px-6 border data-[state=open]:shadow-md data-[state=open]:border-primary/25">
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                How can AI scale fashion marketing visuals?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                AI fashion marketing visuals remove the production bottleneck from your marketing team. Instead of briefing agencies and waiting weeks, generate campaign images, social media visuals, ad creatives, and email assets in minutes. Fashion Studio Pro lets brands produce 10x more marketing content without increasing budget or headcount, keeping your visual presence fresh and competitive across every channel.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-9" className="border-border/50 bg-card/50 backdrop-blur-sm rounded-xl px-6 border data-[state=open]:shadow-md data-[state=open]:border-primary/25">
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                Can AI match fashion brand guidelines for premium brands?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes. Floowy's Fashion Studio Pro is specifically designed for brands that have strict visual standards. You can set lighting preferences, color palettes, model aesthetics, background styles, and art direction parameters that the AI follows consistently. The result is AI fashion visuals that maintain the premium look and feel your brand requires, whether for your own webshop, wholesale partners, or advertising campaigns.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-10" className="border-border/50 bg-card/50 backdrop-blur-sm rounded-xl px-6 border data-[state=open]:shadow-md data-[state=open]:border-primary/25">
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                Is Fashion Studio Pro available for fashion brands in the Netherlands?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes. Floowy is founded and based in the Netherlands and is used by hundreds of Dutch fashion brands for their campaign and lookbook production. Whether you're a fashion label in Amsterdam, a DTC brand in Rotterdam, or a fashion startup in The Hague, Fashion Studio Pro is built for the Dutch market. All pricing is in EUR, support is in Dutch and English, and the tool generates visuals optimized for Dutch marketplaces and ad platforms.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-11" className="border-border/50 bg-card/50 backdrop-blur-sm rounded-xl px-6 border data-[state=open]:shadow-md data-[state=open]:border-primary/25">
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                Can fashion brands in Belgium use Fashion Studio Pro?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Absolutely. Floowy serves a growing number of Belgian fashion brands, from established labels in Antwerp and Brussels to emerging designers in Ghent and Bruges. The platform works in Dutch, French, and English, making it ideal for Belgian brands producing fashion campaigns for the Benelux market and beyond.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-12" className="border-border/50 bg-card/50 backdrop-blur-sm rounded-xl px-6 border data-[state=open]:shadow-md data-[state=open]:border-primary/25">
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                Does Floowy work for German fashion brands?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes. Floowy is used by fashion brands across Germany, from Berlin and Munich to Hamburg and Düsseldorf. Fashion Studio Pro supports EUR pricing and generates campaign visuals and lookbooks that meet the standards of Zalando, About You, and the German fashion market. Scale your fashion campaign production without a local agency or studio.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-13" className="border-border/50 bg-card/50 backdrop-blur-sm rounded-xl px-6 border data-[state=open]:shadow-md data-[state=open]:border-primary/25">
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                Is Floowy suitable for UK fashion brands?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes. Floowy works with fashion brands across the United Kingdom, including London, Manchester, and Birmingham. Fashion Studio Pro generates campaign visuals and lookbook imagery that meet the quality expectations of UK retailers, marketplaces like ASOS, and UK-targeted ad campaigns on Meta, TikTok, and Google.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-14" className="border-border/50 bg-card/50 backdrop-blur-sm rounded-xl px-6 border data-[state=open]:shadow-md data-[state=open]:border-primary/25">
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                Which European countries does Floowy support?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Floowy supports fashion brands across all of Europe. The platform is actively used in the Netherlands, Belgium, Germany, the United Kingdom, France, Spain, Italy, and the Nordics. With EUR and GBP pricing, multilingual support, and export options for all major European ad platforms and fashion marketplaces, Floowy is the AI fashion campaign tool of choice for brands scaling across the EU.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-primary/10 via-accent/20 to-primary-glow/10 rounded-3xl p-6 md:p-12 text-center border border-primary/20">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            <span className="text-header-dark">Ready to Scale Your</span> <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Fashion Campaigns?</span>
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join fashion brands creating campaign-quality visuals with AI
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

export default FashionStudioProLanding;
