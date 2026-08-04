import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

    const { priceId, couponId, offerType, gaClientId, gclid } = await req.json();
    if (!priceId) throw new Error("Price ID is required");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { 
      apiVersion: "2025-08-27.basil" 
    });
    
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const sessionParams: any = {
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/payment?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/payment?canceled=true`,
      billing_address_collection: "required",
      customer_update: {
        address: "auto",
      },
      automatic_tax: {
        enabled: true,
      },
      metadata: {
        userId: user.id,
        ...(offerType ? { offerType } : {}),
        ...(gaClientId ? { ga_client_id: String(gaClientId) } : {}),
        ...(gclid ? { gclid: String(gclid) } : {}),
      },
      // Also on the SUBSCRIPTION, not just the session: renewals have no
      // session, so this is the only place a later invoice can recover the
      // client id and stay attributed to the visit that converted.
      subscription_data: {
        metadata: {
          userId: user.id,
          ...(offerType ? { offerType } : {}),
          ...(gaClientId ? { ga_client_id: String(gaClientId) } : {}),
          ...(gclid ? { gclid: String(gclid) } : {}),
        },
      },
      custom_text: {
        submit: {
          message: "Unlock your creative workflow with professional AI tools",
        },
        terms_of_service_acceptance: {
          message: "By subscribing, you agree to our terms and conditions",
        },
      },
      consent_collection: {
        terms_of_service: "required",
      },
    };

    if (couponId) {
      sessionParams.discounts = [{ coupon: couponId }];
    } else {
      sessionParams.allow_promotion_codes = true;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});