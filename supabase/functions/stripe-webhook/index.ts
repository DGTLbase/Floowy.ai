import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { reportInvoiceToGa4 } from "../_shared/ga4-mp.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2025-08-27.basil",
});

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new Response(
      JSON.stringify({ error: "No signature provided" }),
      { status: 400 }
    );
  }

  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured");
    return new Response(JSON.stringify({ error: "Webhook secret not configured" }), { status: 500 });
  }

  // Verify the signature FIRST — a bad signature is the ONLY case we reject with a
  // non-2xx. Everything past this point is a genuine Stripe event that we must
  // acknowledge with 200 even if our own processing errors, otherwise Stripe
  // redelivers the same event for up to 3 days (that redelivery loop is what made
  // plan changes / retention-discount / downgrade reprocess continuously).
  let event: Stripe.Event;
  try {
    const body = await req.text();
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      Stripe.createSubtleCryptoProvider()
    );
  } catch (err) {
    console.error("Stripe signature verification failed:", err);
    return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 400 });
  }

  try {
    console.log("Stripe webhook event received:", event.type);

    // ==============================
    // payment_intent.succeeded
    // - credit packs (one-off)
    // - subscription payments
    // ==============================
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log("Processing payment intent:", paymentIntent.id);
      console.log("Payment intent metadata:", paymentIntent.metadata);

      const metadata = paymentIntent.metadata || {};

      // 1) CREDIT PACK PURCHASES (one-off payments with credits in metadata)
      if (metadata.userId && metadata.credits) {
        const userId = metadata.userId;
        const credits = parseInt(metadata.credits);
        const amount = (paymentIntent.amount || 0) / 100; // cents -> euros

        console.log(`Adding ${credits} credits to user ${userId}`);

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

        // Get current balance
        const { data: currentCredit } = await supabaseAdmin
          .from("credits")
          .select("balance")
          .eq("user_id", userId)
          .maybeSingle();

        const currentBalance = currentCredit?.balance || 0;
        const newBalance = currentBalance + credits;

        // Update credits
        const { error: updateError } = await supabaseAdmin
          .from("credits")
          .update({ balance: newBalance })
          .eq("user_id", userId);

        if (updateError) {
          console.error("Error updating credits:", updateError);
          throw new Error("Failed to update credits");
        }

        console.log(`Credits updated successfully. New balance: ${newBalance}`);

        // Send confirmation email
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("email, full_name")
          .eq("id", userId)
          .single();

        if (profile?.email) {
          console.log("Sending purchase confirmation email to:", profile.email);
          
          const emailResponse = await fetch(
            `${supabaseUrl}/functions/v1/send-purchase-confirmation`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
              },
              body: JSON.stringify({
                email: profile.email,
                firstName: profile.full_name || "",
                credits: credits,
                amount: amount,
              }),
            }
          );

          if (!emailResponse.ok) {
            console.error("Failed to send confirmation email");
          } else {
            console.log("Confirmation email sent successfully");
          }
        }
      }

      // 2) SUBSCRIPTION PAYMENTS (no credits field, but has subscriptionId + priceId)
      if (metadata.userId && metadata.priceId && metadata.subscriptionId && !metadata.credits) {
        const userId = metadata.userId;
        const priceId = metadata.priceId;
        const subscriptionId = metadata.subscriptionId;

        console.log(
          "Handling subscription payment for user:",
          userId,
          "priceId:",
          priceId,
          "subscriptionId:",
          subscriptionId,
        );

        // Map price IDs to plans and credits (synced with frontend stripe-config.ts)
        const planMapping: Record<string, { plan: string; credits: number }> = {
          // Monthly plans
          "price_1TYhRdKbAjgJzP4OoKJLuqQT": { plan: "lite", credits: 40 },
          "price_1SXv5wKbAjgJzP4OZ4ItVTI6": { plan: "starter", credits: 100 },
          "price_1SXv5zKbAjgJzP4OvMuBKt2O": { plan: "professional", credits: 250 },
          "price_1SXv61KbAjgJzP4O6Lk56HVx": { plan: "enterprise", credits: 500 },
          // Yearly plans
          "price_1TYiClKbAjgJzP4OFk8CfXy9": { plan: "lite", credits: 480 },
          "price_1SXv5yKbAjgJzP4OvGPL0OSw": { plan: "starter", credits: 1200 },
          "price_1SXv60KbAjgJzP4OvawG7K1A": { plan: "professional", credits: 3000 },
          "price_1SXv62KbAjgJzP4OCvLBVd7K": { plan: "enterprise", credits: 6000 },
        };

        const planData = planMapping[priceId];

        if (!planData) {
          console.error("Unknown subscription price ID:", priceId);
        } else {
          const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

          // Idempotent grant: SET the balance to the plan amount once per billing
          // period, keyed by a credit_history "subscription_refresh" row. This is
          // the SAME marker confirm-subscription writes, so the client-confirm and
          // this webhook can't double-grant for the same payment (previously each
          // ADDED plan credits → 2× the plan amount, e.g. Lite 40 → 80).
          let periodStartIso = new Date(0).toISOString();
          try {
            const sub = await stripe.subscriptions.retrieve(subscriptionId);
            const ps = (sub as any).current_period_start ?? (sub.items?.data?.[0] as any)?.current_period_start;
            if (ps) periodStartIso = new Date(ps * 1000).toISOString();
          } catch (e) {
            console.error("Could not retrieve subscription for period start:", e);
          }

          const { data: alreadyGranted } = await supabaseAdmin
            .from("credit_history")
            .select("id")
            .eq("user_id", userId)
            .eq("action_type", "subscription_refresh")
            .gte("created_at", periodStartIso)
            .limit(1);

          if (!alreadyGranted || alreadyGranted.length === 0) {
            const { data: currentCredits } = await supabaseAdmin
              .from("credits")
              .select("balance")
              .eq("user_id", userId)
              .maybeSingle();
            const oldBalance = currentCredits?.balance || 0;

            const { error: updateCreditsError } = await supabaseAdmin
              .from("credits")
              .update({ balance: planData.credits })
              .eq("user_id", userId);
            if (updateCreditsError) {
              console.error("Error updating subscription credits:", updateCreditsError);
            } else {
              await supabaseAdmin.from("credit_history").insert({
                user_id: userId,
                amount: planData.credits - oldBalance,
                balance_after: planData.credits,
                action_type: "subscription_refresh",
                description: `stripe-webhook: ${planData.plan} plan — credits set to ${planData.credits} (period ${periodStartIso})`,
              });
              console.log("Subscription credits set to", planData.credits, "(was", oldBalance + ")");
            }
          } else {
            console.log("Subscription credits already granted this period — skipping grant");
          }

          const { error: updatePlanError } = await supabaseAdmin
            .from("profiles")
            .update({ plan: planData.plan })
            .eq("id", userId);
          if (updatePlanError) {
            console.error("Error updating subscription plan:", updatePlanError);
          } else {
            console.log("Subscription plan updated to:", planData.plan);
          }
        }

        // Try to activate the Stripe subscription by marking its invoice as paid
        try {
          console.log("Activating Stripe subscription:", subscriptionId);
          const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
            expand: ["latest_invoice"],
          });

          const invoice = subscription.latest_invoice as Stripe.Invoice | null;

          if (invoice && invoice.status !== "paid") {
            console.log("Paying subscription invoice out-of-band:", invoice.id);
            await stripe.invoices.pay(invoice.id, {
              paid_out_of_band: true,
            });
            console.log("Invoice marked as paid, subscription should now be active.");
          } else {
            console.log("Subscription invoice already paid or not found.");
          }

          // Add simple metadata flag so we can inspect in Stripe UI
          await stripe.subscriptions.update(subscriptionId, {
            metadata: {
              payment_confirmed: "true",
            },
          });

          console.log("Subscription metadata updated to mark payment confirmed.");
        } catch (subError) {
          console.error("Error while activating subscription from webhook:", subError);
        }
      }
    }

    // Handle checkout.session.completed event (for Stripe Checkout)
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      
      console.log("Processing checkout session:", session.id);
      console.log("Session mode:", session.mode);
      console.log("Session metadata:", session.metadata);

      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

      // 1) SUBSCRIPTION CHECKOUT
      if (session.mode === "subscription" && session.subscription) {
        console.log("Processing subscription checkout");
        
        // Get customer email from session
        const customerEmail = session.customer_email || session.customer_details?.email;
        
        if (!customerEmail) {
          console.error("No customer email found in checkout session");
          return new Response(JSON.stringify({ received: true }), { status: 200 });
        }

        console.log("Customer email:", customerEmail);

        // Find user by email
        const { data: profile, error: profileError } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("email", customerEmail)
          .single();

        if (profileError || !profile) {
          console.error("Could not find user profile for email:", customerEmail, profileError);
          return new Response(JSON.stringify({ received: true }), { status: 200 });
        }

        const userId = profile.id;
        console.log("Found user ID:", userId);

        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        const priceId = subscription.items.data[0]?.price.id;

        if (!priceId) {
          console.error("No price ID found in subscription");
          return new Response(JSON.stringify({ received: true }), { status: 200 });
        }

        console.log("Subscription price ID:", priceId);

        // Map price IDs to plans and credits (synced with frontend stripe-config.ts)
        const planMapping: Record<string, { plan: string; credits: number }> = {
          // Monthly plans
          "price_1TYhRdKbAjgJzP4OoKJLuqQT": { plan: "lite", credits: 40 },
          "price_1SXv5wKbAjgJzP4OZ4ItVTI6": { plan: "starter", credits: 100 },
          "price_1SXv5zKbAjgJzP4OvMuBKt2O": { plan: "professional", credits: 250 },
          "price_1SXv61KbAjgJzP4O6Lk56HVx": { plan: "enterprise", credits: 500 },
          // Yearly plans
          "price_1TYiClKbAjgJzP4OFk8CfXy9": { plan: "lite", credits: 480 },
          "price_1SXv5yKbAjgJzP4OvGPL0OSw": { plan: "starter", credits: 1200 },
          "price_1SXv60KbAjgJzP4OvawG7K1A": { plan: "professional", credits: 3000 },
          "price_1SXv62KbAjgJzP4OCvLBVd7K": { plan: "enterprise", credits: 6000 },
        };

        const planData = planMapping[priceId];

        if (!planData) {
          console.error("Unknown price ID:", priceId);
          return new Response(JSON.stringify({ received: true }), { status: 200 });
        }

        console.log("Plan data:", planData);

        // Idempotent grant: SET balance to the plan amount once per billing period
        // via the shared "subscription_refresh" marker (so this can't double-grant
        // with confirm-subscription / invoice.paid / payment_intent for the same
        // payment). Previously ADDED credits → 2× on the same purchase.
        const psSec = (subscription as any).current_period_start ?? (subscription.items.data[0] as any)?.current_period_start;
        const periodStartIso = psSec ? new Date(psSec * 1000).toISOString() : new Date(0).toISOString();
        const isEuro1Trial = session.metadata?.offerType === "euro1_trial";
        const creditsToSet = isEuro1Trial ? 10 : planData.credits;

        const { data: alreadyGranted } = await supabaseAdmin
          .from("credit_history")
          .select("id")
          .eq("user_id", userId)
          .eq("action_type", "subscription_refresh")
          .gte("created_at", periodStartIso)
          .limit(1);

        if (!alreadyGranted || alreadyGranted.length === 0) {
          const { data: currentCredits } = await supabaseAdmin
            .from("credits")
            .select("balance")
            .eq("user_id", userId)
            .maybeSingle();
          const oldBalance = currentCredits?.balance || 0;

          const { error: updateCreditsError } = await supabaseAdmin
            .from("credits")
            .update({ balance: creditsToSet })
            .eq("user_id", userId);
          if (updateCreditsError) {
            console.error("Error updating credits:", updateCreditsError);
          } else {
            await supabaseAdmin.from("credit_history").insert({
              user_id: userId,
              amount: creditsToSet - oldBalance,
              balance_after: creditsToSet,
              action_type: "subscription_refresh",
              description: `stripe-webhook checkout: ${planData.plan} plan — credits set to ${creditsToSet} (period ${periodStartIso})`,
            });
            console.log(`Credits set to ${creditsToSet} (was ${oldBalance})`);
          }
        } else {
          console.log("Credits already granted this billing period — skipping grant");
        }

        // Update plan
        const { error: updatePlanError } = await supabaseAdmin
          .from("profiles")
          .update({ plan: planData.plan })
          .eq("id", userId);

        if (updatePlanError) {
          console.error("Error updating plan:", updatePlanError);
        } else {
          console.log(`Plan updated to: ${planData.plan}`);
        }

        // Send welcome/upgrade email
        const { data: userProfile } = await supabaseAdmin
          .from("profiles")
          .select("email, full_name")
          .eq("id", userId)
          .single();

        if (userProfile?.email) {
          console.log("Sending upgrade email to:", userProfile.email);
          
          const emailResponse = await fetch(
            `${supabaseUrl}/functions/v1/send-upgrade-email`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
              },
              body: JSON.stringify({
                email: userProfile.email,
                firstName: userProfile.full_name || "",
                plan: planData.plan,
                credits: planData.credits,
              }),
            }
          );

          if (!emailResponse.ok) {
            console.error("Failed to send upgrade email");
          } else {
            console.log("Upgrade email sent successfully");
          }

          // Send admin notification email
          try {
            const adminNotifResponse = await fetch(
              `${supabaseUrl}/functions/v1/send-admin-purchase-notification`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
                },
                body: JSON.stringify({
                  userEmail: userProfile.email,
                  userName: userProfile.full_name || "",
                  type: "subscription",
                  plan: planData.plan,
                  credits: planData.credits,
                }),
              }
            );
            if (adminNotifResponse.ok) {
              console.log("Admin purchase notification sent");
            } else {
              console.error("Failed to send admin purchase notification");
            }
          } catch (adminEmailErr) {
            console.error("Error sending admin purchase notification:", adminEmailErr);
          }
        }
      }

      // 2) ONE-TIME PAYMENT (Credit packs)
      if (session.mode === "payment" && session.metadata?.userId && session.metadata?.credits) {
        console.log("Processing one-time credit pack payment");
        const userId = session.metadata.userId;
        const credits = parseInt(session.metadata.credits);
        const amount = (session.amount_total || 0) / 100; // Convert from cents to euros

        console.log(`Adding ${credits} credits to user ${userId} (amount: ${amount} EUR)`);

        // Get current balance
        const { data: currentCredit } = await supabaseAdmin
          .from("credits")
          .select("balance")
          .eq("user_id", userId)
          .maybeSingle();

        const currentBalance = currentCredit?.balance || 0;
        const newBalance = currentBalance + credits;

        // Update credits
        const { error: updateError } = await supabaseAdmin
          .from("credits")
          .update({ balance: newBalance })
          .eq("user_id", userId);

        if (updateError) {
          console.error("Error updating credits:", updateError);
          throw new Error("Failed to update credits");
        }

        console.log(`Credits updated successfully. New balance: ${newBalance}`);

        // Send confirmation email
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("email, full_name")
          .eq("id", userId)
          .single();

        if (profile?.email) {
          console.log("Sending purchase confirmation email to:", profile.email);
          
          const emailResponse = await fetch(
            `${supabaseUrl}/functions/v1/send-purchase-confirmation`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
              },
              body: JSON.stringify({
                email: profile.email,
                firstName: profile.full_name || "",
                credits: credits,
                amount: amount,
              }),
            }
          );

          if (!emailResponse.ok) {
            console.error("Failed to send confirmation email");
          } else {
            console.log("Confirmation email sent successfully");
          }

          // Send admin notification email for credit pack purchase
          try {
            const adminNotifResponse = await fetch(
              `${supabaseUrl}/functions/v1/send-admin-purchase-notification`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
                },
                body: JSON.stringify({
                  userEmail: profile.email,
                  userName: profile.full_name || "",
                  type: "credits",
                  credits: credits,
                  amount: amount,
                }),
              }
            );
            if (adminNotifResponse.ok) {
              console.log("Admin credit purchase notification sent");
            } else {
              console.error("Failed to send admin credit purchase notification");
            }
          } catch (adminEmailErr) {
            console.error("Error sending admin credit purchase notification:", adminEmailErr);
          }
        }
      }
    }

    // Handle subscription upgrades/changes from Stripe Customer Portal
    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription;
      console.log("Processing customer.subscription.updated:", subscription.id);

      const priceId = subscription.items.data[0]?.price.id;
      const customerId = subscription.customer as string | null;

      if (!priceId || !customerId) {
        console.error("Missing priceId or customerId on subscription update");
        return new Response(JSON.stringify({ received: true }), { status: 200 });
      }

      // Fetch customer to get email
      const customer = await stripe.customers.retrieve(customerId);
      if (customer.deleted || !customer.email) {
        console.error("Could not resolve email for customer on subscription update");
        return new Response(JSON.stringify({ received: true }), { status: 200 });
      }

      const customerEmail = customer.email;
      console.log("Resolved customer email for subscription update:", customerEmail);

      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

      // Find user by email
      const { data: profile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("email", customerEmail)
        .single();

      if (profileError || !profile) {
        console.error("Could not find user profile for subscription update email:", customerEmail, profileError);
        return new Response(JSON.stringify({ received: true }), { status: 200 });
      }

      const userId = profile.id;
      console.log("Matched subscription update to user ID:", userId);

      // Pause handling: a paused subscription (pause_collection set) is not being
      // billed, so revoke plan access and record the paused flag — and crucially
      // SKIP the credit-grant / plan-restore logic below, which would otherwise
      // undo the pause on the very event that Stripe fires when we pause. When
      // pause_collection is cleared (resume), fall through to restore the plan and
      // clear the flag. This keeps the DB correct even for out-of-band changes
      // (Stripe dashboard, or an auto-resume `resumes_at`).
      if (subscription.pause_collection) {
        const { error: pauseErr } = await supabaseAdmin
          .from("profiles")
          .update({ plan: "free", subscription_paused: true })
          .eq("id", userId);
        if (pauseErr) console.error("Error applying paused state:", pauseErr);
        else console.log("Subscription paused — downgraded to free, no credits granted");
        return new Response(JSON.stringify({ received: true }), { status: 200 });
      }

      const planMapping: Record<string, { plan: string; credits: number }> = {
        // Monthly plans
        "price_1TYhRdKbAjgJzP4OoKJLuqQT": { plan: "lite", credits: 40 },
          "price_1SXv5wKbAjgJzP4OZ4ItVTI6": { plan: "starter", credits: 100 },
        "price_1SXv5zKbAjgJzP4OvMuBKt2O": { plan: "professional", credits: 250 },
        "price_1SXv61KbAjgJzP4O6Lk56HVx": { plan: "enterprise", credits: 500 },
        // Yearly plans
        "price_1TYiClKbAjgJzP4OFk8CfXy9": { plan: "lite", credits: 480 },
          "price_1SXv5yKbAjgJzP4OvGPL0OSw": { plan: "starter", credits: 1200 },
        "price_1SXv60KbAjgJzP4OvawG7K1A": { plan: "professional", credits: 3000 },
        "price_1SXv62KbAjgJzP4OCvLBVd7K": { plan: "enterprise", credits: 6000 },
      };

      const planData = planMapping[priceId];

      if (!planData) {
        console.error("Unknown price ID on subscription update:", priceId);
        return new Response(JSON.stringify({ received: true }), { status: 200 });
      }

      console.log("Updating plan from subscription update to:", planData.plan);

      // Idempotent grant: SET balance to the plan amount once per billing period
      // via the shared "subscription_refresh" marker. Previously ADDED plan
      // credits on every subscription.updated event (double-grant risk).
      const psSec = (subscription as any).current_period_start ?? (subscription.items.data[0] as any)?.current_period_start;
      const periodStartIso = psSec ? new Date(psSec * 1000).toISOString() : new Date(0).toISOString();

      const { data: alreadyGranted } = await supabaseAdmin
        .from("credit_history")
        .select("id")
        .eq("user_id", userId)
        .eq("action_type", "subscription_refresh")
        .gte("created_at", periodStartIso)
        .limit(1);

      if (!alreadyGranted || alreadyGranted.length === 0) {
        const { data: currentCredits } = await supabaseAdmin
          .from("credits")
          .select("balance")
          .eq("user_id", userId)
          .maybeSingle();
        const oldBalance = currentCredits?.balance || 0;

        const { error: updateCreditsError } = await supabaseAdmin
          .from("credits")
          .update({ balance: planData.credits })
          .eq("user_id", userId);
        if (updateCreditsError) {
          console.error("Error updating credits:", updateCreditsError);
        } else {
          await supabaseAdmin.from("credit_history").insert({
            user_id: userId,
            amount: planData.credits - oldBalance,
            balance_after: planData.credits,
            action_type: "subscription_refresh",
            description: `stripe-webhook subscription.updated: ${planData.plan} plan — credits set to ${planData.credits} (period ${periodStartIso})`,
          });
          console.log(`Credits set to ${planData.credits} (was ${oldBalance})`);
        }
      } else {
        console.log("Subscription credits already granted this billing period — skipping grant");
      }

      // Update plan
      const { error: updatePlanError } = await supabaseAdmin
        .from("profiles")
        .update({ plan: planData.plan })
        .eq("id", userId);

      if (updatePlanError) {
        console.error("Error updating plan:", updatePlanError);
      } else {
        console.log(`Plan updated to: ${planData.plan}`);
      }
    }

    // Handle recurring invoice payments (monthly credit refresh)
    if (event.type === "invoice.paid" || event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as Stripe.Invoice;
      console.log("[stripe-webhook] Invoice paid:", invoice.id, "billing_reason:", invoice.billing_reason);

      // GA4 e-commerce, server-side source of truth. Runs BEFORE the
      // subscription_cycle early-return below, because first invoices — the €1
      // one included — are exactly the conversions we most need to report.
      // Gated to invoice.paid: invoice.payment_succeeded fires for the same
      // invoice and this endpoint subscribes to both.
      if (event.type === "invoice.paid") {
        await reportInvoiceToGa4(stripe, invoice);
      }

      // Only process recurring payments, not the first subscription invoice
      if (invoice.billing_reason !== "subscription_cycle") {
        console.log("[stripe-webhook] Not a recurring cycle invoice, skipping credit refresh");
        return new Response(JSON.stringify({ received: true }), { status: 200 });
      }

      const subscriptionId = invoice.subscription as string | null;
      if (!subscriptionId) {
        console.log("[stripe-webhook] No subscription ID on invoice, skipping");
        return new Response(JSON.stringify({ received: true }), { status: 200 });
      }

      const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ["items.data.price"],
      });

      const firstItem = subscription.items.data[0];
      const price = firstItem.price as Stripe.Price;
      const priceId = price.id;

      console.log("[stripe-webhook] Recurring renewal priceId:", priceId);

      const planMapping: Record<string, { plan: string; credits: number }> = {
        // Monthly plans
        "price_1TYhRdKbAjgJzP4OoKJLuqQT": { plan: "lite", credits: 40 },
          "price_1SXv5wKbAjgJzP4OZ4ItVTI6": { plan: "starter", credits: 100 },
        "price_1SXv5zKbAjgJzP4OvMuBKt2O": { plan: "professional", credits: 250 },
        "price_1SXv61KbAjgJzP4O6Lk56HVx": { plan: "enterprise", credits: 500 },
        // Yearly plans
        "price_1TYiClKbAjgJzP4OFk8CfXy9": { plan: "lite", credits: 480 },
          "price_1SXv5yKbAjgJzP4OvGPL0OSw": { plan: "starter", credits: 1200 },
        "price_1SXv60KbAjgJzP4OvawG7K1A": { plan: "professional", credits: 3000 },
        "price_1SXv62KbAjgJzP4OCvLBVd7K": { plan: "enterprise", credits: 6000 },
      };

      const planData = planMapping[priceId];
      if (!planData) {
        console.error("[stripe-webhook] Unknown price ID on renewal:", priceId);
        return new Response(JSON.stringify({ received: true }), { status: 200 });
      }

      // Find user by Stripe customer email
      const customerId = invoice.customer as string;
      const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
      const customerEmail = customer.email;

      if (!customerEmail) {
        console.error("[stripe-webhook] No email on Stripe customer:", customerId);
        return new Response(JSON.stringify({ received: true }), { status: 200 });
      }

      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

      const { data: profile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("email", customerEmail)
        .single();

      if (profileError || !profile) {
        console.error("[stripe-webhook] Could not find user for email:", customerEmail, profileError);
        return new Response(JSON.stringify({ received: true }), { status: 200 });
      }

      const userId = profile.id;
      console.log("[stripe-webhook] Monthly renewal for user:", userId, "plan:", planData.plan, "credits:", planData.credits);

      // Idempotency: grant exactly once per billing period. Coordinates with
      // stripe-webhook-subscription, change-subscription and the reconcile tools
      // via the shared "subscription_refresh" marker, so a duplicate invoice event
      // (or an already-reconciled account) can't re-set / refund consumed credits.
      const periodStart =
        (subscription as any).current_period_start ||
        (subscription.items.data[0] as any)?.current_period_start;
      if (periodStart) {
        const periodStartIso = new Date(periodStart * 1000).toISOString();
        const { data: alreadyRefreshed } = await supabaseAdmin
          .from("credit_history")
          .select("id")
          .eq("user_id", userId)
          .eq("action_type", "subscription_refresh")
          .gte("created_at", periodStartIso)
          .limit(1);
        if (alreadyRefreshed && alreadyRefreshed.length > 0) {
          console.log("[stripe-webhook] Credits already refreshed this period, skipping");
          return new Response(JSON.stringify({ received: true }), { status: 200 });
        }
      }

      // Get current balance before refresh
      const { data: currentCredits } = await supabaseAdmin
        .from("credits")
        .select("balance")
        .eq("user_id", userId)
        .maybeSingle();

      const oldBalance = currentCredits?.balance || 0;

      // Set credits to plan amount (fresh monthly allocation)
      const { error: updateCreditsError } = await supabaseAdmin
        .from("credits")
        .update({ balance: planData.credits })
        .eq("user_id", userId);

      if (updateCreditsError) {
        // Ack (200) so Stripe doesn't redeliver this invoice event forever; the
        // next billing event / manual reconcile can re-grant. Logged for follow-up.
        console.error("[stripe-webhook] Error refreshing credits (acknowledged):", updateCreditsError);
        return new Response(JSON.stringify({ received: true, warning: "credit_refresh_failed_logged" }), { status: 200 });
      }

      // Log credit history
      await supabaseAdmin.from("credit_history").insert({
        user_id: userId,
        amount: planData.credits - oldBalance,
        balance_after: planData.credits,
        action_type: "subscription_refresh",
        description: `Monthly ${planData.plan} plan renewal - credits refreshed to ${planData.credits}`,
      });

      console.log("[stripe-webhook] Credits refreshed to:", planData.credits, "for user:", userId);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200 }
    );
  } catch (error) {
    // Processing error AFTER signature verification. Acknowledge with 200 so Stripe
    // does not redeliver the same event over and over (that retry loop is what made
    // subscription.updated from a plan change / retention-discount / downgrade
    // reprocess continuously). The error is logged for manual follow-up.
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Webhook processing error (acknowledged to stop Stripe retry loop):", errorMessage);
    // Persist a record so this rare failure is queryable, not just in ephemeral logs.
    try {
      await createClient(supabaseUrl, supabaseServiceKey).from("webhook_failures").insert({
        source: "stripe-webhook",
        event_type: event?.type ?? null,
        event_id: event?.id ?? null,
        error: errorMessage,
      });
    } catch (_) { /* best effort — never let logging block the ack */ }
    return new Response(
      JSON.stringify({ received: true, warning: "processing_error_logged" }),
      { status: 200 }
    );
  }
});
