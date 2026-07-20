import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Sparkles, TrendingUp, Users } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import TestimonialsSection from "@/components/TestimonialsSection";
import { useScrollAnimationInit } from "@/hooks/useScrollAnimationInit";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import nimaniLogo from "@/assets/logo-nimani.png";
import welhofLogo from "@/assets/logo-welhof.png";
import lothLogo from "@/assets/logo-loth-fabenim.png";
import curlyGirlLogo from "@/assets/logo-curlygirl.png";
import cetaphilLogo from "@/assets/logo-cetaphil.png";
import marcelsLogo from "@/assets/logo-marcels.png";
import iconAmsterdamLogo from "@/assets/logo-icon-amsterdam.png";
import { Link } from "react-router-dom";
import PageMeta from "@/components/PageMeta";

const demoRequestSchema = z.object({
  name: z.string()
    .trim()
    .min(1, { message: "Name is required" })
    .max(100, { message: "Name must be less than 100 characters" }),
  email: z.string()
    .trim()
    .email({ message: "Invalid email address" })
    .max(255, { message: "Email must be less than 255 characters" }),
  company: z.string()
    .trim()
    .min(1, { message: "Company is required" })
    .max(100, { message: "Company name must be less than 100 characters" }),
  role: z.string()
    .trim()
    .max(100, { message: "Role must be less than 100 characters" })
    .optional(),
  message: z.string()
    .trim()
    .max(1000, { message: "Message must be less than 1000 characters" })
    .optional(),
});

type DemoRequestFormData = z.infer<typeof demoRequestSchema>;

