import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getUserTier, isAdmin, tierMeets, tierDenied, scraperPlatformLimit } from "../_shared/tier.ts";

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

const IG_ACTOR = "apify~instagram-scraper";

// Kick off an Instagram post scrape on Apify; returns the run id. Hashtags,
// usernames and keywords (routed through hashtag search) become directUrls.
async function startInstagramScrape(token: string, input: {
  keywords: string[]; hashtags: string[]; usernames: string[];
  resultsLimit?: number; days?: 1 | 7 | 30;
}): Promise<string> {
  const directUrls: string[] = [];
  for (const tag of input.hashtags ?? []) {
    const t = tag.replace(/^#/, "").trim();
    if (t) directUrls.push(`https://www.instagram.com/explore/tags/${encodeURIComponent(t)}/`);
  }
  for (const user of input.usernames ?? []) {
    const u = user.replace(/^@/, "").trim();
    if (u) directUrls.push(`https://www.instagram.com/${encodeURIComponent(u)}/`);
  }
  for (const kw of input.keywords ?? []) {
    const t = kw.replace(/\s+/g, "").replace(/^#/, "").trim();
    if (t) directUrls.push(`https://www.instagram.com/explore/tags/${encodeURIComponent(t)}/`);
  }
  if (directUrls.length === 0) throw new Error("Provide at least one hashtag, keyword, or username for Instagram");

  const resultsLimit = Math.max(1, Math.min(input.resultsLimit ?? 30, 1000));
  let onlyPostsNewerThan: string | undefined;
  if (input.days) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - input.days);
    onlyPostsNewerThan = d.toISOString().slice(0, 10);
  }

  const body: Record<string, unknown> = { directUrls, resultsType: "posts", resultsLimit, addParentData: false };
  if (onlyPostsNewerThan) body.onlyPostsNewerThan = onlyPostsNewerThan;

  const res = await fetch(
    `https://api.apify.com/v2/acts/${IG_ACTOR}/runs?token=${encodeURIComponent(token)}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
  );
  if (!res.ok) throw new Error(`Apify IG start failed (${res.status}): ${(await res.text()).slice(0, 400)}`);
  const json = await res.json();
  const runId = json?.data?.id;
  if (!runId) throw new Error("Apify did not return a run id");
  return runId;
}

// ISO-2 country code → human name (used by the Facebook search actor + location).
const COUNTRY_LOCATIONS: Record<string, string> = {
  AT: "Austria", BE: "Belgium", DK: "Denmark", FR: "France", DE: "Germany",
  IE: "Ireland", IT: "Italy", LU: "Luxembourg", NL: "Netherlands", PL: "Poland",
  PT: "Portugal", ES: "Spain", CH: "Switzerland", GB: "United Kingdom", US: "United States",
};
// Normalise a UI country code to an Apify ISO-2 (UK→GB), or undefined for "all".
function normCountry(cc?: string): string | undefined {
  const c = (cc ?? "").trim().toUpperCase();
  if (!c || c === "ALL") return undefined;
  return c === "UK" ? "GB" : c;
}

const FB_PAGES_ACTOR = "apify~facebook-posts-scraper";
const FB_SEARCH_ACTOR = "scraper_one~facebook-posts-search";

// Kick off a Facebook post scrape. If page handles/URLs are provided it scrapes
// those pages; otherwise it runs a keyword search. Returns the run id.
async function startFacebookScrape(token: string, input: {
  keywords: string[]; usernames: string[]; resultsLimit?: number; days?: 1 | 7 | 30; countryCode?: string;
}): Promise<string> {
  const limit = Math.max(1, Math.min(input.resultsLimit ?? 30, 500));
  const cc = normCountry(input.countryCode);
  let newerThan: string | undefined;
  if (input.days) { const d = new Date(); d.setUTCDate(d.getUTCDate() - input.days); newerThan = d.toISOString().slice(0, 10); }

  const pages = (input.usernames ?? []).map((u) => u.trim()).filter(Boolean);
  let actor: string;
  let body: Record<string, unknown>;
  if (pages.length > 0) {
    const startUrls = pages.map((h) => ({
      url: /^https?:\/\//i.test(h) ? h : `https://www.facebook.com/${encodeURIComponent(h.replace(/^@/, ""))}`,
    }));
    actor = FB_PAGES_ACTOR;
    body = {
      startUrls, resultsLimit: limit, maxPosts: limit,
      proxyConfiguration: { useApifyProxy: true, ...(cc ? { apifyProxyCountry: cc } : {}) },
      ...(newerThan ? { onlyPostsNewerThan: newerThan } : {}),
    };
  } else {
    const query = (input.keywords ?? []).map((k) => k.trim()).filter(Boolean).join(" ");
    if (!query) throw new Error("Provide keywords or page handles for Facebook");
    actor = FB_SEARCH_ACTOR;
    body = {
      query, searchType: "latest", resultsCount: Math.min(limit, 200),
      ...(newerThan ? { startDate: newerThan } : {}),
      ...(cc ? { location: COUNTRY_LOCATIONS[cc] ?? cc } : {}),
    };
  }

  const res = await fetch(`https://api.apify.com/v2/acts/${actor}/runs?token=${encodeURIComponent(token)}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`Apify FB start failed (${res.status}): ${(await res.text()).slice(0, 400)}`);
  const j = await res.json();
  const runId = j?.data?.id;
  if (!runId) throw new Error("Apify did not return a run id");
  return runId;
}

const TIKTOK_ADS_ACTOR = "brilliant_gum~tiktok-ads-library-scraper";

// Kick off a TikTok Ads Library scrape by keyword / advertiser name. Returns the run id.
async function startTikTokAdsScrape(token: string, input: {
  keywords: string[]; usernames: string[]; maxResults?: number; countryCode?: string; dateFrom?: string; dateTo?: string;
}): Promise<string> {
  const searchTerms = [...(input.keywords ?? []), ...(input.usernames ?? [])]
    .map((s) => s.trim().replace(/^[@#]/, "")).filter(Boolean);
  if (searchTerms.length === 0) throw new Error("Provide keywords or advertiser names for TikTok ads");
  const cc = normCountry(input.countryCode);
  const body: Record<string, unknown> = {
    source: "both", adType: "ALL", searchTerms,
    maxResults: Math.max(1, Math.min(input.maxResults ?? 30, 3600)),
    ...(cc ? { countries: [cc] } : {}),
    ...(input.dateFrom ? { dateFrom: input.dateFrom } : {}),
    ...(input.dateTo ? { dateTo: input.dateTo } : {}),
  };
  const res = await fetch(`https://api.apify.com/v2/acts/${TIKTOK_ADS_ACTOR}/runs?token=${encodeURIComponent(token)}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`Apify TikTok-ads start failed (${res.status}): ${(await res.text()).slice(0, 400)}`);
  const j = await res.json();
  const runId = j?.data?.id;
  if (!runId) throw new Error("Apify did not return a run id");
  return runId;
}

