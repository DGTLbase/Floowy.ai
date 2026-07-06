// Read-only diagnostic for "why weren't credits granted?" questions.
// Given ?email=, it cross-references Supabase (profile, credits, credit_history)
// with Stripe (customer, subscriptions, invoices) and returns everything needed
// to see why an upgrade/conversion did or didn't credit. MUTATES NOTHING.
//
// Auth: requires the service-role key as Bearer (JWT-protected; not public).
//   GET/POST  ?email=someone@example.com
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b, null, 2), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    const email = (url.searchParams.get("email") || "").trim();
    if (!email) return json({ error: "email query param required" }, 400);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const out: any = { input_email: email, email_valid: (email.match(/@/g)?.length ?? 0) === 1 };

    // --- Supabase side ---
    const { data: profileExact } = await admin
      .from("profiles")
      .select("id, email, plan, full_name, created_at")
      .eq("email", email)
      .maybeSingle();
    out.profile_exact_match = profileExact ?? null;

    // If no exact match (e.g. typo/malformed email), surface close candidates.
    if (!profileExact) {
      const localPart = email.split("@")[0]?.replace(/[%_]/g, "") || email;
      const { data: candidates } = await admin
        .from("profiles")
        .select("id, email, plan, created_at")
        .ilike("email", `%${localPart}%`)
        .limit(10);
      out.profile_candidates = candidates ?? [];
    }

    const profile = profileExact ?? null;
    if (profile) {
      const { data: credit } = await admin
        .from("credits").select("balance, updated_at").eq("user_id", profile.id).maybeSingle();
      out.credits = credit ?? null;

      const { data: history } = await admin
        .from("credit_history")
        .select("amount, balance_after, action_type, description, created_at")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(25);
      out.credit_history = history ?? [];
    }

    // --- Stripe side (search by the exact email as stored) ---
    const customers = await stripe.customers.list({ email, limit: 5 });
    out.stripe_customers_found = customers.data.length;
    out.stripe = [];
    for (const c of customers.data) {
      const subs = await stripe.subscriptions.list({ customer: c.id, status: "all", limit: 10 });
      const invoices = await stripe.invoices.list({ customer: c.id, limit: 20 });
      out.stripe.push({
        customer_id: c.id,
        customer_email: c.email,
        subscriptions: subs.data.map((s) => ({
          id: s.id,
          status: s.status,
          price_id: s.items.data[0]?.price?.id,
          current_period_start: (s as any).current_period_start ?? (s.items.data[0] as any)?.current_period_start,
          trial_end: s.trial_end,
          metadata: s.metadata,
        })),
        invoices: invoices.data.map((i) => ({
          id: i.id,
          status: i.status,
          billing_reason: i.billing_reason,
          amount_due: i.amount_due,
          amount_paid: i.amount_paid,
          created: i.created,
        })),
      });
    }

    // --- Quick automated read of the situation ---
    const notes: string[] = [];
    if (!out.email_valid) notes.push("Email is malformed (not exactly one '@') — email-based Stripe↔profile matching can fail.");
    if (!profile) notes.push("No profile found for this exact email — check profile_candidates for the real address.");
    if (customers.data.length === 0) notes.push("No Stripe customer for this email — no payment/subscription is linked to it.");
    if (profile && customers.data.length > 0) {
      const paidInvoices = out.stripe.flatMap((s: any) => s.invoices).filter((i: any) => i.status === "paid" && i.amount_paid > 0);
      notes.push(`Paid invoices: ${paidInvoices.length} (total ${paidInvoices.reduce((a: number, i: any) => a + i.amount_paid, 0)} cents).`);
      const hasRefresh = (out.credit_history ?? []).some((h: any) => h.action_type === "subscription_refresh");
      notes.push(hasRefresh
        ? "A subscription_refresh credit grant IS recorded — credits were granted at least once."
        : "NO subscription_refresh grant recorded — the plan credits were never applied (this is the bug symptom).");
    }
    out.diagnosis_notes = notes;

    return json(out);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
