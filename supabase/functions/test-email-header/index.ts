import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TestEmailRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: TestEmailRequest = await req.json();
    console.log("Sending test email to:", email);

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
          </style>
        </head>
        <body>
          <div class="container">
            <img src="https://fjzifykgvdsownlscgct.supabase.co/storage/v1/object/public/products/email-header.png" alt="Floowy Header" style="width: 100%; display: block;" />
            <div class="content">
              <h1>Test Email - Header Verification ✅</h1>
              <p>Hello,</p>
              <p>This is a test email to verify that the email header image is displaying correctly.</p>
              <p>If you can see the Floowy header image at the top of this email, the upload was successful!</p>
              <p>Best regards,<br>The Floowy Team</p>
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
        subject: "Test Email - Header Verification",
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      console.error("Resend API error:", errorData);
      throw new Error("Failed to send test email");
    }

    const data = await emailResponse.json();

    console.log("Test email sent successfully:", data);

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending test email:", error);
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
