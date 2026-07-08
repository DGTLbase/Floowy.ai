import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const TIKTOK_ACTOR = "clockworks~tiktok-scraper";

// Kick off a TikTok post scrape on Apify; returns the run id.
async function startTikTokScrape(token: string, input: {
  keywords: string[]; hashtags: string[]; usernames: string[];
  resultsPerPage: number; days?: 1 | 7 | 30; countryCode?: string;
}): Promise<string> {
  const searchQueries = [
    ...input.keywords,
    ...input.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)),
  ].filter(Boolean);
  const profiles = (input.usernames ?? []).map((u) => u.trim().replace(/^@/, "")).filter(Boolean);
  if (searchQueries.length === 0 && profiles.length === 0) {
    throw new Error("Provide at least one keyword, hashtag, or username");
  }
  const requested = Math.max(1, Math.min(input.resultsPerPage ?? 30, 1000));
  let oldestPostDate: string | undefined;
  if (input.days) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - input.days);
    oldestPostDate = d.toISOString().slice(0, 10);
  }
  const body: Record<string, unknown> = {
    resultsPerPage: requested,
    shouldDownloadVideos: false,
    shouldDownloadCovers: false,
    shouldDownloadSubtitles: false,
    proxyConfiguration: { useApifyProxy: true },
  };
  if (searchQueries.length > 0) body.searchQueries = searchQueries;
  if (profiles.length > 0) {
    body.profiles = profiles;
    body.profileScrapeSections = ["videos"];
    body.profileSorting = "latest";
  }
  if (oldestPostDate) { body.oldestPostDate = oldestPostDate; body.oldestPostDateUnified = oldestPostDate; }
  const cc = input.countryCode?.trim();
  if (cc && cc.toLowerCase() !== "all") body.countryCode = cc.toUpperCase();

  const res = await fetch(
    `https://api.apify.com/v2/acts/${TIKTOK_ACTOR}/runs?token=${encodeURIComponent(token)}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
  );
  if (!res.ok) throw new Error(`Apify start failed (${res.status}): ${(await res.text()).slice(0, 400)}`);
  const json = await res.json();
  const runId = json?.data?.id;
  if (!runId) throw new Error("Apify did not return a run id");
  return runId;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const { projectId, resultsPerPage = 30, days, countryCode } = await req.json();
    if (!projectId) return json({ error: "projectId is required" }, 400);

    const { data: project, error: pErr } = await supabase.from("projects").select("*").eq("id", projectId).single();
    if (pErr || !project) return json({ error: pErr?.message ?? "Project not found" }, 404);

    const APIFY = Deno.env.get("APIFY_API_TOKEN");
    if (!APIFY) return json({ error: "APIFY_API_TOKEN is not configured" }, 500);

    const platform = (project as any).platform ?? "tiktok";
    const sourceType = (project as any).source_type ?? "post";
    if (platform !== "tiktok" || sourceType !== "post") {
      return json({ error: `Platform "${platform}/${sourceType}" is not yet supported in this build (TikTok posts only).` }, 400);
    }

    const apifyRunId = await startTikTokScrape(APIFY, {
      keywords: project.keywords ?? [],
      hashtags: project.hashtags ?? [],
      usernames: ((project as any).usernames ?? []).map((u: string) => u.replace(/^@/, "")),
      resultsPerPage, days, countryCode,
    });

    const { data: runRow, error: runErr } = await supabase
      .from("scrape_runs")
      .insert({ project_id: project.id, user_id: user.id, status: "running", apify_run_id: apifyRunId })
      .select().single();
    if (runErr || !runRow) return json({ error: runErr?.message ?? "Failed to record run" }, 500);

    return json({ runId: runRow.id, apifyRunId, status: "running" });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
