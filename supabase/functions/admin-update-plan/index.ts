import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, admin-token, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  console.log('admin-update-plan called, method:', req.method);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const adminToken = req.headers.get('admin-token');
    console.log('Admin token present:', !!adminToken);
    
    if (!adminToken) {
      console.error('Missing admin token');
      return new Response(
        JSON.stringify({ error: 'Missing admin token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    console.log('Supabase URL present:', !!supabaseUrl);
    console.log('Service role key present:', !!supabaseServiceKey);
    
    const supabaseAdmin = createClient(
      supabaseUrl ?? '',
      supabaseServiceKey ?? ''
    );

    // Verify admin token
    console.log('Verifying admin session...');
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('admin_sessions')
      .select('admin_id, expires_at')
      .eq('token', adminToken)
      .maybeSingle();
    
    console.log('Session query result:', { session, sessionError });

    if (!session || new Date(session.expires_at) < new Date()) {
      console.error('Invalid or expired admin session');
      return new Response(
        JSON.stringify({ error: 'Invalid or expired admin token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Admin session verified');

    // Parse request body
    const { userId, plan } = await req.json();
    console.log('Request params:', { userId, plan });

    if (!userId || !plan) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate plan value
    const validPlans = ['free', 'lite', 'starter', 'professional', 'enterprise'];
    if (!validPlans.includes(plan.toLowerCase())) {
      return new Response(
        JSON.stringify({ error: 'Invalid plan value' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update user plan
    const { data: oldProfile } = await supabaseAdmin
      .from('profiles')
      .select('plan, email, full_name')
      .eq('id', userId)
      .single();

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ plan: plan.toLowerCase() })
      .eq('id', userId);

    if (updateError) {
      console.error('Update error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update user plan' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User plan updated successfully to:', plan);

    // Send plan change email if user data is available
    if (oldProfile?.email) {
      try {
        console.log('Sending plan change email...');
        const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-plan-change-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
          },
          body: JSON.stringify({
            email: oldProfile.email,
            firstName: oldProfile.full_name?.split(' ')[0] || '',
            oldPlan: oldProfile.plan,
            newPlan: plan.toLowerCase(),
          }),
        });

        if (emailResponse.ok) {
          console.log('Plan change email sent successfully');
        } else {
          console.error('Failed to send plan change email:', await emailResponse.text());
        }
      } catch (emailError) {
        console.error('Error sending plan change email:', emailError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, plan: plan.toLowerCase() }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in admin-update-plan:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
