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

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    console.log("[create-payment-intent] Function started");
    
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("[create-payment-intent] No authorization header present");
      throw new Error("No authorization header provided. Please log in and try again.");
    }
    
    console.log("[create-payment-intent] Auth header present, validating token");
    const token = authHeader.replace("Bearer ", "");
    
    const { data, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError) {
      console.error("[create-payment-intent] Auth error:", authError.message);
      throw new Error(`Authentication failed: ${authError.message}`);
    }
    
    const user = data.user;
    if (!user?.email) {
      console.error("[create-payment-intent] User object missing or no email");
      throw new Error("User not authenticated or email not available. Please log in again.");
    }
    
    console.log("[create-payment-intent] User authenticated:", user.email);

    const { amount, credits } = await req.json();
    if (!amount || !credits) throw new Error("Amount and credits are required");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { 
      apiVersion: "2025-08-27.basil" 
    });
    
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
        },
      });
      customerId = customer.id;
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to cents
      currency: "eur",
      customer: customerId,
      metadata: {
        userId: user.id,
        credits: credits.toString(),
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return new Response(JSON.stringify({ clientSecret: paymentIntent.client_secret }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
