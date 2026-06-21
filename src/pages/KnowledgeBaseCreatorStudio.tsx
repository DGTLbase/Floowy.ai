import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Upload, Type, Globe, Mic, Video, User, Check, Play } from "lucide-react";
import KBVideoHero from "@/components/KBVideoHero";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PlatformsSection from "@/components/PlatformsSection";
import { useScrollAnimationInit } from "@/hooks/useScrollAnimationInit";
import { Link } from "react-router-dom";
import creatorCover from "@/assets/creator-cover-new.mp4";
import PageMeta from "@/components/PageMeta";

const KnowledgeBaseCreatorStudio = () => {
  useScrollAnimationInit();

  const whenToUse = [
    "Create short-form product videos for social channels, ads or product pages",
    "Demonstrate how your product works without recording anything yourself",
    "Generate many variations for A/B testing with different creators",
    "Produce fast video content for campaigns where speed and consistency matter"
  ];

  const videoStyles = [
    "Enthusiastic Review",
    "Casual Unboxing",
    "Lifestyle Integration",
    "Personal Testimonial",
    "Quick Tutorial",
    "Before & After"
  ];

  const languages = ["English", "Dutch"];

  const videoFormats = [
    { ratio: "9:16", label: "Vertical", description: "Perfect for Stories & Reels" },
    { ratio: "1:1", label: "Square", description: "Instagram & Facebook feeds" },
    { ratio: "16:9", label: "Landscape", description: "YouTube & websites" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <PageMeta 
        title="AI creator tool guide for fast visual and asset creation | Floowy"
        description="Use the AI creator tool guide to create marketing visuals, assets and photoshoot-style content. Produce more in less time with AI assistance."
        keywords="AI creator tool guide, UGC video guide, creator content AI, marketing asset guide"
        canonicalUrl="https://floowy.ai/knowledge-base/creator-studio"
        breadcrumbs={[
          { name: "Home", url: "https://floowy.ai" },
          { name: "Knowledge Base", url: "https://floowy.ai/knowledge-base" },
          { name: "Creator Studio", url: "https://floowy.ai/knowledge-base/creator-studio" }
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
                  Creator Videos
                </span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-4xl mx-auto">
                Creator Studio allows you to generate short, natural and engaging creator style videos for your product without needing a real filming setup. You upload your product, select your preferred creator and choose a video style. The system then generates a complete vertical video with natural movement, voiceover and realistic interaction. It is designed for brands that want to produce creator-led content at scale without hiring influencers, camera crews or production teams.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* KB Video Hero */}
      <KBVideoHero toolName="Creator Studio" />

      {/* Cover Video */}
      <section className="py-6 md:py-10 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto scroll-scale">
            <div className="rounded-2xl overflow-hidden shadow-2xl border border-border/50">
              <video 
                src={creatorCover} 
                autoPlay 
                loop 
                muted 
                playsInline
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
                  Creator Studio
                </span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Creator Studio is ideal when you want to create short form product videos for social channels, ads or product pages.
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

      {/* Upload Product - With Visual */}
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
                      To begin, upload the product image you want to feature in the video. Supported file types are JPG, PNG and WebP with a maximum size of 10 MB. The image you upload will be used throughout the AI generated video, so make sure it is clear, well lit and accurately shows the product you want to introduce.
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

      {/* Product Name - With Visual */}
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
                      Enter Your Product Name
                    </h3>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      After uploading the product, enter a clear product name. This helps the system understand what the video is about and improves the relevance and accuracy of the generated voiceover and visual behavior. Use simple naming such as heels, sneakers, handbag or any descriptive product name that reflects what you are showcasing.
                    </p>
                  </div>
                </div>

                {/* Visual Example */}
                <div className="mt-6">
                  <Input
                    placeholder="e.g., Wireless Headphones, Running Shoes, Leather Handbag..."
                    className="bg-card border-border/50 text-foreground"
                    disabled
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Language Selection - With Visual */}
      <section className="py-6 md:py-10 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <Card className="border-border/50 hover:shadow-glow transition-all scroll-animate">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-start gap-6 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-lg flex-shrink-0">
                    <Globe className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                      Choose Your Language
                    </h3>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      Select the language you want the final video to be created in. Currently you can choose between English and Dutch. More languages will be added in upcoming updates. This selection influences both the voiceover and the on screen creator behavior to match the language tone and flow.
                    </p>
                  </div>
                </div>

                {/* Visual Example */}
                <div className="mt-6 grid grid-cols-2 gap-4">
                  {languages.map((lang, idx) => (
                    <button 
                      key={idx}
                      className={`p-6 bg-card rounded-xl hover:shadow-lg transition-all ${
                        idx === 0 
                          ? "border-2 border-primary" 
                          : "border border-border hover:border-primary/50"
                      }`}
                    >
                      <Globe className={`w-10 h-10 mx-auto mb-3 ${
                        idx === 0 ? "text-primary" : "text-muted-foreground"
                      }`} />
                      <p className="text-sm font-semibold text-foreground">{lang}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Voiceover Selection - With Visual and Detailed Options */}
      <section className="py-6 md:py-10 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <Card className="border-border/50 bg-gradient-to-br from-primary/5 to-background hover:shadow-glow transition-all scroll-animate">
              <CardContent className="p-6 md:p-10">
                <div className="flex items-start gap-6 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-lg flex-shrink-0">
                    <Mic className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                      Select Your Voiceover
                    </h3>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      The voiceover defines how the message in your video is delivered and determines the overall tone of your creator video. Creator Studio offers three clear options, each with its own use case.
                    </p>
                  </div>
                </div>

                {/* Visual Example - Voiceover Options */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button className="p-6 bg-card border-2 border-primary rounded-xl hover:shadow-lg transition-all">
                    <Mic className="w-10 h-10 text-primary mx-auto mb-3" />
                    <p className="text-sm font-semibold text-foreground mb-1">Auto-Generated</p>
                    <p className="text-xs text-muted-foreground">AI creates voiceover</p>
                  </button>
                  <button className="p-6 bg-card border border-border rounded-xl hover:border-primary hover:shadow-lg transition-all">
                    <Type className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm font-semibold text-foreground mb-1">Custom Text</p>
                    <p className="text-xs text-muted-foreground">Write your own script</p>
                  </button>
                  <button className="p-6 bg-card border border-border rounded-xl hover:border-primary hover:shadow-lg transition-all">
                    <Video className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm font-semibold text-foreground mb-1">No Voiceover</p>
                    <p className="text-xs text-muted-foreground">Visual content only</p>
                  </button>
                </div>

                {/* Detailed Descriptions */}
                <div className="mt-8 space-y-6">
                  {/* Auto-Generated Description */}
                  <div className="bg-card/30 rounded-xl p-6 border border-border/30">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
                        <Mic className="w-5 h-5 text-white" />
                      </div>
                      <h4 className="text-lg font-bold text-foreground">Auto-Generated</h4>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      With this option the system automatically generates a voiceover for your video based on your product name and selected video style. This is the fastest and easiest way to add a natural sounding explanation to your content without writing anything yourself. It ensures the message fits the eight second video duration and provides a well balanced, creator style narration that matches the chosen tone.
                    </p>
                  </div>

                  {/* Custom Voiceover Description */}
                  <div className="bg-card/30 rounded-xl p-6 border border-border/30">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
                        <Type className="w-5 h-5 text-white" />
                      </div>
                      <h4 className="text-lg font-bold text-foreground">Custom Voiceover Text</h4>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                      If you want full control over what is said in the video, you can enter your own voiceover script. This option is helpful when you need a very specific message, promotional line or product explanation. The text must fit within the eight second duration of the video, so it is best to keep the message short, direct and easy to understand. With custom voiceover text you maintain complete flexibility while still letting the system generate the final audio delivery.
                    </p>
                    {/* Custom Text Input Example */}
                    <Textarea
                      placeholder="Example: These wireless headphones deliver premium sound quality with up to 30 hours of battery life..."
                      className="min-h-[100px] bg-card border-border/50 text-foreground resize-none"
                      disabled
                    />
                  </div>

                  {/* No Voiceover Description */}
                  <div className="bg-card/30 rounded-xl p-6 border border-border/30">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
                        <Video className="w-5 h-5 text-white" />
                      </div>
                      <h4 className="text-lg font-bold text-foreground">No Voiceover</h4>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Choosing no voiceover removes the narration entirely and shifts the focus fully to the product and the creator's visual behavior. This option is useful for videos where you want to highlight usage, movement or emotion without spoken audio. The creator will still interact naturally with the product, but the emphasis is placed entirely on the visuals rather than the message.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Video Format - With Visual */}
      <section className="py-6 md:py-10 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <Card className="border-border/50 hover:shadow-glow transition-all scroll-animate">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-start gap-6 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-lg flex-shrink-0">
                    <Video className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                      Choose Your Video Format
                    </h3>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      At the end of the process you can select the video format that best fits your intended platform. Creator Studio supports common aspect ratios used across social media, such as 9:16 for vertical placements, 1:1 for square formats and 16:9 for wider layouts. Choosing the right format ensures your video displays correctly on the channels where you plan to publish it and helps maintain a consistent visual experience across your content.
                    </p>
                  </div>
                </div>

                {/* Visual Example */}
                <div className="mt-6 grid md:grid-cols-3 gap-4">
                  {videoFormats.map((format, idx) => (
                    <button 
                      key={idx}
                      className={`p-6 bg-card rounded-xl hover:shadow-lg transition-all ${
                        idx === 0 
                          ? "border-2 border-primary" 
                          : "border border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="text-2xl font-bold text-foreground mb-2">{format.ratio}</div>
                      <div className="text-sm font-semibold text-foreground mb-1">{format.label}</div>
                      <p className="text-xs text-muted-foreground">{format.description}</p>
                    </button>
                  ))}
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
                      Choose Your Avatar
                    </h3>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      Next, select the avatar who will appear in the video. You can choose from a range of pre built creators with different looks and visual styles, allowing you to match your video to your brand identity or target audience. If you prefer, you can upload your own model image so the same person appears consistently across your content. Uploading your own model is optional and not required. If you do not upload one, the selected avatar will be used.
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
                    Upload your own model for brand consistency across multiple videos
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Video Style - With Visual */}
      <section className="py-6 md:py-10 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <Card className="border-border/50 bg-gradient-to-br from-primary/5 to-background hover:shadow-glow transition-all scroll-animate">
              <CardContent className="p-6 md:p-10">
                <div className="flex items-start gap-6 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-lg flex-shrink-0">
                    <Play className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                      Select Your Video Style
                    </h3>
                    <p className="text-base text-muted-foreground leading-relaxed mb-4">
                      The final step is choosing the type of video you want to generate. Each style determines how the AI creator will behave in the video, how they talk, how they present the product and what kind of atmosphere the video has.
                    </p>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      You can choose between an enthusiastic review, a casual unboxing, a lifestyle integration scene, a personal testimonial, a quick tutorial or a before and after style. Each option creates a different tone and purpose, allowing you to align the video with your marketing goals.
                    </p>
                  </div>
                </div>

                <div className="bg-card/50 backdrop-blur rounded-xl p-6 border border-border/30">
                  <h4 className="text-lg font-semibold text-foreground mb-4">Available Styles</h4>
                  <div className="flex flex-wrap gap-2">
                    {videoStyles.map((style, index) => (
                      <Badge 
                        key={index}
                        variant="outline"
                        className="px-4 py-2 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 cursor-pointer transition-colors"
                      >
                        {style}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="mt-6 bg-muted/30 rounded-xl p-5 border border-border/30">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    By selecting the right combination of product, language, voiceover, avatar and video style, you can generate a complete creator video that looks professional, natural and ready to use for social channels, ads or product pages.
                  </p>
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
              Ready To Create Professional Creator Videos?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Start using Creator Studio today and generate engaging product videos at scale
            </p>
            <Link to="/tool/creator-studio">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow text-lg px-8 h-14">
                Try Creator Studio
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default KnowledgeBaseCreatorStudio;
