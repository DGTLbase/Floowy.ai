import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const planMapping: Record<string, { plan: string; credits: number }> = {
  // Monthly
  "price_1TYhRdKbAjgJzP4OoKJLuqQT": { plan: "lite", credits: 40 },
  "price_1SXv5wKbAjgJzP4OZ4ItVTI6": { plan: "starter", credits: 100 },
  "price_1SXv5zKbAjgJzP4OvMuBKt2O": { plan: "professional", credits: 250 },
  "price_1SXv61KbAjgJzP4O6Lk56HVx": { plan: "enterprise", credits: 500 },
  // Yearly
  "price_1TYiClKbAjgJzP4OFk8CfXy9": { plan: "lite", credits: 480 },
  "price_1SXv5yKbAjgJzP4OvGPL0OSw": { plan: "starter", credits: 1200 },
  "price_1SXv60KbAjgJzP4OvawG7K1A": { plan: "professional", credits: 3000 },
  "price_1SXv62KbAjgJzP4OCvLBVd7K": { plan: "enterprise", credits: 6000 },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const dryRun = url.searchParams.get("dry_run") === "true";

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });
    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const report: any[] = [];
    let totalRefreshed = 0;

    // Iterate all active subscriptions
    let startingAfter: string | undefined = undefined;
    while (true) {
      const subs: any = await stripe.subscriptions.list({
        status: "active",
        limit: 100,
        starting_after: startingAfter,
        expand: ["data.customer"],
      });

      for (const sub of subs.data) {
        const priceId = sub.items.data[0]?.price?.id;
        const planData = priceId ? planMapping[priceId] : null;
        const customer = sub.customer as Stripe.Customer;
        const email = customer?.email;
        // current_period_start is on the subscription (or fallback to items)
        const periodStart =
          (sub as any).current_period_start ||
          sub.items.data[0]?.current_period_start;

        if (!planData || !email || !periodStart) {
          report.push({
            sub: sub.id,
            email,
            skipped: "missing planData/email/periodStart",
            priceId,
          });
          continue;
        }

        const periodStartIso = new Date(periodStart * 1000).toISOString();

        // Find user
        const { data: profile } = await admin
          .from("profiles")
          .select("id")
          .eq("email", email)
          .maybeSingle();

        if (!profile) {
          report.push({ sub: sub.id, email, skipped: "no profile" });
          continue;
        }

        // Has a subscription_refresh already happened this period?
        const { data: existing } = await admin
          .from("credit_history")
          .select("id")
          .eq("user_id", profile.id)
          .eq("action_type", "subscription_refresh")
          .gte("created_at", periodStartIso)
          .limit(1);

        if (existing && existing.length > 0) {
          report.push({
            sub: sub.id,
            email,
            skipped: "already refreshed this cycle",
            periodStart: periodStartIso,
          });
          continue;
        }

        // Get current balance
        const { data: creditRow } = await admin
          .from("credits")
          .select("balance")
          .eq("user_id", profile.id)
          .maybeSingle();
        const oldBalance = creditRow?.balance || 0;

        if (dryRun) {
          report.push({
            sub: sub.id,
            email,
            wouldRefresh: true,
            plan: planData.plan,
            from: oldBalance,
            to: planData.credits,
            periodStart: periodStartIso,
          });
          continue;
        }

        // Refresh: set balance to plan allocation
        const { error: updErr } = await admin
          .from("credits")
          .update({ balance: planData.credits })
          .eq("user_id", profile.id);

        if (updErr) {
          report.push({ sub: sub.id, email, error: updErr.message });
          continue;
        }

        await admin.from("credit_history").insert({
          user_id: profile.id,
          amount: planData.credits - oldBalance,
          balance_after: planData.credits,
          action_type: "subscription_refresh",
          description: `Backfill: ${planData.plan} plan cycle starting ${periodStartIso} — credits set to ${planData.credits}`,
        });

        // Keep profiles.plan in sync
        await admin
          .from("profiles")
          .update({ plan: planData.plan })
          .eq("id", profile.id);

        totalRefreshed++;
        report.push({
          sub: sub.id,
          email,
          refreshed: true,
          plan: planData.plan,
          from: oldBalance,
          to: planData.credits,
          periodStart: periodStartIso,
        });
      }

      if (!subs.has_more) break;
      startingAfter = subs.data[subs.data.length - 1].id;
    }

    return new Response(
      JSON.stringify({ dryRun, totalRefreshed, count: report.length, report }, null, 2),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[backfill-subscription-credits] ERROR", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});