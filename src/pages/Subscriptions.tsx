import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import BackendLayout from "@/components/BackendLayout";
import BillingSection from "@/components/BillingSection";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown, ArrowUpRight, Coins } from "lucide-react";
import { SUBSCRIPTION_PLANS } from "@/lib/stripe-config";

const planDetails: Record<string, { label: string; credits: number; price: number }> = {
  free: { label: "Free", credits: 3, price: 0 },
  lite: { label: "Lite", credits: SUBSCRIPTION_PLANS.lite.monthly.credits, price: SUBSCRIPTION_PLANS.lite.monthly.price },
  starter: { label: "Starter", credits: SUBSCRIPTION_PLANS.starter.monthly.credits, price: SUBSCRIPTION_PLANS.starter.monthly.price },
  professional: { label: "Professional", credits: SUBSCRIPTION_PLANS.professional.monthly.credits, price: SUBSCRIPTION_PLANS.professional.monthly.price },
  enterprise: { label: "Enterprise", credits: SUBSCRIPTION_PLANS.enterprise.monthly.credits, price: SUBSCRIPTION_PLANS.enterprise.monthly.price },
};

const Subscriptions = () => {
  const navigate = useNavigate();
  const [plan, setPlan] = useState<string>("free");
  const [credits, setCredits] = useState<number>(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/auth");
      else fetchUserData(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (!session) navigate("/auth");
      else fetchUserData(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchUserData = async (userId: string) => {
    const [{ data: profile }, { data: creditData }] = await Promise.all([
      supabase.from("profiles").select("plan").eq("id", userId).single(),
      supabase.from("credits").select("balance").eq("user_id", userId).single(),
    ]);
    if (profile?.plan) setPlan(profile.plan);
    if (creditData) setCredits(creditData.balance);
  };

  const current = planDetails[plan.toLowerCase()] || planDetails.free;
  const isFreePlan = plan.toLowerCase() === "free";
  const isEnterprise = plan.toLowerCase() === "enterprise";

  return (
    <BackendLayout>
      <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Subscriptions</h1>
          <p className="text-muted-foreground mt-1">Manage your plan, billing and invoices</p>
        </div>

        {/* Current Plan Card */}
        <Card className="border-border bg-card overflow-hidden">
          <CardContent className="p-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Crown className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-foreground">{current.label} Plan</h2>
                    <Badge variant="outline" className="capitalize text-xs">{isFreePlan ? "Free" : "Active"}</Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs sm:text-sm text-muted-foreground">
                    {!isFreePlan && (
                      <span>€{current.price}/mo</span>
                    )}
                    <span className="flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5 shrink-0" />
                      {credits} credits
                    </span>
                  </div>
                </div>
              </div>

              {!isEnterprise && (
                <Link to="/payment" className="w-full sm:w-auto">
                  <Button className="gap-2 w-full sm:w-auto">
                    {isFreePlan ? "Upgrade Plan" : "Change Plan"}
                    <ArrowUpRight className="w-4 h-4" />
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>

        <BillingSection />
      </div>
    </BackendLayout>
  );
};

export default Subscriptions;
