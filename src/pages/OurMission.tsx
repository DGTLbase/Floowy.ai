import { Card, CardContent } from "@/components/ui/card";
import { Target, Eye, Leaf, Package, Truck, Zap, Trash2, CloudOff } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PlatformsSection from "@/components/PlatformsSection";
import { useScrollAnimationInit } from "@/hooks/useScrollAnimationInit";
import PageMeta from "@/components/PageMeta";

import IndustriesHighlightSection from "@/components/IndustriesHighlightSection";
const OurMission = () => {
  useScrollAnimationInit();
  
  const sustainabilityFactors = [
    {
      title: "Raw materials",
      description: "No physical props, decor or plastic-based materials are needed.",
      Icon: Package,
    },
    {
      title: "Transport",
      description: "No travel or shipping since everything is produced digitally.",
      Icon: Truck,
    },
    {
      title: "Energy use",
      description: "While data centers consume energy, the total use is far lower than traditional studio setups.",
      Icon: Zap,
    },
    {
      title: "Waste",
      description: "No physical waste or disposable materials are created.",
      Icon: Trash2,
    },
    {
      title: "CO₂ emissions",
      description: "Overall emissions are significantly lower compared to standard shoots.",
      Icon: CloudOff,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <PageMeta 
        title="Our mission to improve creative marketing content with AI | Floowy"
        description="Read how our mission focuses on transforming marketing content with AI. We help brands produce visuals and concepts faster and more efficiently."
        keywords="Floowy mission, AI marketing vision, sustainable content creation, AI content mission"
        canonicalUrl="https://floowy.ai/our-mission"
        breadcrumbs={[
          { name: "Home", url: "https://floowy.ai" },
          { name: "Our Mission", url: "https://floowy.ai/our-mission" }
        ]}
      />
      <Navigation />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-14 md:py-[68px]">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-header-dark leading-tight">
            Our <span className="text-primary">Mission</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
            At Floowy.ai, we believe in shaping the future of marketing responsibly.
          </p>
        </div>
      </section>

      {/* Vision and Mission Cards */}
      <section className="container mx-auto px-4 pt-2 pb-8 md:pt-4 md:pb-11">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Mission Card */}
          <Card className="border-border/50 shadow-lg hover:shadow-glow transition-all">
            <CardContent className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <Target className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-3xl font-bold text-primary">Mission</h2>
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Our mission is to make high-performing, sustainable content creation accessible to everyone — from startups to global brands.
              </p>
            </CardContent>
          </Card>

          {/* Vision Card */}
          <Card className="border-border/50 shadow-lg hover:shadow-glow transition-all">
            <CardContent className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <Eye className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-3xl font-bold text-primary">Vision</h2>
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Our vision is to help brands grow through smarter, greener, and more creative content production.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Sustainability Section */}
      <section className="container mx-auto px-4 py-8 md:py-11 bg-gradient-card">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-sm font-medium text-primary mb-6">
                <Leaf className="w-4 h-4" />
                Sustainable Innovation
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-header-dark mb-6">
                A Smarter And More <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Sustainable</span> Way To Create
              </h2>
            </div>
            <p className="text-lg text-muted-foreground leading-relaxed text-left">
              We know that AI is not without its environmental challenges. The servers and data centers that power artificial intelligence consume significant amounts of energy and water for cooling, which contributes to a measurable carbon footprint. However, when compared to traditional content production, AI offers a much more sustainable path forward.
            </p>
          </div>

          <div className="bg-card/50 border border-border/50 rounded-3xl p-8 md:p-12 mb-12">
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              Traditional photoshoots require extensive logistics such as transporting teams, equipment and models, powering studio lights, using single-use props and backdrops, and sometimes even flying people across countries. Each of these steps consumes large amounts of energy and resources, generating substantial waste and emissions.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              By contrast, AI-driven production removes most of these factors.
            </p>
          </div>

          {/* Sustainability Factors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-12">
            {sustainabilityFactors.map((factor, index) => (
              <Card key={index} className="bg-gradient-to-br from-primary to-primary-glow border-primary/20 hover:shadow-glow transition-all">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-3 flex items-center justify-center bg-white/20 rounded-full">
                    <factor.Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{factor.title}</h3>
                  <p className="text-sm text-white/90">{factor.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="bg-primary/10 border border-primary/20 rounded-3xl p-8 text-center">
            <p className="text-lg text-foreground font-medium">
              In short, AI replaces physical production with a cleaner digital workflow. The result is lower emissions, less waste and a more responsible way to produce high-quality marketing visuals.
            </p>
          </div>
        </div>
      </section>

      {/* Commitment Section */}
      <section className="container mx-auto px-4 py-8 md:py-11">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold text-header-dark mb-6">
              Our <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Commitment</span>
            </h2>
          </div>

          <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
            <p>
              Floowy.ai was founded by marketers with more than 15 years of experience in online marketing. We understand the effort and cost involved in creating strong and consistent campaigns. Our mission is to make that process smarter, faster and more inclusive by enabling every company, regardless of size or budget, to produce the best-performing content possible.
            </p>
            <p>
              We continuously improve our AI systems and partnerships to reduce environmental impact even further. This includes working with data centers that prioritize renewable energy and efficient cooling systems, while educating our users about responsible content production.
            </p>
            <p className="font-semibold text-foreground text-xl">
              Our vision is a world where great marketing does not come at the expense of the environment. With Floowy.ai, brands can create impactful content that drives growth, builds trust and contributes to a more sustainable digital future.
            </p>
          </div>
        </div>
      </section>

      <PlatformsSection />

      <IndustriesHighlightSection />
      <Footer />
    </div>
  );
};

export default OurMission;
