import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLAN_TO_PRICE: Record<string, string> = {
  lite: "price_1TYhRdKbAjgJzP4OoKJLuqQT",
  starter: "price_1SXv5wKbAjgJzP4OZ4ItVTI6",
  professional: "price_1SXv5zKbAjgJzP4OvMuBKt2O",
};

// Max credits during the €1 period (Section 8).
const TRIAL_CREDITS = 10;

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
    if (!user) throw new Error("User not authenticated");

    const { sessionId } = await req.json();
    if (!sessionId) throw new Error("sessionId is required");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["setup_intent"],
    });

    const customerId = session.customer as string;
    const setupIntent = session.setup_intent as Stripe.SetupIntent;
    const paymentMethod = setupIntent?.payment_method as string | undefined;
    const plan = session.metadata?.plan as string | undefined;

    if (!customerId || !paymentMethod || !plan) {
      throw new Error("Incomplete setup session");
    }
    const chosenPriceId = PLAN_TO_PRICE[plan];
    if (!chosenPriceId) throw new Error("Invalid plan");

    // Make the collected card the default so the schedule can charge it.
    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethod },
    });

    // Idempotency: don't create a second subscription if one already exists.
    const existingSubs = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 3 });
    const hasSub = existingSubs.data.some((s) =>
      ["trialing", "active", "past_due", "unpaid"].includes(s.status)
    );
    if (!hasSub) {
      // €1 now: a pending invoice item is swept into the trialing subscription's
      // create-invoice and charged immediately (verified via test clock).
      await stripe.invoiceItems.create({
        customer: customerId,
        amount: 100, // €1.00
        currency: "eur",
        description: "Floowy €1 launch access (3 days)",
      });
      // Chosen plan, billed after a 3-day trial → at day 3 Stripe emits a
      // subscription_cycle invoice for the full plan price, which the webhook
      // uses to refresh credits to the plan amount.
      await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: chosenPriceId, quantity: 1 }],
        trial_period_days: 3,
        default_payment_method: paymentMethod,
        metadata: { userId: user.id, plan, offerType: "euro1_trial" },
      });
    }

    // Set plan + cap credits to the trial allotment.
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );
    await supabaseAdmin.from("profiles").update({ plan }).eq("id", user.id);
    await supabaseAdmin
      .from("credits")
      .update({ balance: TRIAL_CREDITS })
      .eq("user_id", user.id);

    // Flow D — welcome email, once per user (unique(user_id, flow) guards repeats).
    try {
      const { error: dErr } = await supabaseAdmin
        .from("recovery_email_log")
        .insert({ user_id: user.id, flow: "D" });
      if (!dErr) {
        const firstName =
          (user.user_metadata?.full_name as string | undefined)?.split(" ")[0] || "there";
        await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-lifecycle-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({ flow: "D", email: user.email, firstName }),
        });
      }
    } catch (e) {
      console.error("welcome email failed", e);
    }

    return new Response(JSON.stringify({ success: true, plan, credits: TRIAL_CREDITS }), {
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
