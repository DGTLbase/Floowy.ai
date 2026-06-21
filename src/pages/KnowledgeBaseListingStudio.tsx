import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Upload, Type, Image as ImageIcon, Palette, Maximize2, Check, Package, ShoppingCart, Store, Globe, Sparkles, Target, TrendingUp } from "lucide-react";
import KBVideoHero from "@/components/KBVideoHero";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PlatformsSection from "@/components/PlatformsSection";
import { useScrollAnimationInit } from "@/hooks/useScrollAnimationInit";
import { Link } from "react-router-dom";
import listingRobotVacuum from "@/assets/listing-example-robot-vacuum.png";
import listingMassageGun from "@/assets/listing-example-massage-gun.png";
import listingTreadmill from "@/assets/listing-example-treadmill.png";
import PageMeta from "@/components/PageMeta";

const KnowledgeBaseListingStudio = () => {
  useScrollAnimationInit();

  const whenToUse = [
    "Create high-converting product listing images for Amazon and Bol.com",
    "Generate AI ecommerce product images that stand out in search results",
    "Build professional marketplace listing visuals without design expertise",
    "Produce Amazon FBA listing images and Bol.com product listing AI content"
  ];

  const marketplaces = [
    { name: "Amazon", icon: "📦", description: "AI amazon listing generator for FBA sellers" },
    { name: "Bol.com", icon: "🛒", description: "Bol.com listing generator for Dutch market" },
    { name: "Shopify", icon: "🏪", description: "AI ecommerce product images for stores" },
    { name: "All Marketplaces", icon: "🌐", description: "Marketplace listing AI for any platform" }
  ];

  const outputSizes = [
    { name: "Square", ratio: "1:1", use: "Product Gallery, Amazon Main" },
    { name: "Portrait", ratio: "4:5", use: "A+ Content, Instagram" },
    { name: "Story", ratio: "9:16", use: "Mobile Listings" },
    { name: "Landscape", ratio: "16:9", use: "Enhanced Brand Content" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <PageMeta 
        title="AI Product Listing Image Generator Guide | Amazon & Bol.com | Floowy"
        description="Learn how to use the AI product listing image generator for Amazon and Bol.com. Create AI ecommerce product images that convert with our marketplace listing AI guide."
        keywords="ai product listing image generator, ai listing image generator, ai product listing images, ai amazon listing image generator, bol.com listing generator, amazon listing generator ai, marketplace listing ai"
        canonicalUrl="https://floowy.ai/knowledge-base/listing-studio"
        breadcrumbs={[
          { name: "Home", url: "https://floowy.ai" },
          { name: "Knowledge Base", url: "https://floowy.ai/knowledge-base" },
          { name: "Listing Studio", url: "https://floowy.ai/knowledge-base/listing-studio" }
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
                AI Product Listing <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                  Image Generator
                </span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-4xl mx-auto">
                The ultimate AI listing image generator for Amazon, Bol.com, and all major marketplaces. Transform your product photos into high-converting AI product listing images that drive sales. Whether you need an Amazon listing generator AI or Bol.com product listing AI, this guide shows you how to create professional AI ecommerce product images in minutes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* KB Video Hero */}
      <KBVideoHero toolName="Listing Studio" />

      {/* Cover Images - Example Gallery */}
      <section className="py-6 md:py-10 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto scroll-scale">
            <div className="grid md:grid-cols-3 gap-6">
              {[listingRobotVacuum, listingMassageGun, listingTreadmill].map((img, idx) => (
                <div key={idx} className="rounded-2xl overflow-hidden shadow-2xl border border-border/50">
                  <img 
                    src={img} 
                    alt={`AI product listing image example ${idx + 1}`} 
                    className="w-full h-auto object-cover"
                  />
                </div>
              ))}
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
                When To Use The <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                  AI Listing Image Generator
                </span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                The AI product image generator is perfect for Amazon FBA sellers, Bol.com merchants, and any marketplace seller who needs professional AI product listing images.
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
                Whether you're an Amazon seller looking for an AI tool to generate amazon listings or a Bol.com merchant needing AI bol.com listing support, Listing Studio helps you create professional visuals that convert.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Supported Marketplaces */}
      <section className="py-6 md:py-10 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8 scroll-animate">
              <h2 className="text-3xl md:text-5xl font-bold text-header-dark mb-4">
                AI For <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                  Every Marketplace
                </span>
              </h2>
              <p className="text-lg text-muted-foreground">
                Create AI product listing images optimized for all major ecommerce platforms
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 scroll-scale">
              {marketplaces.map((marketplace, idx) => (
                <Card key={idx} className="border-border/50 bg-card/50 backdrop-blur hover:shadow-glow transition-all">
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl mb-3">{marketplace.icon}</div>
                    <h3 className="font-bold text-foreground mb-1">{marketplace.name}</h3>
                    <p className="text-xs text-muted-foreground">{marketplace.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Upload Product Photo */}
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
                      Upload Your Product Image
                    </h3>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      Start by uploading the product photo you want to transform into an AI product listing image. The AI product image generator works best with clear, well-lit product photos. For Amazon listing generator AI and Bol.com listing generator outputs, use images with transparent or white backgrounds for best results.
                    </p>
                  </div>
                </div>

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

      {/* Model Selection */}
      <section className="py-6 md:py-10 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <Card className="border-border/50 hover:shadow-glow transition-all scroll-animate">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-start gap-6 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-lg flex-shrink-0">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                      Choose AI Model Presence
                    </h3>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      Decide how to showcase your product in the AI listing image. The AI ecommerce product images can feature just the product, hands demonstrating usage, or a full model for lifestyle appeal. Each option is optimized for different marketplace listing AI requirements.
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button className="p-6 bg-card border-2 border-primary rounded-xl hover:shadow-lg transition-all">
                    <Package className="w-10 h-10 text-primary mx-auto mb-3" />
                    <p className="text-sm font-semibold text-foreground">Product Only</p>
                    <p className="text-xs text-muted-foreground mt-1">Amazon main image style</p>
                  </button>
                  <button className="p-6 bg-card border border-border rounded-xl hover:border-primary hover:shadow-lg transition-all">
                    <Target className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm font-semibold text-foreground">In-Use Context</p>
                    <p className="text-xs text-muted-foreground mt-1">Lifestyle demonstration</p>
                  </button>
                  <button className="p-6 bg-card border border-border rounded-xl hover:border-primary hover:shadow-lg transition-all">
                    <TrendingUp className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm font-semibold text-foreground">With Model</p>
                    <p className="text-xs text-muted-foreground mt-1">Full lifestyle imagery</p>
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Text & Features Configuration */}
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
                      Add Product Features & Benefits
                    </h3>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      Enhance your AI product listing images with compelling feature callouts and benefit highlights. The AI listing image generator automatically positions text for maximum impact, helping your Amazon product listing AI or Bol.com product listing AI content stand out in search results.
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="bg-card/50 rounded-xl p-4 border border-border/30">
                    <label className="text-sm font-medium text-foreground mb-2 block">Main Headline</label>
                    <Input 
                      placeholder="e.g., Premium Wireless Headphones" 
                      className="text-lg font-bold"
                      disabled
                      value="Premium Wireless Headphones"
                    />
                    <p className="text-xs text-muted-foreground mt-2">Your main product title for the listing image</p>
                  </div>
                  <div className="bg-card/50 rounded-xl p-4 border border-border/30">
                    <label className="text-sm font-medium text-foreground mb-2 block">Key Features</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {["40hr Battery", "Active Noise Cancelling", "Premium Sound", "Comfortable Fit"].map((feature, idx) => (
                        <Badge key={idx} className="bg-primary/10 text-primary border-primary/20">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">Features displayed as icons with text on your listing image</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Background Configuration */}
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
                      Configure Background Scene
                    </h3>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      Set the perfect background for your AI product listing images. Choose from solid colors for Amazon-compliant main images, or create lifestyle scenes for A+ content and enhanced brand content. The AI product image generator creates realistic environments that enhance your product's appeal.
                    </p>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-foreground mb-3">Background Presets</h4>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { color: "#ffffff", name: "Pure White" },
                      { color: "#f5f5f5", name: "Light Gray" },
                      { color: "#1a1a2e", name: "Dark Navy" },
                      { color: "#0f0f0f", name: "Pure Black" },
                      { color: "#e8f4ea", name: "Soft Green" },
                      { color: "#fff3e0", name: "Warm Cream" }
                    ].map((preset, idx) => (
                      <button
                        key={idx}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:border-primary transition-all"
                      >
                        <div 
                          className="w-6 h-6 rounded-full border border-border/50" 
                          style={{ backgroundColor: preset.color }}
                        ></div>
                        <span className="text-xs text-muted-foreground">{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-card/50 backdrop-blur rounded-xl p-6 border border-border/30">
                  <h4 className="text-lg font-semibold text-foreground mb-4">Or Describe A Custom Background</h4>
                  <Textarea
                    placeholder="e.g., Modern minimalist living room with natural lighting, professional gym environment with equipment..."
                    className="resize-none h-24"
                    disabled
                  />
                  <p className="text-xs text-muted-foreground mt-3">
                    Describe the lifestyle scene for your AI ecommerce product images
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Output Size Selection */}
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
                      Select the optimal dimensions for your AI product listing images. Different marketplaces have different requirements—Amazon main images need 1:1 square format, while A+ content allows for more creative dimensions. The AI listing image generator supports all standard marketplace formats.
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {outputSizes.map((size, idx) => (
                    <button
                      key={idx}
                      className={`p-4 rounded-xl border transition-all ${
                        idx === 0 
                          ? "border-primary bg-primary/10" 
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className={`mx-auto mb-3 bg-muted/50 border border-border/50 rounded ${
                        size.ratio === "1:1" ? "w-12 h-12" :
                        size.ratio === "4:5" ? "w-10 h-12" :
                        size.ratio === "9:16" ? "w-8 h-14" :
                        "w-14 h-8"
                      }`}></div>
                      <p className="text-sm font-semibold text-foreground">{size.name}</p>
                      <p className="text-xs text-muted-foreground">{size.ratio}</p>
                      <p className="text-xs text-muted-foreground mt-1">{size.use}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Summary Section */}
      <section className="py-6 md:py-10 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center scroll-animate">
            <p className="text-lg text-muted-foreground leading-relaxed">
              The AI product listing image generator transforms how Amazon sellers, Bol.com merchants, and ecommerce businesses create product visuals. Whether you need an AI amazon listing image generator for FBA products, a Bol.com listing generator for the Dutch market, or AI product image generator capabilities for any marketplace listing AI, Floowy delivers professional results in minutes—not hours.
            </p>
          </div>
        </div>
      </section>

      {/* Create Once, Launch Anywhere Section */}
      <PlatformsSection />

      {/* CTA Section */}
      <section className="py-10 md:py-16 bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center scroll-scale">
            <h2 className="text-3xl md:text-5xl font-bold text-header-dark mb-6">
              Ready To Create <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                High-Converting Listings?
              </span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Start generating AI product listing images for Amazon, Bol.com, and all major marketplaces today.
            </p>
            <Link to="/listing-studio">
              <Button size="lg" className="bg-gradient-to-r from-primary to-primary-glow hover:shadow-glow text-primary-foreground border-0">
                <ShoppingCart className="w-5 h-5 mr-2" />
                Try Listing Studio Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default KnowledgeBaseListingStudio;
