import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Upload, Clock, Users, Palette, Maximize2, Check, Sun, Moon, Package, User, Hand } from "lucide-react";
import KBVideoHero from "@/components/KBVideoHero";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PlatformsSection from "@/components/PlatformsSection";
import { useScrollAnimationInit } from "@/hooks/useScrollAnimationInit";
import { Link } from "react-router-dom";
import ambienceCover from "@/assets/ambience-studio-cover-new-3.png";
import PageMeta from "@/components/PageMeta";

const KnowledgeBaseAmbience = () => {
  useScrollAnimationInit();

  const whenToUse = [
    "Enrich a basic product photo with a realistic or stylistic background",
    "Show a product being worn or held by a model",
    "Need multiple variations for campaigns or A/B testing",
    "Produce high-quality lifestyle and ambience visuals quickly without planning a photoshoot"
  ];

  const stylePresets = [
    "Scandinavian interior",
    "Minimalist studio",
    "Luxury environment",
    "Cozy home atmosphere",
    "Outdoor nature scene"
  ];

  return (
    <div className="min-h-screen bg-background">
      <PageMeta 
        title="AI ambience tool guide for creating atmospheric visuals | Floowy"
        description="Follow the AI ambience tool guide to create atmospheric visuals for campaigns. Build mood, depth and ambience for stronger marketing content."
        keywords="AI ambience tool guide, atmosphere creation, ambience visuals, mood photography guide"
        canonicalUrl="https://floowy.ai/knowledge-base/ambience-studio"
        breadcrumbs={[
          { name: "Home", url: "https://floowy.ai" },
          { name: "Knowledge Base", url: "https://floowy.ai/knowledge-base" },
          { name: "Ambience Studio", url: "https://floowy.ai/knowledge-base/ambience-studio" }
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
                Create Realistic Atmosphere Driven <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                  Product Visuals
                </span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-4xl mx-auto">
                Ambience Studio allows you to transform a simple product photo into a fully atmospheric and visually engaging scene. You can place your product inside a realistic environment or show it being used by a model, all generated through AI. The tool adds depth, storytelling, and brand feeling to your visuals without the need for physical shoots, studio setups or production teams.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* KB Video Hero */}
      <KBVideoHero toolName="Ambience Studio" className="py-2 md:py-4" />

      {/* When Should You Use */}
      <section className="py-6 md:py-10 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8 scroll-animate">
              <h2 className="text-3xl md:text-5xl font-bold text-header-dark mb-4">
                When Should You Use <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                  Ambience Studio
                </span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Ambience Studio is ideal when you want to enrich a basic product photo with realistic environments and professional storytelling.
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
                It is the perfect solution to elevate product imagery with consistent storytelling and a professional look.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Upload Your Product - With Visual */}
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
                      Upload Your Product
                    </h3>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      Start by uploading the product photo you want to use. Supported file types are JPG, PNG and WebP, with a maximum file size of 10 MB. A clear and well-lit product image will result in the best output, as this becomes the foundation of the generated visual.
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

      {/* Time Of Day - With Visual */}
      <section className="py-6 md:py-10 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <Card className="border-border/50 hover:shadow-glow transition-all scroll-animate">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-start gap-6 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-lg flex-shrink-0">
                    <Clock className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                      Choose Time Of Day
                    </h3>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      Next, select whether the scene should appear during the day or at night. Day will create bright, fresh and naturally lit visuals, while night produces warmer, moodier and more atmospheric results. This choice greatly influences the tone and emotion of the final image.
                    </p>
                  </div>
                </div>

                {/* Visual Example */}
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <button className="p-6 bg-card border-2 border-primary rounded-xl hover:shadow-lg transition-all">
                    <Sun className="w-10 h-10 text-primary mx-auto mb-3" />
                    <p className="text-sm font-semibold text-foreground">Day</p>
                    <p className="text-xs text-muted-foreground mt-1">Bright & Fresh</p>
                  </button>
                  <button className="p-6 bg-card border border-border rounded-xl hover:border-primary hover:shadow-lg transition-all">
                    <Moon className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm font-semibold text-foreground">Night</p>
                    <p className="text-xs text-muted-foreground mt-1">Warm & Moody</p>
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Model Presence - With Visual */}
      <section className="py-6 md:py-10 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <Card className="border-border/50 hover:shadow-glow transition-all scroll-animate">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-start gap-6 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-lg flex-shrink-0">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                      Choose Product Only Or With A Model
                    </h3>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      After selecting the time of day, choose whether the visual should feature only the product or include a model. The product-only option is ideal when the focus needs to remain entirely on the product in a curated environment. The with-model option is used when you want to show the product in context, for example being worn, held or used by a person, which adds realism and emotional connection to your visual.
                    </p>
                  </div>
                </div>

                {/* Visual Example */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button className="p-6 bg-card border-2 border-primary rounded-xl hover:shadow-lg transition-all">
                    <Package className="w-10 h-10 text-primary mx-auto mb-3" />
                    <p className="text-sm font-semibold text-foreground">Product Only</p>
                    <p className="text-xs text-muted-foreground mt-1">Focus on product</p>
                  </button>
                  <button className="p-6 bg-card border border-border rounded-xl hover:border-primary hover:shadow-lg transition-all">
                    <User className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm font-semibold text-foreground">With Model</p>
                    <p className="text-xs text-muted-foreground mt-1">Lifestyle context</p>
                  </button>
                  <button className="p-6 bg-card border border-border rounded-xl hover:border-primary hover:shadow-lg transition-all">
                    <Hand className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm font-semibold text-foreground">Hand/Arm Only</p>
                    <p className="text-xs text-muted-foreground mt-1">In-use shots</p>
                  </button>
                </div>

                {/* Detailed Descriptions */}
                <div className="mt-8 space-y-6">
                  {/* Product Only Description */}
                  <div className="bg-card/30 rounded-xl p-6 border border-border/30">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
                        <Package className="w-5 h-5 text-white" />
                      </div>
                      <h4 className="text-lg font-bold text-foreground">Product Only</h4>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                      The Product Only option is used when you want the product to be the main subject of the visual without including any model. Ambience Studio places your product in a realistic atmosphere or environment based on your mood prompt.
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      This option is ideal for product-focused visuals such as banners, ads, product highlight sections and website hero images. It allows you to create clean, polished and fully on-brand scenes where the product is the central element. If you want to create lifestyle ambience without human interaction, this is the option to choose.
                    </p>
                  </div>

                  {/* With Model Description */}
                  <div className="bg-card/30 rounded-xl p-6 border border-border/30">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <h4 className="text-lg font-bold text-foreground">With Model</h4>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                      If you choose the option with a model, you can select from several model options depending on the type of visual you want to create. You can choose a male model or a female model, or you can use the optional upload feature to provide your own model image. Uploading your own model is not required. If you do not upload a model, Ambience Studio will generate a standard AI model for you.
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                      When you rely on the default AI model, you can control how the model should look through your mood prompt. In the prompt section you can describe appearance, hairstyle, clothing style, expression and pose. The tool will use that description to generate a model that matches your visual direction.
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Uploading your own model is helpful when you want full brand consistency or when you need the same person to appear across multiple visuals or campaigns, but it remains purely optional. Supported upload formats are JPG, PNG and WebP up to 10 MB.
                    </p>
                  </div>

                  {/* Hand/Arm Only Description */}
                  <div className="bg-card/30 rounded-xl p-6 border border-border/30">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
                        <Hand className="w-5 h-5 text-white" />
                      </div>
                      <h4 className="text-lg font-bold text-foreground">Hand/Arm Only</h4>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                      The Hand/Arm Only option is designed for product visuals that show the product being held, worn, or interacted with by hands or arms, without including a full model or face. This creates authentic in-use photography that demonstrates how the product looks and functions in real situations.
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      This option is perfect for product demos, lifestyle shots, and action-focused visuals where you want to show the product in context without the distraction of a full person. The hands are positioned naturally based on your mood prompt, creating realistic and engaging product photography that focuses on interaction and usage.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Mood Prompt - With Visual */}
      <section className="py-6 md:py-10 bg-background">
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
                      Write Your Mood Prompt
                    </h3>
                    <p className="text-base text-muted-foreground leading-relaxed mb-4">
                      The mood prompt is the creative core of Ambience Studio. Here you describe the environment, atmosphere and overall style of the final visual. The best results come from English prompts of around 20 to 30 words.
                    </p>
                    <p className="text-base text-muted-foreground leading-relaxed mb-6">
                      You can describe the type of interior or exterior setting, lighting style, color palette, textures, materials, emotional tone and any specific elements that define the scene. If you did not upload your own model, you can also describe the appearance, posture or styling of the model. The clearer and more specific the description, the better the final result will match your vision.
                    </p>
                  </div>
                </div>

                {/* Visual Example - Textarea */}
                <div className="mb-6">
                  <Textarea
                    placeholder="Example: Modern minimalist living room with natural light, warm wood tones, soft beige fabrics, and green plants..."
                    className="min-h-[120px] bg-card border-border/50 text-foreground resize-none"
                    disabled
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Tip: Describe the environment, lighting, colors, and mood in 20-30 words
                  </p>
                </div>

                <div className="bg-card/50 backdrop-blur rounded-xl p-6 border border-border/30">
                  <h4 className="text-lg font-semibold text-foreground mb-4">Style Presets</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    If you prefer a quick start, you can use one of these style presets:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {stylePresets.map((preset, index) => (
                      <Badge 
                        key={index}
                        variant="outline"
                        className="px-4 py-2 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 cursor-pointer transition-colors"
                      >
                        {preset}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Image Size - With Visual */}
      <section className="py-6 md:py-10 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <Card className="border-border/50 bg-card/50 backdrop-blur hover:shadow-glow transition-all scroll-animate">
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

      {/* Create Once, Launch Anywhere Section */}
      <PlatformsSection />

      {/* CTA Section */}
      <section className="py-8 md:py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-gradient-to-br from-primary/10 via-accent/20 to-primary-glow/10 rounded-3xl p-6 md:p-12 text-center border border-primary/20 scroll-scale">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Ready To Create Stunning Visuals?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Start using Ambience Studio today and transform your product photography
            </p>
            <Link to="/tool/atmospheric">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow text-lg px-8 h-14">
                Try Ambience Studio
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default KnowledgeBaseAmbience;
