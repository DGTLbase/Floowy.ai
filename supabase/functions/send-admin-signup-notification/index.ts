import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SignupNotificationRequest {
  userEmail: string;
  userName?: string;
  testRecipient?: string; // For testing - overrides the recipient
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userEmail, userName, testRecipient }: SignupNotificationRequest = await req.json();

    const recipient = testRecipient || "hello@floowy.ai";
    console.log("Sending admin notification for new signup:", userEmail, "to:", recipient);

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const currentDate = new Date().toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Floowy.ai <hello@floowy.ai>",
        to: [recipient],
        subject: `🎉 New User Signup: ${userEmail}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>New User Signup - Floowy.ai</title>
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
                      New User Signup! 🎉
                    </h1>
                    
                    <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
                      Hi Team,
                    </p>
                    
                    <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
                      A new user has just signed up for Floowy.ai! Here are the details:
                    </p>
                    
                    <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); border-radius: 12px; padding: 24px; margin: 32px 0;">
                      <p style="color: #ffffff; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 16px;">
                        User Details
                      </p>
                      <p style="color: #ffffff; font-size: 18px; margin: 0 0 8px;">
                        <strong>Email:</strong> ${userEmail}
                      </p>
                      ${userName ? `<p style="color: #ffffff; font-size: 18px; margin: 0 0 8px;"><strong>Name:</strong> ${userName}</p>` : ''}
                      <p style="color: #ffffff; font-size: 16px; margin: 0;">
                        <strong>Signup Time:</strong> ${currentDate}
                      </p>
                    </div>
                    
                    <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
                      The user has been granted <strong style="color: #22c55e; font-weight: 700;">3 complimentary credits</strong> and will be directed to complete onboarding.
                    </p>
                    
                    <div style="text-align: center; margin: 32px 0;">
                      <a href="https://floowy.ai/admin" style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                        View Admin Dashboard
                      </a>
                    </div>
                    
                    <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 32px 0 16px; text-align: center;">
                      This is an automated notification from Floowy.ai
                    </p>
                    
                    <div style="border-top: 1px solid #e5e5e5; padding-top: 24px; margin-top: 40px;">
                      <p style="color: #666666; font-size: 14px; text-align: center; margin: 0;">
                        <a href="https://floowy.ai" style="color: #666666; text-decoration: underline;">Visit our website</a>
                        •
                        <a href="https://floowy.ai/admin" style="color: #666666; text-decoration: underline;">Admin Dashboard</a>
                        •
                        <a href="https://floowy.ai/contact" style="color: #666666; text-decoration: underline;">Contact</a>
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
      const errorText = await emailResponse.text();
      console.error("Resend API error:", errorText);
      throw new Error(`Failed to send email: ${errorText}`);
    }

    const result = await emailResponse.json();
    console.log("Admin notification sent successfully:", result);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending admin signup notification:", error);
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
