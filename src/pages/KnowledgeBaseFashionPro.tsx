import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Upload, Check, Shirt, User, Move, Palette, Maximize2, Image, Layers, RotateCcw, Package } from "lucide-react";
import KBVideoHero from "@/components/KBVideoHero";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PlatformsSection from "@/components/PlatformsSection";
import { useScrollAnimationInit } from "@/hooks/useScrollAnimationInit";
import { Link } from "react-router-dom";
import PageMeta from "@/components/PageMeta";

import kbFspBlazerFront from "@/assets/kb-fsp-blazer-front.jpg";
import kbFspBlazerBack from "@/assets/kb-fsp-blazer-back.jpg";
import kbFspTshirt from "@/assets/kb-fsp-tshirt.webp";
import kbFspJeansFront from "@/assets/kb-fsp-jeans-front.jpg";
import kbFspJeansBack from "@/assets/kb-fsp-jeans-back.jpg";
import kbFspShoes from "@/assets/kb-fsp-shoes.webp";
import kbFspBag from "@/assets/kb-fsp-bag.jpg";
import kbFspModelFront from "@/assets/kb-fsp-model-front.webp";
import kbFspOutputFront from "@/assets/kb-fsp-output-front.png";
import kbFspOutputBack from "@/assets/kb-fsp-output-back.png";
import kbFspOutputLeft from "@/assets/kb-fsp-output-left.png";
import kbFspOutputRight from "@/assets/kb-fsp-output-right.png";

