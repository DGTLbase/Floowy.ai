// Post-generation Video Editing Tool backend (briefing §5).
// Prompt-based edit of an existing video. Credits (5) are deducted server-side
// ONLY on successful completion; a failed edit charges nothing.
//
// Model is swappable via env so it can be pointed at the production video-edit
// endpoint (Omni / Kling) without a code change:
//   FAL_API_KEY           — provider key (already set for generation)
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
const POLL_TIMEOUT_MS = 140_000;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { video_url, prompt } = await req.json().catch(() => ({}));
    if (!video_url || !prompt) return json({ error: "video_url and prompt are required" }, 400);

    // Authenticate the caller (the modal invokes with the user's session JWT).
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
    const MODEL = Deno.env.get("FAL_VIDEO_EDIT_MODEL"); // set to the real edit model to enable
    if (!FAL_API_KEY || !MODEL) {
      // Not configured yet — fail cleanly so the UI shows an error and no credits move.
      return json({ error: "Video editing is not available yet." }, 501);
    }

    // Pre-check balance so we don't run an edit the user can't pay for.
    const { data: creditRow } = await admin.from("credits").select("balance").eq("user_id", user.id).maybeSingle();
    if ((creditRow?.balance ?? 0) < EDIT_CREDITS) {
      return json({ error: `Not enough credits — ${EDIT_CREDITS} required.` }, 402);
    }

    // Submit the edit job.
    const submit = await fetch(`https://queue.fal.run/${MODEL}`, {
      method: "POST",
      headers: { Authorization: `Key ${FAL_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ video_url, prompt }),
    });
    const submitData = await submit.json();
    if (!submit.ok) return json({ error: "Failed to submit edit", detail: submitData }, 502);
    // fal returns the canonical status/response URLs — use them (hand-built paths
    // break for sub-path models like ".../edit").
    const statusUrl: string | undefined = submitData.status_url;
    const responseUrl: string | undefined = submitData.response_url;
    if (!statusUrl || !responseUrl) {
      return json({ error: "Unexpected submit response", detail: submitData }, 502);
    }

    const extract = (o: any): string | null =>
      o?.video?.url ?? o?.video_url ?? o?.output?.url ?? o?.output?.video?.url
      ?? o?.videos?.[0]?.url ?? o?.output?.videos?.[0]?.url ?? null;

    // Poll to completion (bounded).
    const started = Date.now();
    let resultUrl: string | null = null;
    while (Date.now() - started < POLL_TIMEOUT_MS) {
      await new Promise((r) => setTimeout(r, 4000));
      const st = await fetch(statusUrl, { headers: { Authorization: `Key ${FAL_API_KEY}` } });
      const stData = await st.json().catch(() => ({}));
      if (stData.status === "COMPLETED") {
        const res = await fetch(responseUrl, { headers: { Authorization: `Key ${FAL_API_KEY}` } });
        const out = await res.json().catch(() => ({}));
        resultUrl = extract(out);
        if (!resultUrl) return json({ error: "Edit finished but no video URL", detail: out }, 502);
        break;
      }
      if (stData.status === "FAILED" || stData.status === "ERROR") {
        return json({ error: "Edit failed", detail: stData }, 502);
      }
    }

    if (!resultUrl) return json({ error: "Edit timed out. No credits were charged." }, 504);

    // Success → deduct credits atomically (server-side, per briefing §5.7).
    const { error: dedErr } = await admin.rpc("deduct_credits", { p_user_id: user.id, p_amount: EDIT_CREDITS });
    if (dedErr) console.error("[edit-video] deduct failed", dedErr.message);

    return json({ video_url: resultUrl, credits_used: EDIT_CREDITS });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
