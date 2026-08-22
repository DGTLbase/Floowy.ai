import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, admin-token",
};

/**
 * Lists the €1-trial subscriptions straight from Stripe, for the admin page.
 *
 * WHY THIS READS STRIPE RATHER THAN THE DATABASE
 * The admin page infers subscription state from profiles.plan: a paid plan
 * counts as an active subscription, and a cancellation_feedback row counts as
 * cancelled. That drifts from Stripe in both directions. A €1 trial is
 * "trialing" in Stripe, not "active". Someone who cancels through Stripe or
 * whose card fails leaves profiles.plan untouched, so they keep showing as
 * active. And cancellation_feedback only exists if they cancelled through our
 * own flow. Stripe is the system of record for money, so this reads it.
 *
 * BASIL NOTE
 * The webhook pins apiVersion 2025-08-27.basil, and Basil moved billing periods
 * off the subscription and onto its ITEMS. subscription.current_period_end is
 * gone; reading it returns undefined and every renewal date renders as blank or
 * as 1 Jan 1970. The period is read item-first here for that reason.
 */

const periodEnd = (sub: any): number | null =>
  sub?.items?.data?.[0]?.current_period_end ?? sub?.current_period_end ?? null;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    // Same admin-session check the other admin functions use.
    const adminToken = req.headers.get("admin-token");
    if (!adminToken) throw new Error("No admin token provided");
    const { data: session } = await supabase
      .from("admin_sessions").select("id")
      .eq("token", adminToken).gt("expires_at", new Date().toISOString()).maybeSingle();
    if (!session) throw new Error("Invalid or expired admin session");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Every subscription, not just active ones: the point of this view is to
    // show what Stripe actually holds, including past_due and cancelled.
    const rows: any[] = [];
    let startingAfter: string | undefined;
    let pages = 0;
    while (pages < 20) {
      const page = await stripe.subscriptions.list({
        status: "all", limit: 100, starting_after: startingAfter,
        expand: ["data.customer"],
      });
      for (const sub of page.data) {
        const meta = { ...(sub.metadata ?? {}) };
        // confirm-euro1 stamps offerType on the subscription it creates.
        if (meta.offerType !== "euro1_trial") continue;
        const item = sub.items?.data?.[0];
        const customer: any = sub.customer;
        rows.push({
          subscriptionId: sub.id,
          status: sub.status,
          email: typeof customer === "object" ? customer?.email ?? null : null,
          customerId: typeof customer === "object" ? customer?.id : customer,
          plan: meta.plan ?? null,
          userId: meta.userId ?? null,
          created: sub.created,
          trialEnd: sub.trial_end ?? null,
          currentPeriodEnd: periodEnd(sub),
          cancelAtPeriodEnd: !!sub.cancel_at_period_end,
          canceledAt: sub.canceled_at ?? null,
          amount: item?.price?.unit_amount ?? null,
          currency: (item?.price?.currency ?? "eur").toUpperCase(),
          interval: item?.price?.recurring?.interval ?? null,
        });
      }
      if (!page.has_more) break;
      startingAfter = page.data[page.data.length - 1]?.id;
      pages++;
    }

    rows.sort((a, b) => (b.created ?? 0) - (a.created ?? 0));

    const counts = rows.reduce((acc: Record<string, number>, r) => {
      acc[r.status] = (acc[r.status] ?? 0) + 1;
      return acc;
    }, {});

    // Cross-check against what the app believes, so a drift is visible rather
    // than something an admin has to notice by eye.
    const userIds = rows.map((r) => r.userId).filter(Boolean);
    const planByUser: Record<string, string> = {};
    if (userIds.length) {
      const { data: profiles } = await supabase
        .from("profiles").select("id, plan").in("id", userIds);
      for (const p of profiles ?? []) planByUser[p.id] = p.plan;
    }
    const LIVE = ["active", "trialing", "past_due", "unpaid"];
    for (const r of rows) {
      r.appPlan = r.userId ? planByUser[r.userId] ?? null : null;
      const liveInStripe = LIVE.includes(r.status);
      const paidInApp = ["lite", "starter", "professional", "enterprise"]
        .includes(String(r.appPlan ?? "").toLowerCase());
      r.mismatch = liveInStripe !== paidInApp;
    }

    return new Response(
      JSON.stringify({ subscriptions: rows, total: rows.length, counts,
        mismatches: rows.filter((r) => r.mismatch).length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[admin-euro1-subscriptions]", message);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500,
    });
  }
});
