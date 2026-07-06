import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, MessageSquare, ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ContactSalesModal from "@/components/ContactSalesModal";
import CancellationReasonModal from "@/components/CancellationReasonModal";
import Footer from "@/components/Footer";
import { SUBSCRIPTION_PLANS } from "@/lib/stripe-config";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import logoImage from "@/assets/floowy-logo.png";

const Payment = () => {
  const [currentPlan, setCurrentPlan] = useState<string>("free");
  const [isLoading, setIsLoading] = useState(true);
  const [contactSalesOpen, setContactSalesOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isChangingPlan, setIsChangingPlan] = useState(false);
  // Enterprise is only offered to logged-in users (plan-switching), never on the
  // public price overview or during signup.
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const basePlans = [
    {
      id: "lite",
      name: "Lite",
      monthlyPrice: SUBSCRIPTION_PLANS.lite.monthly.price,
      yearlyPrice: SUBSCRIPTION_PLANS.lite.yearly.price,
      monthlyCredits: SUBSCRIPTION_PLANS.lite.monthly.credits,
      yearlyCredits: SUBSCRIPTION_PLANS.lite.yearly.credits,
      monthlyPriceId: SUBSCRIPTION_PLANS.lite.monthly.priceId,
      yearlyPriceId: SUBSCRIPTION_PLANS.lite.yearly.priceId,
      popular: false,
      description: "For brands with smaller content demands",
      features: [
        { text: `${billingCycle === "yearly" ? SUBSCRIPTION_PLANS.lite.yearly.credits : SUBSCRIPTION_PLANS.lite.monthly.credits} credits per ${billingCycle === "yearly" ? "year" : "month"}`, included: true },
        { text: `Generate up to ${billingCycle === "yearly" ? "240" : "20"} images per ${billingCycle === "yearly" ? "year" : "month"}`, included: true },
        { text: "Access to core Floowy tools", included: true },
        { text: "Priority generation queue", included: false },
        { text: "Priority support", included: false },
        { text: "Account manager", included: false },
      ],
    },
    {
      id: "starter",
      name: "Starter",
      monthlyPrice: SUBSCRIPTION_PLANS.starter.monthly.price,
      yearlyPrice: SUBSCRIPTION_PLANS.starter.yearly.price,
      monthlyCredits: SUBSCRIPTION_PLANS.starter.monthly.credits,
      yearlyCredits: SUBSCRIPTION_PLANS.starter.yearly.credits,
      monthlyPriceId: SUBSCRIPTION_PLANS.starter.monthly.priceId,
      yearlyPriceId: SUBSCRIPTION_PLANS.starter.yearly.priceId,
      popular: true,
      description: "Perfect for creators and small brands getting started with AI content",
      features: [
        { text: `${billingCycle === "yearly" ? SUBSCRIPTION_PLANS.starter.yearly.credits : SUBSCRIPTION_PLANS.starter.monthly.credits} credits per ${billingCycle === "yearly" ? "year" : "month"}`, included: true },
        { text: `Generate up to ${billingCycle === "yearly" ? "600" : "50"} images per ${billingCycle === "yearly" ? "year" : "month"} (2 credits per generation)`, included: true },
        { text: "Access to all Floowy tools", included: true },
        { text: "Priority generation queue", included: false },
        { text: "Priority support", included: false },
        { text: "Account manager", included: false },
      ],
    },
    {
      id: "professional",
      name: "Professional",
      monthlyPrice: SUBSCRIPTION_PLANS.professional.monthly.price,
      yearlyPrice: SUBSCRIPTION_PLANS.professional.yearly.price,
      monthlyCredits: SUBSCRIPTION_PLANS.professional.monthly.credits,
      yearlyCredits: SUBSCRIPTION_PLANS.professional.yearly.credits,
      monthlyPriceId: SUBSCRIPTION_PLANS.professional.monthly.priceId,
      yearlyPriceId: SUBSCRIPTION_PLANS.professional.yearly.priceId,
      popular: false,
      description: "For growing brands scaling their content production",
      features: [
        { text: `${billingCycle === "yearly" ? SUBSCRIPTION_PLANS.professional.yearly.credits : SUBSCRIPTION_PLANS.professional.monthly.credits} credits per ${billingCycle === "yearly" ? "year" : "month"}`, included: true },
        { text: `Generate up to ${billingCycle === "yearly" ? "1,500" : "125"} images per ${billingCycle === "yearly" ? "year" : "month"}`, included: true },
        { text: "Access to all Floowy tools", included: true },
        { text: "Priority generation queue", included: true },
        { text: "Priority support", included: true },
        { text: "Account manager", included: false },
      ],
    },
  ];

  // Enterprise — shown ONLY to logged-in users so they can switch up to it.
  // €229/month (from config). Feature list swaps Creator Studio for API access.
  const enterprisePlan = {
    id: "enterprise",
    name: "Enterprise",
    monthlyPrice: SUBSCRIPTION_PLANS.enterprise.monthly.price,
    yearlyPrice: SUBSCRIPTION_PLANS.enterprise.yearly.price,
    monthlyCredits: SUBSCRIPTION_PLANS.enterprise.monthly.credits,
    yearlyCredits: SUBSCRIPTION_PLANS.enterprise.yearly.credits,
    monthlyPriceId: SUBSCRIPTION_PLANS.enterprise.monthly.priceId,
    yearlyPriceId: SUBSCRIPTION_PLANS.enterprise.yearly.priceId,
    popular: false,
    description: "For high-volume brands and teams that need scale and integrations",
    features: [
      { text: `${billingCycle === "yearly" ? SUBSCRIPTION_PLANS.enterprise.yearly.credits : SUBSCRIPTION_PLANS.enterprise.monthly.credits} credits per ${billingCycle === "yearly" ? "year" : "month"}`, included: true },
      { text: `Generate up to ${billingCycle === "yearly" ? "3,000" : "250"} images per ${billingCycle === "yearly" ? "year" : "month"}`, included: true },
      { text: "Access to all Floowy tools", included: true },
      { text: "Priority generation queue", included: true },
      { text: "Priority support", included: true },
      { text: "Dedicated account manager", included: true },
      { text: "API access", included: true },
    ],
  };

  // Enterprise only appears once we know the visitor is authenticated.
  const plans = isLoggedIn ? [...basePlans, enterprisePlan] : basePlans;

  const customFeatures = [
    "Everything in Professional",
    "Custom credit packages",
    "AI content strategy support",
    "Custom AI model training",
    "Private generation infrastructure",
    "Team collaboration workspace",
    "Priority feature requests",
    "1-on-1 strategy calls",
  ];

  // After a successful €1 purchase: attach the §9 personal coupon (if claimed)
  // and run the §10/§11 upsell sequence before the dashboard.
  const runPostEuro1Funnel = () => {
    // Payment done — exit the signup funnel so auth redirects resume normally.
    sessionStorage.removeItem("floowy_post_signup");
    if (sessionStorage.getItem("floowy_apply_personal_promo") === "1") {
      sessionStorage.removeItem("floowy_apply_personal_promo");
      supabase.functions
        .invoke("apply-personal-promo")
        .catch((e) => console.error("apply-personal-promo failed", e));
    }
    if (sessionStorage.getItem("floowy_post_purchase_upsell") === "1") {
      sessionStorage.removeItem("floowy_post_purchase_upsell");
      navigate("/welcome-offer");
    }
  };

  useEffect(() => {
    fetchCurrentPlan();

    const urlParams = new URLSearchParams(window.location.search);

    // True 3-day €1 flow returns from a setup-mode checkout: finalize the
    // subscription schedule (€1 for 3 days → chosen plan) server-side.
    const euro1Setup = urlParams.get("euro1_setup");
    if (euro1Setup) {
      window.history.replaceState({}, "", "/payment");
      (async () => {
        try {
          const { data, error } = await supabase.functions.invoke("confirm-euro1", { body: { sessionId: euro1Setup } });
          // The €1 checkout only saves a card; if the €1 couldn't be collected the
          // backend withholds the trial credits and returns paid:false.
          if (error || data?.paid === false || data?.success === false) {
            toast({
              title: "Payment not completed",
              description: "We couldn't collect the €1 for your launch access, so no credits were added. Please try again with a different card.",
              variant: "destructive",
            });
          }
        } catch (e) {
          console.error("confirm-euro1 failed", e);
        }
        fetchCurrentPlan();
        runPostEuro1Funnel();
      })();
      return;
    }

    // Standard checkout return (credit pack or subscription / first-invoice €1).
    if (urlParams.get("success") === "true") {
      const credits = urlParams.get("credits");
      window.history.replaceState({}, "", "/payment");

      if (credits) {
        confirmCreditPurchase(parseInt(credits));
      } else {
        confirmSubscription();
        runPostEuro1Funnel();
      }
    }
  }, []);

  const confirmCreditPurchase = async (credits: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      toast({
        title: "Processing your payment...",
        description: "Please wait while we add your credits",
      });

      const { data, error } = await supabase.functions.invoke("confirm-payment", {
        body: { credits },
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Credits added successfully!",
          description: `${credits} credits have been added to your account. New balance: ${data.newBalance}`,
        });
      }
    } catch (error) {
      console.error("Error confirming credit purchase:", error);
      toast({
        title: "Warning",
        description: "Your payment was successful but there was an issue adding credits. Please contact support if your credits don't appear.",
        variant: "destructive",
      });
    }
  };

  const confirmSubscription = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      toast({
        title: "Processing your subscription...",
        description: "Please wait while we update your account",
      });

      const { data, error } = await supabase.functions.invoke("confirm-subscription");

      if (error) throw error;

      if (data?.success) {
        // Push dataLayer event for subscription purchase
        const { pushSubscriptionPurchaseEvent } = await import("@/lib/gtm-datalayer");
        pushSubscriptionPurchaseEvent({
          plan_name: data.plan || "unknown",
          price: 0, // price determined by Stripe
          billing_cycle: "monthly",
          currency: "EUR",
        });

        toast({
          title: "Subscription activated!",
          description: `Your ${data.plan} plan is now active with ${data.credits} credits added`,
        });
        // Update local state immediately so the current plan is reflected
        if (data.plan) {
          setCurrentPlan(data.plan);
        }
        // Refresh the plan display from the backend
        fetchCurrentPlan();
      }
    } catch (error) {
      console.error("Error confirming subscription:", error);
      toast({
        title: "Warning",
        description: "Your payment was successful but there was an issue updating your account. Please contact support if your plan doesn't update.",
        variant: "destructive",
      });
    }
  };

  const fetchCurrentPlan = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
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
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlanChange = async (planId: string, cycle: "monthly" | "yearly") => {
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

    setIsChangingPlan(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please log in to change your plan",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      const priceId = cycle === "monthly" ? plan.monthlyPriceId : plan.yearlyPriceId;
      
      // Determine if upgrade or downgrade
      const planOrder = ["free", "lite", "starter", "professional", "enterprise"];
      const currentIndex = planOrder.indexOf(currentPlan);
      const newIndex = planOrder.indexOf(planId);
      const isUpgrade = newIndex > currentIndex;
      
      toast({
        title: isUpgrade ? "Processing upgrade..." : "Processing downgrade...",
        description: "Please wait while we update your subscription",
      });

      const { data, error } = await supabase.functions.invoke("change-subscription", {
        body: { priceId },
      });

      if (error) throw error;

      if (data?.url) {
        // Upgrade: Redirect to checkout for immediate payment
        window.location.href = data.url;
      } else if (data?.success) {
        // Downgrade or direct plan change handled without checkout
        const { pushSubscriptionPurchaseEvent } = await import("@/lib/gtm-datalayer");
        const price = cycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
        pushSubscriptionPurchaseEvent({
          plan_name: plan.name,
          price,
          billing_cycle: cycle,
          currency: "EUR",
        });

        toast({
          title: isUpgrade ? "Plan updated" : "Plan changed",
          description: data.message || `Your plan has changed to ${plan.name}.`,
        });
        fetchCurrentPlan();
      }
    } catch (error: any) {
      console.error("Error changing plan:", error);
      toast({
        title: "Failed to change plan",
        description: error.message || "Please try again or contact support",
        variant: "destructive",
      });
    } finally {
      setIsChangingPlan(false);
    }
  };

  const handleCancelSubscription = async (reason: string, details: string) => {
    setIsCanceling(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please log in to cancel your subscription",
          variant: "destructive",
        });
        setCancelDialogOpen(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("cancel-subscription", {
        body: { reason, details }
      });
      
      if (error) throw error;

      toast({
        title: "Subscription canceled",
        description: "Your subscription will remain active until the end of your billing period.",
      });

      setCancelDialogOpen(false);
      fetchCurrentPlan();
    } catch (error) {
      console.error("Error canceling subscription:", error);
      toast({
        title: "Error",
        description: "Failed to cancel subscription",
        variant: "destructive",
      });
    } finally {
      setIsCanceling(false);
    }
  };

  const getButtonText = (planId: string) => {
    if (planId === currentPlan) return "Current Plan";
    const planOrder = ["free", "lite", "starter", "professional", "enterprise"];
    const currentIndex = planOrder.indexOf(currentPlan);
    const newIndex = planOrder.indexOf(planId);
    return newIndex > currentIndex ? "Upgrade to this plan" : "Downgrade to this plan";
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/home" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src={logoImage} alt="Floowy.ai" className="h-8 w-auto" />
            <span className="font-bold text-xl text-foreground">Floowy.ai</span>
          </Link>
          <Link to="/home">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </nav>

      {/* Payment Section */}
      <div className="container mx-auto px-4 py-12 flex-1">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 max-w-3xl mx-auto leading-tight">
              Scale Your Ecommerce Content,{" "}
              <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                Without the Photoshoot
              </span>
            </h1>
            
            {/* Current Plan Status & Actions */}
            {currentPlan !== "free" && (
              <div className="mb-6 p-4 bg-muted/50 rounded-lg border border-border inline-block">
                <p className="text-sm text-muted-foreground mb-2">
                  Current Plan: <span className="font-semibold text-foreground capitalize">{currentPlan}</span>
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCancelDialogOpen(true)}
                  className="hover-scale"
                >
                  Cancel Subscription
                </Button>
              </div>
            )}
            
            {/* Billing Cycle Toggle */}
            <div className="flex justify-center mb-8">
              <Tabs value={billingCycle} onValueChange={(v) => setBillingCycle(v as "monthly" | "yearly")} className="w-auto">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="monthly">Monthly</TabsTrigger>
                  <TabsTrigger value="yearly">
                    Yearly
                    <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                      Save 20%
                    </span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading plans...</p>
            </div>
          ) : (
            <>
            <div className={`grid grid-cols-1 gap-6 md:gap-8 items-stretch pt-6 mb-8 ${plans.length >= 4 ? "md:grid-cols-2 lg:grid-cols-4" : "md:grid-cols-3"}`}>
              {plans.map((plan) => {
                const displayPrice = billingCycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
                const isCurrent = currentPlan === plan.id;
                const isHighlighted = plan.popular && !isCurrent;

                return (
                  <Card
                    key={plan.id}
                    className={`relative transition-all duration-300 flex flex-col overflow-hidden ${
                      isCurrent
                        ? "border-2 border-primary shadow-glow"
                        : isHighlighted
                          ? "shadow-glow md:scale-105 border-2 border-primary bg-primary/[0.04] z-10"
                          : "border border-border/50"
                    }`}
                  >
                    {isCurrent && (
                      <div className="absolute top-0 inset-x-0 bg-primary text-primary-foreground text-center py-2 text-xs font-bold uppercase tracking-wider">
                        Your Current Plan
                      </div>
                    )}
                    {isHighlighted && !isCurrent && (
                      <div className="absolute top-0 inset-x-0 bg-primary text-primary-foreground text-center py-2 text-xs font-bold uppercase tracking-wider">
                        Most Popular
                      </div>
                    )}
                    <CardHeader className={`text-center pb-8 ${(isHighlighted || isCurrent) ? "pt-12" : ""}`}>
                      <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                      <CardDescription className="text-sm mb-4">{plan.description}</CardDescription>
                      {billingCycle === "yearly" && plan.monthlyPrice > 0 && (
                        <div className="text-lg font-bold text-muted-foreground line-through mb-2">
                          €{plan.monthlyPrice * 12}
                        </div>
                      )}
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-4xl md:text-5xl font-bold text-foreground">
                          {displayPrice}
                        </span>
                        <div className="flex flex-col items-start">
                          <span className="text-xs md:text-sm text-muted-foreground">EUR</span>
                          <span className="text-xs md:text-sm text-muted-foreground">/{billingCycle === "yearly" ? "year" : "month"}</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col">
                      <ul className="space-y-3 mb-8 flex-1">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-start gap-3">
                            {feature.included ? (
                              <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                            ) : (
                              <X className="w-5 h-5 text-muted-foreground/40 shrink-0 mt-0.5" />
                            )}
                            <span className={`text-sm ${feature.included ? "text-muted-foreground" : "text-muted-foreground/40"}`}>
                              {feature.text}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <Button
                        onClick={() => handlePlanChange(plan.id, billingCycle)}
                        disabled={isLoading || isCurrent || isChangingPlan}
                        variant={isHighlighted ? "default" : "outline"}
                        size="lg"
                        className={`w-full ${
                          isHighlighted
                            ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
                            : "border-primary/40 text-foreground hover:bg-primary/10"
                        }`}
                      >
                        {isChangingPlan ? "Processing..." : getButtonText(plan.id)}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Talk to Sales Card */}
            <div className="mt-8">
              <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.03] via-background to-primary-glow/[0.05] p-[1px]">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary-glow/10 opacity-50" />
                <div className="relative rounded-2xl bg-background/80 backdrop-blur-sm p-8 md:p-10">
                  <div className="flex flex-col lg:flex-row items-start gap-8 lg:gap-12">
                    <div className="flex-1 min-w-0">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
                        <Sparkles className="w-3.5 h-3.5" />
                        CUSTOM SOLUTION
                      </div>
                      <h3 className="text-2xl md:text-3xl font-bold mb-3 text-foreground">
                        Talk to Sales
                      </h3>
                      <p className="text-muted-foreground text-base md:text-lg mb-6 max-w-md">
                        For agencies, brands and teams with custom AI content needs
                      </p>
                      <Button
                        size="lg"
                        onClick={() => setContactSalesOpen(true)}
                        className="hidden lg:inline-flex bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 px-8"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Book A Call
                      </Button>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Everything you need</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                        {customFeatures.map((feature, index) => (
                          <div key={index} className="flex items-center gap-2.5">
                            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <Check className="w-3 h-3 text-primary" />
                            </div>
                            <span className="text-sm text-foreground/80">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <Button
                    size="lg"
                    onClick={() => setContactSalesOpen(true)}
                    className="lg:hidden w-full mt-6 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg transition-all duration-300"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Book A Call
                  </Button>
                </div>
              </div>
            </div>
            </>
          )}
        </div>
      </div>
      
      <ContactSalesModal 
        open={contactSalesOpen}
        onOpenChange={setContactSalesOpen}
      />

      {/* Cancel Subscription Reason Modal */}
      <CancellationReasonModal
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        onConfirm={handleCancelSubscription}
        isLoading={isCanceling}
      />
      
      <Footer />
    </div>
  );
};

export default Payment;
