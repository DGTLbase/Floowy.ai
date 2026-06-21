import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Upload, User, Image as ImageIcon, Palette, Maximize2, Check } from "lucide-react";
import KBVideoHero from "@/components/KBVideoHero";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PlatformsSection from "@/components/PlatformsSection";
import { useScrollAnimationInit } from "@/hooks/useScrollAnimationInit";
import { Link } from "react-router-dom";
import ideaStudioBefore from "@/assets/idea-studio-before.jpg";
import ideaStudioAfter from "@/assets/idea-studio-after.jpg";
import PageMeta from "@/components/PageMeta";

const KnowledgeBaseIdeaStudio = () => {
  useScrollAnimationInit();

  const whenToUse = [
    "Recreate a strong performing creative or competitor advertisement",
    "Match a particular aesthetic or translate an existing idea into your branded concept",
    "Redesign scenes you admire without copying them directly",
    "Recreate outdoor lifestyle photos, studio portraits, influencer shots or advertisement layouts"
  ];

  return (
    <div className="min-h-screen bg-background">
      <PageMeta 
        title="AI idea tool guide for building concepts and visuals | Floowy"
        description="Use the AI idea tool guide to create concepts, moodboards and marketing visuals. Build creative directions quickly with powerful AI features."
        keywords="AI idea tool guide, concept creation, moodboard AI, creative concept guide"
        canonicalUrl="https://floowy.ai/knowledge-base/idea-studio"
        breadcrumbs={[
          { name: "Home", url: "https://floowy.ai" },
          { name: "Knowledge Base", url: "https://floowy.ai/knowledge-base" },
          { name: "Idea Studio", url: "https://floowy.ai/knowledge-base/idea-studio" }
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
                Recreate Inspiring Scenes With <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                  Your Own Product
                </span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-4xl mx-auto">
                Idea Studio allows you to recreate any visual concept by using a reference image as the foundation for your new scene. Whether you want to draw inspiration from a successful competitor advertisement, a photo you personally love or a visual style you want to replicate, the tool rebuilds the structure, pose and overall composition of the original. You can then personalize the final result by adding your own product, choosing your own model and adjusting the background. This gives you the freedom to maintain a familiar visual style while still creating something original to your brand.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* KB Video Hero */}
      <KBVideoHero toolName="Idea Studio" />

      {/* Before/After Cover Images */}
      <section className="py-6 md:py-10 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto scroll-scale">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-center text-foreground">Reference Photo</h3>
                <div className="rounded-2xl overflow-hidden shadow-2xl border border-border/50">
                  <img 
                    src={ideaStudioBefore} 
                    alt="Reference Photo Example" 
                    className="w-full h-auto object-cover"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-center text-foreground">Recreated Scene</h3>
                <div className="rounded-2xl overflow-hidden shadow-2xl border border-border/50">
                  <img 
                    src={ideaStudioAfter} 
                    alt="Recreated Scene Example" 
                    className="w-full h-auto object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* When Should You Use */}
      <section className="py-6 md:py-10 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8 scroll-animate">
              <h2 className="text-3xl md:text-5xl font-bold text-header-dark mb-4">
                When Should You Use <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                  Idea Studio
                </span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Idea Studio is ideal when you want to recreate a strong performing creative, match a particular aesthetic or translate an existing idea into your own branded concept.
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
                Whether you want to recreate an outdoor lifestyle photo, a studio portrait, an influencer shot or an advertisement layout, Idea Studio uses the reference image as a guide and generates a polished version that includes your own product and identity.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Upload Reference Photo - With Visual */}
      <section className="py-6 md:py-10 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <Card className="border-border/50 hover:shadow-glow transition-all scroll-animate">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-start gap-6 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-lg flex-shrink-0">
                    <ImageIcon className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                      Upload Your Reference Photo
                    </h3>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      Begin by uploading the reference image that forms the base of your scene. This can be any visual you want to reinterpret, such as a competitor ad, a moodboard element or a campaign image that has proven to perform well. The system analyses the pose, lighting, framing and overall composition, ensuring the recreated scene closely matches the structure of your reference. Supported file types include JPG, PNG and WebP with a maximum size of 10 MB.
                    </p>
                  </div>
                </div>

                {/* Visual Example */}
                <div className="mt-6 p-6 bg-muted/20 border-2 border-dashed border-border rounded-xl">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-primary" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-foreground mb-1">
                        Upload your reference image
                      </p>
                      <p className="text-xs text-muted-foreground">
                        JPG, PNG or WebP (max 10MB)
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Upload Product Photo - With Visual */}
      <section className="py-6 md:py-10 bg-muted/30">
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
                      Upload Your Product Photo
                    </h3>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      Next, upload the product you want to include in the recreated scene. The tool places your product into the composition while maintaining the structure of the reference photo. This allows you to keep the visual style you admire while replacing the core item with your own, resulting in a familiar but brand aligned version of the scene.
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
                        Upload your product image
                      </p>
                      <p className="text-xs text-muted-foreground">
                        JPG, PNG or WebP (max 10MB)
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Avatar Selection - With Visual */}
      <section className="py-6 md:py-10 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <Card className="border-border/50 hover:shadow-glow transition-all scroll-animate">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-start gap-6 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-lg flex-shrink-0">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                      Select Your Avatar Or Upload Your Own Model
                    </h3>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      After uploading your product, choose the model who will appear in your recreated concept. You can select from a range of avatars or upload your own model image for stronger brand consistency. Uploading a custom model is optional but recommended when you want the final image to match your brand identity or feature the same person across campaigns. If you do not upload your own model, the selected avatar will be used instead. Idea Studio adjusts the recreated pose based on the reference image, ensuring the model mirrors the original scene naturally.
                    </p>
                  </div>
                </div>

                {/* Visual Example - Pre-built Avatars */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-foreground mb-3">Select From Pre-Built Avatars</h4>
                  <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
                    {Array.from({ length: 20 }).map((_, idx) => (
                      <button 
                        key={idx}
                        className={`aspect-square rounded-xl overflow-hidden ${
                          idx === 0 
                            ? "ring-2 ring-primary ring-offset-2 ring-offset-background" 
                            : "hover:ring-2 hover:ring-primary/50"
                        } transition-all`}
                      >
                        <img 
                          src={`/models/model-${idx + 1}.jpg`}
                          alt={`Avatar ${idx + 1}`}
                          className="w-full h-full object-cover object-top"
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Upload Custom Model */}
                <div className="mt-8 pt-8 border-t border-border/30">
                  <h4 className="text-sm font-semibold text-foreground mb-3">Or Upload Your Own Model</h4>
                  <div className="p-6 bg-muted/20 border-2 border-dashed border-border rounded-xl">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <Upload className="w-8 h-8 text-primary" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-foreground mb-1">
                          Upload Custom Model (Optional)
                        </p>
                        <p className="text-xs text-muted-foreground">
                          JPG, PNG or WebP (max 10MB)
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3 text-center">
                    Upload your own model for brand consistency across campaigns
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Adjust Background - With Visual */}
      <section className="py-6 md:py-10 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <Card className="border-border/50 bg-gradient-to-br from-primary/5 to-background hover:shadow-glow transition-all scroll-animate">
              <CardContent className="p-6 md:p-10">
                <div className="flex items-start gap-6 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-lg flex-shrink-0">
                    <Palette className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                      Adjust The Background
                    </h3>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      To further personalize your recreated scene, you can add a background prompt describing the visual environment you want. This step helps you avoid generating an image that feels too similar to the reference and gives your concept a distinct atmosphere. You can describe any setting, such as a beach sunset, an urban street, a minimalist indoor studio or a natural outdoor location. A clear background description helps the system create the right ambience while maintaining the original layout and pose.
                    </p>
                  </div>
                </div>

                <div className="bg-card/50 backdrop-blur rounded-xl p-6 border border-border/30">
                  <h4 className="text-lg font-semibold text-foreground mb-4">Background Setting Examples</h4>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {["Beach Sunset", "Urban Street", "Modern Studio", "Natural Forest", "Coffee Shop Interior", "Rooftop Terrace", "Boutique Store", "Minimal White Space"].map((example, index) => (
                      <Badge 
                        key={index}
                        variant="outline"
                        className="px-4 py-2 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 cursor-pointer transition-colors"
                      >
                        {example}
                      </Badge>
                    ))}
                  </div>
                  <Textarea
                    placeholder="Example: Sunset beach with golden sand, warm natural lighting, tropical palm trees in background, relaxed summer atmosphere..."
                    className="min-h-[100px] bg-card border-border/50 text-foreground resize-none"
                    disabled
                  />
                  <p className="text-xs text-muted-foreground mt-3">
                    Describe the setting, lighting, and atmosphere for your recreated scene
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Output Size - With Visual */}
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
                      Choose Your Output Size
                    </h3>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      You can select any aspect ratio you need, from wide cinematic formats to vertical mobile visuals, giving you full flexibility for every type of content. For output quality, you can choose between 1K (2 credits), which is perfect for fast, lightweight visuals, 2K (3 credits) for sharper, more detailed images suitable for most professional use cases, or 4K (4 credits) for ultra-high-resolution results. The 4K option delivers hyper-realistic, lifelike detail, making every image look exceptionally crisp and immersive. This way, you stay fully in control of both the format and the credit usage for each generated image.
                    </p>
                  </div>
                </div>

                {/* Aspect Ratios */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-foreground mb-3">Select Aspect Ratio</h4>
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                    {["21:9", "16:9", "3:2", "4:3", "5:4", "1:1", "4:5", "3:4", "2:3"].map((ratio, index) => (
                      <div
                        key={index}
                        className={`flex flex-col items-center justify-center rounded-md border-2 p-3 cursor-pointer transition-all hover:bg-accent ${
                          index === 5 ? "border-primary bg-primary/10" : "border-border bg-card/50"
                        }`}
                      >
                        <span className="text-sm font-semibold text-foreground">{ratio}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Resolution Tiers */}
                <div className="bg-card/50 backdrop-blur rounded-xl p-6 border border-border/30">
                  <h4 className="text-sm font-semibold text-foreground mb-3">Select Resolution Tier</h4>
                  <p className="text-xs text-muted-foreground mb-4">
                    Higher resolution = sharper images but more credits
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "1K", credits: "2 credits", description: "Fast, lightweight visuals" },
                      { label: "2K", credits: "3 credits", description: "Sharper, detailed images" },
                      { label: "4K", credits: "4 credits", description: "Ultra-high-resolution" }
                    ].map((res, index) => (
                      <div
                        key={index}
                        className={`flex flex-col items-center justify-center rounded-md border-2 p-4 cursor-pointer transition-all hover:bg-accent ${
                          index === 0 ? "border-primary bg-primary/10" : "border-border bg-card/50"
                        }`}
                      >
                        <span className="text-base font-bold text-foreground">{res.label}</span>
                        <span className="text-xs text-muted-foreground mt-1">{res.credits}</span>
                        <span className="text-xs text-muted-foreground text-center mt-2">{res.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Summary Section */}
      <section className="py-6 md:py-10 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center scroll-animate">
            <p className="text-lg text-muted-foreground leading-relaxed">
              Idea Studio combines inspiration, structure and customization, allowing you to adapt any visual idea into a version that feels unique, professional and aligned with your brand.
            </p>
          </div>
        </div>
      </section>

      {/* Create Once, Launch Anywhere Section */}
      <PlatformsSection />

      {/* CTA Section */}
      <section className="py-8 md:py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-gradient-to-br from-primary/10 via-accent/20 to-primary-glow/10 rounded-3xl p-6 md:p-12 text-center border border-primary/20 scroll-scale">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Ready To Recreate Inspiring Visual Concepts?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Start using Idea Studio today and transform any reference into your branded masterpiece
            </p>
            <Link to="/tool/idea-studio">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow text-lg px-8 h-14">
                Try Idea Studio
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default KnowledgeBaseIdeaStudio;
