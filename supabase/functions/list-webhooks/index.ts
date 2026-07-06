// Read-only: lists the Stripe webhook endpoints registered for this account, with
// their URL, status and subscribed events. Used to resolve which of our two
// webhook functions Stripe actually calls, and whether invoice.paid is subscribed
// (the root cause of missed day-3 conversion credits). Mutates nothing.
// Auth: service-role JWT.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });
    const endpoints = await stripe.webhookEndpoints.list({ limit: 30 });
    const out = endpoints.data.map((e) => ({
      id: e.id,
      url: e.url,
      status: e.status,
      api_version: e.api_version,
      has_invoice_paid: e.enabled_events.includes("invoice.paid") || e.enabled_events.includes("*"),
      enabled_events: e.enabled_events,
    }));
    return new Response(JSON.stringify({ count: out.length, endpoints: out }, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }, null, 2), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
