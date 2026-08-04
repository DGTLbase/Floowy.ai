import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Chosen plan → monthly price (phase 2 of the schedule). Keep in sync with
// src/lib/stripe-config.ts SUBSCRIPTION_PLANS.
const PLAN_TO_PRICE: Record<string, string> = {
  lite: "price_1TYhRdKbAjgJzP4OoKJLuqQT",
  starter: "price_1SXv5wKbAjgJzP4OZ4ItVTI6",
  professional: "price_1SXv5zKbAjgJzP4OvMuBKt2O",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

    const { plan, gaClientId, gclid } = await req.json();
    const chosenPriceId = PLAN_TO_PRICE[plan];
    if (!chosenPriceId) throw new Error("Invalid plan");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const created = await stripe.customers.create({ email: user.email });
      customerId = created.id;
    }

    // mode:"setup" — collect the card now (no charge). confirm-euro1 then creates
    // the subscription schedule (€1 for 3 days → chosen plan ongoing), which
    // charges the €1 immediately on the first phase invoice.
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "setup",
      currency: "eur",
      payment_method_types: ["card"],
      success_url: `${req.headers.get("origin")}/payment?euro1_setup={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/pricing-1-euro-offer?canceled=true`,
      // GA attribution rides along so the webhook can report the sale against
      // the session that drove it (see supabase/functions/_shared/ga4-mp.ts).
      metadata: {
        userId: user.id,
        plan,
        offerType: "euro1_trial",
        ...(gaClientId ? { ga_client_id: String(gaClientId) } : {}),
        ...(gclid ? { gclid: String(gclid) } : {}),
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
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
