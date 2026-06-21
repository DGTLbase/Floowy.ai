import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PlatformsSection from "@/components/PlatformsSection";
import { useScrollAnimationInit } from "@/hooks/useScrollAnimationInit";
import awardDutchSearch from "@/assets/award-dutch-search.png";
import awardGlobalSearch from "@/assets/award-global-search.png";
import awardEmerce from "@/assets/award-emerce.png";
import awardFonk from "@/assets/award-fonk.png";
import awardFdGazelle from "@/assets/award-fd-gazelle.png";
import dgtlbaseOffice from "@/assets/dgtlbase-office.jpg";
import cetaphilLogo from "@/assets/cetaphil-logo.png";
import nimaniLogo from "@/assets/nimani-logo.png";
import welhofLogo from "@/assets/welhof-logo.png";
import lothLogo from "@/assets/loth-logo.png";
import curlyGirlLogo from "@/assets/curly-girl-logo.png";
import rbLogo from "@/assets/rb-logo.png";
import PageMeta from "@/components/PageMeta";

import IndustriesHighlightSection from "@/components/IndustriesHighlightSection";
const OurStory = () => {
  useScrollAnimationInit();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <PageMeta 
        title="Learn our story and how we improve content creation with AI | Floowy"
        description="Discover how Floowy started and how we help brands create better marketing content. Learn why AI is becoming the core of modern content production."
        keywords="Floowy story, AI content production, marketing content AI, brand storytelling"
        canonicalUrl="https://floowy.ai/our-story"
        breadcrumbs={[
          { name: "Home", url: "https://floowy.ai" },
          { name: "Our Story", url: "https://floowy.ai/our-story" }
        ]}
      />
      <Navigation />

      {/* Hero Section with Green Gradient */}
      <section className="relative py-20 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-primary/5" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(152_80%_65%_/_0.15),transparent_50%)]" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-sm font-medium text-primary mb-6 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Founded by Marketers, Powered by AI
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-header-dark mb-6">
              Our <span className="text-primary">Story</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto">
              Creating high-quality marketing content should not be difficult.
            </p>
          </div>
        </div>
      </section>

      {/* Content Section with Modern Cards */}
      <section className="py-12 md:py-16 relative">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto -mt-8">
            {/* Story Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
              <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-3xl p-8 hover:shadow-glow transition-all hover:border-primary/30">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-header-dark">
                  The <span className="text-primary">Challenge</span>
                </h3>
                <p className="text-foreground/80 leading-relaxed">
                  Floowy.ai was founded after years of facing the same challenge: producing consistent, high-performing content for advertisements and social media demanded constant creative output, large budgets, and time.
                </p>
              </div>

              <div className="bg-gradient-to-br from-primary/10 to-primary/5 backdrop-blur-sm border border-primary/20 rounded-3xl p-8 hover:shadow-glow transition-all">
                <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center mb-6">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-header-dark">
                  The <span className="text-primary">Solution</span>
                </h3>
                <p className="text-foreground/80 leading-relaxed">
                  That's why we created Floowy.ai, a platform that makes content creation faster, smarter, and more accessible for every marketing team.
                </p>
              </div>
            </div>

            {/* Partnership Section */}
            <div className="bg-muted/30 rounded-3xl p-8 md:p-12 mb-16">
              <h3 className="text-3xl md:text-5xl font-bold mb-6 text-header-dark">
                Partnership with <span className="text-primary">Excellence</span>
              </h3>
              <p className="text-lg text-foreground/80 leading-relaxed mb-6">
                Floowy.ai was developed in partnership with <a href="https://dgtlbase.com/en/" target="_blank" rel="noopener noreferrer" className="text-primary font-semibold hover:underline">DGTLbase</a>, an Amsterdam-based digital marketing agency with more than 15 years of experience in online marketing.
              </p>
              <p className="text-lg text-foreground/80 leading-relaxed">
                Over the years, DGTLbase has received multiple industry awards, including the Dutch Search Awards, FONK150, Emerce 100, Global Search Awards, and FD Gazelle, recognizing their excellence in digital strategy and performance marketing.
              </p>
            </div>

            {/* Awards Section */}
            <div className="mb-16">
              <h2 className="text-3xl md:text-5xl font-semibold text-center mb-12 text-header-dark">
                Awards & <span className="text-primary">Recognition</span>
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-8 items-center justify-items-center">
                <div className="flex items-center justify-center p-4 bg-card/50 rounded-2xl border border-border/50 hover:border-primary/30 transition-all">
                  <img 
                    src={awardDutchSearch} 
                    alt="Dutch Search Awards" 
                    className="max-h-24 w-auto object-contain" loading="lazy" decoding="async"
                  />
                </div>
                <div className="flex items-center justify-center p-4 bg-card/50 rounded-2xl border border-border/50 hover:border-primary/30 transition-all">
                  <img 
                    src={awardGlobalSearch} 
                    alt="Global Search Awards" 
                    className="max-h-24 w-auto object-contain" loading="lazy" decoding="async"
                  />
                </div>
                <div className="flex items-center justify-center p-4 bg-card/50 rounded-2xl border border-border/50 hover:border-primary/30 transition-all">
                  <img 
                    src={awardEmerce} 
                    alt="Emerce 100" 
                    className="max-h-24 w-auto object-contain" loading="lazy" decoding="async"
                  />
                </div>
                <div className="flex items-center justify-center p-4 bg-card/50 rounded-2xl border border-border/50 hover:border-primary/30 transition-all">
                  <img 
                    src={awardFonk} 
                    alt="FONK150" 
                    className="max-h-24 w-auto object-contain" loading="lazy" decoding="async"
                  />
                </div>
                <div className="flex items-center justify-center p-4 bg-card/50 rounded-2xl border border-border/50 hover:border-primary/30 transition-all">
                  <img 
                    src={awardFdGazelle} 
                    alt="FD Gazelle" 
                    className="max-h-24 w-auto object-contain" loading="lazy" decoding="async"
                  />
                </div>
              </div>
            </div>

            {/* Benefits Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
              <div className="bg-gradient-to-br from-primary/5 to-transparent border border-primary/20 rounded-2xl p-6 hover:shadow-glow transition-all">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-foreground mb-2">Save Time</h4>
                <p className="text-sm text-muted-foreground">Produce high-quality content in a fraction of the time</p>
              </div>

              <div className="bg-gradient-to-br from-primary/5 to-transparent border border-primary/20 rounded-2xl p-6 hover:shadow-glow transition-all">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-foreground mb-2">Better Quality</h4>
                <p className="text-sm text-muted-foreground">Improve content quality with AI-driven insights</p>
              </div>

              <div className="bg-gradient-to-br from-primary/5 to-transparent border border-primary/20 rounded-2xl p-6 hover:shadow-glow transition-all">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-foreground mb-2">Reduce Costs</h4>
                <p className="text-sm text-muted-foreground">Significantly lower production costs with AI</p>
              </div>
            </div>

            {/* Services Section */}
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-3xl p-8 md:p-12 mb-16">
              <h3 className="text-3xl md:text-5xl font-bold mb-6 text-header-dark">
                Beyond the <span className="text-primary">Platform</span>
              </h3>
              <p className="text-lg text-foreground/80 leading-relaxed mb-6">
                In addition to our platform, we also offer consultancy services to help businesses make the most of their marketing content. Our team advises on how to strategically use the materials created with Floowy.ai to achieve stronger results across different channels.
              </p>
              <p className="text-lg text-primary font-semibold">
                Our mission is to empower marketers to focus on creativity and strategy while Floowy.ai takes care of the rest.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Trusted Brands Section */}
      <section className="py-12 md:py-16 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-12 text-header-dark">
              Trusted by 100+ brands with <span className="text-primary">€10m+</span> in revenue
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-6 lg:gap-8">
              <img src={cetaphilLogo} alt="Cetaphil" className="h-6 sm:h-8 md:h-10 lg:h-12 w-auto opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition-all flex-shrink-0" loading="lazy" decoding="async" />
              <div className="h-6 sm:h-8 w-px bg-border/50"></div>
              <img src={nimaniLogo} alt="Nimani Real Estate" className="h-6 sm:h-8 md:h-10 lg:h-12 w-auto opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition-all flex-shrink-0" loading="lazy" decoding="async" />
              <div className="h-6 sm:h-8 w-px bg-border/50"></div>
              <img src={welhofLogo} alt="Welhof" className="h-6 sm:h-8 md:h-10 lg:h-12 w-auto opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition-all flex-shrink-0" loading="lazy" decoding="async" />
              <div className="h-6 sm:h-8 w-px bg-border/50"></div>
              <img src={lothLogo} alt="Loth" className="h-6 sm:h-8 md:h-10 lg:h-12 w-auto opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition-all flex-shrink-0" loading="lazy" decoding="async" />
              <div className="h-6 sm:h-8 w-px bg-border/50"></div>
              <img src={curlyGirlLogo} alt="Curly Girl Movement" className="h-6 sm:h-8 md:h-10 lg:h-12 w-auto opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition-all flex-shrink-0" loading="lazy" decoding="async" />
              <div className="h-6 sm:h-8 w-px bg-border/50"></div>
              <img src={rbLogo} alt="RB" className="h-6 sm:h-8 md:h-10 lg:h-12 w-auto opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition-all flex-shrink-0" loading="lazy" decoding="async" />
            </div>
          </div>
        </div>
      </section>

      <PlatformsSection />

      <IndustriesHighlightSection />

      {/* CTA Section */}
      <section className="py-12 md:py-16 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,hsl(152_90%_75%_/_0.2),transparent_50%)]" />
        <div className="container mx-auto px-4 text-center relative">
          <h2 className="text-3xl md:text-5xl font-bold text-primary-foreground mb-6">
            Make your content in seconds.
          </h2>
          <p className="text-xl text-primary-foreground/95 mb-8 max-w-2xl mx-auto">
            Watch how fast AI makes content people can't scroll past.
          </p>
          <Button 
            size="lg" 
            onClick={() => navigate('/auth')}
            className="w-full sm:w-auto text-lg px-8 py-6 bg-background text-primary hover:bg-background/95 rounded-full font-semibold shadow-glow"
          >
            Create Your First Ad
          </Button>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default OurStory;
