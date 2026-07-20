import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useUpsell } from "@/hooks/useUpsell";
import { ArrowLeft, Sparkles, Loader2, Pencil, Smartphone, Monitor, Clock } from "lucide-react";
import GarmentUploadBlock, { emptyGarmentMap, type GarmentMap } from "@/components/fashion/GarmentUploadBlock";
import ModelSelectBlock, { defaultModelValue, type ModelValue } from "@/components/fashion/ModelSelectBlock";
import PresetWithCustomBlock from "@/components/fashion/PresetWithCustomBlock";
import AudioBlock from "@/components/fashion/AudioBlock";
import EditingStyleBlock from "@/components/fashion/EditingStyleBlock";
import CameraStylePresetSelect from "@/components/CameraStylePresetSelect";
import VideoEditModal from "@/components/VideoEditModal";
import PlanCreditsDisplay from "@/components/PlanCreditsDisplay";
import UserMenu from "@/components/UserMenu";
import GenerationProgressOverlay from "@/components/GenerationProgressOverlay";
import { AdminToolsSidebar } from "@/components/AdminToolsSidebar";
import { useFromAdmin } from "@/hooks/useFromAdmin";
import { deductCredits } from "@/hooks/useCreditDeduction";
import logoImage from "@/assets/floowy-logo.png";
import { cameraStylePrompt, CAMERA_STYLE_NONE } from "@/lib/camera-style-presets";
import {
  ASPECT_RATIOS, DURATION_PILLS, creditsForDuration,
  CONTEXT_PRESETS, CONTEXT_DEFAULT_ID, CONTEXT_CUSTOM_MAX_CHARS, CONTEXT_CUSTOM_PLACEHOLDER, contextById,
  EDITING_DEFAULT_ID, EDITING_CUSTOM_MAX_CHARS, EDITING_CUSTOM_PLACEHOLDER,
  editingStyleById, editingStyleAllowsCuts,
  garmentValidationError, FASHION_EDIT_CHIPS, canAccessFashionStudio,
  AUDIO_DEFAULT_ID, MUSIC_DEFAULT_ID, resolveAudioPrompt,
  type AspectRatioId, type DurationSec,
} from "@/lib/fashion-video-config";

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1]);
    r.onerror = reject;
    r.readAsDataURL(file);
  });

async function uploadToImgbb(file: File): Promise<string> {
  const image_base64 = await fileToBase64(file);
  const { data, error } = await supabase.functions.invoke("upload-to-imgbb", { body: { image_base64 } });
  if (error || !data?.url) throw new Error("Image upload failed");
  return data.url as string;
}

// Poll a fal-queue task (via its status endpoint) until it yields a URL.
async function pollTask(
  invoke: () => Promise<{ data: any; error: any }>,
  read: (st: any) => { url?: string | null; failed?: boolean },
  opts: { maxAttempts: number; intervalMs?: number; onTick?: () => void },
): Promise<string> {
  const { maxAttempts, intervalMs = 4000, onTick } = opts;
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, intervalMs));
    let st: any = null;
    try { st = (await invoke()).data; } catch { onTick?.(); continue; }
    const r = read(st);
    if (r.failed) throw new Error(st?.error || "Task failed");
    if (r.url) return r.url;
    onTick?.();
  }
  throw new Error("Timed out. No credits were charged.");
}

