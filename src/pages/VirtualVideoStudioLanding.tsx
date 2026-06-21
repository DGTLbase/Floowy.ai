import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Film, Sparkles, ArrowRight, Upload, Music, Maximize2, Download, Check, X, ChevronRight, ChevronDown, BookOpen, Image, Type, Wand2, ImageIcon, Mail, Monitor, Gem, TrendingUp, Coffee, Zap, CloudMoon, Play, Pause, SkipBack, SkipForward } from "lucide-react";
import musicCinematic from "@/assets/music-cover-cinematic.jpg";
import musicBright from "@/assets/music-cover-bright.jpg";
import musicElegant from "@/assets/music-cover-elegant.jpg";
import musicModern from "@/assets/music-cover-modern.jpg";
import musicRelaxed from "@/assets/music-cover-relaxed.jpg";
import musicDramatic from "@/assets/music-cover-dramatic.jpg";
import musicAmbient from "@/assets/music-cover-ambient.jpg";
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
import { useScrollAnimationInit } from "@/hooks/useScrollAnimationInit";
import PricingSection from "@/components/PricingSection";
import ROICalculator from "@/components/ROICalculator";
import MetaTags from "@/components/MetaTags";
import StructuredData from "@/components/StructuredData";
import ComparisonSection from "@/components/ComparisonSection";
import kbVvsOutputVideo from "@/assets/virtual-video-studio-hero.mp4";
import virtualVideoCaseStudy from "@/assets/virtual-video-case-study.mp4";
import shopifyLogo from "@/assets/logo-shopify.svg";
import iconAmsterdamLogo from "@/assets/logo-icon-amsterdam.png";
import nimaniLogo from "@/assets/logo-nimani.png";
import welhofLogo from "@/assets/logo-welhof.png";
import lothLogo from "@/assets/logo-loth-fabenim.png";
import curlyGirlLogo from "@/assets/logo-curlygirl.png";
import cetaphilLogo from "@/assets/logo-cetaphil.png";
import marcelsLogo from "@/assets/logo-marcels.png";

