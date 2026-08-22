import { useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { tierMeets, canExportScraperReports } from "@/lib/tier-access";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, ArrowRight, Loader2, Plus, RefreshCw, Sparkles, MessagesSquare,
  ExternalLink, Trash2, Download, ArrowUpDown, ArrowUp, ArrowDown, Instagram, Facebook,
  Play, Heart, MessageCircle, Share2, Clock, ChevronDown, Lock, Square,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import ReportGenerator from "@/components/scraper/ReportGenerator";

// Brand glyphs lucide doesn't ship (monochrome, inherit currentColor).
const TikTokIcon = (p: any) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M16.5 3c.32 2.03 1.6 3.57 3.5 3.86V9.3c-1.3.03-2.53-.36-3.53-1.03v6.06a5.83 5.83 0 1 1-5.83-5.83c.29 0 .58.02.86.07v2.5a3.33 3.33 0 1 0 2.33 3.17V3h2.67z" /></svg>
);
const MetaIcon = (p: any) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M7 6C3.9 6 2 9.4 2 12s1.9 6 5 6c2.1 0 3.6-1.6 5-4 1.4 2.4 2.9 4 5 4 3.1 0 5-3.4 5-6s-1.9-6-5-6c-2.1 0-3.6 1.6-5 4-1.4-2.4-2.9-4-5-4Zm0 2.1c1.1 0 2.1 1.2 3.2 3.9-1.1 2.7-2.1 3.9-3.2 3.9C5.5 15.9 4.3 14 4.3 12S5.5 8.1 7 8.1Zm10 0c1.5 0 2.7 1.9 2.7 3.9s-1.2 3.9-2.7 3.9c-1.1 0-2.1-1.2-3.2-3.9 1.1-2.7 2.1-3.9 3.2-3.9Z" /></svg>
);
const PLATFORMS: { value: Platform; label: string; Icon: any; tile: string }[] = [
  { value: "tiktok", label: "TikTok", Icon: TikTokIcon, tile: "bg-foreground/10 text-foreground" },
  { value: "instagram", label: "Instagram", Icon: Instagram, tile: "bg-pink-500/15 text-pink-500" },
  { value: "facebook", label: "Facebook", Icon: Facebook, tile: "bg-blue-500/15 text-blue-600" },
  { value: "meta_ads", label: "Meta Ads", Icon: MetaIcon, tile: "bg-indigo-500/15 text-indigo-500" },
];
const PLATFORM_BY = Object.fromEntries(PLATFORMS.map((p) => [p.value, p])) as Record<Platform, typeof PLATFORMS[number]>;

// ── types ───────────────────────────────────────────────────────────────────
type Platform = "tiktok" | "instagram" | "facebook" | "meta_ads";
type SourceType = "post" | "ad";
type Project = {
  id: string; name: string; niche: string | null; keywords: string[]; hashtags: string[];
  usernames: string[]; platform: Platform; source_type: SourceType; created_at: string;
};
type Run = { id: string; status: string; video_count: number; error: string | null; started_at: string };
type Item = Record<string, any>;

const splitList = (s: string) => s.split(/[\n,]+/).map((x) => x.trim()).filter(Boolean);

const COUNTRIES: { code: string; name: string }[] = [
  { code: "all", name: "Worldwide" },
  { code: "AT", name: "Austria" }, { code: "BE", name: "Belgium" }, { code: "DK", name: "Denmark" },
  { code: "FR", name: "France" }, { code: "DE", name: "Germany" }, { code: "IE", name: "Ireland" },
  { code: "IT", name: "Italy" }, { code: "LU", name: "Luxembourg" }, { code: "NL", name: "Netherlands" },
  { code: "PL", name: "Poland" }, { code: "PT", name: "Portugal" }, { code: "ES", name: "Spain" },
  { code: "CH", name: "Switzerland" }, { code: "GB", name: "United Kingdom" }, { code: "US", name: "United States" },
];

// Resolve the table / analyze-kind / labels for a project's platform + source.
// itemNoun = the singular label for the content-analyze button (Video/Post/Ad).
// commentField = column holding comment analysis (null = no comments for this kind).
function cfgFor(platform: Platform, sourceType: SourceType) {
  if (platform === "tiktok" && sourceType === "ad")
    return { table: "ads", kind: "ad", label: "TikTok Ads", noun: "ads", itemNoun: "Ad", isAd: true, analysisField: "video_analysis", commentField: null as string | null };
  if (platform === "tiktok")
    return { table: "videos", kind: "video", label: "TikTok", noun: "videos", itemNoun: "Video", isAd: false, analysisField: "video_analysis", commentField: "comments_analysis" as string | null };
  if (platform === "instagram")
    return { table: "instagram_posts", kind: "instagram", label: "Instagram", noun: "posts", itemNoun: "Post", isAd: false, analysisField: "video_analysis", commentField: "comment_analysis" as string | null };
  if (platform === "facebook")
    return { table: "facebook_posts", kind: "facebook", label: "Facebook", noun: "posts", itemNoun: "Post", isAd: false, analysisField: "video_analysis", commentField: "comment_analysis" as string | null };
  return { table: "meta_ads", kind: "meta_ad", label: "Meta Ads", noun: "ads", itemNoun: "Ad", isAd: true, analysisField: "ad_analysis", commentField: null as string | null };
}

const fmt = (n: number | null | undefined) => {
  if (n == null) return "—";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
};
const fmtDate = (s: string | null | undefined) => {
  if (!s) return "—";
  const d = new Date(s);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};
const viralityScore = (it: Item) => {
  const v = ((it.likes ?? 0) + 2 * (it.comments_count ?? 0) + 3 * (it.shares ?? 0)) / Math.max(it.plays ?? 0, 1) * 1000;
  return Math.min(v, 100);
};

// Compact, icon-only metric column headers (module scope to avoid TDZ in render).
const IcnPlays = <Play className="h-4 w-4" />;
const IcnLikes = <Heart className="h-4 w-4" />;
const IcnComments = <MessageCircle className="h-4 w-4" />;
const IcnShares = <Share2 className="h-4 w-4" />;

