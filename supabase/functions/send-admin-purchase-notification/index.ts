import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const ADMIN_EMAIL = "hello@floowy.ai";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userEmail, userName, type, plan, credits, amount } = await req.json();

    if (!userEmail || !type) {
      throw new Error("Missing required fields: userEmail, type");
    }

    console.log(`Sending admin purchase notification: ${type} by ${userEmail}`);

    let subject = "";
    let htmlContent = "";
    const date = new Date().toLocaleString("en-US", { timeZone: "Europe/Amsterdam" });

    if (type === "subscription") {
      subject = `💰 New Subscription: ${userName || userEmail} → ${(plan || "").charAt(0).toUpperCase() + (plan || "").slice(1)}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #22c55e;">🎉 New Subscription Purchase</h2>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">User</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${userName || "N/A"}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Email</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${userEmail}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Plan</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${(plan || "").charAt(0).toUpperCase() + (plan || "").slice(1)}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Credits</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${credits || "N/A"}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Date</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${date}</td></tr>
          </table>
        </div>
      `;
    } else if (type === "credits") {
      subject = `💳 Credit Pack Purchase: ${userName || userEmail} bought ${credits} credits`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #3b82f6;">💳 New Credit Pack Purchase</h2>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">User</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${userName || "N/A"}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Email</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${userEmail}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Credits</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${credits || "N/A"}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Amount</td><td style="padding: 8px; border-bottom: 1px solid #eee;">€${amount || "N/A"}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Date</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${date}</td></tr>
          </table>
        </div>
      `;
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Floowy.ai <hello@floowy.ai>",
        to: [ADMIN_EMAIL],
        subject,
        html: htmlContent,
      }),
    });

    const data = await res.json();
    console.log("Admin notification email sent:", data);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Error sending admin purchase notification:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
