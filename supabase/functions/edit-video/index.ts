// Post-generation Video Editing Tool backend (briefing §5) — ASYNC.
// Prompt-based edit of an existing video. Credits (5) are deducted server-side
// ONLY on successful completion; a failed edit charges nothing.
//
// Two actions (avoids the edge-function wall-clock timeout that a long synchronous
// poll would hit — the client polls instead, same pattern as generation):
//   { action:"submit", video_url, prompt } -> { request_id, status_url, response_url }
//   { action:"status", status_url, response_url } -> { status, video_url? }
//
// Model is swappable via env:
//   FAL_API_KEY            — provider key
//   FAL_VIDEO_EDIT_MODEL   — e.g. "fal-ai/<video-to-video-model>"
// Until FAL_VIDEO_EDIT_MODEL is set the function returns 501 and no credits move.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const EDIT_CREDITS = 5;

const extract = (o: any): string | null =>
  o?.video?.url ?? o?.video_url ?? o?.output?.url ?? o?.output?.video?.url
  ?? o?.videos?.[0]?.url ?? o?.output?.videos?.[0]?.url ?? null;

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

    const FAL_API_KEY = Deno.env.get("FAL_API_KEY");
    const MODEL = Deno.env.get("FAL_VIDEO_EDIT_MODEL");
    if (!FAL_API_KEY || !MODEL) return json({ error: "Video editing is not available yet." }, 501);

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
        if (!url) return json({ status: "FAILED", error: "Edit finished but no video URL", detail: out });
        // Success → deduct credits (server-side). Client stops polling on COMPLETED.
        const { error: dedErr } = await admin.rpc("deduct_credits", { p_user_id: user.id, p_amount: EDIT_CREDITS });
        if (dedErr) console.error("[edit-video] deduct failed", dedErr.message);
        return json({ status: "COMPLETED", video_url: url, credits_used: EDIT_CREDITS });
      }
      if (stData.status === "FAILED" || stData.status === "ERROR") {
        return json({ status: "FAILED", error: "Edit failed", detail: stData });
      }
      return json({ status: "PROCESSING" });
    }

    // ---------- SUBMIT: pre-check credits + queue the fal job ----------
    const { video_url, prompt } = body;
    if (!video_url || !prompt) return json({ error: "video_url and prompt are required" }, 400);

    const { data: creditRow } = await admin.from("credits").select("balance").eq("user_id", user.id).maybeSingle();
    if ((creditRow?.balance ?? 0) < EDIT_CREDITS) {
      return json({ error: `Not enough credits — ${EDIT_CREDITS} required.` }, 402);
    }

    // Omni's edit model defaults generate_audio=true — it synthesizes a soundtrack
    // even when the source clip is silent. Send false so an edit never ADDS audio.
    const isOmni = (MODEL ?? "").includes("omni") || (MODEL ?? "").includes("gemini");
    const submitBody: Record<string, unknown> = { video_url, prompt, ...(isOmni ? { generate_audio: false } : {}) };
    const submit = await fetch(`https://queue.fal.run/${MODEL}`, {
      method: "POST",
      headers: { Authorization: `Key ${FAL_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(submitBody),
    });
    const submitData = await submit.json().catch(() => ({}));
    if (!submit.ok) return json({ error: `Failed to submit edit: ${JSON.stringify(submitData).slice(0, 300)}`, detail: submitData }, 502);
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
