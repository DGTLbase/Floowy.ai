import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Plan hierarchy for determining upgrades vs downgrades
const PLAN_HIERARCHY: Record<string, number> = {
  free: 0,
  lite: 1,
  starter: 2,
  professional: 3,
  enterprise: 4,
  ultra: 5,
};

// Price mapping to plans and credits (must match src/lib/stripe-config.ts)
const PRICE_TO_PLAN_AND_CREDITS: Record<string, { plan: string; credits: number }> = {
  // Monthly plans
  "price_1TYhRdKbAjgJzP4OoKJLuqQT": { plan: "lite", credits: 40 },
  "price_1SXv5wKbAjgJzP4OZ4ItVTI6": { plan: "starter", credits: 100 },
  "price_1SXv5zKbAjgJzP4OvMuBKt2O": { plan: "professional", credits: 250 },
  "price_1SXv61KbAjgJzP4O6Lk56HVx": { plan: "enterprise", credits: 500 },
  // Enterprise — current live price IDs (must match src/lib/stripe-config.ts +
  // stripe-webhook-subscription). The €1SXv61/62 IDs above are kept for back-compat.
  "price_1ShA0EKbAjgJzP4OS9TVcaIP": { plan: "enterprise", credits: 500 },
  // Yearly plans
  "price_1TYiClKbAjgJzP4OFk8CfXy9": { plan: "lite", credits: 480 },
  "price_1SXv5yKbAjgJzP4OvGPL0OSw": { plan: "starter", credits: 1200 },
  "price_1SXv60KbAjgJzP4OvawG7K1A": { plan: "professional", credits: 3000 },
  "price_1SXv62KbAjgJzP4OCvLBVd7K": { plan: "enterprise", credits: 6000 },
  "price_1Sfu1DKbAjgJzP4O68Keb4AQ": { plan: "enterprise", credits: 6000 },
  // Ultra (upsell) — created by scripts/setup-stripe-offers.mjs
  "price_1TkbwJKbAjgJzP4OaHqIAkLN": { plan: "ultra", credits: 3000 },
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHANGE-SUBSCRIPTION] ${step}${detailsStr}`);
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
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");

    logStep("User authenticated", { email: user.email });

    // Get request body
    const { priceId, couponId, activateNow } = await req.json();

    // One-click early activation of a €1-offer trial (upgrade banner):
    // end the trial now so Stripe invoices the full plan price immediately,
    // AND grant the plan's full credits right here. We do NOT rely on the
    // invoice.paid webhook alone — its billing_reason gate ("subscription_cycle")
    // can miss early trial-ends, which caused users to be charged with no credits.
    // The grant is idempotent via a credit_history "subscription_refresh" row for
    // the current billing period — the same marker the webhook and backfill use —
    // so a later invoice.paid for this same period is a no-op (granted exactly once).
    if (activateNow) {
      const stripeEarly = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
        apiVersion: "2025-08-27.basil",
      });
      const custs = await stripeEarly.customers.list({ email: user.email, limit: 1 });
      if (custs.data.length === 0) throw new Error("No Stripe customer found");
      const trialSubs = await stripeEarly.subscriptions.list({
        customer: custs.data[0].id,
        status: "trialing",
        limit: 1,
        expand: ["data.items.data.price"],
      });
      if (trialSubs.data.length === 0) throw new Error("No trialing subscription to activate");
      const trialSub = trialSubs.data[0];
      logStep("Activating trial now", { subscriptionId: trialSub.id });
      const activated = await stripeEarly.subscriptions.update(trialSub.id, {
        trial_end: "now",
        proration_behavior: "none",
      });

      // Deterministically grant the plan's full credits now.
      let creditsGranted = false;
      try {
        const priceId = activated.items.data[0]?.price?.id;
        const planData = priceId ? PRICE_TO_PLAN_AND_CREDITS[priceId] : null;
        const periodStart =
          (activated as any).current_period_start ||
          (activated.items.data[0] as any)?.current_period_start;
        if (planData && periodStart) {
          const admin = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
          );
          const periodStartIso = new Date(periodStart * 1000).toISOString();
          // Already granted for this billing period? (idempotency guard)
          const { data: existing } = await admin
            .from("credit_history")
            .select("id")
            .eq("user_id", user.id)
            .eq("action_type", "subscription_refresh")
            .gte("created_at", periodStartIso)
            .limit(1);

          if (!existing || existing.length === 0) {
            const { data: creditRow } = await admin
              .from("credits")
              .select("balance")
              .eq("user_id", user.id)
              .maybeSingle();
            const oldBalance = creditRow?.balance ?? 0;

            await admin.from("credits").update({ balance: planData.credits }).eq("user_id", user.id);
            await admin.from("profiles").update({ plan: planData.plan }).eq("id", user.id);
            await admin.from("credit_history").insert({
              user_id: user.id,
              amount: planData.credits - oldBalance,
              balance_after: planData.credits,
              action_type: "subscription_refresh",
              description: `Early activation: ${planData.plan} plan — credits set to ${planData.credits} (period ${periodStartIso})`,
            });
            creditsGranted = true;
            logStep("Granted plan credits on early activation", { plan: planData.plan, credits: planData.credits });
          } else {
            logStep("Credits already granted this period — skipping", { periodStartIso });
          }
        } else {
          logStep("Could not resolve plan/period for early activation — leaving to webhook", { priceId });
        }
      } catch (e) {
        // Never fail the activation on a credit-grant hiccup; the webhook/backfill
        // will still reconcile via the same idempotent marker.
        logStep("Early-activation credit grant failed (webhook will retry)", {
          error: e instanceof Error ? e.message : String(e),
        });
      }

      return new Response(JSON.stringify({ success: true, activated: true, creditsGranted }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (!priceId) throw new Error("Price ID is required");

    const planData = PRICE_TO_PLAN_AND_CREDITS[priceId];
    if (!planData) throw new Error("Invalid price ID");

    const newPlan = planData.plan;
    const newCredits = planData.credits;

    logStep("New plan requested", { priceId, newPlan, newCredits });

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Get or create Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string;
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    } else {
      const newCustomer = await stripe.customers.create({ email: user.email });
      customerId = newCustomer.id;
      logStep("Created new customer", { customerId });
    }

    // Get current subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    // Use service role for database operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get current plan from database
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .single();

    const currentPlan = profile?.plan || "free";
    logStep("Current plan", { currentPlan });

    // Determine if upgrade or downgrade
    const isUpgrade = PLAN_HIERARCHY[newPlan] > PLAN_HIERARCHY[currentPlan];
    logStep(isUpgrade ? "UPGRADE detected" : "DOWNGRADE detected");

    // Handle existing subscription
    if (subscriptions.data.length > 0) {
      const currentSubscription = subscriptions.data[0];
      logStep("Found active subscription", { subscriptionId: currentSubscription.id });

      if (isUpgrade) {
        // UPGRADE: Update existing subscription with proration
        logStep("Processing upgrade by updating subscription items");
        
        const currentItem = currentSubscription.items.data[0];

        // Update the subscription by replacing the old item with the new plan
        const updatedSubscription = await stripe.subscriptions.update(currentSubscription.id, {
          items: [
            {
              id: currentItem.id,
              deleted: true,
            },
            {
              price: priceId,
              quantity: 1,
            },
          ],
          proration_behavior: "always_invoice", // Charge difference immediately for upgrades
          automatic_tax: {
            enabled: true,
          },
          // Apply the upsell discount coupon (e.g. Ultra 52% off / add-on €74 off) when provided.
          ...(couponId ? { discounts: [{ coupon: couponId }] } : {}),
        });
        
        logStep("Subscription upgraded", {
          subscriptionId: updatedSubscription.id,
        });
        
        // Get current credits and add FULL new plan credits
        const { data: currentCredits } = await supabaseAdmin
          .from("credits")
          .select("balance")
          .eq("user_id", user.id)
          .single();

        const currentBalance = currentCredits?.balance || 0;
        const newBalance = currentBalance + newCredits;

        logStep("Adding full credits for new plan", { 
          currentBalance, 
          creditsToAdd: newCredits, 
          newBalance 
        });

        // Update credits with full amount
        await supabaseAdmin
          .from("credits")
          .update({ balance: newBalance })
          .eq("user_id", user.id);
        
        // Update database with new plan
        await supabaseAdmin
          .from("profiles")
          .update({ plan: newPlan })
          .eq("id", user.id);

        // Send plan change email
        try {
          logStep("Sending plan change email");
          const emailResponse = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-plan-change-email`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
            },
            body: JSON.stringify({
              email: user.email,
              firstName: user.user_metadata?.full_name?.split(' ')[0] || "",
              oldPlan: currentPlan,
              newPlan: newPlan,
            }),
          });

          if (emailResponse.ok) {
            logStep("Plan change email sent successfully");
          } else {
            logStep("Failed to send plan change email", { error: await emailResponse.text() });
          }
        } catch (emailError) {
          logStep("Error sending plan change email", { error: emailError });
        }
        
        return new Response(
          JSON.stringify({
            success: true,
            message: "Plan upgraded successfully",
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        // DOWNGRADE: Update existing subscription by replacing line items
        logStep("Processing downgrade by updating subscription items");
        
        const currentItem = currentSubscription.items.data[0];

        // Update the subscription by removing the old item and adding the new plan item
        const updatedSubscription = await stripe.subscriptions.update(currentSubscription.id, {
          items: [
            {
              id: currentItem.id,
              deleted: true,
            },
            {
              price: priceId,
              quantity: 1,
            },
          ],
          proration_behavior: "none",
          automatic_tax: {
            enabled: true,
          },
        });
        
        logStep("Subscription updated with new plan", {
          subscriptionId: updatedSubscription.id,
        });
        
        // Get current credits and add FULL new plan credits
        const { data: currentCredits } = await supabaseAdmin
          .from("credits")
          .select("balance")
          .eq("user_id", user.id)
          .single();

        const currentBalance = currentCredits?.balance || 0;
        const newBalance = currentBalance + newCredits;

        logStep("Adding full credits for new plan", { 
          currentBalance, 
          creditsToAdd: newCredits, 
          newBalance 
        });

        // Update credits with full amount
        await supabaseAdmin
          .from("credits")
          .update({ balance: newBalance })
          .eq("user_id", user.id);
        
        // Update database with new plan
        await supabaseAdmin
          .from("profiles")
          .update({ plan: newPlan })
          .eq("id", user.id);

        // Send plan change email
        try {
          logStep("Sending plan change email");
          const emailResponse = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-plan-change-email`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
            },
            body: JSON.stringify({
              email: user.email,
              firstName: user.user_metadata?.full_name?.split(' ')[0] || "",
              oldPlan: currentPlan,
              newPlan: newPlan,
            }),
          });

          if (emailResponse.ok) {
            logStep("Plan change email sent successfully");
          } else {
            logStep("Failed to send plan change email", { error: await emailResponse.text() });
          }
        } catch (emailError) {
          logStep("Error sending plan change email", { error: emailError });
        }
        
        return new Response(
          JSON.stringify({
            success: true,
            message: "Plan changed successfully",
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      // No existing subscription - handle based on upgrade/downgrade
      if (isUpgrade) {
        // Upgrading without subscription: create checkout session
        logStep("No existing subscription, creating checkout for upgrade");
      } else {
        // Downgrading without subscription: create subscription with trial
        logStep("No existing subscription but downgrading, creating subscription with trial");
        
        const newSubscription = await stripe.subscriptions.create({
          customer: customerId,
          items: [{ price: priceId, quantity: 1 }],
          trial_period_days: 30,
          automatic_tax: {
            enabled: true,
          },
        });
        
        logStep("New subscription created with trial", { 
          subscriptionId: newSubscription.id,
          trialEnd: new Date(newSubscription.trial_end! * 1000).toISOString()
        });
        
        // Update database with new plan
        await supabaseAdmin
          .from("profiles")
          .update({ plan: newPlan })
          .eq("id", user.id);

        // Send plan change email for new subscription
        try {
          logStep("Sending plan change email for new subscription");
          const emailResponse = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-plan-change-email`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
            },
            body: JSON.stringify({
              email: user.email,
              firstName: user.user_metadata?.full_name?.split(' ')[0] || "",
              oldPlan: currentPlan,
              newPlan: newPlan,
            }),
          });

          if (emailResponse.ok) {
            logStep("Plan change email sent successfully");
          } else {
            logStep("Failed to send plan change email", { error: await emailResponse.text() });
          }
        } catch (emailError) {
          logStep("Error sending plan change email", { error: emailError });
        }
        
        return new Response(
          JSON.stringify({ 
            success: true,
            message: "Plan changed successfully with 1 month free trial",
            trialEnd: new Date(newSubscription.trial_end! * 1000).toISOString()
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      logStep("Creating new checkout session");
      
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        line_items: [{ price: priceId, quantity: 1 }],
        mode: "subscription",
        allow_promotion_codes: true,
        success_url: `${req.headers.get("origin")}/payment?success=true`,
        cancel_url: `${req.headers.get("origin")}/payment`,
        billing_address_collection: "required",
        customer_update: {
          address: "auto",
        },
        automatic_tax: {
          enabled: true,
        },
      });

      logStep("Created checkout session", { sessionUrl: session.url });

      return new Response(
        JSON.stringify({ url: session.url }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    logStep("ERROR", { message: error instanceof Error ? error.message : String(error) });
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
