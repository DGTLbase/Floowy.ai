import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Upload, User, Zap, Shirt, Check, Palette, Maximize2 } from "lucide-react";
import KBVideoHero from "@/components/KBVideoHero";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PlatformsSection from "@/components/PlatformsSection";
import { useScrollAnimationInit } from "@/hooks/useScrollAnimationInit";
import { Link } from "react-router-dom";
import fashionCover from "@/assets/fashion-cover-new-3.png";
import PageMeta from "@/components/PageMeta";

const KnowledgeBaseFashion = () => {
  useScrollAnimationInit();

  const whenToUse = [
    "Showcase clothing on a model in a natural and branded way",
    "Create product page images, social content, lookbooks and campaign visuals",
    "Experiment with different outfits and create cohesive seasonal collections",
    "Produce model photography that fits your brand's identity without a studio setup"
  ];

  const poses = [
    "Natural Standing",
    "Relaxed Casual",
    "Walking",
    "Seated",
    "Side View",
    "Action Stance"
  ];

  const backgroundColors = [
    { name: "Studio White", color: "#F8F8F8", gradient: false },
    { name: "Light Grey", color: "linear-gradient(to bottom, #E8E8E8, #D8D8D8)", gradient: true },
    { name: "Cream", color: "linear-gradient(to bottom, #FAF5F0, #F5EFE7)", gradient: true },
    { name: "Studio Black", color: "linear-gradient(to bottom, #2C2C2C, #1A1A1A)", gradient: true },
    { name: "Soft Pink", color: "linear-gradient(to bottom, #FFE5E5, #FFD6D6)", gradient: true },
    { name: "Light Blue", color: "linear-gradient(to bottom, #E3F2FD, #BBDEFB)", gradient: true },
    { name: "Neutral Beige", color: "linear-gradient(to bottom, #E8DCC4, #D4C5A9)", gradient: true },
    { name: "Mint Green", color: "linear-gradient(to bottom, #E8F5E9, #C8E6C9)", gradient: true }
  ];

  return (
    <div className="min-h-screen bg-background">
      <PageMeta 
        title="AI fashion tool guide for creating fashion shoot visuals | Floowy"
        description="Learn how to use the AI fashion tool guide to create fashion shoot visuals for campaigns, catalogs and social content with fast AI production."
        keywords="AI fashion tool guide, fashion photography guide, fashion shoot AI, model photography guide"
        canonicalUrl="https://floowy.ai/knowledge-base/fashion-studio"
        breadcrumbs={[
          { name: "Home", url: "https://floowy.ai" },
          { name: "Knowledge Base", url: "https://floowy.ai/knowledge-base" },
          { name: "Fashion Studio", url: "https://floowy.ai/knowledge-base/fashion-studio" }
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
                Generate High Quality AI <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                  Model Photography
                </span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-4xl mx-auto">
                Fashion Studio allows you to create realistic model photography by placing your clothing onto AI generated or custom uploaded models. It gives you the freedom to style complete outfits, choose poses and select backgrounds, helping you build professional fashion visuals without planning a physical photoshoot. This tool is designed for brands that want to scale their content production, test multiple creative directions and maintain full consistency across model and style choices.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* KB Video Hero */}
      <KBVideoHero toolName="Fashion Studio" />

      {/* Cover Image */}
      <section className="py-6 md:py-10 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto scroll-scale">
            <div className="rounded-2xl overflow-hidden shadow-2xl border border-border/50">
              <img 
                src={fashionCover} 
                alt="Fashion Studio Tool" 
                className="w-full h-auto object-cover"
              />
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
                  Fashion Studio
                </span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Fashion Studio is ideal when you want to showcase clothing on a model in a natural and branded way.
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
                Whether you upload only one item or an entire outfit, Fashion Studio turns it into a polished and professional model image.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Upload Clothing - With Visual */}
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
                      Upload Your Clothing
                    </h3>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      To begin, upload the clothing item you want to feature on the model. This can be a sweater, top, dress, jacket or any other garment you want to visualize. For the best results, upload a clear and well lit product image so the system can accurately place it on the model. Supported file types are JPG, PNG and WebP with a maximum size of 10 MB.
                    </p>
                  </div>
                </div>

                {/* Visual Example */}
                <div className="mt-6 p-6 bg-muted/20 border-2 border-dashed border-border rounded-xl">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <Shirt className="w-8 h-8 text-primary" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-foreground mb-1">
                        Upload your main clothing item
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
      <section className="py-6 md:py-10 bg-muted/30">
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
                      Select Your Avatar Or Upload Your Own
                    </h3>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      After uploading your clothing, choose the model who will wear the outfit. You can select from a range of pre built avatars with different looks and styles, or you can upload your own model to maintain brand consistency across all your visuals. Uploading your own model is optional and not required. If you do not upload a model, the selected avatar will be used. Using a custom model is helpful when you want the same person to appear across multiple collections, campaigns or pages.
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
                    Upload your own model for brand consistency across collections and campaigns
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Choose Pose - With Visual */}
      <section className="py-6 md:py-10 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <Card className="border-border/50 bg-gradient-to-br from-primary/5 to-background hover:shadow-glow transition-all scroll-animate">
              <CardContent className="p-6 md:p-10">
                <div className="flex items-start gap-6 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-lg flex-shrink-0">
                    <Zap className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                      Choose The Pose
                    </h3>
                    <p className="text-base text-muted-foreground leading-relaxed mb-4">
                      The pose determines how dynamic or expressive the final image feels. You can choose from natural standing poses, relaxed casual poses, walking poses, seated poses, side view angles or more action oriented stances.
                    </p>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      Selecting a pose helps you move away from static product imagery and gives your modelled clothing more movement and personality. It is also useful when you want to match the style of previous shoots or maintain a consistent visual structure across a collection.
                    </p>
                  </div>
                </div>

                <div className="bg-card/50 backdrop-blur rounded-xl p-6 border border-border/30">
                  <h4 className="text-lg font-semibold text-foreground mb-4">Available Poses</h4>
                  <div className="flex flex-wrap gap-2">
                    {poses.map((pose, index) => (
                      <Badge 
                        key={index}
                        variant="outline"
                        className="px-4 py-2 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 cursor-pointer transition-colors"
                      >
                        {pose}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Optional Outfit Styling - With Visual */}
      <section className="py-6 md:py-10 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <Card className="border-border/50 hover:shadow-glow transition-all scroll-animate">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-start gap-6 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-lg flex-shrink-0">
                    <Shirt className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                      Optional Outfit Styling: Tops, Trousers And Shoes
                    </h3>
                    <p className="text-base text-muted-foreground leading-relaxed mb-4">
                      If you want to style a complete look, you can upload additional clothing items such as tops, trousers or shoes. This step is optional and not required to generate an image. However, it can be helpful when you already have a vision for the outfit or want to create a cohesive look that matches your brand's tone.
                    </p>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      By combining multiple items, you can generate full outfit photography without producing separate photoshoots for each combination.
                    </p>
                  </div>
                </div>

                {/* Visual Example - Upload Areas */}
                <div className="mt-6 grid md:grid-cols-3 gap-4">
                  <div className="p-5 bg-muted/20 border-2 border-dashed border-border rounded-xl hover:border-primary/50 transition-all">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Shirt className="w-6 h-6 text-primary" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-foreground mb-1">
                          Add Top (Optional)
                        </p>
                        <p className="text-xs text-muted-foreground">
                          JPG, PNG or WebP
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 bg-muted/20 border-2 border-dashed border-border rounded-xl hover:border-primary/50 transition-all">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Shirt className="w-6 h-6 text-primary" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-foreground mb-1">
                          Add Trousers (Optional)
                        </p>
                        <p className="text-xs text-muted-foreground">
                          JPG, PNG or WebP
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 bg-muted/20 border-2 border-dashed border-border rounded-xl hover:border-primary/50 transition-all">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Shirt className="w-6 h-6 text-primary" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-foreground mb-1">
                          Add Shoes (Optional)
                        </p>
                        <p className="text-xs text-muted-foreground">
                          JPG, PNG or WebP
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Background Selection - With Visual */}
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
                      Choose A Background Or Write A Custom Prompt
                    </h3>
                    <p className="text-base text-muted-foreground leading-relaxed mb-4">
                      Next, select the background for your final image. You can choose from preset colour backgrounds such as studio white, light grey, cream, studio black, soft pink, light blue, neutral beige or mint green. You can also select any custom colour by clicking the colour field and entering your preferred colour code.
                    </p>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      If you want a more atmospheric or editorial look, you can write a custom background prompt describing the setting you want, such as a sunset beach, a modern studio interior or an outdoor city environment. Clear and descriptive prompts help the system create a background that matches the mood you have in mind.
                    </p>
                  </div>
                </div>

                {/* Preset Colors */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-foreground mb-3">Preset Background Colors</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {backgroundColors.map((bg, idx) => (
                      <button 
                        key={idx}
                        className={`p-3 rounded-xl border-2 hover:border-primary transition-all ${
                          idx === 0 ? "border-primary" : "border-border"
                        }`}
                      >
                        <div 
                          className="w-full h-16 rounded-lg mb-2 border border-border/30"
                          style={{ background: bg.color }}
                        />
                        <p className="text-xs font-medium text-foreground text-center">{bg.name}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Color Picker */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-foreground mb-3">Choose Custom Color</h4>
                  <div className="bg-card/50 backdrop-blur rounded-xl p-6 border border-border/30">
                    <div className="flex gap-3 items-center">
                      <div className="w-20 h-10 rounded-md border-2 border-border cursor-pointer overflow-hidden">
                        <input 
                          type="color" 
                          defaultValue="#F8F8F8"
                          className="w-full h-full cursor-pointer border-0"
                          style={{ padding: 0 }}
                        />
                      </div>
                      <input
                        type="text"
                        defaultValue="#F8F8F8"
                        placeholder="#FFFFFF"
                        className="flex-1 h-10 px-3 rounded-md border-2 border-border bg-background text-sm"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Click the color box or enter a hex code for your custom background color
                    </p>
                  </div>
                </div>

                {/* Custom Prompt */}
                <div className="bg-card/50 backdrop-blur rounded-xl p-6 border border-border/30">
                  <h4 className="text-lg font-semibold text-foreground mb-4">Or Write Custom Background Prompt</h4>
                  <Textarea
                    placeholder="Example: Modern minimalist studio with soft natural lighting and wooden floor, white backdrop..."
                    className="min-h-[100px] bg-card border-border/50 text-foreground resize-none"
                    disabled
                  />
                  <p className="text-xs text-muted-foreground mt-3">
                    Describe the background setting, lighting, and atmosphere you want for your fashion image
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Output Size - With Visual */}
      <section className="py-6 md:py-10 bg-muted/30">
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

      {/* Create Once, Launch Anywhere Section */}
      <PlatformsSection />

      {/* CTA Section */}
      <section className="py-8 md:py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-gradient-to-br from-primary/10 via-accent/20 to-primary-glow/10 rounded-3xl p-6 md:p-12 text-center border border-primary/20 scroll-scale">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Ready To Create Professional Fashion Photography?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Start using Fashion Studio today and generate stunning model images at scale
            </p>
            <Link to="/tool/fashion">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow text-lg px-8 h-14">
                Try Fashion Studio
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default KnowledgeBaseFashion;
