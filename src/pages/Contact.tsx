import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, MapPin, Send } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import TestimonialsSection from "@/components/TestimonialsSection";
import { useScrollAnimationInit } from "@/hooks/useScrollAnimationInit";
import ScrollToHash from "@/components/ScrollToHash";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import cetaphilLogo from "@/assets/cetaphil-logo.png";
import nimaniLogo from "@/assets/nimani-logo.png";
import welhofLogo from "@/assets/welhof-logo.png";
import lothLogo from "@/assets/loth-logo.png";
import curlyGirlLogo from "@/assets/curly-girl-logo.png";
import rbLogo from "@/assets/rb-logo.png";
import { Link } from "react-router-dom";
import PageMeta from "@/components/PageMeta";
const contactSchema = z.object({
  name: z.string().trim().min(1, {
    message: "Name is required"
  }).max(100, {
    message: "Name must be less than 100 characters"
  }),
  email: z.string().trim().email({
    message: "Invalid email address"
  }).max(255, {
    message: "Email must be less than 255 characters"
  }),
  company: z.string().trim().min(1, {
    message: "Company is required"
  }).max(100, {
    message: "Company name must be less than 100 characters"
  }),
  role: z.string().trim().max(100, {
    message: "Role must be less than 100 characters"
  }).optional(),
  message: z.string().trim().max(1000, {
    message: "Message must be less than 1000 characters"
  }).optional()
});
type ContactFormData = z.infer<typeof contactSchema>;
const Contact = () => {
  useScrollAnimationInit();
  const {
    toast
  } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    company: "",
    role: "",
    message: ""
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ContactFormData, string>>>({});
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const {
      name,
      value
    } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name as keyof ContactFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    try {
      const validatedData = contactSchema.parse(formData);
      const {
        data,
        error
      } = await supabase.functions.invoke("send-contact-email", {
        body: validatedData
      });
      if (error) throw error;

      // Push dataLayer event for Contact Us form
      const { pushFormSubmitEvent } = await import("@/lib/gtm-datalayer");
      pushFormSubmitEvent("contact_us");

      toast({
        title: "Message sent successfully!",
        description: "We'll get back to you within 1-3 business days."
      });
      setFormData({
        name: "",
        email: "",
        company: "",
        role: "",
        message: ""
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<Record<keyof ContactFormData, string>> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof ContactFormData] = err.message;
          }
        });
        setErrors(fieldErrors);
        toast({
          title: "Validation error",
          description: "Please check the form fields and try again.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to send message. Please try again later.",
          variant: "destructive"
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  return <div className="min-h-screen bg-background">
      <PageMeta title="Contact Floowy for support with AI marketing content | Floowy" description="Contact our team for questions or demo access. Learn how Floowy helps brands create marketing visuals, concepts and photoshoots with AI power." keywords="contact Floowy, AI content support, marketing AI demo" canonicalUrl="https://floowy.ai/contact" breadcrumbs={[{
      name: "Home",
      url: "https://floowy.ai"
    }, {
      name: "Contact",
      url: "https://floowy.ai/contact"
    }]} />
      <ScrollToHash />
      <Navigation />

      <section className="py-20 md:py-24 bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center scroll-animate">
            <h1 className="text-4xl md:text-6xl font-bold text-header-dark mb-6">
              Get In Touch With <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Floowy.ai</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              Want to learn how Floowy.ai can help you create marketing content faster and smarter with the power of AI? Our team is happy to show you exactly how the tool works and how it can fit into your marketing process.
            </p>
          </div>
        </div>
      </section>

      <section className="pt-0 pb-12 md:pb-16 -mt-8 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 scroll-animate">
              <Card className="bg-card/50 backdrop-blur border-border/50 hover:shadow-glow transition-all">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">Email Us</h3>
                  <a href="mailto:hello@floowy.ai" className="text-primary hover:underline">
                    hello@floowy.ai
                  </a>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur border-border/50 hover:shadow-glow transition-all">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">Visit Us</h3>
                  <a href="https://maps.app.goo.gl/yJxPrX7T1qc4V6iAA" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                    Asterweg 20K2, 1031 HN Amsterdam
                  </a>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section id="message" className="py-8 bg-background scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8 scroll-animate">
              <h2 className="text-3xl md:text-5xl font-bold text-header-dark mb-3">
                Send Us A <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Message</span>
              </h2>
              <p className="text-muted-foreground">
                We'll get back to you within 1-3 business days
              </p>
            </div>

            <Card className="border-border/50 shadow-elegant scroll-scale">
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
                      <Input id="role" name="role" type="text" placeholder="e.g., Marketing Manager" value={formData.role} onChange={handleInputChange} className={errors.role ? "border-destructive" : ""} />
                      {errors.role && <p className="text-sm text-destructive">{errors.role}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-foreground">
                      Message / Comments
                    </Label>
                    <Textarea id="message" name="message" placeholder="Anything specific you'd like us to cover in the demo?" value={formData.message} onChange={handleInputChange} className={`min-h-[120px] ${errors.message ? "border-destructive" : ""}`} maxLength={1000} />
                    {errors.message && <p className="text-sm text-destructive">{errors.message}</p>}
                    <p className="text-xs text-muted-foreground">
                      {formData.message?.length || 0}/1000 characters
                    </p>
                  </div>

                  <Button type="submit" size="lg" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow" disabled={isSubmitting}>
                    {isSubmitting ? <>Sending...</> : <>
                        Get In Touch
                        <Send className="w-4 h-4 ml-2" />
                      </>}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8 md:py-12 bg-muted/30">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-header-dark mb-8 md:mb-12 px-4 scroll-animate">Trusted By 100+ Brands With €10m In Revenue<span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">€10m</span> in revenue
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-6 lg:gap-8 px-4">
            <img src={cetaphilLogo} alt="Cetaphil" className="h-6 sm:h-8 md:h-10 lg:h-12 w-auto opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition-all flex-shrink-0" loading="lazy" decoding="async" />
            <div className="h-6 sm:h-8 w-px bg-border/50"></div>
            <img src={nimaniLogo} alt="Nimani Real Estate" className="h-6 sm:h-8 md:h-10 lg:h-12 w-auto opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition-all flex-shrink-0" loading="lazy" decoding="async" />
            <div className="h-6 sm:h-8 w-px bg-border/50"></div>
            <img src={welhofLogo} alt="Welhof" className="h-6 sm:h-8 md:h-10 lg:h-12 w-auto opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition-all flex-shrink-0" loading="lazy" decoding="async" />
            <div className="h-6 sm:h-8 w-px bg-border/50"></div>
            <img src={lothLogo} alt="Loth" className="h-6 sm:h-8 md:h-10 lg:h-12 w-auto opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition-all flex-shrink-0" loading="lazy" decoding="async" />
            <div className="h-6 sm:h-8 w-px bg-border/50"></div>
            <img src={curlyGirlLogo} alt="Curly Girl Movement" className="h-6 sm:h-8 md:h-10 lg:h-12 w-auto opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition-all flex-shrink-0" loading="lazy" decoding="async" />
            <div className="h-6 sm:h-8 w-px bg-border/50"></div>
            <img src={rbLogo} alt="RB" className="h-6 sm:h-8 md:h-10 lg:h-12 w-auto opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition-all flex-shrink-0" loading="lazy" decoding="async" />
          </div>
        </div>
      </section>

      <TestimonialsSection />

      <section className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-primary/10 via-accent/20 to-primary-glow/10 rounded-3xl p-6 md:p-12 text-center border border-primary/20 scroll-scale">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Ready to Transform Your Content?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Start creating professional visual content today
          </p>
          <Link to="/auth?mode=signup">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow text-lg px-8 h-14">
              Start for €1
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>;
};
export default Contact;