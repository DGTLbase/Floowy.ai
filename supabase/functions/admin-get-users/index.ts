import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, admin-token, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  console.log('admin-get-users called, method:', req.method);
  
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

    console.log('Admin session verified, fetching profiles...');
    
    // Fetch all profiles
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    console.log('Profiles fetched:', profiles?.length, 'Error:', profilesError);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch users' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch related data per user, but in BOUNDED batches. An unbounded
    // Promise.all over every profile fired thousands of concurrent queries and
    // exhausted the connection pool, hanging the admin page. Batching caps the
    // concurrency so it stays responsive as the user base grows.
    console.log('Fetching user data for', profiles.length, 'profiles');

    const loadUser = async (profile: any) => {
      const [creditRes, genRes, toolRes, onbRes, cancelRes] = await Promise.all([
        supabaseAdmin.from('credits').select('balance').eq('user_id', profile.id).maybeSingle(),
        // Exact generation count without pulling every row into memory.
        supabaseAdmin.from('generations').select('id', { count: 'exact', head: true }).eq('user_id', profile.id),
        supabaseAdmin.from('user_tool_access').select('tool_name, has_access').eq('user_id', profile.id),
        supabaseAdmin.from('onboarding_data').select('*').eq('user_id', profile.id).maybeSingle(),
        supabaseAdmin.from('cancellation_feedback').select('reason, details, created_at').eq('user_id', profile.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      ]);

      const toolAccessMap: Record<string, boolean> = {};
      (toolRes.data as any[] | null)?.forEach((access: any) => {
        toolAccessMap[access.tool_name] = access.has_access;
      });

      return {
        ...profile,
        credits: (creditRes.data as any)?.balance || 0,
        generations: genRes.count || 0,
        toolAccess: toolAccessMap,
        onboardingData: onbRes.data || null,
        cancellationFeedback: cancelRes.data || null,
      };
    };

    const BATCH_SIZE = 25;
    const usersWithData: any[] = [];
    for (let i = 0; i < profiles.length; i += BATCH_SIZE) {
      const batch = profiles.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(batch.map(loadUser));
      usersWithData.push(...results);
    }

    console.log('Successfully prepared', usersWithData.length, 'users');
    return new Response(
      JSON.stringify({ users: usersWithData }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in admin-get-users:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
