import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[SCHEDULE-DOWNGRADE] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    logStep("Function started");

    const { priceId } = await req.json();
    if (!priceId) throw new Error("priceId (target plan) is required");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) throw new Error("No Stripe customer found for this user");
    const customerId = customers.data[0].id;

    const subscriptions = await stripe.subscriptions.list({ customer: customerId, status: "active", limit: 1 });
    if (subscriptions.data.length === 0) throw new Error("No active subscription found");
    const subscription = subscriptions.data[0];

    // Schedule the downgrade for the NEXT billing date: the user keeps their
    // current plan/features until then. A subscription schedule keeps the current
    // price for the rest of this period, then switches to the target price. The
    // subscription_cycle invoice at the boundary drives the webhook plan sync.
    const schedule = await stripe.subscriptionSchedules.create({ from_subscription: subscription.id });
    const phase0: any = schedule.phases[0];
    const currentPriceId = phase0?.items?.[0]?.price as string;

    const updated = await stripe.subscriptionSchedules.update(schedule.id, {
      end_behavior: "release",
      phases: [
        {
          items: [{ price: currentPriceId, quantity: 1 }],
          start_date: phase0.start_date,
          end_date: phase0.end_date,
        },
        {
          items: [{ price: priceId, quantity: 1 }],
        },
      ],
    });
    logStep("Downgrade scheduled", { scheduleId: updated.id, effectiveDate: phase0.end_date });

    return new Response(
      JSON.stringify({
        success: true,
        scheduled: true,
        effectiveDate: new Date(phase0.end_date * 1000).toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
