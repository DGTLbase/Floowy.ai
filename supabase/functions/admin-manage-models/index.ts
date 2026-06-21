import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, admin-token, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const adminToken = req.headers.get('admin-token');
    if (!adminToken) {
      return new Response(JSON.stringify({ error: 'Admin token required' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin session
    const { data: session } = await supabase
      .from('admin_sessions')
      .select('id')
      .eq('token', adminToken)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (!session) {
      return new Response(JSON.stringify({ error: 'Invalid or expired session' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const body = await req.json();
    const { action, model_type } = body;
    const table = model_type === 'premium' ? 'custom_models' : 'default_models';

    if (action === 'list') {
      const orderCol = model_type === 'premium' ? 'created_at' : 'sort_order';
      const ascending = model_type !== 'premium';
      const { data, error } = await supabase.from(table).select('*').order(orderCol, { ascending });
      if (error) throw error;
      return new Response(JSON.stringify({ models: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'add') {
      const { payload } = body;
      const { error } = await supabase.from(table).insert(payload);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'update') {
      const { id, payload } = body;
      const { error } = await supabase.from(table).update(payload).eq('id', id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'delete') {
      const { id } = body;
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'toggle_active') {
      const { id, is_active } = body;
      const { error } = await supabase.from(table).update({ is_active }).eq('id', id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
