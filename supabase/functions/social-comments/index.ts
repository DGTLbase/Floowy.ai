import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { analyzeStructured } from "../_shared/ai-analyze.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Per-kind config: which table, where the post URL lives, the comments actor,
// how to build its input, and which column stores the comment analysis.
// Comment range: fetch up to MAX_COMMENTS; need at least MIN_COMMENTS to analyze.
const MAX_COMMENTS = 99;
const MIN_COMMENTS = 20;
const KINDS: Record<string, {
  table: string; urlField: string; actor: string; commentCol: string;
  input: (url: string) => Record<string, unknown>;
}> = {
  video: {
    table: "videos", urlField: "tiktok_url", commentCol: "comments_analysis",
    actor: "clockworks~tiktok-comments-scraper",
    input: (url) => ({ postURLs: [url], commentsPerPost: MAX_COMMENTS, maxRepliesPerComment: 0 }),
  },
  instagram: {
    table: "instagram_posts", urlField: "url", commentCol: "comment_analysis",
    actor: "apify~instagram-comment-scraper",
    input: (url) => ({ directUrls: [url], resultsLimit: MAX_COMMENTS }),
  },
  facebook: {
    table: "facebook_posts", urlField: "url", commentCol: "comment_analysis",
    actor: "apify~facebook-comments-scraper",
    input: (url) => ({ startUrls: [{ url }], resultsLimit: MAX_COMMENTS, includeNestedComments: false }),
  },
};

const COMMENTS_SCHEMA = {
  type: "object",
  properties: {
    sentiment: {
      type: "object",
      properties: { positive: { type: "number" }, neutral: { type: "number" }, negative: { type: "number" } },
      required: ["positive", "neutral", "negative"],
    },
    overall_mood: { type: "string" },
    top_themes: { type: "array", items: { type: "string" } },
    key_praise: { type: "array", items: { type: "string" } },
    key_criticism: { type: "array", items: { type: "string" } },
    common_questions: { type: "array", items: { type: "string" } },
    engagement_signals: { type: "string" },
    sample_count: { type: "number" },
  },
  required: ["sentiment", "overall_mood", "top_themes", "key_praise", "key_criticism", "common_questions", "engagement_signals", "sample_count"],
};

async function apifyStart(token: string, actor: string, body: unknown): Promise<string> {
  const res = await fetch(`https://api.apify.com/v2/acts/${actor}/runs?token=${encodeURIComponent(token)}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`Apify comments start failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
  const j = await res.json();
  const id = j?.data?.id;
  if (!id) throw new Error("Apify did not return a run id");
  return id;
}
async function apifyStatus(token: string, runId: string): Promise<{ status: string; datasetId?: string }> {
  const res = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${encodeURIComponent(token)}`);
  if (!res.ok) throw new Error(`Apify status fetch failed (${res.status})`);
  const j = await res.json();
  return { status: j?.data?.status ?? "RUNNING", datasetId: j?.data?.defaultDatasetId };
}
async function apifyDataset(token: string, datasetId: string): Promise<any[]> {
  const res = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?clean=true&format=json&token=${encodeURIComponent(token)}`);
  if (!res.ok) throw new Error(`Apify dataset fetch failed (${res.status})`);
  const items = await res.json();
  return Array.isArray(items) ? items : [];
}
function commentText(c: any): string | null {
  for (const v of [c?.text, c?.commentText, c?.message, c?.comment]) if (typeof v === "string" && v.trim()) return v;
  return null;
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

    const { action = "start", kind = "video", id } = await req.json();
    if (!id) return json({ error: "id is required" }, 400);
    const c = KINDS[kind];
    if (!c) return json({ error: `Comments are not supported for "${kind}".` }, 400);

    const APIFY = Deno.env.get("APIFY_API_TOKEN");
    if (!APIFY) return json({ error: "APIFY_API_TOKEN is not configured" }, 500);

    const { data: item, error } = await supabase.from(c.table).select("*").eq("id", id).single();
    if (error || !item) return json({ error: error?.message ?? "Item not found" }, 404);

    // ── START: kick off the comments scrape ──────────────────────────────────
    if (action === "start") {
      const url = item[c.urlField];
      if (!url) return json({ error: "This item has no post URL to fetch comments from." }, 400);
      const runId = await apifyStart(APIFY, c.actor, c.input(url));
      await supabase.from(c.table).update({
        comments_apify_run_id: runId, comments_analysis_status: "running", comments_analysis_error: null,
      }).eq("id", id);
      return json({ status: "running" });
    }

    // ── POLL: check the run, and analyze once it succeeds ────────────────────
    const runId = item.comments_apify_run_id;
    if (!runId) return json({ status: "idle" });

    let st: { status: string; datasetId?: string };
    try { st = await apifyStatus(APIFY, runId); }
    catch { return json({ status: "running" }); }

    if (st.status === "FAILED" || st.status === "ABORTED" || st.status === "TIMED-OUT") {
      const msg = `Apify run ${st.status.toLowerCase()}`;
      await supabase.from(c.table).update({ comments_analysis_status: "failed", comments_analysis_error: msg }).eq("id", id);
      return json({ status: "failed", error: msg });
    }
    if (st.status !== "SUCCEEDED") return json({ status: "running" });

    try {
      if (!st.datasetId) throw new Error("Apify run missing dataset id");
      const raw = await apifyDataset(APIFY, st.datasetId);
      const texts = raw.map(commentText).filter((t): t is string => !!t).slice(0, MAX_COMMENTS);

      let analysis: any;
      if (texts.length < MIN_COMMENTS) {
        analysis = { insufficient_data: true, message: `Not enough comments to analyze (need at least ${MIN_COMMENTS}).`, comments_count: texts.length };
      } else {
        const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
        if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured");
        const label = kind === "instagram" ? "Instagram" : kind === "facebook" ? "Facebook" : "TikTok";
        const prompt = `Analyze these ${label} comments and report the audience response by calling the report_comments tool.

Rules:
- "common_questions" MUST contain the 3-5 most frequently asked / most representative audience questions, ranked by frequency. Never more than 5.
- "top_themes", "key_praise", "key_criticism" MUST each have at most 5 items.

Comments (${texts.length}):
${texts.map((t, i) => `${i + 1}. ${t.slice(0, 280)}`).join("\n")}`;
        // Claude first; falls back to Gemini if Anthropic stays rate-limited.
        const { result } = await analyzeStructured({
          anthropicKey: ANTHROPIC_API_KEY,
          system: "You are a social media audience-sentiment analyst. Report by calling the report_comments tool.",
          prompt,
          schema: COMMENTS_SCHEMA,
          toolName: "report_comments",
          toolDescription: "Report the structured comment analysis.",
        });
        analysis = result;
        if (!analysis) throw new Error("AI did not return a comment analysis");
      }

      await supabase.from(c.table).update({
        [c.commentCol]: analysis, comments_analysis_status: "completed", comments_analysis_error: null,
      }).eq("id", id);
      return json({ status: "completed", analysis });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await supabase.from(c.table).update({ comments_analysis_status: "failed", comments_analysis_error: msg.slice(0, 500) }).eq("id", id);
      return json({ status: "failed", error: msg });
    }
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
