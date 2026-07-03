// Partner API gateway (MVP): per-request pricing against a prepaid credit
// balance on an admin-provisioned key.
//
// Partner endpoints (Authorization: Bearer flw_live_...):
//   POST {"tool":"ambience","prompt":"...","image_url":"..."}  -> charges 1 credit, returns request_id
//   POST {"action":"status","request_id":"..."}                -> free, returns status/result
//   POST {"action":"balance"}                                  -> free, returns credits_remaining
//
// Admin endpoints (Authorization: Bearer <admin user JWT>, body.admin = true):
//   {admin:true, action:"create_key", partner_name, partner_email?, price_per_credit?, allowed_tools?}
//   {admin:true, action:"list_keys"}
//   {admin:true, action:"topup", key_id, credits, amount_eur, note?}
//   {admin:true, action:"revoke", key_id}
//   {admin:true, action:"usage", key_id}
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const sha256 = async (s: string) => {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(d)).map((b) => b.toString(16).padStart(2, "0")).join("");
};

const admin = () => createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } },
);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();
    const db = admin();

    // ---------- Admin management ----------
    if (body.admin === true) {
      const { data: userData, error } = await db.auth.getUser(token);
      if (error || !userData.user) return json({ error: "Unauthorized" }, 401);
      const { data: role } = await db.from("user_roles")
        .select("role").eq("user_id", userData.user.id).eq("role", "admin").maybeSingle();
      if (!role) return json({ error: "Admin only" }, 403);

      if (body.action === "create_key") {
        const raw = new Uint8Array(24); crypto.getRandomValues(raw);
        const secret = "flw_live_" + Array.from(raw).map((b) => b.toString(16).padStart(2, "0")).join("");
        const { data, error: e } = await db.from("api_keys").insert({
          key_hash: await sha256(secret),
          key_prefix: secret.slice(0, 16) + "…",
          partner_name: body.partner_name,
          partner_email: body.partner_email ?? null,
          price_per_credit: body.price_per_credit ?? 0.20,
          allowed_tools: body.allowed_tools ?? ["ambience"],
          created_by: userData.user.id,
        }).select("id, key_prefix").single();
        if (e) return json({ error: e.message }, 400);
        // plaintext returned ONCE — never stored
        return json({ ...data, api_key: secret });
      }
      if (body.action === "list_keys") {
        const { data } = await db.from("api_keys")
          .select("id, key_prefix, partner_name, partner_email, price_per_credit, credits_balance, allowed_tools, status, created_at, last_used_at")
          .order("created_at", { ascending: false });
        return json({ keys: data ?? [] });
      }
      if (body.action === "topup") {
        const { error: e1 } = await db.from("api_credit_purchases").insert({
          api_key_id: body.key_id, credits: body.credits, amount_eur: body.amount_eur,
          note: body.note ?? null, created_by: userData.user.id,
        });
        if (e1) return json({ error: e1.message }, 400);
        const { data, error: e2 } = await db.rpc("api_topup_credits", { p_key_id: body.key_id, p_credits: body.credits });
        if (e2) { // fallback if RPC missing: non-atomic update
          const { data: k } = await db.from("api_keys").select("credits_balance").eq("id", body.key_id).single();
          await db.from("api_keys").update({ credits_balance: (k?.credits_balance ?? 0) + body.credits }).eq("id", body.key_id);
        }
        return json({ success: true, added: body.credits, rpc: data ?? null });
      }
      if (body.action === "revoke") {
        await db.from("api_keys").update({ status: "revoked" }).eq("id", body.key_id);
        return json({ success: true });
      }
      if (body.action === "usage") {
        const { data } = await db.from("api_usage")
          .select("tool, credits_charged, price_per_credit, status, created_at")
          .eq("api_key_id", body.key_id).order("created_at", { ascending: false }).limit(200);
        const spend = (data ?? []).reduce((s, u) => s + Number(u.price_per_credit) * u.credits_charged, 0);
        return json({ usage: data ?? [], total_calls: data?.length ?? 0, total_eur: Math.round(spend * 100) / 100 });
      }
      return json({ error: "Unknown admin action" }, 400);
    }

    // ---------- Partner API ----------
    if (!token.startsWith("flw_live_")) return json({ error: "Invalid API key" }, 401);
    const keyHash = await sha256(token);
    const { data: key } = await db.from("api_keys")
      .select("id, status, allowed_tools, credits_balance, price_per_credit")
      .eq("key_hash", keyHash).maybeSingle();
    if (!key || key.status !== "active") return json({ error: "Invalid or revoked API key" }, 401);

    if (body.action === "balance") return json({ credits_remaining: key.credits_balance });

    const FAL_API_KEY = Deno.env.get("FAL_API_KEY") ?? Deno.env.get("FAL_KEY") ?? "";

    if (body.action === "status") {
      if (!body.request_id) return json({ error: "request_id required" }, 400);
      const st = await fetch(`https://queue.fal.run/fal-ai/nano-banana-pro/requests/${body.request_id}/status`,
        { headers: { Authorization: `Key ${FAL_API_KEY}` } });
      const stData = await st.json();
      if (stData.status === "COMPLETED") {
        const res = await fetch(`https://queue.fal.run/fal-ai/nano-banana-pro/requests/${body.request_id}`,
          { headers: { Authorization: `Key ${FAL_API_KEY}` } });
        const result = await res.json();
        return json({ status: "completed", images: result.images ?? result.output ?? result });
      }
      return json({ status: stData.status?.toLowerCase() ?? "unknown" });
    }

    // Generation request
    const tool = body.tool ?? "ambience";
    if (tool !== "ambience") return json({ error: `Unknown tool '${tool}'. Available: ambience` }, 400);
    if (!body.prompt || !body.image_url) return json({ error: "prompt and image_url are required" }, 400);

    // Atomic charge: rejects if revoked, tool not allowed, or balance empty.
    const { data: charged, error: chErr } = await db.rpc("api_consume_credit", {
      p_key_hash: keyHash, p_tool: tool, p_cost: 1,
    });
    if (chErr || !charged || charged.length === 0) {
      return json({ error: "Insufficient credits or tool not enabled for this key", credits_remaining: key.credits_balance }, 402);
    }
    const { key_id, new_balance, price } = charged[0];

    const gen = await fetch("https://queue.fal.run/fal-ai/nano-banana-pro/edit", {
      method: "POST",
      headers: { Authorization: `Key ${FAL_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: body.prompt,
        image_urls: [body.image_url],
        aspect_ratio: body.aspect_ratio ?? "1:1",
        resolution: body.resolution ?? "1K",
      }),
    });
    const genData = await gen.json();
    const ok = gen.ok && genData.request_id;

    await db.from("api_usage").insert({
      api_key_id: key_id, tool, credits_charged: 1, price_per_credit: price,
      request_id: genData.request_id ?? null, status: ok ? "ok" : "error",
    });

    if (!ok) return json({ error: "Generation failed", detail: genData }, 502);
    return json({ request_id: genData.request_id, status: "queued", credits_remaining: new_balance });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
