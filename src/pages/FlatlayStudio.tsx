import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ChromePicker } from "react-color";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Upload, Sparkles, Download, RotateCcw, Image as ImageIcon, Check,
  ArrowLeft, Shield, Pencil, Wand2, X, ChevronRight, ChevronLeft,
  Package, Palette, Settings, ListChecks, Lock, Zap, Tag, Layers, Shirt, Ban,
} from "lucide-react";
import GenerationProgressOverlay from "@/components/GenerationProgressOverlay";
import ReferenceUploadBlock from "@/components/ReferenceUploadBlock";
import ImageEditModal from "@/components/ImageEditModal";
import { AdminToolsSidebar } from "@/components/AdminToolsSidebar";
import { useToast } from "@/hooks/use-toast";
import { useUpsell } from "@/hooks/useUpsell";
import PlanCreditsDisplay from "@/components/PlanCreditsDisplay";
import UserMenu from "@/components/UserMenu";
import CreditsPurchaseDialog from "@/components/CreditsPurchaseDialog";
import { cn } from "@/lib/utils";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useAdminToken } from "@/hooks/useAdminToken";
import logoImage from "@/assets/floowy-logo.png";
import { deductCredits } from "@/hooks/useCreditDeduction";
import { useImageGating } from "@/hooks/useImageGating";
import { UnlockDialog } from "@/components/UnlockDialog";
import DragDropZone from "@/components/DragDropZone";
import { StylePickerPanel, StyleSelection } from "@/components/flatlay/StylePickerPanel";

const ASPECT_RATIOS = [
  { label: "1:1" }, { label: "4:5" }, { label: "3:4" },
  { label: "2:3" }, { label: "9:16" }, { label: "16:9" },
  { label: "3:2" }, { label: "4:3" },
];

const RESOLUTIONS = [
  { label: "1K", multiplier: 1, credits: 2 },
  { label: "2K", multiplier: 2, credits: 3 },
  { label: "4K", multiplier: 4, credits: 4 },
];

const MAX_PRODUCTS = 10;

// Character cap for the free-text fields in Generation Settings. Matches the
// 250 already used for the custom background prompt elsewhere in the platform,
// so description-type fields behave consistently.
const MAX_DESCRIPTION_LEN = 250;

const STAGE_TARGETS = {
  upload: { min: 0, max: 15, label: "Uploading images" },
  generate: { min: 15, max: 80, label: "Generating your flatlays" },
  background: { min: 80, max: 95, label: "Cleaning backgrounds" },
  complete: { min: 95, max: 100, label: "Done!" },
} as const;

type Step = "products" | "style" | "settings" | "summary";

interface ProductItem {
  id: string;
  file: File;
  preview: string;
  labelFile?: File;
  labelPreview?: string;
}

