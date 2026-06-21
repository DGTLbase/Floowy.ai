import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Upload, Film, Music, Maximize2, Check, Type, Image, Play, CreditCard } from "lucide-react";
import KBVideoHero from "@/components/KBVideoHero";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PlatformsSection from "@/components/PlatformsSection";
import { useScrollAnimationInit } from "@/hooks/useScrollAnimationInit";
import { Link } from "react-router-dom";
import PageMeta from "@/components/PageMeta";
import kbVvsOutputVideo from "@/assets/virtual-video-studio-hero.mp4";

const KnowledgeBaseVirtualVideoStudio = () => {
  useScrollAnimationInit();

  const whenToUse = [
    "Real estate listings that need professional video content",
    "Social media content for Reels, TikTok and Shorts",
    "Paid advertising creatives for property campaigns",
    "Presentation videos for property showcases",
  ];

  const musicStyles = [
    { name: "Cinematic", desc: "Dramatic, sweeping soundscapes" },
    { name: "Elegant & Luxury", desc: "Refined, premium feel" },
    { name: "Modern & Trendy", desc: "Contemporary, fresh energy" },
    { name: "Bright & Upbeat", desc: "Cheerful, optimistic tone" },
    { name: "Relaxed & Chill", desc: "Calm, soothing atmosphere" },
    { name: "Dramatic & Bold", desc: "Powerful, impactful sound" },
  ];

  const aspectRatios = [
    { label: "16:9", name: "Landscape", desc: "Horizontal video format" },
    { label: "9:16", name: "Portrait", desc: "Vertical video format" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title="Virtual Video Studio guide for creating cinematic property videos | Floowy"
        description="Learn how to use the Virtual Video Studio to create cinematic property videos with AI-generated clips, music and branding overlays."
        keywords="virtual video studio guide, AI property video, cinematic real estate video, video generation tool"
        canonicalUrl="https://floowy.ai/knowledge-base/virtual-video-studio"
        breadcrumbs={[
          { name: "Home", url: "https://floowy.ai" },
          { name: "Knowledge Base", url: "https://floowy.ai/knowledge-base" },
          { name: "Virtual Video Studio", url: "https://floowy.ai/knowledge-base/virtual-video-studio" },
        ]}
      />
      <Navigation />

      {/* Hero Section */}
      <section className="pt-10 md:pt-12 pb-8 md:pb-12 bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <Link to="/knowledge-base">
              <Button variant="ghost" className="mb-6 hover:bg-accent">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Knowledge Base
              </Button>
            </Link>

            <div className="text-center scroll-animate">
              <h1 className="text-4xl md:text-6xl font-bold text-header-dark mb-6">
                Create Cinematic Property <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                  Videos with AI
                </span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-4xl mx-auto">
                The Virtual Video Studio allows you to generate dynamic property videos from uploaded images in just a few steps. Each uploaded image is automatically transformed into a 4-second cinematic clip, combined into one seamless video with music and optional branding elements. The tool is built for real estate teams and marketers who want scalable, professional property videos optimized for social media, ads and listings.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* KB Video Hero */}
      <KBVideoHero toolName="Virtual Video Studio" className="py-2 md:py-4" />

      {/* When Should You Use */}
      <section className="py-6 md:py-10 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8 scroll-animate">
              <h2 className="text-3xl md:text-5xl font-bold text-header-dark mb-4">
                When Should You Use <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                  Virtual Video Studio
                </span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Use this tool when you want to quickly turn property visuals into high-quality vertical or landscape video content without manual editing.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4 scroll-scale">
              {whenToUse.map((item, index) => (
                <Card key={index} className="border-border/50 bg-card/50 backdrop-blur">
                  <CardContent className="p-6 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center flex-shrink-0 mt-1">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-foreground">{item}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-8 text-center">
              <p className="text-base text-muted-foreground max-w-3xl mx-auto">
                The system ensures consistency, speed and professional output without requiring video editing skills.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Upload Images */}
      <section className="py-6 md:py-10 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <Card className="border-border/50 hover:shadow-glow transition-all scroll-animate">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-start gap-6 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-lg flex-shrink-0">
                    <Upload className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                      Upload Images
                    </h3>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      Start by uploading at least 2 images. Each uploaded image is automatically converted into a 4-second cinematic clip. You can drag and reorder the uploaded files to determine the sequence of the final video. The first item in the list becomes the opening scene.
                    </p>
                  </div>
                </div>

                {/* Visual Example */}
                <div className="mt-6 p-6 bg-muted/20 border-2 border-dashed border-border rounded-xl">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <Upload className="w-8 h-8 text-primary" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-foreground mb-1">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground">
                        JPG, PNG or WebP (min. 2 images)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Important notes */}
                <div className="mt-6 space-y-3">
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                    <p className="text-sm text-foreground">
                      <span className="font-semibold">Important:</span> If you select Portrait (9:16), upload vertical-format images for best results. If you select Landscape (16:9), upload horizontal-format images. Matching your uploads to the chosen aspect ratio ensures optimal framing and visual quality.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CreditCard className="w-4 h-4 text-primary" />
                    <span>Each uploaded image costs <span className="font-semibold text-foreground">5 credits</span> per generated video.</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Headers and Property Details */}
      <section className="py-6 md:py-10 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <Card className="border-border/50 hover:shadow-glow transition-all scroll-animate">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-start gap-6 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-lg flex-shrink-0">
                    <Type className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                      Headers and Property Details
                    </h3>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      You can add structured text overlays to the video. Only the Project Name is mandatory. Address and Price can be added if needed. These headers are styled automatically and positioned professionally within the video layout.
                    </p>
                  </div>
                </div>

                {/* Visual Example */}
                <div className="mt-6 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Project Name (H1) – Required</label>
                    <Input disabled placeholder="e.g. Riverside Residence" className="bg-muted/30" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Address (H2) – Optional</label>
                    <Input disabled placeholder="e.g. 123 Riverside Drive, Amsterdam" className="bg-muted/30" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Price (H3) – Optional</label>
                    <Input disabled placeholder="e.g. €1,250,000" className="bg-muted/30" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Logo */}
      <section className="py-6 md:py-10 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <Card className="border-border/50 hover:shadow-glow transition-all scroll-animate">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-start gap-6 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-lg flex-shrink-0">
                    <Image className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                      Logo (Optional)
                    </h3>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      You can upload a logo to include branding in the video. The logo is placed subtly and professionally within the final output. If no logo is uploaded, the video will generate without branding.
                    </p>
                  </div>
                </div>

                {/* Visual Example */}
                <div className="mt-6 p-6 bg-muted/20 border-2 border-dashed border-border rounded-xl">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <Image className="w-8 h-8 text-primary" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-foreground mb-1">
                        Upload logo (optional)
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PNG with transparency recommended
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Music Style */}
      <section className="py-6 md:py-10 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <Card className="border-border/50 hover:shadow-glow transition-all scroll-animate">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-start gap-6 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-lg flex-shrink-0">
                    <Music className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                      Choose Music Style
                    </h3>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      Choose a music style that fits the property type and audience. Based on your selection, the system generates a unique AI-based sound design that is automatically synced and placed under the video.
                    </p>
                  </div>
                </div>

                {/* Visual Example */}
                <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
                  {musicStyles.map((style, index) => (
                    <button
                      key={index}
                      className={`p-4 bg-card border rounded-xl hover:border-primary hover:shadow-lg transition-all text-left ${
                        index === 0 ? "border-2 border-primary" : "border-border"
                      }`}
                    >
                      <Music className={`w-6 h-6 mb-2 ${index === 0 ? "text-primary" : "text-muted-foreground"}`} />
                      <p className="text-sm font-semibold text-foreground">{style.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{style.desc}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Aspect Ratio */}
      <section className="py-6 md:py-10 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <Card className="border-border/50 hover:shadow-glow transition-all scroll-animate">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-start gap-6 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-lg flex-shrink-0">
                    <Maximize2 className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                      Select Aspect Ratio
                    </h3>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      Select your preferred output format. Make sure your uploaded media matches the selected format for the best visual results.
                    </p>
                  </div>
                </div>

                {/* Visual Example */}
                <div className="mt-6 grid grid-cols-2 gap-4">
                  {aspectRatios.map((ratio, index) => (
                    <button
                      key={index}
                      className={`p-6 bg-card border rounded-xl hover:shadow-lg transition-all ${
                        index === 0 ? "border-2 border-primary" : "border-border hover:border-primary"
                      }`}
                    >
                      <div className={`mx-auto mb-3 border-2 ${index === 0 ? "border-primary" : "border-muted-foreground"} rounded ${
                        index === 0 ? "w-16 h-9" : "w-9 h-16"
                      }`} />
                      <p className="text-sm font-semibold text-foreground">{ratio.label} {ratio.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{ratio.desc}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Output Video */}
      <section className="py-6 md:py-10 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <Card className="border-border/50 hover:shadow-glow transition-all scroll-animate">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-start gap-6 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-lg flex-shrink-0">
                    <Play className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                      Output Video
                    </h3>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      After generation, the system combines all elements into one seamless cinematic property video ready for publishing.
                    </p>
                  </div>
                </div>

                {/* Example output video */}
                <div className="mt-6 rounded-xl overflow-hidden border border-border bg-black">
                  <video
                    src={kbVvsOutputVideo}
                    controls
                    className="w-full aspect-video"
                    poster=""
                  />
                </div>

                {/* Visual breakdown */}
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { icon: Film, label: "4-second clips", desc: "Per uploaded image" },
                    { icon: Music, label: "AI Music", desc: "Selected style" },
                    { icon: Image, label: "Logo", desc: "Optional branding" },
                    { icon: Type, label: "Headers", desc: "Structured overlays" },
                  ].map((item, index) => (
                    <div key={index} className="p-4 bg-card/50 border border-border/50 rounded-xl text-center">
                      <item.icon className="w-8 h-8 text-primary mx-auto mb-2" />
                      <p className="text-sm font-semibold text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 bg-primary/5 border border-primary/20 rounded-lg p-4 text-center">
                  <p className="text-sm text-foreground">
                    The final video is rendered at <span className="font-semibold">1080p quality, 25 FPS</span> and is ready for instant download.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Platforms Section */}
      <PlatformsSection />

      {/* CTA Section */}
      <section className="py-10 md:py-16 bg-gradient-to-b from-background to-primary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center scroll-animate">
            <h2 className="text-3xl md:text-5xl font-bold text-header-dark mb-6">
              Ready to Create Your <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                Property Video?
              </span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Turn your property images into cinematic videos in minutes with the Virtual Video Studio.
            </p>
            <Link to="/tool/property-studio">
              <Button size="lg" className="bg-gradient-to-r from-primary to-primary-glow text-white px-8 py-6 text-lg rounded-xl hover:opacity-90 transition-opacity shadow-lg">
                Try Virtual Video Studio
                <Film className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default KnowledgeBaseVirtualVideoStudio;
