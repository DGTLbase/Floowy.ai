import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SignupReminderEmailRequest {
  email: string;
  firstName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, firstName }: SignupReminderEmailRequest = await req.json();
    console.log("Sending signup reminder email to:", email);

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; }
            .content { padding: 40px 30px; background-color: #ffffff; }
            h1 { color: #000000; font-size: 28px; margin-bottom: 20px; }
            p { color: #333333; font-size: 16px; line-height: 1.6; margin-bottom: 15px; }
            .cta-button {
              display: inline-block;
              padding: 14px 35px;
              margin: 15px 0;
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: #ffffff !important;
              text-decoration: none;
              border-radius: 8px;
              font-weight: bold;
              font-size: 16px;
            }
            .benefit-list {
              background-color: #f0fdf4;
              padding: 24px 28px;
              margin: 25px 0;
              border-radius: 8px;
              border-left: 4px solid #10b981;
              font-size: 17px;
              line-height: 1.6;
            }
            .benefit-item {
              display: flex;
              align-items: flex-start;
              margin-bottom: 16px;
              font-size: 17px;
            }
            .benefit-item:last-child {
              margin-bottom: 0;
            }
            .check-icon {
              color: #10b981;
              font-weight: bold;
              margin-right: 12px;
              font-size: 18px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <img src="https://fjzifykgvdsownlscgct.supabase.co/storage/v1/object/public/products/email-header.png" alt="Floowy Header" style="width: 100%; display: block;" />
            <div class="content">
              <h1>Don't miss out on your creative potential! 🚀</h1>
              <p>Hi ${firstName},</p>
              <p>It's been a few days since you joined Floowy.ai, and we hope you've had a chance to explore what our AI-powered creative tools can do!</p>
              <p>If you've enjoyed creating with your free credits, imagine what you could achieve with a full subscription:</p>
              
              <div class="benefit-list">
                <div class="benefit-item">
                  <span class="check-icon">✓</span>
                  <span><strong>Unlimited creativity</strong> – Generate professional visuals and videos without limits</span>
                </div>
                <div class="benefit-item">
                  <span class="check-icon">✓</span>
                  <span><strong>Save time & money</strong> – No more expensive photoshoots or designers</span>
                </div>
                <div class="benefit-item">
                  <span class="check-icon">✓</span>
                  <span><strong>Scale your content</strong> – Create for all platforms in seconds</span>
                </div>
                <div class="benefit-item">
                  <span class="check-icon">✓</span>
                  <span><strong>Priority support</strong> – Get help whenever you need it</span>
                </div>
              </div>
              
              <p>Our subscription plans start at just <strong>19 EUR/month</strong> with our Lite plan – a fraction of what traditional content creation costs.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://floowy.ai/pricing" class="cta-button" style="color: #ffffff !important;">View Plans & Start Creating</a>
              </div>
              
              <p>Have questions about which plan is right for you? Reply to this email or reach out to us at hello@floowy.ai – we're happy to help!</p>
              
              <p style="margin-top: 30px;">Keep creating,<br>The Floowy.ai Team</p>
              
              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                Questions? Reach out to us at hello@floowy.ai
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Floowy.ai <hello@floowy.ai>",
        to: [email],
        subject: "Don't miss out on your creative potential! 🚀",
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      console.error("Resend API error:", errorData);
      throw new Error("Failed to send signup reminder email");
    }

    const data = await emailResponse.json();
    console.log("Signup reminder email sent successfully:", data);

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending signup reminder email:", error);
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
