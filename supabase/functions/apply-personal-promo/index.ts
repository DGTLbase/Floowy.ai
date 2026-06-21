import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Personal-promo coupon (Section 9): 10% off for 3 months.
// Created by scripts/setup-stripe-offers.mjs — keep in sync with
// PERSONAL_PROMO.couponId in src/lib/stripe-config.ts.
const PERSONAL_PROMO_COUPON = "floowy_personal_10off_3mo";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) {
      return new Response(JSON.stringify({ applied: false, reason: "no_customer" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: customers.data[0].id,
      status: "active",
      limit: 1,
    });
    if (subscriptions.data.length === 0) {
      return new Response(JSON.stringify({ applied: false, reason: "no_subscription" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sub = subscriptions.data[0];

    // Idempotent: skip if this coupon is already applied to the subscription.
    const existing = (sub as any).discounts as Array<any> | undefined;
    const alreadyApplied = Array.isArray(existing)
      ? existing.some((d) => (typeof d === "string" ? false : d?.coupon?.id === PERSONAL_PROMO_COUPON))
      : (sub as any).discount?.coupon?.id === PERSONAL_PROMO_COUPON;

    if (alreadyApplied) {
      return new Response(JSON.stringify({ applied: true, reason: "already_applied" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await stripe.subscriptions.update(sub.id, {
      discounts: [{ coupon: PERSONAL_PROMO_COUPON }],
    });

    return new Response(JSON.stringify({ applied: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
