import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PurchaseConfirmationRequest {
  email: string;
  firstName: string;
  credits: number;
  amount: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const { email, firstName, credits, amount }: PurchaseConfirmationRequest = await req.json();

    console.log("Sending purchase confirmation email to:", email);

    if (!email || !credits || !amount) {
      throw new Error("Email, credits, and amount are required");
    }

    const displayName = firstName || "there";

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Floowy.ai <hello@floowy.ai>",
        to: [email],
        subject: "Purchase Confirmed! Your credits are ready 🎉",
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Purchase Confirmation - Floowy.ai</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; background-color: #ffffff;">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                <tr>
                  <td align="center" style="padding-bottom: 0;">
                    <img src="https://fjzifykgvdsownlscgct.supabase.co/storage/v1/object/public/products/email-header.png" alt="Floowy.ai - High Quality Marketing Content With AI Power" width="600" style="display: block; width: 100%; max-width: 600px; height: auto;">
                  </td>
                </tr>
                <tr>
                  <td>
                    <h1 style="color: #000000; font-size: 28px; font-weight: 700; line-height: 1.3; margin: 0 0 24px; text-align: center;">
                      Purchase Confirmed! 🎉
                    </h1>
                    
                    <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
                      Hi ${displayName},
                    </p>
                    
                    <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
                      Thank you for your purchase! Your payment has been successfully processed and your credits are now available in your account.
                    </p>
                    
                    <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); border-radius: 12px; padding: 24px; margin: 32px 0; text-align: center;">
                      <p style="color: #ffffff; font-size: 18px; font-weight: 600; margin: 0 0 8px;">
                        Credits Added
                      </p>
                      <p style="color: #ffffff; font-size: 48px; font-weight: 700; margin: 0 0 8px;">
                        ${credits}
                      </p>
                      <p style="color: #ffffff; font-size: 16px; margin: 0;">
                        Amount Paid: €${amount.toFixed(2)}
                      </p>
                    </div>
                    
                    <h2 style="color: #000000; font-size: 22px; font-weight: 700; margin: 32px 0 20px;">
                      What's next?
                    </h2>
                    
                    <div style="margin-bottom: 24px;">
                      <p style="color: #22c55e; font-size: 18px; font-weight: 700; margin: 0 0 8px;">
                        1. Start creating
                      </p>
                      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0;">
                        Jump right in and use your credits to generate stunning visuals and videos. Your new balance is ready to go!
                      </p>
                    </div>
                    
                    <div style="margin-bottom: 24px;">
                      <p style="color: #22c55e; font-size: 18px; font-weight: 700; margin: 0 0 8px;">
                        2. Explore all tools
                      </p>
                      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0;">
                        Try Fashion Studio, Atmosphere Generator, Product Photos, and Creator Studio to maximize your creative output.
                      </p>
                    </div>
                    
                    <div style="margin-bottom: 24px;">
                      <p style="color: #22c55e; font-size: 18px; font-weight: 700; margin: 0 0 8px;">
                        3. Need more?
                      </p>
                      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0;">
                        When you're ready for more, you can easily purchase additional credits or upgrade to a subscription plan for even better value.
                      </p>
                    </div>
                    
                    <div style="text-align: center; margin: 32px 0;">
                      <a href="https://floowy.ai" style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                        Start Creating Now
                      </a>
                    </div>
                    
                    <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 32px 0 16px;">
                      If you have any questions or need assistance, don't hesitate to reach out to us at <a href="mailto:hello@floowy.ai" style="color: #22c55e; text-decoration: underline; font-weight: 600;">hello@floowy.ai</a>.
                    </p>
                    
                    <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 32px 0 24px;">
                      Thank you for choosing Floowy.ai!<br>
                      <br>
                      Best regards,<br>
                      The Floowy.ai Team<br>
                      <a href="mailto:hello@floowy.ai" style="color: #22c55e; text-decoration: underline; font-weight: 600;">hello@floowy.ai</a>
                    </p>
                    
                    <div style="border-top: 1px solid #e5e5e5; padding-top: 24px; margin-top: 40px;">
                      <p style="color: #666666; font-size: 14px; text-align: center; margin: 0;">
                        <a href="https://floowy.ai" style="color: #666666; text-decoration: underline;">Visit our website</a>
                        •
                        <a href="https://floowy.ai/pricing" style="color: #666666; text-decoration: underline;">View plans</a>
                        •
                        <a href="https://floowy.ai/contact" style="color: #666666; text-decoration: underline;">Contact us</a>
                      </p>
                    </div>
                  </td>
                </tr>
              </table>
            </body>
          </html>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      console.error("Resend API error:", errorData);
      throw new Error("Failed to send purchase confirmation email");
    }

    const data = await emailResponse.json();
    console.log("Purchase confirmation email sent successfully:", data);

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-purchase-confirmation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
