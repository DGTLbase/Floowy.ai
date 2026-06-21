import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Shield, Upload, Sparkles, Eye, RotateCcw } from "lucide-react";
import GenerationProgressOverlay from "@/components/GenerationProgressOverlay";
import { useGenerationProgress } from "@/hooks/useGenerationProgress";
import UploadArea from "@/components/UploadArea";
import ResultDisplay from "@/components/ResultDisplay";
import PlanCreditsDisplay from "@/components/PlanCreditsDisplay";
import UserMenu from "@/components/UserMenu";
import BackgroundSelector from "@/components/BackgroundSelector";
import BrushCanvas from "@/components/BrushCanvas";
import logoImage from "@/assets/floowy-logo.png";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useOnboardingCheck } from "@/hooks/useOnboardingCheck";
import { AdminToolsSidebar } from "@/components/AdminToolsSidebar";
import CreditsPurchaseDialog from "@/components/CreditsPurchaseDialog";
import { deductCredits } from "@/hooks/useCreditDeduction";

interface SceneAnalysis {
  lighting: string;
  environment: string;
  composition: string;
  color_palette: string[];
  mood: string;
  recognizable_elements: string[];
  product_type: string;
  model_description: string;
}

type Step = "upload" | "analyze" | "mask" | "generate" | "result";

