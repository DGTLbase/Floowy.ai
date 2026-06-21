import React, { Suspense, useState, useEffect, useMemo } from "react";
import { ArrowRight, Play, X, ArrowLeft, Megaphone, Palette, Video, Shirt, Layers, Lightbulb, ShoppingCart, Film, Loader2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import BackendLayout from "@/components/BackendLayout";
import { supabase } from "@/integrations/supabase/client";

import creatorCover from "@/assets/creator-studio-cover-new.mp4";
import creatorFeature from "@/assets/creator-feature-video-new.mp4";
import creatorSide1 from "@/assets/creator-side-video-1-new.mp4";
import galleryVideo from "@/assets/gallery-video-new.mp4";
import galleryManVideo from "@/assets/gallery-man-video.mp4";
import galleryUgc from "@/assets/gallery-ugc.mp4";
import galleryNewVideo from "@/assets/gallery-new-video.mp4";

import ambienceHero1 from "@/assets/ambience-hero-1-new.jpg";
import ambienceHero2 from "@/assets/ambience-hero-2-new.jpg";
import ambienceHero3 from "@/assets/ambience-hero-3-new.jpg";
import fashionHero1 from "@/assets/fashion-hero-1.jpg";
import fashionHero2 from "@/assets/fashion-hero-2.jpg";
import fashionHero3 from "@/assets/fashion-hero-3.jpg";
import flatlayShowcase1 from "@/assets/flatlay-showcase-1.png";
import flatlayShowcase2 from "@/assets/flatlay-showcase-2.png";
import ideaStudioCover from "@/assets/idea-studio-cover-new.png";
import ideaStudioFeature from "@/assets/idea-studio-feature.jpg";
import adsListingPreview from "@/assets/ads-listing-preview.png";
import adsStudioPreview from "@/assets/ads-studio-preview.png";
import headphonesAfter from "@/assets/headphones-after-updated.png";
import headphonesLifestyle1 from "@/assets/headphones-lifestyle-1.png";
import promptGuideResult from "@/assets/prompt-guide-result.jpg";
import promptGuideProduct from "@/assets/prompt-guide-product.png";

// Lazy-loaded KB page components
const toolPages: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  "Ads Studio": React.lazy(() => import("@/pages/KnowledgeBaseAdsStudio")),
  "Ambience Studio": React.lazy(() => import("@/pages/KnowledgeBaseAmbience")),
  "Creator Studio": React.lazy(() => import("@/pages/KnowledgeBaseCreatorStudio")),
  "Fashion Studio": React.lazy(() => import("@/pages/KnowledgeBaseFashion")),
  "Flat Lay Studio": React.lazy(() => import("@/pages/KnowledgeBaseFlatlay")),
  "Idea Studio": React.lazy(() => import("@/pages/KnowledgeBaseIdeaStudio")),
  "Listing Studio": React.lazy(() => import("@/pages/KnowledgeBaseListingStudio")),
  "Virtual Video Studio": React.lazy(() => import("@/pages/KnowledgeBaseVirtualVideoStudio")),
  "Fashion Studio Pro": React.lazy(() => import("@/pages/KnowledgeBaseFashionPro")),
  "Prompt Guide": React.lazy(() => import("@/pages/KnowledgeBasePromptGuide")),
};

const getYouTubeId = (url: string): string | null => {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
};

const getYouTubeEmbedUrl = (url: string): string | null => {
  const id = getYouTubeId(url);
  return id ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&rel=0` : null;
};

const getYouTubeEmbedUrlWithControls = (url: string): string | null => {
  const id = getYouTubeId(url);
  return id ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0` : null;
};

const getYouTubeThumbnail = (url: string): string | null => {
  const id = getYouTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
};

type MediaItem = {
  src: string;
  type: "image" | "video";
  alt: string;
};

