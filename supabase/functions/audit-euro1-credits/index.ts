// Audit + adjust "10-credit" accounts that never actually paid the €1 offer.
//
// Background: the €1 offer uses a Stripe Checkout in mode:"setup" (saves a card,
// charges nothing). confirm-euro1 then sets credits.balance = 10 off the saved
// card WITHOUT verifying the €1 was ever captured — so accounts whose €1 was
// declined / abandoned / never charged keep 10 free credits.
//
// This function finds every account with balance == 10, checks Stripe for a real
// payment, and (only with ?apply=true) resets the NON-PAYERS to the signup
// baseline. READ-ONLY by default (dry run) so you can review first.
//
// Query params:
//   (none)            → dry run: report only, mutates nothing
//   ?apply=true       → reset non-payers' balance to `target`
//   ?target=4         → baseline to reset non-payers to (default 4 = current signup default)
//   ?only_email=x     → restrict to a single account (for safe testing)
//
// Auth: requires the service-role key as Bearer (JWT-protected; not public).
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TRIAL_BALANCE = 10; // the value confirm-euro1 sets

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const apply = url.searchParams.get("apply") === "true";
    const target = Number(url.searchParams.get("target") ?? "4");
    const onlyEmail = url.searchParams.get("only_email")?.toLowerCase() || null;

    if (!Number.isFinite(target) || target < 0) {
      return json({ error: "invalid target" }, 400);
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });
    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // 1) All accounts currently sitting at the €1-trial allotment.
    const { data: creditRows, error: credErr } = await admin
      .from("credits")
      .select("user_id, balance")
      .eq("balance", TRIAL_BALANCE);
    if (credErr) return json({ error: `credits query failed: ${credErr.message}` }, 500);

    const report: any[] = [];
    let adjusted = 0;
    let paidCount = 0;

    for (const row of creditRows ?? []) {
      // Resolve the account's email + plan.
      const { data: profile } = await admin
        .from("profiles")
        .select("id, email, plan, created_at")
        .eq("id", row.user_id)
        .maybeSingle();

      const email = profile?.email as string | undefined;
      if (onlyEmail && (email ?? "").toLowerCase() !== onlyEmail) continue;

      if (!email) {
        report.push({ user_id: row.user_id, skipped: "no email on profile" });
        continue;
      }

      // Look up the Stripe customer and any REAL payment they've made.
      const customers = await stripe.customers.list({ email, limit: 1 });
      let paidTotal = 0;
      let paidInvoices = 0;
      let subStatus: string | null = null;
      let customerId: string | null = null;

      if (customers.data.length > 0) {
        customerId = customers.data[0].id;

        // Any paid invoice at all? (a genuine €1 buyer has ≥1 paid invoice;
        // the €1 launch charge rides on the subscription_create invoice.)
        const invoices = await stripe.invoices.list({ customer: customerId, limit: 100 });
        for (const inv of invoices.data) {
          if (inv.status === "paid" && (inv.amount_paid ?? 0) > 0) {
            paidInvoices++;
            paidTotal += inv.amount_paid ?? 0;
          }
        }

        // Newest subscription status, for context.
        const subs = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 1 });
        subStatus = subs.data[0]?.status ?? null;
      }

      const paid = paidTotal > 0;
      if (paid) paidCount++;

      const entry: any = {
        email,
        plan: profile?.plan ?? null,
        balance: row.balance,
        stripe_customer: customerId,
        paid_invoices: paidInvoices,
        paid_total_cents: paidTotal,
        subscription_status: subStatus,
        classification: paid ? "PAID — leave as is" : "UNPAID — 10 free credits",
        signed_up: profile?.created_at ?? null,
      };

      if (!paid && apply) {
        const { error: updErr } = await admin
          .from("credits")
          .update({ balance: target })
          .eq("user_id", row.user_id);
        if (updErr) {
          entry.adjust_error = updErr.message;
        } else {
          await admin.from("credit_history").insert({
            user_id: row.user_id,
            amount: target - TRIAL_BALANCE, // negative
            balance_after: target,
            action_type: "euro1_unpaid_adjustment",
            description: `Reset from ${TRIAL_BALANCE} to ${target}: €1 offer credits granted without a completed payment`,
          });
          entry.adjusted = { from: TRIAL_BALANCE, to: target };
          adjusted++;
        }
      }

      report.push(entry);
    }

    return json({
      mode: apply ? "APPLY" : "DRY_RUN",
      target,
      only_email: onlyEmail,
      scanned: creditRows?.length ?? 0,
      paid_kept: paidCount,
      unpaid_found: (creditRows?.length ?? 0) - paidCount,
      adjusted,
      report,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[audit-euro1-credits] ERROR", msg);
    return json({ error: msg }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
