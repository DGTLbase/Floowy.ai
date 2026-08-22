import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[APPLY-RETENTION-DISCOUNT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

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

    // Find the subscription. €1-trial users ("€1 first 3 days") are in status
    // "trialing", NOT "active" yet — so an active-only lookup wrongly reported
    // "No active subscription found" and the discount failed for trial users.
    // Check active first, then trialing.
    let subscriptions = await stripe.subscriptions.list({ customer: customerId, status: "active", limit: 1 });
    if (subscriptions.data.length === 0) {
      subscriptions = await stripe.subscriptions.list({ customer: customerId, status: "trialing", limit: 1 });
    }
    if (subscriptions.data.length === 0) {
      throw new Error("No active or trialing subscription found");
    }

    const subscription = subscriptions.data[0];
    logStep("Found subscription", { subscriptionId: subscription.id, status: subscription.status });

    // Check if the subscription already has a discount. Stripe API 2025-08-27
    // exposes discounts as the `discounts` array; the singular `discount` field is
    // deprecated and comes back null, so rely on `discounts` (fall back to legacy).
    const existingDiscounts = (subscription as any).discounts as unknown[] | undefined;
    const alreadyDiscounted = (Array.isArray(existingDiscounts) && existingDiscounts.length > 0) || !!subscription.discount;
    if (alreadyDiscounted) {
      logStep("Subscription already has a discount");
      return new Response(JSON.stringify({
        success: false,
        error: "A discount is already applied to your subscription.",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Ensure the managed 20%-off / 3-months retention coupon exists (matching the
    // offer copy in the flow) and use it, so the discount ALWAYS activates in
    // Stripe and lasts exactly 3 months.
    const MANAGED_COUPON_ID = "floowy_retention_20off_3mo";

    const ensureCoupon = async (): Promise<string> => {
      try {
        await stripe.coupons.retrieve(MANAGED_COUPON_ID);
        logStep("Using existing managed coupon", { coupon: MANAGED_COUPON_ID });
      } catch (_e) {
        await stripe.coupons.create({
          id: MANAGED_COUPON_ID,
          percent_off: 20,
          duration: "repeating",
          duration_in_months: 3,
          name: "20% off for 3 months (retention)",
        });
        logStep("Created managed retention coupon", { coupon: MANAGED_COUPON_ID });
      }
      return MANAGED_COUPON_ID;
    };

    const couponId = await ensureCoupon();

    const updatedSubscription = await stripe.subscriptions.update(subscription.id, {
      discounts: [{ coupon: couponId }],
    });
    const appliedCoupon = ((updatedSubscription as any).discounts?.[0]?.coupon?.id)
      ?? updatedSubscription.discount?.coupon?.id ?? null;
    logStep("Retention discount applied", {
      subscriptionId: updatedSubscription.id,
      coupon: couponId,
      appliedCoupon,
    });

    // If subscription was set to cancel, undo it
    if (updatedSubscription.cancel_at_period_end) {
      await stripe.subscriptions.update(subscription.id, {
        cancel_at_period_end: false,
      });
      logStep("Cancelled cancellation - user is staying");
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: "20% discount applied successfully"
    }), {
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
