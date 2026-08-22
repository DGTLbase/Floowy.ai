import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

// Stripe price → plan name, so a PAUSED subscription can report which tier it was
// paused from (the plan is downgraded to "free" while paused, so the UI otherwise
// can't tell which tier card to show the "Resume Plan" button on).
const PRICE_TO_PLAN: Record<string, string> = {
  price_1TYhRdKbAjgJzP4OoKJLuqQT: "lite", price_1SXv5wKbAjgJzP4OZ4ItVTI6: "starter",
  price_1SXv5zKbAjgJzP4OvMuBKt2O: "professional", price_1SXv61KbAjgJzP4O6Lk56HVx: "enterprise",
  price_1TYiClKbAjgJzP4OFk8CfXy9: "lite", price_1SXv5yKbAjgJzP4OvGPL0OSw: "starter",
  price_1SXv60KbAjgJzP4OvawG7K1A: "professional", price_1SXv62KbAjgJzP4OCvLBVd7K: "enterprise",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user with token");
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found, updating unsubscribed state");
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    // A paused subscription (pause_collection set) keeps Stripe status "active"
    // but is NOT being billed, so it must NOT count as an entitled subscription.
    // Treat paused as unsubscribed for access, and surface `paused` so the UI can
    // show a "resume" state instead of an upsell/renew prompt.
    let hasActiveSub = subscriptions.data.length > 0;
    let paused = false;
    let pauseResumesAt: string | null = null;
    let pausedTier: string | null = null;
    let productId = null;
    let subscriptionEnd = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      if (subscription.pause_collection) {
        paused = true;
        hasActiveSub = false;
        const ra = subscription.pause_collection.resumes_at;
        pauseResumesAt = ra ? new Date(ra * 1000).toISOString() : null;
        pausedTier = PRICE_TO_PLAN[subscription.items.data[0]?.price?.id ?? ""] ?? null;
        logStep("Subscription is paused — treating as not entitled", { subscriptionId: subscription.id, pauseResumesAt, pausedTier });
      } else {
        subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
        logStep("Active subscription found", { subscriptionId: subscription.id, endDate: subscriptionEnd });
        productId = subscription.items.data[0].price.product;
        logStep("Determined subscription tier", { productId });
      }
    } else {
      logStep("No active subscription found");
    }

    // €1-offer trials: not "active" yet — the plan only fully activates (and
    // full credits are granted) when the trial converts. The upgrade banner
    // uses this to offer one-click early activation.
    let trialing = false;
    let trialPriceId: string | null = null;
    let trialEnd: string | null = null;
    if (!hasActiveSub) {
      const trialSubs = await stripe.subscriptions.list({
        customer: customerId,
        status: "trialing",
        limit: 1,
      });
      if (trialSubs.data.length > 0) {
        const t = trialSubs.data[0];
        trialing = true;
        trialPriceId = t.items.data[0].price.id;
        trialEnd = t.trial_end ? new Date(t.trial_end * 1000).toISOString() : null;
        logStep("Trialing subscription found", { subscriptionId: t.id, trialPriceId, trialEnd });
      }
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      paused,
      paused_tier: pausedTier,
      pause_resumes_at: pauseResumesAt,
      product_id: productId,
      subscription_end: subscriptionEnd,
      trialing,
      trial_price_id: trialPriceId,
      trial_end: trialEnd
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});