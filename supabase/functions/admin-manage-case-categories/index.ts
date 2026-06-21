import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, admin-token, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

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
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: session } = await supabase
      .from('admin_sessions').select('id').eq('token', adminToken)
      .gt('expires_at', new Date().toISOString()).maybeSingle();
    if (!session) {
      return new Response(JSON.stringify({ error: 'Invalid or expired session' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const body = await req.json();
    const { action, id, name, sort_order } = body;

    if (action === 'list') {
      const { data, error } = await supabase
        .from('case_categories').select('*').order('sort_order', { ascending: true });
      if (error) throw error;
      return new Response(JSON.stringify({ categories: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    if (action === 'create' && name) {
      const { data, error } = await supabase
        .from('case_categories').insert({ name, slug: slugify(name), sort_order: sort_order ?? 0 })
        .select().single();
      if (error) throw error;
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    if (action === 'update' && id) {
      const updates: Record<string, unknown> = {};
      if (name) { updates.name = name; updates.slug = slugify(name); }
      if (typeof sort_order === 'number') updates.sort_order = sort_order;
      const { data, error } = await supabase
        .from('case_categories').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    if (action === 'delete' && id) {
      const { error } = await supabase.from('case_categories').delete().eq('id', id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('admin-manage-case-categories error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});