import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PURCHASE-MODEL] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get model_id from request body
    const { model_id } = await req.json();
    if (!model_id) throw new Error("model_id is required");
    logStep("Model ID received", { model_id });

    // Check if user already owns this model
    const { data: existingPurchase } = await supabaseClient
      .from("user_purchased_models")
      .select("id")
      .eq("user_id", user.id)
      .eq("model_id", model_id)
      .maybeSingle();

    if (existingPurchase) {
      throw new Error("You already own this model");
    }

    // Get model details
    const { data: model, error: modelError } = await supabaseClient
      .from("custom_models")
      .select("*")
      .eq("id", model_id)
      .eq("is_active", true)
      .maybeSingle();

    if (modelError || !model) {
      throw new Error("Model not found or not available");
    }
    
    if (!model.stripe_price_id) {
      throw new Error("Model does not have a configured subscription price");
    }
    logStep("Model found", { name: model.name, priceId: model.stripe_price_id });

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check if Stripe customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Build full image URL - Stripe requires absolute URLs
    const origin = req.headers.get("origin") || "https://moodmaker-studio-51185.lovable.app";
    const imageUrl = model.image_url.startsWith("http") 
      ? model.image_url 
      : `${origin}${model.image_url}`;

    // Create Stripe checkout session for subscription
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: model.stripe_price_id,
          quantity: 1,
        },
      ],
      mode: "subscription",
      allow_promotion_codes: true,
      success_url: `${origin}/custom-models?success=true&model_id=${model_id}`,
      cancel_url: `${origin}/custom-models?canceled=true`,
      subscription_data: {
        metadata: {
          user_id: user.id,
          model_id: model_id,
          type: "custom_model_subscription",
        },
      },
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
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
