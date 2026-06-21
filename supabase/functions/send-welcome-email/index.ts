import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  firstName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const { email, firstName }: WelcomeEmailRequest = await req.json();

    console.log("Sending welcome email to:", email);

    if (!email) {
      throw new Error("Email is required");
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
        subject: "Welcome to Floowy.ai! Your journey to smarter content creation starts now 🚀",
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Welcome to Floowy.ai</title>
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
                      Welcome to Floowy.ai! Your journey to smarter content creation starts now 🚀
                    </h1>
                    
                    <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
                      Hi ${displayName},
                    </p>
                    
                    <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
                      Welcome to Floowy.ai! We're really happy to have you on board.
                    </p>
                    
                    <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
                      Your free account is now active, and you've received <strong style="color: #22c55e; font-weight: 700;">3 complimentary credits</strong> to start creating amazing visuals and videos. No subscription needed. You can jump right in and experience how Floowy.ai helps you save time and money while producing high-quality content.
                    </p>
                    
                    <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 24px 0 12px;">
                      🎬 <strong>Watch this quick intro</strong> to see Floowy.ai in action:
                    </p>

                    <div style="text-align: center; margin: 0 0 32px;">
                      <a href="https://youtu.be/iJB6Oqn-nUE" target="_blank" style="display: inline-block; position: relative; text-decoration: none;">
                        <img src="https://img.youtube.com/vi/iJB6Oqn-nUE/maxresdefault.jpg" alt="Watch the Floowy.ai intro video" width="560" style="display: block; width: 100%; max-width: 560px; height: auto; border-radius: 12px; border: 1px solid #e5e5e5;" />
                        <div style="margin-top: 12px;">
                          <span style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: #ffffff; padding: 10px 24px; border-radius: 8px; font-weight: 700; font-size: 15px;">Watch on YouTube</span>
                        </div>
                      </a>
                    </div>

                    <h2 style="color: #000000; font-size: 22px; font-weight: 700; margin: 32px 0 20px;">
                      Here's how to get the most out of your account:
                    </h2>
                    
                    <div style="margin-bottom: 24px;">
                      <p style="color: #22c55e; font-size: 18px; font-weight: 700; margin: 0 0 8px;">
                        1. Start creating
                      </p>
                      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0;">
                        Use your free credits to test all core features. Generate creatives, create videos, and explore how much faster your workflow can be.
                      </p>
                    </div>
                    
                    <div style="margin-bottom: 24px;">
                      <p style="color: #22c55e; font-size: 18px; font-weight: 700; margin: 0 0 8px;">
                        2. Check your impact
                      </p>
                      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0;">
                        Try our <a href="https://floowy.ai/#roi-calculator" style="color: #22c55e; text-decoration: underline; font-weight: 600;">ROI Calculator</a> on our website to see exactly how much time and money you can save using Floowy.ai compared to traditional production methods.
                      </p>
                    </div>
                    
                    <div style="margin-bottom: 24px;">
                      <p style="color: #22c55e; font-size: 18px; font-weight: 700; margin: 0 0 8px;">
                        3. Keep the flow going
                      </p>
                      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0;">
                        When your free credits are used up, you can easily buy more or upgrade to a subscription for unlimited creative freedom.
                      </p>
                    </div>
                    
                    <div style="margin-bottom: 24px;">
                      <p style="color: #22c55e; font-size: 18px; font-weight: 700; margin: 0 0 8px;">
                        4. We're here for you
                      </p>
                      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0;">
                        If you have questions or need a hand getting started, just send us a message at <a href="mailto:hello@floowy.ai" style="color: #22c55e; text-decoration: underline; font-weight: 600;">hello@floowy.ai</a>. Our team is always happy to help.
                      </p>
                    </div>
                    
                    <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 32px 0 16px;">
                      You're all set to create value, save time, and make your ideas flow. Let's get started!
                    </p>
                    
                    <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 32px 0 24px;">
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
      throw new Error("Failed to send welcome email");
    }

    const data = await emailResponse.json();
    console.log("Welcome email sent successfully:", data);

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);
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
