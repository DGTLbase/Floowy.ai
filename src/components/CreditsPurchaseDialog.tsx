import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Coins, Sparkles, Zap, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CREDIT_PACKS } from "@/lib/stripe-config";

interface CreditsPurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreditsPurchaseDialog = ({ open, onOpenChange }: CreditsPurchaseDialogProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [userPlan, setUserPlan] = useState<string>("free");

  // Check user's plan when dialog opens
  useEffect(() => {
    if (open) {
      checkUserPlan();
    }
  }, [open]);

  const checkUserPlan = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("plan")
        .eq("id", user.id)
        .single();

      if (profile) {
        setUserPlan(profile.plan);
        
        // If user is on free plan, redirect to payment page
        if (profile.plan === "free") {
          toast({
            title: "Subscription Required",
            description: "Please subscribe to a plan before purchasing additional credits",
          });
          onOpenChange(false);
          navigate("/payment");
        }
      }
    } catch (error) {
      console.error("Error checking user plan:", error);
    }
  };

  const handleCreditPurchase = async (credits: number, price: number, priceId: string) => {
    try {
      setIsLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please log in to purchase credits",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase.functions.invoke("create-payment", {
        body: { priceId, credits },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error creating payment:", error);
      toast({
        title: "Error",
        description: "Failed to initialize payment",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto border-border/50">
          <DialogHeader className="space-y-3 pb-6">
            <DialogTitle className="text-3xl font-bold text-center">
              <span className="text-header-dark">Add More </span>
              <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                Credits
              </span>
            </DialogTitle>
            <p className="text-muted-foreground text-center text-base">
              Choose the perfect package to keep creating amazing content
            </p>
          </DialogHeader>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-muted-foreground mt-4">Initializing payment...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 py-2">
                {CREDIT_PACKS.map((pkg) => {
                  const getIcon = (icon: string) => {
                    switch (icon) {
                      case "⚡": return Zap;
                      case "🚀": return Sparkles;
                      case "💎": return Coins;
                      default: return Coins;
                    }
                  };
                  const Icon = getIcon(pkg.icon);
                  
                  return (
                    <div
                      key={pkg.credits}
                      className={`relative rounded-2xl border-2 p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                        pkg.popular
                          ? "border-primary bg-gradient-to-br from-primary/5 to-primary-glow/5 shadow-glow md:scale-105 z-10"
                          : "border-border/50 bg-card hover:border-primary/30"
                      }`}
                    >
                      {pkg.popular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <span className="bg-gradient-to-r from-primary to-primary-glow text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg whitespace-nowrap">
                            ✨ MOST POPULAR
                          </span>
                        </div>
                      )}

                      {/* Discount badge */}
                      <div className="absolute top-3 right-3">
                        <span className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-full">
                          {pkg.discountPct}% OFF
                        </span>
                      </div>

                      <div className="flex flex-col items-center space-y-4">
                        {/* Icon */}
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                          pkg.popular 
                            ? "bg-gradient-to-br from-primary to-primary-glow shadow-glow" 
                            : "bg-gradient-to-br from-primary/10 to-primary-glow/10"
                        }`}>
                          <Icon className={`w-8 h-8 ${pkg.popular ? "text-white" : "text-primary"}`} />
                        </div>

                        {/* Credits */}
                        <div className="text-center">
                          <div className="text-4xl font-bold text-foreground mb-1">
                            {pkg.credits}
                          </div>
                          <div className="text-sm text-muted-foreground uppercase tracking-wide">
                            Credits
                          </div>
                        </div>

                        {/* Price */}
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="text-base font-semibold text-muted-foreground line-through">
                            €{pkg.originalPrice}
                          </span>
                          <div className="flex items-baseline justify-center gap-1">
                            <span className="text-4xl font-bold text-foreground">€{pkg.price}</span>
                            <span className="text-sm text-muted-foreground">EUR</span>
                          </div>
                        </div>

                        {/* Per Credit Price */}
                        <div className="text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                          {(pkg.price / pkg.credits).toFixed(2)} EUR per credit
                        </div>

                        {/* Button */}
                        <Button
                          className={`w-full mt-2 ${
                            pkg.popular
                              ? "bg-gradient-to-r from-primary to-primary-glow hover:shadow-glow"
                              : ""
                          }`}
                          size="lg"
                          onClick={() => handleCreditPurchase(pkg.credits, pkg.price, pkg.priceId)}
                          disabled={isLoading}
                        >
                          {isLoading ? "Loading..." : "Purchase Now"}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Upgrade CTA */}
              <div className="mt-6 pt-6 border-t border-border/50">
                <div className="bg-gradient-to-br from-primary/5 via-primary-glow/5 to-background rounded-2xl p-6 text-center border border-primary/10">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Need More? Upgrade Your Plan
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Get monthly credits, priority support, and exclusive features
                  </p>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-primary/30 hover:bg-primary/5"
                    onClick={() => {
                      onOpenChange(false);
                      navigate("/payment");
                    }}
                  >
                    View Plans
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CreditsPurchaseDialog;