export default function SocialScraper() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<string>("free");
  const [isAdmin, setIsAdmin] = useState(false);
  const [canExportReports, setCanExportReports] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selected, setSelected] = useState<Project | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [scraping, setScraping] = useState(false);
  // Live scrape-progress popup. `scraped`/`target` drive the real portion of the
  // bar; `tick` (a 1s counter) re-renders so the elapsed-time estimate advances
  // smoothly between the 5s polls.
  const [scrapeProg, setScrapeProg] = useState<{ scraped: number; target: number; status: "running" | "done" | "failed"; startedAt: number } | null>(null);
  const [, setTick] = useState(0);
  const [analyzing, setAnalyzing] = useState<Set<string>>(new Set());
  const [commentsBusy, setCommentsBusy] = useState<Set<string>>(new Set());
  const [queued, setQueued] = useState<Set<string>>(new Set());          // waiting in a bulk run
  const [bulk, setBulk] = useState<{ done: number; total: number } | null>(null);
  const [bulkKind, setBulkKind] = useState<"content" | "comments" | null>(null);
  const [stopping, setStopping] = useState(false);   // a bulk run is being stopped
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" }>({ key: "scraped_at", dir: "desc" });
  const [modal, setModal] = useState<{ title: string; data: any; loading?: boolean; loadingMsg?: string } | null>(null);
  const pollRef = useRef<number | null>(null);
  const aliveRef = useRef(true);   // false after unmount — stops in-flight poll loops
  // Serialises ALL content-analyze network calls (single clicks + bulk) so they
  // never fire concurrently and trip the AI provider's rate limit.
  const analyzeGate = useRef<Promise<any>>(Promise.resolve());
  // Set true to stop a bulk analyze/comments run. The runner checks it between
  // items (and the comments poll checks it) so the currently-running item finishes
  // but no further items start.
  const cancelBulkRef = useRef(false);

  // While a scrape runs, tick once a second so the progress bar's time-based
  // estimate keeps advancing smoothly between the (slower) status polls.
  useEffect(() => {
    if (scrapeProg?.status !== "running") return;
    const id = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, [scrapeProg?.status]);

  // create-form
  const [platform, setPlatform] = useState<Platform>("tiktok");
  const [sourceType, setSourceType] = useState<SourceType>("post");
  const [name, setName] = useState("");
  const [niche, setNiche] = useState("");
  const [keywords, setKeywords] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [usernames, setUsernames] = useState("");

  // scrape controls
  const [count, setCount] = useState(30);
  const [days, setDays] = useState<"1" | "7" | "30">("7");
  const [country, setCountry] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const cfg = selected ? cfgFor(selected.platform, selected.source_type) : null;

  const loadProjects = useCallback(async () => {
    const { data, error } = await supabase.from("projects").select("*").order("created_at", { ascending: false });
    if (error) toast({ title: "Failed to load projects", description: error.message, variant: "destructive" });
    else setProjects((data as Project[]) ?? []);
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { navigate("/auth"); return; }

      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id);
      const admin = !!roles?.some((r) => r.role === "admin");
      setIsAdmin(admin);

      // Tier gate (Tier Briefing §2.1): Social Scraper is a Starter+ tool.
      // Report/export generation is Professional+ only (set below).
      const { data: profile } = await supabase.from("profiles").select("plan").eq("id", session.user.id).maybeSingle();
      const plan = (profile?.plan || "free").toLowerCase();
      setUserPlan(plan);
      setCanExportReports(admin || canExportScraperReports(plan));

      const allowed = admin || tierMeets(plan, "starter");
      if (!allowed) { navigate("/payment"); return; }
      setUserId(session.user.id);
      loadProjects();
    })();
    return () => {
      aliveRef.current = false;
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, [loadProjects, navigate]);

  const loadItems = useCallback(async (project: Project) => {
    const c = cfgFor(project.platform, project.source_type);
    const { data, error } = await supabase.from(c.table).select("*").eq("project_id", project.id)
      .order("scraped_at", { ascending: false }).limit(500);
    if (error) { toast({ title: "Failed to load results", description: error.message, variant: "destructive" }); return; }
    setItems((data as Item[]) ?? []);
  }, [toast]);

  const loadRuns = useCallback(async (projectId: string) => {
    const { data } = await supabase.from("scrape_runs").select("*").eq("project_id", projectId)
      .order("started_at", { ascending: false }).limit(5);
    setRuns((data as Run[]) ?? []);
  }, []);

  const openProject = async (p: Project) => {
    setSelected(p); setItems([]); setSelectedIds(new Set()); setSort({ key: "scraped_at", dir: "desc" });
    await Promise.all([loadItems(p), loadRuns(p.id)]);
  };

  const onPlatformChange = (p: Platform) => {
    setPlatform(p);
    if (p === "meta_ads") setSourceType("ad");
    else if (p === "instagram" || p === "facebook") setSourceType("post");
    else setSourceType("post");
  };

  const createProject = async () => {
    if (!name.trim()) { toast({ title: "Name is required", variant: "destructive" }); return; }
    if (!userId) { toast({ title: "Not signed in", variant: "destructive" }); return; }
    setCreating(true);
    const { data, error } = await supabase.from("projects").insert({
      user_id: userId, name: name.trim(), niche: niche.trim() || null,
      keywords: splitList(keywords), hashtags: splitList(hashtags),
      usernames: splitList(usernames).map((u) => u.replace(/^[@#]/, "")),
      platform, source_type: sourceType,
    }).select().single();
    setCreating(false);
    if (error) { toast({ title: "Failed to create project", description: error.message, variant: "destructive" }); return; }
    setName(""); setNiche(""); setKeywords(""); setHashtags(""); setUsernames("");
    setCreateOpen(false);
    await loadProjects();
    toast({ title: "Project created" });
    openProject(data as Project);
  };

  const deleteProject = async (id: string) => {
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) { toast({ title: "Delete failed", description: error.message, variant: "destructive" }); return; }
    if (selected?.id === id) setSelected(null);
    loadProjects();
  };

  const runScrape = async () => {
    if (!selected || !cfg) return;
    setScraping(true);
    setScrapeProg({ scraped: 0, target: count, status: "running", startedAt: Date.now() });
    const body: Record<string, unknown> = { projectId: selected.id, resultsPerPage: count };
    if (country !== "all") body.countryCode = country;
    if (cfg.isAd) { if (dateFrom) body.dateFrom = dateFrom; if (dateTo) body.dateTo = dateTo; }
    else body.days = Number(days);
    const { data, error } = await supabase.functions.invoke("social-scrape", { body });
    if (error || data?.error) {
      setScraping(false);
      setScrapeProg((s) => (s ? { ...s, status: "failed" } : s));
      const msg = await invokeError(error, data);
      // A 402 carries the "insufficient credits" prompt from the backend.
      const lowCredits = /not enough credits/i.test(msg);
      toast({
        title: lowCredits ? "Not enough credits" : "Scrape failed to start",
        description: msg,
        variant: "destructive",
      });
      return;
    }
    const runRowId = data.runId as string;
    pollRef.current = window.setInterval(async () => {
      const { data: p } = await supabase.functions.invoke("social-scrape-poll", { body: { runRowId, resultsPerPage: count } });
      // Live count while running — feeds the real portion of the progress bar.
      if (p?.status === "running" && typeof p.scraped === "number") {
        setScrapeProg((s) => (s ? { ...s, scraped: Math.max(s.scraped, p.scraped) } : s));
      }
      if (p?.status === "completed" || p?.status === "failed") {
        if (pollRef.current) window.clearInterval(pollRef.current);
        setScraping(false);
        loadRuns(selected.id);
        if (p.status === "completed") {
          setScrapeProg((s) => (s ? { ...s, scraped: p.videoCount ?? s.scraped, status: "done" } : s));
          toast({ title: "Scrape complete", description: `${p.videoCount} ${cfg.noun} ingested` });
          loadItems(selected);
        } else {
          setScrapeProg((s) => (s ? { ...s, status: "failed" } : s));
          toast({ title: "Scrape failed", description: p.error ?? "Unknown error", variant: "destructive" });
        }
      }
    }, 5000);
  };

  const getAnalysis = (it: Item) => (cfg ? it[cfg.analysisField] : null);

  // Pull the REAL server error from a supabase.functions.invoke result. On a
  // non-2xx the body is inside the FunctionsHttpError's `context` Response, not in
  // `data` — without this the UI only ever shows the generic "edge function
  // returned a non-2xx status" and the actual reason is lost.
  const invokeError = async (error: any, data: any): Promise<string> => {
    if (data?.error) return String(data.error);
    const ctx = error?.context;
    if (ctx && typeof ctx.clone === "function") {
      try { const b = await ctx.clone().json(); if (b?.error) return String(b.error); } catch { /* not json */ }
      try { const t = await ctx.clone().text(); if (t) return t.slice(0, 400); } catch { /* ignore */ }
    }
    return error?.message ?? "Unknown error";
  };

  const analyzeItem = async (it: Item, forceRerun = false) => {
    if (!cfg) return;
    const existing = getAnalysis(it);
    if (existing && !forceRerun) { setModal({ title: primaryText(it), data: existing }); return; }
    setAnalyzing((s) => new Set(s).add(it.id));
    // Only pop the live-progress modal for a single click, not the bulk run.
    if (!forceRerun) setModal({ title: primaryText(it), data: null, loading: true, loadingMsg: `Analyzing this ${cfg.itemNoun.toLowerCase()}…` });
    const call = () => supabase.functions.invoke("social-analyze", { body: { kind: cfg.kind, id: it.id } });
    const run = analyzeGate.current.then(call, call);   // wait for the prior analyze to settle
    analyzeGate.current = run.then(() => {}, () => {});
    const { data, error } = await run;
    setAnalyzing((s) => { const n = new Set(s); n.delete(it.id); return n; });
    if (error || data?.error) {
      const msg = await invokeError(error, data);
      console.error("[social-analyze] failed:", msg);   // visible even during a bulk run
      // Stay quiet during a bulk run — analyzeSelected shows one summary toast.
      if (!forceRerun) { setModal(null); toast({ title: "Analysis failed", description: msg, variant: "destructive" }); }
      return false;
    }
    setItems((prev) => prev.map((x) => (x.id === it.id ? { ...x, [cfg.analysisField]: data.analysis } : x)));
    if (!forceRerun) setModal({ title: primaryText(it), data: data.analysis });
    return true;
  };

  // Shared sequential bulk runner: shows a "Queued" state on every target, flips
  // each to a spinner as it runs, then ✓ — so progress is visible across ALL
  // selected posts. Sequential (concurrent calls tripped the AI rate limit), and
  // for the AI-analysis path additionally SPACED (throttle between calls) with a
  // one-time backoff retry, so a burst stays under the provider's requests/minute
  // limit instead of failing items with a 429.
  const AI_THROTTLE_MS = 900;   // gap between consecutive AI-analysis calls
  const AI_RETRY_MS = 2500;     // backoff before a single retry of a failed AI call
  const runBulk = async (
    kind: "content" | "comments",
    targets: Item[],
    run: (it: Item) => Promise<boolean>,
    noun: string,
  ) => {
    if (targets.length === 0) return;
    cancelBulkRef.current = false;
    setStopping(false);
    setBulkKind(kind);
    setQueued(new Set(targets.map((t) => t.id)));
    setBulk({ done: 0, total: targets.length });
    const throttled = kind === "content"; // the rate-limited AI path
    let ok = 0;
    let processed = 0;
    for (let i = 0; i < targets.length; i++) {
      if (cancelBulkRef.current) break;   // stopped — leave the rest un-run
      const it = targets[i];
      processed++;
      let success = await run(it);
      // A failed AI analysis is almost always a transient rate-limit — wait out
      // the window and retry once before giving up on this item (unless stopped).
      if (!success && throttled && !cancelBulkRef.current) { await sleep(AI_RETRY_MS); success = await run(it); }
      if (success) ok++;
      setQueued((prev) => { const n = new Set(prev); n.delete(it.id); return n; });
      setBulk((b) => (b ? { ...b, done: b.done + 1 } : b));
      // Space out the next call so the queue stays under the rate limit.
      if (throttled && i < targets.length - 1 && !cancelBulkRef.current) await sleep(AI_THROTTLE_MS);
    }
    const stopped = cancelBulkRef.current;
    cancelBulkRef.current = false;
    setStopping(false);
    setQueued(new Set());
    setBulk(null);
    setBulkKind(null);
    setSelectedIds(new Set());
    const failed = processed - ok;
    toast({
      title: stopped ? `Stopped — ${ok}/${targets.length} ${noun.toLowerCase()} analyzed` : `${noun} analyzed ${ok}/${targets.length}`,
      description: stopped
        ? `${targets.length - processed} not started. Select any remaining and run again when ready.`
        : failed ? `${failed} didn't finish — select those and try again in a moment.` : "All selected items analyzed.",
      variant: failed && !stopped ? "destructive" : undefined,
    });
  };

  // Stop an in-progress bulk analyze/comments run: the current item finishes, no
  // further items start.
  const stopBulk = () => { cancelBulkRef.current = true; setStopping(true); };

  const analyzeSelected = () =>
    runBulk("content", items.filter((it) => selectedIds.has(it.id) && !getAnalysis(it)), (it) => analyzeItem(it, true) as Promise<boolean>, cfg?.itemNoun ?? "Item");

  const analyzeCommentsSelected = () => {
    if (!cfg?.commentField) return;
    runBulk("comments", items.filter((it) => selectedIds.has(it.id) && !getComments(it)), (it) => runComments(it, true), "Comments");
  };

  const getComments = (it: Item) => (cfg?.commentField ? it[cfg.commentField] : null);
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  // Awaitable comments analysis: starts an Apify comments run, then polls until it
  // is written back. Resolves true on success. `silent` suppresses toasts/modal so
  // it can be driven from the bulk runner.
  const runComments = async (it: Item, silent = false): Promise<boolean> => {
    if (!cfg?.commentField) return false;
    setCommentsBusy((s) => new Set(s).add(it.id));
    try {
      const { data, error } = await supabase.functions.invoke("social-comments", { body: { action: "start", kind: cfg.kind, id: it.id } });
      if (error || data?.error) {
        if (!silent) toast({ title: "Comments analysis failed to start", description: data?.error ?? error?.message, variant: "destructive" });
        return false;
      }
      if (!silent) setModal({ title: `Comments · ${primaryText(it)}`, data: null, loading: true, loadingMsg: "Fetching and analyzing comments… this can take 1–3 minutes." });
      for (let i = 0; i < 60 && aliveRef.current; i++) {   // ~5 min at 5s
        if (cancelBulkRef.current) return false;   // bulk run was stopped
        await sleep(5000);
        if (cancelBulkRef.current) return false;
        const { data: p } = await supabase.functions.invoke("social-comments", { body: { action: "poll", kind: cfg.kind, id: it.id } });
        if (p?.status === "completed") {
          setItems((prev) => prev.map((x) => (x.id === it.id ? { ...x, [cfg.commentField!]: p.analysis } : x)));
          if (!silent) setModal({ title: `Comments · ${primaryText(it)}`, data: p.analysis });
          return true;
        }
        if (p?.status === "failed") {
          if (!silent) { setModal(null); toast({ title: "Comments analysis failed", description: p.error ?? "Unknown error", variant: "destructive" }); }
          return false;
        }
      }
      if (!silent) { setModal(null); toast({ title: "Comments timed out", description: "Please try again in a moment.", variant: "destructive" }); }
      return false;
    } finally {
      setCommentsBusy((s) => { const n = new Set(s); n.delete(it.id); return n; });
    }
  };

  // Single-row comments button: view if already analyzed, else run it.
  const commentsClick = async (it: Item, forceRerun = false) => {
    if (!cfg?.commentField) return;
    const existing = getComments(it);
    if (existing && !forceRerun) { setModal({ title: `Comments · ${primaryText(it)}`, data: existing }); return; }
    await runComments(it, false);
  };

  // ── per-platform primary cell + columns ────────────────────────────────────
  const primaryText = (it: Item): string => {
    if (!cfg) return "";
    if (cfg.table === "videos" || cfg.table === "instagram_posts") return it.caption ?? "";
    if (cfg.table === "facebook_posts") return it.text ?? "";
    if (cfg.table === "ads") return it.ad_text ?? "";
    return (it.ad_creative_bodies ?? [])[0] ?? "";
  };
  const primaryThumb = (it: Item): string | null => {
    if (!cfg) return null;
    if (cfg.table === "meta_ads") return (it.image_urls ?? [])[0] ?? null;
    if (cfg.table === "facebook_posts") return it.thumbnail_url ?? it.media_url ?? null;
    return it.thumbnail_url ?? null;
  };
  const primaryLink = (it: Item): string | null => {
    if (!cfg) return null;
    if (cfg.table === "videos") return it.tiktok_url ?? null;
    if (cfg.table === "ads") return it.ad_url ?? it.video_url ?? null;
    if (cfg.table === "instagram_posts") return it.url ?? it.video_url ?? null;
    if (cfg.table === "facebook_posts") return it.url ?? it.media_url ?? null;
    return it.ad_snapshot_url ?? null;
  };

  const num = (v: any) => (typeof v === "number" ? v : 0);
  const sortVal = (it: Item, key: string) => {
    if (key === "virality") return viralityScore(it);
    const v = it[key];
    if (typeof v === "number") return v;
    if (typeof v === "string") { const t = Date.parse(v); return isNaN(t) ? v.toLowerCase() : t; }
    return 0;
  };
  const sortedItems = [...items].sort((a, b) => {
    const av = sortVal(a, sort.key), bv = sortVal(b, sort.key);
    const r = av < bv ? -1 : av > bv ? 1 : 0;
    return sort.dir === "asc" ? r : -r;
  });
  const toggleSort = (key: string) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" }));

  const SortHead = ({ label, k, right, icon }: { label: string; k: string; right?: boolean; icon?: ReactNode }) => (
    <TableHead className={`${right ? "text-right" : ""} ${icon ? "px-2" : ""}`}>
      <button title={label} aria-label={label}
        className={`inline-flex items-center gap-1 ${right ? "justify-end w-full" : ""} ${sort.key === k ? "text-foreground" : "text-muted-foreground"}`}
        onClick={() => toggleSort(k)}>
        {icon ?? label}
        {sort.key !== k ? <ArrowUpDown className="h-3 w-3 opacity-70" /> : sort.dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
      </button>
    </TableHead>
  );

  const analyzedCount = cfg ? items.filter((it) => getAnalysis(it)).length : 0;
  const allSelected = items.length > 0 && items.every((it) => selectedIds.has(it.id));
  const toggleAll = () => setSelectedIds(allSelected ? new Set() : new Set(items.map((it) => it.id)));
  const toggleOne = (id: string) => setSelectedIds((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const exportAnalyses = (asJson: boolean) => {
    if (!cfg) return;
    const rows = items.filter((it) => (selectedIds.size ? selectedIds.has(it.id) : true) && getAnalysis(it))
      .map((it) => ({ title: primaryText(it).slice(0, 200), updated_at: it.analyzed_at ?? it.analysis_updated_at ?? "", analysis: getAnalysis(it) }));
    if (rows.length === 0) { toast({ title: "Nothing to export", description: "Analyze some items first." }); return; }
    let blob: Blob, ext: string;
    if (asJson) { blob = new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" }); ext = "json"; }
    else {
      const esc = (s: string) => `"${String(s).replace(/"/g, '""')}"`;
      const csv = ["title,updated_at,analysis_json", ...rows.map((r) => [esc(r.title), esc(r.updated_at), esc(JSON.stringify(r.analysis))].join(","))].join("\n");
      blob = new Blob([csv], { type: "text/csv" }); ext = "csv";
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${selected?.name ?? "analyses"}_${cfg.noun}.${ext}`; a.click();
    URL.revokeObjectURL(url);
  };

  // ── create form field visibility ───────────────────────────────────────────
  const showHashtags = (platform === "tiktok" && sourceType === "post") || platform === "instagram";
  const showUsernames = platform !== "meta_ads";
  const usernameLabel =
    platform === "facebook" ? "Page URLs or handles"
      : platform === "instagram" ? "Instagram usernames"
        : sourceType === "ad" ? "Advertiser names" : "Account usernames";
  const helper =
    platform === "tiktok" && sourceType === "ad" ? "Scrapes TikTok ads matching your keywords / advertiser names."
      : platform === "tiktok" ? "Scrapes TikTok posts matching keywords, hashtags, or accounts."
        : platform === "instagram" ? "Scrapes Instagram posts by hashtag, keyword (as tag), or account."
          : platform === "facebook" ? "Scrapes Facebook posts. With page URLs/handles it scrapes those pages; otherwise a keyword search."
            : "Scrapes the Meta Ads Library (Facebook + Instagram) by keyword or advertiser.";

  const showDays = cfg && !cfg.isAd;
  const showCountry = selected && (selected.platform === "tiktok" || selected.platform === "meta_ads" || selected.platform === "facebook");
  const showDateRange = cfg && cfg.isAd;

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 md:p-8 w-full space-y-6">
      <div className="flex items-center gap-3">
        {selected ? (
          <Button variant="ghost" size="sm" onClick={() => setSelected(null)}><ArrowLeft className="w-4 h-4 mr-1" /> Projects</Button>
        ) : (
          <Link to="/home"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> Tools</Button></Link>
        )}
        <h1 className="text-2xl font-bold tracking-tight">Social Scraper</h1>
      </div>

      {/* ============================ DASHBOARD ============================ */}
      {!selected && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Find and analyze top-performing content across TikTok, Instagram, Facebook & ad libraries.</p>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> New project</Button></DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create a project</DialogTitle>
                  <DialogDescription>Pick a platform and the keywords, hashtags or accounts to track.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Platform</label>
                    <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {PLATFORMS.map(({ value, label, Icon }) => (
                        <button key={value} type="button" onClick={() => onPlatformChange(value)}
                          className={`flex flex-col items-center gap-2 rounded-lg border p-3 transition ${platform === value ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:bg-muted/50"}`}>
                          <Icon className="h-6 w-6" />
                          <span className="text-xs font-medium">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  {platform === "tiktok" && (
                    <div>
                      <label className="text-sm font-medium">Source</label>
                      <div className="mt-2 flex gap-2">
                        {(["post", "ad"] as const).map((s) => (
                          <Button key={s} type="button" size="sm" variant={sourceType === s ? "default" : "outline"} onClick={() => setSourceType(s)}>
                            {s === "post" ? "Posts" : "Ads"}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">{helper}</p>
                  <div><label className="text-sm font-medium">Project name</label><Input className="mt-1" placeholder="e.g. Fitness creators Q4" value={name} onChange={(e) => setName(e.target.value)} /></div>
                  <div><label className="text-sm font-medium">Niche <span className="text-muted-foreground font-normal">(optional)</span></label><Input className="mt-1" placeholder="e.g. Home workouts" value={niche} onChange={(e) => setNiche(e.target.value)} /></div>
                  <div><label className="text-sm font-medium">Keywords</label><Textarea className="mt-1" rows={2} placeholder="comma or newline separated" value={keywords} onChange={(e) => setKeywords(e.target.value)} /></div>
                  {showHashtags && <div><label className="text-sm font-medium">Hashtags</label><Textarea className="mt-1" rows={2} placeholder="comma or newline separated" value={hashtags} onChange={(e) => setHashtags(e.target.value)} /></div>}
                  {showUsernames && <div><label className="text-sm font-medium">{usernameLabel}</label><Textarea className="mt-1" rows={2} placeholder="comma or newline separated" value={usernames} onChange={(e) => setUsernames(e.target.value)} /></div>}
                </div>
                <DialogFooter>
                  <Button onClick={createProject} disabled={creating}>
                    {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />} Create project
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
          ) : projects.length === 0 ? (
            <Card><CardContent className="p-10 text-center text-sm text-muted-foreground">No projects yet. Create one to start scraping.</CardContent></Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((p) => {
                const c = cfgFor(p.platform, p.source_type);
                const style = PLATFORM_BY[p.platform] ?? PLATFORM_BY.tiktok;
                const targets = [
                  ...(p.keywords ?? []).map((t) => t),
                  ...(p.hashtags ?? []).map((t) => `#${t}`),
                  ...(p.usernames ?? []).map((t) => `@${t}`),
                ];
                const shown = targets.slice(0, 4);
                const extra = targets.length - shown.length;
                return (
                  <Card key={p.id} onClick={() => openProject(p)}
                    className="group relative cursor-pointer transition hover:border-primary/40 hover:shadow-md">
                    <button aria-label="Delete project"
                      className="absolute right-2.5 top-2.5 z-10 rounded-md p-1 text-muted-foreground opacity-0 transition hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                      onClick={(e) => { e.stopPropagation(); deleteProject(p.id); }}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${style.tile}`}>
                          <style.Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1 pr-5">
                          <p className="truncate font-semibold leading-tight">{p.name}</p>
                          <div className="mt-1 flex items-center gap-1.5">
                            <span className="text-xs text-muted-foreground">{c.label}</span>
                            {c.isAd && <Badge variant="destructive" className="px-1.5 py-0 text-[10px] leading-4">Ads</Badge>}
                          </div>
                          {p.niche ? <p className="mt-1 truncate text-xs text-muted-foreground">{p.niche}</p> : null}
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {shown.length === 0 ? (
                          <span className="text-xs italic text-muted-foreground">No targets set</span>
                        ) : (
                          <>
                            {shown.map((t) => <Badge key={t} variant="secondary" className="max-w-[9rem] truncate font-normal">{t}</Badge>)}
                            {extra > 0 && <Badge variant="outline" className="font-normal">+{extra}</Badge>}
                          </>
                        )}
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                        <span>{new Date(p.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
                        <span className="inline-flex items-center gap-1 font-medium text-primary transition-all group-hover:gap-2">
                          Open <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ============================ PROJECT DETAIL ============================ */}
      {selected && cfg && (
        <>
          <button className="text-xs text-muted-foreground inline-flex items-center gap-1" onClick={() => setSelected(null)}>
            <ArrowLeft className="h-3 w-3" /> Back to projects
          </button>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">{selected.name}</h2>
              {selected.niche ? <p className="text-sm text-muted-foreground">{selected.niche}</p> : null}
              <div className="mt-2 flex flex-wrap gap-1">
                <Badge variant={cfg.isAd ? "destructive" : "default"}>{cfg.label}</Badge>
                {(selected.keywords ?? []).map((k) => <Badge key={k} variant="secondary">{k}</Badge>)}
                {(selected.hashtags ?? []).map((h) => <Badge key={h}>#{h}</Badge>)}
                {(selected.usernames ?? []).map((u) => <Badge key={u} variant="outline">@{u}</Badge>)}
              </div>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <div>
                <label className="block text-xs text-muted-foreground">{cfg.isAd ? "Max ads" : `${cfg.noun} to scrape`} <span className="text-muted-foreground/70">(max 200)</span></label>
                <Input type="number" min={1} max={200} className="w-28" value={count} disabled={scraping} onChange={(e) => setCount(Math.min(200, Math.max(1, Number(e.target.value) || 1)))} />
                <p className="mt-1 text-[11px] text-muted-foreground">≈ {Math.ceil(count / 10)} credit{Math.ceil(count / 10) === 1 ? "" : "s"} · 1 per 10</p>
              </div>
              {showDays && (
                <div>
                  <label className="block text-xs text-muted-foreground">Posted within</label>
                  <Select value={days} onValueChange={(v) => setDays(v as any)} disabled={scraping}>
                    <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Last 24 hours</SelectItem>
                      <SelectItem value="7">Last 7 days</SelectItem>
                      <SelectItem value="30">Last 30 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              {showCountry && (
                <div>
                  <label className="block text-xs text-muted-foreground">Country</label>
                  <Select value={country} onValueChange={setCountry} disabled={scraping}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>{COUNTRIES.map((c) => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              {showDateRange && (
                <>
                  <div><label className="block text-xs text-muted-foreground">Date from</label><Input type="date" className="w-40" value={dateFrom} disabled={scraping} onChange={(e) => setDateFrom(e.target.value)} /></div>
                  <div><label className="block text-xs text-muted-foreground">Date to</label><Input type="date" className="w-40" value={dateTo} disabled={scraping} onChange={(e) => setDateTo(e.target.value)} /></div>
                </>
              )}
              <Button onClick={runScrape} disabled={scraping}>
                <RefreshCw className={`mr-2 h-4 w-4 ${scraping ? "animate-spin" : ""}`} />
                {scraping ? "Scraping…" : "Run scrape"}
              </Button>
            </div>
          </div>

          {/* stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat label={cfg.noun[0].toUpperCase() + cfg.noun.slice(1)} value={String(items.length)} />
            {cfg.table === "meta_ads" ? (
              <Stat label="Active now" value={String(items.filter((it) => !it.end_date || new Date(it.end_date) > new Date()).length)} />
            ) : cfg.isAd ? (
              <Stat label="Total impressions" value={fmt(items.reduce((s, it) => s + num(it.impressions), 0))} />
            ) : cfg.table === "facebook_posts" ? (
              <Stat label="Total reactions" value={fmt(items.reduce((s, it) => s + num(it.reactions_count), 0))} />
            ) : (
              <Stat label="Total plays" value={fmt(items.reduce((s, it) => s + num(it.plays), 0))} />
            )}
            <Stat label="Analyzed" value={`${analyzedCount}/${items.length}`} />
          </div>

          {/* recent runs */}
          {runs.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Recent runs</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {runs.map((r) => (
                    <div key={r.id} className="flex items-center justify-between border-b border-border py-2 last:border-0">
                      <div>
                        <Badge variant={r.status === "completed" ? "default" : r.status === "failed" ? "destructive" : "secondary"}>{r.status}</Badge>
                        <span className="ml-3 text-muted-foreground">{new Date(r.started_at).toLocaleString()}</span>
                      </div>
                      <div className="text-muted-foreground">{r.video_count} {cfg.noun}{r.error ? ` · ${r.error.slice(0, 80)}` : ""}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* results table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
              <CardTitle className="text-base">{cfg.label} · {items.length} {cfg.noun}</CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                {bulk ? (
                  <div className="inline-flex items-center gap-2">
                    <span className="text-xs font-medium text-primary inline-flex items-center gap-1">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Analyzing {bulkKind === "comments" ? "comments " : ""}{bulk.done}/{bulk.total}…
                    </span>
                    <Button size="sm" variant="outline" className="h-7 border-destructive/40 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={stopBulk} disabled={stopping}>
                      <Square className="mr-1 h-3 w-3 fill-current" /> {stopping ? "Stopping…" : "Stop"}
                    </Button>
                  </div>
                ) : selectedIds.size > 0 ? (
                  <span className="text-xs text-muted-foreground">{selectedIds.size} selected</span>
                ) : null}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline" disabled={selectedIds.size === 0 || !!bulk}>
                      {bulk ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-1 h-3.5 w-3.5" />}
                      Analyze Selected <ChevronDown className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={analyzeSelected}>
                      <Sparkles className="mr-2 h-4 w-4" /> Analyze {cfg.itemNoun.toLowerCase()}
                    </DropdownMenuItem>
                    {cfg.commentField && (
                      <DropdownMenuItem onClick={analyzeCommentsSelected}>
                        <MessagesSquare className="mr-2 h-4 w-4" /> Analyze comments
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                {canExportReports ? (
                  <>
                    <Button size="sm" variant="outline" onClick={() => exportAnalyses(false)} disabled={analyzedCount === 0}>
                      <Download className="mr-1 h-3.5 w-3.5" /> CSV
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => exportAnalyses(true)} disabled={analyzedCount === 0}>
                      <Download className="mr-1 h-3.5 w-3.5" /> JSON
                    </Button>
                  </>
                ) : (
                  // Export / report generation is Professional+ only (Tier Briefing §2.1).
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate("/payment")}
                    className="gap-1.5 border-offer/40 text-offer-hover hover:bg-offer-soft"
                    title="Export — available on Professional and higher"
                  >
                    <Lock className="h-3.5 w-3.5" /> Export
                    <span className="rounded bg-offer/15 px-1 py-px text-[9px] font-bold uppercase leading-none tracking-wide">Pro</span>
                  </Button>
                )}
                {/* Claude-generated PDF reports (Insights Report / Contentplan) —
                    plan-gated + credit-priced, with the 5-min bundle window. */}
                <ReportGenerator
                  projectId={selected.id}
                  userPlan={userPlan}
                  isAdmin={isAdmin}
                  hasData={items.length > 0}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {items.length === 0 ? (
                <p className="p-8 text-center text-sm text-muted-foreground">Nothing yet — run a scrape to pull in {cfg.label} content.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8"><input type="checkbox" checked={allSelected} onChange={toggleAll} /></TableHead>
                        <TableHead>{cfg.isAd ? "Ad" : "Post"}</TableHead>
                        {renderHeadCells()}
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedItems.map((it) => {
                        const analysis = getAnalysis(it);
                        const busy = analyzing.has(it.id);
                        const cData = getComments(it);
                        const cBusy = commentsBusy.has(it.id);
                        const qd = queued.has(it.id) && bulkKind === "content" && !busy;   // content queued
                        const cqd = queued.has(it.id) && bulkKind === "comments" && !cBusy; // comments queued
                        const link = primaryLink(it), thumb = primaryThumb(it);
                        return (
                          <TableRow key={it.id}>
                            <TableCell><input type="checkbox" checked={selectedIds.has(it.id)} onChange={() => toggleOne(it.id)} /></TableCell>
                            <TableCell className="max-w-xs">
                              <div className="flex gap-2">
                                {thumb ? <img src={thumb} alt="" className="h-14 w-10 shrink-0 rounded object-cover" loading="lazy" /> : <div className="h-14 w-10 shrink-0 rounded bg-muted" />}
                                <div className="min-w-0">
                                  <p className="line-clamp-2 text-sm">{primaryText(it) || "—"}</p>
                                  {link && <a href={link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary">Open <ExternalLink className="h-3 w-3" /></a>}
                                </div>
                              </div>
                            </TableCell>
                            {renderBodyCells(it)}
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button size="sm" variant={analysis ? "default" : "outline"} className={analysis ? "bg-emerald-600 hover:bg-emerald-600/90 text-white" : qd ? "opacity-60" : ""} onClick={() => analyzeItem(it)} disabled={busy || qd}
                                  title={qd ? "Queued for analysis" : analysis ? `View ${cfg.itemNoun.toLowerCase()} analysis` : `Analyze ${cfg.itemNoun.toLowerCase()}`}>
                                  {busy ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : qd ? <Clock className="mr-1 h-3.5 w-3.5" /> : <Sparkles className="mr-1 h-3.5 w-3.5" />}
                                  {busy ? "…" : qd ? "Queued" : `${cfg.itemNoun}${analysis ? " ✓" : ""}`}
                                </Button>
                                {cfg.commentField && (
                                  <Button size="sm" variant={cData ? "default" : "outline"} className={cData ? "bg-emerald-600 hover:bg-emerald-600/90 text-white" : cqd ? "opacity-60" : ""} onClick={() => commentsClick(it)} disabled={cBusy || cqd}
                                    title={cqd ? "Queued for comments analysis" : cData ? "View comments analysis" : "Analyze comments"}>
                                    {cBusy ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : cqd ? <Clock className="mr-1 h-3.5 w-3.5" /> : <MessagesSquare className="mr-1 h-3.5 w-3.5" />}
                                    {cBusy ? "…" : cqd ? "Queued" : `Comments${cData ? " ✓" : ""}`}
                                  </Button>
                                )}
                                <button className="text-muted-foreground hover:text-destructive px-1" onClick={async () => { await supabase.from(cfg.table).delete().eq("id", it.id); setItems((p) => p.filter((x) => x.id !== it.id)); }}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* live scrape-progress popup */}
      <Dialog open={!!scrapeProg} onOpenChange={(o) => { if (!o && scrapeProg?.status !== "running") setScrapeProg(null); }}>
        <DialogContent className="max-w-md">
          {scrapeProg && (() => {
            const elapsed = Math.max(0, Math.floor((Date.now() - scrapeProg.startedAt) / 1000));
            const noun = cfg?.noun ?? "items";
            // Time-based estimate (asymptotes to ~90%) and real item-count %, both
            // monotonically increasing — take the max so the bar never jumps back.
            const timeEst = Math.min(90, Math.round((elapsed / (elapsed + 45)) * 100));
            const countPct = scrapeProg.target > 0 ? Math.min(96, Math.round((scrapeProg.scraped / scrapeProg.target) * 100)) : 0;
            const pct = scrapeProg.status === "done" ? 100 : scrapeProg.status === "failed" ? countPct : Math.max(timeEst, countPct);
            const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
            const ss = String(elapsed % 60).padStart(2, "0");
            return (
              <>
                <DialogHeader>
                  <DialogTitle>
                    {scrapeProg.status === "done" ? "Scrape complete" : scrapeProg.status === "failed" ? "Scrape failed" : `Scraping ${noun}…`}
                  </DialogTitle>
                  <DialogDescription>
                    {scrapeProg.status === "running"
                      ? "Fetching from the source — this usually takes 1–3 minutes. You can keep this open or close it; scraping continues either way."
                      : scrapeProg.status === "done"
                        ? `${scrapeProg.scraped} ${noun} ingested.`
                        : "Something went wrong — please try again in a moment."}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 py-2">
                  <Progress value={pct} className="h-2.5" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      {scrapeProg.status === "running" && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />}
                      {scrapeProg.scraped > 0
                        ? `${scrapeProg.scraped}${scrapeProg.target ? ` / ${scrapeProg.target}` : ""} ${noun} scraped`
                        : scrapeProg.status === "running" ? "Starting the scraper…" : `0 ${noun}`}
                    </span>
                    <span className="tabular-nums">{pct}% · {mm}:{ss}</span>
                  </div>
                </div>
                {scrapeProg.status !== "running" && (
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setScrapeProg(null)}>Close</Button>
                  </DialogFooter>
                )}
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* analysis modal */}
      <Dialog open={!!modal} onOpenChange={(o) => !o && setModal(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Analysis</DialogTitle>
            <DialogDescription className="line-clamp-2">{modal?.title}</DialogDescription>
          </DialogHeader>
          {modal?.loading ? (
            <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">{modal.loadingMsg ?? "Analyzing…"}</p>
              <div className="h-1.5 w-56 overflow-hidden rounded-full bg-muted">
                <div className="h-full w-1/3 rounded-full bg-primary" style={{ animation: "scraper-indeterminate 1.1s ease-in-out infinite" }} />
              </div>
            </div>
          ) : modal?.data ? (
            <div className="max-h-[65vh] overflow-auto pr-2"><AnalysisView data={modal.data} /></div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );

  // header cells per platform (after the "Post/Ad" column)
  function renderHeadCells() {
    if (!cfg) return null;
    if (cfg.table === "videos") return (<>
      <TableHead>Author</TableHead>
      <SortHead label="Plays" k="plays" right icon={IcnPlays} /><SortHead label="Likes" k="likes" right icon={IcnLikes} />
      <SortHead label="Comments" k="comments_count" right icon={IcnComments} /><SortHead label="Shares" k="shares" right icon={IcnShares} />
      <SortHead label="Virality" k="virality" right /><SortHead label="Posted" k="posted_at" />
    </>);
    if (cfg.table === "ads") return (<>
      <SortHead label="Advertiser" k="advertiser_name" /><TableHead>Source</TableHead><TableHead>Countries</TableHead>
      <SortHead label="Impressions" k="impressions" right /><SortHead label="First shown" k="first_shown_date" /><SortHead label="Last shown" k="last_shown_date" />
    </>);
    if (cfg.table === "instagram_posts") return (<>
      <TableHead>Owner</TableHead>
      <SortHead label="Plays" k="plays" right icon={IcnPlays} /><SortHead label="Likes" k="likes" right icon={IcnLikes} /><SortHead label="Comments" k="comments_count" right icon={IcnComments} />
      <SortHead label="Posted" k="posted_at" />
    </>);
    if (cfg.table === "facebook_posts") return (<>
      <TableHead>Page</TableHead>
      <SortHead label="Reactions" k="reactions_count" right icon={IcnLikes} /><SortHead label="Comments" k="comments_count" right icon={IcnComments} /><SortHead label="Shares" k="shares" right icon={IcnShares} />
      <SortHead label="Posted" k="posted_at" />
    </>);
    return (<>
      <TableHead>Advertiser</TableHead><TableHead>Platforms</TableHead><TableHead>Countries</TableHead>
      <SortHead label="Start" k="start_date" /><SortHead label="End" k="end_date" />
    </>);
  }

  function renderBodyCells(it: Item) {
    if (!cfg) return null;
    const R = (n: any) => <TableCell className="px-2 text-right tabular-nums">{fmt(num(n))}</TableCell>;
    if (cfg.table === "videos") {
      const s = viralityScore(it);
      const tone = s >= 60 ? "bg-primary text-primary-foreground" : s >= 30 ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground";
      return (<>
        <TableCell className="text-sm text-muted-foreground">@{it.author_username ?? "—"}</TableCell>
        {R(it.plays)}{R(it.likes)}{R(it.comments_count)}{R(it.shares)}
        <TableCell className="px-2 text-right"><span className={`inline-block rounded px-2 py-0.5 text-xs font-medium tabular-nums ${tone}`}>{s.toFixed(1)}</span></TableCell>
        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{fmtDate(it.posted_at)}</TableCell>
      </>);
    }
    if (cfg.table === "ads") return (<>
      <TableCell className="text-sm">{it.advertiser_name ?? "—"}</TableCell>
      <TableCell className="text-xs text-muted-foreground">{it.source ?? "—"}</TableCell>
      <TableCell className="text-xs text-muted-foreground">{(it.countries ?? []).slice(0, 3).join(", ") || "—"}</TableCell>
      {R(it.impressions)}
      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{fmtDate(it.first_shown_date)}</TableCell>
      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{fmtDate(it.last_shown_date)}</TableCell>
    </>);
    if (cfg.table === "instagram_posts") return (<>
      <TableCell className="text-sm text-muted-foreground">@{it.owner_username ?? "—"}</TableCell>
      {R(it.plays)}{R(it.likes)}{R(it.comments_count)}
      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{fmtDate(it.posted_at)}</TableCell>
    </>);
    if (cfg.table === "facebook_posts") return (<>
      <TableCell className="text-sm">{it.page_name ?? "—"}</TableCell>
      {R(it.reactions_count)}{R(it.comments_count)}{R(it.shares)}
      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{fmtDate(it.posted_at)}</TableCell>
    </>);
    return (<>
      <TableCell className="text-sm">{it.page_name ?? "—"}</TableCell>
      <TableCell className="text-xs text-muted-foreground">{(it.platforms ?? []).join(", ") || "—"}</TableCell>
      <TableCell className="text-xs text-muted-foreground">{(it.countries ?? []).slice(0, 3).join(", ") || "—"}</TableCell>
      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{fmtDate(it.start_date)}</TableCell>
      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{fmtDate(it.end_date)}</TableCell>
    </>);
  }
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card><CardContent className="p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
    </CardContent></Card>
  );
}

// Recursive renderer for the structured AI analysis object.
function AnalysisView({ data }: { data: any }) {
  if (data == null) return <span className="text-muted-foreground">—</span>;
  if (typeof data === "string" || typeof data === "number") return <span>{String(data)}</span>;
  if (Array.isArray(data)) {
    if (data.length === 0) return <span className="text-muted-foreground">—</span>;
    return <ul className="ml-5 list-disc space-y-0.5">{data.map((v, i) => <li key={i}><AnalysisView data={v} /></li>)}</ul>;
  }
  return (
    <div className="space-y-3">
      {Object.entries(data).map(([k, v]) => (
        <div key={k}>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{k.replace(/_/g, " ")}</h3>
          <div className="mt-1 text-sm"><AnalysisView data={v} /></div>
        </div>
      ))}
    </div>
  );
}