const KnowledgeBaseFashionPro = () => {
  useScrollAnimationInit();

  const whenToUse = [
    "Create full fashion shoots without physical production",
    "Maintain consistent models, lighting and background across collections",
    "Generate multiple angles per outfit",
    "Scale production using bulk generation",
    "Capture detailed garment textures and fit",
  ];

  const angles = [
    { label: "Front", required: true },
    { label: "Back", required: false },
    { label: "Left", required: false },
    { label: "Right", required: false },
  ];

  const poses = [
    "Natural standing", "Confident", "Arms crossed", "Hands in pockets",
    "Walking", "Editorial", "Athletic", "Elegant",
  ];

  const presetColors = [
    { name: "White", color: "#ffffff" },
    { name: "Beige", color: "#f5f0e8" },
    { name: "Light Grey", color: "#d3d3d3" },
    { name: "Dark Grey", color: "#555555" },
    { name: "Black", color: "#000000" },
    { name: "Cream", color: "#fffdd0" },
    { name: "Navy", color: "#1a1a4e" },
    { name: "Sage", color: "#9caf88" },
  ];

  const aspectRatios = ["1:1", "4:5", "9:16", "16:9", "3:4", "5:4", "21:9"];
  const resolutions = [
    { label: "1K", desc: "Standard quality" },
    { label: "2K", desc: "High quality" },
    { label: "4K", desc: "Production ready" },
  ];

  const accessories = ["Bag", "Watch", "Scarf", "Shoes", "Hat"];

  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title="Fashion Studio Pro guide for AI-powered fashion shoots | Floowy"
        description="Learn how to use Fashion Studio Pro to create complete AI fashion shoots with multiple angles, consistent models and scalable production."
        keywords="fashion studio pro guide, AI fashion shoot, bulk fashion generation, virtual model photography"
        canonicalUrl="https://floowy.ai/knowledge-base/fashion-studio-pro"
        breadcrumbs={[
          { name: "Home", url: "https://floowy.ai" },
          { name: "Knowledge Base", url: "https://floowy.ai/knowledge-base" },
          { name: "Fashion Studio Pro", url: "https://floowy.ai/knowledge-base/fashion-studio-pro" },
        ]}
      />
      <Navigation />

      {/* Hero */}
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
                Create Complete AI-Powered <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                  Fashion Shoots
                </span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-4xl mx-auto">
                The Fashion Studio Pro is an advanced production tool that allows you to generate full fashion shoots with AI models, multiple angles, styled outfits and controlled studio environments. It is built for brands that want high-end editorial results while maintaining full control over consistency, output format and scalability. This tool is designed for professional workflows, collection launches and bulk production environments.
              </p>
            </div>
          </div>
        </div>
      </section>

      <KBVideoHero toolName="Fashion Studio Pro" className="py-2 md:py-4" />

      {/* When Should You Use */}
      <section className="py-6 md:py-10 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8 scroll-animate">
              <h2 className="text-3xl md:text-5xl font-bold text-header-dark mb-4">
                When Should You Use <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                  Fashion Studio Pro
                </span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Ideal for fashion brands, e-commerce teams and creative studios working with recurring collections.
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
          </div>
        </div>
      </section>

      {/* Bulk Generation */}
      <section className="py-6 md:py-10 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <Card className="border-border/50 hover:shadow-glow transition-all scroll-animate">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-start gap-6 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-lg flex-shrink-0">
                    <RotateCcw className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                      Bulk Generation Workflow
                    </h3>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      Fashion Studio Pro supports bulk production. When generating in bulk, you only need to upload new clothing pieces. The following settings remain locked and consistent:
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                  {["Model", "Pose", "Background", "Output size", "Resolution"].map((setting) => (
                    <div key={setting} className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                      <Check className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="text-sm font-medium text-foreground">{setting}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  This allows you to scale entire collections without resetting your creative setup.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Select Angles */}
      <section className="py-6 md:py-10 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <Card className="border-border/50 hover:shadow-glow transition-all scroll-animate">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-start gap-6 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-lg flex-shrink-0">
                    <Move className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                      Select Angles (Required)
                    </h3>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      You must select at least one angle before generating. Only selected angles will be generated.
                    </p>
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
                  {angles.map((angle, index) => (
                    <button
                      key={angle.label}
                      className={`p-5 bg-card border rounded-xl transition-all text-center ${
                        index === 0 ? "border-2 border-primary" : "border-border hover:border-primary"
                      }`}
                    >
                      <Move className={`w-8 h-8 mx-auto mb-2 ${index === 0 ? "text-primary" : "text-muted-foreground"}`} />
                      <p className="text-sm font-semibold text-foreground">{angle.label}</p>
                      {angle.required && (
                        <span className="text-xs text-primary font-medium">Required</span>
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Upload Outfit Pieces */}
      <section className="py-6 md:py-10 bg-background">
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
                      Upload Outfit Pieces
                    </h3>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      You can choose between a full outfit (one-piece garment such as dress or jumpsuit) or separate pieces (layered look such as top, jacket, trousers, shoes, hat). For each selected clothing piece, you can upload multiple views to ensure all details are accurately captured.
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  <button className="p-5 bg-card border-2 border-primary rounded-xl">
                    <Package className="w-8 h-8 text-primary mx-auto mb-2" />
                    <p className="text-sm font-semibold text-foreground">Full Outfit</p>
                    <p className="text-xs text-muted-foreground mt-1">One-piece garment</p>
                  </button>
                  <button className="p-5 bg-card border border-border rounded-xl hover:border-primary transition-all">
                    <Layers className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm font-semibold text-foreground">Separate Pieces</p>
                    <p className="text-xs text-muted-foreground mt-1">Layered look</p>
                  </button>
                </div>

                {/* Example: Separate pieces with front/back views */}
                <div className="mt-6">
                  <p className="text-sm font-medium text-foreground mb-3">Example: Uploading separate pieces with multiple views</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    <div className="space-y-1.5">
                      <div className="aspect-[3/4] rounded-lg overflow-hidden border border-border bg-muted">
                        <img src={kbFspBlazerFront} alt="Blazer front view" className="w-full h-full object-cover" />
                      </div>
                      <p className="text-xs text-muted-foreground text-center">Blazer – Front</p>
                    </div>
                    <div className="space-y-1.5">
                      <div className="aspect-[3/4] rounded-lg overflow-hidden border border-border bg-muted">
                        <img src={kbFspBlazerBack} alt="Blazer back view" className="w-full h-full object-cover" />
                      </div>
                      <p className="text-xs text-muted-foreground text-center">Blazer – Back</p>
                    </div>
                    <div className="space-y-1.5">
                      <div className="aspect-[3/4] rounded-lg overflow-hidden border border-border bg-muted">
                        <img src={kbFspTshirt} alt="T-shirt front view" className="w-full h-full object-cover" />
                      </div>
                      <p className="text-xs text-muted-foreground text-center">T-Shirt</p>
                    </div>
                    <div className="space-y-1.5">
                      <div className="aspect-[3/4] rounded-lg overflow-hidden border border-border bg-muted">
                        <img src={kbFspJeansFront} alt="Jeans front view" className="w-full h-full object-cover" />
                      </div>
                      <p className="text-xs text-muted-foreground text-center">Jeans – Front</p>
                    </div>
                    <div className="space-y-1.5">
                      <div className="aspect-[3/4] rounded-lg overflow-hidden border border-border bg-muted">
                        <img src={kbFspJeansBack} alt="Jeans back view" className="w-full h-full object-cover" />
                      </div>
                      <p className="text-xs text-muted-foreground text-center">Jeans – Back</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                    <p className="text-sm text-foreground">
                      <span className="font-semibold">Recommended:</span> Upload at least Front and Back views for best results. Multiple angles ensure fabric details, stitching, structure and fit are properly reconstructed.
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <p className="text-sm font-medium text-foreground mb-3">You can also upload accessories:</p>
                  <div className="flex flex-wrap gap-3 items-end">
                    <div className="space-y-1.5">
                      <div className="w-16 h-16 rounded-lg overflow-hidden border border-border bg-muted">
                        <img src={kbFspShoes} alt="Shoes accessory" className="w-full h-full object-cover" />
                      </div>
                      <p className="text-xs text-muted-foreground text-center">Shoes</p>
                    </div>
                    <div className="space-y-1.5">
                      <div className="w-16 h-16 rounded-lg overflow-hidden border border-border bg-muted">
                        <img src={kbFspBag} alt="Bag accessory" className="w-full h-full object-cover" />
                      </div>
                      <p className="text-xs text-muted-foreground text-center">Bag</p>
                    </div>
                    {["Watch", "Scarf", "Hat"].map((acc) => (
                      <span key={acc} className="px-3 py-1.5 bg-muted border border-border rounded-full text-sm text-foreground">
                        {acc}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Upload Model Views */}
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
                      Upload Model Views
                    </h3>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      The model is mapped in high detail before generation. The front view is mandatory. Additional angles are recommended for maximum realism and accurate body structure mapping. The system reconstructs the model's proportions, posture and details across all selected angles.
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
                  {angles.map((angle, index) => (
                    <div key={angle.label} className={`rounded-xl overflow-hidden border-2 ${index === 0 ? "border-primary" : "border-dashed border-border"}`}>
                      {index === 0 ? (
                        <div className="aspect-[3/4] bg-muted">
                          <img src={kbFspModelFront} alt="Model front view" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="aspect-[3/4] bg-muted/20 flex items-center justify-center">
                          <div className="text-center">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                              <Upload className="w-5 h-5 text-primary" />
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="p-3 text-center bg-card">
                        <p className="text-sm font-medium text-foreground">{angle.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {index === 0 ? "Required" : "Optional"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Select Pose */}
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
                      Select Pose
                    </h3>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      Choose how your model should stand. The selected pose will be applied consistently across all generated views.
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex flex-wrap gap-2">
                  {poses.map((pose, index) => (
                    <button
                      key={pose}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        index === 0
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted border border-border text-foreground hover:border-primary"
                      }`}
                    >
                      {pose}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Background Settings */}
      <section className="py-6 md:py-10 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <Card className="border-border/50 hover:shadow-glow transition-all scroll-animate">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-start gap-6 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-lg flex-shrink-0">
                    <Palette className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                      Background Settings
                    </h3>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      You can fully control the background environment with three different options.
                    </p>
                  </div>
                </div>

                {/* Option 1: Preset Colors */}
                <div className="mt-6 space-y-6">
                  <div className="bg-card/30 rounded-xl p-6 border border-border/30">
                    <h4 className="text-lg font-bold text-foreground mb-3">Option 1: Preset Colors</h4>
                    <p className="text-sm text-muted-foreground mb-4">Choose from pre-selected studio colors.</p>
                    <div className="flex flex-wrap gap-3">
                      {presetColors.map((c, index) => (
                        <button
                          key={c.name}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                            index === 0 ? "border-2 border-primary" : "border-border hover:border-primary"
                          }`}
                        >
                          <div
                            className="w-6 h-6 rounded-full border border-border/50"
                            style={{ backgroundColor: c.color }}
                          />
                          <span className="text-sm text-foreground">{c.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Option 2: Custom */}
                  <div className="bg-card/30 rounded-xl p-6 border border-border/30">
                    <h4 className="text-lg font-bold text-foreground mb-3">Option 2: Custom Color + Lighting</h4>
                    <p className="text-sm text-muted-foreground mb-4">Enter your own background description, including color codes and lighting instructions.</p>
                    <Textarea
                      disabled
                      placeholder="#d3d3d3 with natural daylight"
                      className="bg-muted/30 resize-none"
                      rows={2}
                    />
                  </div>

                  {/* Option 3: Reference */}
                  <div className="bg-card/30 rounded-xl p-6 border border-border/30">
                    <h4 className="text-lg font-bold text-foreground mb-3">Option 3: Background Reference Upload</h4>
                    <p className="text-sm text-muted-foreground mb-4">Upload a background reference image to match existing shoots.</p>
                    <div className="p-4 bg-muted/20 border-2 border-dashed border-border rounded-xl text-center">
                      <Image className="w-8 h-8 text-primary mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">Upload reference (no models in image)</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Output Size & Resolution */}
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
                      Output Size & Resolution
                    </h3>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      In the final step, choose your output format. Select the aspect ratio based on your platform and the resolution based on your quality needs.
                    </p>
                  </div>
                </div>

                {/* Aspect Ratios */}
                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-foreground mb-3">Aspect Ratio</h4>
                  <div className="flex flex-wrap gap-2">
                    {aspectRatios.map((ratio, index) => (
                      <button
                        key={ratio}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          index === 0
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted border border-border text-foreground hover:border-primary"
                        }`}
                      >
                        {ratio}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Resolution */}
                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-foreground mb-3">Resolution</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {resolutions.map((res, index) => (
                      <button
                        key={res.label}
                        className={`p-4 bg-card border rounded-xl text-center transition-all ${
                          index === 0 ? "border-2 border-primary" : "border-border hover:border-primary"
                        }`}
                      >
                        <p className="text-lg font-bold text-foreground">{res.label}</p>
                        <p className="text-xs text-muted-foreground mt-1">{res.desc}</p>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">Higher resolution increases credit cost but delivers production-ready quality.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final Output */}
      <section className="py-6 md:py-10 bg-muted/30">
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
                      Final Output
                    </h3>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      The Fashion Studio Pro combines all elements into a fully styled AI fashion shoot ready for e-commerce, lookbooks, campaigns or paid ads.
                    </p>
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-3">
                  {[
                    { icon: Shirt, label: "Garment angles" },
                    { icon: User, label: "Model mapping" },
                    { icon: Move, label: "Chosen pose" },
                    { icon: Palette, label: "Background" },
                    { icon: Maximize2, label: "Output size" },
                  ].map((item) => (
                    <div key={item.label} className="p-3 bg-card/50 border border-border/50 rounded-xl text-center">
                      <item.icon className="w-6 h-6 text-primary mx-auto mb-1.5" />
                      <p className="text-xs font-medium text-foreground">{item.label}</p>
                    </div>
                  ))}
                </div>

                {/* Example output showcase */}
                <div className="mt-8">
                  <p className="text-sm font-medium text-foreground mb-4">Example: Generated output across all 4 angles</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { src: kbFspOutputFront, label: "Front", alt: "Output front view" },
                      { src: kbFspOutputBack, label: "Back", alt: "Output back view" },
                      { src: kbFspOutputLeft, label: "Left", alt: "Output left view" },
                      { src: kbFspOutputRight, label: "Right", alt: "Output right view" },
                    ].map((item) => (
                      <div key={item.label} className="space-y-2">
                        <div className="aspect-[3/4] rounded-xl overflow-hidden border border-border bg-muted shadow-sm">
                          <img src={item.src} alt={item.alt} className="w-full h-full object-cover" />
                        </div>
                        <p className="text-xs font-medium text-muted-foreground text-center">{item.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <PlatformsSection />

      {/* CTA */}
      <section className="py-10 md:py-16 bg-gradient-to-b from-background to-primary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center scroll-animate">
            <h2 className="text-3xl md:text-5xl font-bold text-header-dark mb-6">
              Ready to Launch Your <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                Fashion Shoot?
              </span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Generate complete AI fashion shoots at scale with Fashion Studio Pro.
            </p>
            <Link to="/tool/ultimate-outfit-maker-v2">
              <Button size="lg" className="bg-gradient-to-r from-primary to-primary-glow text-white px-8 py-6 text-lg rounded-xl hover:opacity-90 transition-opacity shadow-lg">
                Try Fashion Studio Pro
                <Shirt className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default KnowledgeBaseFashionPro;
