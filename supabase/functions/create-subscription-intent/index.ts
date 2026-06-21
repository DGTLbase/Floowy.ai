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
    console.log("[create-subscription-intent] Function started");
    
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }
    
    const token = authHeader.replace("Bearer ", "");
    const { data, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError) {
      console.error("[create-subscription-intent] Auth error:", authError);
      throw new Error("Authentication failed");
    }
    
    const user = data.user;
    if (!user?.email) {
      throw new Error("User not authenticated or email not available");
    }
    
    console.log("[create-subscription-intent] User authenticated:", user.email);

    const body = await req.json();
    const { priceId } = body;
    
    if (!priceId) {
      throw new Error("Price ID is required");
    }
    
    console.log("[create-subscription-intent] Price ID:", priceId);

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("Stripe secret key not configured");
    }

    const stripe = new Stripe(stripeKey, { 
      apiVersion: "2025-08-27.basil" 
    });
    
    console.log("[create-subscription-intent] Checking for existing customer");
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      console.log("[create-subscription-intent] Found existing customer:", customerId);
    } else {
      console.log("[create-subscription-intent] Creating new customer");
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
        },
      });
      customerId = customer.id;
      console.log("[create-subscription-intent] Created customer:", customerId);
    }

    console.log("[create-subscription-intent] Creating subscription with immediate payment");
    
    // Create subscription with payment_behavior: "default_incomplete"
    // This creates a payment intent with the actual amount, not a setup intent
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: "default_incomplete",
      payment_settings: { 
        save_default_payment_method: "on_subscription",
        payment_method_types: ["card"]
      },
      expand: ["latest_invoice.payment_intent"],
      metadata: {
        userId: user.id,
        priceId: priceId,
      },
      automatic_tax: {
        enabled: true,
      },
    });

    console.log("[create-subscription-intent] Subscription created:", subscription.id);
    console.log("[create-subscription-intent] Subscription status:", subscription.status);

    // Get payment intent from the invoice
    const invoice = subscription.latest_invoice as Stripe.Invoice;
    if (!invoice) {
      throw new Error("No invoice created for subscription");
    }

    console.log("[create-subscription-intent] Invoice ID:", invoice.id);
    
    let paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;
    
    // If no payment intent exists or it's missing a client secret, create a standalone one
    if (!paymentIntent?.client_secret) {
      console.log("[create-subscription-intent] No usable payment intent on subscription, creating standalone");
      
      // Retrieve the price to get the amount and currency
      const price = await stripe.prices.retrieve(priceId);
      const amount = price.unit_amount;
      
      if (!amount) {
        throw new Error("Could not determine price amount");
      }
      
      console.log("[create-subscription-intent] Creating standalone payment intent for amount:", amount, price.currency);
      
      // Create a standalone payment intent that is actually charged
      paymentIntent = await stripe.paymentIntents.create({
        customer: customerId,
        amount: amount,
        currency: price.currency || 'eur',
        setup_future_usage: 'off_session',
        metadata: {
          subscriptionId: subscription.id,
          userId: user.id,
          priceId: priceId,
        },
        automatic_tax: {
          enabled: true,
        },
      });
      
      console.log("[create-subscription-intent] Created standalone payment intent:", paymentIntent.id);
    } else {
      console.log("[create-subscription-intent] Using subscription invoice payment intent:", paymentIntent.id);
      // Ensure payment intent has all metadata we need for webhooks
      paymentIntent = await stripe.paymentIntents.update(paymentIntent.id, {
        metadata: {
          userId: user.id,
          priceId: priceId,
          subscriptionId: subscription.id,
        },
      });
    }

    const clientSecret = paymentIntent.client_secret;
    if (!clientSecret) {
      throw new Error("Payment intent has no client secret");
    }

    console.log("[create-subscription-intent] Success, returning client secret");

    return new Response(JSON.stringify({ 
      clientSecret,
      subscriptionId: subscription.id,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[create-subscription-intent] Error:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
