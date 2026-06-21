import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PlatformsSection from "@/components/PlatformsSection";
import { useScrollAnimationInit } from "@/hooks/useScrollAnimationInit";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import welhofCover from "@/assets/welhof-cover.png";
import reloadbaseCover from "@/assets/reloadbase-cover.png";
import PageMeta from "@/components/PageMeta";
import { useEffect, useRef, useState } from "react";
import { useKnowledgeBaseBonus } from "@/hooks/useKnowledgeBaseBonus";
import { supabase } from "@/integrations/supabase/client";
import { getYouTubeThumbnail } from "@/components/KBVideoHero";
import adsStudioPreview from "@/assets/ads-studio-preview.png";
import ambienceCover from "@/assets/ambience-studio-cover-new-3.png";
import creatorCover from "@/assets/creator-feature-video-new.mp4";
import fashionCover from "@/assets/fashion-cover-new-5.png";
import flatlayStudioCover from "@/assets/flatlay-studio-cover.png";
import ideaStudioCover from "@/assets/idea-studio-cover-new.png";
import listingStudioPreview from "@/assets/listing-studio-preview.png";
import fashionProCover from "@/assets/fashion-pro-cover.png";
import promptGuideResult from "@/assets/prompt-guide-result.jpg";

const KnowledgeBase = () => {
  useScrollAnimationInit();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { hasClaimed, claimBonus, isLoading } = useKnowledgeBaseBonus();
  const [user, setUser] = useState<any>(null);
  const bonusClaimAttempted = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [kbVideos, setKbVideos] = useState<Record<string, string>>({});
  
  // Check if user is logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    checkUser();
  }, []);

  // Fetch KB videos for card previews
  useEffect(() => {
    supabase
      .from("knowledge_base_videos")
      .select("tool_name, video_url")
      .then(({ data }) => {
        if (data) {
          const map: Record<string, string> = {};
          data.forEach((v: any) => { map[v.tool_name] = v.video_url; });
          setKbVideos(map);
        }
      });
  }, []);

  // Award bonus credits after 5 seconds on page (minimum time spent)
  useEffect(() => {
    // Only proceed if user is logged in, hasn't claimed, and we haven't already tried
    if (!user || hasClaimed !== false || bonusClaimAttempted.current || isLoading) {
      return;
    }

    // Check if coming from the prompt modal (has bonus param)
    const fromPrompt = searchParams.get("bonus") === "1";
    
    // Set timer for credit reward (5 seconds minimum)
    timerRef.current = setTimeout(async () => {
      if (!bonusClaimAttempted.current) {
        bonusClaimAttempted.current = true;
        await claimBonus();
      }
    }, fromPrompt ? 3000 : 5000); // Shorter wait if from prompt modal

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [user, hasClaimed, claimBonus, isLoading, searchParams]);

  const knowledgeSections = [
    {
      title: "Ads Studio",
      category: "ADVERTISING",
      description: "Generate high-converting ad creatives with text overlays and CTAs.",
      cover: adsStudioPreview,
      coverType: "image" as const,
      link: "/knowledge-base/ads-studio"
    },
    {
      title: "Ambience Studio",
      category: "PRODUCT PHOTOGRAPHY",
      description: "Create atmosphere-driven visuals that bring your brand to life.",
      cover: ambienceCover,
      coverType: "image" as const,
      link: "/knowledge-base/ambience-studio"
    },
    {
      title: "Creator Studio",
      category: "UGC VIDEO",
      description: "Design and generate high-quality marketing assets in seconds.",
      cover: creatorCover,
      coverType: "video" as const,
      link: "/knowledge-base/creator-studio"
    },
    {
      title: "Fashion Studio",
      category: "E-COMMERCE",
      description: "Produce studio-quality fashion photography without an actual studio.",
      cover: fashionCover,
      coverType: "image" as const,
      link: "/knowledge-base/fashion-studio"
    },
    {
      title: "Flat Lay Studio",
      category: "SOCIAL MEDIA",
      description: "Create brand-consistent flat lay visuals at scale.",
      cover: flatlayStudioCover,
      coverType: "image" as const,
      link: "/knowledge-base/flatlay-studio"
    },
    {
      title: "Idea Studio",
      category: "AI IDEATION",
      description: "Recreate inspiring scenes with your own products and models.",
      cover: ideaStudioCover,
      coverType: "image" as const,
      link: "/knowledge-base/idea-studio"
    },
    {
      title: "Listing Studio",
      category: "MARKETPLACES",
      description: "Create AI product listing images for Amazon, Bol.com and marketplaces.",
      cover: listingStudioPreview,
      coverType: "image" as const,
      link: "/knowledge-base/listing-studio"
    },
    {
      title: "Virtual Video Studio",
      category: "VIDEO",
      description: "Create cinematic property videos with AI-generated clips and music.",
      cover: listingStudioPreview,
      coverType: "image" as const,
      link: "/knowledge-base/virtual-video-studio"
    },
    {
      title: "Fashion Studio Pro",
      category: "FASHION",
      description: "Create complete AI-powered fashion shoots at scale.",
      cover: fashionProCover,
      coverType: "image" as const,
      link: "/knowledge-base/fashion-studio-pro"
    },
    {
      title: "Prompt Guide",
      category: "PROMPT ENGINEERING",
      description: "Write structured, high-converting AI prompts for better image results.",
      cover: promptGuideResult,
      coverType: "image" as const,
      link: "/knowledge-base/prompt-guide"
    }
  ];

  const caseStudies = [
    {
      id: "welhof",
      title: "Welhof",
      description: "Boosting conversion rates with AI generated Atmosphere Photos",
      coverImage: welhofCover,
      stats: ["+22% Conversion Rate", "+22% Orders", "+40% ROAS"],
      path: "/cases/welhof"
    },
    {
      id: "reloadbase",
      title: "ReloadBase",
      description: "Boosting engagement with AI-powered UGC videos",
      coverImage: reloadbaseCover,
      stats: ["+14% Conversion rate", "+14% Orders", "+38% ROAS"],
      path: "/cases/reloadbase"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <PageMeta 
        title="Floowy AI knowledge base for clear creation tutorials | Floowy"
        description="Use the Floowy AI knowledge base to learn how to create marketing visuals and concepts. Clear guides that help you get the best results with AI."
        keywords="Floowy knowledge base, AI tutorials, marketing content guides, AI creation guides"
        canonicalUrl="https://floowy.ai/knowledge-base"
        breadcrumbs={[
          { name: "Home", url: "https://floowy.ai" },
          { name: "Knowledge Base", url: "https://floowy.ai/knowledge-base" }
        ]}
      />
      <Navigation />

      {/* Hero Section */}
      <section className="pt-20 md:pt-24 pb-6 md:pb-8 bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center scroll-animate">
            <h1 className="text-4xl md:text-6xl font-bold text-header-dark mb-6">
              Learn How To Get The Most Out Of <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                Floowy.ai
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              Welcome to the Floowy.ai Knowledge Center. Here you will find clear guides that help you understand how to use our tools in the best possible way.
            </p>
          </div>
        </div>
      </section>

      {/* Knowledge Sections - Home page card style */}
      <section className="py-6 md:py-10 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {knowledgeSections.map((section, index) => {
                const kbVideoUrl = kbVideos[section.title];
                const ytThumb = kbVideoUrl ? getYouTubeThumbnail(kbVideoUrl) : null;
                
                return (
                  <Link key={index} to={section.link} className="block">
                    <Card 
                      className="cursor-pointer hover:shadow-glow transition-all duration-300 border border-border bg-card hover:-translate-y-1 overflow-hidden group h-[300px] flex flex-col scroll-animate"
                    >
                      <div className="relative h-[200px] overflow-hidden">
                      {ytThumb ? (
                          <img 
                            src={ytThumb} 
                            alt={section.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" decoding="async"
                          />
                        ) : kbVideoUrl ? (
                          <video 
                            src={kbVideoUrl}
                            className="w-full h-full object-cover"
                            autoPlay
                            loop
                            muted
                            playsInline
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <div className="flex flex-col items-center gap-2 text-muted-foreground group-hover:text-foreground transition-colors">
                              <div className="w-12 h-12 rounded-full bg-muted-foreground/10 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                                <Play className="w-5 h-5 fill-current" />
                              </div>
                              <span className="text-xs font-medium">Video coming soon</span>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 p-3 flex flex-col justify-center bg-tool-card-bottom">
                        <p className="text-[10px] text-primary font-semibold uppercase mb-0.5">{section.category}</p>
                        <h3 className="text-sm font-bold text-foreground mb-2">{section.title}</h3>
                        <Button size="sm" variant="outline" className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground bg-transparent">
                          Learn More
                        </Button>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Success Stories Section */}
      <section className="py-6 md:py-10 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 scroll-animate">
            <h2 className="text-3xl md:text-5xl font-bold text-header-dark mb-4">
              Success <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Stories</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See how leading brands are using Floowy.ai to transform their content creation
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {caseStudies.map((caseStudy) => (
              <Card 
                key={caseStudy.id}
                className="overflow-hidden cursor-pointer hover:shadow-lg transition-all hover:scale-105 bg-gradient-to-br from-primary via-primary to-primary-glow border-none scroll-scale"
                onClick={() => navigate(caseStudy.path)}
              >
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={caseStudy.coverImage} 
                    alt={caseStudy.title}
                    className="w-full h-full object-cover" loading="lazy" decoding="async"
                  />
                </div>
                <CardHeader className="text-white pb-3">
                  <CardTitle className="text-xl text-white">{caseStudy.title}</CardTitle>
                  <CardDescription className="text-base text-white/90">
                    {caseStudy.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="flex flex-wrap gap-2">
                    {caseStudy.stats.map((stat, index) => (
                      <span 
                        key={index}
                        className="px-3 py-1 bg-white/20 text-white rounded-full text-sm font-medium whitespace-nowrap"
                      >
                        {stat}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link to="/cases">
              <Button size="lg" className="bg-gradient-to-r from-primary to-primary-glow hover:shadow-glow text-primary-foreground border-0 group">
                View All Case Studies
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Create Once, Launch Anywhere Section */}
      <PlatformsSection />

      <Footer />
    </div>
  );
};

export default KnowledgeBase;
