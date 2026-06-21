import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.78.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestPasswordResetRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: RequestPasswordResetRequest = await req.json();

    if (!email || !email.includes("@")) {
      return new Response(
        JSON.stringify({ error: "Valid email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check if user exists
    const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (userError) {
      console.error("Error fetching users:", userError);
      // Don't reveal if user exists or not for security
      return new Response(
        JSON.stringify({ message: "If an account exists with this email, a reset link has been sent." }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const user = users.users.find((u) => u.email === email);

    if (!user) {
      // Don't reveal if user exists or not for security
      return new Response(
        JSON.stringify({ message: "If an account exists with this email, a reset link has been sent." }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate secure token
    const token = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, "");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Store token in database
    const { error: tokenError } = await supabaseAdmin
      .from("password_reset_tokens")
      .insert({
        user_id: user.id,
        token,
        expires_at: expiresAt.toISOString(),
      });

    if (tokenError) {
      console.error("Error storing reset token:", tokenError);
      throw new Error("Failed to generate reset token");
    }

    // Get user's first name
    const firstName = user.user_metadata?.full_name?.split(" ")[0] || "there";
    
    // Construct reset link
    const resetLink = `${req.headers.get("origin") || "https://floowy.ai"}/reset-password?token=${token}`;

    // Send email via Resend
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
              padding: 12px 30px;
              margin: 20px 0;
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: #ffffff !important;
              text-decoration: none;
              border-radius: 8px;
              font-weight: bold;
            }
            .warning-box {
              background-color: #fef3c7;
              padding: 15px;
              margin: 20px 0;
              border-radius: 8px;
              border-left: 4px solid #f59e0b;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <img src="https://fjzifykgvdsownlscgct.supabase.co/storage/v1/object/public/products/email-header.png" alt="Floowy Header" style="width: 100%; display: block;" />
            <div class="content">
              <h1>Reset your Floowy.ai password 🔒</h1>
              <p>Hi ${firstName},</p>
              <p>No worries. It happens to the best of us!</p>
              <p>You recently requested to reset your password for your Floowy.ai account.</p>
              <p>Click the button below to set a new password:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" class="cta-button" style="color: #ffffff !important;">Reset My Password</a>
              </div>
              
              <p>If you didn't request this change, you can safely ignore this email. Your current password will remain the same.</p>
              
              <div class="warning-box">
                <p style="margin: 0; font-weight: bold; color: #92400e;">⏰ For security reasons, this link will expire in 60 minutes.</p>
              </div>
              
              <p>If you need any help, our team is always here at hello@floowy.ai.</p>
              
              <p style="margin-top: 30px;">Stay creative,<br>The Floowy.ai Team</p>
              
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
        subject: "Reset your Floowy.ai password 🔒",
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      console.error("Resend API error:", errorData);
      throw new Error("Failed to send password reset email");
    }

    console.log("Password reset email sent successfully to:", email);

    return new Response(
      JSON.stringify({ message: "If an account exists with this email, a reset link has been sent." }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in request-password-reset:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