const FlatlayStudio = () => {
  const { trackStudioUse } = useUpsell();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const adminMode = searchParams.get("admin") === "true";
  const { isAdmin } = useAdminCheck();
  const hasAdminToken = useAdminToken();
  const { toast } = useToast();

  const [user, setUser] = useState<any>(null);
  const [credits, setCredits] = useState(0);
  const [userPlan, setUserPlan] = useState("free");

  const [step, setStep] = useState<Step>("products");
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [selections, setSelections] = useState<Record<string, StyleSelection>>({});
  const [mode, setMode] = useState<"reference" | "ai-guess">("reference");
  const [outputType, setOutputType] = useState<"flatlay" | "halo_bust">("flatlay");

  const [aspectRatio, setAspectRatio] = useState("1:1");
  // 2K, not 1K. At 1024px the weave, stitch lines and fine print simply are
  // not resolvable, so no amount of prompt work recovers that detail.
  const [resolution, setResolution] = useState(2);
  const [promptVersion, setPromptVersion] = useState(1);
  const [seedInput, setSeedInput] = useState("");
  const [transparentBg, setTransparentBg] = useState(false);
  const [bgColor, setBgColor] = useState("#f5f5f0");

  // New Generation Settings blocks. All optional and batch-level, the same
  // scope as the global neck label: empty fields are simply not sent.
  const [fabricFile, setFabricFile] = useState<File | null>(null);
  const [fabricPreview, setFabricPreview] = useState<string | null>(null);
  const [fabricDescription, setFabricDescription] = useState("");
  const [liningFile, setLiningFile] = useState<File | null>(null);
  const [liningPreview, setLiningPreview] = useState<string | null>(null);
  const [liningDescription, setLiningDescription] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  // Same object-URL discipline as setGlobalLabel: revoke the old preview
  // before replacing it, so long sessions don't leak blob URLs.
  const setFabricRef = (file: File | null) => {
    if (fabricPreview) URL.revokeObjectURL(fabricPreview);
    setFabricFile(file);
    setFabricPreview(file ? URL.createObjectURL(file) : null);
  };
  const setLiningRef = (file: File | null) => {
    if (liningPreview) URL.revokeObjectURL(liningPreview);
    setLiningFile(file);
    setLiningPreview(file ? URL.createObjectURL(file) : null);
  };

  // Global neck label applied to all products (fallback if no per-product label)
  const [globalLabelFile, setGlobalLabelFile] = useState<File | null>(null);
  const [globalLabelPreview, setGlobalLabelPreview] = useState<string | null>(null);
  const setGlobalLabel = (file: File | null) => {
    if (globalLabelPreview) URL.revokeObjectURL(globalLabelPreview);
    if (!file) {
      setGlobalLabelFile(null);
      setGlobalLabelPreview(null);
      return;
    }
    setGlobalLabelFile(file);
    setGlobalLabelPreview(URL.createObjectURL(file));
  };

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [editingFlatlay, setEditingFlatlay] = useState<number | null>(null);
  const { canExport, displayUrl, gate, unlockOpen, setUnlockOpen } = useImageGating({
    isAdmin: isAdmin || hasAdminToken,
    urls: generatedImages,
  });
  const [showCreditsPurchase, setShowCreditsPurchase] = useState(false);
  const [currentStage, setCurrentStage] = useState<keyof typeof STAGE_TARGETS | null>(null);
  const [progress, setProgress] = useState(0);
  const [targetProgress, setTargetProgress] = useState(0);

  // Auth
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        if (!adminMode && !hasAdminToken) navigate("/auth");
        return;
      }
      setUser(session.user);
      fetchCredits(session.user.id);
      fetchUserPlan(session.user.id);
    };
    checkAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        if (!adminMode && !hasAdminToken) navigate("/auth");
      } else {
        setUser(session.user);
        fetchCredits(session.user.id);
        fetchUserPlan(session.user.id);
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate, adminMode, hasAdminToken]);

  const fetchCredits = async (userId: string) => {
    const { data } = await supabase.from("credits").select("balance").eq("user_id", userId).single();
    if (data) setCredits(data.balance);
  };
  const fetchUserPlan = async (userId: string) => {
    const { data } = await supabase.from("profiles").select("plan").eq("id", userId).single();
    if (data) setUserPlan(data.plan || "free");
  };

  // Smooth progress
  useEffect(() => {
    if (!isGenerating || !currentStage) return;
    const interval = setInterval(() => {
      setProgress((prev) => (prev >= targetProgress ? prev : Math.min(prev + 1, targetProgress)));
    }, 100);
    return () => clearInterval(interval);
  }, [isGenerating, currentStage, targetProgress]);

  const updateProgress = (key: keyof typeof STAGE_TARGETS) => {
    setCurrentStage(key);
    setTargetProgress(STAGE_TARGETS[key].max);
    setProgress((p) => Math.max(p, STAGE_TARGETS[key].min));
  };

  const perGenerationCost = useMemo(
    () => RESOLUTIONS.find((r) => r.multiplier === resolution)?.credits || 2,
    [resolution]
  );
  const totalCost = perGenerationCost * Math.max(products.length, 1);

  // ── Product handling ──────────────────────────────────────────
  const addFiles = (files: FileList | File[]) => {
    const arr = Array.from(files);
    setProducts((prev) => {
      const remaining = MAX_PRODUCTS - prev.length;
      const toAdd = arr.slice(0, remaining).map((file) => ({
        id: crypto.randomUUID(),
        file,
        preview: URL.createObjectURL(file),
      }));
      return [...prev, ...toAdd];
    });
  };
  const removeProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const setProductLabel = (id: string, file: File | null) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        if (p.labelPreview) URL.revokeObjectURL(p.labelPreview);
        if (!file) return { ...p, labelFile: undefined, labelPreview: undefined };
        return { ...p, labelFile: file, labelPreview: URL.createObjectURL(file) };
      })
    );
  };

  // ── Generation ────────────────────────────────────────────────
  const uploadToImgbb = async (file: File): Promise<string> => {
    const reader = new FileReader();
    const base64 = await new Promise<string>((resolve, reject) => {
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const { data, error } = await supabase.functions.invoke("upload-to-imgbb", {
      body: { image_base64: base64 },
    });
    if (error || !data?.url) throw new Error("Upload failed");
    return data.url;
  };

  const removeBackground = async (imageUrl: string) => {
    const { data, error } = await supabase.functions.invoke("generate-flatlay", {
      body: { action: "remove-background", imageUrl },
    });
    if (error || !data?.image?.url) return imageUrl;
    return data.image.url;
  };

  const generateOne = async (
    productUrl: string,
    referenceUrl: string | null,
    labelUrl: string | null,
    variant: "flatlay" | "collar-closeup" = "flatlay",
    fabricUrl: string | null = null,
    liningUrl: string | null = null
  ) => {
    const { data: startData, error } = await supabase.functions.invoke("generate-flatlay", {
      body: {
        action: "generate",
        productImageUrl: productUrl,
        referenceImageUrl: referenceUrl,
        labelImageUrl: labelUrl,
        resolution: RESOLUTIONS.find((r) => r.multiplier === resolution)?.label || "2K",
        aspectRatio,
        transparentBackground: transparentBg,
        backgroundColor: transparentBg ? undefined : bgColor,
        mode: referenceUrl ? "reference" : "ai-guess",
        variant,
        outputType,
        // Optional Generation Settings blocks. Undefined when unused, so the
        // payload is unchanged for anyone who leaves them empty.
        fabric_reference_image: fabricUrl || undefined,
        fabric_description: fabricDescription.trim() || undefined,
        lining_reference_image: liningUrl || undefined,
        lining_description: liningDescription.trim() || undefined,
        negative_prompt: negativePrompt.trim() || undefined,
        promptVersion,
        seed: seedInput ? Number(seedInput) : undefined,
      },
    });
    if (error || !startData?.request_id) throw new Error("Failed to start generation");

    const requestId = startData.request_id;
    let attempts = 0;
    const maxAttempts = 120;
    while (attempts < maxAttempts) {
      await new Promise((r) => setTimeout(r, 3000));
      attempts++;
      const { data: statusData } = await supabase.functions.invoke("generate-flatlay", {
        body: { action: "status", requestId },
      });
      if (statusData?.status === "COMPLETED") {
        return (statusData.images || []).map((i: any) => i.url) as string[];
      }
      if (statusData?.status === "FAILED") throw new Error("Generation failed");
    }
    throw new Error("Generation timed out");
  };

  const handleGenerate = async () => {
    if (products.length === 0) return;
    if (!isAdmin && !hasAdminToken && credits < totalCost) {
      setShowCreditsPurchase(true);
      return;
    }

    setIsGenerating(true);
    setGeneratedImages([]);
    setProgress(0); setTargetProgress(0); setCurrentStage(null);
    try {
      updateProgress("upload");
      const productUrls = await Promise.all(products.map((p) => uploadToImgbb(p.file)));

      updateProgress("generate");
      const allRaw: { productUrl: string; image: string }[] = [];
      // Batch-level references: uploaded once, reused for every product, via
      // the same imgbb flow as the neck label.
      const fabricUrl = fabricFile ? await uploadToImgbb(fabricFile) : null;
      const liningUrl = liningFile ? await uploadToImgbb(liningFile) : null;

      for (let i = 0; i < productUrls.length; i++) {
        const product = products[i];
        const sel = selections[product.id];
        const refUrl = mode === "ai-guess" || !sel || sel.kind === "ai-guess"
          ? null
          : sel.image_url;
        const labelSource = product.labelFile || globalLabelFile;
        const labelUrl = labelSource ? await uploadToImgbb(labelSource) : null;
        const imgs = await generateOne(productUrls[i], refUrl, labelUrl, "flatlay", fabricUrl, liningUrl);
        imgs.forEach((image) => allRaw.push({ productUrl: productUrls[i], image }));
        const pct = STAGE_TARGETS.generate.min +
          ((i + 1) / productUrls.length) *
            (STAGE_TARGETS.generate.max - STAGE_TARGETS.generate.min);
        setTargetProgress(Math.round(pct));
      }

      let processed: string[];
      if (transparentBg) {
        updateProgress("background");
        processed = await Promise.all(allRaw.map((r) => removeBackground(r.image)));
      } else {
        processed = allRaw.map((r) => r.image);
      }

      updateProgress("complete");
      setGeneratedImages(processed);

      if (!isAdmin && !hasAdminToken && user?.id) {
        const newBalance = await deductCredits(user.id, totalCost);
        setCredits(newBalance);
      }

      // Save to history
      for (let i = 0; i < processed.length; i++) {
        await supabase.from("generations").insert({
          user_id: user.id,
          original_image_url: allRaw[i].productUrl,
          generated_image_url: processed[i],
          prompt: `Flatlay Studio - ${aspectRatio} - ${RESOLUTIONS.find((r) => r.multiplier === resolution)?.label}`,
          status: "completed",
          tool_name: "flatlay-studio",
        });
      }

      toast({ title: "Done!", description: `Generated ${processed.length} flatlays` });
      // Contextual upsell: nudge Flatlay users toward Fashion Video Studio.
      trackStudioUse("flatlay");
    } catch (e) {
      console.error(e);
      toast({ title: "Generation failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
      setCurrentStage(null);
      setProgress(0);
      setTargetProgress(0);
    }
  };

  const handleDownload = async (url: string, index: number) => {
    try {
      const r = await fetch(url);
      const blob = await r.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `flatlay-${index + 1}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      toast({ title: "Download failed", variant: "destructive" });
    }
  };

  const handleReset = () => {
    setGeneratedImages([]);
    setProducts([]);
    setSelections({});
    setMode("reference");
    setOutputType("flatlay");
    setStep("products");
  };

  // ── Step nav guards ─────────────────────────────────────────
  const stepOrder: Step[] = mode === "ai-guess"
    ? ["products", "settings", "summary"]
    : ["products", "style", "settings", "summary"];

  const canNext = (() => {
    if (step === "products") return products.length > 0;
    if (step === "style") {
      // Every product must have a non-ai-guess selection.
      return products.length > 0 && products.every((p) => {
        const s = selections[p.id];
        return s && s.kind !== "ai-guess";
      });
    }
    return true;
  })();

  const goNext = () => {
    const idx = stepOrder.indexOf(step);
    if (idx < stepOrder.length - 1) setStep(stepOrder[idx + 1]);
  };
  const goBack = () => {
    const idx = stepOrder.indexOf(step);
    if (idx > 0) setStep(stepOrder[idx - 1]);
  };

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-secondary/20 to-background flex">
      {isAdmin && <AdminToolsSidebar />}
      <div className="flex-1 flex flex-col">
        <nav className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <Link to="/home" className="flex items-center gap-2 hover:opacity-80">
              <img src={logoImage} alt="Floowy.ai" className="h-8 w-auto" />
              <span className="font-bold text-xl">Floowy.ai</span>
            </Link>
            {adminMode ? (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full">
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">Admin Mode</span>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <PlanCreditsDisplay plan={userPlan} credits={credits} onAddCredits={() => setShowCreditsPurchase(true)} />
                <UserMenu onAddCredits={() => setShowCreditsPurchase(true)} />
              </div>
            )}
          </div>
        </nav>

        <GenerationProgressOverlay
          open={isGenerating}
          stage={currentStage || "upload"}
          progress={progress}
          statusMessage={currentStage ? STAGE_TARGETS[currentStage].label : "Processing..."}
          title="Creating Your Flatlays"
          steps={[
            { key: "upload", label: "Uploading", icon: Upload },
            { key: "generate", label: "Generating", icon: Wand2 },
            { key: "background", label: "Backgrounds", icon: ImageIcon },
          ]}
          onClose={() => {}}
        />

        <div className="container mx-auto px-4 py-8 max-w-6xl w-full">
          {generatedImages.length > 0 ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Generated Flatlays</h2>
                <Button onClick={handleReset} variant="outline">
                  <RotateCcw className="h-4 w-4 mr-2" /> Create New
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {generatedImages.map((url, index) => (
                  <div key={index} className="relative group rounded-xl overflow-hidden border bg-card">
                    <img
                      src={displayUrl(url)}
                      alt={`Flatlay ${index + 1}`}
                      className={cn(
                        "w-full aspect-square object-contain",
                        transparentBg ? "bg-[conic-gradient(at_50%_50%,#e5e5e5_25%,#f5f5f5_25%_50%,#e5e5e5_50%_75%,#f5f5f5_75%)] bg-[length:16px_16px]" : "bg-white"
                      )}
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button onClick={gate(() => handleDownload(url, index))} size="sm">
                        {canExport ? <Download className="h-4 w-4 mr-1" /> : <Lock className="h-4 w-4 mr-1" />}
                        {canExport ? "Download" : "Unlock"}
                      </Button>
                      <Button onClick={gate(() => setEditingFlatlay(index))} size="sm" variant="secondary">
                        <Pencil className="h-4 w-4 mr-1" /> Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              {editingFlatlay !== null && (
                <ImageEditModal
                  open={editingFlatlay !== null}
                  onOpenChange={(open) => { if (!open) setEditingFlatlay(null); }}
                  imageUrl={generatedImages[editingFlatlay]}
                  onEditComplete={(newUrl) => {
                    setGeneratedImages((prev) => {
                      const next = [...prev];
                      next[editingFlatlay!] = newUrl;
                      return next;
                    });
                  }}
                  isAdmin={isAdmin || hasAdminToken}
                />
              )}
            </div>
          ) : (
            <>
              {/* Step Tabs */}
              <div className="rounded-xl border bg-card/60 p-2 mb-6 flex items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1">
                  {(([
                    { key: "products", label: "Add Products", icon: Package },
                    { key: "style", label: "Style", icon: Palette },
                    { key: "settings", label: "Settings", icon: Settings },
                    { key: "summary", label: "Summary", icon: ListChecks },
                  ] as const).filter((s) => mode === "reference" || s.key !== "style")).map((s) => {
                    const Icon = s.icon;
                    const active = step === s.key;
                    return (
                      <button
                        key={s.key}
                        onClick={() => setStep(s.key)}
                        data-walkthrough-target={
                          s.key === "style" ? "tool-style" :
                          s.key === "settings" ? "tool-output" :
                          s.key === "summary" ? "tool-prompt" : undefined
                        }
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition",
                          active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {s.label}
                      </button>
                    );
                  })}
                </div>
                <Button
                  onClick={step === "summary" ? handleGenerate : goNext}
                  disabled={!canNext || isGenerating}
                  className="ml-auto"
                >
                  {step === "summary" ? (
                    <><Sparkles className="h-4 w-4 mr-2" /> Generate ({totalCost} credits)</>
                  ) : (
                    <>Next <ChevronRight className="h-4 w-4 ml-1" /></>
                  )}
                </Button>
              </div>

              {step === "products" && (
                <div className="space-y-6">
                  {/* Generation Mode */}
                  <div className="space-y-2" data-walkthrough-target="tool-model">
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Generation Mode
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <button
                        onClick={() => {
                          setMode("reference");
                          // Clear ai-guess assignments so the user can pick real styles.
                          setSelections((prev) => {
                            const next: Record<string, StyleSelection> = {};
                            for (const [k, v] of Object.entries(prev)) {
                              if (v.kind !== "ai-guess") next[k] = v;
                            }
                            return next;
                          });
                        }}
                        className={cn(
                          "rounded-xl border-2 p-4 text-left transition flex items-start gap-3",
                          mode === "reference" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/40"
                        )}
                      >
                        <div className={cn(
                          "h-5 w-5 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0",
                          mode === "reference" ? "border-primary" : "border-muted-foreground"
                        )}>
                          {mode === "reference" && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="font-semibold">Reference Based</div>
                            <span className="text-[10px] uppercase bg-primary/20 text-primary px-1.5 py-0.5 rounded">Recommended</span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            Choose a reference style from our library. Best accuracy.
                          </div>
                        </div>
                      </button>
                      <button
                        onClick={() => {
                          setMode("ai-guess");
                          // Mark every product as ai-guess.
                          setSelections(
                            Object.fromEntries(products.map((p) => [p.id, { kind: "ai-guess" } as StyleSelection]))
                          );
                        }}
                        className={cn(
                          "rounded-xl border-2 p-4 text-left transition flex items-start gap-3",
                          mode === "ai-guess" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/40"
                        )}
                      >
                        <div className={cn(
                          "h-5 w-5 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0",
                          mode === "ai-guess" ? "border-primary" : "border-muted-foreground"
                        )}>
                          {mode === "ai-guess" && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="font-semibold">Let AI Guess</div>
                            <span className="text-[10px] uppercase bg-blue-500/20 text-blue-500 px-1.5 py-0.5 rounded">Fast</span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            No reference needed — AI guesses the best flat lay arrangement.
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-xl font-bold">Add Products</h2>
                    <p className="text-sm text-muted-foreground">
                      Add up to {MAX_PRODUCTS} product images. Each becomes a separate flat lay.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4" data-walkthrough-target="tool-upload">
                    {products.map((p, idx) => (
                      <div key={p.id} className="space-y-1.5">
                        <div className="relative rounded-xl border bg-card overflow-hidden aspect-[3/4]">
                          <div className="absolute top-2 left-2 z-10 bg-background/80 px-2 py-0.5 rounded text-xs uppercase tracking-wide">
                            Product {idx + 1}
                          </div>
                          <button
                            onClick={() => removeProduct(p.id)}
                            className="absolute top-2 right-2 z-10 bg-background/80 rounded p-1 hover:bg-destructive/80 hover:text-destructive-foreground"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                          <img src={p.preview} alt="" className="w-full h-full object-cover" />
                        </div>
                        {p.labelPreview ? (
                          <div className="relative flex items-center gap-2 rounded-lg border bg-muted/30 p-1.5">
                            <img src={p.labelPreview} alt="" className="h-8 w-8 rounded object-cover bg-white border" />
                            <span className="text-[11px] text-muted-foreground flex-1 truncate">Neck label</span>
                            <button
                              onClick={() => setProductLabel(p.id, null)}
                              className="text-muted-foreground hover:text-destructive"
                              aria-label="Remove label"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <label className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed py-1.5 text-[11px] text-muted-foreground hover:border-primary/50 hover:bg-accent/30 cursor-pointer transition">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) setProductLabel(p.id, f);
                                e.target.value = "";
                              }}
                            />
                            <Tag className="h-3 w-3" />
                            <span>Add neck label (optional)</span>
                          </label>
                        )}
                      </div>
                    ))}
                    {products.length < MAX_PRODUCTS && (
                      <DragDropZone
                        onFileDrop={(files) => addFiles(files)}
                        accept="image/*"
                        multiple
                        className="block"
                      >
                        <label className="block aspect-[3/4] cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={(e) => e.target.files && addFiles(e.target.files)}
                          />
                          <div className="h-full rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-muted-foreground hover:border-primary/50 hover:bg-accent/30 transition">
                            <Upload className="h-8 w-8 mb-2" />
                            <span className="font-semibold text-sm text-foreground">Add Product</span>
                            <span className="text-xs">or drag & drop</span>
                            <span className="text-xs mt-1">{products.length}/{MAX_PRODUCTS}</span>
                          </div>
                        </label>
                      </DragDropZone>
                    )}
                  </div>
                </div>
              )}

              {step === "style" && (
                <div className="space-y-4">
                  {/* Output Type selector — Flatlay vs Halo Bust */}
                  <div className="space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Output Type
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(([
                        {
                          key: "flatlay",
                          title: "Flatlay",
                          desc: "Garment laid flat from above.",
                          badge: "Default",
                          badgeClass: "bg-primary/20 text-primary",
                        },
                        {
                          key: "halo_bust",
                          title: "Halo Bust",
                          desc: "Ghost-mannequin render with body shape. No model visible.",
                          badge: "New",
                          badgeClass: "bg-blue-500/20 text-blue-500",
                        },
                      ] as const)).map((opt) => {
                        const active = outputType === opt.key;
                        return (
                          <button
                            key={opt.key}
                            onClick={() => {
                              if (outputType === opt.key) return;
                              setOutputType(opt.key);
                              // Library swaps — drop library picks so they don't point at
                              // a reference from the other library. Keep ai-guess + user uploads.
                              setSelections((prev) => {
                                const next: Record<string, StyleSelection> = {};
                                for (const [k, v] of Object.entries(prev)) {
                                  if (v.kind !== "library") next[k] = v;
                                }
                                return next;
                              });
                            }}
                            className={cn(
                              "rounded-xl border-2 p-4 text-left transition flex items-start gap-3",
                              active ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/40"
                            )}
                          >
                            <div className={cn(
                              "h-5 w-5 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0",
                              active ? "border-primary" : "border-muted-foreground"
                            )}>
                              {active && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <div className="font-semibold">{opt.title}</div>
                                <span className={cn("text-[10px] uppercase px-1.5 py-0.5 rounded", opt.badgeClass)}>
                                  {opt.badge}
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {opt.desc}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h2 className="text-xl font-bold">Choose A Reference Style</h2>
                    <p className="text-sm text-muted-foreground">
                      Pick from the Floowy {outputType === "halo_bust" ? "Halo Bust" : "Flatlay"} library, upload your own (free, reusable forever), or let AI guess the layout.
                    </p>
                  </div>
                  <div>
                  <StylePickerPanel
                    userId={user?.id || null}
                    products={products.map((p) => ({ id: p.id, preview: p.preview }))}
                    selections={selections}
                    onSelectionsChange={setSelections}
                    onCreditsChanged={setCredits}
                    outputType={outputType}
                  />
                  </div>
                </div>
              )}

              {step === "settings" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold">Generation Settings</h2>
                    <p className="text-sm text-muted-foreground">Background, aspect ratio and resolution.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="rounded-xl border bg-card p-5 space-y-4">
                      <Label className="text-base font-semibold">Background</Label>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">Transparent Background</div>
                          <div className="text-xs text-muted-foreground">Remove the background after generation.</div>
                        </div>
                        <Switch checked={transparentBg} onCheckedChange={setTransparentBg} />
                      </div>
                      <div>
                        <Label className="mb-1 block text-sm">Background Color</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" disabled={transparentBg} className="w-full justify-start gap-3">
                              <div className="w-6 h-6 rounded border" style={{ backgroundColor: bgColor }} />
                              <span>{bgColor}</span>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <ChromePicker color={bgColor} onChange={(c) => setBgColor(c.hex)} disableAlpha />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    <div className="rounded-xl border bg-card p-5 space-y-4">
                      <Label className="text-base font-semibold">Aspect Ratio</Label>
                      <div className="grid grid-cols-4 gap-2">
                        {ASPECT_RATIOS.map((r) => (
                          <button
                            key={r.label}
                            onClick={() => setAspectRatio(r.label)}
                            className={cn(
                              "rounded-lg border-2 p-3 text-sm font-semibold transition",
                              aspectRatio === r.label ? "border-primary bg-primary/10" : "border-muted hover:bg-accent"
                            )}
                          >
                            {r.label}
                          </button>
                        ))}
                      </div>

                      <Label className="text-base font-semibold pt-2">Resolution</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {RESOLUTIONS.map((res) => (
                          <button
                            key={res.label}
                            onClick={() => setResolution(res.multiplier)}
                            className={cn(
                              "rounded-lg border-2 p-3 transition flex flex-col items-center",
                              resolution === res.multiplier ? "border-primary bg-primary/10" : "border-muted hover:bg-accent"
                            )}
                          >
                            <span className="font-bold">{res.label}</span>
                            <span className="text-xs text-muted-foreground">{res.credits} cr</span>
                          </button>
                        ))}
                      </div>

                      {/* Admin-only A/B controls. A fixed seed is what makes the
                          prompt comparison meaningful: without it two runs differ
                          for reasons unrelated to the wording. */}
                      {(isAdmin || hasAdminToken) && (
                        <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-3 space-y-3">
                          <Label className="text-sm font-semibold flex items-center gap-2">
                            <Shield className="h-3.5 w-3.5" /> Prompt A/B (admin only)
                          </Label>
                          <div className="grid grid-cols-2 gap-2">
                            {[1, 2].map((v) => (
                              <button
                                key={v}
                                onClick={() => setPromptVersion(v)}
                                className={cn(
                                  "rounded-lg border-2 p-2 text-sm transition",
                                  promptVersion === v
                                    ? "border-primary bg-primary/10"
                                    : "border-muted hover:bg-accent",
                                )}
                              >
                                {v === 1 ? "v1 (current)" : "v2 (consolidated)"}
                              </button>
                            ))}
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">
                              Seed — same seed + same inputs makes v1 and v2 comparable
                            </Label>
                            <div className="flex gap-2">
                              <Input
                                value={seedInput}
                                onChange={(e) => setSeedInput(e.target.value.replace(/[^0-9]/g, ""))}
                                placeholder="e.g. 12345 (blank = random)"
                                className="text-sm"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSeedInput(String(Math.floor(Math.random() * 1e9)))}
                              >
                                Roll
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border bg-card p-5 space-y-3">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div>
                        <Label className="text-base font-semibold flex items-center gap-2">
                          <Tag className="h-4 w-4" /> Neck Collar Label (optional)
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Upload a brand label and we'll composite it onto the inner back neckline of every product. Per-product labels (set in Add Products) override this.
                        </p>
                      </div>
                      {globalLabelPreview ? (
                        <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-2">
                          <img src={globalLabelPreview} alt="" className="h-12 w-12 rounded object-cover bg-white border" />
                          <button
                            onClick={() => setGlobalLabel(null)}
                            className="text-xs text-muted-foreground hover:text-destructive px-2"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <label className="flex items-center gap-2 rounded-lg border border-dashed px-4 py-2 text-sm text-muted-foreground hover:border-primary/50 hover:bg-accent/30 cursor-pointer transition">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) setGlobalLabel(f);
                              e.target.value = "";
                            }}
                          />
                          <Upload className="h-4 w-4" />
                          <span>Upload label</span>
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Fabric Close-up → Lining / Inside → Don'ts. Fixed order,
                      below Neck Collar Label, above the footer nav. */}
                  <ReferenceUploadBlock
                    icon={<Layers className="h-4 w-4" />}
                    title="Fabric Close-up (optional)"
                    description="Upload a close-up reference of the fabric and/or describe the material. We'll use this to render accurate texture, weave and sheen on the product."
                    inputLabel="Material description"
                    placeholder="e.g. wool, ribbed knit, recycled cotton"
                    file={fabricFile}
                    preview={fabricPreview}
                    onFileChange={(f) => setFabricRef(f)}
                    value={fabricDescription}
                    onValueChange={setFabricDescription}
                    maxLength={MAX_DESCRIPTION_LEN}
                  />

                  <ReferenceUploadBlock
                    icon={<Shirt className="h-4 w-4" />}
                    title="Lining / Inside (optional)"
                    description="Upload a reference of the inner lining and/or describe it. Used when the product shot shows an open collar, cuff or hem."
                    inputLabel="Lining description"
                    placeholder="e.g. striped lining, mesh interior"
                    file={liningFile}
                    preview={liningPreview}
                    onFileChange={(f) => setLiningRef(f)}
                    value={liningDescription}
                    onValueChange={setLiningDescription}
                    maxLength={MAX_DESCRIPTION_LEN}
                  />

                  {/* Exclusions. Styled apart from the two blocks above so it
                      reads as "what to leave out", not "what to include". */}
                  <div className="rounded-xl border border-destructive/30 bg-destructive/[0.03] p-5 space-y-3">
                    <div>
                      <Label className="text-base font-semibold flex items-center gap-2">
                        <Ban className="h-4 w-4" /> Don&apos;ts (optional negative prompt)
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Describe what should NOT appear on the generated product. Sent to the model
                        separately from the rest of the prompt, never merged into it.
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="flatlay-negative-prompt" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Negative prompt
                      </Label>
                      <Textarea
                        id="flatlay-negative-prompt"
                        value={negativePrompt}
                        onChange={(e) => setNegativePrompt(e.target.value.slice(0, MAX_DESCRIPTION_LEN))}
                        placeholder="e.g. no buttons, no zipper, no logo on the chest"
                        rows={3}
                      />
                      <div className="text-right text-[11px] text-muted-foreground">
                        {negativePrompt.length}/{MAX_DESCRIPTION_LEN}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === "summary" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold">Summary</h2>
                    <p className="text-sm text-muted-foreground">Review and generate.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="rounded-xl border bg-card p-5 space-y-3">
                      <div className="text-sm font-semibold">Products ({products.length})</div>
                      <div className="grid grid-cols-4 gap-2">
                        {products.map((p, i) => (
                          <img key={p.id} src={p.preview} alt={`Product ${i + 1}`} className="aspect-square object-cover rounded border" />
                        ))}
                      </div>
                    </div>
                    <div className="rounded-xl border bg-card p-5 space-y-3">
                      <div className="text-sm font-semibold">Styles per product</div>
                      {mode === "ai-guess" ? (
                        <div className="text-sm text-muted-foreground">AI Guess (no reference) for all products</div>
                      ) : (
                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                          {products.map((p, i) => {
                            const sel = selections[p.id];
                            return (
                              <div key={p.id} className="flex items-center gap-2 text-xs">
                                <img src={p.preview} alt="" className="w-10 h-10 rounded border object-cover" />
                                <span className="font-medium">#{i + 1}</span>
                                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                {sel && sel.kind !== "ai-guess" ? (
                                  <>
                                    <img src={sel.image_url} alt="" className="w-10 h-10 rounded border object-contain bg-white" />
                                    <span className="truncate">{sel.name}</span>
                                  </>
                                ) : (
                                  <span className="text-muted-foreground italic">No style selected</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      <div className="border-t pt-3 space-y-1 text-sm">
                        <div className="flex justify-between"><span className="text-muted-foreground">Aspect ratio</span><span className="font-medium">{aspectRatio}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Output type</span><span className="font-medium">{outputType === "halo_bust" ? "Halo Bust" : "Flatlay"}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Resolution</span><span className="font-medium">{RESOLUTIONS.find((r) => r.multiplier === resolution)?.label}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Background</span><span className="font-medium">{transparentBg ? "Transparent" : bgColor}</span></div>
                        {products.some((p) => p.labelFile) && (
                          <div className="flex justify-between gap-2"><span className="text-muted-foreground">Neck labels</span><span className="font-medium">{products.filter((p) => p.labelFile).length} of {products.length}</span></div>
                        )}
                      </div>
                      <div className="border-t pt-3 flex justify-between text-sm">
                        <span className="text-muted-foreground">Total cost</span>
                        <span className="font-bold">{totalCost} credits</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-8 flex items-center justify-between">
                <Button variant="ghost" onClick={goBack} disabled={step === "products"}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Back
                </Button>
                {step !== "summary" ? (
                  <Button onClick={goNext} disabled={!canNext}>
                    Next Step <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Button onClick={handleGenerate} disabled={isGenerating} size="lg">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate {products.length} Flatlay{products.length !== 1 ? "s" : ""} ({totalCost} credits)
                  </Button>
                )}
              </div>
            </>
          )}
        </div>

        <CreditsPurchaseDialog open={showCreditsPurchase} onOpenChange={setShowCreditsPurchase} />
        <UnlockDialog open={unlockOpen} onOpenChange={setUnlockOpen} />
      </div>
    </div>
  );
};

export default FlatlayStudio;