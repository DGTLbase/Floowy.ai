import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const contactSchema = z.object({
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

type ContactFormData = z.infer<typeof contactSchema>;

interface ContactSalesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ContactSalesModal = ({ open, onOpenChange }: ContactSalesModalProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    company: "",
    role: "",
    message: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ContactFormData, string>>>({});

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof ContactFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      // Validate form data
      const validatedData = contactSchema.parse(formData);

      // Call edge function to send email
      const { data, error } = await supabase.functions.invoke("send-contact-email", {
        body: validatedData,
      });

      if (error) throw error;

      // Push dataLayer event for Custom Plan form
      const { pushFormSubmitEvent } = await import("@/lib/gtm-datalayer");
      pushFormSubmitEvent("custom_plan");

      toast({
        title: "Message sent successfully!",
        description: "We'll get back to you within 1-3 business days.",
      });

      // Reset form and close modal
      setFormData({
        name: "",
        email: "",
        company: "",
        role: "",
        message: "",
      });
      onOpenChange(false);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<Record<keyof ContactFormData, string>> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof ContactFormData] = err.message;
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
          description: "Failed to send message. Please try again later.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            <span className="text-header-dark">Talk to </span>
            <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Sales</span>
          </DialogTitle>
          <p className="text-muted-foreground text-sm">
            We'll get back to you within 1-3 business days
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="modal-name" className="text-foreground">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="modal-name"
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
              <Label htmlFor="modal-email" className="text-foreground">
                Business Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="modal-email"
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

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="modal-company" className="text-foreground">
                Company <span className="text-destructive">*</span>
              </Label>
              <Input
                id="modal-company"
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
              <Label htmlFor="modal-role" className="text-foreground">
                Role / Job Title
              </Label>
              <Input
                id="modal-role"
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
            <Label htmlFor="modal-message" className="text-foreground">
              Message / Comments
            </Label>
            <Textarea
              id="modal-message"
              name="message"
              placeholder="Tell us about your needs and requirements..."
              value={formData.message}
              onChange={handleInputChange}
              className={`min-h-[100px] ${errors.message ? "border-destructive" : ""}`}
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
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>Sending...</>
            ) : (
              <>
                Send Message
                <Send className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ContactSalesModal;
