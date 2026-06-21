import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, admin-token, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  console.log('admin-update-tool-access called, method:', req.method);
  
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
    const { userId, toolName, hasAccess } = await req.json();
    console.log('Request params:', { userId, toolName, hasAccess });

    if (!userId || !toolName) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use UPSERT to handle both insert and update atomically
    const { error: upsertError } = await supabaseAdmin
      .from('user_tool_access')
      .upsert(
        {
          user_id: userId,
          tool_name: toolName,
          has_access: hasAccess,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,tool_name',
        }
      );

    if (upsertError) {
      console.error('Upsert error:', upsertError);
      return new Response(
        JSON.stringify({ error: 'Failed to update tool access' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Tool access updated successfully');

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in admin-update-tool-access:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
