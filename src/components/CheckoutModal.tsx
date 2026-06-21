import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, MessageSquare, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SUBSCRIPTION_PLANS } from "@/lib/stripe-config";
import ContactSalesModal from "./ContactSalesModal";


interface CheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CheckoutModal = ({ open, onOpenChange }: CheckoutModalProps) => {
  const [currentPlan, setCurrentPlan] = useState<string>("free");
  const [isLoading, setIsLoading] = useState(false);
  const [contactSalesOpen, setContactSalesOpen] = useState(false);
  const { toast } = useToast();

  const plans = [
    {
      id: "starter",
      name: "Starter",
      price: SUBSCRIPTION_PLANS.starter.monthly.price,
      credits: SUBSCRIPTION_PLANS.starter.monthly.credits,
      priceId: SUBSCRIPTION_PLANS.starter.monthly.priceId,
      popular: false,
      features: [
        "100 credits/month",
        "Fashion tool access",
        "Atmosphere tool access",
        "Email support",
        "HD quality exports",
      ],
    },
    {
      id: "professional",
      name: "Professional",
      price: SUBSCRIPTION_PLANS.professional.monthly.price,
      credits: SUBSCRIPTION_PLANS.professional.monthly.credits,
      priceId: SUBSCRIPTION_PLANS.professional.monthly.priceId,
      popular: true,
      features: [
        "250 credits/month",
        "All Starter features",
        "Product Photos tool access",
        "Priority support",
        "Advanced editing features",
      ],
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: SUBSCRIPTION_PLANS.enterprise.monthly.price,
      credits: SUBSCRIPTION_PLANS.enterprise.monthly.credits,
      priceId: SUBSCRIPTION_PLANS.enterprise.monthly.priceId,
      popular: false,
      features: [
        "500 credits/month",
        "All Professional features",
        "Creator Studio tool access",
        "Dedicated account manager",
        "Custom integrations",
      ],
    },
  ];

  useEffect(() => {
    if (open) {
      fetchCurrentPlan();
    }
  }, [open]);

  const fetchCurrentPlan = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("plan")
          .eq("id", user.id)
          .single();
        
        if (profile) {
          setCurrentPlan(profile.plan);
        }
      }
    } catch (error) {
      console.error("Error fetching current plan:", error);
    }
  };

  const handlePlanChange = async (planId: string) => {
    if (planId === "custom") {
      setContactSalesOpen(true);
      return;
    }

    if (planId === currentPlan) {
      toast({
        title: "Already subscribed",
        description: "This is your current plan",
      });
      return;
    }

    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please log in to change your plan",
          variant: "destructive",
        });
        return;
      }

      // Use change-subscription which handles both new subscriptions and updates
      const { data, error } = await supabase.functions.invoke("change-subscription", {
        body: { priceId: plan.priceId },
      });

      if (error) throw error;

      // If the response contains a URL, it means we need to go through checkout
      if (data?.url) {
        window.open(data.url, '_blank');
        onOpenChange(false);
      } else if (data?.success) {
        // Subscription was updated directly
        toast({
          title: "Plan updated!",
          description: data.message || "Your plan has been successfully updated.",
        });
        await fetchCurrentPlan();
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error changing subscription:", error);
      toast({
        title: "Error",
        description: "Failed to change subscription",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonText = (planId: string) => {
    if (planId === currentPlan) return "Current Plan";
    const planOrder = ["free", "starter", "professional", "enterprise"];
    const currentIndex = planOrder.indexOf(currentPlan);
    const newIndex = planOrder.indexOf(planId);
    return newIndex > currentIndex ? "Upgrade" : "Downgrade";
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto border-border/50">
          <DialogHeader className="space-y-3 pb-6">
            <DialogTitle className="text-3xl font-bold text-center">
              <span className="text-foreground">Choose Your </span>
              <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                Plan
              </span>
            </DialogTitle>
            <p className="text-muted-foreground text-center text-base">
              Select the perfect plan to power your creative workflow
            </p>
          </DialogHeader>

          {isLoading ? (
            <div className="text-center py-8 animate-fade-in">
              <div className="w-8 h-8 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-muted-foreground mt-4">Initializing payment...</p>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-3 gap-5 py-2">
                {plans.map((plan) => (
                  <Card
                    key={plan.id}
                    className={`relative transition-all duration-300 flex flex-col hover:shadow-xl hover:-translate-y-1 ${
                      currentPlan === plan.id
                        ? "border-primary shadow-glow bg-gradient-to-br from-primary/5 to-primary-glow/5"
                        : plan.popular
                        ? "border-primary bg-gradient-to-br from-primary/5 to-primary-glow/5"
                        : "border-border/50 hover:border-primary/30"
                    }`}
                  >
                    {currentPlan === plan.id && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-primary-glow text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg">
                        YOUR PLAN
                      </div>
                    )}
                    {plan.popular && currentPlan !== plan.id && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-primary-glow text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg">
                        MOST POPULAR
                      </div>
                    )}
                    
                    <CardHeader className="text-center pb-4">
                      <CardTitle className="text-2xl mb-3">{plan.name}</CardTitle>
                      <div className="flex items-baseline justify-center gap-1 mb-2">
                        <span className="text-4xl font-bold text-foreground">
                          {plan.price}
                        </span>
                        <div className="flex flex-col items-start">
                          <span className="text-sm text-muted-foreground">EUR</span>
                          <span className="text-sm text-muted-foreground">/mo</span>
                        </div>
                      </div>
                      <CardDescription className="text-sm font-medium">
                        {plan.credits} credits per month
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="flex-1 flex flex-col">
                      <div className="space-y-3 mb-6 flex-1">
                        {plan.features.map((feature, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                            <span className="text-sm text-muted-foreground">
                              {feature}
                            </span>
                          </div>
                        ))}
                      </div>
                      
                      <Button
                        className={`w-full ${
                          plan.popular && currentPlan !== plan.id
                            ? "bg-gradient-to-r from-primary to-primary-glow hover:shadow-glow"
                            : ""
                        }`}
                        variant={currentPlan === plan.id ? "outline" : "default"}
                        onClick={() => handlePlanChange(plan.id)}
                        disabled={currentPlan === plan.id || isLoading}
                        size="lg"
                      >
                        {isLoading ? "Loading..." : getButtonText(plan.id)}
                        {currentPlan !== plan.id && <ArrowRight className="w-4 h-4 ml-2" />}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Custom Plan CTA */}
              <div className="mt-4 pt-4 border-t border-border/50">
                <div className="bg-gradient-to-br from-primary/5 via-primary-glow/5 to-background rounded-2xl p-6 text-center border border-primary/10">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Need a Custom Solution?
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Get tailored pricing, volume discounts, and dedicated support
                  </p>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-primary/30 hover:bg-primary/5"
                    onClick={() => handlePlanChange("custom")}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Talk to Sales
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <ContactSalesModal 
        open={contactSalesOpen}
        onOpenChange={setContactSalesOpen}
      />
    </>
  );
};

export default CheckoutModal;
