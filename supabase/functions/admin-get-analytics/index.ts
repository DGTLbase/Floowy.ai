import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, admin-token, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const adminToken = req.headers.get("admin-token");
    
    if (!adminToken) {
      return new Response(
        JSON.stringify({ error: "Admin authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify admin session
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: session, error: sessionError } = await supabaseAdmin
      .from("admin_sessions")
      .select("admin_id, expires_at")
      .eq("token", adminToken)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired admin session" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { timeframe } = await req.json();
    const period = timeframe || "monthly"; // "monthly" or "yearly"

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Calculate date range based on timeframe
    const now = new Date();
    const startDate = new Date(now);
    
    if (period === "yearly") {
      startDate.setFullYear(now.getFullYear() - 1);
    } else {
      startDate.setMonth(now.getMonth() - 1);
    }

    const startTimestamp = Math.floor(startDate.getTime() / 1000);
    const endTimestamp = Math.floor(now.getTime() / 1000);

    console.log("Fetching analytics for period:", period, "from", startDate, "to", now);

    // Fetch charges directly - this gives us the actual money collected minus refunds
    const charges = await stripe.charges.list({
      created: {
        gte: startTimestamp,
        lte: endTimestamp,
      },
      limit: 100,
      // Expand invoice + payment intent so plan/tax detection needs no per-charge
      // Stripe retrieves (that serial N+1 was a main cause of the hang).
      expand: ["data.invoice", "data.payment_intent"],
    });

    console.log("Charges fetched:", charges.data.length);

    // Fetch subscriptions
    const subscriptions = await stripe.subscriptions.list({
      created: {
        gte: startTimestamp,
        lte: endTimestamp,
      },
      limit: 100,
    });

    // Get all subscriptions to check cancellations in the period
    const allSubscriptions = await stripe.subscriptions.list({
      limit: 100,
      status: "all",
    });

    // Map price IDs to plan types
    const priceIdToPlan: Record<string, string> = {
      // Monthly subscriptions
      "price_1SXv5wKbAjgJzP4OZ4ItVTI6": "starter",       // €49
      "price_1SXv5zKbAjgJzP4OvMuBKt2O": "professional",  // €119
      "price_1ShA0EKbAjgJzP4OS9TVcaIP": "enterprise",    // €229 (current)
      "price_1Sfu1CKbAjgJzP4OPamel5WB": "enterprise",    // €239 (old)
      "price_1SXv61KbAjgJzP4O6Lk56HVx": "enterprise",    // legacy
      // Yearly subscriptions
      "price_1SXv5yKbAjgJzP4OvGPL0OSw": "starter",       // €470
      "price_1SXv60KbAjgJzP4OvawG7K1A": "professional",  // €1099
      "price_1Sfu1DKbAjgJzP4O68Keb4AQ": "enterprise",    // €2194 (current)
      "price_1SXv62KbAjgJzP4OCvLBVd7K": "enterprise",    // legacy
      // Credit packs
      "price_1SXv5uKbAjgJzP4OZfdyN4I0": "credits",       // €45
      "price_1SXv5uKbAjgJzP4OkIs9TQU5": "credits",       // €95
      "price_1SXv5vKbAjgJzP4OrkY4KQ4S": "credits",       // €175
    };

    // Net amount excluding tax and refunds. Reads the invoice already expanded on
    // the charge (see charges.list `expand`) — no per-charge Stripe retrieve.
    const getNetAmountExcludingTax = (charge: Stripe.Charge): number => {
      const grossAmount = (charge.amount_captured || charge.amount) - (charge.amount_refunded || 0);
      const invoice = charge.invoice && typeof charge.invoice === "object" ? (charge.invoice as Stripe.Invoice) : null;
      const taxAmount = invoice?.tax || 0;
      return (grossAmount - taxAmount) / 100;
    };

    // Determine plan from the invoice / payment intent already expanded on the
    // charge — no per-charge Stripe retrieves.
    const getPlanFromCharge = (charge: Stripe.Charge): string | null => {
      const invoice = charge.invoice && typeof charge.invoice === "object" ? (charge.invoice as Stripe.Invoice) : null;
      if (invoice) {
        const priceId = invoice.lines?.data?.[0]?.price?.id;
        if (priceId && priceIdToPlan[priceId]) return priceIdToPlan[priceId];
      }
      const pi = charge.payment_intent && typeof charge.payment_intent === "object" ? (charge.payment_intent as Stripe.PaymentIntent) : null;
      if (pi) {
        const priceId = pi.metadata?.priceId || pi.metadata?.price_id;
        if (priceId && priceIdToPlan[priceId]) return priceIdToPlan[priceId];
        if (pi.metadata?.credits || pi.metadata?.type === "credits") return "credits";
      }
      return null;
    };

    // Helper function to infer plan from amount
    // Note: amounts may include VAT (21%) or be net, so we need careful ranges
    // Order matters - check most specific amounts first to avoid overlaps
    const inferPlanFromAmount = (netAmount: number): string | null => {
      // Credit packs first (to avoid overlap with subscription plans)
      // 50 credits: €45 net, €54.45 with VAT
      if (netAmount >= 42 && netAmount <= 58) return "credits";
      // 150 credits: €95 net, €114.95 with VAT  
      if (netAmount >= 90 && netAmount <= 120) return "credits";
      // 300 credits: €175 net, €211.75 with VAT
      if (netAmount >= 170 && netAmount <= 220) return "credits";
      
      // Monthly subscription plans
      // Starter: €49 net, €59.29 with VAT
      if (netAmount >= 46 && netAmount <= 65) return "starter";
      // Professional: €119 net, €143.99 with VAT
      if (netAmount >= 115 && netAmount <= 150) return "professional";
      // Enterprise: €229 net, €277.09 with VAT
      if (netAmount >= 225 && netAmount <= 285) return "enterprise";
      
      // Yearly subscription plans
      // Starter: €470 net, €568.70 with VAT
      if (netAmount >= 450 && netAmount <= 580) return "starter";
      // Professional: €1099 net, €1329.79 with VAT
      if (netAmount >= 1050 && netAmount <= 1350) return "professional";
      // Enterprise: €2194 net, €2654.74 with VAT
      if (netAmount >= 2100 && netAmount <= 2700) return "enterprise";
      
      return null;
    };

    // Calculate total sales and process charges
    let totalSales = 0;
    const chargeData: Map<string, { netAmount: number; plan: string | null; created: number }> = new Map();
    
    for (const charge of charges.data) {
      if (!charge.paid || charge.refunded) continue;
      const netAmount = getNetAmountExcludingTax(charge);
      const plan = getPlanFromCharge(charge) ?? inferPlanFromAmount(netAmount);
      chargeData.set(charge.id, { netAmount, plan, created: charge.created });
      totalSales += netAmount;
    }

    const newSubscriptions = subscriptions.data.length;
    
    const cancelledSubscriptions = allSubscriptions.data.filter((sub: Stripe.Subscription) => {
      if (!sub.canceled_at) return false;
      const cancelDate = new Date(sub.canceled_at * 1000);
      return cancelDate >= startDate && cancelDate <= now;
    }).length;

    const activeSubscriptions = allSubscriptions.data.filter(
      (sub: Stripe.Subscription) => sub.status === "active"
    ).length;

    // Group sales by period and plan for trend charts
    const salesByPeriodAndPlan: Record<string, { starter: number; professional: number; enterprise: number; credits: number; total: number }> = {};
    
    for (const [chargeId, data] of chargeData) {
      const date = new Date(data.created * 1000);
      const key = period === "yearly" 
        ? date.getFullYear().toString()
        : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!salesByPeriodAndPlan[key]) {
        salesByPeriodAndPlan[key] = { starter: 0, professional: 0, enterprise: 0, credits: 0, total: 0 };
      }
      
      salesByPeriodAndPlan[key].total += data.netAmount;
      
      if (data.plan && salesByPeriodAndPlan[key][data.plan as keyof typeof salesByPeriodAndPlan[string]] !== undefined) {
        (salesByPeriodAndPlan[key] as any)[data.plan] += data.netAmount;
      }
    }

    // Convert to array for chart with separate plan data
    const salesData = Object.entries(salesByPeriodAndPlan)
      .map(([periodKey, amounts]) => ({
        period: periodKey,
        amount: Math.round(amounts.total * 100) / 100,
        starter: Math.round(amounts.starter * 100) / 100,
        professional: Math.round(amounts.professional * 100) / 100,
        enterprise: Math.round(amounts.enterprise * 100) / 100,
        credits: Math.round(amounts.credits * 100) / 100,
      }))
      .sort((a, b) => a.period.localeCompare(b.period));

    // Calculate revenue by plan type
    const revenueByPlan: Record<string, number> = {
      starter: 0,
      professional: 0,
      enterprise: 0,
      credits: 0,
    };

    for (const [chargeId, data] of chargeData) {
      if (data.plan && revenueByPlan[data.plan] !== undefined) {
        revenueByPlan[data.plan] += data.netAmount;
      }
    }

    // Top customers (by ALL-TIME total spent). We expand the customer on each
    // charge so the email comes back inline — no per-customer Stripe retrieve
    // (that serial N+1 in an unbounded loop was the main cause of the hang). The
    // page scan is also bounded so runtime stays predictable as the account grows.
    const customerSpending: Record<string, { email: string; total: number }> = {};

    let hasMore = true;
    let startingAfter: string | undefined = undefined;
    let pagesScanned = 0;
    const MAX_PAGES = 50; // up to 5,000 charges

    while (hasMore && pagesScanned < MAX_PAGES) {
      const params: any = { limit: 100, expand: ["data.customer"] };
      if (startingAfter) params.starting_after = startingAfter;

      const allCharges = await stripe.charges.list(params);
      pagesScanned++;

      for (const charge of allCharges.data) {
        if (!charge.paid || charge.refunded || !charge.customer) continue;

        const customerObj = typeof charge.customer === "object" ? charge.customer : null;
        const customerId = customerObj ? customerObj.id : (charge.customer as string);
        const email =
          (customerObj && !customerObj.deleted ? customerObj.email : null) ||
          charge.billing_details?.email ||
          charge.receipt_email;
        if (!email) continue;

        const grossAmount = ((charge.amount_captured || charge.amount) - (charge.amount_refunded || 0)) / 100;

        if (!customerSpending[customerId]) {
          customerSpending[customerId] = { email, total: 0 };
        }
        customerSpending[customerId].total += grossAmount;
      }

      hasMore = allCharges.has_more;
      startingAfter = allCharges.data.length > 0 ? allCharges.data[allCharges.data.length - 1].id : undefined;
      if (!startingAfter) hasMore = false;
    }

    if (hasMore) {
      console.log(`admin-get-analytics: top-customer scan capped at ${MAX_PAGES} pages`);
    }

    const topCustomers = Object.values(customerSpending)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
      .map(c => ({
        email: c.email,
        totalSpent: Math.round(c.total * 100) / 100,
      }));

    return new Response(
      JSON.stringify({
        success: true,
        analytics: {
          totalSales: Math.round(totalSales * 100) / 100,
          newSubscriptions,
          cancelledSubscriptions,
          activeSubscriptions,
          salesData,
          revenueByPlan: Object.entries(revenueByPlan).map(([plan, revenue]) => ({
            plan,
            revenue: Math.round(revenue * 100) / 100,
          })),
          topCustomers,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Error in admin-get-analytics:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
