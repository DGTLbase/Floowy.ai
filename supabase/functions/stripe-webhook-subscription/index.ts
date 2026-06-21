import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2025-08-27.basil",
});

const cryptoProvider = Stripe.createSubtleCryptoProvider();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

// Price → plan/credits. Mirrors the CURRENT live prices in src/lib/stripe-config.ts,
// plus the Ultra upsell. Drives credit refresh on monthly renewals AND on the
// €1→plan day-3 subscription-schedule transition (which bills the phase-2 plan
// price with billing_reason "subscription_cycle"). The €1/3-day trial price is
// intentionally absent so its first invoice grants no extra credits.
const PLAN_MAPPING: Record<string, { plan: string; credits: number }> = {
  // Monthly
  "price_1TYhRdKbAjgJzP4OoKJLuqQT": { plan: "lite", credits: 40 },
  "price_1SXv5wKbAjgJzP4OZ4ItVTI6": { plan: "starter", credits: 100 },
  "price_1SXv5zKbAjgJzP4OvMuBKt2O": { plan: "professional", credits: 250 },
  "price_1ShA0EKbAjgJzP4OS9TVcaIP": { plan: "enterprise", credits: 500 },
  // Yearly
  "price_1TYiClKbAjgJzP4OFk8CfXy9": { plan: "lite", credits: 480 },
  "price_1SXv5yKbAjgJzP4OvGPL0OSw": { plan: "starter", credits: 1200 },
  "price_1SXv60KbAjgJzP4OvawG7K1A": { plan: "professional", credits: 3000 },
  "price_1Sfu1DKbAjgJzP4O68Keb4AQ": { plan: "enterprise", credits: 6000 },
  // Ultra upsell (created by scripts/setup-stripe-offers.mjs)
  "price_1TkbwJKbAjgJzP4OaHqIAkLN": { plan: "ultra", credits: 3000 },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response("No signature", { status: 400 });
  }

  try {
    const body = await req.text();
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET not configured");
      return new Response("Webhook secret not configured", { status: 500 });
    }

    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      cryptoProvider
    );

    console.log("[stripe-webhook-subscription] Event type:", event.type);

    // Handle payment intent succeeded events (legacy/manual subscription flow)
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log("[stripe-webhook-subscription] Payment intent succeeded:", paymentIntent.id);

      const userId = paymentIntent.metadata.userId;
      const priceId = paymentIntent.metadata.priceId;
      const subscriptionId = paymentIntent.metadata.subscriptionId;

      if (!userId || !priceId) {
        console.log("[stripe-webhook-subscription] Missing metadata, skipping");
        return new Response(JSON.stringify({ received: true }), { status: 200 });
      }

      console.log("[stripe-webhook-subscription] Processing for user:", userId, "priceId:", priceId);

      // Map price IDs to plans and credits
      const planData = PLAN_MAPPING[priceId];

      if (!planData) {
        console.error("[stripe-webhook-subscription] Unknown price ID:", priceId);
        return new Response(JSON.stringify({ received: true }), { status: 200 });
      }

      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      // Get current credits
      const { data: currentCredits, error: creditsError } = await supabaseClient
        .from("credits")
        .select("balance")
        .eq("user_id", userId)
        .single();

      if (creditsError) {
        console.error("[stripe-webhook-subscription] Error fetching credits:", creditsError);
        return new Response(JSON.stringify({ error: "Failed to fetch credits" }), { status: 500 });
      }

      const currentBalance = currentCredits?.balance || 0;
      const newBalance = currentBalance + planData.credits;

      console.log("[stripe-webhook-subscription] Rolling over credits:", currentBalance, "->", newBalance);

      // Update credits (rollover + add new)
      const { error: updateCreditsError } = await supabaseClient
        .from("credits")
        .update({ balance: newBalance })
        .eq("user_id", userId);

      if (updateCreditsError) {
        console.error("[stripe-webhook-subscription] Error updating credits:", updateCreditsError);
        return new Response(JSON.stringify({ error: "Failed to update credits" }), { status: 500 });
      }

      // Update plan
      const { error: updatePlanError } = await supabaseClient
        .from("profiles")
        .update({ plan: planData.plan })
        .eq("id", userId);

      if (updatePlanError) {
        console.error("[stripe-webhook-subscription] Error updating plan:", updatePlanError);
        return new Response(JSON.stringify({ error: "Failed to update plan" }), { status: 500 });
      }

      console.log("[stripe-webhook-subscription] Successfully updated plan to:", planData.plan, "and credits to:", newBalance);

      // Activate the subscription by paying its invoice
      if (subscriptionId) {
        try {
          console.log("[stripe-webhook-subscription] Activating subscription:", subscriptionId);
          const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
            expand: ["latest_invoice"],
          });
          const invoice = subscription.latest_invoice as Stripe.Invoice;

          if (invoice && invoice.status !== "paid") {
            console.log("[stripe-webhook-subscription] Paying invoice:", invoice.id);
            await stripe.invoices.pay(invoice.id, {
              paid_out_of_band: true,
            });
            console.log("[stripe-webhook-subscription] Invoice paid, subscription activated");
          } else {
            console.log("[stripe-webhook-subscription] Invoice already paid or not found");
          }

          await stripe.subscriptions.update(subscriptionId, {
            metadata: {
              payment_confirmed: "true",
            },
          });

          console.log("[stripe-webhook-subscription] Subscription fully activated:", subscriptionId);
        } catch (err) {
          console.error("[stripe-webhook-subscription] Error activating subscription:", err);
        }
      }
    }

    // Handle Checkout session completed events (Stripe Checkout subscription flow)
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log("[stripe-webhook-subscription] Checkout session completed:", session.id);

      const userId = session.metadata?.userId as string | undefined;
      const subscriptionId = session.subscription as string | null;

      if (!userId || !subscriptionId) {
        console.log("[stripe-webhook-subscription] Missing userId or subscriptionId in checkout session, skipping");
        return new Response(JSON.stringify({ received: true }), { status: 200 });
      }

      const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ["items.data.price"],
      });

      const firstItem = subscription.items.data[0];
      const price = firstItem.price as Stripe.Price;
      const priceId = price.id;

      console.log("[stripe-webhook-subscription] Derived priceId from subscription:", priceId);

      const planData = PLAN_MAPPING[priceId];

      if (!planData) {
        console.error("[stripe-webhook-subscription] Unknown price ID from checkout session:", priceId);
        return new Response(JSON.stringify({ received: true }), { status: 200 });
      }

      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      const { data: currentCredits, error: creditsError } = await supabaseClient
        .from("credits")
        .select("balance")
        .eq("user_id", userId)
        .single();

      if (creditsError) {
        console.error("[stripe-webhook-subscription] Error fetching credits (checkout):", creditsError);
        return new Response(JSON.stringify({ error: "Failed to fetch credits" }), { status: 500 });
      }

      const currentBalance = currentCredits?.balance || 0;
      const newBalance = currentBalance + planData.credits;

      console.log("[stripe-webhook-subscription] Rolling over credits (checkout):", currentBalance, "->", newBalance);

      const { error: updateCreditsError } = await supabaseClient
        .from("credits")
        .update({ balance: newBalance })
        .eq("user_id", userId);

      if (updateCreditsError) {
        console.error("[stripe-webhook-subscription] Error updating credits (checkout):", updateCreditsError);
        return new Response(JSON.stringify({ error: "Failed to update credits" }), { status: 500 });
      }

      const { error: updatePlanError } = await supabaseClient
        .from("profiles")
        .update({ plan: planData.plan })
        .eq("id", userId);

      if (updatePlanError) {
        console.error("[stripe-webhook-subscription] Error updating plan (checkout):", updatePlanError);
        return new Response(JSON.stringify({ error: "Failed to update plan" }), { status: 500 });
      }

      console.log("[stripe-webhook-subscription] Successfully updated plan (checkout) to:", planData.plan, "and credits to:", newBalance);
    }

    // Handle recurring invoice payments (monthly credit refresh)
    if (event.type === "invoice.paid" || event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as Stripe.Invoice;
      console.log("[stripe-webhook-subscription] Invoice paid:", invoice.id, "billing_reason:", invoice.billing_reason);

      // Only process recurring payments, not the first subscription invoice
      if (invoice.billing_reason !== "subscription_cycle") {
        console.log("[stripe-webhook-subscription] Not a recurring cycle invoice, skipping credit refresh");
        return new Response(JSON.stringify({ received: true }), { status: 200 });
      }

      const subscriptionId = invoice.subscription as string | null;
      if (!subscriptionId) {
        console.log("[stripe-webhook-subscription] No subscription ID on invoice, skipping");
        return new Response(JSON.stringify({ received: true }), { status: 200 });
      }

      const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ["items.data.price"],
      });

      const firstItem = subscription.items.data[0];
      const price = firstItem.price as Stripe.Price;
      const priceId = price.id;

      console.log("[stripe-webhook-subscription] Recurring renewal priceId:", priceId);

      const planData = PLAN_MAPPING[priceId];
      if (!planData) {
        console.error("[stripe-webhook-subscription] Unknown price ID on renewal:", priceId);
        return new Response(JSON.stringify({ received: true }), { status: 200 });
      }

      // Find user by Stripe customer email
      const customerId = invoice.customer as string;
      const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
      const customerEmail = customer.email;

      if (!customerEmail) {
        console.error("[stripe-webhook-subscription] No email on Stripe customer:", customerId);
        return new Response(JSON.stringify({ received: true }), { status: 200 });
      }

      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      // Look up user by email in profiles
      const { data: profile, error: profileError } = await supabaseClient
        .from("profiles")
        .select("id")
        .eq("email", customerEmail)
        .single();

      if (profileError || !profile) {
        console.error("[stripe-webhook-subscription] Could not find user for email:", customerEmail, profileError);
        return new Response(JSON.stringify({ received: true }), { status: 200 });
      }

      const userId = profile.id;
      console.log("[stripe-webhook-subscription] Monthly renewal for user:", userId, "plan:", planData.plan, "credits:", planData.credits);

      // Get current balance before refresh
      const { data: currentCredits } = await supabaseClient
        .from("credits")
        .select("balance")
        .eq("user_id", userId)
        .maybeSingle();

      const oldBalance = currentCredits?.balance || 0;

      // Set credits to plan amount (fresh monthly allocation)
      const { error: updateCreditsError } = await supabaseClient
        .from("credits")
        .update({ balance: planData.credits })
        .eq("user_id", userId);

      if (updateCreditsError) {
        console.error("[stripe-webhook-subscription] Error refreshing credits:", updateCreditsError);
        return new Response(JSON.stringify({ error: "Failed to refresh credits" }), { status: 500 });
      }

      // Log credit history
      await supabaseClient.from("credit_history").insert({
        user_id: userId,
        amount: planData.credits - oldBalance,
        balance_after: planData.credits,
        action_type: "subscription_refresh",
        description: `Monthly ${planData.plan} plan renewal - credits refreshed to ${planData.credits}`,
      });

      console.log("[stripe-webhook-subscription] Credits refreshed to:", planData.credits, "for user:", userId);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("[stripe-webhook-subscription] Error:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