import IndustriesHighlightSection from "@/components/IndustriesHighlightSection";
const AutoplayDemoVideo = ({ videoId, title }: { videoId: string; title: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.disconnect(); } },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="max-w-4xl mx-auto mb-16 scroll-animate">
      <div className="rounded-2xl overflow-hidden shadow-2xl border border-border/30 bg-card">
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          {isVisible && (
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?rel=0&autoplay=1&mute=1`}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          )}
        </div>
      </div>
    </div>
  );
};

const musicStyles = [
  { icon: Film, title: "Cinematic", desc: "Dramatic, sweeping visuals with epic, orchestral energy.", image: musicCinematic },
  { icon: Sparkles, title: "Bright & Upbeat", desc: "Energetic, positive feel perfect for product launches.", image: musicBright },
  { icon: Gem, title: "Elegant & Luxurious", desc: "Refined, premium tone ideal for high-end brands.", image: musicElegant },
  { icon: TrendingUp, title: "Modern & Trendy", desc: "Contemporary, stylish energy for fashion content.", image: musicModern },
  { icon: Coffee, title: "Relaxed & Chill", desc: "Calm, easygoing atmosphere for wellness brands.", image: musicRelaxed },
  { icon: Zap, title: "Dramatic & Bold", desc: "Powerful, attention-grabbing energy for campaigns.", image: musicDramatic },
  { icon: CloudMoon, title: "Ambient & Ethereal", desc: "Dreamy, immersive soundscapes for atmospheric content.", image: musicAmbient },
];

const MusicStylesCarousel = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const animRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const total = musicStyles.length;

  // Continuous spin (only when playing)
  useEffect(() => {
    if (!isPlaying) {
      lastTimeRef.current = 0;
      return;
    }
    const speed = 45;
    const animate = (time: number) => {
      if (lastTimeRef.current) {
        const delta = (time - lastTimeRef.current) / 1000;
        setRotation(prev => prev + speed * delta);
      }
      lastTimeRef.current = time;
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => { cancelAnimationFrame(animRef.current); lastTimeRef.current = 0; };
  }, [isPlaying]);

  // Auto-cycle (only when playing)
  useEffect(() => {
    if (!isPlaying) return;
    intervalRef.current = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % total);
    }, 3000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [total, isPlaying]);

  const handlePrev = () => setActiveIndex(prev => (prev - 1 + total) % total);
  const handleNext = () => setActiveIndex(prev => (prev + 1) % total);

  const activeStyle = musicStyles[activeIndex];

  return (
    <section className="py-8 md:py-12 bg-muted/30 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 scroll-animate">
            <span className="inline-block text-xs font-mono tracking-[0.3em] uppercase text-primary mb-4">7 Music Styles</span>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              <span className="text-header-dark">Set the Perfect Mood for</span> <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Every Video</span>
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto">
              Choose from seven professional music styles that set the tone for your showcase video.
            </p>
          </div>

          <div className="relative flex flex-col md:flex-row items-center justify-center gap-10 md:gap-20">
            {/* Spinning disc with crossfading cover images */}
            <div className="relative w-[140px] h-[140px] md:w-[180px] md:h-[180px]">
              {/* Glow behind disc */}
              <div className="absolute inset-0 rounded-full bg-primary/15 blur-2xl scale-110" />

              {/* The disc */}
              <div
                className="absolute inset-0 rounded-full overflow-hidden shadow-2xl will-change-transform"
                style={{ transform: `rotate(${rotation}deg)` }}
              >
                {/* All cover images stacked, crossfade via opacity */}
                {musicStyles.map((style, i) => (
                  <img
                    key={i}
                    src={style.image}
                    alt={style.title}
                    className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out"
                    style={{ opacity: i === activeIndex ? 1 : 0 }} loading="lazy" decoding="async"
                  />
                ))}
                {/* Vinyl groove overlay */}
                <div className="absolute inset-0 rounded-full" style={{
                  background: `repeating-radial-gradient(circle at center, transparent 0px, transparent 14px, rgba(0,0,0,0.06) 14px, rgba(0,0,0,0.06) 15px)`
                }} />
                {/* Center hole */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-background border-2 border-border/30 flex items-center justify-center shadow-inner">
                    <div className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-primary" />
                  </div>
                </div>
              </div>
            </div>

            {/* Player panel */}
            <div className="text-center md:text-left max-w-sm min-h-[220px]">
              <div key={activeIndex} className="animate-fade-in">
                <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                  {(() => { const Icon = activeStyle.icon; return <Icon className="w-5 h-5 text-primary" />; })()}
                  <span className="text-xs font-mono tracking-widest uppercase text-primary">Now Playing</span>
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-header-dark mb-1">
                  {activeStyle.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                  {activeStyle.desc}
                </p>
              </div>

              {/* Progress bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground/60 font-mono mb-1">
                  <span>{activeIndex + 1} / {total}</span>
                  <span>{activeStyle.title}</span>
                </div>
                <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${((activeIndex + 1) / total) * 100}%` }}
                  />
                </div>
              </div>

              {/* Player controls */}
              <div className="flex items-center justify-center md:justify-start gap-3">
                <button
                  onClick={handlePrev}
                  className="w-10 h-10 rounded-full border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all"
                >
                  <SkipBack className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsPlaying(prev => !prev)}
                  className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-glow hover:bg-primary/90 transition-all"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>
                <button
                  onClick={handleNext}
                  className="w-10 h-10 rounded-full border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>


          <div className="text-center scroll-animate mt-8">
            <Link to="/knowledge-base/virtual-video-studio">
              <Button size="lg" className="bg-primary text-white hover:bg-primary/90 shadow-glow gap-2 text-base px-8 py-6 rounded-xl">
                Learn more
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

