import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, admin-token, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const adminToken = req.headers.get('admin-token');
    
    if (!adminToken) {
      console.error('No admin token provided');
      return new Response(
        JSON.stringify({ error: 'Admin authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify admin session
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('admin_sessions')
      .select('admin_id, expires_at')
      .eq('token', adminToken)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (sessionError || !session) {
      console.error('Invalid admin session:', sessionError);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired admin session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { email, password, fullName } = await req.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Creating user:', email);

    // Create user using admin API
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: fullName || '',
      },
    });

    if (createError) {
      console.error('Error creating user:', createError);
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User created successfully:', userData.user?.id);

    // Send welcome email
    try {
      const resendApiKey = Deno.env.get('RESEND_API_KEY');
      if (resendApiKey && userData.user) {
        const firstName = fullName?.split(' ')[0] || '';
        
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Floowy.ai <hello@floowy.ai>',
            to: [email],
            subject: 'Welcome to Floowy.ai! Your journey to smarter content creation starts now 🚀',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Welcome to Floowy.ai${firstName ? `, ${firstName}` : ''}!</h2>
                <p>Your account has been created successfully.</p>
                <p>You have received <strong>3 free credits</strong> to get started.</p>
                <p>Start creating amazing content today!</p>
                <p>Best regards,<br>The Floowy.ai Team</p>
              </div>
            `,
          }),
        });
        console.log('Welcome email sent');
      }
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail the request if email fails
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: {
          id: userData.user?.id,
          email: userData.user?.email,
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in admin-create-user:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
