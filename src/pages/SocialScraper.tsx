import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Loader2, Plus, Play, Sparkles, Heart, MessageCircle,
  Share2, Eye, ExternalLink, FolderOpen, Trash2,
} from "lucide-react";

type Project = {
  id: string; name: string; keywords: string[]; hashtags: string[];
  usernames: string[]; platform: string; source_type: string; created_at: string;
};
type Video = {
  id: string; tiktok_url: string | null; author_username: string | null;
  author_name: string | null; caption: string | null; hashtags: string[];
  likes: number; comments_count: number; shares: number; plays: number;
  thumbnail_url: string | null; video_analysis: any | null;
};

const splitList = (s: string) =>
  s.split(/[\n,]+/).map((x) => x.trim()).filter(Boolean);

export default function SocialScraper() {
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selected, setSelected] = useState<Project | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const pollRef = useRef<number | null>(null);

  // create-form
  const [name, setName] = useState("");
  const [keywords, setKeywords] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [usernames, setUsernames] = useState("");

  const loadProjects = useCallback(async () => {
    const { data, error } = await supabase
      .from("projects").select("*").order("created_at", { ascending: false });
    if (error) toast({ title: "Failed to load projects", description: error.message, variant: "destructive" });
    else setProjects((data as Project[]) ?? []);
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    loadProjects();
    return () => { if (pollRef.current) window.clearInterval(pollRef.current); };
  }, [loadProjects]);

  const loadVideos = useCallback(async (projectId: string) => {
    const { data, error } = await supabase
      .from("videos").select("*").eq("project_id", projectId)
      .order("plays", { ascending: false }).limit(500);
    if (error) toast({ title: "Failed to load videos", description: error.message, variant: "destructive" });
    else setVideos((data as Video[]) ?? []);
  }, [toast]);

  const openProject = async (p: Project) => {
    setSelected(p); setVideos([]);
    await loadVideos(p.id);
  };

  const createProject = async () => {
    if (!name.trim()) { toast({ title: "Name is required", variant: "destructive" }); return; }
    if (!userId) { toast({ title: "Not signed in", variant: "destructive" }); return; }
    setCreating(true);
    const { data, error } = await supabase.from("projects").insert({
      user_id: userId, name: name.trim(),
      keywords: splitList(keywords), hashtags: splitList(hashtags),
      usernames: splitList(usernames), platform: "tiktok", source_type: "post",
    }).select().single();
    setCreating(false);
    if (error) { toast({ title: "Failed to create project", description: error.message, variant: "destructive" }); return; }
    setName(""); setKeywords(""); setHashtags(""); setUsernames("");
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
    if (!selected) return;
    setScraping(true);
    const { data, error } = await supabase.functions.invoke("social-scrape", {
      body: { projectId: selected.id, resultsPerPage: 30, days: 30 },
    });
    if (error || data?.error) {
      setScraping(false);
      toast({ title: "Scrape failed to start", description: data?.error ?? error?.message, variant: "destructive" });
      return;
    }
    const runRowId = data.runId as string;
    toast({ title: "Scraping started", description: "This can take 1–2 minutes…" });
    pollRef.current = window.setInterval(async () => {
      const { data: p } = await supabase.functions.invoke("social-scrape-poll", { body: { runRowId } });
      if (p?.status === "completed" || p?.status === "failed") {
        if (pollRef.current) window.clearInterval(pollRef.current);
        setScraping(false);
        if (p.status === "completed") {
          toast({ title: `Scrape complete`, description: `${p.videoCount} videos ingested` });
          loadVideos(selected.id);
        } else {
          toast({ title: "Scrape failed", description: p.error ?? "Unknown error", variant: "destructive" });
        }
      }
    }, 5000);
  };

  const analyze = async (v: Video) => {
    setAnalyzingId(v.id);
    const { data, error } = await supabase.functions.invoke("social-analyze", {
      body: { kind: "video", id: v.id },
    });
    setAnalyzingId(null);
    if (error || data?.error) {
      toast({ title: "Analysis failed", description: data?.error ?? error?.message, variant: "destructive" });
      return;
    }
    setVideos((prev) => prev.map((x) => (x.id === v.id ? { ...x, video_analysis: data.analysis } : x)));
  };

  const num = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`);

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        {selected ? (
          <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Projects
          </Button>
        ) : (
          <Link to="/home"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> Tools</Button></Link>
        )}
        <h1 className="text-2xl font-bold">Social Scraper {selected ? `· ${selected.name}` : ""}</h1>
        <Badge variant="secondary">TikTok</Badge>
      </div>

      {!selected && (
        <>
          <div className="rounded-xl border p-5 mb-8 bg-card">
            <h2 className="font-semibold mb-3 flex items-center gap-2"><Plus className="w-4 h-4" /> New project</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <Input placeholder="Project name" value={name} onChange={(e) => setName(e.target.value)} />
              <Input placeholder="Keywords (comma-separated)" value={keywords} onChange={(e) => setKeywords(e.target.value)} />
              <Input placeholder="Hashtags (comma-separated)" value={hashtags} onChange={(e) => setHashtags(e.target.value)} />
              <Input placeholder="Usernames (comma-separated, optional)" value={usernames} onChange={(e) => setUsernames(e.target.value)} />
            </div>
            <Button className="mt-4" onClick={createProject} disabled={creating}>
              {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />} Create project
            </Button>
          </div>

          <h2 className="font-semibold mb-3">Your projects</h2>
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
          ) : projects.length === 0 ? (
            <p className="text-muted-foreground">No projects yet. Create one above to start scraping.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((p) => (
                <div key={p.id} className="rounded-xl border p-4 bg-card hover:shadow-md transition group">
                  <div className="flex items-start justify-between">
                    <button className="text-left flex-1" onClick={() => openProject(p)}>
                      <div className="font-medium flex items-center gap-2"><FolderOpen className="w-4 h-4" /> {p.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {[...(p.keywords || []), ...(p.hashtags || [])].slice(0, 4).join(", ") || "—"}
                      </div>
                    </button>
                    <button onClick={() => deleteProject(p.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {selected && (
        <>
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <Button onClick={runScrape} disabled={scraping}>
              {scraping ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
              {scraping ? "Scraping…" : "Run scrape"}
            </Button>
            <span className="text-sm text-muted-foreground">{videos.length} videos</span>
            {(selected.keywords || []).concat(selected.hashtags || []).map((k) => (
              <Badge key={k} variant="outline">{k}</Badge>
            ))}
          </div>

          {videos.length === 0 ? (
            <p className="text-muted-foreground">No videos yet — run a scrape to pull in TikTok content.</p>
          ) : (
            <div className="grid gap-4">
              {videos.map((v) => (
                <div key={v.id} className="rounded-xl border p-4 bg-card flex gap-4">
                  {v.thumbnail_url && (
                    <img src={v.thumbnail_url} alt="" className="w-24 h-32 object-cover rounded-lg shrink-0" loading="lazy" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">@{v.author_username ?? "unknown"}</span>
                      {v.tiktok_url && (
                        <a href={v.tiktok_url} target="_blank" rel="noreferrer" className="text-primary inline-flex items-center gap-1">
                          <ExternalLink className="w-3 h-3" /> open
                        </a>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{v.caption ?? ""}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-2">
                      <span className="inline-flex items-center gap-1"><Eye className="w-3 h-3" /> {num(v.plays)}</span>
                      <span className="inline-flex items-center gap-1"><Heart className="w-3 h-3" /> {num(v.likes)}</span>
                      <span className="inline-flex items-center gap-1"><MessageCircle className="w-3 h-3" /> {num(v.comments_count)}</span>
                      <span className="inline-flex items-center gap-1"><Share2 className="w-3 h-3" /> {num(v.shares)}</span>
                    </div>
                    <div className="mt-3">
                      <Button size="sm" variant="secondary" onClick={() => analyze(v)} disabled={analyzingId === v.id}>
                        {analyzingId === v.id ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
                        {v.video_analysis ? "Re-analyze" : "Analyze"}
                      </Button>
                    </div>
                    {v.video_analysis && (
                      <div className="mt-3 text-sm rounded-lg bg-muted/50 p-3 space-y-1">
                        <div><span className="font-medium">Hook:</span> {v.video_analysis.hook}</div>
                        <div><span className="font-medium">Why it works:</span> {(v.video_analysis.why_it_works || []).join("; ")}</div>
                        <div><span className="font-medium">Audience:</span> {v.video_analysis.target_audience}</div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Viral factor:</span>
                          <Badge variant={v.video_analysis.estimated_viral_factor === "high" ? "default" : "outline"}>
                            {v.video_analysis.estimated_viral_factor}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
