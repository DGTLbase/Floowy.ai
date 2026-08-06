import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { analyzeStructured } from "../_shared/ai-analyze.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ANALYSIS_SCHEMA = {
  type: "object",
  properties: {
    hook: { type: "string" },
    content_type: { type: "string" },
    themes: { type: "array", items: { type: "string" } },
    why_it_works: { type: "array", items: { type: "string" } },
    target_audience: { type: "string" },
    replication_tips: { type: "array", items: { type: "string" } },
    estimated_viral_factor: { type: "string", enum: ["low", "medium", "high"] },
  },
  required: ["hook", "content_type", "themes", "why_it_works", "target_audience", "replication_tips", "estimated_viral_factor"],
};

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

    const { kind = "video", id } = await req.json();
    if (!id) return json({ error: "id is required" }, 400);
    const TABLES: Record<string, string> = {
      video: "videos", instagram: "instagram_posts", facebook: "facebook_posts", ad: "ads", meta_ad: "meta_ads",
    };
    const table = TABLES[kind];
    if (!table) return json({ error: `kind "${kind}" not yet supported in this build.` }, 400);

    const { data: item, error } = await supabase.from(table).select("*").eq("id", id).single();
    if (error || !item) return json({ error: error?.message ?? "Item not found" }, 404);

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) return json({ error: "ANTHROPIC_API_KEY is not configured" }, 500);

    const list = (v: any) => (Array.isArray(v) ? v.join(", ") : "");
    let system = "You are a social media virality analyst. Return your analysis by calling the report_analysis tool.";
    let userPrompt: string;
    if (kind === "instagram") {
      system = "You are an Instagram virality analyst. Return your analysis by calling the report_analysis tool.";
      userPrompt = `Analyze this Instagram post for what drives its performance.

Caption: ${item.caption ?? "(none)"}
Owner: @${item.owner_username ?? "unknown"} (${item.owner_full_name ?? ""})
Hashtags: ${list(item.hashtags)}
Plays: ${item.plays ?? 0}, Likes: ${item.likes ?? 0}, Comments: ${item.comments_count ?? 0}
Type: ${item.product_type ?? "?"}`;
    } else if (kind === "facebook") {
      system = "You are a Facebook content performance analyst. Return your analysis by calling the report_analysis tool.";
      userPrompt = `Analyze this Facebook post for what drives its performance.

Page: ${item.page_name ?? "unknown"}
Text: ${item.text ?? "(none)"}
Reactions: ${item.reactions_count ?? 0}, Comments: ${item.comments_count ?? 0}, Shares: ${item.shares ?? 0}
Media type: ${item.media_type ?? "?"}`;
    } else if (kind === "ad") {
      system = "You are a TikTok ads performance analyst. Return your analysis by calling the report_analysis tool.";
      userPrompt = `Analyze this TikTok ad for what drives its performance.

Advertiser: ${item.advertiser_name ?? "unknown"}
Ad text: ${item.ad_text ?? "(none)"}
Source: ${item.source ?? "?"}, Ad type: ${item.ad_type ?? "?"}
Countries: ${list(item.countries)}
Impressions: ${item.impressions ?? "?"}, CTR: ${item.ctr ?? "?"}, Likes: ${item.likes ?? 0}
First shown: ${item.first_shown_date ?? "?"}, Last shown: ${item.last_shown_date ?? "?"}`;
    } else if (kind === "meta_ad") {
      system = "You are a Meta Ads performance analyst (Facebook + Instagram + Audience Network). Return your analysis by calling the report_analysis tool.";
      userPrompt = `Analyze this Meta ad for what drives its performance.

Advertiser: ${item.page_name ?? "unknown"}
Body: ${list(item.ad_creative_bodies) || "(none)"}
Link titles: ${list(item.ad_creative_link_titles)}
Platforms: ${list(item.platforms)}
Countries: ${list(item.countries)}
Run dates: ${item.start_date ?? "?"} → ${item.end_date ?? "?"}
CTA: ${item.cta_type ?? "?"}`;
    } else {
      system = "You are a TikTok virality analyst. Return your analysis by calling the report_analysis tool.";
      userPrompt = `Analyze this TikTok video for what drives its performance.

Caption: ${item.caption ?? "(none)"}
Author: @${item.author_username ?? "unknown"} (${item.author_name ?? ""})
Hashtags: ${list(item.hashtags)}
Plays: ${item.plays}, Likes: ${item.likes}, Comments: ${item.comments_count}, Shares: ${item.shares}
Duration: ${item.duration_seconds ?? "?"}s`;
    }

    let analysis: any;
    try {
      // Claude first; falls back to Gemini if Anthropic stays rate-limited.
      const { result } = await analyzeStructured({
        anthropicKey: ANTHROPIC_API_KEY,
        system,
        prompt: userPrompt,
        schema: ANALYSIS_SCHEMA,
        toolName: "report_analysis",
        toolDescription: "Report the structured virality analysis of the video.",
      });
      analysis = result;
    } catch (err: any) {
      if (err?.status === 429 || err?.status === 529) {
        return json({ error: "The AI service is busy right now. Please try those items again in a moment." }, 429);
      }
      return json({ error: `AI service error: ${err?.message ?? err?.status ?? "unknown"}` }, 500);
    }
    if (!analysis) return json({ error: "AI did not return an analysis" }, 500);

    const now = new Date().toISOString();
    let update: Record<string, unknown>;
    if (kind === "meta_ad") {
      update = { ad_analysis: analysis, analyzed_at: now, analysis_status: "completed" };
    } else if (kind === "instagram" || kind === "facebook") {
      update = { video_analysis: analysis, analyzed_at: now, analysis_status: "completed" };
    } else {
      // video, ad — these tables use analysis_updated_at (no analysis_status column).
      update = { video_analysis: analysis, analysis_updated_at: now };
    }
    await supabase.from(table).update(update).eq("id", item.id);

    return json({ analysis });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