const FashionVideoStudioGenerator = () => {
  const { trackStudioUse } = useUpsell();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fromAdmin = useFromAdmin();

  const [user, setUser] = useState<any>(null);
  const [credits, setCredits] = useState(0);
  const [userPlan, setUserPlan] = useState("free");

  // Config state
  const [garments, setGarments] = useState<GarmentMap>(emptyGarmentMap());
  const [model, setModel] = useState<ModelValue>(defaultModelValue());
  const [contextId, setContextId] = useState<string>(CONTEXT_DEFAULT_ID);
  const [contextCustom, setContextCustom] = useState("");
  const [studioHex, setStudioHex] = useState("#f5f5f5");   // Studio minimal backdrop colour
  const [editingId, setEditingId] = useState<string>(EDITING_DEFAULT_ID);
  const [editingCustom, setEditingCustom] = useState("");
  const [aspectRatio, setAspectRatio] = useState<AspectRatioId>("9:16");
  const [duration, setDuration] = useState<DurationSec>(6);
  // When a garment slot holds multiple items: wear them one-by-one ("separate")
  // or style everything into one combined outfit ("together").
  const [wearMode, setWearMode] = useState<"separate" | "together">("separate");
  const [audioStyle, setAudioStyle] = useState<string>(AUDIO_DEFAULT_ID);
  const [musicStyle, setMusicStyle] = useState<string>(MUSIC_DEFAULT_ID);
  const [cameraStyle, setCameraStyle] = useState<string>(CAMERA_STYLE_NONE);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pipelineStage, setPipelineStage] = useState("preparing");
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [videoEditOpen, setVideoEditOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { navigate("/auth"); return; }
      // Access: the allowlist OR any admin (so admins can test from Admin → Tools).
      let allowed = canAccessFashionStudio(session.user.email);
      if (!allowed) {
        const { data: roles } = await supabase
          .from("user_roles").select("role").eq("user_id", session.user.id);
        allowed = !!roles?.some((r) => r.role === "admin");
      }
      if (!allowed) { navigate("/home"); return; }
      setUser(session.user);
      const [{ data: creditRow }, { data: profile }] = await Promise.all([
        supabase.from("credits").select("balance").eq("user_id", session.user.id).maybeSingle(),
        supabase.from("profiles").select("plan").eq("id", session.user.id).maybeSingle(),
      ]);
      setCredits(creditRow?.balance ?? 0);
      setUserPlan(profile?.plan ?? "free");
    })();
  }, [navigate]);

  const counts = {
    top: garments.top.length, bottom: garments.bottom.length,
    shoes: garments.shoes.length, accessories: garments.accessories.length,
  };
  const garmentError = garmentValidationError(counts);
  const contextIsCustom = contextId === "custom";
  const editingIsCustom = editingId === "custom";
  const customContextEmpty = contextIsCustom && !contextCustom.trim();
  const customEditingEmpty = editingIsCustom && !editingCustom.trim();
  const cost = creditsForDuration(duration);
  const notEnoughCredits = credits < cost;

  const contextName = contextIsCustom ? "Custom" : (contextById(contextId)?.name ?? "");
  const editingName = editingIsCustom ? "Custom" : (editingStyleById(editingId)?.name ?? "");

  const canGenerate = !isGenerating && !garmentError && !customContextEmpty && !customEditingEmpty && !notEnoughCredits;

  const validationMessage = garmentError
    ? garmentError
    : customContextEmpty ? "Please describe your context or select one of the presets above."
    : customEditingEmpty ? "Please describe your editing style or select one of the presets above."
    : notEnoughCredits ? `You need ${cost} credits for a ${duration}s video.`
    : null;

  const reject = (msg: string) => toast({ title: "Can't add that", description: msg, variant: "destructive" });

  const handleGenerate = async () => {
    if (!canGenerate || !user) return;
    setIsGenerating(true);
    setGeneratedVideoUrl(null);
    setProgress(8);
    setPipelineStage("preparing");

    try {
      // 1) Identify the rotating slot: the highest-priority slot (top → bottom →
      //    shoes → accessories) holding MORE THAN ONE item. Those garments are
      //    shown one-by-one in the video; every other slot contributes a single
      //    constant item. With no multi-item slot this is exactly the original
      //    single-outfit behaviour.
      const ROT_ORDER = ["top", "bottom", "shoes", "accessories"] as const;
      // Only rotate (wear separately) when the user chose "separate" AND a slot
      // actually holds multiples. "Together" = one combined outfit, no rotation.
      const rotatingCat = wearMode === "separate" ? (ROT_ORDER.find((c) => garments[c].length > 1) ?? null) : null;
      const rotationCount = rotatingCat ? garments[rotatingCat].length : 0;
      const rotationLabel = rotatingCat
        ? ({ top: "tops", bottom: "bottoms", shoes: "pairs of shoes", accessories: "accessories" } as const)[rotatingCat]
        : null;

      // Reference set. Separate: ALL items of the rotating slot (so the model can
      // wear each in its own segment) + one constant item per other slot.
      // Together: every uploaded garment, combined into one cohesive outfit.
      const refFiles = (rotatingCat
        ? ROT_ORDER.flatMap((c) => (c === rotatingCat ? garments[c] : (garments[c][0] ? [garments[c][0]] : [])))
        : ROT_ORDER.flatMap((c) => garments[c])) as typeof garments.top;
      setPipelineStage("uploading");
      const garmentUrls = await Promise.all(refFiles.map((g) => uploadToImgbb(g.file)));
      setProgress(20);

      // A chosen library avatar OR an uploaded photo becomes a model reference
      // image. "Describe" is text-only (the model is described in the prompt).
      let modelRefUrl: string | null = null;
      let modelPrompt = "";
      if (model.method === "upload" && model.uploadFile) {
        modelRefUrl = await uploadToImgbb(model.uploadFile);
      } else if (model.method === "library" && model.libraryModelUrl) {
        modelRefUrl = model.libraryModelUrl;
      } else if (model.method === "describe") {
        modelPrompt = model.describe.trim();
      }

      let contextPrompt = contextIsCustom ? contextCustom.trim() : (contextById(contextId)?.prompt ?? "");
      if (!contextIsCustom && contextId === "studio-minimal" && studioHex.trim()) {
        contextPrompt += ` The seamless studio backdrop is the exact solid colour ${studioHex.trim()}.`;
      }
      const editingPrompt = editingIsCustom ? editingCustom.trim() : (editingStyleById(editingId)?.prompt ?? "");
      const allowCuts = editingIsCustom ? false : editingStyleAllowsCuts(editingId);
      // Camera style is about HOW it's shot — append it to the editing prompt.
      const cam = cameraStylePrompt(cameraStyle);

      // 2) Send the garments (+ optional model) STRAIGHT to Omni reference-to-video —
      //    no nano-banana compose step. Every rotating garment is a reference image,
      //    so the model can wear each one accurately in its own segment.
      const referenceImageUrls = modelRefUrl ? [modelRefUrl, ...garmentUrls] : garmentUrls;
      setPipelineStage("generating_video");
      setProgress(32);
      const { data: gen, error: genErr } = await supabase.functions.invoke("generate-fashion-video", {
        body: {
          action: "generate_studio",
          reference_image_urls: referenceImageUrls,
          has_model_ref: !!modelRefUrl,
          model_prompt: modelPrompt,
          garment_summary: counts,
          context_prompt: contextPrompt,
          editing_prompt: cam ? `${editingPrompt}. ${cam}` : editingPrompt,
          // Outfit rotation needs cuts to swap between looks, so force them on.
          editing_allows_cuts: rotatingCat ? true : allowCuts,
          outfit_rotation: rotatingCat ? { label: rotationLabel, count: rotationCount } : undefined,
          audio_prompt: resolveAudioPrompt(audioStyle, musicStyle),
          generate_audio: audioStyle !== "silent",
          aspect_ratio: aspectRatio,
          duration_seconds: duration,
        },
      });
      if (genErr) throw genErr;
      if (gen?.error) throw new Error(gen.error);
      setProgress(45);

      const videoUrl = await pollTask(
        () => supabase.functions.invoke("generate-fashion-video", {
          body: { action: "status", requestId: gen.request_id, statusUrl: gen.status_url, responseUrl: gen.response_url },
        }),
        (st) => st?.status === "COMPLETED" ? { url: st.video_url } : { failed: st?.status === "FAILED" },
        { maxAttempts: 75, onTick: () => setProgress((p) => Math.min(p + 3, 95)) },
      );
      setGeneratedVideoUrl(videoUrl);
      setProgress(100);

      // Save to My Generations (video URL lives in generated_image_url; My
      // Generations detects video by the .mp4 URL). Non-fatal on failure.
      try {
        await supabase.from("generations").insert({
          user_id: user.id,
          prompt: `Fashion video — ${contextName} · ${editingName}`,
          original_image_url: referenceImageUrls[0] ?? videoUrl,
          generated_image_url: videoUrl,
          status: "completed",
          tool_name: "fashion-video-studio",
        });
      } catch (saveErr) {
        console.error("[fashion-video] failed to save generation", saveErr);
      }

      // 4) Charge on success only.
      const newBalance = await deductCredits(user.id, cost);
      if (typeof newBalance === "number") setCredits(newBalance);
      toast({ title: "Fashion video ready 🎉", description: `${cost} credits used.` });
      // Contextual upsell: nudge Fashion Video users toward Fashion Studio Pro.
      trackStudioUse("fashion-video");
    } catch (e) {
      setProgress(0);
      toast({
        title: "Generation failed",
        description: e instanceof Error ? e.message : "Please try again — no credits were charged.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={`min-h-screen bg-background ${fromAdmin ? "pl-16" : ""}`}>
      {/* Admin-tools version: show the admin rail instead of the back-to-home button. */}
      {fromAdmin && <AdminToolsSidebar />}
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            {!fromAdmin && (
              <Link to="/home" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-5 w-5" /></Link>
            )}
            <img src={logoImage} alt="Floowy" className="h-7" />
            <span className="hidden text-sm font-semibold text-foreground sm:inline">Fashion Video Studio</span>
          </div>
          <div className="flex items-center gap-3">
            <PlanCreditsDisplay credits={credits} plan={userPlan} onAddCredits={() => {}} />
            <UserMenu onAddCredits={() => {}} />
          </div>
        </div>
      </header>

      <main className="w-full px-4 py-6 md:px-6">
        {generatedVideoUrl ? (
          /* Result view */
          <div className="space-y-4">
            <div className="overflow-hidden rounded-xl bg-black">
              <video src={generatedVideoUrl} controls autoPlay loop className="mx-auto max-h-[70vh] w-full object-contain" />
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => setVideoEditOpen(true)} variant="outline" className="gap-2">
                <Pencil className="h-4 w-4" /> Edit Video
              </Button>
              <Button onClick={() => setGeneratedVideoUrl(null)} className="gap-2">
                <Sparkles className="h-4 w-4" /> New video
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <GarmentUploadBlock value={garments} onChange={setGarments} onReject={reject} />
            {(["top", "bottom", "shoes", "accessories"] as const).some((c) => garments[c].length > 1) && (
              <div className="rounded-xl border border-border/60 bg-card/50 p-4">
                <p className="text-sm font-medium text-foreground">Multiple items in a category</p>
                <p className="mb-3 text-xs text-muted-foreground">You uploaded more than one item in a category. Wear them one at a time, or combine everything into a single outfit.</p>
                <div className="flex gap-2">
                  {([["separate", "Worn separately", "Model wears each one-by-one across the video"], ["together", "Worn together", "Style everything into one combined outfit"]] as const).map(([id, label, desc]) => (
                    <button key={id} type="button" onClick={() => setWearMode(id)}
                      className={`flex-1 rounded-lg border p-3 text-left transition ${wearMode === id ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:bg-muted/50"}`}>
                      <span className="block text-sm font-medium">{label}</span>
                      <span className="block text-xs text-muted-foreground">{desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <ModelSelectBlock value={model} onChange={setModel} onReject={reject} />
            <PresetWithCustomBlock
              title="Fashion context"
              subtitle="Choose the scene, environment and atmosphere."
              presets={CONTEXT_PRESETS}
              selectedId={contextId}
              customText={contextCustom}
              onSelectPreset={setContextId}
              onSelectCustom={() => setContextId("custom")}
              onCustomText={setContextCustom}
              customPlaceholder={CONTEXT_CUSTOM_PLACEHOLDER}
              customMaxChars={CONTEXT_CUSTOM_MAX_CHARS}
              lgCols={4}
            />

            {/* Studio minimal — pick the exact backdrop colour */}
            {contextId === "studio-minimal" && (
              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-muted/30 p-3">
                <span className="text-sm font-medium text-foreground">Backdrop colour</span>
                <input
                  type="color"
                  value={/^#[0-9a-fA-F]{6}$/.test(studioHex) ? studioHex : "#f5f5f5"}
                  onChange={(e) => setStudioHex(e.target.value)}
                  className="h-8 w-12 cursor-pointer rounded border border-border bg-transparent p-0.5"
                  aria-label="Backdrop colour"
                />
                <input
                  type="text"
                  value={studioHex}
                  onChange={(e) => setStudioHex(e.target.value)}
                  placeholder="#f5f5f5"
                  className="w-28 rounded-md border border-border bg-background px-2 py-1 text-sm outline-none focus:border-primary"
                />
                <span className="text-xs text-muted-foreground">Any hex — the seamless studio backdrop uses this exact colour.</span>
              </div>
            )}
            <EditingStyleBlock
              aspectRatio={aspectRatio}
              selectedId={editingId}
              customText={editingCustom}
              onSelectPreset={setEditingId}
              onSelectCustom={() => setEditingId("custom")}
              onCustomText={setEditingCustom}
              customPlaceholder={EDITING_CUSTOM_PLACEHOLDER}
              customMaxChars={EDITING_CUSTOM_MAX_CHARS}
            />

            <AudioBlock
              audioId={audioStyle}
              musicStyleId={musicStyle}
              onAudio={setAudioStyle}
              onMusicStyle={setMusicStyle}
            />

            <CameraStylePresetSelect value={cameraStyle} onChange={setCameraStyle} />

            {/* Aspect ratio */}
            <div className="space-y-3">
              <span className="text-lg font-semibold text-foreground">Aspect ratio</span>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {ASPECT_RATIOS.map((r) => {
                  const active = r.id === aspectRatio;
                  const Icon = r.id === "9:16" ? Smartphone : Monitor;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setAspectRatio(r.id)}
                      className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${
                        active ? "border-primary ring-2 ring-primary/30 bg-primary/5" : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${active ? "bg-primary/10" : "bg-muted"}`}>
                        <Icon className={`h-5 w-5 ${active ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-foreground">{r.label}</span>
                          <span className="text-xs text-muted-foreground">{r.orientation}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{r.platforms}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-3">
              <span className="text-lg font-semibold text-foreground">Video duration</span>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {DURATION_PILLS.map((p) => {
                  const active = p.seconds === duration;
                  return (
                    <button
                      key={p.seconds}
                      type="button"
                      onClick={() => setDuration(p.seconds)}
                      className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${
                        active ? "border-primary ring-2 ring-primary/30 bg-primary/5" : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${active ? "bg-primary/10" : "bg-muted"}`}>
                        <Clock className={`h-5 w-5 ${active ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-foreground">{p.seconds} sec</div>
                        <span className="text-xs text-muted-foreground">{p.credits} credits</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Generate — sits at the end of the form, scrolls with content (not sticky) */}
            <div className="space-y-2 pt-2">
              {validationMessage && (
                <p className="text-center text-xs font-medium text-amber-600">{validationMessage}</p>
              )}
              <Button
                onClick={handleGenerate}
                disabled={!canGenerate}
                size="lg"
                className="w-full gap-2 py-6 text-base font-bold"
              >
                {isGenerating ? <><Loader2 className="h-5 w-5 animate-spin" /> Generating…</> : `Generate fashion video (${cost} credits)`}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                {duration} sec · {aspectRatio} · {contextName} · {editingName}
              </p>
            </div>
          </div>
        )}
      </main>

      <GenerationProgressOverlay
        open={isGenerating}
        stage={pipelineStage}
        progress={progress}
        title="Creating Your Fashion Video"
      />

      {generatedVideoUrl && (
        <VideoEditModal
          open={videoEditOpen}
          onClose={() => setVideoEditOpen(false)}
          videoUrl={generatedVideoUrl}
          chips={FASHION_EDIT_CHIPS}
          onEdited={(url) => setGeneratedVideoUrl(url)}
        />
      )}
    </div>
  );
};

export default FashionVideoStudioGenerator;
