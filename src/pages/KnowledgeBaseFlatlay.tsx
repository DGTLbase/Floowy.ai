import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Upload, Image, Maximize2, Zap, Check, Layers } from "lucide-react";
import KBVideoHero from "@/components/KBVideoHero";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PlatformsSection from "@/components/PlatformsSection";
import { useScrollAnimationInit } from "@/hooks/useScrollAnimationInit";
import { Link } from "react-router-dom";
import flatlayBefore from "@/assets/flatlay-before-hoodie.png";
import flatlayAfter from "@/assets/flatlay-after.png";
import AutoBeforeAfterSlider from "@/components/AutoBeforeAfterSlider";
import PageMeta from "@/components/PageMeta";

const KnowledgeBaseFlatlay = () => {
  useScrollAnimationInit();

  const whenToUse = [
    "Create flat lay imagery for fashion products such as shirts, sweaters, hoodies, jackets or accessories",
    "Maintain a consistent brand look across all product visuals",
    "Launch new collections or update existing product visuals",
    "Produce assets for ads, social media and e-commerce without photographers or stylists"
  ];

  const aspectRatios = [
    { name: "1:1", description: "Square format for social media" },
    { name: "4:5", description: "Portrait for Instagram feed" },
    { name: "9:16", description: "Stories and Reels" },
    { name: "16:9", description: "Landscape for banners" }
  ];

  const resolutions = [
    { name: "2K", credits: 3, description: "Fast previews and testing" },
    { name: "4K", credits: 4, description: "High-quality production assets" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <PageMeta 
        title="AI Flat Lay Studio guide for professional flat lay photography | Floowy"
        description="Learn how to use the AI Flat Lay Studio to create professional flat lay product images for fashion brands without physical photography setups."
        keywords="AI flat lay guide, flat lay photography guide, fashion flat lay AI, product photography guide"
        canonicalUrl="https://floowy.ai/knowledge-base/flatlay-studio"
        breadcrumbs={[
          { name: "Home", url: "https://floowy.ai" },
          { name: "Knowledge Base", url: "https://floowy.ai/knowledge-base" },
          { name: "Flat Lay Studio", url: "https://floowy.ai/knowledge-base/flatlay-studio" }
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
                Create Brand-Consistent <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                  Flat Lay Visuals
                </span>{" "}
                At Scale
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-4xl mx-auto">
                The Flat Lay Studio allows you to generate high-quality flat lay product images while fully maintaining your brand style. By combining a reference image for layout and styling with a product image for colors and details, you can create consistent, professional flat lays without physical styling, photography setups or design work. The tool is built to help fashion and apparel brands produce scalable, on-brand visuals that are ready for e-commerce, ads and design workflows.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* KB Video Hero */}
      <KBVideoHero toolName="Flat Lay Studio" />

      {/* Before/After Slider */}
      <section className="py-2 md:py-4 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto scroll-scale">
            <AutoBeforeAfterSlider 
              beforeImage={flatlayBefore}
              afterImage={flatlayAfter}
              autoAnimate={true}
              animationDuration={2500}
            />
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
                  Flat Lay Studio
                </span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                The Flat Lay Studio is ideal when you want to create flat lay imagery for fashion products while keeping a consistent brand look across all visuals.
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
                Whether you are launching a new collection, updating existing product visuals or producing assets for ads and social media, the Flat Lay Studio allows you to generate studio-quality flat lays without photographers, stylists or physical product setups.
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
                    <p className="text-base text-muted-foreground leading-relaxed mb-4">
                      Start by uploading two images.
                    </p>
                    <p className="text-base text-muted-foreground leading-relaxed mb-4">
                      The <strong className="text-foreground">reference image</strong> defines the layout, position and styling of the flat lay. It controls how the product is placed, how fabric should fall, how sleeves are visible and how subtle styling details such as spacing, overlap and symmetry are carried through. This ensures your brand style remains consistent across all generated visuals.
                    </p>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      Next, upload your <strong className="text-foreground">product image</strong>. This image provides the real colors, textures and product details. The system combines both inputs to create a new flat lay that follows your styling reference while accurately representing the product itself.
                    </p>
                  </div>
                </div>

                {/* Visual Example - Two Upload Areas */}
                <div className="mt-6 grid md:grid-cols-2 gap-4">
                  <div className="p-6 bg-muted/20 border-2 border-dashed border-border rounded-xl hover:border-primary/50 transition-all">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <Layers className="w-8 h-8 text-primary" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-foreground mb-1">
                          Reference Image
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Defines layout, position & styling
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-muted/20 border-2 border-dashed border-border rounded-xl hover:border-primary/50 transition-all">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <Image className="w-8 h-8 text-primary" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-foreground mb-1">
                          Product Image
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Provides colors, textures & details
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

      {/* Aspect Ratio */}
      <section className="py-6 md:py-10 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <Card className="border-border/50 bg-gradient-to-br from-primary/5 to-background hover:shadow-glow transition-all scroll-animate">
              <CardContent className="p-6 md:p-10">
                <div className="flex items-start gap-6 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-lg flex-shrink-0">
                    <Maximize2 className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                      Aspect Ratio
                    </h3>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      After uploading your images, select the desired aspect ratio for your output. You can choose from multiple formats depending on where the visuals will be used, such as product pages, social media, advertisements or campaign assets. This ensures your flat lays are always optimized for the platform they are published on.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  {aspectRatios.map((ratio, index) => (
                    <div 
                      key={index}
                      className="p-4 bg-card/50 backdrop-blur rounded-xl border border-border/30 text-center hover:border-primary/50 transition-all"
                    >
                      <p className="text-lg font-bold text-foreground mb-1">{ratio.name}</p>
                      <p className="text-xs text-muted-foreground">{ratio.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Resolution */}
      <section className="py-6 md:py-10 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <Card className="border-border/50 hover:shadow-glow transition-all scroll-animate">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-start gap-6 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-lg flex-shrink-0">
                    <Zap className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                      Resolution
                    </h3>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      Choose the output resolution based on your workflow needs. You can generate fast previews in 2K or select 4K for high-quality production assets. This flexibility allows you to balance speed and image quality depending on whether you are testing, designing or publishing final visuals.
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-6">
                  {resolutions.map((res, index) => (
                    <div 
                      key={index}
                      className="p-6 bg-muted/20 rounded-xl border border-border/30 hover:border-primary/50 transition-all"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xl font-bold text-foreground">{res.name}</p>
                        <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                          {res.credits} credits
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{res.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Output Images */}
      <section className="py-6 md:py-10 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <Card className="border-border/50 bg-gradient-to-br from-primary/5 to-background hover:shadow-glow transition-all scroll-animate">
              <CardContent className="p-6 md:p-10">
                <div className="flex items-start gap-6 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-lg flex-shrink-0">
                    <Image className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                      Output Images
                    </h3>
                    <p className="text-base text-muted-foreground leading-relaxed mb-4">
                      Each generation produces two output images. Both images are delivered with a <strong className="text-foreground">transparent background</strong> by default. This makes them instantly usable in design tools, webshops, advertisements and layouts without any additional background removal or editing.
                    </p>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      The transparent background gives you full creative freedom to place the product on any background color, environment or composition while keeping a clean and professional visual result.
                    </p>
                  </div>
                </div>

                <div className="mt-6 p-6 bg-card/50 backdrop-blur rounded-xl border border-border/30">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
                      <Check className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Transparent Background Included</p>
                      <p className="text-sm text-muted-foreground">Ready for any design workflow, webshop or campaign asset</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Create Once, Launch Anywhere */}
      <PlatformsSection />

      {/* CTA Section */}
      <section className="py-12 md:py-16 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center scroll-animate">
            <h2 className="text-3xl md:text-5xl font-bold text-header-dark mb-6">
              Ready To Create <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                Professional Flat Lays
              </span>
              ?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Start generating studio-quality flat lay photography for your fashion brand today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth?mode=signup">
                <Button size="lg" className="bg-offer hover:shadow-glow text-offer-foreground border-0 w-full sm:w-auto">
                  Start for €1
                </Button>
              </Link>
              <Link to="/flatlay-studio">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Learn More About Flat Lay Studio
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default KnowledgeBaseFlatlay;
