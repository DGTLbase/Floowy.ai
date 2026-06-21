import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ContactEmailRequest {
  name: string;
  email: string;
  company: string;
  role?: string;
  message?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const { name, email, company, role, message }: ContactEmailRequest = await req.json();

    // Validate required fields
    if (!name || !email || !company) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Send email to Floowy team
    const teamEmailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Floowy.ai <hello@floowy.ai>",
        to: ["hello@floowy.ai"],
        subject: `New Contact Form Submission from ${name}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc;">
              <tr>
                <td align="center" style="padding: 40px 20px;">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                      <td style="padding: 0;">
                        <img src="https://fjzifykgvdsownlscgct.supabase.co/storage/v1/object/public/products/email-header.png" alt="Floowy" style="width: 100%; display: block;">
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px 40px 20px;">
                        <h2 style="margin: 0 0 24px; color: #1a1a1a; font-size: 24px; font-weight: 600;">New Contact Form Submission</h2>
                        
                        <div style="background-color: #f8fafc; border-radius: 6px; padding: 24px; margin-bottom: 24px;">
                          <p style="margin: 0 0 12px; color: #64748b; font-size: 14px; font-weight: 500;">CONTACT DETAILS</p>
                          <p style="margin: 0 0 8px; color: #1a1a1a; font-size: 16px;"><strong>Name:</strong> ${name}</p>
                          <p style="margin: 0 0 8px; color: #1a1a1a; font-size: 16px;"><strong>Email:</strong> ${email}</p>
                          <p style="margin: 0 0 8px; color: #1a1a1a; font-size: 16px;"><strong>Company:</strong> ${company}</p>
                          ${role ? `<p style="margin: 0; color: #1a1a1a; font-size: 16px;"><strong>Role:</strong> ${role}</p>` : ""}
                        </div>
                        
                        ${message ? `
                        <div style="margin-bottom: 24px;">
                          <p style="margin: 0 0 12px; color: #64748b; font-size: 14px; font-weight: 500;">MESSAGE</p>
                          <p style="margin: 0; color: #1a1a1a; font-size: 16px; line-height: 1.6;">${message}</p>
                        </div>
                        ` : ""}
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 20px 40px 40px; border-top: 1px solid #e2e8f0;">
                        <p style="margin: 0; color: #94a3b8; font-size: 14px; text-align: center;">This message was sent from the Floowy.ai contact form</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
      }),
    });

    if (!teamEmailResponse.ok) {
      const errorData = await teamEmailResponse.json();
      console.error("Resend API error:", errorData);
      throw new Error("Failed to send email to team");
    }

    // Send confirmation email to user
    const confirmationEmailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Floowy.ai <hello@floowy.ai>",
        to: [email],
        subject: "We received your message!",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc;">
              <tr>
                <td align="center" style="padding: 40px 20px;">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                      <td style="padding: 0;">
                        <img src="https://fjzifykgvdsownlscgct.supabase.co/storage/v1/object/public/products/email-header.png" alt="Floowy" style="width: 100%; display: block;">
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px;">
                        <h1 style="margin: 0 0 24px; color: #1a1a1a; font-size: 28px; font-weight: 600;">Thank You, ${name}!</h1>
                        
                        <p style="margin: 0 0 20px; color: #475569; font-size: 16px; line-height: 1.6;">We've received your message and our team will get back to you within 1-3 business days.</p>
                        
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; padding: 24px; margin: 32px 0;">
                          <p style="margin: 0 0 16px; color: #ffffff; font-size: 18px; font-weight: 600;">Explore Our AI-Powered Tools</p>
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="padding: 8px 0;">
                                <a href="https://floowy.ai/atmospheric" style="color: #ffffff; text-decoration: none; font-size: 15px;">✨ <strong>Ambience Studio</strong> - Stunning atmospheric product photos</a>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0;">
                                <a href="https://floowy.ai/fashion" style="color: #ffffff; text-decoration: none; font-size: 15px;">👗 <strong>Fashion Studio</strong> - Professional fashion photography</a>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0;">
                                <a href="https://floowy.ai/creator-studio" style="color: #ffffff; text-decoration: none; font-size: 15px;">🎥 <strong>Creator Studio</strong> - Authentic UGC videos</a>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0;">
                                <a href="https://floowy.ai/idea-studio" style="color: #ffffff; text-decoration: none; font-size: 15px;">💡 <strong>Idea Studio</strong> - Transform product ideas to reality</a>
                              </td>
                            </tr>
                          </table>
                        </div>
                        
                        <p style="margin: 32px 0 0; color: #475569; font-size: 16px; line-height: 1.6;">Best regards,<br><strong style="color: #1a1a1a;">The Floowy.ai Team</strong></p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 20px 40px; border-top: 1px solid #e2e8f0; text-align: center;">
                        <p style="margin: 0 0 8px; color: #94a3b8; font-size: 14px;">© 2024 Floowy.ai - AI-Powered Creative Tools</p>
                        <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                          <a href="https://floowy.ai" style="color: #667eea; text-decoration: none;">Visit Website</a> · 
                          <a href="https://floowy.ai/pricing" style="color: #667eea; text-decoration: none;">Pricing</a> · 
                          <a href="https://floowy.ai/our-story" style="color: #667eea; text-decoration: none;">About Us</a>
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
      }),
    });

    if (!confirmationEmailResponse.ok) {
      const errorData = await confirmationEmailResponse.json();
      console.error("Resend API error for confirmation:", errorData);
      // Don't throw here - the main email was sent successfully
    }

    return new Response(
      JSON.stringify({ success: true, message: "Email sent successfully" }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
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