const knowledgeTools = [
  {
    icon: Megaphone,
    title: "Ads Studio",
    description: "Generate high-converting ad creatives with text overlays and CTAs.",
    media: [
      { src: adsStudioPreview, type: "image" as const, alt: "Ads Studio preview" },
      { src: adsListingPreview, type: "image" as const, alt: "Ads listing preview" },
      { src: headphonesAfter, type: "image" as const, alt: "Headphones ad result" },
    ],
  },
  {
    icon: Palette,
    title: "Ambience Studio",
    description: "Create atmosphere-driven visuals that bring your brand to life.",
    media: [
      { src: ambienceHero1, type: "image" as const, alt: "Ambience hero 1" },
      { src: ambienceHero2, type: "image" as const, alt: "Ambience hero 2" },
      { src: ambienceHero3, type: "image" as const, alt: "Ambience hero 3" },
      { src: galleryVideo, type: "video" as const, alt: "Ambience demo video" },
    ],
  },
  {
    icon: Video,
    title: "Creator Studio",
    description: "Design and generate high-quality UGC-style marketing videos.",
    media: [
      { src: creatorCover, type: "video" as const, alt: "Creator Studio cover" },
      { src: creatorFeature, type: "video" as const, alt: "Creator feature video" },
      { src: creatorSide1, type: "video" as const, alt: "Creator side video" },
      { src: galleryManVideo, type: "video" as const, alt: "Creator man video" },
    ],
  },
  {
    icon: Shirt,
    title: "Fashion Studio",
    description: "Produce studio-quality fashion photography without an actual studio.",
    media: [
      { src: fashionHero1, type: "image" as const, alt: "Fashion hero 1" },
      { src: fashionHero2, type: "image" as const, alt: "Fashion hero 2" },
      { src: fashionHero3, type: "image" as const, alt: "Fashion hero 3" },
      { src: galleryUgc, type: "video" as const, alt: "Fashion demo" },
    ],
  },
  {
    icon: Shirt,
    title: "Fashion Studio Pro",
    description: "Create complete AI-powered fashion shoots at scale.",
    media: [
      { src: fashionHero1, type: "image" as const, alt: "Fashion Studio Pro preview" },
      { src: fashionHero2, type: "image" as const, alt: "Fashion Studio Pro result" },
    ],
  },
  {
    icon: Layers,
    title: "Flat Lay Studio",
    description: "Create brand-consistent flat lay visuals at scale.",
    media: [
      { src: flatlayShowcase1, type: "image" as const, alt: "Flatlay showcase 1" },
      { src: flatlayShowcase2, type: "image" as const, alt: "Flatlay showcase 2" },
      { src: headphonesLifestyle1, type: "image" as const, alt: "Lifestyle flatlay" },
    ],
  },
  {
    icon: Lightbulb,
    title: "Idea Studio",
    description: "Recreate inspiring scenes with your own products and models.",
    media: [
      { src: ideaStudioCover, type: "image" as const, alt: "Idea Studio cover" },
      { src: ideaStudioFeature, type: "image" as const, alt: "Idea Studio feature" },
      { src: galleryNewVideo, type: "video" as const, alt: "Idea Studio demo" },
    ],
  },
  {
    icon: ShoppingCart,
    title: "Listing Studio",
    description: "Create AI product listing images for Amazon, Bol.com and marketplaces.",
    media: [
      { src: adsListingPreview, type: "image" as const, alt: "Listing preview" },
      { src: headphonesAfter, type: "image" as const, alt: "Listing result" },
      { src: headphonesLifestyle1, type: "image" as const, alt: "Listing lifestyle" },
    ],
  },
  {
    icon: BookOpen,
    title: "Prompt Guide",
    description: "Write structured, high-converting AI prompts for better image results.",
    media: [
      { src: promptGuideResult, type: "image" as const, alt: "Prompt Guide result" },
      { src: promptGuideProduct, type: "image" as const, alt: "Prompt Guide product" },
    ],
  },
  {
    icon: Film,
    title: "Virtual Video Studio",
    description: "Create cinematic property videos with AI-generated clips and music.",
    media: [
      { src: adsStudioPreview, type: "image" as const, alt: "Virtual Video Studio preview" },
    ],
  },
];