const VirtualVideoStudioLanding = () => {
  useScrollAnimationInit();

  return (
    <div className="min-h-screen bg-background">
      <MetaTags
        title="AI Video From Images for Ecommerce & Property | Floowy AI"
        description="Turn photos into cinematic showcase videos with AI. Upload images, add music, and get a fully rendered video in minutes. Try Floowy AI."
        keywords="ai video generator from images, ai vertical video generator, ai marketing video generator, ai listing video generator, ai product video generator, ai social media video generator, ai video creator from photos, ai automated video generator, ai promotional video generator, ai content video generator, ai real estate video generator, ai property video generator, ai video maker from images, ai slideshow video generator, ai ecommerce product video generator, ai video generator for ads, ai reel generator, ai short form video generator, ai video automation tool, generate video from images ai, ai video creator for marketing, ai brand video generator, ai product showcase video, ai social media reel generator, ai video creator without editing, automated marketing video ai, ai video generator for listings"
        canonicalUrl="https://floowy.ai/virtual-video-studio"
      />
      <StructuredData type="organization" />
      <StructuredData
        type="breadcrumb"
        breadcrumbs={[
          { name: "Home", url: "https://floowy.ai" },
          { name: "Virtual Video Studio", url: "https://floowy.ai/virtual-video-studio" },
        ]}
      />
      <Navigation />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#e0f2e9]">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-start gap-8 lg:gap-12 pt-8 md:pt-12 pb-12 md:pb-20">
            <div className="flex w-full min-w-0 flex-1 flex-col items-center space-y-6 pt-4 text-center lg:items-start lg:pt-8 lg:text-left">
            
            <h1 className="max-w-full text-[2.15rem] font-bold tracking-tight leading-[1.05] text-header-dark sm:text-4xl md:text-5xl lg:text-[3.25rem] xl:text-6xl">
              Turn Your Photos Into Cinematic Showcase Videos <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">With AI</span>
            </h1>
            
            <p className="max-w-xl px-1 text-base text-muted-foreground sm:text-lg md:text-xl">
              Upload your images and let AI transform each photo into a 4-second cinematic clip with smooth motion, transitions, and music. Every clip gets stitched together into one fully rendered showcase video, ready to publish. No filming, no editing, no video skills needed.
            </p>

            {/* Video - mobile only */}
            <div className="lg:hidden relative flex w-full max-w-full flex-col items-center overflow-hidden">
              <div className="w-full max-w-[22rem] rounded-2xl overflow-hidden shadow-2xl">
                <video
                  src={kbVvsOutputVideo}
                  className="w-full aspect-video object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              </div>
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
            {/* Video - desktop only */}
            <div className="flex-1 hidden lg:flex flex-col items-end relative mt-20">
              <div className="w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl ring-2 ring-primary/20">
                <video
                  src={kbVvsOutputVideo}
                  className="w-full aspect-video object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              </div>
              {/* Trust metrics - below video */}
              <div className="grid grid-cols-3 gap-6 w-full max-w-2xl mt-6">
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
                Sell Projects Before They're <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Built</span>
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto">
                Blueprints and floor plans don't sell. Buyers want to see and feel a property before it exists. Virtual Video Studio turns your renders and visualizations into cinematic walkthrough videos that bring off-plan projects to life.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center scroll-animate">
              {/* Left: Video UI */}
              <div className="rounded-2xl overflow-hidden shadow-2xl border border-border/30 bg-card p-3 sm:p-4 max-w-md lg:max-w-lg mx-auto">
                <video
                  src={virtualVideoCaseStudy}
                  className="block w-full h-auto rounded-xl"
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              </div>

              {/* Right: Case stats */}
              <div className="space-y-5 text-center lg:text-left">
                <h3 className="text-2xl md:text-3xl font-bold text-header-dark">
                  From render to reality. Before a single brick is laid.
                </h3>

                <p className="text-muted-foreground leading-relaxed text-base md:text-lg">
                  Developers struggle to sell off-plan because static renders don't create an emotional connection. Upload your project visualizations and let AI generate a cinematic showcase video with smooth camera movement and music that makes buyers feel like they're already walking through the finished property. Stand out from competitors who still rely on flat images and PDF brochures.
                </p>

                <div className="bg-muted/50 rounded-xl p-5">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <p className="text-4xl md:text-5xl font-extrabold leading-none bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">+12%</p>
                      <p className="text-xs md:text-sm font-semibold text-primary uppercase tracking-wide mt-1">higher conversion rate</p>
                    </div>
                    <p className="text-sm md:text-base text-muted-foreground">By replacing static renders with cinematic AI-generated property videos, Nimani converted more off-plan inquiries into signed reservations and reduced the average time from first viewing to commitment.</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <img src={nimaniLogo} alt="Nimani" className="h-10 md:h-12 w-auto dark:invert-0" style={{ filter: 'brightness(0)' }} loading="lazy" decoding="async" />
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
      <section className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 scroll-animate">
            <span className="inline-block text-xs font-mono tracking-[0.3em] uppercase text-primary mb-4">Process</span>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              <span className="text-header-dark">How It</span> <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Works</span>
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              From photos to finished video in minutes
            </p>
          </div>

          {/* Demo Video - autoplay on viewport entry */}
          <AutoplayDemoVideo videoId="yKTGJFvmHmQ" title="Virtual Video Studio Demo" />

          {/* 5-Step Process */}
          <div className="relative max-w-5xl mx-auto">
            {/* Desktop connecting line */}
            <div className="hidden md:block absolute top-[60px] left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 z-0" />

            <div className="grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-4">
              {[
                { icon: Upload, step: "1", title: "Upload Your Images", desc: "Drop your photos into the studio. Upload at least 2 images. Each image becomes a 4-second cinematic clip. Drag to reorder. Supports JPG, PNG, and WebP up to 50MB each." },
                { icon: Type, step: "2", title: "Add Project Details", desc: "Enter your project name, address, price, or any relevant details. Optionally upload your logo to brand the video." },
                { icon: Music, step: "3", title: "Choose Music Style", desc: "Select the mood for your video: Cinematic, Bright & Upbeat, Elegant & Luxurious, Modern & Trendy, Relaxed & Chill, or Dramatic & Bold. The AI matches the music to your visual content." },
                { icon: Monitor, step: "4", title: "Set Aspect Ratio", desc: "Choose 16:9 Landscape for websites and YouTube, or 9:16 Portrait for TikTok, Instagram Reels, and Stories." },
                { icon: Wand2, step: "5", title: "Generate", desc: "Hit generate and the AI creates cinematic clips from each image, adds smooth transitions and motion, layers your chosen music, and renders everything into one complete video. Costs 5 credits per video." },
              ].map((item, i) => (
                <div key={i} className="relative group scroll-scale flex flex-col items-center text-center">
                  {/* Mobile connector */}
                  {i < 4 && (
                    <div className="md:hidden flex flex-col items-center -mb-4">
                      <div className="w-0.5 h-6 bg-gradient-to-b from-primary/30 to-primary/10" />
                      <ChevronDown className="w-4 h-4 text-primary/30 -mt-1" />
                    </div>
                  )}
                  {/* Circle node */}
                  <div className="w-[100px] h-[100px] md:w-[120px] md:h-[120px] rounded-full bg-gradient-to-br from-card to-muted flex items-center justify-center shadow-lg border border-border/30 relative z-10 group-hover:scale-110 group-hover:shadow-xl transition-all duration-500 mb-4">
                    <item.icon className="w-7 h-7 md:w-8 md:h-8 text-primary" />
                    <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shadow-md">
                      {item.step}
                    </div>
                  </div>
                  <h3 className="text-base font-semibold mb-2 text-foreground">{item.title}</h3>
                </div>
              ))}
            </div>
          </div>

          {/* Knowledge Base Callout */}
          <div className="max-w-lg mx-auto mt-16 bg-gradient-to-br from-primary/5 via-accent/5 to-background rounded-2xl p-8 border border-border/50 scroll-animate">
            <BookOpen className="w-8 h-8 text-primary mx-auto mb-3" />
            <p className="text-foreground font-medium mb-2 text-center">
              Need More Clarity?
            </p>
            <p className="text-sm text-muted-foreground mb-5 text-center">
              Check our detailed knowledge base guide for step-by-step instructions
            </p>
            <div className="text-center">
              <Link to="/knowledge-base/virtual-video-studio">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow gap-2">
                  View Virtual Video Studio Guide
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Every Mood, One Tool */}
      <MusicStylesCarousel />


      {/* Our Main Features */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14 scroll-animate">
              <span className="inline-block text-xs font-mono tracking-[0.3em] uppercase text-primary mb-4">Our Main Features</span>
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                <span className="text-header-dark">Everything You Need to Create</span> <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Showcase Videos</span>
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto">
                Turn any collection of photos into a polished, music-backed showcase video. No video editing software, no production team, no filming required.
              </p>
            </div>

            <div className="space-y-6">
              {[
                {
                  icon: Film,
                  title: "Photos to Cinematic Clips",
                  desc: "Each uploaded image gets transformed into a 4-second clip with AI-generated camera movement, smooth transitions, and professional motion. The AI understands the content of your image and applies the right cinematic style automatically.",
                },
                {
                  icon: Wand2,
                  title: "Auto-Rendered Complete Video",
                  desc: "All clips get stitched together into one seamless video with your chosen music, consistent transitions, and proper pacing. The result is a fully rendered, ready-to-publish showcase video from start to finish.",
                },
                {
                  icon: ImageIcon,
                  title: "Brand It Your Way",
                  desc: "Add your logo, project details, and choose from 7 music styles to match your brand. Export in 16:9 landscape for websites and YouTube or 9:16 portrait for TikTok and Reels. Full HD resolution (1920×1080) output.",
                },
              ].map((feature, i) => (
                <Card key={i} className="border-border/50 hover:shadow-glow transition-all scroll-animate">
                  <CardContent className="p-6 md:p-8">
                    <div className="flex items-start gap-6">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-lg flex-shrink-0">
                        <feature.icon className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                          {feature.title}
                        </h3>
                        <p className="text-base text-muted-foreground leading-relaxed">
                          {feature.desc}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ROI Calculator */}
      <IndustriesHighlightSection />
      <ROICalculator />

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
          "Photos to finished video in minutes",
          "6 professional music styles included",
          "No filming or editing skills needed",
          "Logo and branding built in",
          "Landscape and portrait formats",
          "5 credits per complete video",
          "Consistent quality every time",
          "Reorder and customize clips",
          "Full HD output ready to publish",
        ]}
        othersItems={[
          "€500–€5K per professional video shoot",
          "Days or weeks of production and editing",
          "Separate costs for music licensing",
          "Manual editing in complex software",
          "Inconsistent results across projects",
          "Reformatting for each platform",
          "Revision rounds with editors",
          "Coordination with videographers",
          "No control over turnaround time",
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
              Everything you need to know about Virtual Video Studio
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-4">
            <AccordionItem value="item-1" className="border-border/50 bg-card/50 backdrop-blur-sm rounded-xl px-6 border data-[state=open]:shadow-md data-[state=open]:border-primary/25">
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                What is the Virtual Video Studio?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                The Virtual Video Studio is an AI video generator that transforms uploaded images into professional marketing videos automatically. The tool converts visuals into cinematic clips and combines them into a complete video ready for social media, advertising or listing environments.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="border-border/50 bg-card/50 backdrop-blur-sm rounded-xl px-6 border data-[state=open]:shadow-md data-[state=open]:border-primary/25">
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                How does the Virtual Video Studio create videos from images?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Each uploaded image is automatically converted into a short cinematic clip. The AI then merges all clips into one seamless video with transitions, pacing and motion applied automatically, creating a professional video without manual editing.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="border-border/50 bg-card/50 backdrop-blur-sm rounded-xl px-6 border data-[state=open]:shadow-md data-[state=open]:border-primary/25">
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                Can I control the order of scenes in my video?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes. You can drag and reorder uploaded images to decide which visuals appear first and how the final video flows. This allows creative control while using automated AI video generation.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="border-border/50 bg-card/50 backdrop-blur-sm rounded-xl px-6 border data-[state=open]:shadow-md data-[state=open]:border-primary/25">
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                Can I create vertical videos for social media platforms?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes. The Virtual Video Studio supports both portrait and landscape formats. This makes it ideal for AI vertical videos used on Instagram Reels, TikTok, YouTube Shorts, ecommerce campaigns and digital advertisements.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="border-border/50 bg-card/50 backdrop-blur-sm rounded-xl px-6 border data-[state=open]:shadow-md data-[state=open]:border-primary/25">
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                Can I add branding and text overlays to my video?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes. You can add structured headers such as a project name, title or pricing information. A logo upload option is also available, allowing you to create branded marketing videos automatically.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6" className="border-border/50 bg-card/50 backdrop-blur-sm rounded-xl px-6 border data-[state=open]:shadow-md data-[state=open]:border-primary/25">
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                Does the Virtual Video Studio include music?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes. After selecting a music style, the platform generates a unique AI-based soundtrack that is automatically synchronized with your video, creating a complete promotional video experience.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7" className="border-border/50 bg-card/50 backdrop-blur-sm rounded-xl px-6 border data-[state=open]:shadow-md data-[state=open]:border-primary/25">
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                What can I use the generated videos for?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Videos created with the Virtual Video Studio can be used for ecommerce product promotion, social media content, advertising campaigns, listings, brand marketing and digital presentations.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-8" className="border-border/50 bg-card/50 backdrop-blur-sm rounded-xl px-6 border data-[state=open]:shadow-md data-[state=open]:border-primary/25">
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                How many credits does each video cost?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Each complete video generation costs 5 credits, regardless of how many images you upload. This includes clip generation, music creation, and final rendering into one polished video.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-9" className="border-border/50 bg-card/50 backdrop-blur-sm rounded-xl px-6 border data-[state=open]:shadow-md data-[state=open]:border-primary/25">
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                What image formats are supported?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                The Virtual Video Studio supports JPG, PNG, and WebP image uploads up to 50MB each. For best results, match your image orientation to the chosen aspect ratio — horizontal images for landscape videos and vertical images for portrait videos.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-10" className="border-border/50 bg-card/50 backdrop-blur-sm rounded-xl px-6 border data-[state=open]:shadow-md data-[state=open]:border-primary/25">
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                What video resolution is the output?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                All videos are rendered at Full HD resolution (1920×1080 for landscape, 1080×1920 for portrait) at 25 FPS. The output is a downloadable video file ready for instant publishing across all platforms.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-11" className="border-border/50 bg-card/50 backdrop-blur-sm rounded-xl px-6 border data-[state=open]:shadow-md data-[state=open]:border-primary/25">
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                Do I own the commercial rights to generated videos?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes. All videos generated through Floowy are yours to use commercially. You have full rights to publish, distribute, and use the content in advertising, marketing, and any other commercial purpose without restrictions.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-12" className="border-border/50 bg-card/50 backdrop-blur-sm rounded-xl px-6 border data-[state=open]:shadow-md data-[state=open]:border-primary/25">
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                Can I use Floowy for property marketing in the Netherlands?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes. Floowy is actively used by Dutch real estate agencies, property developers, and marketing teams in Amsterdam, Rotterdam, The Hague, Utrecht, and across the Netherlands. Virtual Video Studio generates showcase videos that meet the quality standards of Dutch property portals like Funda and social media campaigns.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-13" className="border-border/50 bg-card/50 backdrop-blur-sm rounded-xl px-6 border data-[state=open]:shadow-md data-[state=open]:border-primary/25">
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                Is Floowy available for brands in the United Kingdom?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes. Floowy is used by brands, agencies, and property teams across the UK, including London, Manchester, Birmingham, and Edinburgh. Virtual Video Studio generates showcase videos that meet the quality expectations of UK property portals like Rightmove and Zoopla, as well as ecommerce and social media campaigns targeting UK audiences.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-14" className="border-border/50 bg-card/50 backdrop-blur-sm rounded-xl px-6 border data-[state=open]:shadow-md data-[state=open]:border-primary/25">
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                Which European countries does Floowy support?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Floowy supports brands across all of Europe. The platform is actively used in the Netherlands, Belgium, Germany, the United Kingdom, France, Spain, Italy, and the Nordics. With EUR and GBP pricing, multilingual support, and video export optimized for all major European platforms, Floowy is the AI showcase video tool of choice for brands scaling their video content across the EU.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-primary/10 via-accent/20 to-primary-glow/10 rounded-3xl p-6 md:p-12 text-center border border-primary/20">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            <span className="text-header-dark">Ready to Turn Your Photos Into</span> <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Professional Videos?</span>
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join brands creating cinematic showcase videos with AI
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

export default VirtualVideoStudioLanding;
