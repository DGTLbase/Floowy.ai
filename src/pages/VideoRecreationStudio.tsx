import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useFromAdmin } from "@/hooks/useFromAdmin";
import { AdminToolsSidebar } from "@/components/AdminToolsSidebar";
import VideoEditModal from "@/components/VideoEditModal";
import GenerationProgressOverlay from "@/components/GenerationProgressOverlay";
import {
  ArrowLeft, Loader2, Upload, X, Sparkles, Coins, Video, RefreshCw, Pencil,
  LayoutGrid, MapPin, Box, Sun, Palette, Clock,
  Building2, Building, Sunset, Trees, Moon, Frame, Utensils, Store,
  Focus, Paintbrush, Feather, FlipVertical, Droplets, Eraser,
  Lightbulb, Drama, Zap, Cloud, Sunrise, Flame,
  Clapperboard, Contrast, Camera, Gem, Smile, Crown,
  CloudSun, SunMedium, CloudMoon, MoonStar, Cloudy,
} from "lucide-react";
import {
  canAccessVideoRecreation, RECREATION_CREDITS, MAX_VIDEO_MB, MAX_VIDEO_SECONDS,
  CUSTOM_MAX_CHARS, ACCEPTED_VIDEO_TYPES, REC_CATEGORIES, REC_TABS, REC_CHIP_BY_ID,
  type RecCategory,
} from "@/lib/video-recreation-config";

const ICONS: Record<string, any> = {
  LayoutGrid, MapPin, Box, Sun, Palette, Clock,
  Building2, Building, Sunset, Trees, Moon, Frame, Utensils, Store,
  Focus, Paintbrush, Feather, FlipVertical, Droplets, Sparkles, Eraser,
  Lightbulb, Drama, Zap, Cloud, Sunrise, Flame,
  Clapperboard, Contrast, Camera, Gem, Smile, Crown,
  CloudSun, SunMedium, CloudMoon, MoonStar, Cloudy,
};
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const EDIT_CHIPS = [
  { label: "Enhance quality", prompt: "Enhance sharpness, clarity and overall video quality" },
  { label: "Warmer tone", prompt: "Make the colour grade warmer and more inviting" },
  { label: "Slower pace", prompt: "Slow the motion slightly for a more premium feel" },
  { label: "Brighter", prompt: "Brighten the scene with more even lighting" },
];

