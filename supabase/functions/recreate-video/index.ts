// Video Recreation Studio backend (briefing v1.0) — ASYNC video-to-video.
// Transforms an uploaded video using chip-selected edits + optional custom text.
// Fixed 8 credits, deducted server-side ONLY on successful completion; a failed
// or timed-out generation charges nothing.
//
// Two actions (client polls, avoiding the edge-function wall-clock timeout):
//   { action:"submit", video_url, edits:string[], custom_text? } -> { request_id, status_url, response_url }
//   { action:"status", status_url, response_url } -> { status, video_url? }
//
// Model is swappable via env (backend-only — no provider name shown in the UI):
//   FAL_API_KEY, FAL_VIDEO_RECREATE_MODEL (falls back to FAL_VIDEO_EDIT_MODEL).
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getUserTier, isAdmin, tierMeets, tierDenied } from "../_shared/tier.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const RECREATION_CREDITS = 8;

const extract = (o: any): string | null =>
  o?.video?.url ?? o?.video_url ?? o?.output?.url ?? o?.output?.video?.url
  ?? o?.videos?.[0]?.url ?? o?.output?.videos?.[0]?.url ?? null;

// Branding-clean instruction assembled from the selected edit fragments + custom text.
function buildRecreationPrompt(edits: string[], custom: string): string {
  const clean = (edits ?? []).map((e) => String(e).trim()).filter(Boolean);
  const c = (custom ?? "").trim();
  return [
    "Transform this existing video by applying the following edits while keeping it photorealistic and high quality:",
    ...clean.map((e) => `- ${e}`),
    c ? `- ${c}` : "",
    "Preserve the main subject and product exactly — its shape, colours, logos, prints and design details — and keep the original camera motion, pacing and duration. Do not add any on-screen text, captions, subtitles, watermarks or logos that are not already in the source. Seamless, professional result.",
  ].filter(Boolean).join("\n");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action ?? "submit";

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );
    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData.user) return json({ error: "Unauthorized" }, 401);
    const user = userData.user;

    // Tier gate (Tier Briefing): Video Recreation Studio is a Starter+ tool. Admins bypass.
    if (!(await isAdmin(admin, user.id)) && !tierMeets(await getUserTier(admin, user.id), "starter")) {
      return tierDenied("starter", corsHeaders);
    }

    const FAL_API_KEY = Deno.env.get("FAL_API_KEY");
    const MODEL = Deno.env.get("FAL_VIDEO_RECREATE_MODEL") || Deno.env.get("FAL_VIDEO_EDIT_MODEL");
    if (!FAL_API_KEY || !MODEL) return json({ error: "Video Recreation is not available yet." }, 501);

    // ---------- STATUS: poll one tick; charge + return URL on completion ----------
    if (action === "status") {
      const { status_url, response_url } = body;
      if (!status_url || !response_url) return json({ error: "status_url and response_url are required" }, 400);

      const st = await fetch(status_url, { headers: { Authorization: `Key ${FAL_API_KEY}` } });
      const stData = await st.json().catch(() => ({}));

      if (stData.status === "COMPLETED") {
        const res = await fetch(response_url, { headers: { Authorization: `Key ${FAL_API_KEY}` } });
        const out = await res.json().catch(() => ({}));
        const url = extract(out);
        if (!url) return json({ status: "FAILED", error: "Recreation finished but no video URL", detail: out });
        const { error: dedErr } = await admin.rpc("deduct_credits", { p_user_id: user.id, p_amount: RECREATION_CREDITS });
        if (dedErr) console.error("[recreate-video] deduct failed", dedErr.message);
        return json({ status: "COMPLETED", video_url: url, credits_used: RECREATION_CREDITS });
      }
      if (stData.status === "FAILED" || stData.status === "ERROR") {
        return json({ status: "FAILED", error: "Recreation failed", detail: stData });
      }
      return json({ status: "PROCESSING" });
    }

    // ---------- SUBMIT: pre-check credits + queue the fal job ----------
    const { video_url, edits = [], custom_text = "" } = body;
    if (!video_url) return json({ error: "video_url is required" }, 400);
    if ((!Array.isArray(edits) || edits.length === 0) && !String(custom_text).trim()) {
      return json({ error: "Select at least one edit or add a custom instruction." }, 400);
    }

    const { data: creditRow } = await admin.from("credits").select("balance").eq("user_id", user.id).maybeSingle();
    if ((creditRow?.balance ?? 0) < RECREATION_CREDITS) {
      return json({ error: `Not enough credits — ${RECREATION_CREDITS} required.` }, 402);
    }

    const prompt = buildRecreationPrompt(edits, custom_text);
    // Video-to-video edit. Omni defaults generate_audio=true; send false so a
    // recreation never ADDS a soundtrack the source didn't have.
    const isOmni = MODEL.includes("omni") || MODEL.includes("gemini");
    const submitBody: Record<string, unknown> = { video_url, prompt, ...(isOmni ? { generate_audio: false } : {}) };

    const submit = await fetch(`https://queue.fal.run/${MODEL}`, {
      method: "POST",
      headers: { Authorization: `Key ${FAL_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(submitBody),
    });
    const submitData = await submit.json().catch(() => ({}));
    if (!submit.ok) return json({ error: `Failed to submit recreation: ${JSON.stringify(submitData).slice(0, 300)}`, detail: submitData }, 502);
    if (!submitData.status_url || !submitData.response_url) {
      return json({ error: "Unexpected submit response from provider", detail: submitData }, 502);
    }

    return json({
      request_id: submitData.request_id,
      status_url: submitData.status_url,
      response_url: submitData.response_url,
      status: "PROCESSING",
    });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
