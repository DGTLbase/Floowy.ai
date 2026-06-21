import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("create-payment called");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    console.log("Authenticating user...");
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) {
      console.error("User not authenticated or email not available");
      throw new Error("User not authenticated or email not available");
    }
    console.log("User authenticated:", user.id, user.email);

    const body = await req.json();
    console.log("Request body:", body);
    const { priceId, credits } = body;
    if (!priceId) {
      console.error("Price ID is required");
      throw new Error("Price ID is required");
    }
    console.log("Creating payment session for:", { priceId, credits, userId: user.id });

    console.log("Initializing Stripe...");
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { 
      apiVersion: "2025-08-27.basil" 
    });
    
    console.log("Looking up customer by email:", user.email);
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      console.log("Found existing customer:", customerId);
    } else {
      console.log("No existing customer found, will create new one");
    }

    console.log("Creating checkout session...");
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "payment",
      allow_promotion_codes: true,
      success_url: `${req.headers.get("origin")}/payment?success=true&credits=${credits}`,
      cancel_url: `${req.headers.get("origin")}/payment?canceled=true`,
      billing_address_collection: "required",
      customer_update: {
        address: "auto",
      },
      automatic_tax: {
        enabled: true,
      },
      invoice_creation: {
        enabled: true,
        invoice_data: {
          description: `Credit pack purchase - ${credits} credits`,
          metadata: {
            userId: user.id,
            credits: credits.toString(),
          },
        },
      },
      custom_text: {
        submit: {
          message: "Complete your purchase to get instant access to your credits",
        },
      },
      metadata: {
        userId: user.id,
        credits: credits.toString(),
      },
      payment_intent_data: {
        metadata: {
          userId: user.id,
          credits: credits.toString(),
        },
      },
    });

    console.log("Checkout session created successfully:", session.id);
    console.log("Session URL:", session.url);
    console.log("Session metadata:", session.metadata);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in create-payment:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});