import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.69.0";

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
    if (kind !== "video") return json({ error: `kind "${kind}" not yet supported in this build (video only).` }, 400);

    const { data: video, error } = await supabase.from("videos").select("*").eq("id", id).single();
    if (error || !video) return json({ error: error?.message ?? "Video not found" }, 404);

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) return json({ error: "ANTHROPIC_API_KEY is not configured" }, 500);
    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

    const userPrompt = `Analyze this TikTok video for what drives its performance.

Caption: ${video.caption ?? "(none)"}
Author: @${video.author_username ?? "unknown"} (${video.author_name ?? ""})
Hashtags: ${(video.hashtags ?? []).join(", ")}
Plays: ${video.plays}, Likes: ${video.likes}, Comments: ${video.comments_count}, Shares: ${video.shares}
Duration: ${video.duration_seconds ?? "?"}s`;

    let message;
    try {
      message = await anthropic.messages.create({
        model: "claude-haiku-4-5",
        max_tokens: 1024,
        system: "You are a TikTok virality analyst. Return your analysis by calling the report_analysis tool.",
        messages: [{ role: "user", content: userPrompt }],
        tools: [{ name: "report_analysis", description: "Report the structured virality analysis of the video.", input_schema: ANALYSIS_SCHEMA as any }],
        tool_choice: { type: "tool", name: "report_analysis" },
      });
    } catch (err: any) {
      if (err?.status === 429) return json({ error: "Rate limit exceeded. Please try again later." }, 429);
      return json({ error: `AI service error: ${err?.status ?? "unknown"}` }, 500);
    }

    const toolUse = message.content.find((b: any) => b.type === "tool_use");
    const analysis = toolUse?.input;
    if (!analysis) return json({ error: "AI did not return an analysis" }, 500);

    await supabase.from("videos")
      .update({ video_analysis: analysis, analysis_updated_at: new Date().toISOString() })
      .eq("id", video.id);

    return json({ analysis });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
