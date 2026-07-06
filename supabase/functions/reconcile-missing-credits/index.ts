// SAFE recovery for accounts that paid for a plan but never received the credits
// (the day-3 conversion / upgrade webhook failing). Unlike backfill-subscription-
// credits, this NEVER refunds consumed credits: it only touches accounts that have
// used ZERO credits and whose balance is below their plan allocation. So a heavy
// user with a low balance (usage) is left alone; only genuine "charged, never
// credited" accounts (like a stuck €1→plan conversion) are topped up.
//
// Criteria to grant (all must hold):
//   - Stripe subscription is ACTIVE (trial already converted / real plan billing)
//   - price maps to a known plan
//   - total_credits_used == 0        (nothing consumed → setting to plan refunds nothing)
//   - balance < plan credits          (actually short of the allocation)
//   - no "subscription_refresh" credit_history row this billing period (idempotent)
//
// Query: (none) = dry run; ?apply=true to grant. Service-role JWT only.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b, null, 2), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const PLAN_MAPPING: Record<string, { plan: string; credits: number }> = {
  "price_1TYhRdKbAjgJzP4OoKJLuqQT": { plan: "lite", credits: 40 },
  "price_1SXv5wKbAjgJzP4OZ4ItVTI6": { plan: "starter", credits: 100 },
  "price_1SXv5zKbAjgJzP4OvMuBKt2O": { plan: "professional", credits: 250 },
  "price_1ShA0EKbAjgJzP4OS9TVcaIP": { plan: "enterprise", credits: 500 },
  "price_1SXv61KbAjgJzP4O6Lk56HVx": { plan: "enterprise", credits: 500 },
  "price_1TYiClKbAjgJzP4OFk8CfXy9": { plan: "lite", credits: 480 },
  "price_1SXv5yKbAjgJzP4OvGPL0OSw": { plan: "starter", credits: 1200 },
  "price_1SXv60KbAjgJzP4OvawG7K1A": { plan: "professional", credits: 3000 },
  "price_1Sfu1DKbAjgJzP4O68Keb4AQ": { plan: "enterprise", credits: 6000 },
  "price_1SXv62KbAjgJzP4OCvLBVd7K": { plan: "enterprise", credits: 6000 },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const apply = new URL(req.url).searchParams.get("apply") === "true";
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });
    const admin = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

    const report: any[] = [];
    let granted = 0;
    let startingAfter: string | undefined;

    while (true) {
      const subs: any = await stripe.subscriptions.list({
        status: "active", limit: 100, starting_after: startingAfter, expand: ["data.customer"],
      });

      for (const sub of subs.data) {
        const priceId = sub.items.data[0]?.price?.id;
        const planData = priceId ? PLAN_MAPPING[priceId] : null;
        const email = (sub.customer as Stripe.Customer)?.email;
        const periodStart = (sub as any).current_period_start || sub.items.data[0]?.current_period_start;
        if (!planData || !email || !periodStart) continue;

        const { data: profile } = await admin.from("profiles").select("id").eq("email", email).maybeSingle();
        if (!profile) { report.push({ email, skipped: "no profile" }); continue; }

        const { data: credit } = await admin
          .from("credits").select("balance, total_credits_used").eq("user_id", profile.id).maybeSingle();
        const balance = credit?.balance ?? 0;
        const used = credit?.total_credits_used ?? 0;

        // SAFETY: never touch accounts that have consumed credits, or that already
        // have their full allocation.
        if (used > 0) { report.push({ email, plan: planData.plan, balance, used, skipped: "has usage — not a credit-grant victim" }); continue; }
        if (balance >= planData.credits) { report.push({ email, plan: planData.plan, balance, used, skipped: "already at/above plan credits" }); continue; }

        // Idempotency: already granted this period?
        const periodIso = new Date(periodStart * 1000).toISOString();
        const { data: existing } = await admin
          .from("credit_history").select("id")
          .eq("user_id", profile.id).eq("action_type", "subscription_refresh")
          .gte("created_at", periodIso).limit(1);
        if (existing && existing.length > 0) { report.push({ email, plan: planData.plan, balance, used, skipped: "already refreshed this cycle" }); continue; }

        const entry: any = { email, plan: planData.plan, from: balance, to: planData.credits, used };
        if (apply) {
          const { error: updErr } = await admin.from("credits").update({ balance: planData.credits }).eq("user_id", profile.id);
          if (updErr) { entry.error = updErr.message; report.push(entry); continue; }
          await admin.from("credit_history").insert({
            user_id: profile.id,
            amount: planData.credits - balance,
            balance_after: planData.credits,
            action_type: "subscription_refresh",
            description: `Reconcile missing conversion credits: ${planData.plan} plan (period ${periodIso}) — set ${balance}→${planData.credits}`,
          });
          await admin.from("profiles").update({ plan: planData.plan }).eq("id", profile.id);
          entry.granted = true;
          granted++;
        } else {
          entry.wouldGrant = true;
        }
        report.push(entry);
      }

      if (!subs.has_more) break;
      startingAfter = subs.data[subs.data.length - 1].id;
    }

    return json({ mode: apply ? "APPLY" : "DRY_RUN", granted, count: report.length, report });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
