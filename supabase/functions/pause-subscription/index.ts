import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[PAUSE-SUBSCRIPTION] ${step}${detailsStr}`);
};

// Auto-resume window: billing resumes automatically after this many months so a
// pause can't strand a customer on free indefinitely. Stripe fires
// customer.subscription.updated when it resumes, which restores the plan.
const PAUSE_MONTHS = 3;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    logStep("Function started");

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

    // Pause billing — the subscription stays but no invoices are collected while
    // paused. The user keeps their library/settings and their current price on
    // return. `void` discards any invoices generated during the pause window.
    const resumesAt = Math.floor(Date.now() / 1000) + PAUSE_MONTHS * 30 * 24 * 60 * 60;
    await stripe.subscriptions.update(subscription.id, {
      pause_collection: { behavior: "void", resumes_at: resumesAt },
    });
    logStep("Subscription paused", { subscriptionId: subscription.id, resumesAt });

    // Entitlement: while paused the user is not being billed, so revoke plan
    // access by downgrading to 'free' (existing tier gating keys off plan) and
    // mark the downgrade as a *pause* so it can be resumed (vs a cancellation).
    // reactivate-subscription restores the plan from the Stripe price and clears
    // this flag. The webhook keeps this in sync if paused/resumed out-of-band.
    const { error: pauseFlagError } = await supabaseClient
      .from("profiles")
      .update({ plan: "free", subscription_paused: true })
      .eq("id", user.id);
    if (pauseFlagError) logStep("Error setting paused state", { error: pauseFlagError });
    else logStep("Profile downgraded + marked paused", { userId: user.id });

    return new Response(JSON.stringify({ success: true, paused: true, resumes_at: new Date(resumesAt * 1000).toISOString() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
