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

    const { action, id, ...caseData } = await req.json();

    if (action === 'list') {
      const { data, error } = await supabase
        .from('cases')
        .select('*, case_categories(id, name, slug)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return new Response(JSON.stringify({ cases: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'duplicate' && id) {
      const { data: src, error: getErr } = await supabase
        .from('cases').select('*').eq('id', id).single();
      if (getErr) throw getErr;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: _id, created_at, updated_at, slug, ...rest } = src as any;
      const newSlug = `${slug}-copy-${Date.now().toString(36)}`;
      const { data, error } = await supabase
        .from('cases')
        .insert({ ...rest, slug: newSlug, is_published: false, published_at: null, client_name: `${rest.client_name} (Copy)` })
        .select().single();
      if (error) throw error;
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'delete' && id) {
      const { error } = await supabase.from('cases').delete().eq('id', id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (id) {
      const { data, error } = await supabase
        .from('cases').update(caseData).eq('id', id).select().single();
      if (error) throw error;
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data, error } = await supabase
      .from('cases').insert(caseData).select().single();
    if (error) throw error;
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('admin-save-case error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});