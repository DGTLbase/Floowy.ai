import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { buildLifecycleEmail, sendEmail, type Flow } from "../_shared/email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Sends any €1 lifecycle email. Body: { flow: "A"|"B"|"C"|"D"|"E", email, firstName }
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { flow, email, firstName } = await req.json();
    if (!flow || !["A", "B", "C", "D", "E"].includes(flow)) throw new Error("Invalid flow");
    if (!email) throw new Error("email is required");

    const { subject, html } = buildLifecycleEmail(flow as Flow, firstName || "there");
    const data = await sendEmail(email, subject, html);

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