export default function VideoRecreationStudio() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const fromAdmin = useFromAdmin();

  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [credits, setCredits] = useState(0);

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<"all" | RecCategory["id"]>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [custom, setCustom] = useState("");

  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("preparing");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { navigate("/auth"); return; }
      let allowed = canAccessVideoRecreation(session.user.email);
      if (!allowed) {
        const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id);
        allowed = !!roles?.some((r) => r.role === "admin");
      }
      if (!allowed) { navigate("/home"); return; }
      setUser(session.user);
      const { data: creditRow } = await supabase.from("credits").select("balance").eq("user_id", session.user.id).maybeSingle();
      setCredits(creditRow?.balance ?? 0);
      setReady(true);
    })();
  }, [navigate]);

  const refreshCredits = async () => {
    if (!user) return;
    const { data } = await supabase.from("credits").select("balance").eq("user_id", user.id).maybeSingle();
    if (typeof data?.balance === "number") setCredits(data.balance);
  };

  const pickFile = (file: File | null) => {
    if (!file) return;
    if (!ACCEPTED_VIDEO_TYPES.includes(file.type)) { toast({ title: "Unsupported file", description: "Please upload an MP4 or MOV video.", variant: "destructive" }); return; }
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) { toast({ title: "File too large", description: `Max ${MAX_VIDEO_MB}MB.`, variant: "destructive" }); return; }
    const url = URL.createObjectURL(file);
    const probe = document.createElement("video");
    probe.preload = "metadata";
    probe.onloadedmetadata = () => {
      const d = probe.duration;
      if (d > MAX_VIDEO_SECONDS + 0.5) {
        toast({ title: "Video too long", description: `Max ${MAX_VIDEO_SECONDS} seconds — yours is ${Math.round(d)}s.`, variant: "destructive" });
        URL.revokeObjectURL(url);
        return;
      }
      setVideoFile(file); setVideoPreview(url); setVideoDuration(d); setResultUrl(null);
    };
    probe.onerror = () => { toast({ title: "Could not read video", description: "Try a different file.", variant: "destructive" }); URL.revokeObjectURL(url); };
    probe.src = url;
  };

  const toggleChip = (id: string) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const selectedChips = [...selected].map((id) => REC_CHIP_BY_ID[id]).filter(Boolean);
  const hasEdits = selectedChips.length > 0 || custom.trim().length > 0;
  const notEnough = credits < RECREATION_CREDITS;
  const canGenerate = !!videoFile && hasEdits && !notEnough && !isGenerating;

  const subtitle = !hasEdits
    ? "Select edits above to get started"
    : selectedChips.map((c) => c.label).concat(custom.trim() ? ["Custom instruction"] : []).join(" · ");

  const handleGenerate = async () => {
    if (!canGenerate || !videoFile || !user) return;
    setIsGenerating(true); setResultUrl(null); setProgress(8); setStage("uploading");
    try {
      // 1) Host the source video (Supabase storage → public URL).
      const safeName = videoFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${user.id}/recreation/${Date.now()}-${safeName}`;
      const { data: up, error: upErr } = await supabase.storage.from("user-uploads").upload(path, videoFile, { upsert: true, contentType: videoFile.type });
      if (upErr) throw new Error(upErr.message);
      const { data: pub } = supabase.storage.from("user-uploads").getPublicUrl(up.path);
      const videoUrl = pub.publicUrl;
      setProgress(24); setStage("generating_video");

      // 2) Submit the recreation.
      const edits = selectedChips.map((c) => c.prompt);
      const { data: sub, error: subErr } = await supabase.functions.invoke("recreate-video", {
        body: { action: "submit", video_url: videoUrl, edits, custom_text: custom.trim() },
      });
      if (subErr || sub?.error) throw new Error(sub?.error ?? subErr?.message ?? "Could not start the recreation.");
      const { status_url, response_url } = sub;
      if (!status_url || !response_url) throw new Error("Could not start the recreation.");
      setProgress(34);

      // 3) Poll to completion (video-to-video can take a few minutes).
      let url: string | null = null;
      for (let i = 0; i < 90; i++) {
        await sleep(5000);
        const { data: st } = await supabase.functions.invoke("recreate-video", { body: { action: "status", status_url, response_url } });
        if (st?.status === "COMPLETED" && st.video_url) { url = st.video_url; break; }
        if (st?.status === "FAILED") throw new Error(st.error ?? "Recreation failed.");
        setProgress((p) => Math.min(p + 2, 95));
      }
      if (!url) throw new Error("Recreation timed out. No credits were charged.");

      setResultUrl(url); setProgress(100);

      // Save to My Generations (result video in generated_image_url).
      try {
        await supabase.from("generations").insert({
          user_id: user.id,
          prompt: `Video recreation — ${subtitle}`,
          original_image_url: videoUrl,
          generated_image_url: url,
          status: "completed",
          tool_name: "video-recreation-studio",
        });
      } catch (saveErr) {
        console.error("[video-recreation] failed to save generation", saveErr);
      }

      await refreshCredits();
      toast({ title: "Recreation ready 🎉", description: `${RECREATION_CREDITS} credits used.` });
    } catch (e) {
      setProgress(0);
      toast({ title: "Generation failed", description: e instanceof Error ? e.message : "Please try again — no credits were charged.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  if (!ready) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  const visibleCats = tab === "all" ? REC_CATEGORIES : REC_CATEGORIES.filter((c) => c.id === tab);

  return (
    <div className={`min-h-screen bg-background ${fromAdmin ? "pl-16" : ""}`}>
      {fromAdmin && <AdminToolsSidebar />}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            {!fromAdmin && <Link to="/home" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-5 w-5" /></Link>}
            <div>
              <h1 className="text-lg font-bold">Video Recreation Studio</h1>
              <p className="text-xs text-muted-foreground">Transform an existing video with AI-powered edits</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground"><Coins className="h-4 w-4" /> {credits}</div>
        </div>
      </header>

      <main className="w-full space-y-6 p-4 md:p-6">
        {resultUrl ? (
          /* ---------- RESULT ---------- */
          <Card className="p-4 space-y-4">
            <video src={resultUrl} controls autoPlay loop className="mx-auto max-h-[70vh] w-full object-contain rounded-lg bg-black" />
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="gap-2" onClick={() => setEditOpen(true)}><Pencil className="h-4 w-4" /> Edit video</Button>
              <a href={resultUrl} target="_blank" rel="noreferrer"><Button variant="outline" className="gap-2"><Video className="h-4 w-4" /> Open</Button></a>
              <Button className="gap-2" onClick={() => { setResultUrl(null); setSelected(new Set()); setCustom(""); }}><RefreshCw className="h-4 w-4" /> New recreation</Button>
            </div>
          </Card>
        ) : (
          <>
            {/* ---------- 1) UPLOAD ---------- */}
            <Card className="p-4">
              <h2 className="mb-3 text-sm font-semibold">Upload video</h2>
              {videoPreview ? (
                <div className="space-y-3">
                  <video src={videoPreview} controls className="w-full rounded-lg bg-black max-h-72" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{videoFile?.name} · {videoDuration ? `${Math.round(videoDuration)}s` : ""}</span>
                    <button className="inline-flex items-center gap-1 hover:text-destructive" onClick={() => { setVideoFile(null); setVideoPreview(null); setVideoDuration(null); }}>
                      <X className="h-3.5 w-3.5" /> Remove
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); pickFile(e.dataTransfer.files?.[0] ?? null); }}
                  className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-12 text-muted-foreground transition hover:border-primary/50 hover:bg-muted/30"
                >
                  <Upload className="h-7 w-7" />
                  <span className="text-sm font-medium text-foreground">Drag & drop or browse</span>
                  <span className="text-xs">MP4 or MOV · max {MAX_VIDEO_MB}MB · max {MAX_VIDEO_SECONDS}s</span>
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="video/mp4,video/quicktime" className="hidden" onChange={(e) => pickFile(e.target.files?.[0] ?? null)} />
            </Card>

            {/* ---------- 2) EDIT BUILDER ---------- */}
            <Card className="p-4">
              <h2 className="mb-3 text-sm font-semibold">Choose your edits</h2>
              {/* tabs */}
              <div className="mb-4 flex flex-wrap gap-1.5">
                {REC_TABS.map((t) => {
                  const Icon = ICONS[t.icon] ?? LayoutGrid;
                  return (
                    <button key={t.id} onClick={() => setTab(t.id as any)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${tab === t.id ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-border/70 bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground"}`}>
                      <Icon className="h-3.5 w-3.5" /> {t.label}
                    </button>
                  );
                })}
              </div>

              {/* chip sections */}
              <div className="space-y-4">
                {visibleCats.map((cat) => {
                  const Icon = ICONS[cat.icon] ?? LayoutGrid;
                  return (
                    <div key={cat.id}>
                      <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"><Icon className="h-3.5 w-3.5" /> {cat.label}</p>
                      <div className="flex flex-wrap gap-2">
                        {cat.chips.map((ch) => {
                          const on = selected.has(ch.id);
                          const ChipIcon = ICONS[ch.icon] ?? Sparkles;
                          return (
                            <button key={ch.id} onClick={() => toggleChip(ch.id)}
                              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition ${on ? "border-primary bg-primary/15 text-primary font-medium shadow-sm" : "border-border/70 bg-muted/40 text-foreground hover:bg-muted/70 hover:border-border dark:border-primary/30 dark:hover:border-primary/60"}`}>
                              <ChipIcon className="h-3.5 w-3.5 shrink-0" /> {ch.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* custom instruction */}
              <div className="mt-5">
                <label className="text-xs font-semibold text-muted-foreground">Custom instruction <span className="font-normal">(optional)</span></label>
                <Textarea rows={2} maxLength={CUSTOM_MAX_CHARS} value={custom} onChange={(e) => setCustom(e.target.value)}
                  className="mt-1" placeholder="e.g., Add falling snow in the background, or make the product packaging gold instead of black" />
                <div className="mt-1 text-right text-[10px] text-muted-foreground">{custom.length}/{CUSTOM_MAX_CHARS}</div>
              </div>

              {/* active edits summary */}
              <div className="mt-3">
                <p className="mb-2 text-xs font-semibold text-muted-foreground">Active edits</p>
                {selectedChips.length === 0 && !custom.trim() ? (
                  <p className="text-xs italic text-muted-foreground">No edits selected yet — choose from the options above.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedChips.map((c) => (
                      <button key={c.id} onClick={() => toggleChip(c.id)} className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs text-emerald-600 hover:bg-emerald-500/25">
                        {c.label} <X className="h-3 w-3" />
                      </button>
                    ))}
                    {custom.trim() && (
                      <button onClick={() => setCustom("")} className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs text-emerald-600 hover:bg-emerald-500/25">
                        Custom instruction <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </Card>

            {/* ---------- 3) CREDIT ROW + GENERATE ---------- */}
            <Card className="p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div>
                  <p className="font-medium text-foreground">Cost: {RECREATION_CREDITS} credits per generation</p>
                  <p className="text-muted-foreground">Output max {MAX_VIDEO_SECONDS} sec · same duration as input video</p>
                </div>
                <span className={`text-muted-foreground ${notEnough ? "text-destructive" : ""}`}>Your balance: {credits} credits</span>
              </div>
              <Button className="w-full" size="lg" disabled={!canGenerate} onClick={handleGenerate}>
                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Generate recreation ({RECREATION_CREDITS} credits)
              </Button>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                {!videoFile ? "Upload a video to get started" : notEnough ? `You need ${RECREATION_CREDITS} credits.` : subtitle}
              </p>
            </Card>
          </>
        )}
      </main>

      <GenerationProgressOverlay open={isGenerating} stage={stage} progress={progress} title="Recreating Your Video" />

      {resultUrl && (
        <VideoEditModal open={editOpen} onClose={() => setEditOpen(false)} videoUrl={resultUrl} chips={EDIT_CHIPS} onEdited={(url) => { setResultUrl(url); refreshCredits(); }} />
      )}
    </div>
  );
}
