import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, admin-token",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function slugify(str: string) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64) || `s-${Date.now()}`;
}

function decodeBase64(b64: string) {
  const clean = b64.includes(",") ? b64.split(",")[1] : b64;
  const bin = atob(clean);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const adminToken = req.headers.get("admin-token");
    if (!adminToken) return json({ error: "Admin token required" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: session } = await supabase
      .from("admin_sessions")
      .select("id")
      .eq("token", adminToken)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();
    if (!session) return json({ error: "Invalid or expired session" }, 401);

    const body = await req.json();
    const { action } = body;

    if (action === "list") {
      const [cats, subs, styles] = await Promise.all([
        supabase.from("flatlay_style_categories").select("*").order("sort_order"),
        supabase.from("flatlay_subcategories").select("*").order("sort_order"),
        supabase.from("flatlay_styles").select("*").order("sort_order"),
      ]);
      if (cats.error) throw cats.error;
      if (subs.error) throw subs.error;
      if (styles.error) throw styles.error;
      return json({
        categories: cats.data,
        subcategories: subs.data,
        styles: styles.data,
      });
    }

    if (action === "upload_image") {
      const { file_base64, content_type, filename } = body;
      if (!file_base64) return json({ error: "file_base64 required" }, 400);
      const ext = (filename?.split(".").pop() || "jpg").toLowerCase();
      const path = `flatlay-styles/admin/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const bytes = decodeBase64(file_base64);
      const { error: upErr } = await supabase.storage
        .from("generated")
        .upload(path, bytes, { contentType: content_type || "image/jpeg", upsert: false });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("generated").getPublicUrl(path);
      return json({ url: pub.publicUrl });
    }

    // ---- Subcategories ----
    if (action === "add_subcategory") {
      const { category_id, name, sort_order } = body;
      if (!category_id || !name) return json({ error: "category_id and name required" }, 400);
      const { data, error } = await supabase
        .from("flatlay_subcategories")
        .insert({ category_id, name, slug: slugify(name), sort_order: sort_order ?? 0 })
        .select()
        .single();
      if (error) throw error;
      return json({ subcategory: data });
    }

    if (action === "update_subcategory") {
      const { id, name, sort_order, category_id } = body;
      const payload: Record<string, unknown> = {};
      if (name !== undefined) { payload.name = name; payload.slug = slugify(name); }
      if (sort_order !== undefined) payload.sort_order = sort_order;
      if (category_id !== undefined) payload.category_id = category_id;
      const { error } = await supabase.from("flatlay_subcategories").update(payload).eq("id", id);
      if (error) throw error;
      return json({ success: true });
    }

    if (action === "delete_subcategory") {
      const { id } = body;
      // Delete child styles first
      await supabase.from("flatlay_styles").delete().eq("subcategory_id", id);
      const { error } = await supabase.from("flatlay_subcategories").delete().eq("id", id);
      if (error) throw error;
      return json({ success: true });
    }

    // ---- Styles (variants) ----
    if (action === "add_style") {
      const { category_id, subcategory_id, name, image_url, sort_order, is_active, output_type } = body;
      if (!category_id || !subcategory_id || !name || !image_url)
        return json({ error: "category_id, subcategory_id, name, image_url required" }, 400);
      const ot = output_type === "halo_bust" ? "halo_bust" : "flatlay";
      const { data, error } = await supabase
        .from("flatlay_styles")
        .insert({
          category_id,
          subcategory_id,
          name,
          image_url,
          sort_order: sort_order ?? 0,
          is_active: is_active ?? true,
          output_type: ot,
        })
        .select()
        .single();
      if (error) throw error;
      return json({ style: data });
    }

    if (action === "update_style") {
      const { id, name, image_url, sort_order, is_active, subcategory_id, category_id, output_type } = body;
      const payload: Record<string, unknown> = {};
      if (name !== undefined) payload.name = name;
      if (image_url !== undefined) payload.image_url = image_url;
      if (sort_order !== undefined) payload.sort_order = sort_order;
      if (is_active !== undefined) payload.is_active = is_active;
      if (subcategory_id !== undefined) payload.subcategory_id = subcategory_id;
      if (category_id !== undefined) payload.category_id = category_id;
      if (output_type !== undefined) {
        payload.output_type = output_type === "halo_bust" ? "halo_bust" : "flatlay";
      }
      const { error } = await supabase.from("flatlay_styles").update(payload).eq("id", id);
      if (error) throw error;
      return json({ success: true });
    }

    if (action === "delete_style") {
      const { id } = body;
      const { error } = await supabase.from("flatlay_styles").delete().eq("id", id);
      if (error) throw error;
      return json({ success: true });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});