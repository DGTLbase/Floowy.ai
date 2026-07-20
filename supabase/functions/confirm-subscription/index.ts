import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("confirm-subscription called");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");

    console.log("User authenticated:", user.email);

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Get customer from Stripe by email
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      console.log("No Stripe customer found for email:", user.email);
      return new Response(
        JSON.stringify({ error: "No subscription found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const customerId = customers.data[0].id;
    console.log("Found customer:", customerId);

    // Get active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      console.log("No active subscription found");
      return new Response(
        JSON.stringify({ error: "No active subscription found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const subscription = subscriptions.data[0];
    const priceId = subscription.items.data[0]?.price.id;

    if (!priceId) {
      console.log("No price ID in subscription");
      return new Response(
        JSON.stringify({ error: "Invalid subscription" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Active subscription price:", priceId);

    // Map price IDs to plans and credits (synced with frontend stripe-config.ts)
    const planMapping: Record<string, { plan: string; credits: number }> = {
      // Monthly plans
      "price_1TYhRdKbAjgJzP4OoKJLuqQT": { plan: "lite", credits: 40 },
      "price_1SXv5wKbAjgJzP4OZ4ItVTI6": { plan: "starter", credits: 100 },
      "price_1SXv5zKbAjgJzP4OvMuBKt2O": { plan: "professional", credits: 250 },
      "price_1SXv61KbAjgJzP4O6Lk56HVx": { plan: "enterprise", credits: 500 },
      // Yearly plans
      "price_1TYiClKbAjgJzP4OFk8CfXy9": { plan: "lite", credits: 480 },
      "price_1SXv5yKbAjgJzP4OvGPL0OSw": { plan: "starter", credits: 1200 },
      "price_1SXv60KbAjgJzP4OvawG7K1A": { plan: "professional", credits: 3000 },
      "price_1SXv62KbAjgJzP4OCvLBVd7K": { plan: "enterprise", credits: 6000 },
    };

    const planData = planMapping[priceId];

    if (!planData) {
      console.log("Unknown price ID:", priceId);
      return new Response(
        JSON.stringify({ error: "Unknown subscription plan" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Plan data:", planData);

    // Use service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Idempotent grant: SET the balance to the plan amount exactly once per
    // billing period, marked by a credit_history "subscription_refresh" row.
    // This is the SAME marker the Stripe webhook uses, so the two paths can't
    // double-grant for the same payment (previously each ADDED plan credits →
    // 2× the plan amount, e.g. Lite 40 → 80).
    const periodStartSec =
      (subscription as any).current_period_start ??
      (subscription.items.data[0] as any)?.current_period_start;
    const periodStartIso = periodStartSec ? new Date(periodStartSec * 1000).toISOString() : new Date(0).toISOString();

    const { data: alreadyGranted } = await supabaseAdmin
      .from("credit_history")
      .select("id")
      .eq("user_id", user.id)
      .eq("action_type", "subscription_refresh")
      .gte("created_at", periodStartIso)
      .limit(1);

    if (!alreadyGranted || alreadyGranted.length === 0) {
      const { data: currentCredit } = await supabaseAdmin
        .from("credits")
        .select("balance")
        .eq("user_id", user.id)
        .maybeSingle();
      const oldBalance = currentCredit?.balance ?? 0;

      const { error: updateCreditsError } = await supabaseAdmin
        .from("credits")
        .update({ balance: planData.credits })
        .eq("user_id", user.id);
      if (updateCreditsError) {
        console.error("Error updating credits:", updateCreditsError);
        throw new Error("Failed to update credits");
      }

      await supabaseAdmin.from("credit_history").insert({
        user_id: user.id,
        amount: planData.credits - oldBalance,
        balance_after: planData.credits,
        action_type: "subscription_refresh",
        description: `confirm-subscription: ${planData.plan} plan — credits set to ${planData.credits} (period ${periodStartIso})`,
      });
      console.log(`Credits set to ${planData.credits} (was ${oldBalance})`);
    } else {
      console.log("Credits already granted this billing period — skipping grant");
    }

    // Update plan (always keep it in sync, even if credits were already granted)
    const { error: updatePlanError } = await supabaseAdmin
      .from("profiles")
      .update({ plan: planData.plan })
      .eq("id", user.id);

    if (updatePlanError) {
      console.error("Error updating plan:", updatePlanError);
      throw new Error("Failed to update plan");
    }

    console.log("Plan updated successfully to:", planData.plan);

    // Email: Flow D welcome on first payment (once), upgrade email thereafter.
    try {
      const firstName = user.user_metadata?.full_name?.split(" ")[0] || "";
      // recovery_email_log has unique(user_id, flow); a clean insert => first payment.
      const { error: dErr } = await supabaseAdmin
        .from("recovery_email_log")
        .insert({ user_id: user.id, flow: "D" });
      const isFirstPayment = !dErr;

      const fn = isFirstPayment ? "send-lifecycle-email" : "send-upgrade-email";
      const body = isFirstPayment
        ? { flow: "D", email: user.email, firstName }
        : { email: user.email, firstName, plan: planData.plan };

      const emailResponse = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/${fn}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify(body),
      });
      if (!emailResponse.ok) console.error(`${fn} failed:`, await emailResponse.text());
    } catch (emailError) {
      console.error("Error sending confirmation email:", emailError);
      // Don't fail the subscription confirmation if email fails
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        plan: planData.plan,
        credits: planData.credits,
        newBalance 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in confirm-subscription:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
