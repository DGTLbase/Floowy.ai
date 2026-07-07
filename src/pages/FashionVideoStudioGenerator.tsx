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
  libraryModelPrompt, garmentValidationError, FASHION_EDIT_CHIPS, canAccessFashionStudio,
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
      // 1) Upload all garment images (in priority order) + optional model photo.
      const orderedFiles = [
        ...garments.top, ...garments.bottom, ...garments.shoes, ...garments.accessories,
      ];
      setPipelineStage("uploading");
      const garmentUrls = await Promise.all(orderedFiles.map((g) => uploadToImgbb(g.file)));
      setProgress(30);

      let startImageUrl = garmentUrls[0];
      let modelIsUpload = false;
      if (model.method === "upload" && model.uploadFile) {
        startImageUrl = await uploadToImgbb(model.uploadFile);
        modelIsUpload = true;
      } else if (garments.top[0]) {
        // Prefer the priority-1 top as the animation start frame.
        startImageUrl = garmentUrls[0];
      }
      if (!startImageUrl) throw new Error("No image available to start from");

      // 2) Resolve prompt inputs.
      const modelPrompt =
        model.method === "describe" ? model.describe.trim()
        : model.method === "library" ? libraryModelPrompt(model.library)
        : "";
      const contextPrompt = contextIsCustom ? contextCustom.trim() : (contextById(contextId)?.prompt ?? "");
      const editingPrompt = editingIsCustom ? editingCustom.trim() : (editingStyleById(editingId)?.prompt ?? "");
      const allowCuts = editingIsCustom ? false : editingStyleAllowsCuts(editingId);

      setProgress(40);
      setPipelineStage("generating_video");

      // 3) Submit.
      const { data: gen, error: genErr } = await supabase.functions.invoke("generate-fashion-video", {
        body: {
          action: "generate_studio",
          start_image_url: startImageUrl,
          garment_image_urls: garmentUrls,
          model_prompt: modelPrompt,
          model_is_upload: modelIsUpload,
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
      const { request_id, status_url, response_url } = gen;
      setProgress(55);

      // 4) Poll to completion.
      await new Promise<void>((resolve, reject2) => {
        const started = Date.now();
        const interval = setInterval(async () => {
          if (Date.now() - started > 5 * 60 * 1000) {
            clearInterval(interval); reject2(new Error("Generation timed out. No credits were charged."));
            return;
          }
          try {
            const { data: st } = await supabase.functions.invoke("generate-fashion-video", {
              body: { action: "status", requestId: request_id, statusUrl: status_url, responseUrl: response_url },
            });
            if (st?.status === "COMPLETED" && st.video_url) {
              clearInterval(interval);
              setGeneratedVideoUrl(st.video_url);
              setProgress(100);
              resolve();
            } else if (st?.status === "FAILED") {
              clearInterval(interval); reject2(new Error(st.error || "Generation failed"));
            } else {
              setProgress((p) => Math.min(p + 4, 92));
            }
          } catch { /* transient — keep polling */ }
        }, 4000);
      });

      // 5) Charge on success only.
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
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
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

      <main className="container mx-auto max-w-3xl px-4 py-6">
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

            {/* Generate */}
            <div className="sticky bottom-4 space-y-2">
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
