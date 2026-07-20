import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// 42% off for the first 3 months — the only incentive used in the in-app upsell
// flow. Returned so the client can pass it to change-subscription.
const COUPON_ID = "floowy_upsell_42off_3mo";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    try {
      await stripe.coupons.retrieve(COUPON_ID);
    } catch (_e) {
      await stripe.coupons.create({
        id: COUPON_ID,
        percent_off: 42,
        duration: "repeating",
        duration_in_months: 3,
        name: "42% off for 3 months (in-app upsell)",
      });
    }

    return new Response(JSON.stringify({ couponId: COUPON_ID }), {
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
