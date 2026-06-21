import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GET-INVOICES] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    // Find customer by email
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found");
      return new Response(JSON.stringify({ invoices: [], hasCustomer: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Fetch all invoices for this customer (including all statuses)
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: 100,
    });

    logStep("Fetched invoices", { count: invoices.data.length });

    // If no invoices found, also check for payment intents (one-time purchases)
    let paymentIntentsAsInvoices: any[] = [];
    if (invoices.data.length === 0) {
      logStep("No invoices found, checking payment intents");
      const paymentIntents = await stripe.paymentIntents.list({
        customer: customerId,
        limit: 100,
      });
      
      logStep("Fetched payment intents", { count: paymentIntents.data.length });
      
      // Convert successful payment intents to invoice-like format
      paymentIntentsAsInvoices = paymentIntents.data
        .filter((pi: any) => pi.status === 'succeeded')
        .map((pi: any) => ({
          id: pi.id,
          number: `PI-${pi.id.slice(-8).toUpperCase()}`,
          status: 'paid',
          amount: pi.amount,
          currency: pi.currency,
          created: pi.created,
          dueDate: null,
          paidAt: pi.created,
          invoicePdf: null,
          hostedInvoiceUrl: null,
          periodStart: pi.created,
          periodEnd: pi.created,
          description: pi.description || "One-time payment",
          isPaymentIntent: true,
        }));
    }

    // Format invoices for the frontend
    const formattedInvoices = invoices.data.map((invoice: Stripe.Invoice) => ({
      id: invoice.id,
      number: invoice.number,
      status: invoice.status,
      amount: invoice.amount_due,
      currency: invoice.currency,
      created: invoice.created,
      dueDate: invoice.due_date,
      paidAt: invoice.status_transitions?.paid_at,
      invoicePdf: invoice.invoice_pdf,
      hostedInvoiceUrl: invoice.hosted_invoice_url,
      periodStart: invoice.period_start,
      periodEnd: invoice.period_end,
      description: invoice.description || invoice.lines?.data?.[0]?.description || "Subscription",
      isPaymentIntent: false,
    }));

    // Combine invoices and payment intents
    const allInvoices = [...formattedInvoices, ...paymentIntentsAsInvoices];
    logStep("Total billing records", { count: allInvoices.length });

    return new Response(JSON.stringify({ 
      invoices: allInvoices, 
      hasCustomer: true,
      hasSubscription: invoices.data.length > 0
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in get-invoices", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
