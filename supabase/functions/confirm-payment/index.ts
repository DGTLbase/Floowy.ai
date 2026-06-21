import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseAdmin.auth.getUser(token);
    const user = data.user;
    if (!user) throw new Error("User not authenticated");

    const { credits } = await req.json();
    if (!credits) throw new Error("Credits amount is required");

    console.log(`Confirming payment for user ${user.id}, expected credits: ${credits}`);

    // Just fetch the current balance - credits are already added by webhook
    const { data: currentCredit } = await supabaseAdmin
      .from("credits")
      .select("balance")
      .eq("user_id", user.id)
      .maybeSingle();

    const newBalance = currentCredit?.balance || 0;

    console.log(`Current balance for user ${user.id}: ${newBalance}`);

    return new Response(JSON.stringify({ 
      success: true,
      newBalance,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error in confirm-payment:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
