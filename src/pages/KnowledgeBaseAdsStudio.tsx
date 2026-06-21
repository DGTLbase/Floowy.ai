import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Upload, Type, Image as ImageIcon, Palette, Maximize2, Check, Package, User, Hand, Megaphone, MousePointerClick } from "lucide-react";
import KBVideoHero from "@/components/KBVideoHero";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PlatformsSection from "@/components/PlatformsSection";
import { useScrollAnimationInit } from "@/hooks/useScrollAnimationInit";
import { Link } from "react-router-dom";
import listingPrime from "@/assets/listing-example-prime.png";
import listingWelhof from "@/assets/listing-example-welhof.jpg";
import listingBoucleme from "@/assets/listing-example-boucleme.jpg";
import PageMeta from "@/components/PageMeta";

const KnowledgeBaseAdsStudio = () => {
  useScrollAnimationInit();

  const whenToUse = [
    "Create professional ad creatives for social media campaigns",
    "Generate listing images for e-commerce platforms",
    "Produce branded visuals with consistent text overlays and logos",
    "Build campaign-ready images with headlines, CTAs and product focus"
  ];

  const outputSizes = [
    { name: "Square", ratio: "1:1", use: "Instagram Feed, Facebook" },
    { name: "Portrait", ratio: "4:5", use: "Instagram, Pinterest" },
    { name: "Story", ratio: "9:16", use: "Stories, Reels, TikTok" },
    { name: "Landscape", ratio: "16:9", use: "YouTube, Facebook Cover" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <PageMeta 
        title="AI Ads Studio guide for creating ad creatives | Floowy"
        description="Follow the AI Ads Studio guide to create professional ad images and campaign creatives. Build branded visuals with headlines, CTAs and product focus."
        keywords="AI ads studio guide, ad creative generation, campaign creative guide, social media ad creation"
        canonicalUrl="https://floowy.ai/knowledge-base/ads-studio"
        breadcrumbs={[
          { name: "Home", url: "https://floowy.ai" },
          { name: "Knowledge Base", url: "https://floowy.ai/knowledge-base" },
          { name: "Ads Studio", url: "https://floowy.ai/knowledge-base/ads-studio" }
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
                Generate High-Converting <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                  Ad Creatives
                </span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-4xl mx-auto">
                Listing Studio allows you to transform product photos into professional advertisement images with customizable text overlays, branded backgrounds, and strategic call-to-action elements. Whether you need social media ads, e-commerce listing images or campaign creatives, the tool generates polished visuals that are ready to publish across all platforms.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* KB Video Hero */}
      <KBVideoHero toolName="Ads Studio" />

      {/* Cover Images - Example Gallery */}
      <section className="py-6 md:py-10 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto scroll-scale">
            <div className="grid md:grid-cols-3 gap-6">
              {[listingBoucleme, listingWelhof, listingPrime].map((img, idx) => (
                <div key={idx} className="rounded-2xl overflow-hidden shadow-2xl border border-border/50">
                  <img 
                    src={img} 
                    alt={`Ad Creative Example ${idx + 1}`} 
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
                When Should You Use <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                  Ads Studio
                </span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Ads Studio is ideal when you need to create branded ad creatives with text overlays, CTAs and consistent visual styling across campaigns.
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
                It is the perfect solution for creating professional advertisement visuals that drive engagement and conversions without the need for graphic design expertise.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Upload Product Photo - With Visual */}
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
                      Upload Your Product Image
                    </h3>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      Start by uploading the product photo you want to feature in your ad creative. This becomes the central element of your visual. A clear, well-lit product image with a transparent or clean background will result in the best output. Supported file types include JPG, PNG and WebP with a maximum size of 10 MB.
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

      {/* Model Selection - With Visual */}
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
                      Choose Model Presence
                    </h3>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      Decide whether your ad should feature just the product, include hands holding or interacting with it, or show a full model. Each option creates a different type of visual appeal and suits different campaign objectives.
                    </p>
                  </div>
                </div>

                {/* Visual Example */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button className="p-6 bg-card border-2 border-primary rounded-xl hover:shadow-lg transition-all">
                    <Package className="w-10 h-10 text-primary mx-auto mb-3" />
                    <p className="text-sm font-semibold text-foreground">Product Only</p>
                    <p className="text-xs text-muted-foreground mt-1">Clean product focus</p>
                  </button>
                  <button className="p-6 bg-card border border-border rounded-xl hover:border-primary hover:shadow-lg transition-all">
                    <Hand className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm font-semibold text-foreground">Hand Interaction</p>
                    <p className="text-xs text-muted-foreground mt-1">In-use context</p>
                  </button>
                  <button className="p-6 bg-card border border-border rounded-xl hover:border-primary hover:shadow-lg transition-all">
                    <User className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm font-semibold text-foreground">With Model</p>
                    <p className="text-xs text-muted-foreground mt-1">Lifestyle appeal</p>
                  </button>
                </div>

                {/* Detailed Descriptions */}
                <div className="mt-8 space-y-6">
                  <div className="bg-card/30 rounded-xl p-6 border border-border/30">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
                        <Package className="w-5 h-5 text-white" />
                      </div>
                      <h4 className="text-lg font-bold text-foreground">Product Only</h4>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      The Product Only option places your product as the sole focus of the ad creative. This is ideal for product launches, feature highlights, and campaigns where you want the product to stand out without distraction. The AI generates an appropriate background and positions your product prominently.
                    </p>
                  </div>

                  <div className="bg-card/30 rounded-xl p-6 border border-border/30">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
                        <Hand className="w-5 h-5 text-white" />
                      </div>
                      <h4 className="text-lg font-bold text-foreground">Hand Interaction</h4>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Hand Interaction shows your product being held, used, or interacted with by hands or arms. This creates authentic in-use photography that demonstrates how the product looks and functions in real situations, adding relatability and context to your ad creative.
                    </p>
                  </div>

                  <div className="bg-card/30 rounded-xl p-6 border border-border/30">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <h4 className="text-lg font-bold text-foreground">With Model</h4>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      The With Model option includes a full model in your ad creative, adding lifestyle appeal and emotional connection. This works well for fashion, beauty, fitness, and lifestyle products where showing the product in context with a person enhances its appeal.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Text Configuration - With Visual */}
      <section className="py-6 md:py-10 bg-background">
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
                      Add Headlines And Text
                    </h3>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      Customize your ad with compelling text elements including headlines, subheadlines, and descriptions. You can choose fonts, colors, sizes, and positioning to match your brand identity. Strong headlines capture attention and communicate your value proposition instantly.
                    </p>
                  </div>
                </div>

                {/* Visual Example */}
                <div className="mt-6 space-y-4">
                  <div className="bg-card/50 rounded-xl p-4 border border-border/30">
                    <label className="text-sm font-medium text-foreground mb-2 block">Headline</label>
                    <Input 
                      placeholder="e.g., Premium Quality Headphones" 
                      className="text-lg font-bold"
                      disabled
                      value="Premium Quality Headphones"
                    />
                    <p className="text-xs text-muted-foreground mt-2">The main attention-grabbing text for your ad</p>
                  </div>
                  <div className="bg-card/50 rounded-xl p-4 border border-border/30">
                    <label className="text-sm font-medium text-foreground mb-2 block">Subheadline</label>
                    <Input 
                      placeholder="e.g., Experience sound like never before" 
                      className="text-base"
                      disabled
                      value="Experience sound like never before"
                    />
                    <p className="text-xs text-muted-foreground mt-2">Supporting text that adds detail or context</p>
                  </div>
                </div>

                {/* Font & Style Options */}
                <div className="mt-6 bg-muted/20 rounded-xl p-6 border border-border/30">
                  <h4 className="text-sm font-semibold text-foreground mb-3">Customization Options</h4>
                  <div className="flex flex-wrap gap-2">
                    {["Font Family", "Font Size", "Text Color", "Position", "Font Weight", "Text Style"].map((option, idx) => (
                      <Badge 
                        key={idx}
                        variant="outline"
                        className="px-3 py-1 bg-primary/10 text-primary border-primary/20"
                      >
                        {option}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Configuration - With Visual */}
      <section className="py-6 md:py-10 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <Card className="border-border/50 hover:shadow-glow transition-all scroll-animate">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-start gap-6 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-lg flex-shrink-0">
                    <MousePointerClick className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                      Add Call-To-Action Button
                    </h3>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      Include a prominent call-to-action button to drive engagement. Customize the button text, background color, and position to create urgency and guide viewers toward taking action. A strong CTA can significantly improve ad performance.
                    </p>
                  </div>
                </div>

                {/* Visual Example */}
                <div className="mt-6 flex flex-wrap gap-3">
                  {["Shop Now", "Learn More", "Get Started", "Buy Today", "Discover More", "Order Now"].map((cta, idx) => (
                    <button
                      key={idx}
                      className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                        idx === 0 
                          ? "bg-gradient-to-r from-primary to-primary-glow text-white shadow-lg" 
                          : "bg-card border border-border hover:border-primary text-foreground"
                      }`}
                    >
                      {cta}
                    </button>
                  ))}
                </div>

                <p className="text-xs text-muted-foreground mt-4">
                  Choose from common CTA options or write your own custom button text
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Logo Upload - With Visual */}
      <section className="py-6 md:py-10 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <Card className="border-border/50 hover:shadow-glow transition-all scroll-animate">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-start gap-6 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-lg flex-shrink-0">
                    <Megaphone className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                      Add Your Logo (Optional)
                    </h3>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      Upload your brand logo to add professional branding to your ad creative. You can adjust the logo size and position to ensure it complements the overall design without overwhelming the product or message. Adding a logo helps build brand recognition and trust.
                    </p>
                  </div>
                </div>

                {/* Visual Example */}
                <div className="mt-6 grid grid-cols-3 gap-4">
                  {["Top Left", "Top Center", "Top Right", "Bottom Left", "Bottom Center", "Bottom Right"].map((position, idx) => (
                    <button
                      key={idx}
                      className={`p-4 rounded-xl border transition-all ${
                        idx === 4 
                          ? "border-primary bg-primary/10" 
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="w-6 h-6 bg-muted rounded mx-auto mb-2"></div>
                      <p className="text-xs text-muted-foreground">{position}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Background Configuration - With Visual */}
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
                      Configure Background
                    </h3>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      Customize the background of your ad creative with a solid color or describe a custom background scene. You can match your brand colors or create atmospheric settings that enhance your product's appeal and fit your campaign aesthetic.
                    </p>
                  </div>
                </div>

                {/* Color Presets */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-foreground mb-3">Background Color Presets</h4>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { color: "#1a1a2e", name: "Dark Navy" },
                      { color: "#0f0f0f", name: "Pure Black" },
                      { color: "#f5f5f5", name: "Light Gray" },
                      { color: "#2d3436", name: "Charcoal" },
                      { color: "#6c5ce7", name: "Purple" },
                      { color: "#00b894", name: "Emerald" }
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

                {/* Custom Background Prompt */}
                <div className="bg-card/50 backdrop-blur rounded-xl p-6 border border-border/30">
                  <h4 className="text-lg font-semibold text-foreground mb-4">Or Describe A Custom Background</h4>
                  <Textarea
                    placeholder="e.g., Sleek modern studio with soft gradient lighting, minimalist tech environment with subtle blue accent lights..."
                    className="resize-none h-24"
                    disabled
                  />
                  <p className="text-xs text-muted-foreground mt-3">
                    Describe the atmosphere, lighting, and environment for your custom background
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Output Size Selection */}
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
                      Select the output format for your ad creative based on where it will be used. Different platforms have different optimal dimensions, and choosing the right size ensures your ad looks professional and performs well across all placements.
                    </p>
                  </div>
                </div>

                {/* Output Size Grid */}
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
      <section className="py-6 md:py-10 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center scroll-animate">
            <p className="text-lg text-muted-foreground leading-relaxed">
              Ads Studio combines product photography, branded text overlays, and strategic design elements to create professional ad creatives that convert. Whether you're launching a new product, running a seasonal campaign, or building consistent brand visuals, the tool helps you produce polished advertisements without design expertise.
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
                High-Converting Ads?
              </span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Start generating professional ad creatives with Ads Studio today and transform your product images into campaign-ready visuals.
            </p>
            <Link to="/tool/ads-listing">
              <Button size="lg" className="bg-gradient-to-r from-primary to-primary-glow hover:shadow-glow text-primary-foreground border-0">
                <Megaphone className="w-5 h-5 mr-2" />
                Try Ads Studio Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default KnowledgeBaseAdsStudio;
