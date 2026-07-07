import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Sparkles, Loader2, Pencil, Smartphone, Monitor, Clock } from "lucide-react";
import GarmentUploadBlock, { emptyGarmentMap, type GarmentMap } from "@/components/fashion/GarmentUploadBlock";
import ModelSelectBlock, { defaultModelValue, type ModelValue } from "@/components/fashion/ModelSelectBlock";
import PresetWithCustomBlock from "@/components/fashion/PresetWithCustomBlock";
import VideoEditModal from "@/components/VideoEditModal";
import PlanCreditsDisplay from "@/components/PlanCreditsDisplay";
import UserMenu from "@/components/UserMenu";
import GenerationProgressOverlay from "@/components/GenerationProgressOverlay";
import { deductCredits } from "@/hooks/useCreditDeduction";
import logoImage from "@/assets/floowy-logo.png";
import {
  ASPECT_RATIOS, DURATION_PILLS, creditsForDuration,
  CONTEXT_PRESETS, CONTEXT_DEFAULT_ID, CONTEXT_CUSTOM_MAX_CHARS, CONTEXT_CUSTOM_PLACEHOLDER, contextById,
  EDITING_STYLES, EDITING_DEFAULT_ID, EDITING_CUSTOM_MAX_CHARS, EDITING_CUSTOM_PLACEHOLDER,
  editingStyleById, editingStyleAllowsCuts,
  garmentValidationError, FASHION_EDIT_CHIPS, canAccessFashionStudio,
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
  const navigate = useNavigate();
  const { toast } = useToast();

  const [user, setUser] = useState<any>(null);
  const [credits, setCredits] = useState(0);
  const [userPlan, setUserPlan] = useState("free");

  // Config state
  const [garments, setGarments] = useState<GarmentMap>(emptyGarmentMap());
  const [model, setModel] = useState<ModelValue>(defaultModelValue());
  const [contextId, setContextId] = useState<string>(CONTEXT_DEFAULT_ID);
  const [contextCustom, setContextCustom] = useState("");
  const [editingId, setEditingId] = useState<string>(EDITING_DEFAULT_ID);
  const [editingCustom, setEditingCustom] = useState("");
  const [aspectRatio, setAspectRatio] = useState<AspectRatioId>("9:16");
  const [duration, setDuration] = useState<DurationSec>(6);

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
      // Limited-preview gate: hide the tool from everyone except the allowlist.
      if (!canAccessFashionStudio(session.user.email)) { navigate("/dashboard"); return; }
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
      // 1) Upload garment images (priority order) + resolve the model reference.
      const orderedFiles = [
        ...garments.top, ...garments.bottom, ...garments.shoes, ...garments.accessories,
      ];
      setPipelineStage("uploading");
      const garmentUrls = await Promise.all(orderedFiles.map((g) => uploadToImgbb(g.file)));
      setProgress(18);

      // A chosen library avatar OR an uploaded photo is the person to dress.
      // "Describe" is text-only (nano-banana generates the model from the garments).
      let modelRefUrl: string | null = null;
      let modelPrompt = "";
      if (model.method === "upload" && model.uploadFile) {
        modelRefUrl = await uploadToImgbb(model.uploadFile);
      } else if (model.method === "library" && model.libraryModelUrl) {
        modelRefUrl = model.libraryModelUrl;
      } else if (model.method === "describe") {
        modelPrompt = model.describe.trim();
      }

      const contextPrompt = contextIsCustom ? contextCustom.trim() : (contextById(contextId)?.prompt ?? "");
      const editingPrompt = editingIsCustom ? editingCustom.trim() : (editingStyleById(editingId)?.prompt ?? "");
      const allowCuts = editingIsCustom ? false : editingStyleAllowsCuts(editingId);

      // 2) STEP 1 — compose the on-model still image with nano-banana
      //    (edit-fashion-image). Garments get worn by the model in the scene.
      setPipelineStage("styling");
      setProgress(26);
      const composePrompt = modelRefUrl
        ? `Full-body fashion photograph of the person from the FIRST reference image. Dress them in the garments shown in the following reference images, styled as one complete cohesive outfit. Keep the person's face, body, skin tone, hair and all physical features EXACTLY as in the first image — do not alter the person. Realistic fabric drape with natural wrinkles and shadows. Full body visible from head to toe. Scene and background: ${contextPrompt}. Natural, flattering lighting, realistic photography. No text, no watermark, no logos.`
        : `Full-body fashion photograph of ${modelPrompt || "a professional fashion model"}, wearing the garments shown in the reference images styled as one complete cohesive outfit. Realistic fabric drape, full body visible from head to toe. Scene and background: ${contextPrompt}. Natural, flattering lighting, realistic photography. No text, no watermark, no logos.`;
      const composeImageUrls = modelRefUrl ? [modelRefUrl, ...garmentUrls] : garmentUrls;

      const { data: compose, error: composeErr } = await supabase.functions.invoke("edit-fashion-image", {
        body: { action: "generate", prompt: composePrompt, image_urls: composeImageUrls, aspect_ratio: aspectRatio, resolution: "2K" },
      });
      if (composeErr) throw composeErr;
      if (compose?.error) throw new Error(compose.error);
      if (!compose?.request_id) throw new Error("Could not start styling the outfit.");

      const composedImageUrl = await pollTask(
        () => supabase.functions.invoke("edit-fashion-image", { body: { action: "status", requestId: compose.request_id } }),
        (st) => st?.status === "COMPLETED" ? { url: st.images?.[0]?.url } : { failed: st?.status === "FAILED" },
        { maxAttempts: 45, onTick: () => setProgress((p) => Math.min(p + 2, 52)) },
      );
      setProgress(55);

      // 3) STEP 2 — animate the composed still into a video with Kling (generate_studio).
      setPipelineStage("generating_video");
      const { data: gen, error: genErr } = await supabase.functions.invoke("generate-fashion-video", {
        body: {
          action: "generate_studio",
          start_image_url: composedImageUrl,
          garment_image_urls: garmentUrls,
          model_prompt: modelPrompt,
          model_is_upload: true,
          start_is_composed: true,
          context_prompt: contextPrompt,
          editing_prompt: editingPrompt,
          editing_allows_cuts: allowCuts,
          garment_summary: counts,
          aspect_ratio: aspectRatio,
          duration_seconds: duration,
        },
      });
      if (genErr) throw genErr;
      if (gen?.error) throw new Error(gen.error);
      setProgress(62);

      const videoUrl = await pollTask(
        () => supabase.functions.invoke("generate-fashion-video", {
          body: { action: "status", requestId: gen.request_id, statusUrl: gen.status_url, responseUrl: gen.response_url },
        }),
        (st) => st?.status === "COMPLETED" ? { url: st.video_url } : { failed: st?.status === "FAILED" },
        { maxAttempts: 75, onTick: () => setProgress((p) => Math.min(p + 3, 95)) },
      );
      setGeneratedVideoUrl(videoUrl);
      setProgress(100);

      // 4) Charge on success only.
      const newBalance = await deductCredits(user.id, cost);
      if (typeof newBalance === "number") setCredits(newBalance);
      toast({ title: "Fashion video ready 🎉", description: `${cost} credits used.` });
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-5 w-5" /></Link>
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
            <PresetWithCustomBlock
              title="Video editing style"
              subtitle="Camera movement, cut pattern and motion."
              presets={EDITING_STYLES}
              selectedId={editingId}
              customText={editingCustom}
              onSelectPreset={setEditingId}
              onSelectCustom={() => setEditingId("custom")}
              onCustomText={setEditingCustom}
              customPlaceholder={EDITING_CUSTOM_PLACEHOLDER}
              customMaxChars={EDITING_CUSTOM_MAX_CHARS}
              lgCols={3}
            />

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
