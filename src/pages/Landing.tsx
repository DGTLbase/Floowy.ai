import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Sparkles, Image, Users, Video, Wand2, ArrowRight, ChevronRight, Menu, Check, X, Palette, MousePointerClick, ChevronDown, ShoppingBag, Megaphone, Layers, Film, Upload, Mail } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useScrollAnimationInit } from "@/hooks/useScrollAnimationInit";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const navTools = [
  { name: "Ads Studio", path: "/ads-studio", icon: Megaphone, description: "Ad creative generation" },
  { name: "Ambience Studio", path: "/ambience-studio", icon: Image, description: "Lifestyle backgrounds" },
  { name: "Creator Studio", path: "/creator-studio", icon: Video, description: "UGC content creation" },
  { name: "Fashion Studio", path: "/fashion-studio", icon: Sparkles, description: "AI model photography" },
  { name: "Fashion Studio Pro", path: "/tool/ultimate-outfit-maker", icon: Sparkles, description: "AI outfit mockups" },
  { name: "Flat Lay Studio", path: "/flatlay-studio", icon: Layers, description: "AI flat lay photography" },
  { name: "Idea Studio", path: "/idea-studio", icon: Wand2, description: "Product visualization" },
  { name: "Listing Studio", path: "/listing-studio", icon: ShoppingBag, description: "Marketplace listing images" },
  { name: "Virtual Video Studio", path: "/virtual-video-studio", icon: Film, description: "Cinematic video creation" },
];
import heroRightImage from "@/assets/hero-image.png";
import atmosphericCover from "@/assets/Ambience-6.png";
import virtualVideoStudioCover from "@/assets/virtual-studio-cover.mp4";
import fashionCover from "@/assets/fashion-cover-new-5.png";
import ideaStudioCover from "@/assets/idea-studio-cover-new.png";
import creatorStudioCover from "@/assets/creator-feature-video-new.mp4";
import flatlayStudioCover from "@/assets/Flatlay-2.png";
import adsStudioPreview from "@/assets/ads-studio-preview.png";
import listingStudioPreview from "@/assets/listing-studio-preview.png";
import fashionProCover from "@/assets/fashion-pro-cover.png";
import suitcaseProduct from "@/assets/suitcase-product.webp";
import suitcaseMirror from "@/assets/suitcase-mirror.webp";
import suitcaseLobby from "@/assets/suitcase-lobby.webp";
import suitcaseHotelDesk from "@/assets/suitcase-hotel-desk.webp";
import ambienceFeatureImg from "@/assets/atmospheric-farmer.jpg";
import fashionFeatureImg from "@/assets/landing-cover-new.jpg";
import creatorFeatureVideo from "@/assets/creator-feature-video.mp4";
import ideaStudioFeatureImg from "@/assets/idea-studio-feature.jpg";
import logoImage from "@/assets/floowy-logo.png";
import TestimonialsSection from "@/components/TestimonialsSection";
import PricingSection from "@/components/PricingSection";
import ROICalculator from "@/components/ROICalculator";
import Footer from "@/components/Footer";
import PlatformsSection from "@/components/PlatformsSection";
import IndustriesHighlightSection from "@/components/IndustriesHighlightSection";
import { CookieBanner } from "@/components/CookieBanner";
import { TiltCard } from "@/components/TiltCard";
import nimaniLogo from "@/assets/logo-nimani.png";
import welhofLogo from "@/assets/logo-welhof.png";
import lothLogo from "@/assets/logo-loth-fabenim.png";
import curlyGirlLogo from "@/assets/logo-curlygirl.png";
import cetaphilLogo from "@/assets/logo-cetaphil.png";
import marcelsLogo from "@/assets/logo-marcels.png";
import iconAmsterdamLogo from "@/assets/logo-icon-amsterdam.png";
import shopifyLogo from "@/assets/logo-shopify.svg";
import ScrollingGallery from "@/components/ScrollingGallery";
import videoDemoStill from "@/assets/video-demo-still.jpg";
import videoDemoOutput from "@/assets/video-demo-output.mp4";
import PageMeta from "@/components/PageMeta";
import EaseOfUseHowItWorks from "@/components/EaseOfUseHowItWorks";
import BrandComparisonTable from "@/components/BrandComparisonTable";


