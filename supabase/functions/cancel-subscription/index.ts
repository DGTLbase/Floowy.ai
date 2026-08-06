import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { findActionableSubscription, cancellationDate } from "../_shared/stripe-subscription.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CANCEL-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Parse request body for cancellation reason
    const { reason, details } = await req.json();
    logStep("Cancellation feedback received", { reason, hasDetails: !!details });

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    // Find the customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) {
      throw new Error("No Stripe customer found for this user");
    }
    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Find the subscription. NOT an active-only lookup: €1-trial users are in
    // status "trialing", and an active-only filter reported "No active
    // subscription found" for them — surfacing as "Failed to cancel" and
    // leaving a paying customer unable to leave.
    const subscription = await findActionableSubscription(stripe, customerId);
    if (!subscription) {
      throw new Error("No active subscription found");
    }
    logStep("Found subscription", { subscriptionId: subscription.id, status: subscription.status });

    // Already scheduled to end — treat as success. Re-cancelling is a no-op in
    // Stripe, and reporting an error to someone who has already cancelled just
    // sends them to support for no reason.
    if (subscription.cancel_at_period_end) {
      logStep("Subscription already set to cancel at period end", { subscriptionId: subscription.id });
      return new Response(JSON.stringify({
        success: true,
        alreadyScheduled: true,
        cancelAt: cancellationDate(subscription),
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Cancel the subscription at period end
    const canceledSubscription = await stripe.subscriptions.update(subscription.id, {
      cancel_at_period_end: true,
    });
    logStep("Subscription canceled", {
      subscriptionId: canceledSubscription.id,
      status: canceledSubscription.status,
      cancelAt: cancellationDate(canceledSubscription),
    });

    // Update user plan to free in Supabase
    const { error: updateError } = await supabaseClient
      .from("profiles")
      .update({ plan: "free" })
      .eq("id", user.id);

    if (updateError) {
      logStep("Error updating user plan", { error: updateError });
    } else {
      logStep("User plan updated to free");
    }

    // Store cancellation feedback if provided
    if (reason) {
      const { error: feedbackError } = await supabaseClient
        .from("cancellation_feedback")
        .insert({
          user_id: user.id,
          reason: reason,
          details: details || null
        });

      if (feedbackError) {
        logStep("Error storing cancellation feedback", { error: feedbackError });
      } else {
        logStep("Cancellation feedback stored successfully");
      }
    }

    return new Response(JSON.stringify({
      success: true,
      cancelAt: cancellationDate(canceledSubscription),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in cancel-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
