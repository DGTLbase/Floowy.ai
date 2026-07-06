// One-off admin op: add the missing events to the live `stripe-webhook` endpoint.
// The endpoint was missing checkout.session.completed + customer.subscription.updated,
// which the handler DOES process — so new-subscription checkouts and subscription
// updates weren't reaching us. Merges (union) onto the existing events so nothing is
// dropped, targets ONLY the enabled `/stripe-webhook` endpoint, and is idempotent
// (no-op if the events are already present). Service-role JWT only.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Events our stripe-webhook handler processes but that were not subscribed.
const EVENTS_TO_ADD = ["checkout.session.completed", "customer.subscription.updated"];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });
    const endpoints = await stripe.webhookEndpoints.list({ limit: 30 });

    // Target only the enabled endpoint whose URL is exactly our stripe-webhook.
    const target = endpoints.data.find(
      (e) => e.status === "enabled" && e.url.endsWith("/functions/v1/stripe-webhook"),
    );
    if (!target) {
      return json({ error: "No enabled /stripe-webhook endpoint found", endpoints: endpoints.data.map((e) => ({ url: e.url, status: e.status })) }, 404);
    }

    const existing = new Set(target.enabled_events);
    const missing = EVENTS_TO_ADD.filter((ev) => !existing.has(ev) && !existing.has("*"));

    if (missing.length === 0) {
      return json({ changed: false, message: "Events already present", endpoint_id: target.id, enabled_events: target.enabled_events });
    }

    const merged = [...target.enabled_events, ...missing];
    const updated = await stripe.webhookEndpoints.update(target.id, { enabled_events: merged as any });

    return json({
      changed: true,
      endpoint_id: updated.id,
      url: updated.url,
      added: missing,
      enabled_events: updated.enabled_events,
    });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});

function json(b: unknown, s = 200) {
  return new Response(JSON.stringify(b, null, 2), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
