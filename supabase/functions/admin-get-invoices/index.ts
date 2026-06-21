import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, admin-token",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Verify admin token
    const adminToken = req.headers.get("admin-token");
    if (!adminToken) throw new Error("No admin token provided");

    const { data: session } = await supabaseClient
      .from("admin_sessions")
      .select("id")
      .eq("token", adminToken)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (!session) throw new Error("Invalid or expired admin session");

    const { email } = await req.json();
    if (!email) throw new Error("Email is required");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const customers = await stripe.customers.list({ email, limit: 1 });
    if (customers.data.length === 0) {
      return new Response(JSON.stringify({ invoices: [], hasCustomer: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;

    // Fetch invoices
    const invoices = await stripe.invoices.list({ customer: customerId, limit: 50 });

    // Also fetch payment intents for one-time purchases
    const paymentIntents = await stripe.paymentIntents.list({ customer: customerId, limit: 50 });

    const formattedInvoices = invoices.data.map((inv: Stripe.Invoice) => ({
      id: inv.id,
      number: inv.number,
      status: inv.status,
      amount: inv.amount_due,
      currency: inv.currency,
      created: inv.created,
      paidAt: inv.status_transitions?.paid_at,
      invoicePdf: inv.invoice_pdf,
      hostedInvoiceUrl: inv.hosted_invoice_url,
      description: inv.description || inv.lines?.data?.[0]?.description || "Subscription",
    }));

    // Add one-time payments not already covered by invoices
    const invoicePaymentIntentIds = new Set(
      invoices.data.map((inv: any) => inv.payment_intent).filter(Boolean)
    );

    const oneTimePayments = paymentIntents.data
      .filter((pi: any) => pi.status === "succeeded" && !invoicePaymentIntentIds.has(pi.id))
      .map((pi: any) => ({
        id: pi.id,
        number: `PI-${pi.id.slice(-8).toUpperCase()}`,
        status: "paid",
        amount: pi.amount,
        currency: pi.currency,
        created: pi.created,
        paidAt: pi.created,
        invoicePdf: null,
        hostedInvoiceUrl: null,
        description: pi.description || "Credit pack purchase",
      }));

    const allInvoices = [...formattedInvoices, ...oneTimePayments].sort(
      (a, b) => b.created - a.created
    );

    return new Response(JSON.stringify({ invoices: allInvoices, hasCustomer: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[ADMIN-GET-INVOICES] ERROR:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
