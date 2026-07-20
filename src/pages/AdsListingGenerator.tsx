import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Download, RotateCcw, Sparkles, Loader2, ArrowLeft, Pencil, Upload, Wand2, Image as ImageIcon, Lock } from "lucide-react";
import GenerationProgressOverlay from "@/components/GenerationProgressOverlay";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import UploadArea from "@/components/UploadArea";
import ImageEditModal from "@/components/ImageEditModal";
import AdTextConfig, { TextElementConfig, LogoConfig } from "@/components/ads/AdTextConfig";
import AdOutputSettings from "@/components/ads/AdOutputSettings";
import AdModelSelector, { ModelMode, HandInteraction, ModelSource } from "@/components/ads/AdModelSelector";
import AdBackgroundSettings from "@/components/ads/AdBackgroundSettings";
import CameraStylePresetSelect from "@/components/CameraStylePresetSelect";
import { cameraStylePrompt, CAMERA_STYLE_NONE } from "@/lib/camera-style-presets";
import PlanCreditsDisplay from "@/components/PlanCreditsDisplay";
import UserMenu from "@/components/UserMenu";
import logoImage from "@/assets/floowy-logo.png";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useImageGating } from "@/hooks/useImageGating";
import { UnlockDialog } from "@/components/UnlockDialog";
import { useAdminToken } from "@/hooks/useAdminToken";
import { useOnboardingCheck } from "@/hooks/useOnboardingCheck";
import { checkAndSendOutOfCreditsEmail, deductCredits } from "@/hooks/useCreditDeduction";
import { Helmet } from "react-helmet-async";

const DEFAULT_CREDIT_COST = 2;

