import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Check, Search, BarChart3, Eye, MessageSquare, Target, Zap, TrendingUp, Globe, Brain, ArrowRight, ChevronRight } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Send } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import TestimonialsSection from "@/components/TestimonialsSection";
import { useScrollAnimationInit } from "@/hooks/useScrollAnimationInit";
import MetaTags from "@/components/MetaTags";
import StructuredData from "@/components/StructuredData";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import tiktokLogo from "@/assets/logo-tiktok-new.png";
import metaLogo from "@/assets/logo-meta-new.png";
import logoImage from "@/assets/floowy-logo.png";

const contactSchema = z.object({
  name: z.string().trim().min(1, { message: "Name is required" }).max(100),
  email: z.string().trim().email({ message: "Invalid email address" }).max(255),
  company: z.string().trim().min(1, { message: "Company is required" }).max(100),
  role: z.string().trim().max(100).optional(),
  message: z.string().trim().max(1000).optional(),
});
type ContactFormData = z.infer<typeof contactSchema>;

const SocialMediaScraper = () => {
  useScrollAnimationInit();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ContactFormData>({
    name: "", email: "", company: "", role: "", message: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ContactFormData, string>>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof ContactFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    try {
      const validatedData = contactSchema.parse(formData);
      const { error } = await supabase.functions.invoke("send-contact-email", { body: validatedData });
      if (error) throw error;
      const { pushFormSubmitEvent } = await import("@/lib/gtm-datalayer");
      pushFormSubmitEvent("social_media_scraper_inquiry");
      toast({ title: "Message sent successfully!", description: "We'll get back to you within 1-3 business days." });
      setFormData({ name: "", email: "", company: "", role: "", message: "" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<Record<keyof ContactFormData, string>> = {};
        error.errors.forEach(err => {
          if (err.path[0]) fieldErrors[err.path[0] as keyof ContactFormData] = err.message;
        });
        setErrors(fieldErrors);
        toast({ title: "Validation error", description: "Please check the form fields.", variant: "destructive" });
      } else {
        toast({ title: "Error", description: "Failed to send message. Please try again.", variant: "destructive" });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const capabilities = [
    {
      icon: Search,
      title: "Social Media Scraping",
      description: "Collect organic posts and paid ads based on keywords, accounts, or advertisements across TikTok, Facebook and Instagram.",
      details: ["Keyword & account-based search", "Country selection & date range", "Customizable result volume", "Cross-platform coverage"],
    },
    {
      icon: BarChart3,
      title: "Performance Intelligence",
      description: "Extract engagement data and assign an internally developed Virality Score to instantly rank top-performing content.",
      details: ["Likes, comments, shares & views", "Caption & post type analysis", "Proprietary Virality Score", "Instant performance ranking"],
    },
    {
      icon: Eye,
      title: "Deep Post Analysis",
      description: "Break down every post to understand what makes it work — from the visual hook to the content structure and key themes.",
      details: ["Visual hook identification", "Content structure breakdown", "Strengths & improvement areas", "Actionable lessons learned"],
    },
    {
      icon: MessageSquare,
      title: "Comment & Sentiment Analysis",
      description: "Analyze audience reactions to uncover pain points, objections, frequently asked questions and real market feedback.",
      details: ["Sentiment scoring", "Frequently asked questions", "Audience pain points", "Market feedback summaries"],
    },
    {
      icon: Target,
      title: "Competitive Intelligence",
      description: "Identify gaps competitors leave open, discover winning formats faster and validate creative direction with data.",
      details: ["Competitor gap analysis", "Winning format discovery", "Creative direction validation", "Data-backed strategies"],
    },
    {
      icon: TrendingUp,
      title: "Ad Intelligence Analysis",
      description: "Analyze paid advertisements for targeting signals, CTA usage, creative themes and strategic performance indicators.",
      details: ["Target audience signals", "CTA & caption strategy", "Creative theme analysis", "Strategic recommendations"],
    },
  ];

  const evolutionBriefItems = [
    { icon: Brain, title: "Psychological Anchor Analysis", description: "Identify the psychological triggers that drive audience engagement and purchase behavior." },
    { icon: Zap, title: "Version 2.0 Direction", description: "Concrete improvement paths for the next iteration of your content strategy." },
    { icon: ArrowRight, title: "Adaptive Scripting", description: "AI-powered scripting recommendations tailored to your brand voice and audience." },
    { icon: Target, title: "Optimized CTA Strategy", description: "Strategic call-to-action suggestions based on proven performance patterns." },
  ];

  const faqs = [
    { q: "What is the Social Media Intelligence & Scraper?", a: "The Social Media Intelligence & Scraper is a consultancy-based analysis tool that collects and analyzes organic posts and advertisements across platforms like TikTok, Facebook and Instagram. It transforms social media data into actionable marketing and creative insights." },
    { q: "Is this tool available inside the Floowy platform?", a: "No. This tooling is offered exclusively as a consultancy service and is not directly available within the Floowy platform. Insights are delivered through strategic analysis and expert guidance." },
    { q: "What kind of social media data can be analyzed?", a: "The scraper analyzes both organic content and paid advertisements based on keywords, accounts or ads. Performance data such as likes, comments, shares, views and captions are collected and evaluated using an internal virality scoring model." },
    { q: "Can I analyze competitors using this tool?", a: "Yes. The tool allows brands to analyze competitor content performance to identify winning formats, missed opportunities and market gaps that can be leveraged for future campaigns." },
    { q: "What insights do you extract from posts and videos?", a: "Each analyzed post includes insights such as the visual hook, content structure, theme, strengths, improvement opportunities and key learnings. This helps brands understand why certain content performs better than others." },
    { q: "Does the tool analyze audience sentiment and comments?", a: "Yes. The system performs sentiment and comment analysis to uncover audience questions, objections, recurring pain points and overall feedback trends. This provides deeper understanding beyond engagement metrics." },
    { q: "Can advertisements also be analyzed?", a: "Yes. Paid social advertisements are analyzed for targeting signals, creative structure, CTA usage, messaging strategy and performance indicators. This helps optimize future advertising campaigns based on proven concepts." },
    { q: "What is a Creative Evolution Brief?", a: "A Creative Evolution Brief translates performance data into actionable creative improvements. It includes psychological triggers, optimization opportunities, scripting recommendations and improved CTA strategies for future content iterations." },
    { q: "How can businesses use these insights?", a: "Insights can be used to improve organic content strategies, optimize paid advertising, validate campaign concepts and identify untapped opportunities within competitive markets." },
  ];

  return (
    <div className="min-h-screen bg-background scroll-smooth">
      <MetaTags
        title="Social media scraper tool for competitive intelligence | Floowy"
        description="Analyze organic content and paid ads across TikTok, Facebook and Instagram. Transform social media data into actionable creative and marketing insights."
        keywords="social media scraper tool, social media intelligence tool, social media analytics ai, social media competitor analysis tool, social media insight tool, social media content analysis ai, social media data scraping tool, social media performance analysis, ai social media analysis, social media trend analysis tool"
        canonicalUrl="https://floowy.ai/social-media-scraper"
      />
      <StructuredData type="organization" />
      <StructuredData
        type="breadcrumb"
        breadcrumbs={[
          { name: "Home", url: "https://floowy.ai" },
          { name: "Social Media Scraper", url: "https://floowy.ai/social-media-scraper" },
        ]}
      />
      <Navigation />

      {/* Hero Section */}
      <section className="pt-20 pb-12 md:pt-28 md:pb-16 bg-gradient-to-b from-primary/5 via-background to-background animate-fade-in">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-6">
              <Globe className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Consultancy Service</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-header-dark">
              Turn Social Media Data Into <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                Strategic Intelligence
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-4 max-w-3xl mx-auto">
              Analyze organic content and paid advertisements across TikTok, Facebook and Instagram. Understand what performs, why it performs, and where the opportunities are.
            </p>
            <p className="text-base text-muted-foreground/80 mb-8 max-w-2xl mx-auto">
              Offered as a consultancy service — not available inside the Floowy platform.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/contact">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow text-lg px-8 h-14 hover-scale">
                  Request Social Media Insights
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <a href="#contact-form">
                <Button size="lg" variant="outline" className="text-lg px-8 h-14 hover-scale border-border">
                  Book Consultancy Call
                </Button>
              </a>
            </div>

            {/* Supported platforms */}
            <div className="flex items-center justify-center gap-6 mt-12 opacity-60">
              <img src={tiktokLogo} alt="TikTok" className="h-8 w-auto" loading="lazy" decoding="async" />
              <img src={metaLogo} alt="Meta (Facebook & Instagram)" className="h-8 w-auto" loading="lazy" decoding="async" />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16 animate-fade-in">
              <h2 className="text-3xl md:text-5xl font-bold mb-4 text-header-dark">
                From Raw Data To <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                  Actionable Intelligence
                </span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Our social media intelligence system transforms platform data into strategic creative and marketing insights.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { step: "01", title: "Define Scope", desc: "Choose keywords, accounts or ads to analyze across supported platforms." },
                { step: "02", title: "Scrape & Collect", desc: "Gather organic posts and paid advertisements with full engagement data." },
                { step: "03", title: "Analyze & Score", desc: "Deep analysis with virality scoring, sentiment mapping and trend identification." },
                { step: "04", title: "Strategic Brief", desc: "Receive a Creative Evolution Brief with actionable next steps for your campaigns." },
              ].map((item, i) => (
                <div key={i} className="relative text-center animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className="text-6xl font-black text-primary/10 mb-2">{item.step}</div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                  {i < 3 && (
                    <ArrowRight className="hidden md:block absolute top-8 -right-3 w-6 h-6 text-primary/30" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Core Capabilities */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16 animate-fade-in">
              <h2 className="text-3xl md:text-5xl font-bold mb-4 text-header-dark">
                Core <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                  Capabilities
                </span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                A comprehensive intelligence system built to uncover what content works, why it works, and how to leverage those insights.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {capabilities.map((cap, i) => (
                <Card key={i} className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-glow hover:border-primary/30 transition-all duration-300 animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                      <cap.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">{cap.title}</h3>
                    <p className="text-muted-foreground text-sm mb-4">{cap.description}</p>
                    <div className="space-y-2">
                      {cap.details.map((detail, j) => (
                        <div key={j} className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-primary flex-shrink-0" />
                          <span className="text-sm text-foreground">{detail}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link to="/contact">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow text-lg px-8 h-14 hover-scale">
                  Get Insights
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Creative Evolution Brief */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16 animate-fade-in">
              <h2 className="text-3xl md:text-5xl font-bold mb-4 text-header-dark">
                Creative Evolution <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                  Brief
                </span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Every analysis concludes with a Creative Evolution Brief — translating performance data into concrete creative iterations for future campaigns.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {evolutionBriefItems.map((item, i) => (
                <Card key={i} className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-glow transition-all animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                  <CardContent className="p-6 flex items-start gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground mb-1">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16 animate-fade-in">
              <h2 className="text-3xl md:text-5xl font-bold mb-4 text-header-dark">
                Intelligence That <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                  Drives Results
                </span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: "Organic Content Strategy", desc: "Understand what resonates with audiences and build content strategies backed by real performance data.", icon: TrendingUp },
                { title: "Paid Campaign Optimization", desc: "Analyze competing ads to uncover winning creative formats, targeting approaches and messaging strategies.", icon: Target },
                { title: "Market Positioning", desc: "Identify gaps in competitor strategies and position your brand where others fail to deliver value.", icon: Globe },
              ].map((item, i) => (
                <Card key={i} className="border-border/50 bg-gradient-to-br from-primary/5 to-accent/5 hover:shadow-glow transition-all animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                  <CardContent className="p-8 text-center">
                    <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <item.icon className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-3">{item.title}</h3>
                    <p className="text-muted-foreground text-sm">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <TestimonialsSection />

      {/* FAQ Section */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold text-center mb-12 animate-fade-in text-header-dark">
              Frequently Asked <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                Questions
              </span>
            </h2>
            <Accordion type="single" collapsible className="w-full space-y-4">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="bg-card rounded-lg border border-border px-6 hover-scale">
                  <AccordionTrigger className="text-left hover:no-underline py-6">
                    <span className="text-lg font-semibold text-foreground">{faq.q}</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-6">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section id="contact-form" className="py-16 md:py-20 bg-muted/30 scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8 animate-fade-in">
              <h2 className="text-3xl md:text-5xl font-bold text-header-dark mb-3">
                Request Social Media <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                  Insights
                </span>
              </h2>
              <p className="text-muted-foreground">
                Tell us about your brand and goals — we'll show you what intelligence we can unlock.
              </p>
            </div>

            <Card className="border-border/50 shadow-elegant">
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-foreground">
                        Name <span className="text-destructive">*</span>
                      </Label>
                      <Input id="name" name="name" type="text" placeholder="Your full name" value={formData.name} onChange={handleInputChange} className={errors.name ? "border-destructive" : ""} required />
                      {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-foreground">
                        Business Email <span className="text-destructive">*</span>
                      </Label>
                      <Input id="email" name="email" type="email" placeholder="your.email@company.com" value={formData.email} onChange={handleInputChange} className={errors.email ? "border-destructive" : ""} required />
                      {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="company" className="text-foreground">
                        Company <span className="text-destructive">*</span>
                      </Label>
                      <Input id="company" name="company" type="text" placeholder="Your company name" value={formData.company} onChange={handleInputChange} className={errors.company ? "border-destructive" : ""} required />
                      {errors.company && <p className="text-sm text-destructive">{errors.company}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role" className="text-foreground">
                        Role / Job Title
                      </Label>
                      <Input id="role" name="role" type="text" placeholder="e.g., Marketing Manager" value={formData.role} onChange={handleInputChange} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-foreground">
                      What platforms or competitors are you interested in analyzing?
                    </Label>
                    <Textarea id="message" name="message" placeholder="Tell us about your goals, target platforms, and any specific competitors or keywords you'd like analyzed..." value={formData.message} onChange={handleInputChange} className={`min-h-[120px] ${errors.message ? "border-destructive" : ""}`} maxLength={1000} />
                    {errors.message && <p className="text-sm text-destructive">{errors.message}</p>}
                    <p className="text-xs text-muted-foreground">{formData.message?.length || 0}/1000 characters</p>
                  </div>
                  <Button type="submit" size="lg" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow" disabled={isSubmitting}>
                    {isSubmitting ? "Sending..." : (
                      <>
                        Request Insights
                        <Send className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-16 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-primary-foreground mb-6">
            Stop guessing. Start knowing.
          </h2>
          <p className="text-xl text-primary-foreground/95 mb-8 max-w-2xl mx-auto">
            Transform social media data into the strategic intelligence your brand needs to outperform the competition.
          </p>
          <Link to="/contact" className="inline-block w-full sm:w-auto px-4">
            <Button
              size="lg"
              className="w-full sm:w-auto text-lg px-8 py-6 bg-background text-primary hover:bg-background/95 rounded-full font-semibold shadow-glow"
            >
              Talk to an Expert
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default SocialMediaScraper;
