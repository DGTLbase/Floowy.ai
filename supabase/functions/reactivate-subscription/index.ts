import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[REACTIVATE-SUBSCRIPTION] ${step}${detailsStr}`);
};

// Price → plan/credits map (mirrors confirm-subscription).
const PRICE_TO_PLAN: Record<string, { plan: string; credits: number }> = {
  price_1TYhRdKbAjgJzP4OoKJLuqQT: { plan: "lite", credits: 40 },
  price_1SXv5wKbAjgJzP4OZ4ItVTI6: { plan: "starter", credits: 100 },
  price_1SXv5zKbAjgJzP4OvMuBKt2O: { plan: "professional", credits: 250 },
  price_1SXv61KbAjgJzP4O6Lk56HVx: { plan: "enterprise", credits: 500 },
  price_1TYiClKbAjgJzP4OFk8CfXy9: { plan: "lite", credits: 480 },
  price_1SXv5yKbAjgJzP4OvGPL0OSw: { plan: "starter", credits: 1200 },
  price_1SXv60KbAjgJzP4OvawG7K1A: { plan: "professional", credits: 3000 },
  price_1SXv62KbAjgJzP4OCvLBVd7K: { plan: "enterprise", credits: 6000 },
};

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

    // The subscription stays "active" while cancel_at_period_end is set or while
    // paused, so an active-status lookup covers both reactivation cases.
    const subscriptions = await stripe.subscriptions.list({ customer: customerId, status: "active", limit: 1 });
    if (subscriptions.data.length === 0) throw new Error("No subscription found to reactivate");
    const subscription = subscriptions.data[0];

    // Clear the scheduled cancellation and resume billing.
    const updated = await stripe.subscriptions.update(subscription.id, {
      cancel_at_period_end: false,
      pause_collection: "",
    });
    logStep("Subscription reactivated", { subscriptionId: updated.id });

    // Restore the user's plan from the subscription price (cancel/pause set it to
    // free) and always clear the paused flag now that billing has resumed.
    const priceId = updated.items.data[0]?.price?.id ?? "";
    const mapped = PRICE_TO_PLAN[priceId];
    const profileUpdate: { plan?: string; subscription_paused: boolean } = { subscription_paused: false };
    if (mapped) profileUpdate.plan = mapped.plan;
    else logStep("Price not mapped — plan not auto-restored (paused flag still cleared)", { priceId });
    const { error: updateError } = await supabaseClient
      .from("profiles")
      .update(profileUpdate)
      .eq("id", user.id);
    if (updateError) logStep("Error restoring plan / clearing paused", { error: updateError });
    else logStep("Plan restored + paused cleared", { plan: mapped?.plan ?? "(unchanged)" });

    return new Response(JSON.stringify({ success: true, plan: mapped?.plan ?? null }), {
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