const Landing = () => {
  useScrollAnimationInit();
  

  const tools = [
    {
      id: "ads-studio",
      name: "Ads studio",
      description: "Generate high-converting ad creatives for all platforms",
      category: "PERFECT FOR ADVERTISING",
      icon: Palette,
      link: "/ads-studio",
      status: "active",
      cover: adsStudioPreview,
    },
    {
      id: "atmospheric",
      name: "Ambience studio",
      description: "Transform your products into stunning atmospheric photos with AI-powered effects",
      category: "PERFECT FOR PRODUCT PHOTOGRAPHY",
      icon: Image,
      link: "/ambience-studio",
      status: "active",
      cover: atmosphericCover,
    },
    {
      id: "ugc-video",
      name: "Creator studio",
      description: "Create authentic user-generated content videos for your products",
      category: "PERFECT FOR UGC CONTENT",
      icon: Video,
      link: "/creator-studio",
      status: "active",
      cover: creatorStudioCover,
      coverType: "video",
    },
    {
      id: "fashion",
      name: "Fashion studio",
      description: "Create professional fashion photography with AI-powered styling",
      category: "PERFECT FOR E-COMMERCE",
      icon: Wand2,
      link: "/fashion-studio",
      status: "active",
      cover: fashionCover,
    },
    {
      id: "fashion-pro",
      name: "Fashion Studio Pro",
      description: "Create complete AI-powered fashion shoots at scale with multi-angle output",
      category: "PERFECT FOR BULK FASHION",
      icon: Sparkles,
      link: "/fashion-studio-pro",
      status: "active",
      cover: fashionProCover,
    },
    {
      id: "flatlay-studio",
      name: "Flatlay studio",
      description: "Create stunning flatlay photography for your products",
      category: "PERFECT FOR SOCIAL MEDIA",
      icon: Image,
      link: "/flatlay-studio",
      status: "active",
      cover: flatlayStudioCover,
    },
    {
      id: "models",
      name: "Idea studio",
      description: "Recreate inspired visuals for your brand and bring your ideas to life with AI.",
      category: "PERFECT FOR BRAND VISUALS",
      icon: Users,
      link: "/idea-studio",
      status: "active",
      cover: ideaStudioCover,
    },
    {
      id: "listing-studio",
      name: "Listing studio",
      description: "Create marketplace-ready product listings that convert",
      category: "PERFECT FOR MARKETPLACES",
      icon: ShoppingBag,
      link: "/listing-studio",
      status: "active",
      cover: listingStudioPreview,
    },
    {
      id: "virtual-video-studio",
      name: "Virtual Video Studio",
      description: "Turn product images into cinematic marketing videos automatically",
      category: "PERFECT FOR VIDEO MARKETING",
      icon: Film,
      link: "/virtual-video-studio",
      status: "active",
      cover: virtualVideoStudioCover,
      coverType: "video",
    },
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <PageMeta 
        title="AI Product Image and Video Generator for Ecommerce"
        description="Create product images, ad creatives, and marketing visuals with AI. No photoshoots needed. Scale your ecommerce content with Floowy.ai."
        keywords="AI product image generator, AI content creation, marketing visuals, AI photoshoots, ecommerce"
        canonicalUrl="https://floowy.ai"
        breadcrumbs={[
          { name: "Home", url: "https://floowy.ai" }
        ]}
      />
      {/* Navigation */}
      <nav className="bg-background/80 backdrop-blur-sm sticky top-0 z-50 py-4">
        <div className="container mx-auto px-4">
          <div className="bg-card/90 backdrop-blur-md rounded-full shadow-lg border border-border/50 px-6 py-3 flex items-center justify-between max-w-5xl mx-auto">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img src={logoImage} alt="Floowy.ai" className="h-7 w-auto" loading="lazy" decoding="async" />
              <span className="font-bold text-lg text-foreground">Floowy.ai</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-6">
              <div className="relative group">
                <Link to="/solutions" className="text-sm font-medium text-foreground hover:text-primary transition-colors flex items-center gap-1">
                  Solutions
                  <ChevronDown className="w-4 h-4 transition-transform group-hover:rotate-180" />
                </Link>
                <div className="absolute top-full left-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="w-64 bg-popover border border-border shadow-lg rounded-md p-1 animate-fade-in">
                    {navTools.map((tool) => (
                      <Link 
                        key={tool.path} 
                        to={tool.path} 
                        className="flex items-center gap-3 px-3 py-2.5 rounded-sm hover:bg-accent transition-colors"
                      >
                        <tool.icon className="w-4 h-4 text-primary" />
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{tool.name}</span>
                          <span className="text-xs text-muted-foreground">{tool.description}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
              <Link to="/cases" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                Cases
              </Link>
              <Link to="/pricing" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                Pricing
              </Link>
              <Link to="/industries" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                Industries
              </Link>
              <Link to="/our-story" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                Our story
              </Link>
              <Link to="/contact" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                Contact
              </Link>
            </div>

            <div className="flex items-center gap-4">
              <Link to="/auth" className="hidden md:block text-sm font-medium text-foreground hover:text-primary transition-colors">
                Login
              </Link>
              <Link to="/auth?mode=signup" className="hidden md:block">
                <Button className="bg-offer text-offer-foreground hover:bg-offer-hover rounded-full h-9 px-5">
                  Start for €1
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
              
              {/* Mobile Menu */}
              <Sheet>
                <SheetTrigger asChild className="md:hidden">
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <div className="flex flex-col gap-6 mt-8">
                    <Collapsible className="space-y-2">
                      <CollapsibleTrigger className="flex items-center justify-between w-full text-lg font-medium text-foreground hover:text-primary transition-colors">
                        Solutions
                        <ChevronDown className="w-5 h-5 transition-transform duration-200" />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pl-4 space-y-1">
                        {navTools.map((tool) => (
                          <Link 
                            key={tool.path} 
                            to={tool.path} 
                            className="flex items-center gap-3 py-2.5 text-muted-foreground hover:text-primary transition-colors"
                          >
                            <tool.icon className="w-4 h-4" />
                            <div className="flex flex-col">
                              <span className="text-base">{tool.name}</span>
                              <span className="text-xs text-muted-foreground">{tool.description}</span>
                            </div>
                          </Link>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                    <Link to="/cases" className="text-lg font-medium text-foreground hover:text-primary transition-colors text-left">
                      Cases
                    </Link>
                    <button 
                      onClick={() => {
                        document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="text-lg font-medium text-foreground hover:text-primary transition-colors text-left"
                    >
                      Pricing
                    </button>
                    <Link to="/industries" className="text-lg font-medium text-foreground hover:text-primary transition-colors text-left">
                      Industries
                    </Link>
                    <Link to="/our-story" className="text-lg font-medium text-foreground hover:text-primary transition-colors text-left">
                      Our story
                    </Link>
                    <Link to="/contact" className="text-lg font-medium text-foreground hover:text-primary transition-colors text-left">
                      Contact
                    </Link>
                    <Link to="/auth" className="text-lg font-medium text-foreground hover:text-primary transition-colors text-left">
                      Login
                    </Link>
                    <Link to="/auth?mode=signup" className="w-full">
                      <Button className="bg-offer text-offer-foreground hover:bg-offer-hover rounded-full w-full">
                        Start for €1
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#e0f2e9]">
        <div className="max-w-7xl mx-auto px-5 overflow-hidden">
          <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-12 py-8 md:py-20">
            <div className="flex-1 min-w-0 w-full space-y-3 sm:space-y-6 text-center lg:text-left items-center lg:items-start flex flex-col overflow-hidden">
            
             <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] xl:text-6xl font-bold tracking-tight text-header-dark leading-[1.15] w-full">
               <span className="block sm:inline">Scale Your</span>{' '}
               <span className="block sm:inline"><span className="whitespace-nowrap">E-Commerce</span> Visuals</span>{' '}
               <span className="block sm:inline">Without a <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Photoshoot</span></span>
             </h1>
            
             <p className="text-[0.9rem] sm:text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed">
              Launch your products faster while spending less on content production. Generate studio-quality on-model images and ad creatives in seconds. No photographer, no studio, no compromise on quality.
            </p>

            {/* Hero image - mobile only, right after subtext */}
            <div className="lg:hidden w-full flex flex-col items-center overflow-hidden max-w-[calc(100vw-2rem)]">
              <img 
                src={heroRightImage} 
                alt="AI Generated Fashion Model" 
                className="w-full max-w-[280px] object-contain" fetchPriority="high" decoding="async"
              />
              <div className="lg:hidden grid grid-cols-3 gap-4 w-full max-w-md mx-auto px-4 mt-4">
                <div className="text-center">
                  <p className="text-xl font-extrabold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">90%</p>
                  <p className="text-xs text-muted-foreground">lower costs</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-extrabold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">10x</p>
                  <p className="text-xs text-muted-foreground">faster output</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-extrabold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent whitespace-nowrap">4K</p>
                  <p className="text-xs text-muted-foreground">studio quality visuals</p>
                </div>
              </div>
            </div>
            
            <div className="flex w-full flex-col items-center gap-3 pt-1 sm:w-auto sm:flex-row sm:justify-center lg:justify-start">
              <Link to="/auth?mode=signup" className="w-full sm:w-auto">
                <Button size="lg" className="h-12 w-full bg-offer text-offer-foreground hover:bg-offer-hover shadow-glow text-base px-6 sm:h-14 sm:w-auto sm:text-lg sm:px-8">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Start for €1
                </Button>
              </Link>
              <Link to="/request-demo" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="h-12 w-full text-base px-6 backdrop-blur-sm border-foreground text-foreground hover:bg-foreground hover:text-background sm:h-14 sm:w-auto sm:text-lg sm:px-8">
                  <Mail className="w-5 h-5 mr-2" />
                  Book A Call
                </Button>
              </Link>
            </div>

            <div className="text-center">
              <p className="text-base font-semibold text-foreground">€1 for your first 3 days</p>
              <p className="text-sm text-muted-foreground">Cancel anytime</p>
            </div>

            <div className="pt-4">
              <div className="flex items-center gap-3 mb-3 justify-center lg:justify-start">
                <img src={shopifyLogo} alt="Shopify" className="h-6 w-auto" loading="lazy" decoding="async" />
                <span className="text-sm sm:text-base lg:text-lg text-muted-foreground">Trusted by 1000+ brands with €10m in revenue</span>
              </div>
              <div className="relative overflow-hidden max-w-md lg:max-w-lg">
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
            <div className="flex-1 hidden lg:flex flex-col items-center justify-end">
              <img 
                src={heroRightImage} 
                alt="AI Generated Fashion Model" 
                className="w-full max-w-3xl object-contain" fetchPriority="high" decoding="async"
              />
              <div className="grid grid-cols-3 gap-6 w-full max-w-2xl mt-4">
                <div className="text-center">
                  <p className="text-xl md:text-2xl font-extrabold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent whitespace-nowrap">90%</p>
                  <p className="text-sm text-muted-foreground">lower costs</p>
                </div>
                <div className="text-center">
                  <p className="text-xl md:text-2xl font-extrabold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent whitespace-nowrap">10x</p>
                  <p className="text-sm text-muted-foreground">faster output</p>
                </div>
                <div className="text-center">
                  <p className="text-xl md:text-2xl font-extrabold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent whitespace-nowrap">4K</p>
                  <p className="text-sm text-muted-foreground">studio quality visuals</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* Tools Section */}
      <section id="tools" className="container mx-auto px-4 py-8 md:py-12 bg-gradient-card">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 px-4 scroll-animate">
            <h2 className="text-3xl md:text-5xl font-bold text-header-dark mb-4">
              Your AI Studio Suite For <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Creative</span> Content Creation
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground">
              Everything you need to create content that engages and converts.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4 items-stretch">
            {/* Card 1 - Ambience Studio */}
            <Link to="/ambience-studio" className="block h-full">
              <TiltCard className="h-full">
                <Card className="transition-all duration-300 border-border/50 overflow-hidden scroll-scale cursor-pointer shadow-lg hover:shadow-2xl h-full">
                  <div className="flex flex-col h-full">
                    <div className="relative h-[200px] md:h-[220px]">
                      <img src={atmosphericCover} alt="Ambience Studio" className="absolute inset-0 w-full h-full object-cover" loading="lazy" decoding="async" />
                    </div>
                    <div className="flex-1 p-4 flex flex-col items-center md:items-start">
                      <p className="text-[10px] font-semibold text-primary mb-1 uppercase tracking-wide">Perfect for Product Photography</p>
                      <h3 className="text-base font-bold text-foreground mb-2">Ambience Studio</h3>
                      <p className="text-xs text-muted-foreground mb-3 text-center md:text-left">Transform products into stunning atmospheric photos</p>
                      <ul className="text-xs text-muted-foreground space-y-1 mb-3 w-full">
                        <li className="flex items-center gap-1.5"><span className="text-primary">✓</span> Create any setting instantly</li>
                        <li className="flex items-center gap-1.5"><span className="text-primary">✓</span> Perfect for A/B testing</li>
                        <li className="flex items-center gap-1.5"><span className="text-primary">✓</span> Respond to trends quickly</li>
                      </ul>
                      <div className="text-[10px] text-muted-foreground mb-3">
                        <span>Old way: Studio + shoot</span>
                        <span className="ml-2 font-semibold text-foreground">€500–€2K/shoot</span>
                      </div>
                      <Button size="sm" className="w-fit bg-primary text-primary-foreground hover:bg-primary/90 mt-auto">
                        Learn More <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </TiltCard>
            </Link>

            {/* Card 2 - Flatlay Studio */}
            <Link to="/flatlay-studio" className="block h-full">
              <TiltCard className="h-full">
                <Card className="transition-all duration-300 border-border/50 overflow-hidden scroll-scale cursor-pointer shadow-lg hover:shadow-2xl h-full">
                  <div className="flex flex-col h-full">
                    <div className="relative h-[200px] md:h-[220px]">
                      <img src={flatlayStudioCover} alt="Flatlay Studio" className="absolute inset-0 w-full h-full object-cover" loading="lazy" decoding="async" />
                    </div>
                    <div className="flex-1 p-4 flex flex-col items-center md:items-start">
                      <p className="text-[10px] font-semibold text-primary mb-1 uppercase tracking-wide">Perfect for Website & Social Media</p>
                      <h3 className="text-base font-bold text-foreground mb-2">Flatlay Studio</h3>
                      <p className="text-xs text-muted-foreground mb-3 text-center md:text-left">Create stunning flatlay photography for your products</p>
                      <ul className="text-xs text-muted-foreground space-y-1 mb-3 w-full">
                        <li className="flex items-center gap-1.5"><span className="text-primary">✓</span> Professional top-down compositions</li>
                        <li className="flex items-center gap-1.5"><span className="text-primary">✓</span> Any surface, any style</li>
                        <li className="flex items-center gap-1.5"><span className="text-primary">✓</span> Packshots and styled arrangements</li>
                      </ul>
                      <div className="text-[10px] text-muted-foreground mb-3">
                        <span>Old way: Props + styling + photographer</span>
                        <span className="ml-2 font-semibold text-foreground">€300–€1K/session</span>
                      </div>
                      <Button size="sm" className="w-fit bg-primary text-primary-foreground hover:bg-primary/90 mt-auto">
                        Learn More <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </TiltCard>
            </Link>

            {/* Card 3 - Fashion Studio */}
            <Link to="/fashion-studio" className="block h-full">
              <TiltCard className="h-full">
                <Card className="transition-all duration-300 border-border/50 overflow-hidden scroll-scale cursor-pointer shadow-lg hover:shadow-2xl h-full">
                  <div className="flex flex-col h-full">
                    <div className="relative h-[200px] md:h-[220px]">
                      <img src={fashionCover} alt="Fashion Studio" className="absolute inset-0 w-full h-full object-cover" loading="lazy" decoding="async" />
                    </div>
                    <div className="flex-1 p-4 flex flex-col items-center md:items-start">
                      <p className="text-[10px] font-semibold text-primary mb-1 uppercase tracking-wide">Perfect for E-Commerce</p>
                      <h3 className="text-base font-bold text-foreground mb-2">Fashion Studio</h3>
                      <p className="text-xs text-muted-foreground mb-3 text-center md:text-left">Create professional fashion photography with AI-powered styling</p>
                      <ul className="text-xs text-muted-foreground space-y-1 mb-3 w-full">
                        <li className="flex items-center gap-1.5"><span className="text-primary">✓</span> On-model product images in seconds</li>
                        <li className="flex items-center gap-1.5"><span className="text-primary">✓</span> Diverse AI model library</li>
                        <li className="flex items-center gap-1.5"><span className="text-primary">✓</span> Campaign-ready visuals</li>
                      </ul>
                      <div className="text-[10px] text-muted-foreground mb-3">
                        <span>Old way: Models + studio + photographer</span>
                        <span className="ml-2 font-semibold text-foreground">€1K–€5K/shoot</span>
                      </div>
                      <Button size="sm" className="w-fit bg-primary text-primary-foreground hover:bg-primary/90 mt-auto">
                        Learn More <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </TiltCard>
            </Link>
          </div>

          {/* Explore All Tools CTA */}
          <div className="text-center mt-10">
            <Link to="/solutions">
              <Button size="lg" className="text-lg px-8 h-14 bg-primary text-primary-foreground hover:bg-primary/90">
                Explore All Solutions <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Ease of Use — How It Works (upgraded, above the brand gallery) */}
      <EaseOfUseHowItWorks />

      {/* Scrolling Gallery */}
      <section className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-6xl mx-auto text-center mb-8">
          <h2 className="text-3xl md:text-5xl font-bold text-header-dark">
            See What Ecommerce Brands Create With <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Floowy</span>
          </h2>
        </div>
        <ScrollingGallery />
      </section>

      <PlatformsSection />

      <section className="container mx-auto px-4 py-8 md:py-12 bg-gradient-subtle">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <div className="space-y-6">
              <h2 className="text-3xl md:text-5xl font-bold text-header-dark text-center lg:text-left">
                Scale Your Ad Creative Production Up To <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">10x</span>
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Design conversion-ready ads from banners and videos to captions and product visuals in just seconds. Floowy's advanced AI models help brands achieve higher click-through and conversion rates with creative assets built to perform.
              </p>
              
              {/* Feature Points */}
              <div className="space-y-4 pt-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-foreground font-medium">High-performing ads, instantly.</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-foreground font-medium">Generate any ad format, for any platform</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-foreground font-medium">Always on-brand. Fully customizable.</span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col gap-3 pt-6 items-center lg:items-start">
                <Link to="/auth?mode=signup">
                  <Button size="lg" className="bg-offer text-offer-foreground hover:bg-offer-hover shadow-glow">
                    Start for €1
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">€1 for your first 3 days</span> · Cancel anytime
                </p>
                <div className="flex items-center gap-3 pt-2">
                  <img src={shopifyLogo} alt="Shopify" className="h-6 w-auto opacity-80" loading="lazy" />
                  <span className="text-sm text-muted-foreground">Trusted by 1000+ ecommerce brands</span>
                </div>
              </div>
            </div>

            {/* Right Column - Workflow Visualization */}
            <div className="relative">
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-xl overflow-hidden">
                <CardContent className="p-6 md:p-10">
                  {/* Top Row: Input Steps */}
                  <div className="flex justify-center gap-6 md:gap-8 mb-8">
                    {/* Step 1: Image */}
                    <div className="flex flex-col items-center gap-3 workflow-step" style={{ animationDelay: '0s' }}>
                      <div className="relative">
                        <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-gradient-to-br from-card to-card border-2 border-primary overflow-hidden shadow-lg relative z-10 transition-all duration-300 hover:scale-110">
                          <img 
                            src={suitcaseProduct} 
                            alt="Suitcase product" 
                            className="w-full h-full object-cover" loading="lazy" decoding="async"
                          />
                        </div>
                        {/* Pulse ring */}
                        <div className="absolute inset-0 rounded-xl border-2 border-primary animate-pulse-ring" style={{ animationDelay: '0s' }} />
                      </div>
                      <span className="text-xs font-semibold text-foreground">Upload Image</span>
                      {/* Connector dot */}
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/50 mt-2 animate-pulse" style={{ animationDelay: '0.2s' }} />
                    </div>

                    {/* Step 2: Model */}
                    <div className="flex flex-col items-center gap-3 workflow-step" style={{ animationDelay: '0.4s' }}>
                      <div className="relative">
                        <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-card to-card border-2 border-primary flex items-center justify-center shadow-lg relative z-10 transition-all duration-300 hover:scale-110">
                          <Users className="w-6 h-6 md:w-7 md:h-7 text-primary" />
                        </div>
                        <div className="absolute inset-0 rounded-full border-2 border-primary animate-pulse-ring" style={{ animationDelay: '0.4s' }} />
                      </div>
                      <span className="text-xs font-semibold text-foreground">Select Model</span>
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/50 mt-2 animate-pulse" style={{ animationDelay: '0.6s' }} />
                    </div>

                    {/* Step 3: Mood */}
                    <div className="flex flex-col items-center gap-3 workflow-step" style={{ animationDelay: '0.8s' }}>
                      <div className="relative">
                        <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-card to-card border-2 border-primary flex items-center justify-center shadow-lg relative z-10 transition-all duration-300 hover:scale-110">
                          <Palette className="w-6 h-6 md:w-7 md:h-7 text-primary" />
                        </div>
                        <div className="absolute inset-0 rounded-full border-2 border-primary animate-pulse-ring" style={{ animationDelay: '0.8s' }} />
                      </div>
                      <span className="text-xs font-semibold text-foreground">Set Mood</span>
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/50 mt-2 animate-pulse" style={{ animationDelay: '1s' }} />
                    </div>

                    {/* Step 4: Output Size */}
                    <div className="flex flex-col items-center gap-3 workflow-step" style={{ animationDelay: '1.2s' }}>
                      <div className="relative">
                        <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-card to-card border-2 border-primary flex items-center justify-center shadow-lg relative z-10 transition-all duration-300 hover:scale-110">
                          <Wand2 className="w-6 h-6 md:w-7 md:h-7 text-primary" />
                        </div>
                        <div className="absolute inset-0 rounded-full border-2 border-primary animate-pulse-ring" style={{ animationDelay: '1.2s' }} />
                      </div>
                      <span className="text-xs font-semibold text-foreground whitespace-nowrap">Choose Size</span>
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/50 mt-2 animate-pulse" style={{ animationDelay: '1.4s' }} />
                    </div>
                  </div>

                  {/* Converging Dashed Lines Visualization */}
                  <div className="flex justify-center mb-4">
                    <div className="relative w-full max-w-md h-8">
                      <svg className="w-full h-full" viewBox="0 0 400 32" preserveAspectRatio="xMidYMid meet">
                        {/* Static dashed lines */}
                        <path d="M 40 0 L 200 32" stroke="hsl(var(--primary) / 0.2)" strokeWidth="2" fill="none" strokeDasharray="8 6" />
                        <path d="M 140 0 L 200 32" stroke="hsl(var(--primary) / 0.2)" strokeWidth="2" fill="none" strokeDasharray="8 6" />
                        <path d="M 260 0 L 200 32" stroke="hsl(var(--primary) / 0.2)" strokeWidth="2" fill="none" strokeDasharray="8 6" />
                        <path d="M 360 0 L 200 32" stroke="hsl(var(--primary) / 0.2)" strokeWidth="2" fill="none" strokeDasharray="8 6" />
                        
                        {/* Animated flowing dashed lines */}
                        <path d="M 40 0 L 200 32" stroke="hsl(var(--primary))" strokeWidth="2" fill="none" strokeDasharray="8 6" className="animate-dash-flow" />
                        <path d="M 140 0 L 200 32" stroke="hsl(var(--primary))" strokeWidth="2" fill="none" strokeDasharray="8 6" className="animate-dash-flow" style={{ animationDelay: '0.3s' }} />
                        <path d="M 260 0 L 200 32" stroke="hsl(var(--primary))" strokeWidth="2" fill="none" strokeDasharray="8 6" className="animate-dash-flow" style={{ animationDelay: '0.6s' }} />
                        <path d="M 360 0 L 200 32" stroke="hsl(var(--primary))" strokeWidth="2" fill="none" strokeDasharray="8 6" className="animate-dash-flow" style={{ animationDelay: '0.9s' }} />
                      </svg>
                    </div>
                  </div>

                  {/* Generate Button */}
                  <div className="flex justify-center mb-4 workflow-step" style={{ animationDelay: '1.6s' }}>
                    <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-primary to-primary-glow rounded-xl blur opacity-30 group-hover:opacity-50 transition duration-300" />
                      <Button className="relative w-48 h-16 bg-gradient-to-r from-primary to-primary-glow hover:shadow-glow text-primary-foreground font-semibold rounded-xl transition-all duration-300 hover:scale-105">
                        <MousePointerClick className="w-5 h-5 mr-2" />
                        Generate
                      </Button>
                    </div>
                  </div>

                  {/* Diverging Dashed Lines to Assets */}
                  <div className="flex justify-center mb-8">
                    <div className="relative w-full max-w-md h-12">
                      <svg className="w-full h-full" viewBox="0 0 400 48" preserveAspectRatio="xMidYMid meet">
                        {/* Static dashed lines */}
                        <path d="M 200 0 L 100 48" stroke="hsl(var(--primary) / 0.2)" strokeWidth="2" fill="none" strokeDasharray="8 6" />
                        <path d="M 200 0 L 200 48" stroke="hsl(var(--primary) / 0.2)" strokeWidth="2" fill="none" strokeDasharray="8 6" />
                        <path d="M 200 0 L 300 48" stroke="hsl(var(--primary) / 0.2)" strokeWidth="2" fill="none" strokeDasharray="8 6" />
                        
                        {/* Animated flowing dashed lines */}
                        <path d="M 200 0 L 100 48" stroke="hsl(var(--primary))" strokeWidth="2" fill="none" strokeDasharray="8 6" className="animate-dash-flow" />
                        <path d="M 200 0 L 200 48" stroke="hsl(var(--primary))" strokeWidth="2" fill="none" strokeDasharray="8 6" className="animate-dash-flow" style={{ animationDelay: '0.3s' }} />
                        <path d="M 200 0 L 300 48" stroke="hsl(var(--primary))" strokeWidth="2" fill="none" strokeDasharray="8 6" className="animate-dash-flow" style={{ animationDelay: '0.6s' }} />
                      </svg>
                    </div>
                  </div>

                  {/* Bottom Row: Generated Assets */}
                  <div>
                    <div className="flex justify-center gap-6">
                      <div className="group relative">
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-primary-glow rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-300" />
                        <div className="relative w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl border border-border/50 overflow-hidden shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl">
                          <img 
                            src={suitcaseMirror} 
                            alt="Generated lifestyle 1" 
                            className="w-full h-full object-cover" loading="lazy" decoding="async"
                          />
                        </div>
                      </div>
                      <div className="group relative">
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-primary-glow rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-300" />
                        <div className="relative w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl border border-border/50 overflow-hidden shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl">
                          <img 
                            src={suitcaseLobby} 
                            alt="Generated lifestyle 2" 
                            className="w-full h-full object-cover" loading="lazy" decoding="async"
                          />
                        </div>
                      </div>
                      <div className="group relative">
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-primary-glow rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-300" />
                        <div className="relative w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl border border-border/50 overflow-hidden shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl">
                          <img 
                            src={suitcaseHotelDesk} 
                            alt="Generated lifestyle 3" 
                            className="w-full h-full object-cover" loading="lazy" decoding="async"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Image to Video Section */}
      <section className="container mx-auto px-4 py-8 md:py-12 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 scroll-animate">
            <h2 className="text-3xl md:text-5xl font-bold text-header-dark mb-4">
              From Still Image to <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">6-Second Video</span> in One Click
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
              Transform any product image into dynamic video content for TikTok, Instagram Reels, and paid social campaigns. Available with Ambience Studio and Fashion Studio.
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-0 max-w-5xl mx-auto">
            {/* Left - Still Image */}
            <div className="relative group w-full md:w-[40%] flex-shrink-0">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-border/30 aspect-[3/4]">
                <img 
                  src={videoDemoStill} 
                  alt="Product still image" 
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
                  src={videoDemoOutput}
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
                {/* Play indicator */}
                <div className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <div className="w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[12px] border-l-white ml-1" />
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-10">
            <Link to="/auth?mode=signup">
              <Button size="lg" className="bg-offer text-offer-foreground hover:bg-offer-hover text-lg px-8 h-14">
                Start for €1 <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>


      {/* Ease of Use — brand comparison table (replaces old ComparisonSection) */}
      <BrandComparisonTable />

      <IndustriesHighlightSection />

      {/* Diversity Models Section */}
      <section className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Mobile-only: Title + description above grid */}
            <div className="lg:hidden text-center space-y-4">
              <p className="text-xs font-bold text-primary uppercase tracking-wider">Increase Diversity</p>
              <h2 className="text-3xl font-bold text-header-dark">
                More Models,<br /> <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Bigger Reach</span>
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                Feature various looks and styles without hiring dozens of models. Get access to an exclusive and diverse AI model portfolio.
              </p>
            </div>

            {/* Left - Scrolling 3-Column Model Grid */}
            <div className="h-[500px] md:h-[600px] overflow-hidden relative">
              {/* Gradient overlays */}
              <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />
              
              <div className="grid grid-cols-3 gap-2 h-full">
                {/* Column 1 - scrolls up */}
                {(() => {
                  const col1 = [
                    "/images/models/maya.webp",
                    "/images/models/malik.webp",
                    "/images/models/aiko.webp",
                    "/images/models/layla.webp",
                    "/images/models/lucas.webp",
                    "/images/models/kenji.webp",
                  ];
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
                {/* Column 2 - scrolls down */}
                {(() => {
                  const col2 = [
                    "/images/models/hanna.webp",
                    "/images/models/gabriela.webp",
                    "/images/models/camila.webp",
                    "/images/models/bas.webp",
                    "/images/models/adrian.webp",
                    "/images/models/isabella.webp",
                  ];
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
                {/* Column 3 - scrolls up */}
                {(() => {
                  const col3 = [
                    "/images/models/julian.webp",
                    "/images/models/marcus.webp",
                    "/images/models/mei.webp",
                    "/images/models/mia.webp",
                    "/images/models/omar.webp",
                  ];
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

            {/* Mobile-only: CTA below grid */}
            <div className="lg:hidden flex justify-center">
              <Link to="/custom-models" className="w-full sm:w-auto">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 h-14 w-full sm:w-auto">
                  Claim Your Premium Model <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>

            {/* Desktop-only: Text Content on right */}
            <div className="hidden lg:block space-y-6">
              <p className="text-xs font-bold text-primary uppercase tracking-wider">Increase Diversity</p>
              <h2 className="text-3xl md:text-5xl font-bold text-header-dark">
                More Models,<br /> <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Bigger Reach</span>
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Feature various looks and styles without hiring dozens of models. Get access to an exclusive and diverse AI model portfolio. Generate virtual fashion models with different ethnicities, body types, and styling so your creatives represent your entire customer base.
              </p>
              <Link to="/custom-models" className="flex justify-start">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 h-14 mt-2">
                  Claim Your Premium Model <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
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
              { id: "UbidAV2ZPY0", label: "Fashion Studio", icon: "👗", delay: "0s" },
              { id: "BNC-JuIkPBA", label: "Ad Creatives", icon: "📢", delay: "1.3s" },
              { id: "KNWqysiHYvg", label: "Video Content", icon: "🎬", delay: "2.6s" },
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

      <ROICalculator />

      <div id="pricing">
        <PricingSection />
      </div>

      

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* FAQ Section */}
      <section className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 px-4">
              <h2 className="text-3xl md:text-5xl font-bold text-header-dark mb-4">
                Frequently Asked <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Questions</span>
              </h2>
            <p className="text-lg sm:text-xl text-muted-foreground">
              Everything you need to know about Floowy.ai
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-3">
            {[
              { id: "1", q: "How does Floowy.ai work?", a: "Floowy.ai is an AI product image generator and content creation platform built for ecommerce brands. Upload your product photo, choose a studio tool (Fashion, Ambience, Flatlay, Ads, Listing, or Idea Studio), customize your settings, and generate professional product visuals in seconds. The AI handles everything from on-model photography and product backgrounds to ad creatives and video content. No design skills, no photoshoots, no production team needed." },
              { id: "2", q: "What kind of content can I create with Floowy.ai?", a: "Floowy covers your entire ecommerce visual production workflow. Generate AI product images for marketplace listings, on-model fashion photography, lifestyle product backgrounds, flat lay compositions, ad creatives for Meta, TikTok, and Google, product videos, lookbooks, and campaign visuals. Eight specialized studio tools handle different content types, all from a single platform." },
              { id: "3", q: "Can AI replace traditional product photography for ecommerce?", a: "For the majority of ecommerce use cases, yes. AI product photography tools like Floowy generate studio-quality visuals that perform as well or better than traditional photos in conversion and CTR tests. Brands using Floowy report 3x faster creative production and savings of €2K to €10K per month compared to traditional studio shoots. The AI is especially powerful for producing multiple image variations and testing what converts best." },
              { id: "4", q: "Do I need design skills to use Floowy.ai?", a: "No. Floowy is designed for ecommerce teams, marketers, and brand owners who need professional visuals without design expertise. Upload your product photo, select your preferred style and settings, and the AI generates the rest. The platform handles composition, lighting, backgrounds, and styling automatically." },
              { id: "5", q: "How long does it take to generate content?", a: "Most AI product images are generated in under 60 seconds. What used to take weeks of planning, shooting, and editing now happens in minutes. This speed lets you test more visual variations, launch campaigns faster, and respond to trends before your competitors." },
              { id: "6", q: "Can I use the generated content commercially?", a: "Yes. All content generated with Floowy is yours to use commercially. Use it on your webshop, product pages, marketplaces like Amazon and bol.com, paid ads on Meta, TikTok, and Google, social media, email campaigns, and any other marketing channel. Full commercial usage rights are included with every plan." },
              { id: "7", q: "What file formats do you support?", a: "Floowy exports in PNG and JPEG at HD quality for images, and MP4 for video content. You can select your preferred output size and aspect ratio to match the requirements of any platform, whether that's a square product image for your webshop, a vertical 9:16 for TikTok, or a landscape format for Google Ads." },
              { id: "8", q: "Is there a limit to how many images I can generate?", a: "Each plan includes a set number of monthly credits. Starter includes 100 credits (up to 50 images), Professional includes 250 credits (up to 125 images), and Enterprise includes 500 credits (up to 250 images). Need more? Custom plans are available for brands with higher volume requirements. Credits refresh monthly." },
              { id: "9", q: "Is Floowy.ai available for ecommerce brands in the Netherlands?", a: "Yes. Floowy is founded and based in the Netherlands and is used by hundreds of Dutch ecommerce brands. Whether you're selling on bol.com, running Meta Ads from Amsterdam, or managing a Shopify store from Rotterdam or Utrecht, Floowy's AI product image generator is built for the Dutch market. All pricing is in EUR, support is available in Dutch and English, and the platform generates visuals optimized for Dutch marketplaces and ad platforms." },
              { id: "10", q: "Can ecommerce brands in Belgium use Floowy.ai?", a: "Absolutely. Floowy serves a growing number of ecommerce brands in Belgium, from online retailers in Antwerp and Brussels to DTC brands in Ghent and Leuven. The platform works in Dutch, French, and English, making it perfect for Belgian brands targeting the Benelux market or selling across European marketplaces." },
              { id: "11", q: "Does Floowy work for German ecommerce brands?", a: "Yes. Floowy is used by ecommerce brands across Germany, from Berlin and Hamburg to Munich, Frankfurt, and Cologne. The platform supports EUR pricing and generates product images and ad creatives optimized for Zalando, About You, Amazon DE, and Google Shopping DE. Scale your visual content production for the DACH market without a local studio." },
              { id: "12", q: "Is Floowy suitable for UK ecommerce brands?", a: "Yes. Floowy works with ecommerce brands across the United Kingdom, including London, Manchester, Birmingham, and Edinburgh. Generate AI product images and ad creatives that meet the quality standards of Amazon UK, ASOS Marketplace, and UK-targeted campaigns on Meta, TikTok, and Google." },
              { id: "13", q: "Which European countries does Floowy support?", a: "Floowy supports ecommerce brands across all of Europe. The platform is actively used in the Netherlands, Belgium, Germany, the United Kingdom, France, Spain, Italy, Portugal, and the Nordics. With EUR and GBP pricing, multilingual support, and export options for all major European marketplaces and ad platforms, Floowy is the AI product image generator of choice for brands scaling across the EU." },
            ].map(({ id, q, a }) => (
              <AccordionItem key={id} value={`item-${id}`} className="border border-border/50 bg-card rounded-xl px-6 shadow-sm data-[state=open]:shadow-md data-[state=open]:border-primary/25 transition-all duration-300">
                <AccordionTrigger className="text-left text-base font-semibold hover:no-underline py-5">
                  {q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pb-5">
                  {a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-6">
              Still have questions? We&apos;re here to help!
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-primary/10 via-accent/20 to-primary-glow/10 rounded-3xl p-6 md:p-12 text-center border border-primary/20">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-header-dark">
            Ready to Scale Your Ecommerce Content?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join 1000+ ecommerce brands creating stunning visuals with AI
          </p>
           <Link to="/auth?mode=signup">
            <Button size="lg" className="bg-offer text-offer-foreground hover:bg-offer-hover shadow-glow text-lg px-8 h-14">
              Start for €1
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
      <CookieBanner />
    </div>
  );
};

export default Landing;
