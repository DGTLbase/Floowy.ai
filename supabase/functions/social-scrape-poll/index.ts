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

// Live count of items scraped so far (for the in-progress progress bar). Cheap —
// reads the dataset metadata, not the items. Best-effort: returns 0 on any error.
async function apifyDatasetCount(token: string, datasetId: string): Promise<number> {
  try {
    const res = await fetch(`https://api.apify.com/v2/datasets/${encodeURIComponent(datasetId)}?token=${encodeURIComponent(token)}`);
    if (!res.ok) return 0;
    const j = await res.json();
    const c = j?.data?.itemCount;
    return typeof c === "number" && Number.isFinite(c) ? c : 0;
  } catch { return 0; }
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

// Map an apify~instagram-scraper item into an instagram_posts row.
function mapInstagramItem(it: any, ctx: { projectId: string; userId: string; scrapeRunId: string }): Record<string, unknown> {
  const str = (k: string): string | null => (typeof it?.[k] === "string" && it[k] ? it[k] : null);
  const num = (k: string): number | null => (typeof it?.[k] === "number" && Number.isFinite(it[k]) ? it[k] : null);

  const id = str("id") ?? str("shortCode") ?? str("shortcode");
  const url = str("url") ?? (str("shortCode") ? `https://www.instagram.com/p/${str("shortCode")}/` : null);
  const hashtags = Array.isArray(it?.hashtags) ? it.hashtags.filter((h: any) => typeof h === "string") : [];
  const duration = num("videoDuration") ?? num("duration");

  return {
    project_id: ctx.projectId,
    user_id: ctx.userId,
    scrape_run_id: ctx.scrapeRunId,
    ig_id: id,
    url,
    owner_username: str("ownerUsername") ?? str("owner_username"),
    owner_full_name: str("ownerFullName") ?? str("owner_full_name"),
    caption: str("caption") ?? str("text"),
    hashtags,
    likes: num("likesCount") ?? num("likes") ?? 0,
    comments_count: num("commentsCount") ?? num("comments") ?? 0,
    plays: num("videoPlayCount") ?? num("videoViewCount") ?? num("plays") ?? 0,
    video_url: str("videoUrl") ?? str("video_url"),
    thumbnail_url: str("displayUrl") ?? str("thumbnailUrl") ?? str("thumbnail_url"),
    duration_seconds: duration != null ? Math.round(duration) : null,
    posted_at: str("timestamp") ?? str("takenAtTimestamp") ?? str("posted_at"),
    product_type: str("productType") ?? str("type"),
    raw_data: it,
  };
}

// Map an apify facebook-posts item into a facebook_posts row.
function mapFacebookItem(it: any, ctx: { projectId: string; userId: string; scrapeRunId: string; mode: string }): Record<string, unknown> {
  const str = (k: string): string | null => (typeof it?.[k] === "string" && it[k] ? it[k] : null);
  const num = (k: string): number | null => (typeof it?.[k] === "number" && Number.isFinite(it[k]) ? it[k] : null);
  const author = it?.author ?? {};
  const oStr = (o: any, k: string): string | null => (typeof o?.[k] === "string" && o[k] ? o[k] : null);
  const tsIso = () => {
    const t = num("timestamp"); return t ? new Date(t < 1e12 ? t * 1000 : t).toISOString() : null;
  };
  return {
    project_id: ctx.projectId, user_id: ctx.userId, scrape_run_id: ctx.scrapeRunId,
    fb_id: str("postId") ?? str("id") ?? str("post_id") ?? str("topLevelUrl"),
    url: str("url") ?? str("postUrl") ?? str("topLevelUrl"),
    page_name: str("pageName") ?? str("user") ?? str("authorName") ?? oStr(author, "name"),
    page_url: str("pageUrl") ?? str("authorUrl") ?? oStr(author, "profileUrl"),
    page_id: str("pageId") ?? str("page_id") ?? oStr(author, "id"),
    text: str("text") ?? str("message") ?? str("caption") ?? str("postText"),
    reactions_count: num("likesCount") ?? num("reactions") ?? num("reactionsCount") ?? num("likes") ?? 0,
    comments_count: num("commentsCount") ?? num("comments") ?? 0,
    shares: num("sharesCount") ?? num("shares") ?? 0,
    posted_at: str("time") ?? str("publishedTime") ?? str("date") ?? str("timestamp") ?? tsIso(),
    media_type: str("type") ?? str("media_type"),
    media_url: str("media") ?? str("videoUrl") ?? str("photoUrl"),
    thumbnail_url: str("thumbnailUrl") ?? str("previewImage") ?? str("photoImage"),
    source: ctx.mode,
    raw_data: it,
  };
}

// Map a TikTok Ads Library item into an ads row.
function mapTikTokAdItem(it: any, ctx: { projectId: string; userId: string; scrapeRunId: string }): Record<string, unknown> {
  const str = (...ks: string[]): string | null => { for (const k of ks) if (typeof it?.[k] === "string" && it[k]) return it[k]; return null; };
  const num = (...ks: string[]): number | null => { for (const k of ks) if (typeof it?.[k] === "number" && Number.isFinite(it[k])) return it[k]; return null; };
  const arr = (...ks: string[]): string[] => { for (const k of ks) if (Array.isArray(it?.[k])) return it[k].filter((x: any) => typeof x === "string"); return []; };
  const dur = num("duration", "video_duration");
  return {
    project_id: ctx.projectId, user_id: ctx.userId, scrape_run_id: ctx.scrapeRunId,
    source: str("source"),
    ad_id: str("ad_id", "adId", "id", "creative_id", "creativeId"),
    ad_url: str("ad_url", "adUrl", "url", "library_url", "permalink"),
    video_url: str("video_url", "videoUrl", "webVideoUrl", "media_url"),
    thumbnail_url: str("thumbnail_url", "thumbnailUrl", "cover_url", "coverUrl", "image_url"),
    advertiser_name: str("advertiser_name", "advertiserName", "brand", "brand_name"),
    advertiser_business_id: str("advertiser_business_id", "advertiserBusinessId", "business_id"),
    ad_text: str("ad_text", "adText", "text", "caption", "description"),
    countries: arr("countries", "target_countries", "targetCountries"),
    search_term: str("search_term", "searchTerm", "query"),
    ad_type: str("ad_type", "adType", "format"),
    first_shown_date: str("first_shown_date", "firstShownDate", "first_shown_at", "startDate"),
    last_shown_date: str("last_shown_date", "lastShownDate", "last_shown_at", "endDate"),
    impressions: num("impressions", "impression_count", "reach", "reach_estimate"),
    duration_seconds: dur != null ? Math.round(dur) : null,
    ctr: num("ctr", "click_through_rate"),
    likes: num("likes", "like_count") ?? 0,
    raw_data: it,
  };
}

// Map a Meta (Facebook/Instagram) Ads Library item into a meta_ads row.
function mapMetaAdItem(it: any, ctx: { projectId: string; userId: string; scrapeRunId: string; searchTerm?: string }): Record<string, unknown> {
  const root = it ?? {};
  const snapshot = root.snapshot ?? {};
  const cards: any[] = Array.isArray(snapshot.cards) ? snapshot.cards : [];
  const aaa = root.aaa_info ?? root.aaaInfo ?? {};
  const pick = (...vals: any[]): string | null => { for (const v of vals) if (typeof v === "string" && v) return v; return null; };
  const clean = (s: any): string | null => (typeof s === "string" && s.trim() ? s.replace(/\{\{[^}]+\}\}/g, "").trim() || null : null);
  const tsToIso = (v: unknown): string | null => {
    const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
    if (!isFinite(n) || n <= 0) return typeof v === "string" && v ? v : null;
    return new Date(n < 1e12 ? n * 1000 : n).toISOString();
  };
  const bodies = [clean(snapshot?.body?.text), ...cards.map((c) => clean(c?.body))].filter(Boolean) as string[];
  const titles = cards.map((c) => clean(c?.title)).filter(Boolean) as string[];
  const descs = cards.map((c) => clean(c?.link_description)).filter(Boolean) as string[];
  const images = [...cards.map((c) => pick(c?.original_image_url, c?.resized_image_url)), ...(Array.isArray(snapshot.images) ? snapshot.images.map((i: any) => pick(i?.original_image_url, i?.resized_image_url)) : [])].filter(Boolean) as string[];
  const videos = [...cards.map((c) => pick(c?.video_hd_url, c?.video_sd_url)), ...(Array.isArray(snapshot.videos) ? snapshot.videos.map((v: any) => pick(v?.video_hd_url, v?.video_sd_url)) : [])].filter(Boolean) as string[];
  const countries = Array.isArray(aaa?.location_audience) ? aaa.location_audience.map((l: any) => l?.name).filter((x: any) => typeof x === "string") : (Array.isArray(root.countries) ? root.countries : []);
  const platforms = root.publisher_platform ?? root.publisher_platforms ?? root.platforms ?? snapshot.publisher_platform ?? [];
  const euReach = typeof aaa?.eu_total_reach === "number" ? Math.round(aaa.eu_total_reach) : null;
  return {
    project_id: ctx.projectId, user_id: ctx.userId, scrape_run_id: ctx.scrapeRunId,
    ad_archive_id: pick(root.ad_archive_id, root.adArchiveId, root.id),
    page_name: pick(root.page_name, root?.pageInfo?.page_name, snapshot?.page_name),
    page_id: pick(root.page_id, root?.pageInfo?.page_id, snapshot?.page_id),
    page_url: pick(root?.pageInfo?.page_profile_uri, root.page_url, snapshot?.page_profile_uri),
    ad_creative_bodies: bodies,
    ad_creative_link_titles: titles,
    ad_creative_link_descriptions: descs,
    ad_snapshot_url: pick(root.ad_library_url, root.url, root.ad_snapshot_url, snapshot?.ad_creative_link_captions?.[0]),
    platforms: Array.isArray(platforms) ? platforms.filter((x: any) => typeof x === "string") : (typeof platforms === "string" ? [platforms] : []),
    start_date: tsToIso(root.start_date ?? root.startDate ?? snapshot?.start_date),
    end_date: tsToIso(root.end_date ?? root.endDate ?? snapshot?.end_date),
    countries,
    impressions_lower: euReach, impressions_upper: euReach,
    spend_lower: null, spend_upper: null,
    currency: pick(root.currency, snapshot?.currency),
    cta_type: pick(cards[0]?.cta_type, snapshot?.cta_type),
    link_url: pick(cards[0]?.link_url, snapshot?.link_url),
    image_urls: images, video_urls: videos,
    search_term: ctx.searchTerm ?? null,
    raw_data: it,
  };
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

    const { runRowId, days, resultsPerPage } = await req.json();
    if (!runRowId) return json({ error: "runRowId is required" }, 400);

    const { data: runRow, error: rErr } = await supabase.from("scrape_runs").select("*").eq("id", runRowId).single();
    if (rErr || !runRow) return json({ error: rErr?.message ?? "Run not found" }, 404);

    if (runRow.status === "completed" || runRow.status === "failed") {
      return json({ status: runRow.status, videoCount: runRow.video_count ?? 0, error: runRow.error ?? null });
    }
    if (!runRow.apify_run_id) return json({ status: "running", videoCount: 0, scraped: 0, error: null });

    const APIFY = Deno.env.get("APIFY_API_TOKEN");
    if (!APIFY) return json({ error: "APIFY_API_TOKEN is not configured" }, 500);

    let st: { status: string; datasetId?: string };
    try { st = await apifyStatus(APIFY, runRow.apify_run_id); }
    catch (e) { return json({ status: "running", videoCount: 0, scraped: 0, error: null, note: String(e) }); }

    if (st.status === "FAILED" || st.status === "ABORTED" || st.status === "TIMED-OUT") {
      const msg = `Apify run ${st.status.toLowerCase()}`;
      await supabase.from("scrape_runs").update({ status: "failed", error: msg, completed_at: new Date().toISOString() }).eq("id", runRow.id);
      return json({ status: "failed", videoCount: 0, error: msg });
    }
    if (st.status !== "SUCCEEDED") {
      const scraped = st.datasetId ? await apifyDatasetCount(APIFY, st.datasetId) : 0;
      return json({ status: "running", videoCount: 0, scraped, error: null });
    }

    // Route ingestion by the project's platform + source type.
    const { data: project } = await supabase.from("projects").select("platform, source_type, usernames").eq("id", runRow.project_id).single();
    const platform = (project as any)?.platform ?? "tiktok";
    const sourceType = (project as any)?.source_type ?? "post";
    const fbMode = ((project as any)?.usernames ?? []).length > 0 ? "pages" : "search";

    try {
      if (!st.datasetId) throw new Error("Apify run missing dataset id");
      const raw = await apifyDataset(APIFY, st.datasetId);
      let count = 0;

      // Enforce the requested post count. Apify actors over-fetch (TikTok applies
      // resultsPerPage PER search query, and most actors return a few extra), so we
      // hard-cap what we ingest to the number the user set. `Infinity` = no cap when
      // the caller doesn't pass a count (backward-compatible).
      const cap = (typeof resultsPerPage === "number" && resultsPerPage > 0)
        ? Math.min(Math.floor(resultsPerPage), 1000)
        : Infinity;

      const ctx = { projectId: runRow.project_id, userId: user.id, scrapeRunId: runRow.id };
      if (platform === "instagram") {
        const rows = raw.map((it: any) => mapInstagramItem(it, ctx)).filter((r) => r.ig_id).slice(0, cap);
        if (rows.length > 0) {
          const { error } = await supabase.from("instagram_posts").upsert(rows, { onConflict: "project_id,ig_id", ignoreDuplicates: false });
          if (error) throw new Error(error.message);
        }
        count = rows.length;
      } else if (platform === "facebook") {
        const rows = raw.map((it: any) => mapFacebookItem(it, { ...ctx, mode: fbMode })).filter((r) => r.fb_id).slice(0, cap);
        if (rows.length > 0) {
          const { error } = await supabase.from("facebook_posts").upsert(rows, { onConflict: "project_id,fb_id", ignoreDuplicates: false });
          if (error) throw new Error(error.message);
        }
        count = rows.length;
      } else if (platform === "tiktok" && sourceType === "ad") {
        const rows = raw.map((it: any) => mapTikTokAdItem(it, ctx)).filter((r) => r.ad_id).slice(0, cap);
        if (rows.length > 0) {
          const { error } = await supabase.from("ads").upsert(rows, { onConflict: "project_id,ad_id", ignoreDuplicates: false });
          if (error) throw new Error(error.message);
        }
        count = rows.length;
      } else if (platform === "meta_ads") {
        const rows = raw.map((it: any) => mapMetaAdItem(it, ctx)).filter((r) => r.ad_archive_id).slice(0, cap);
        if (rows.length > 0) {
          const { error } = await supabase.from("meta_ads").upsert(rows, { onConflict: "project_id,ad_archive_id", ignoreDuplicates: false });
          if (error) throw new Error(error.message);
        }
        count = rows.length;
      } else {
        // TikTok posts ingest
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
        })).filter((r) => r.tiktok_id).slice(0, cap);
        if (rows.length > 0) {
          const { error } = await supabase.from("videos").upsert(rows, { onConflict: "project_id,tiktok_id", ignoreDuplicates: false });
          if (error) throw new Error(error.message);
        }
        count = rows.length;
      }

      await supabase.from("scrape_runs").update({ status: "completed", video_count: count, completed_at: new Date().toISOString(), error: null }).eq("id", runRow.id);
      return json({ status: "completed", videoCount: count, error: null });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await supabase.from("scrape_runs").update({ status: "failed", error: msg.slice(0, 1000), completed_at: new Date().toISOString() }).eq("id", runRow.id);
      return json({ status: "failed", videoCount: 0, error: msg });
    }
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
