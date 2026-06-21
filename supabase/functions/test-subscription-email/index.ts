import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { plan = "professional", email = "jefcgealon@gmail.com", firstName = "Jef" } = await req.json();

    console.log(`Sending test ${plan} subscription email to ${email}`);

    // Call the send-upgrade-email function
    const emailResponse = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-upgrade-email`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
        },
        body: JSON.stringify({
          email,
          firstName,
          plan,
        }),
      }
    );

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text();
      console.error("Failed to send test email:", errorData);
      throw new Error(`Failed to send test email: ${errorData}`);
    }

    const data = await emailResponse.json();
    console.log("Test email sent successfully:", data);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Test ${plan} subscription email sent to ${email}`,
        data 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in test-subscription-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