const RemixStudioGenerator = () => {
  const [user, setUser] = useState<any>(null);
  const [credits, setCredits] = useState<number>(0);
  const [userPlan, setUserPlan] = useState<string>("free");
  const { isAdmin } = useAdminCheck();
  useOnboardingCheck();

  const [step, setStep] = useState<Step>("upload");
  const [sourcePhoto, setSourcePhoto] = useState<File | null>(null);
  const [sourcePhotoUrl, setSourcePhotoUrl] = useState<string>("");
  const [analysis, setAnalysis] = useState<SceneAnalysis | null>(null);
  const [maskDataUrl, setMaskDataUrl] = useState<string>("");
  const [customPrompt, setCustomPrompt] = useState<string>("");
  const [outputSize, setOutputSize] = useState({ width: 1024, height: 1024 });
  const [backgroundColor, setBackgroundColor] = useState<string>("#F8F8F8");
  const [selectedBackground, setSelectedBackground] = useState<string | null>("#F8F8F8");
  const [customBackgroundPrompt, setCustomBackgroundPrompt] = useState<string>("");

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [adminMode, setAdminMode] = useState(false);
  const [showCreditsPurchase, setShowCreditsPurchase] = useState(false);
  const genProgress = useGenerationProgress();

  const navigate = useNavigate();
  const { toast } = useToast();

  // Auth setup (same pattern as Idea Studio)
  useEffect(() => {
    const verifyAdmin = async () => {
      const token = localStorage.getItem('admin_token');
      if (!token) return;
      try {
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-auth`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
          body: JSON.stringify({ action: 'verify', token })
        });
        if (res.ok) {
          setAdminMode(true);
        } else {
          localStorage.removeItem('admin_token');
        }
      } catch {
        localStorage.removeItem('admin_token');
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (!session) await verifyAdmin();
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session) await verifyAdmin();
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchCredits();
      fetchUserPlan();
    }
  }, [user]);

  const fetchCredits = async () => {
    const { data } = await supabase.from("credits").select("balance").eq("user_id", user?.id).single();
    if (data) setCredits(data.balance);
  };

  const fetchUserPlan = async () => {
    const { data: profile } = await supabase.from("profiles").select("plan").eq("id", user?.id).single();
    if (profile) setUserPlan(profile.plan);
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  // Step 1 → 2: Upload + Auto-Analyze
  const handleUploadAndAnalyze = async () => {
    if (!sourcePhoto) {
      toast({ title: "Missing image", description: "Please upload a screenshot or advertisement", variant: "destructive" });
      return;
    }

    setIsAnalyzing(true);
    setStep("analyze");

    try {
      // Upload to imgbb
      const base64 = await fileToBase64(sourcePhoto);
      const { data: imgData, error: imgError } = await supabase.functions.invoke("upload-to-imgbb", {
        body: { image_base64: base64 },
      });
      if (imgError) throw imgError;
      const uploadedUrl = imgData.url;
      setSourcePhotoUrl(uploadedUrl);

      // Auto-analyze the scene
      const { data: analyzeData, error: analyzeError } = await supabase.functions.invoke("generate-remix-image", {
        body: { action: "analyze", image_url: uploadedUrl },
      });
      if (analyzeError) throw analyzeError;

      setAnalysis(analyzeData.analysis);
      setStep("mask");

      toast({ title: "Analysis complete!", description: "Scene has been analyzed. Use the brush to mark areas to replace, or generate directly." });
    } catch (error: any) {
      console.error("Analysis error:", error);
      toast({ title: "Analysis failed", description: "Something went wrong. Please try again.", variant: "destructive" });
      setStep("upload");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleMaskGenerated = useCallback((dataUrl: string) => {
    setMaskDataUrl(dataUrl);
  }, []);

  // Step 3: Generate
  const handleGenerate = async () => {
    const maxDimension = Math.max(outputSize.width, outputSize.height);
    const creditCost = maxDimension <= 1400 ? 2 : maxDimension <= 2800 ? 3 : 4;

    if (!isAdmin && !adminMode && credits < creditCost) {
      toast({ title: "Insufficient Credits", description: "You don't have enough credits!", variant: "destructive" });
      setShowCreditsPurchase(true);
      return;
    }

    setIsGenerating(true);
    genProgress.start();
    setStep("generate");

    try {
      // Upload mask if drawn
      let maskUrl: string | null = null;
      if (maskDataUrl) {
        const maskBase64 = maskDataUrl.split(',')[1];
        const { data: maskData, error: maskError } = await supabase.functions.invoke("upload-to-imgbb", {
          body: { image_base64: maskBase64 },
        });
        if (maskError) throw maskError;
        maskUrl = maskData.url;
      }

      // Build prompt from analysis + user input
      let prompt = "";
      if (analysis) {
        prompt = `Recreate this advertisement scene with a COMPLETELY NEW and UNIQUE environment that captures the same vibe and mood.

ORIGINAL SCENE ANALYSIS:
- Lighting: ${analysis.lighting}
- Environment: ${analysis.environment}
- Composition: ${analysis.composition}
- Mood: ${analysis.mood}
- Color palette: ${analysis.color_palette?.join(", ") || "neutral tones"}

CRITICAL REQUIREMENTS:
1. REMOVE all these recognizable elements: ${analysis.recognizable_elements?.join(", ") || "brand logos, identifiable faces"}
2. Generate COMPLETELY NEW models/people with different faces, body types, and styling
3. Create a NEW environment that captures the "${analysis.mood}" mood but is visually distinct
4. Maintain the same ${analysis.lighting} lighting style
5. Follow the same ${analysis.composition} composition
6. Apply real-life photo imperfections: natural film grain, subtle depth-of-field blur, minor lens distortion, realistic skin textures
7. The result MUST look like an authentic photograph, NOT AI-generated
8. NO recognizable brand elements, logos, or trademarked items`;
      }

      if (customPrompt) {
        prompt += `\n\nADDITIONAL USER INSTRUCTIONS:\n${customPrompt}`;
      }

      // Determine aspect ratio
      const ratio = outputSize.width / outputSize.height;
      let aspectRatio = "1:1";
      if (Math.abs(ratio - 16/9) < 0.05) aspectRatio = "16:9";
      else if (Math.abs(ratio - 9/16) < 0.05) aspectRatio = "9:16";
      else if (Math.abs(ratio - 4/3) < 0.05) aspectRatio = "4:3";
      else if (Math.abs(ratio - 3/4) < 0.05) aspectRatio = "3:4";

      let resolution = "1K";
      if (maxDimension > 1400 && maxDimension <= 2800) resolution = "2K";
      else if (maxDimension > 2800) resolution = "4K";

      genProgress.setGenerating("AI is remixing your advertisement...");
      const { data: generateData, error: generateError } = await supabase.functions.invoke("generate-remix-image", {
        body: {
          action: "generate",
          image_url: sourcePhotoUrl,
          mask_url: maskUrl,
          prompt,
          aspect_ratio: aspectRatio,
          resolution,
        },
      });
      if (generateError) throw generateError;

      const requestId = generateData.request_id;
      if (!requestId) throw new Error("No request_id returned");

      // Poll for completion
      let attempts = 0;
      const maxAttempts = 180;
      let completed = false;
      let imageUrls: string[] = [];

      while (!completed && attempts < maxAttempts) {
        await new Promise(r => setTimeout(r, 2000));
        const { data: statusData, error: statusError } = await supabase.functions.invoke("generate-remix-image", {
          body: { action: "status", requestId },
        });
        if (statusError) throw statusError;

        if (statusData.status === "COMPLETED") {
          genProgress.setFinalizing("Saving your images...");
          imageUrls = statusData.images?.map((img: any) => img.url) || [];
          if (!imageUrls.length) throw new Error("No images returned");
          completed = true;
        } else if (statusData.status === "FAILED") {
          throw new Error(statusData.error || "Generation failed");
        }
        attempts++;
      }

      if (!completed) throw new Error("Generation timeout - please try again");

      // Save + deduct credits
      if (user?.id) {
        await supabase.from("generations").insert(imageUrls.map((url) => ({
          user_id: user.id,
          original_image_url: sourcePhotoUrl,
          generated_image_url: url,
          prompt: prompt.slice(0, 500),
          status: "completed",
          tool_name: "remix-studio",
        })));
      }

      if (!isAdmin && !adminMode && user?.id) {
        const newBalance = await deductCredits(user.id, creditCost);
        setCredits(newBalance);
      }

      genProgress.complete();
      setGeneratedImages(imageUrls);
      setStep("result");
      toast({ title: "Success!", description: "Your remixed images have been generated" });
    } catch (error: any) {
      genProgress.fail("Something went wrong. Please try again.");
      console.error("Generation error:", error);
      toast({ title: "Generation Failed", description: "Something went wrong. Please try again.", variant: "destructive" });
      setStep("mask");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setStep("upload");
    setSourcePhoto(null);
    setSourcePhotoUrl("");
    setAnalysis(null);
    setMaskDataUrl("");
    setCustomPrompt("");
    setGeneratedImages([]);
  };

  const getCreditCost = () => {
    const maxDimension = Math.max(outputSize.width, outputSize.height);
    return maxDimension <= 1400 ? 2 : maxDimension <= 2800 ? 3 : 4;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-secondary/20 to-background flex">
      {isAdmin && <AdminToolsSidebar />}

      <div className="flex-1 flex flex-col">
        {/* Navigation */}
        <nav className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/home" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <img src={logoImage} alt="Floowy.ai" className="h-8 w-auto" />
                <span className="font-bold text-xl text-foreground">Floowy.ai</span>
              </Link>
            </div>
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

        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Remix Studio</h2>
              <p className="text-muted-foreground text-lg">
                Upload an advertisement, let AI analyze the scene, then remix it into something unique
              </p>
            </div>

            {/* Progress indicator */}
            <div className="flex items-center justify-center gap-2 mb-8">
              {["Upload", "Analyze", "Mask & Edit", "Generate"].map((label, i) => {
                const steps: Step[] = ["upload", "analyze", "mask", "generate"];
                const currentIdx = steps.indexOf(step === "result" ? "generate" : step);
                const isActive = i <= currentIdx;
                return (
                  <div key={label} className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      {i + 1}
                    </div>
                    <span className={`text-sm hidden sm:inline ${isActive ? "text-foreground font-medium" : "text-muted-foreground"}`}>{label}</span>
                    {i < 3 && <div className={`w-8 h-px ${isActive ? "bg-primary" : "bg-border"}`} />}
                  </div>
                );
              })}
            </div>

            {/* Step: Result */}
            {step === "result" && generatedImages.length > 0 && (
              <ResultDisplay
                imageUrls={generatedImages}
                onReset={handleReset}
                onRegenerate={handleGenerate}
                isRegenerating={isGenerating}
                isAdmin={isAdmin || adminMode}
              />
            )}

            {/* Step: Upload */}
            {step === "upload" && (
              <div className="space-y-6">
                <div className="bg-card rounded-xl border border-border p-6">
                  <UploadArea
                    label="Upload Screenshot / Advertisement"
                    onFileSelect={setSourcePhoto}
                    selectedFile={sourcePhoto}
                    compact
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Upload the advertisement you want to remix. The AI will analyze its scene, lighting, and composition.
                  </p>
                </div>

                <div className="flex justify-center">
                  <Button onClick={handleUploadAndAnalyze} disabled={!sourcePhoto || isAnalyzing} size="lg" className="w-full max-w-md">
                    {isAnalyzing ? (
                      <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Analyzing Scene...</>
                    ) : (
                      <><Sparkles className="mr-2 h-5 w-5" />Upload & Analyze</>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Step: Analyzing overlay */}
            <GenerationProgressOverlay
              open={step === "analyze" && isAnalyzing}
              stage="generating"
              progress={50}
              statusMessage="Detecting lighting, environment, composition & brand elements"
              title="Analyzing Your Advertisement"
              onClose={() => {}}
            />

            {/* Step: Mask & Edit */}
            {step === "mask" && analysis && (
              <div className="space-y-6">
                {/* Analysis summary */}
                <div className="bg-card rounded-xl border border-border p-6">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Eye className="h-5 w-5 text-primary" />
                    Scene Analysis
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div><span className="text-muted-foreground">Lighting:</span> <span className="text-foreground">{analysis.lighting}</span></div>
                    <div><span className="text-muted-foreground">Environment:</span> <span className="text-foreground">{analysis.environment}</span></div>
                    <div><span className="text-muted-foreground">Composition:</span> <span className="text-foreground">{analysis.composition}</span></div>
                    <div><span className="text-muted-foreground">Mood:</span> <span className="text-foreground">{analysis.mood}</span></div>
                    {analysis.recognizable_elements?.length > 0 && (
                      <div className="sm:col-span-2">
                        <span className="text-muted-foreground">Elements to remove:</span> <span className="text-destructive">{analysis.recognizable_elements.join(", ")}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Brush canvas */}
                <div className="bg-card rounded-xl border border-border p-6">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Upload className="h-5 w-5 text-primary" />
                    Brush Tool — Mark Areas for Replacement
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Paint over specific areas you want the AI to replace. Leave blank to let AI decide what to change.
                  </p>
                  <BrushCanvas
                    imageUrl={sourcePhotoUrl}
                    onMaskGenerated={handleMaskGenerated}
                  />
                </div>

                {/* Custom prompt */}
                <div className="bg-card rounded-xl border border-border p-6">
                  <label className="block text-sm font-medium mb-2 text-foreground">
                    Additional Instructions (Optional)
                  </label>
                  <Textarea
                    placeholder="e.g., Make the environment more tropical, use warmer tones, add a sunset feel..."
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    className="min-h-[80px] resize-none"
                  />
                </div>

                {/* Output Size */}
                <BackgroundSelector
                  backgroundColor={backgroundColor}
                  onColorChange={setBackgroundColor}
                  selectedBackground={selectedBackground}
                  onBackgroundSelect={setSelectedBackground}
                  customBackgroundPrompt={customBackgroundPrompt}
                  onCustomBackgroundPromptChange={setCustomBackgroundPrompt}
                  outputSize={outputSize}
                  onOutputSizeChange={setOutputSize}
                  hideBackgroundOptions={true}
                />

                {/* Generate button */}
                <div className="flex justify-center">
                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating || (!isAdmin && !adminMode && credits < getCreditCost())}
                    size="lg"
                    className="w-full max-w-md"
                  >
                    {isGenerating ? (
                      <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Remixing...</>
                    ) : (
                      <>{isAdmin || adminMode ? "Generate Remix (Admin - Free)" : `Generate Remix (${getCreditCost()} credits)`}</>
                    )}
                  </Button>
                </div>

                {!isAdmin && !adminMode && credits < getCreditCost() && (
                  <p className="text-center text-sm text-destructive">
                    You need at least {getCreditCost()} credits to generate images
                  </p>
                )}
              </div>
            )}

            {/* Generating overlay */}
            <GenerationProgressOverlay
              open={genProgress.isActive || genProgress.stage === "failed"}
              stage={genProgress.stage}
              progress={genProgress.progress}
              statusMessage={genProgress.statusMessage}
              title="Remixing Your Advertisement"
              onRetry={() => { genProgress.reset(); handleGenerate(); }}
              onClose={() => genProgress.reset()}
            />
          </div>
        </main>
      </div>

      <CreditsPurchaseDialog open={showCreditsPurchase} onOpenChange={setShowCreditsPurchase} />
    </div>
  );
};

export default RemixStudioGenerator;
