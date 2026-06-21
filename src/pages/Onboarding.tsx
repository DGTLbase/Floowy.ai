import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

const onboardingSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  role: z.string().min(1, "Please select a role"),
  companyName: z.string().trim().min(1, "Company name is required").max(100),
  companyWebsite: z.string().trim().url("Invalid URL").or(z.literal("")),
  companySize: z.string().min(1, "Please select company size"),
  creativeTested: z.string().min(1, "Please select an option"),
  monthlyAdSpend: z.string().min(1, "Please select an option"),
  referralSource: z.string().min(1, "Please select an option"),
});

const Onboarding = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    companyName: "",
    companyWebsite: "",
    companySize: "",
    creativeTested: "",
    monthlyAdSpend: "",
    referralSource: "",
  });

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/auth");
      return;
    }

    // Check if user has onboarding status
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed, full_name")
      .eq("id", user.id)
      .single();

    // If already completed onboarding, go to home
    if (profile?.onboarding_completed) {
      navigate("/home");
      return;
    }

    // Populate name from user's profile or auth metadata
    const userName = profile?.full_name || user.user_metadata?.full_name || "";
    if (userName) {
      setFormData(prev => ({ ...prev, name: userName }));
    }
  }, [navigate]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate form data
      onboardingSchema.parse(formData);
      
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("User not found");
        navigate("/auth");
        return;
      }

      // Update profile with personal info
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: formData.name,
          role: formData.role,
          onboarding_completed: true,
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // Insert onboarding data
      const { error: onboardingError } = await supabase
        .from("onboarding_data")
        .upsert({
          user_id: user.id,
          company_name: formData.companyName,
          company_website: formData.companyWebsite || null,
          company_size: formData.companySize,
          creatives_tested: formData.creativeTested,
          monthly_ad_spend: formData.monthlyAdSpend,
          referral_source: formData.referralSource,
        });

      if (onboardingError) throw onboardingError;

      toast.success("Welcome to Floowy.ai!");
      navigate("/home");
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        console.error("Onboarding error:", error);
        toast.error("Failed to complete onboarding");
      }
    } finally {
      setLoading(false);
    }
  }, [formData, navigate]);

  return (
    <div className="h-screen bg-background flex items-center justify-center p-4 overflow-hidden">
      <div className="w-full max-w-md max-h-[90vh] bg-card border border-border rounded-lg shadow-lg p-8 overflow-y-auto scrollbar-green">
        <div className="text-center mb-8">
          <img 
            src="/favicon.png" 
            alt="Floowy.ai" 
            className="h-12 w-auto mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold text-foreground mb-2">Let's get started</h1>
          <p className="text-muted-foreground">Tell us a bit more about yourself.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Section */}
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-4 block">
                Profile
              </Label>
            </div>

            <div>
              <Label htmlFor="name" className="text-sm font-medium">
                What's your name?
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Donny"
                required
                className="mt-1"
              />
            </div>


            <div>
              <Label className="text-sm font-medium mb-2 block">What best describes you?</Label>
              <div className="grid grid-cols-2 gap-2">
                {["Founder", "Creator", "Marketer", "Designer"].map((role) => (
                  <Button
                    key={role}
                    type="button"
                    variant={formData.role === role ? "default" : "outline"}
                    onClick={() => setFormData({ ...formData, role })}
                    className="w-full"
                  >
                    {role}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Company Section */}
          <div className="space-y-4 pt-4 border-t border-border">
            <div>
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-4 block">
                Company
              </Label>
            </div>

            <div>
              <Label htmlFor="companyName" className="text-sm font-medium">
                Company name
              </Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="Floowy.ai"
                required
                autoComplete="off"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="companyWebsite" className="text-sm font-medium">
                Company's website <span className="text-muted-foreground">(Optional)</span>
              </Label>
              <Input
                id="companyWebsite"
                type="url"
                value={formData.companyWebsite}
                onChange={(e) => setFormData({ ...formData, companyWebsite: e.target.value })}
                placeholder="https://floowy.ai"
                autoComplete="off"
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Company size</Label>
              <div className="grid grid-cols-4 gap-2">
                {["Up to 5", "6-50", "51-100", "100+"].map((size) => (
                  <Button
                    key={size}
                    type="button"
                    variant={formData.companySize === size ? "default" : "outline"}
                    onClick={() => setFormData({ ...formData, companySize: size })}
                    className="w-full text-xs"
                  >
                    {size}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Creatives tested last month</Label>
              <div className="grid grid-cols-4 gap-2">
                {["0-10", "11-50", "51-500", "500+"].map((range) => (
                  <Button
                    key={range}
                    type="button"
                    variant={formData.creativeTested === range ? "default" : "outline"}
                    onClick={() => setFormData({ ...formData, creativeTested: range })}
                    className="w-full text-xs"
                  >
                    {range}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Monthly ad spend in $</Label>
              <div className="grid grid-cols-4 gap-2">
                {["<$20K", "$20K-$100K", "$100K-$1M", "$1M+"].map((spend) => (
                  <Button
                    key={spend}
                    type="button"
                    variant={formData.monthlyAdSpend === spend ? "default" : "outline"}
                    onClick={() => setFormData({ ...formData, monthlyAdSpend: spend })}
                    className="w-full text-xs"
                  >
                    {spend}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">How did you find us? <span className="text-destructive">*</span></Label>
              <div className="grid grid-cols-2 gap-2">
                {["Google", "LinkedIn", "Instagram", "TikTok", "Friend / Colleague", "Other"].map((source) => (
                  <Button
                    key={source}
                    type="button"
                    variant={formData.referralSource === source ? "default" : "outline"}
                    onClick={() => setFormData({ ...formData, referralSource: source })}
                    className="w-full text-xs"
                  >
                    {source}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Saving..." : "Continue"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Onboarding;