const KnowledgeBaseHub = () => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [kbVideos, setKbVideos] = useState<Record<string, string>>({});

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

  const openPreview = (item: MediaItem) => {
    setPreviewItem(item);
    setPreviewOpen(true);
  };

  // Scroll to top when selecting a tool
  useEffect(() => {
    if (selectedTool) {
      window.scrollTo({ top: 0 });
    }
  }, [selectedTool]);

  // Render inline KB content
  if (selectedTool && toolPages[selectedTool]) {
    const ToolPage = toolPages[selectedTool];
    return (
      <BackendLayout>
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedTool(null)}
            className="mb-4 gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Knowledge Base
          </Button>
          {/* Hide Navigation, Footer, PlatformsSection from embedded pages */}
          <div className="kb-inline-content">
            <Suspense
              fallback={
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              }
            >
              <ToolPage />
            </Suspense>
          </div>
        </div>
      </BackendLayout>
    );
  }

  return (
    <BackendLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Knowledge Base
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Learn how to get the most out of every tool. Browse tutorials, watch demos, and master your creative workflow.
          </p>
        </div>

        {/* Card Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {knowledgeTools.map((tool) => {
            const Icon = tool.icon;

            return (
              <div
                key={tool.title}
                className="group rounded-2xl border border-primary/40 bg-muted/30 overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all duration-300"
              >
                {/* Video preview */}
                {kbVideos[tool.title] ? (() => {
                  const ytEmbed = getYouTubeEmbedUrl(kbVideos[tool.title]);
                  const ytThumb = getYouTubeThumbnail(kbVideos[tool.title]);
                  if (ytThumb) {
                    return (
                      <button
                        onClick={() => openPreview({ src: kbVideos[tool.title], type: "video", alt: tool.title + " preview" })}
                        className="relative w-full aspect-[4/3] overflow-hidden bg-black cursor-pointer group/video"
                      >
                        <img
                          src={`https://img.youtube.com/vi/${getYouTubeId(kbVideos[tool.title])}/maxresdefault.jpg`}
                          alt={tool.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          decoding="async"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = ytThumb!;
                          }}
                        />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <div className="w-14 h-14 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center group-hover/video:scale-110 transition-transform">
                            <Play className="w-6 h-6 text-white fill-current" />
                          </div>
                        </div>
                      </button>
                    );
                  }
                  return (
                    <button
                      onClick={() => openPreview({ src: kbVideos[tool.title], type: "video", alt: tool.title + " preview" })}
                      className="relative w-full aspect-[4/3] overflow-hidden bg-black cursor-pointer group/video"
                    >
                      <video
                        src={kbVideos[tool.title]}
                        muted
                        loop
                        playsInline
                        autoPlay
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/video:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-14 h-14 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
                          <Play className="w-6 h-6 text-white fill-current" />
                        </div>
                      </div>
                    </button>
                  );
                })() : (
                  <button
                    onClick={() => openPreview({ src: tool.media[0].src, type: "video", alt: tool.title + " preview" })}
                    className="relative w-full aspect-[4/3] overflow-hidden bg-muted flex items-center justify-center cursor-pointer hover:bg-muted/80 transition-colors"
                  >
                    <div className="flex flex-col items-center gap-2 text-muted-foreground group-hover:text-foreground transition-colors">
                      <div className="w-14 h-14 rounded-full bg-muted-foreground/10 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                        <Play className="w-6 h-6 fill-current" />
                      </div>
                      <span className="text-xs font-medium">Video coming soon</span>
                    </div>
                  </button>
                )}

                {/* Info */}
                <div className="p-4 flex flex-col gap-3 bg-white backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="w-4.5 h-4.5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold leading-tight" style={{ color: '#000' }}>
                        {tool.title}
                      </h3>
                      <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'rgba(0,0,0,0.7)' }}>
                        {tool.description}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full group/btn border-primary/30 hover:bg-primary/5 dark:hover:bg-primary dark:hover:text-primary-foreground dark:hover:border-primary"
                    onClick={() => setSelectedTool(tool.title)}
                  >
                    Learn More
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl p-0 bg-black border-none overflow-hidden">
          <button
            onClick={() => setPreviewOpen(false)}
            className="absolute top-3 right-3 z-50 w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
          {previewItem?.type === "video" ? (() => {
            const ytEmbed = getYouTubeEmbedUrlWithControls(previewItem.src);
            if (ytEmbed) {
              return (
                <iframe
                  src={ytEmbed}
                  className="w-full aspect-video"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                />
              );
            }
            return (
              <video
                src={previewItem.src}
                controls
                autoPlay
                className="w-full max-h-[80vh] object-contain"
              />
            );
          })() : previewItem ? (
            <img
              src={previewItem.src}
              alt={previewItem.alt}
              className="w-full max-h-[80vh] object-contain" loading="lazy" decoding="async"
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </BackendLayout>
  );
};

export default KnowledgeBaseHub;
