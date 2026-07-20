// Audit + (optionally) fix accounts that were OVER-credited by the subscription
// double-grant bug (confirm-subscription + stripe-webhook each ADDED plan credits
// with no shared idempotency marker → e.g. Lite 40 → 80).
//
// For every account on a paid plan it resolves the ACTUAL Stripe subscription
// price → expected plan credits, then compares to the live balance and the
// credit_history trail. READ-ONLY by default (dry run).
//
// Query params:
//   (none)          → dry run: report only, mutates nothing
//   ?apply=true     → reset ONLY the unambiguous clean double-grants (see below)
//   ?only_email=x   → restrict to a single account (safe testing)
//   ?limit=N        → cap accounts scanned (default: all)
//
// "safe_autofix" (the only thing ?apply touches) is deliberately conservative —
// it requires ALL of: balance > expected, ZERO credits ever spent, and NO
// non-subscription positive history (no purchased credit packs / admin grants /
// bonuses). Those excess credits can only be duplicate plan grants, so resetting
// balance→expected can't remove anything the user earned or bought. Everything
// else that looks over-credited is reported as "OVER — manual review" and left
// untouched (e.g. Thomas, who already spent credits, needs a manual decision).
//
// Auth: requires the service-role key as Bearer.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b, null, 2), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

// price → { plan, credits }, synced with the grant functions.
const PLAN_MAPPING: Record<string, { plan: string; credits: number }> = {
  "price_1TYhRdKbAjgJzP4OoKJLuqQT": { plan: "lite", credits: 40 },
  "price_1SXv5wKbAjgJzP4OZ4ItVTI6": { plan: "starter", credits: 100 },
  "price_1SXv5zKbAjgJzP4OvMuBKt2O": { plan: "professional", credits: 250 },
  "price_1SXv61KbAjgJzP4O6Lk56HVx": { plan: "enterprise", credits: 500 },
  "price_1TYiClKbAjgJzP4OFk8CfXy9": { plan: "lite", credits: 480 },
  "price_1SXv5yKbAjgJzP4OvGPL0OSw": { plan: "starter", credits: 1200 },
  "price_1SXv60KbAjgJzP4OvawG7K1A": { plan: "professional", credits: 3000 },
  "price_1SXv62KbAjgJzP4OCvLBVd7K": { plan: "enterprise", credits: 6000 },
};
const PAID_PLANS = ["lite", "starter", "professional", "enterprise"];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    // Service-role only — this can reduce balances.
    const token = (req.headers.get("Authorization") || "").replace("Bearer ", "").trim();
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    if (!serviceKey || token !== serviceKey) {
      return json({ error: "Unauthorized — service-role key required as Bearer" }, 401);
    }

    const url = new URL(req.url);
    const apply = url.searchParams.get("apply") === "true";
    const onlyEmail = url.searchParams.get("only_email")?.toLowerCase() || null;
    const limit = Number(url.searchParams.get("limit") ?? "0") || 0;

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });
    const admin = createClient(Deno.env.get("SUPABASE_URL") ?? "", serviceKey);

    // All accounts on a paid plan.
    let q = admin.from("profiles").select("id, email, plan, created_at").in("plan", PAID_PLANS);
    if (onlyEmail) q = q.eq("email", onlyEmail);
    const { data: profiles, error: profErr } = await q;
    if (profErr) return json({ error: `profiles query failed: ${profErr.message}` }, 500);

    const rows = (profiles ?? []).slice(0, limit > 0 ? limit : undefined);
    const report: any[] = [];
    let over = 0, fixed = 0, skippedNoSub = 0;

    for (const p of rows) {
      const email = p.email as string | undefined;
      if (!email) { report.push({ user_id: p.id, skipped: "no email" }); continue; }

      // Resolve the actual active-subscription price → expected credits.
      const customers = await stripe.customers.list({ email, limit: 1 });
      if (customers.data.length === 0) { report.push({ email, plan: p.plan, skipped: "no stripe customer" }); skippedNoSub++; continue; }
      const subs = await stripe.subscriptions.list({ customer: customers.data[0].id, status: "active", limit: 1 });
      const priceId = subs.data[0]?.items.data[0]?.price.id;
      const planData = priceId ? PLAN_MAPPING[priceId] : undefined;
      if (!planData) { report.push({ email, plan: p.plan, skipped: "no active subscription / unknown price" }); skippedNoSub++; continue; }
      const expected = planData.credits;

      // Live balance.
      const { data: creditRow } = await admin.from("credits").select("balance").eq("user_id", p.id).maybeSingle();
      const balance = creditRow?.balance ?? 0;

      // Credit-history signals.
      const { data: hist } = await admin
        .from("credit_history")
        .select("amount, action_type")
        .eq("user_id", p.id)
        .limit(2000);
      let spent = 0;
      let hasNonRefreshPositive = false;
      let refreshGrants = 0;
      for (const h of hist ?? []) {
        const amt = Number(h.amount) || 0;
        if (amt < 0) spent += -amt;
        if (amt > 0 && h.action_type !== "subscription_refresh") hasNonRefreshPositive = true;
        if (h.action_type === "subscription_refresh") refreshGrants++;
      }

      const isOver = balance > expected;
      const safeAutofix = isOver && spent === 0 && !hasNonRefreshPositive;
      if (isOver) over++;

      const entry: any = {
        email,
        profile_plan: p.plan,
        stripe_plan: planData.plan,
        expected_credits: expected,
        balance,
        excess: isOver ? balance - expected : 0,
        credits_spent: spent,
        subscription_grant_rows: refreshGrants,
        has_purchased_or_admin_credits: hasNonRefreshPositive,
        classification: !isOver ? "OK"
          : safeAutofix ? "OVER — clean duplicate (safe to reset)"
          : "OVER — manual review (has spend or purchased/admin credits)",
        signed_up: p.created_at ?? null,
      };

      if (apply && safeAutofix) {
        const { error: updErr } = await admin.from("credits").update({ balance: expected }).eq("user_id", p.id);
        if (updErr) {
          entry.adjust_error = updErr.message;
        } else {
          await admin.from("credit_history").insert({
            user_id: p.id,
            amount: expected - balance, // negative
            balance_after: expected,
            action_type: "overcredit_adjustment",
            description: `Reset from ${balance} to ${expected}: subscription double-grant correction (${planData.plan})`,
          });
          entry.adjusted = { from: balance, to: expected };
          fixed++;
        }
      }

      report.push(entry);
    }

    // Sort worst-first for readability.
    report.sort((a, b) => (b.excess ?? 0) - (a.excess ?? 0));

    return json({
      mode: apply ? "APPLY" : "DRY_RUN",
      only_email: onlyEmail,
      scanned: rows.length,
      over_credited: over,
      auto_fixed: fixed,
      skipped_no_active_sub: skippedNoSub,
      note: "Only 'OVER — clean duplicate' rows are auto-fixed with ?apply=true. 'OVER — manual review' rows are left untouched.",
      report,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[audit-overcredit-subscriptions] ERROR", msg);
    return json({ error: msg }, 500);
  }
});