const RequestDemo = () => {
  useScrollAnimationInit();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<DemoRequestFormData>({
    name: "",
    email: "",
    company: "",
    role: "",
    message: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof DemoRequestFormData, string>>>({});

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof DemoRequestFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      const validatedData = demoRequestSchema.parse(formData);

      const { data, error } = await supabase.functions.invoke("send-demo-request", {
        body: validatedData,
      });

      if (error) throw error;

      // Push dataLayer event for demo request form
      const { pushFormSubmitEvent } = await import("@/lib/gtm-datalayer");
      pushFormSubmitEvent("demo_request");

      toast({
        title: "Demo request submitted!",
        description: "We'll get back to you within 1-3 business days to schedule your session.",
      });

      setFormData({
        name: "",
        email: "",
        company: "",
        role: "",
        message: "",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<Record<keyof DemoRequestFormData, string>> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof DemoRequestFormData] = err.message;
          }
        });
        setErrors(fieldErrors);
        toast({
          title: "Validation error",
          description: "Please check the form fields and try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to submit request. Please try again later.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageMeta 
        title="Submit your AI content demo request and start creating | Floowy"
        description="Send your AI content demo request and discover how Floowy helps create marketing visuals, photoshoots and concepts with speed and consistency."
        keywords="AI content demo request, Floowy demo, marketing content demo, AI marketing demo"
        canonicalUrl="https://floowy.ai/request-demo"
        breadcrumbs={[
          { name: "Home", url: "https://floowy.ai" },
          { name: "Request Demo", url: "https://floowy.ai/request-demo" }
        ]}
      />
      <Navigation />

      {/* Hero Section */}
      <section className="py-14 md:py-[68px] bg-gradient-to-b from-primary/5 via-background to-background relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(152_80%_65%_/_0.1),transparent_50%)]" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center scroll-animate">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-sm font-medium text-primary mb-6">
              <Play className="w-4 h-4" />
              See it in action
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-header-dark mb-6">
              See How <span className="text-primary">Floowy.ai</span> Transforms Your Marketing
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
              See how Floowy.ai can help you create marketing content faster and smarter with the power of AI. Our platform enables companies to produce on-brand campaigns, social content, and visuals in a fraction of the time.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-8 md:py-11 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 scroll-animate">
              <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 hover:shadow-glow transition-all">
                <CardContent className="p-8 text-center">
                  <div className="w-14 h-14 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">Personalized Demo</h3>
                  <p className="text-muted-foreground">
                    Get a tailored walkthrough of how Floowy.ai fits your specific marketing needs
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 hover:shadow-glow transition-all">
                <CardContent className="p-8 text-center">
                  <div className="w-14 h-14 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">Proven Results</h3>
                  <p className="text-muted-foreground">
                    See real examples of brands increasing conversion rates by up to 40%
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 hover:shadow-glow transition-all">
                <CardContent className="p-8 text-center">
                  <div className="w-14 h-14 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">Expert Guidance</h3>
                  <p className="text-muted-foreground">
                    Our team will show you exactly how to integrate AI into your workflow
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Request Form Section */}
      <section className="py-8 md:py-11 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-10 scroll-animate">
              <h2 className="text-3xl md:text-5xl font-bold text-header-dark mb-4">
                Request Your <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Personal</span> Demo
              </h2>
              <p className="text-muted-foreground text-lg">
                During your personal demo, our team will show you exactly how the tool works and how it can fit seamlessly into your marketing process. Once you submit the form, we'll get back to you within 1-3 business days to schedule your session.
              </p>
            </div>

            <Card className="border-border/50 shadow-elegant scroll-scale">
              <CardContent className="p-8 md:p-10">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-foreground">
                        Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        placeholder="Your full name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className={errors.name ? "border-destructive" : ""}
                        required
                      />
                      {errors.name && (
                        <p className="text-sm text-destructive">{errors.name}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-foreground">
                        Business Email <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="your.email@company.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={errors.email ? "border-destructive" : ""}
                        required
                      />
                      {errors.email && (
                        <p className="text-sm text-destructive">{errors.email}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="company" className="text-foreground">
                        Company <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="company"
                        name="company"
                        type="text"
                        placeholder="Your company name"
                        value={formData.company}
                        onChange={handleInputChange}
                        className={errors.company ? "border-destructive" : ""}
                        required
                      />
                      {errors.company && (
                        <p className="text-sm text-destructive">{errors.company}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="role" className="text-foreground">
                        Role / Job Title
                      </Label>
                      <Input
                        id="role"
                        name="role"
                        type="text"
                        placeholder="e.g., Marketing Manager"
                        value={formData.role}
                        onChange={handleInputChange}
                        className={errors.role ? "border-destructive" : ""}
                      />
                      {errors.role && (
                        <p className="text-sm text-destructive">{errors.role}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-foreground">
                      Message / Comments
                    </Label>
                    <Textarea
                      id="message"
                      name="message"
                      placeholder="Anything specific you'd like us to cover in the demo?"
                      value={formData.message}
                      onChange={handleInputChange}
                      className={`min-h-[120px] ${errors.message ? "border-destructive" : ""}`}
                      maxLength={1000}
                    />
                    {errors.message && (
                      <p className="text-sm text-destructive">{errors.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formData.message?.length || 0}/1000 characters
                    </p>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow text-lg h-14"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>Submitting...</>
                    ) : (
                      <>
                        <Play className="w-5 h-5 mr-2" />
                        Show me how it works
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Trusted Brands Section */}
      <section className="container mx-auto px-4 py-11 md:py-14 bg-background">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-header-dark mb-8 md:mb-12 px-4 scroll-animate">
            Trusted by 100+ brands with <span className="text-primary">€10m</span> in revenue
          </h2>
          <div className="relative overflow-hidden max-w-4xl mx-auto">
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-background to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent z-10" />
            <div className="flex items-center gap-8 animate-[scroll-left_15s_linear_infinite] w-max">
              <img src={iconAmsterdamLogo} alt="ICON Amsterdam" className="h-10 lg:h-12 w-auto opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition-all shrink-0" loading="lazy" decoding="async" />
              <img src={nimaniLogo} alt="Nimani" className="h-8 lg:h-10 w-auto opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition-all shrink-0" loading="lazy" decoding="async" />
              <img src={welhofLogo} alt="Welhof" className="h-8 lg:h-10 w-auto opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition-all shrink-0" loading="lazy" decoding="async" />
              <img src={lothLogo} alt="Loth Fabernim" className="h-8 lg:h-10 w-auto opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition-all shrink-0" loading="lazy" decoding="async" />
              <img src={curlyGirlLogo} alt="CurlyGirl" className="h-8 lg:h-10 w-auto opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition-all shrink-0" loading="lazy" decoding="async" />
              <img src={cetaphilLogo} alt="Cetaphil" className="h-8 lg:h-10 w-auto opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition-all shrink-0" loading="lazy" decoding="async" />
              <img src={marcelsLogo} alt="Marcels Green Soap" className="h-8 lg:h-10 w-auto opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition-all shrink-0" loading="lazy" decoding="async" />
              <img src={iconAmsterdamLogo} alt="ICON Amsterdam" className="h-10 lg:h-12 w-auto opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition-all shrink-0" loading="lazy" decoding="async" />
              <img src={nimaniLogo} alt="Nimani" className="h-8 lg:h-10 w-auto opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition-all shrink-0" loading="lazy" decoding="async" />
              <img src={welhofLogo} alt="Welhof" className="h-8 lg:h-10 w-auto opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition-all shrink-0" loading="lazy" decoding="async" />
              <img src={lothLogo} alt="Loth Fabernim" className="h-8 lg:h-10 w-auto opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition-all shrink-0" loading="lazy" decoding="async" />
              <img src={curlyGirlLogo} alt="CurlyGirl" className="h-8 lg:h-10 w-auto opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition-all shrink-0" loading="lazy" decoding="async" />
              <img src={cetaphilLogo} alt="Cetaphil" className="h-8 lg:h-10 w-auto opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition-all shrink-0" loading="lazy" decoding="async" />
              <img src={marcelsLogo} alt="Marcels Green Soap" className="h-8 lg:h-10 w-auto opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition-all shrink-0" loading="lazy" decoding="async" />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-primary/10 via-accent/20 to-primary-glow/10 rounded-3xl p-6 md:p-12 text-center border border-primary/20">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            <span className="text-header-dark">Ready To Transform Your</span> <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Content?</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Start creating professional visual content today
          </p>
           <Link to="/auth?mode=signup">
            <Button size="lg" className="bg-offer text-offer-foreground hover:bg-offer-hover shadow-glow text-lg px-8 h-14">
              Start for €1
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default RequestDemo;
