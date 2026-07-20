import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Shield } from "lucide-react";
import GenerationProgressOverlay from "@/components/GenerationProgressOverlay";
import { useGenerationProgress } from "@/hooks/useGenerationProgress";
import UploadArea from "@/components/UploadArea";
import ResultDisplay from "@/components/ResultDisplay";
import PlanCreditsDisplay from "@/components/PlanCreditsDisplay";
import UserMenu from "@/components/UserMenu";
import ModelSelector from "@/components/ModelSelector";
import BackgroundSelector from "@/components/BackgroundSelector";
import CameraStylePresetSelect from "@/components/CameraStylePresetSelect";
import { cameraStylePrompt, CAMERA_STYLE_NONE } from "@/lib/camera-style-presets";
import logoImage from "@/assets/floowy-logo.png";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useOnboardingCheck } from "@/hooks/useOnboardingCheck";
import { AdminToolsSidebar } from "@/components/AdminToolsSidebar";
import CreditsPurchaseDialog from "@/components/CreditsPurchaseDialog";
import { deductCredits } from "@/hooks/useCreditDeduction";

const IdeaStudioGenerator = () => {
  const [user, setUser] = useState<any>(null);
  const [credits, setCredits] = useState<number>(0);
  const [userPlan, setUserPlan] = useState<string>("free");
  const { isAdmin } = useAdminCheck();
  useOnboardingCheck();
  const [referencePhoto, setReferencePhoto] = useState<File | null>(null);
  const [productPhoto, setProductPhoto] = useState<File | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [customModelPhoto, setCustomModelPhoto] = useState<File | null>(null);
  const [backgroundPrompt, setBackgroundPrompt] = useState("");
  const [backgroundColor, setBackgroundColor] = useState<string>("#F8F8F8");
  const [selectedBackground, setSelectedBackground] = useState<string | null>("#F8F8F8");
  const [customBackgroundPrompt, setCustomBackgroundPrompt] = useState<string>("");
  const [cameraStyle, setCameraStyle] = useState<string>(CAMERA_STYLE_NONE);
  const [outputSize, setOutputSize] = useState({ width: 1024, height: 1024 });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [adminMode, setAdminMode] = useState(false);
  const [showCreditsPurchase, setShowCreditsPurchase] = useState(false);
  const genProgress = useGenerationProgress();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const verifyAdmin = async () => {
      const token = localStorage.getItem('admin_token');
      if (!token) return false;
      try {
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-auth`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
          body: JSON.stringify({ action: 'verify', token })
        });
        if (res.ok) { setAdminMode(true); return true; }
      } catch {}
      return false;
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) { setTimeout(() => verifyAdmin(), 0); }
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session) { await verifyAdmin(); }
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
    const { data, error } = await supabase
      .from("credits")
      .select("balance")
      .eq("user_id", user?.id)
      .single();

    if (data) setCredits(data.balance);
  };

  const fetchUserPlan = async () => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", user?.id)
      .single();

    if (profile) {
      setUserPlan(profile.plan);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleGenerate = async () => {
    if (!referencePhoto) {
      toast({
        title: "Missing reference photo",
        description: "Please upload a reference photo",
        variant: "destructive",
      });
      return;
    }

    if (!productPhoto) {
      toast({
        title: "Missing product photo",
        description: "Please upload a product photo",
        variant: "destructive",
      });
      return;
    }

    const maxDimension = Math.max(outputSize.width, outputSize.height);
    const creditCost = maxDimension <= 1400 ? 2 : maxDimension <= 2800 ? 3 : 4;
    
    if (!isAdmin && !adminMode && credits < creditCost) {
      toast({
        title: "Insufficient Credits",
        description: "You don't have enough credits!",
        variant: "destructive",
      });
      setShowCreditsPurchase(true);
      return;
    }

    setIsGenerating(true);
    genProgress.start();

    try {
      // Helper function to convert file to base64
      const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64String = reader.result as string;
            resolve(base64String.split(',')[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      };

      // Convert and upload reference photo
      const referenceBase64 = await fileToBase64(referencePhoto);
      const { data: refData, error: refError } = await supabase.functions.invoke(
        "upload-to-imgbb",
        { body: { image_base64: referenceBase64 } }
      );
      if (refError) throw refError;
      const referenceUrl = refData.url;

      // Convert and upload product photo
      const productBase64 = await fileToBase64(productPhoto);
      const { data: prodData, error: prodError } = await supabase.functions.invoke(
        "upload-to-imgbb",
        { body: { image_base64: productBase64 } }
      );
      if (prodError) throw prodError;
      const productUrl = prodData.url;

      // Handle model photo (either existing or custom) - optional
      let modelUrl = selectedModel || null;
      if (customModelPhoto) {
        const modelBase64 = await fileToBase64(customModelPhoto);
        const { data: modelData, error: modelError } = await supabase.functions.invoke(
          "upload-to-imgbb",
          { body: { image_base64: modelBase64 } }
        );
        if (modelError) throw modelError;
        modelUrl = modelData.url;
      }

      // Determine aspect ratio based on output size
      const determineAspectRatio = (width: number, height: number): string => {
        const ratio = width / height;
        const tolerance = 0.05;
        
        if (Math.abs(ratio - 21/9) < tolerance) return "21:9";
        if (Math.abs(ratio - 16/9) < tolerance) return "16:9";
        if (Math.abs(ratio - 3/2) < tolerance) return "3:2";
        if (Math.abs(ratio - 4/3) < tolerance) return "4:3";
        if (Math.abs(ratio - 5/4) < tolerance) return "5:4";
        if (Math.abs(ratio - 1) < tolerance) return "1:1";
        if (Math.abs(ratio - 4/5) < tolerance) return "4:5";
        if (Math.abs(ratio - 3/4) < tolerance) return "3:4";
        if (Math.abs(ratio - 2/3) < tolerance) return "2:3";
        if (Math.abs(ratio - 9/16) < tolerance) return "9:16";
        
        return "1:1"; // default
      };

      const aspectRatio = determineAspectRatio(outputSize.width, outputSize.height);
      console.log('Using aspect ratio:', aspectRatio, 'size:', outputSize);

      // Determine resolution tier based on max dimension
      const maxDimension = Math.max(outputSize.width, outputSize.height);
      let resolution = "1K"; // Default
      if (maxDimension > 1400 && maxDimension <= 2800) {
        resolution = "2K";
      } else if (maxDimension > 2800) {
        resolution = "4K";
      }

      genProgress.setGenerating("AI is reimagining your image...");
      // Append camera style preset to the main text prompt when selected
      const cam = cameraStylePrompt(cameraStyle);
      const finalPrompt = cam ? `${backgroundPrompt}. ${cam}` : backgroundPrompt;
      // Call generate-idea-image function to start generation
      const { data: generateData, error: generateError } = await supabase.functions.invoke(
        "generate-idea-image",
        {
          body: {
            action: 'generate',
            reference_url: referenceUrl,
            product_url: productUrl,
            model_url: modelUrl,
            background_prompt: finalPrompt,
            aspect_ratio: aspectRatio,
            resolution,
          },
        }
      );

      if (generateError) throw generateError;

      const requestId = generateData.request_id;
      if (!requestId) {
        throw new Error('No request_id returned from generation');
      }

      console.log('Generation started with request_id:', requestId);

      // Poll for completion
      let attempts = 0;
      const maxAttempts = 180; // 180 attempts * 2 seconds = 6 minutes max
      let completed = false;
      let imageUrls: string[] = [];

      while (!completed && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        
        const { data: statusData, error: statusError } = await supabase.functions.invoke(
          "generate-idea-image",
          {
            body: {
              action: 'status',
              requestId,
            },
          }
        );

        if (statusError) throw statusError;

        console.log(`Polling attempt ${attempts + 1}/${maxAttempts}, status: ${statusData.status}`);

        if (statusData.status === 'COMPLETED') {
          genProgress.setFinalizing("Saving your images...");
          imageUrls = statusData.images?.map((img: any) => img.url) || [];
          if (!imageUrls.length) {
            throw new Error('No images returned from generation');
          }
          completed = true;
        } else if (statusData.status === 'FAILED') {
          throw new Error(statusData.error || 'Generation failed');
        }

        attempts++;
      }

      if (!completed) {
        throw new Error('Generation timeout - please try again');
      }

      console.log('Generated images:', imageUrls);

      // Save generations to database (only if user exists)
      if (user?.id) {
        const rows = imageUrls.map((url: string) => ({
          user_id: user.id,
          original_image_url: referenceUrl,
          generated_image_url: url,
          prompt: `Product: ${productUrl}, Model: ${modelUrl}${backgroundPrompt ? `, Background: ${backgroundPrompt}` : ''}`,
          status: 'completed',
          tool_name: 'idea-studio',
        }));
        await supabase.from("generations").insert(rows);
      }

      // Calculate credit cost based on resolution tier
      const creditCost = resolution === "1K" ? 2 : resolution === "2K" ? 3 : 4;

      // Deduct credits for both images (skip for admins)
      if (!isAdmin && !adminMode && user?.id) {
        const newBalance = await deductCredits(user.id, creditCost);
        setCredits(newBalance);
      }
      genProgress.complete();
      setGeneratedImages(imageUrls);

      toast({
        title: "Success!",
        description: "Your reimagined images have been generated",
      });
    } catch (error: any) {
      genProgress.fail("Something went wrong. Please try again.");
      console.error("Generation error:", error);
      toast({
        title: "Generation Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setGeneratedImages([]);
    setReferencePhoto(null);
    setProductPhoto(null);
    setSelectedModel("");
    setCustomModelPhoto(null);
    setBackgroundPrompt("");
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
                <PlanCreditsDisplay 
                  plan={userPlan} 
                  credits={credits} 
                  onAddCredits={() => setShowCreditsPurchase(true)} 
                />
                <UserMenu onAddCredits={() => setShowCreditsPurchase(true)} />
              </div>
            )}
          </div>
        </nav>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Idea Studio
            </h2>
            <p className="text-muted-foreground text-lg">
              Upload your reference, product, and choose a model to reimagine your scene
            </p>
            <Link to="/knowledge-base/idea-studio" className="text-sm text-primary hover:underline mt-2 inline-block">
              Need More Clarity? Check our detailed knowledge base guide for step-by-step instructions
            </Link>
          </div>

          {generatedImages.length > 0 ? (
            <ResultDisplay
              imageUrls={generatedImages}
              onReset={handleReset}
              onRegenerate={handleGenerate}
              isRegenerating={isGenerating}
              isAdmin={isAdmin || adminMode}
            />
          ) : (
            <div className="space-y-6">
              {/* Reference Photo and Upload Product Photo - Equal Size */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6" data-walkthrough-target="tool-upload">
                <div className="bg-card rounded-xl border border-border p-6">
                  <UploadArea
                    label="Reference Photo"
                    onFileSelect={setReferencePhoto}
                    selectedFile={referencePhoto}
                    compact
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Upload a reference photo to base your scene on
                  </p>
                </div>

                <div className="bg-card rounded-xl border border-border p-6">
                  <UploadArea
                    label="Upload Product Photo"
                    onFileSelect={setProductPhoto}
                    selectedFile={productPhoto}
                    compact
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Upload the product you want to feature in the scene
                  </p>
                </div>
              </div>

              {/* Model Selector with integrated upload */}
              <div className="bg-card rounded-xl border border-border p-6" data-walkthrough-target="tool-model">
                <label className="block text-sm font-medium mb-4 text-foreground">
                  Select Avatar (Optional)
                </label>
                <ModelSelector
                    selectedModel={selectedModel}
                    onModelSelect={(model) => {
                      setSelectedModel(model);
                      if (model) setCustomModelPhoto(null);
                    }}
                    customModelFile={customModelPhoto}
                    onCustomModelFileChange={(file) => {
                      setCustomModelPhoto(file);
                      if (file) setSelectedModel("");
                    }}
                  />
              </div>

              {/* Background & Lighting Prompt */}
              <div className="bg-card rounded-xl border border-border p-6" data-walkthrough-target="tool-prompt">
                <label className="block text-sm font-medium mb-2 text-foreground">
                  Background & Lighting Prompt (Optional)
                </label>
                <p className="text-xs text-muted-foreground mb-3">
                  Describe the background setting and lighting style you want for your generated image
                </p>
                <Textarea
                  placeholder="e.g., Soft natural sunlight in a modern minimalist living room with white walls and wooden floor..."
                  value={backgroundPrompt}
                  onChange={(e) => setBackgroundPrompt(e.target.value)}
                  className="min-h-[100px] resize-none"
                />
                <div className="mt-4">
                  <CameraStylePresetSelect value={cameraStyle} onChange={setCameraStyle} />
                </div>
              </div>

              {/* Output Size Selector */}
              <div data-walkthrough-target="tool-style">
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
              </div>

              <div className="flex justify-center" data-walkthrough-target="tool-output">
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || !referencePhoto || !productPhoto || (!isAdmin && !adminMode && credits < (() => {
                    const maxDimension = Math.max(outputSize.width, outputSize.height);
                    return maxDimension <= 1400 ? 2 : maxDimension <= 2800 ? 3 : 4;
                  })())}
                  size="lg"
                  className="w-full max-w-md"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      {isAdmin || adminMode ? "Generate Reimagined Scene (Admin - Free)" : (() => {
                        const maxDimension = Math.max(outputSize.width, outputSize.height);
                        const creditCost = maxDimension <= 1400 ? 2 : maxDimension <= 2800 ? 3 : 4;
                        return `Generate Reimagined Scene (${creditCost} credits)`;
                      })()}
                    </>
                  )}
                </Button>
              </div>

              {!isAdmin && !adminMode && (() => {
                const maxDimension = Math.max(outputSize.width, outputSize.height);
                const creditCost = maxDimension <= 1400 ? 2 : maxDimension <= 2800 ? 3 : 4;
                return credits < creditCost ? (
                  <p className="text-center text-sm text-destructive">
                    You need at least {creditCost} credits to generate images
                  </p>
                ) : null;
              })()}
            </div>
          )}

          <GenerationProgressOverlay
            open={genProgress.isActive || genProgress.stage === "failed"}
            stage={genProgress.stage}
            progress={genProgress.progress}
            statusMessage={genProgress.statusMessage}
            title="Reimagining Your Image"
            onRetry={() => { genProgress.reset(); handleGenerate(); }}
            onClose={() => genProgress.reset()}
          />
        </div>
      </main>
      </div>

      <CreditsPurchaseDialog 
        open={showCreditsPurchase}
        onOpenChange={setShowCreditsPurchase}
      />
    </div>
  );
};

export default IdeaStudioGenerator;