// Load Google Fonts dynamically
const loadGoogleFont = (fontFamily: string) => {
  const link = document.createElement('link');
  link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/ /g, '+')}:wght@400;500;600;700;900&ital,wght@0,400;0,700;1,400;1,700&display=swap`;
  link.rel = 'stylesheet';
  if (!document.querySelector(`link[href="${link.href}"]`)) {
    document.head.appendChild(link);
  }
};

const getAspectRatioFromSize = (size: string): string => {
  const [w, h] = size.split('x').map(Number);
  return `${w}/${h}`;
};

const AdsListingGenerator = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAdminCheck();
  const hasAdminToken = useAdminToken();
  const isAdminTool = isAdmin || hasAdminToken;
  useOnboardingCheck();
  const canvasRef = useRef<HTMLDivElement>(null);

  // User state
  const [user, setUser] = useState<any>(null);
  const [credits, setCredits] = useState(0);
  const [userPlan, setUserPlan] = useState<string>("free");
  const [userEmail, setUserEmail] = useState<string>("");
  const [userName, setUserName] = useState<string>("");

  // Upload state
  const [productFile, setProductFile] = useState<File | null>(null);
  const [productUrl, setProductUrl] = useState<string | null>(null);

  // Output settings
  const [outputSize, setOutputSize] = useState("1080x1080");
  const [creditCost, setCreditCost] = useState(DEFAULT_CREDIT_COST);
  const [backgroundColor, setBackgroundColor] = useState("#1a1a2e");
  const [useCustomBackground, setUseCustomBackground] = useState(false);
  const [backgroundPrompt, setBackgroundPrompt] = useState("");
  
  // Model settings
  const [modelMode, setModelMode] = useState<ModelMode>("none");
  const [handInteraction, setHandInteraction] = useState<HandInteraction>("auto");
  const [customModelFile, setCustomModelFile] = useState<File | null>(null);
  const [selectedModelUrl, setSelectedModelUrl] = useState<string | null>(null);
  const [modelSource, setModelSource] = useState<ModelSource>("floowy");
  const [autoGender, setAutoGender] = useState("female");

  // Camera style preset
  const [cameraStyle, setCameraStyle] = useState<string>(CAMERA_STYLE_NONE);

  // Modal state
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  
  // CTA toggle
  const [ctaEnabled, setCtaEnabled] = useState(true);

  // Logo configuration
  const [logoConfig, setLogoConfig] = useState<LogoConfig>({
    file: null,
    url: null,
    position: 'bottom-center',
    size: 60,
    enabled: false
  });

  // Text elements configuration
  const [textElements, setTextElements] = useState<TextElementConfig[]>([
    {
      id: 'headline',
      type: 'headline',
      text: '',
      position: 'top-center',
      fontSize: 36,
      color: '#ffffff',
      fontFamily: 'Inter',
      fontWeight: 'bold',
      fontStyle: 'normal',
      textDecoration: 'none',
    },
    {
      id: 'subheadline',
      type: 'subheadline',
      text: '',
      position: 'top-center',
      fontSize: 20,
      color: '#e0e0e0',
      fontFamily: 'Inter',
      fontWeight: 'normal',
      fontStyle: 'normal',
      textDecoration: 'none',
    },
    {
      id: 'cta',
      type: 'cta',
      text: 'Shop Now',
      position: 'bottom-center',
      fontSize: 18,
      color: '#ffffff',
      fontFamily: 'Inter',
      fontWeight: 'bold',
      fontStyle: 'normal',
      textDecoration: 'none',
      backgroundColor: '#10b981',
    },
  ]);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [genStage, setGenStage] = useState<string>("uploading");
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [generatedImageUrls, setGeneratedImageUrls] = useState<string[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [editingAdImage, setEditingAdImage] = useState(false);
  const { canExport, displayUrl, gate, unlockOpen, setUnlockOpen } = useImageGating({
    isAdmin: isAdmin || hasAdminToken,
    urls: generatedImageUrl ? [generatedImageUrl] : [],
  });

  // Auth and credits
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Defer supabase-touching work — calling it inside the callback deadlocks the auth lock.
      if (session?.user) {
        setUser(session.user);
        setTimeout(() => fetchCredits(session.user.id), 0);
      }
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchCredits(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchCredits = async (userId: string) => {
    const { data, error } = await supabase
      .from("credits")
      .select("balance")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Error fetching credits:", error);
      return;
    }

    setCredits(data?.balance || 0);

    const { data: profileData } = await supabase
      .from("profiles")
      .select("email, full_name, plan")
      .eq("id", userId)
      .single();

    if (profileData) {
      setUserEmail(profileData.email || "");
      setUserName(profileData.full_name || "");
      setUserPlan(profileData.plan || "free");
    }
  };

  // Load fonts when elements change
  useEffect(() => {
    const uniqueFonts = [...new Set(textElements.map(el => el.fontFamily))];
    uniqueFonts.forEach(loadGoogleFont);
  }, [textElements]);

  const handleProductSelect = async (file: File) => {
    setProductFile(file);
    const url = URL.createObjectURL(file);
    setProductUrl(url);
  };

  const headline = textElements.find(el => el.type === 'headline');

  const handleGenerate = async () => {
    if (!productUrl || !headline?.text?.trim()) {
      toast.error("Please upload a product and enter a headline");
      return;
    }

    if (!isAdmin && !hasAdminToken && credits < creditCost) {
      toast.error("Not enough credits");
      return;
    }

    setIsGenerating(true);
    setGenStage("uploading");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in to generate");
        navigate("/auth");
        return;
      }

      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(productFile!);
      });
      const base64Image = await base64Promise;

      // Convert logo to base64 if present
      let logoBase64: string | null = null;
      if (logoConfig.file) {
        const logoReader = new FileReader();
        const logoBase64Promise = new Promise<string>((resolve) => {
          logoReader.onload = () => resolve(logoReader.result as string);
          logoReader.readAsDataURL(logoConfig.file!);
        });
        logoBase64 = await logoBase64Promise;
      }

      // Convert custom model to base64 if present
      let customModelBase64: string | null = null;
      if (customModelFile && modelMode === 'model') {
        const modelReader = new FileReader();
        const modelBase64Promise = new Promise<string>((resolve) => {
          modelReader.onload = () => resolve(modelReader.result as string);
          modelReader.readAsDataURL(customModelFile);
        });
        customModelBase64 = await modelBase64Promise;
      }
      
      // If model mode with selected avatar URL (not custom upload), fetch and convert
      let modelUrlBase64: string | null = null;
      if (modelMode === 'model' && selectedModelUrl && !customModelFile) {
        const response = await fetch(selectedModelUrl);
        const blob = await response.blob();
        const reader = new FileReader();
        modelUrlBase64 = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      }

      // Calculate aspect ratio from output size
      const [outputWidth, outputHeight] = outputSize.split('x').map(Number);
      const aspectRatio = `${outputWidth}:${outputHeight}`;

      // Append camera style preset to the main ad-creative prompt (background prompt)
      const cam = cameraStylePrompt(cameraStyle);
      const basePrompt = useCustomBackground ? backgroundPrompt : "";
      const finalPrompt = cam ? `${basePrompt}. ${cam}` : basePrompt;

      // Start generation with fal.ai
      setGenStage("generating");
      const { data: startData, error: startError } = await supabase.functions.invoke('generate-ad-image', {
        body: {
          action: 'generate',
          product_image_url: base64Image,
          model_mode: modelMode === 'model' ? (modelSource === 'auto' ? autoGender : 'female') : modelMode,
          hand_interaction: modelMode === 'hand' ? handInteraction : null,
          custom_model_url: customModelBase64 || modelUrlBase64,
          output_size: outputSize,
          aspect_ratio: aspectRatio,
          background_color: useCustomBackground ? backgroundColor : null,
          background_prompt: finalPrompt ? finalPrompt : null,
          use_custom_background: useCustomBackground,
          text_config: textElements
            .filter(el => el.type !== 'cta' || ctaEnabled) // Exclude CTA if disabled
            .map(el => ({
              type: el.type,
              text: el.text,
              position: el.position,
              fontSize: el.fontSize,
              color: el.color,
              fontFamily: el.fontFamily,
              fontWeight: el.fontWeight,
              fontStyle: el.fontStyle,
              textDecoration: el.textDecoration,
              backgroundColor: el.backgroundColor,
              icon: el.icon,
            })),
          logo_config: (logoConfig.enabled && logoBase64) ? {
            url: logoBase64,
            position: logoConfig.position,
            size: logoConfig.size
          } : null
        }
      });

      if (startError) throw startError;
      if (startData.error) throw new Error(startData.error);

      const requestId = startData.request_id;
      if (!requestId) throw new Error("No request ID received from server");

      console.log("Generation started, polling for results...", requestId);

      // Poll for completion
      let attempts = 0;
      const maxAttempts = 60; // 2 minutes max
      let imageUrl: string | null = null;

      while (attempts < maxAttempts) {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds

        const { data: statusData, error: statusError } = await supabase.functions.invoke('generate-ad-image', {
          body: { action: 'status', requestId }
        });

        if (statusError) {
          console.error("Status check error:", statusError);
          continue;
        }

        console.log(`Poll attempt ${attempts}, status:`, statusData.status);

        if (statusData.status === 'COMPLETED') {
          if (statusData.images && statusData.images.length > 0) {
            const urls = statusData.images.map((i: any) => i?.url).filter(Boolean) as string[];
            setGeneratedImageUrls(urls);
            setActiveImageIndex(0);
            imageUrl = urls[0] || null;
          }
          break;
        } else if (statusData.status === 'FAILED') {
          throw new Error(statusData.error || 'Generation failed');
        }
        // Continue polling for IN_PROGRESS, IN_QUEUE
      }

      if (!imageUrl) {
        throw new Error("Generation timed out or no image returned");
      }

      setGeneratedImageUrl(imageUrl);
      setShowPreviewModal(true);

      // Save generation to database for history
      if (user?.id && imageUrl) {
        const headlineText = textElements.find(el => el.type === 'headline')?.text || 'Ad Image';
        await supabase.from('generations').insert({
          user_id: user.id,
          prompt: `Ads Studio: ${headlineText}`,
          original_image_url: productUrl || '',
          generated_image_url: imageUrl,
          status: 'completed',
          tool_name: 'ads_listing',
        });
      }

      if (!isAdmin && !hasAdminToken && user) {
        const newBalance = await deductCredits(user.id, creditCost);
        setCredits(newBalance);
        await checkAndSendOutOfCreditsEmail(newBalance, userEmail, userName);
      }

      toast.success("Ad generated successfully!");
    } catch (error) {
      console.error("Generation error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!canvasRef.current || !generatedImageUrl) return;

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      const [width, height] = outputSize.split('x').map(Number);
      canvas.width = width;
      canvas.height = height;

      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = generatedImageUrl;
      });

      ctx.drawImage(img, 0, 0, width, height);

      const link = document.createElement('a');
      const headlineText = headline?.text || 'ad';
      link.download = `ad-${headlineText.slice(0, 20).replace(/\s+/g, '-')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      toast.success("Image downloaded!");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download image");
    }
  };

  const handleReset = () => {
    // Close the modal first
    setShowPreviewModal(false);
    
    // Reset all state
    setProductFile(null);
    setProductUrl(null);
    setGeneratedImageUrl(null);
    setLogoConfig({
      file: null,
      url: null,
      position: 'bottom-center',
      size: 60,
      enabled: false
    });
    setTextElements([
      {
        id: 'headline',
        type: 'headline',
        text: '',
        position: 'top-center',
        fontSize: 36,
        color: '#ffffff',
        fontFamily: 'Inter',
        fontWeight: 'bold',
        fontStyle: 'normal',
        textDecoration: 'none',
      },
      {
        id: 'subheadline',
        type: 'subheadline',
        text: '',
        position: 'top-center',
        fontSize: 20,
        color: '#e0e0e0',
        fontFamily: 'Inter',
        fontWeight: 'normal',
        fontStyle: 'normal',
        textDecoration: 'none',
      },
      {
        id: 'cta',
        type: 'cta',
        text: 'Shop Now',
        position: 'bottom-center',
        fontSize: 18,
        color: '#ffffff',
        fontFamily: 'Inter',
        fontWeight: 'bold',
        fontStyle: 'normal',
        textDecoration: 'none',
        backgroundColor: '#10b981',
      },
    ]);
  };

  const canGenerate = !!productUrl && !!headline?.text?.trim() && (isAdmin || hasAdminToken || credits >= creditCost);

  return (
    <>
      <Helmet>
        <title>Ads Studio Image Generator | Floowy</title>
        <meta name="description" content="Create stunning social media ads and listing images with AI. Upload your product and let AI generate professional advertisement images." />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/home">
                <img src={logoImage} alt="Floowy" className="h-8 w-8 object-contain" />
              </Link>
              <div>
                <h1 className="text-lg font-semibold">Ads Studio</h1>
                <p className="text-xs text-muted-foreground">Create professional ad images</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <PlanCreditsDisplay credits={credits} plan={userPlan} onAddCredits={() => {}} />
              <UserMenu onAddCredits={() => {}} />
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-6">
          {/* Two Column Layout */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left Column - Upload, Size/Resolution, Style */}
            <div className="space-y-6">
              {/* Product Upload */}
              <Card className="p-4" data-walkthrough-target="tool-upload">
                <h2 className="text-sm font-medium mb-3">Product Image</h2>
                <UploadArea
                  onFileSelect={handleProductSelect}
                  selectedFile={productFile}
                  label="Upload product"
                  compact
                />
              </Card>

              {/* Size & Resolution */}
              <Card className="p-4" data-walkthrough-target="tool-output">
                <h2 className="text-sm font-medium mb-3">Size & Resolution</h2>
                <AdOutputSettings
                  outputSize={outputSize}
                  setOutputSize={setOutputSize}
                  onCreditCostChange={setCreditCost}
                />
              </Card>

              {/* Background */}
              <Card className="p-4" data-walkthrough-target="tool-style">
                <h2 className="text-sm font-medium mb-3">Background</h2>
                <AdBackgroundSettings
                  backgroundColor={backgroundColor}
                  setBackgroundColor={setBackgroundColor}
                  useCustomBackground={useCustomBackground}
                  setUseCustomBackground={setUseCustomBackground}
                  backgroundPrompt={backgroundPrompt}
                  setBackgroundPrompt={setBackgroundPrompt}
                />
              </Card>

              {/* Camera Style */}
              <Card className="p-4">
                <h2 className="text-sm font-medium mb-3">Camera Style</h2>
                <CameraStylePresetSelect value={cameraStyle} onChange={setCameraStyle} />
              </Card>

              {/* Model Selection */}
              <Card className="p-4" data-walkthrough-target="tool-model">
                <h2 className="text-sm font-medium mb-3">Model</h2>
                <AdModelSelector
                  mode={modelMode}
                  setMode={setModelMode}
                  handInteraction={handInteraction}
                  setHandInteraction={setHandInteraction}
                  customModelFile={customModelFile}
                  onCustomModelFileChange={setCustomModelFile}
                  selectedModelUrl={selectedModelUrl}
                  onModelUrlSelect={setSelectedModelUrl}
                  modelSource={modelSource}
                  onModelSourceChange={setModelSource}
                  autoGender={autoGender}
                  onAutoGenderChange={setAutoGender}
                />
              </Card>
            </div>

            {/* Right Column - Text Customizer Full Height */}
            <Card className="p-4" data-walkthrough-target="tool-prompt">
              <h2 className="text-sm font-medium mb-3">Text Elements</h2>
              <AdTextConfig
                elements={textElements}
                onElementsChange={setTextElements}
                logoConfig={logoConfig}
                onLogoConfigChange={setLogoConfig}
                ctaEnabled={ctaEnabled}
                onCtaEnabledChange={setCtaEnabled}
              />
            </Card>
          </div>

          {/* Generate Button */}
          <div className="flex flex-col items-center gap-3 mt-8 pt-6 border-t border-border">
            <Button
              onClick={handleGenerate}
              disabled={!canGenerate || isGenerating}
              className="w-full max-w-md"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  {generatedImageUrl ? 'Regenerate' : 'Generate'} Ad ({creditCost} {creditCost === 1 ? 'credit' : 'credits'})
                </>
              )}
            </Button>

            {!productUrl && (
              <p className="text-sm text-muted-foreground text-center">
                Please upload a product image first
              </p>
            )}

            {productUrl && !headline?.text?.trim() && (
              <p className="text-sm text-muted-foreground text-center">
                Please enter a headline
              </p>
            )}

            {!isAdmin && !hasAdminToken && credits < creditCost && (
              <p className="text-sm text-destructive text-center">
                You need at least {creditCost} credits to generate
              </p>
            )}
          </div>
        </div>
        {/* Generation Progress Overlay */}
        <GenerationProgressOverlay
          open={isGenerating}
          stage={genStage}
          progress={genStage === "uploading" ? 15 : genStage === "generating" ? 50 : 90}
          statusMessage={genStage === "uploading" ? "Preparing your images..." : genStage === "generating" ? "AI is creating your ad..." : "Finalizing..."}
          title="Creating Your Ad"
          steps={[
            { key: "uploading", label: "Preparing images", icon: Upload },
            { key: "generating", label: "AI is creating", icon: Wand2 },
            { key: "finalizing", label: "Finalizing result", icon: ImageIcon },
          ]}
          onClose={() => {}}
        />

        {/* Preview Modal */}
        <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Generated Ad</span>
              </DialogTitle>
            </DialogHeader>
            
              {generatedImageUrl && (
              <div className="space-y-4">
                <div 
                  ref={canvasRef}
                  className="relative flex items-center justify-center bg-muted rounded-lg overflow-hidden p-4"
                >
                  <img
                    src={displayUrl(generatedImageUrl)}
                    alt="Generated ad"
                    className="max-w-full max-h-[60vh] object-contain"
                  />
                </div>
                {generatedImageUrls.length > 1 && (
                  <div className="flex justify-center gap-2">
                    {generatedImageUrls.map((u, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => { setActiveImageIndex(i); setGeneratedImageUrl(u); }}
                        className={`h-16 w-16 rounded-md overflow-hidden border-2 transition ${i === activeImageIndex ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"}`}
                      >
                        <img src={displayUrl(u)} alt={`Variation ${i + 1}`} className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
                <p className="text-sm text-muted-foreground text-center">
                  Output size: {outputSize}px
                </p>
                
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={handleReset}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset & Close
                  </Button>
                  <Button variant="outline" onClick={gate(() => setEditingAdImage(true))}>
                    {canExport ? <Pencil className="h-4 w-4 mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                    Edit
                  </Button>
                  <Button variant="outline" onClick={() => setShowPreviewModal(false)}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Adjust & Regenerate
                  </Button>
                  <Button onClick={gate(handleDownload)}>
                    {canExport ? <Download className="h-4 w-4 mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                    {canExport ? "Download" : "Unlock to Download"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {editingAdImage && generatedImageUrl && (
          <ImageEditModal
            open={editingAdImage}
            onOpenChange={setEditingAdImage}
            imageUrl={generatedImageUrl}
            onEditComplete={(newUrl) => setGeneratedImageUrl(newUrl)}
            isAdmin={isAdmin || hasAdminToken}
          />
        )}
        <UnlockDialog open={unlockOpen} onOpenChange={setUnlockOpen} />
      </div>
    </>
  );
};

export default AdsListingGenerator;