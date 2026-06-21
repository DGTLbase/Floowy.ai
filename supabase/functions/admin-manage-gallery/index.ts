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

    // Support both JSON and multipart/form-data (for binary uploads)
    const contentType = (req.headers.get('content-type') || '').toLowerCase();
    let body: Record<string, any> = {};
    let uploadFile: { bytes: Uint8Array; name: string; type: string } | null = null;

    if (contentType.includes('multipart/form-data')) {
      try {
        const form = await req.formData();
        for (const [k, v] of form.entries()) {
          if (v instanceof File) {
            uploadFile = {
              bytes: new Uint8Array(await v.arrayBuffer()),
              name: v.name,
              type: v.type,
            };
          } else {
            body[k] = String(v);
          }
        }
      } catch (e) {
        console.error('formData parse error:', e);
        return new Response(JSON.stringify({ error: 'Failed to parse multipart body' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    } else {
      // Read as text first so we never crash on empty/non-JSON bodies
      const raw = await req.text();
      if (raw && raw.trim().length > 0) {
        try {
          body = JSON.parse(raw);
        } catch (e) {
          console.error('JSON parse error. content-type:', contentType, 'preview:', raw.slice(0, 80));
          return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }
    }

    const { action, id, src_url, alt, type, sort_order, is_visible } = body;
    console.log('admin-manage-gallery action:', action, 'has file:', !!uploadFile);

    if (action === 'upload') {
      let bytes: Uint8Array;
      let fileName: string;
      let fileType: string;
      if (uploadFile) {
        bytes = uploadFile.bytes;
        fileName = uploadFile.name;
        fileType = uploadFile.type;
      } else {
        const { file_base64, file_name, content_type } = body;
        if (!file_base64 || !file_name) {
          return new Response(JSON.stringify({ error: 'Missing file' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        bytes = Uint8Array.from(atob(file_base64), c => c.charCodeAt(0));
        fileName = file_name;
        fileType = content_type || 'application/octet-stream';
      }
      const ext = fileName.split('.').pop();
      const path = `gallery/gallery-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('products')
        .upload(path, bytes, { contentType: fileType || 'application/octet-stream', upsert: false });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from('products').getPublicUrl(path);
      return new Response(JSON.stringify({ public_url: pub.publicUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'list') {
      const { data, error } = await supabase
        .from('gallery_items')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return new Response(JSON.stringify({ items: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'add') {
      const { error } = await supabase
        .from('gallery_items')
        .insert({ src_url, alt: alt || '', type: type || 'image', sort_order: sort_order || 0 });
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'update') {
      const updates: Record<string, any> = {};
      if (is_visible !== undefined) updates.is_visible = is_visible;
      if (alt !== undefined) updates.alt = alt;
      if (type !== undefined) updates.type = type;
      if (src_url !== undefined) updates.src_url = src_url;

      const { error } = await supabase
        .from('gallery_items')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'reorder') {
      const { error } = await supabase
        .from('gallery_items')
        .update({ sort_order })
        .eq('id', id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'delete') {
      const { error } = await supabase
        .from('gallery_items')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
