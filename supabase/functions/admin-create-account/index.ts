import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import bcrypt from "https://esm.sh/bcryptjs@2.4.3";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, admin-token, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Input validation schema
const createAccountSchema = z.object({
  email: z.string().email({ message: 'Invalid email format' }).max(255).transform(val => val.trim().toLowerCase()),
  fullName: z.string().max(100).trim().optional(),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const adminToken = req.headers.get('admin-token');
    
    if (!adminToken) {
      return new Response(
        JSON.stringify({ error: 'Admin token required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate admin token format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(adminToken)) {
      return new Response(
        JSON.stringify({ error: 'Invalid admin token format' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify admin token
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('admin_sessions')
      .select('admin_id')
      .eq('token', adminToken)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired admin token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate input
    const body = await req.json();
    const parseResult = createAccountSchema.safeParse(body);
    
    if (!parseResult.success) {
      console.error('Validation failed:', parseResult.error.errors);
      return new Response(
        JSON.stringify({ error: parseResult.error.errors[0]?.message || 'Invalid input' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { email, fullName } = parseResult.data;

    // Check if admin already exists
    const { data: existingAdmin } = await supabaseAdmin
      .from('admin_accounts')
      .select('id')
      .eq('email', email)
      .single();

    if (existingAdmin) {
      return new Response(
        JSON.stringify({ error: 'Admin account with this email already exists' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate temporary password (12 characters, alphanumeric)
    const tempPassword = Array.from({ length: 12 }, () => 
      'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'[Math.floor(Math.random() * 57)]
    ).join('');

    console.log('Generated temporary password for', email);

    // Hash password with bcryptjs (same as admin-auth)
    const passwordHashBcrypt = bcrypt.hashSync(tempPassword, 10);

    // Create admin account
    const { data: newAdmin, error: createError } = await supabaseAdmin
      .from('admin_accounts')
      .insert({
        email: email,
        full_name: fullName || null,
        password_hash: '', // Legacy field, keep empty
        password_hash_bcrypt: passwordHashBcrypt,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating admin account:', createError);
      throw createError;
    }

    console.log('Admin account created:', newAdmin.id);

    // Send email with temporary password using Resend REST API
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured');
      // Don't fail the whole request if email fails
    } else {
      const displayName = fullName || 'Admin';
      const emailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Your Admin Account Has Been Created</title>
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
                  <h1 style="color: #000000; font-size: 28px; font-weight: 700; line-height: 1.3; margin: 24px 0; text-align: center;">
                    🔐 Your Admin Account Has Been Created
                  </h1>
                  
                  <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
                    Hi ${displayName},
                  </p>
                  
                  <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
                    An administrator account has been created for you on Floowy.ai. Below are your login credentials to access the admin panel:
                  </p>
                  
                  <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 20px; margin: 24px 0; border-radius: 4px;">
                    <p style="color: #333333; font-size: 16px; margin: 0 0 12px;">
                      <strong style="color: #000000;">Email:</strong><br>
                      <span style="color: #22c55e; font-weight: 600;">${email}</span>
                    </p>
                    <p style="color: #333333; font-size: 16px; margin: 0 0 8px;">
                      <strong style="color: #000000;">Temporary Password:</strong>
                    </p>
                    <div style="background-color: #ffffff; border: 2px solid #22c55e; padding: 15px; border-radius: 8px; font-family: 'Courier New', monospace; font-size: 20px; letter-spacing: 2px; text-align: center; color: #000000; font-weight: 700; margin-top: 8px;">
                      ${tempPassword}
                    </div>
                  </div>

                  <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 24px 0; border-radius: 4px;">
                    <p style="color: #92400e; font-size: 16px; margin: 0 0 8px; font-weight: 700;">
                      ⚠️ Important Security Notice
                    </p>
                    <p style="color: #92400e; font-size: 14px; margin: 0; line-height: 1.6;">
                      Please change your password immediately after logging in. This temporary password should only be used for your first login.
                    </p>
                  </div>

                  <div style="text-align: center; margin: 32px 0;">
                    <a href="https://floowy.ai/admin/login" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px;">
                      Login to Admin Panel
                    </a>
                  </div>
                  
                  <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 32px 0 16px;">
                    If you did not expect to receive this email or have any questions, please contact the system administrator immediately at <a href="mailto:hello@floowy.ai" style="color: #22c55e; text-decoration: underline; font-weight: 600;">hello@floowy.ai</a>.
                  </p>
                  
                  <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 32px 0 24px;">
                    Best regards,<br>
                    The Floowy.ai Team<br>
                    <a href="mailto:hello@floowy.ai" style="color: #22c55e; text-decoration: underline; font-weight: 600;">hello@floowy.ai</a>
                  </p>
                  
                  <div style="border-top: 1px solid #e5e5e5; padding-top: 24px; margin-top: 40px;">
                    <p style="color: #666666; font-size: 14px; text-align: center; margin: 0;">
                      This is an automated message from the Floowy.ai Admin System
                    </p>
                  </div>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `;

      try {
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
        from: 'Floowy.ai <hello@floowy.ai>',
        to: [email],
        subject: 'Your Admin Account Has Been Created 🔐',
            html: emailHtml,
          }),
        });

        if (!emailResponse.ok) {
          const errorData = await emailResponse.json();
          console.error('Resend API error:', errorData);
        } else {
          const emailData = await emailResponse.json();
          console.log('Email sent successfully:', emailData);
        }
      } catch (emailError) {
        console.error('Error sending email:', emailError);
        // Don't fail the whole request if email fails
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        admin: {
          id: newAdmin.id,
          email: newAdmin.email,
          full_name: newAdmin.full_name,
          created_at: newAdmin.created_at,
        }
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in admin-create-account:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
