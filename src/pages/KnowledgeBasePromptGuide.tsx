import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Check, Lightbulb, Camera, Sun, MapPin, Eye, MessageSquare, ArrowRight } from "lucide-react";
import KBVideoHero from "@/components/KBVideoHero";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PlatformsSection from "@/components/PlatformsSection";
import { useScrollAnimationInit } from "@/hooks/useScrollAnimationInit";
import { Link } from "react-router-dom";
import PageMeta from "@/components/PageMeta";
import promptProduct from "@/assets/prompt-guide-product.png";
import promptResult from "@/assets/prompt-guide-result.jpg";
import chatgptLogo from "@/assets/chatgpt-logo.png";
import { Plus, Equal } from "lucide-react";

const KnowledgeBasePromptGuide = () => {
  useScrollAnimationInit();

  const whyPromptsPoints = [
    "Improve visual consistency",
    "Reduce regeneration cycles",
    "Increase realism",
    "Align visuals with brand positioning",
    "Improve conversion performance",
  ];

  const settingExamples = [
    "Minimal beige studio",
    "Luxury marble bathroom",
    "Urban rooftop at sunset",
  ];

  const lightingExamples = [
    "Warm golden hour sunlight",
    "Soft natural daylight",
    "Studio lighting with subtle shadows",
  ];

  const cameraExamples = [
    "Wide-angle low camera",
    "Close-up detail shot",
    "Eye-level editorial framing",
  ];

  const advancedPeopleTips = [
    "Define age",
    "Define gender",
    "Define clothing style",
    "Define action",
  ];

  const advancedCulturalTips = [
    "Mention country or city",
    "Mention environment style",
    "Mention local architecture",
  ];

  const chatGptSteps = [
    "Go to ChatGPT",
    "Explain that you are using an AI image tool",
    "Specify that you need a prompt describing the mood and setting",
    "Define a character limit (for example 200–250 characters)",
    "Clearly describe your product",
    "Specify that the prompt must include setting, lighting and composition",
  ];

  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title="AI Prompt Guide for better image generation | Floowy"
        description="Learn how to write structured, high-converting AI prompts for image generation inside Floowy. Master the prompt formula for setting, lighting and composition."
        keywords="AI prompt guide, prompt to image, best AI prompts, image generation prompts, Floowy prompt tips"
        canonicalUrl="https://floowy.ai/knowledge-base/prompt-guide"
        breadcrumbs={[
          { name: "Home", url: "https://floowy.ai" },
          { name: "Knowledge Base", url: "https://floowy.ai/knowledge-base" },
          { name: "Prompt Guide", url: "https://floowy.ai/knowledge-base/prompt-guide" },
        ]}
      />
      <Navigation />

      {/* Hero Section */}
      <section className="pt-10 md:pt-12 pb-8 md:pb-12 bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="container mx-auto px-4">
          <Link
            to="/knowledge-base"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Knowledge Base
          </Link>

          <div className="max-w-4xl">
            <Badge variant="outline" className="mb-4 text-primary border-primary/30">
              PROMPT ENGINEERING
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              Prompt Guide – <span className="text-primary">Knowledge Base</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl">
              Create better visuals with the right AI prompts
            </p>
          </div>
        </div>
      </section>

      {/* Video Hero */}
      <KBVideoHero toolName="Prompt Guide" />

      {/* Intro */}
      <section className="py-8 md:py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto scroll-fade-in">
            <p className="text-lg text-muted-foreground leading-relaxed">
              This AI Prompt Guide helps you understand how to write structured,
              high-converting prompts for image generation inside Floowy.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed mt-4">
              Whether you're using Ambience Studio, Fashion Studio or Ad Studio,
              strong AI prompts are the foundation of consistent visual output.
              The difference between average and premium results is almost always
              the clarity of your creative brief.
            </p>
            <p className="text-lg font-semibold text-foreground mt-4">
              If you want better prompt to image results, start here.
            </p>
          </div>
        </div>
      </section>

      {/* Why AI Prompts Matter */}
      <section className="py-8 md:py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto scroll-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why AI Prompts Matter
            </h2>
            <p className="text-lg text-muted-foreground mb-2">
              Your prompt is your creative brief.
            </p>
            <p className="text-muted-foreground mb-6">
              AI tools do not guess intent, they interpret structure. The clearer
              your direction, the more realistic, premium and conversion-focused
              your visuals become.
            </p>
            <Card className="border-primary/20">
              <CardContent className="p-6">
                <h3 className="font-semibold text-foreground mb-4">
                  Strong AI prompts:
                </h3>
                <div className="space-y-3">
                  {whyPromptsPoints.map((point, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Check className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <span className="text-foreground">{point}</span>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-5 font-medium">
                  The best AI prompts are structured, intentional and specific.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* The AI Prompt Formula */}
      <section className="py-8 md:py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto scroll-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              The AI Prompt Formula
            </h2>
            <p className="text-muted-foreground mb-8">
              The fastest way to write high-performing AI prompts is using this
              simple formula:
            </p>

            <div className="grid md:grid-cols-3 gap-4 mb-6">
              {[
                { icon: MapPin, label: "Setting", color: "text-green-500" },
                { icon: Sun, label: "Lighting", color: "text-amber-500" },
                { icon: Camera, label: "Camera & Composition", color: "text-blue-500" },
              ].map((item, i) => (
                <Card key={i} className="border-border hover:border-primary/40 transition-colors">
                  <CardContent className="p-6 text-center">
                    <item.icon className={`h-8 w-8 mx-auto mb-3 ${item.color}`} />
                    <h3 className="font-semibold text-foreground">{item.label}</h3>
                  </CardContent>
                </Card>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              This structure works across lifestyle images, product ads, fashion
              photography and ecommerce visuals.
            </p>
          </div>
        </div>
      </section>

      {/* Step 1 – Setting */}
      <section className="py-8 md:py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto scroll-fade-in">
            <Badge className="mb-3 bg-green-500/10 text-green-600 border-green-500/30">
              Step 1
            </Badge>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Setting
            </h2>
            <p className="text-muted-foreground mb-2">
              Always start with the environment.
            </p>
            <p className="text-muted-foreground mb-6">
              The setting defines the world around your product. It determines the
              atmosphere, emotional tone and cultural relevance.
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {settingExamples.map((ex, i) => (
                <Badge key={i} variant="outline" className="text-sm px-3 py-1.5">
                  {ex}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-muted-foreground italic">
              The stronger the setting, the more believable your prompt to image
              result becomes.
            </p>
          </div>
        </div>
      </section>

      {/* Step 2 – Lighting */}
      <section className="py-8 md:py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto scroll-fade-in">
            <Badge className="mb-3 bg-amber-500/10 text-amber-600 border-amber-500/30">
              Step 2
            </Badge>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Lighting
            </h2>
            <p className="text-muted-foreground mb-2">
              Lighting defines quality.
            </p>
            <p className="text-muted-foreground mb-6">
              It determines how premium your output feels and shapes depth,
              shadows and highlights.
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {lightingExamples.map((ex, i) => (
                <Badge key={i} variant="outline" className="text-sm px-3 py-1.5">
                  {ex}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-muted-foreground italic">
              Lighting is often the biggest difference between amateur and
              professional AI outputs.
            </p>
          </div>
        </div>
      </section>

      {/* Step 3 – Camera & Composition */}
      <section className="py-8 md:py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto scroll-fade-in">
            <Badge className="mb-3 bg-blue-500/10 text-blue-600 border-blue-500/30">
              Step 3
            </Badge>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Camera & Composition
            </h2>
            <p className="text-muted-foreground mb-2">
              Camera direction controls focus and impact.
            </p>
            <p className="text-muted-foreground mb-6">
              It determines how attention is guided toward your product and how
              premium the result feels.
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {cameraExamples.map((ex, i) => (
                <Badge key={i} variant="outline" className="text-sm px-3 py-1.5">
                  {ex}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-muted-foreground italic">
              This is where many AI prompts fail. They forget to define
              perspective.
            </p>
          </div>
        </div>
      </section>

      {/* How to Generate the Best AI Prompts */}
      <section className="py-8 md:py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto scroll-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              How to Generate the Best AI Prompts
            </h2>
            <p className="text-muted-foreground mb-6">
              Here's a practical workflow to create strong prompts quickly.
            </p>
            <Card className="border-border">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {chatGptSteps.map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-primary">{i + 1}</span>
                      </div>
                      <span className="text-foreground">{step}</span>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-6 font-medium">
                  The more structured your input, the stronger your output. That
                  is the foundation for the best AI prompts for Floowy.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Advanced Prompt Tips */}
      <section className="py-8 md:py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto scroll-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Advanced Prompt Tips
            </h2>

            <div className="grid md:grid-cols-2 gap-4 mb-8">
              <Card className="border-border">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Eye className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-foreground">
                      If you include people
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {advancedPeopleTips.map((tip, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-primary" />
                        <span className="text-sm text-muted-foreground">{tip}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-foreground">
                      If your product has cultural relevance
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {advancedCulturalTips.map((tip, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-primary" />
                        <span className="text-sm text-muted-foreground">{tip}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Example</h3>
                </div>
                <p className="text-muted-foreground italic">
                  "A 30-year-old man riding a bicycle through Amsterdam canals at
                  sunset."
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Prompt to Image Workflow Example */}
      <section className="py-8 md:py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto scroll-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Prompt to Image Workflow Example
            </h2>
            <p className="text-muted-foreground mb-8">
              See how a simple product photo transforms into a professional
              lifestyle image with the right prompt.
            </p>

            <div className="grid grid-cols-[1fr,auto,1fr,auto,1fr] gap-3 md:gap-4 items-center mb-6">
              {/* ChatGPT Logo */}
              <Card className="border-border overflow-hidden">
                <CardContent className="p-0">
                  <div className="w-full aspect-square flex items-center justify-center bg-muted/30 p-8">
                    <img
                      src={chatgptLogo}
                      alt="ChatGPT logo"
                      className="w-2/3 h-2/3 object-contain"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-3 md:p-4 text-center">
                    <Badge variant="outline" className="text-xs">GPT Prompt</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Plus sign */}
              <div className="flex items-center justify-center">
                <Plus className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground" />
              </div>

              {/* Product Image */}
              <Card className="border-border overflow-hidden">
                <CardContent className="p-0">
                  <img
                    src={promptProduct}
                    alt="Product image – Brazil football shirt"
                    className="w-full aspect-square object-cover"
                    loading="lazy"
                  />
                  <div className="p-3 md:p-4 text-center">
                    <Badge variant="outline" className="text-xs">Product Image</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Equals sign */}
              <div className="flex items-center justify-center">
                <Equal className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground" />
              </div>

              {/* AI Result */}
              <Card className="border-primary/30 overflow-hidden">
                <CardContent className="p-0">
                  <img
                    src={promptResult}
                    alt="AI generated result – model wearing Brazil shirt on street football pitch"
                    className="w-full aspect-square object-cover"
                    loading="lazy"
                  />
                  <div className="p-3 md:p-4 text-center">
                    <Badge className="bg-primary/10 text-primary border-primary/30 text-xs">
                      AI Result
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border bg-muted/50">
              <CardContent className="p-5">
                <p className="text-sm font-medium text-foreground mb-2">
                  Prompt used:
                </p>
                <p className="text-sm text-muted-foreground italic leading-relaxed">
                  "Street football pitch in Brazil, faded concrete and graffiti
                  walls, warm golden hour sunlight, vibrant urban vibe.
                  Wide-angle low camera, dynamic lifestyle composition, natural
                  shadows, authentic street energy."
                </p>
              </CardContent>
            </Card>

            <p className="text-sm text-muted-foreground mt-4 text-center font-medium">
              The more context, the more realistic the output.
            </p>
          </div>
        </div>
      </section>

      {/* Apply This Structure */}
      <section className="py-8 md:py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center scroll-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Apply This Structure Inside Floowy
            </h2>
            <p className="text-lg text-muted-foreground mb-2">
              If your direction is clear, your visuals will follow.
            </p>
            <p className="text-lg text-foreground font-semibold">
              Better prompts → better images → stronger brand presence.
            </p>
          </div>
        </div>
      </section>

      {/* Create Once, Launch Anywhere */}
      <PlatformsSection />

      {/* CTA Section */}
      <section className="py-8 md:py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-gradient-to-br from-primary/10 via-accent/20 to-primary-glow/10 rounded-3xl p-6 md:p-12 text-center border border-primary/20 scroll-scale">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Ready To Create Stunning Visuals?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Start now for €1 and apply the prompt formula inside
              Floowy
            </p>
            <Link to="/auth">
              <Button
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow text-lg px-8 h-14"
              >
                Start for €1
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default KnowledgeBasePromptGuide;