const META_ADS_ACTOR = "curious_coder~facebook-ads-library-scraper";

function buildLibraryUrl(query: string, country: string): string {
  const params = new URLSearchParams({
    active_status: "all", ad_type: "all", country, q: query,
    search_type: "keyword_unordered", media_type: "all",
  });
  return `https://www.facebook.com/ads/library/?${params.toString()}`;
}

// Kick off a Meta (Facebook/Instagram) Ads Library scrape. Returns the run id.
async function startMetaAdsScrape(token: string, input: {
  keywords: string[]; usernames: string[]; count?: number; countryCode?: string; dateFrom?: string;
}): Promise<string> {
  const terms = [...(input.keywords ?? []), ...(input.usernames ?? [])]
    .map((s) => s.trim().replace(/^[@#]/, "")).filter(Boolean);
  if (terms.length === 0) throw new Error("Provide keywords or advertiser names for Meta ads");
  const cc = normCountry(input.countryCode) ?? "ALL";
  const urls = terms.map((q) => ({ url: buildLibraryUrl(q, cc) }));
  let period: string | undefined;
  if (input.dateFrom) {
    const days = Math.round((Date.now() - new Date(input.dateFrom).getTime()) / 86400000);
    if (days > 0) period = days <= 1 ? "last24h" : days <= 7 ? "last7d" : days <= 14 ? "last14d" : "last30d";
  }
  const body: Record<string, unknown> = {
    urls, count: Math.max(1, Math.min(input.count ?? 100, 5000)), scrapeAdDetails: true,
    "scrapePageAds.activeStatus": "all", "scrapePageAds.countryCode": cc,
    ...(period ? { "scrapePageAds.period": period } : {}),
  };
  const res = await fetch(`https://api.apify.com/v2/acts/${META_ADS_ACTOR}/runs?token=${encodeURIComponent(token)}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`Apify Meta-ads start failed (${res.status}): ${(await res.text()).slice(0, 400)}`);
  const j = await res.json();
  const runId = j?.data?.id;
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

    // Tier gate (Tier Briefing §2.1): Social Scraper is a Starter+ tool. Admins bypass.
    const admin = await isAdmin(supabase, user.id);
    const tier = await getUserTier(supabase, user.id);
    if (!admin && !tierMeets(tier, "starter")) return tierDenied("starter", corsHeaders);

    const { projectId, resultsPerPage = 30, days, countryCode, dateFrom, dateTo } = await req.json();
    if (!projectId) return json({ error: "projectId is required" }, 400);

    const { data: project, error: pErr } = await supabase.from("projects").select("*").eq("id", projectId).single();
    if (pErr || !project) return json({ error: pErr?.message ?? "Project not found" }, 404);

    const APIFY = Deno.env.get("APIFY_API_TOKEN");
    if (!APIFY) return json({ error: "APIFY_API_TOKEN is not configured" }, 500);

    const platform = (project as any).platform ?? "tiktok";

    // Starter platform limit: max N distinct platforms scraped per calendar month
    // (Starter = 1; Professional/Enterprise = unlimited). Admins bypass.
    // scrape_runs has no platform column — it lives on projects, joined here.
    const platformLimit = admin ? null : scraperPlatformLimit(tier);
    if (platformLimit !== null) {
      const monthStart = new Date();
      monthStart.setUTCDate(1);
      monthStart.setUTCHours(0, 0, 0, 0);
      const { data: monthRuns } = await supabase
        .from("scrape_runs")
        .select("projects(platform)")
        .eq("user_id", user.id)
        .gte("started_at", monthStart.toISOString());
      const usedPlatforms = new Set(
        (monthRuns ?? []).map((r: any) => r.projects?.platform).filter(Boolean),
      );
      if (!usedPlatforms.has(platform) && usedPlatforms.size >= platformLimit) {
        return tierDenied("professional", corsHeaders);
      }
    }
    const sourceType = (project as any).source_type ?? "post";
    const usernames = ((project as any).usernames ?? []).map((u: string) => u.replace(/^@/, ""));

    const kw = project.keywords ?? [];
    const ht = project.hashtags ?? [];
    let apifyRunId: string;
    if (platform === "tiktok" && sourceType === "ad") {
      apifyRunId = await startTikTokAdsScrape(APIFY, { keywords: kw, usernames, maxResults: resultsPerPage, countryCode, dateFrom, dateTo });
    } else if (platform === "tiktok") {
      apifyRunId = await startTikTokScrape(APIFY, { keywords: kw, hashtags: ht, usernames, resultsPerPage, days, countryCode });
    } else if (platform === "instagram") {
      apifyRunId = await startInstagramScrape(APIFY, { keywords: kw, hashtags: ht, usernames, resultsLimit: resultsPerPage, days });
    } else if (platform === "facebook") {
      apifyRunId = await startFacebookScrape(APIFY, { keywords: kw, usernames, resultsLimit: resultsPerPage, days, countryCode });
    } else if (platform === "meta_ads") {
      apifyRunId = await startMetaAdsScrape(APIFY, { keywords: kw, usernames, count: resultsPerPage, countryCode, dateFrom });
    } else {
      return json({ error: `Platform "${platform}/${sourceType}" is not yet supported in this build.` }, 400);
    }

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
