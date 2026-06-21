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

    // Get current credits
    const { data: currentCredit } = await supabaseAdmin
      .from("credits")
      .select("balance")
      .eq("user_id", user.id)
      .maybeSingle();

    const currentBalance = currentCredit?.balance || 0;
    const newBalance = currentBalance + planData.credits;

    console.log(`Updating credits: ${currentBalance} + ${planData.credits} = ${newBalance}`);

    // Update credits
    const { error: updateCreditsError } = await supabaseAdmin
      .from("credits")
      .update({ balance: newBalance })
      .eq("user_id", user.id);

    if (updateCreditsError) {
      console.error("Error updating credits:", updateCreditsError);
      throw new Error("Failed to update credits");
    }

    console.log("Credits updated successfully");

    // Update plan
    const { error: updatePlanError } = await supabaseAdmin
      .from("profiles")
      .update({ plan: planData.plan })
      .eq("id", user.id);

    if (updatePlanError) {
      console.error("Error updating plan:", updatePlanError);
      throw new Error("Failed to update plan");
    }

    console.log("Plan updated successfully to:", planData.plan);

    // Send upgrade email
    try {
      console.log("Sending upgrade email to:", user.email);
      const emailResponse = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-upgrade-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
        },
        body: JSON.stringify({
          email: user.email,
          firstName: user.user_metadata?.full_name?.split(' ')[0] || "",
          plan: planData.plan,
        }),
      });

      if (emailResponse.ok) {
        console.log("Upgrade email sent successfully");
      } else {
        console.error("Failed to send upgrade email:", await emailResponse.text());
      }
    } catch (emailError) {
      console.error("Error sending upgrade email:", emailError);
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
