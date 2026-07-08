import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function apifyStatus(token: string, runId: string): Promise<{ status: string; datasetId?: string }> {
  const res = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${encodeURIComponent(token)}`);
  if (!res.ok) throw new Error(`Apify status fetch failed (${res.status})`);
  const json = await res.json();
  return { status: json?.data?.status ?? "RUNNING", datasetId: json?.data?.defaultDatasetId };
}

async function apifyDataset<T = any>(token: string, datasetId: string): Promise<T[]> {
  const res = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?clean=true&format=json&token=${encodeURIComponent(token)}`);
  if (!res.ok) throw new Error(`Apify dataset fetch failed (${res.status})`);
  const items = await res.json();
  return Array.isArray(items) ? items : [];
}

function filterByDays(items: any[], days?: 1 | 7 | 30): any[] {
  if (!days) return items;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return items.filter((it) => {
    if (!it.createTimeISO) return false;
    const t = new Date(it.createTimeISO).getTime();
    return Number.isFinite(t) && t >= cutoff;
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const { runRowId, days } = await req.json();
    if (!runRowId) return json({ error: "runRowId is required" }, 400);

    const { data: runRow, error: rErr } = await supabase.from("scrape_runs").select("*").eq("id", runRowId).single();
    if (rErr || !runRow) return json({ error: rErr?.message ?? "Run not found" }, 404);

    if (runRow.status === "completed" || runRow.status === "failed") {
      return json({ status: runRow.status, videoCount: runRow.video_count ?? 0, error: runRow.error ?? null });
    }
    if (!runRow.apify_run_id) return json({ status: "running", videoCount: 0, error: null });

    const APIFY = Deno.env.get("APIFY_API_TOKEN");
    if (!APIFY) return json({ error: "APIFY_API_TOKEN is not configured" }, 500);

    let st: { status: string; datasetId?: string };
    try { st = await apifyStatus(APIFY, runRow.apify_run_id); }
    catch (e) { return json({ status: "running", videoCount: 0, error: null, note: String(e) }); }

    if (st.status === "FAILED" || st.status === "ABORTED" || st.status === "TIMED-OUT") {
      const msg = `Apify run ${st.status.toLowerCase()}`;
      await supabase.from("scrape_runs").update({ status: "failed", error: msg, completed_at: new Date().toISOString() }).eq("id", runRow.id);
      return json({ status: "failed", videoCount: 0, error: msg });
    }
    if (st.status !== "SUCCEEDED") return json({ status: "running", videoCount: 0, error: null });

    try {
      if (!st.datasetId) throw new Error("Apify run missing dataset id");
      // TikTok posts ingest
      const raw = await apifyDataset(APIFY, st.datasetId);
      const items = filterByDays(raw, days);
      const rows = items.map((it: any) => ({
        project_id: runRow.project_id,
        user_id: user.id,
        scrape_run_id: runRow.id,
        tiktok_id: it.id ?? null,
        tiktok_url: it.webVideoUrl ?? null,
        author_username: it.authorMeta?.name ?? null,
        author_name: it.authorMeta?.nickName ?? null,
        caption: it.text ?? null,
        hashtags: (it.hashtags ?? []).map((h: any) => h?.name ?? "").filter(Boolean),
        likes: it.diggCount ?? 0,
        comments_count: it.commentCount ?? 0,
        shares: it.shareCount ?? 0,
        plays: it.playCount ?? 0,
        duration_seconds: it.videoMeta?.duration ?? null,
        posted_at: it.createTimeISO ?? null,
        thumbnail_url: it.videoMeta?.coverUrl ?? null,
        raw_data: it,
      })).filter((r) => r.tiktok_id);

      if (rows.length > 0) {
        const { error } = await supabase.from("videos").upsert(rows, { onConflict: "project_id,tiktok_id", ignoreDuplicates: false });
        if (error) throw new Error(error.message);
      }
      await supabase.from("scrape_runs").update({ status: "completed", video_count: rows.length, completed_at: new Date().toISOString(), error: null }).eq("id", runRow.id);
      return json({ status: "completed", videoCount: rows.length, error: null });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await supabase.from("scrape_runs").update({ status: "failed", error: msg.slice(0, 1000), completed_at: new Date().toISOString() }).eq("id", runRow.id);
      return json({ status: "failed", videoCount: 0, error: msg });
    }
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
