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

    const { action, tool_name, video_url, id } = await req.json();

    if (action === 'list') {
      const { data, error } = await supabase
        .from('knowledge_base_videos')
        .select('*');
      if (error) throw error;
      return new Response(JSON.stringify({ videos: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'upsert') {
      // Check if exists
      const { data: existing } = await supabase
        .from('knowledge_base_videos')
        .select('id')
        .eq('tool_name', tool_name)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('knowledge_base_videos')
          .update({ video_url })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('knowledge_base_videos')
          .insert({ tool_name, video_url });
        if (error) throw error;
      }
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'delete') {
      const { error } = await supabase
        .from('knowledge_base_videos')
        .delete()
        .eq('tool_name', tool_name);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message || 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
