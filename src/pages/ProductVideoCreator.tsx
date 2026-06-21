import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import CreditsDisplay from "@/components/CreditsDisplay";
import UploadArea from "@/components/UploadArea";
import { Sparkles, Video, Image as ImageIcon, Wand2, Download, RefreshCw, ArrowLeft, Upload, CheckCircle2, Loader2, Lock } from "lucide-react";
import { deductCredits } from "@/hooks/useCreditDeduction";
import GenerationProgressOverlay from "@/components/GenerationProgressOverlay";
import { useImageGating } from "@/hooks/useImageGating";
import { UnlockDialog } from "@/components/UnlockDialog";

const PRODUCT_VIDEO_PIPELINE_STEPS = [
  { key: "analyzing", label: "AI analysis", icon: Wand2 },
  { key: "generating_image", label: "3D image", icon: ImageIcon },
  { key: "generating_video", label: "Video creation", icon: Video },
];

type GenerationStep = 'idle' | 'analyzing' | 'generating_image' | 'generating_video' | 'completed' | 'failed';

const VIDEO_STYLES = [
  { value: 'auto', label: 'Auto-detect' },
  { value: 'futuristic', label: 'Futuristic / Tech' },
  { value: 'elegant', label: 'Elegant / Luxury' },
  { value: 'vibrant', label: 'Vibrant / Energetic' },
  { value: 'minimal', label: 'Minimal / Clean' },
];

const CREDIT_COST = 3; // 1 for image + 2 for video

const ProductVideoCreator = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [user, setUser] = useState<any>(null);
  const [credits, setCredits] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const { canExport, displayUrl, gate, unlockOpen, setUnlockOpen } = useImageGating({
    isAdmin,
    urls: [],
  });
  
  const [productFile, setProductFile] = useState<File | null>(null);
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [videoStyle, setVideoStyle] = useState("auto");
  
  const [step, setStep] = useState<GenerationStep>('idle');
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [aiPrompts, setAiPrompts] = useState<{ imagePrompt: string; videoPrompt: string } | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      
      // Fetch credits
      const { data: creditsData } = await supabase
        .from("credits")
        .select("balance")
        .eq("user_id", session.user.id)
        .single();
      
      if (creditsData) {
        setCredits(creditsData.balance);
      }
      
      // Check admin
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .single();
      
      setIsAdmin(roleData?.role === "admin");
    };
    
    checkAuth();
  }, [navigate]);

  const uploadToImgbb = async (file: File): Promise<string> => {
    // Convert file to base64
    const reader = new FileReader();
    const base64Promise = new Promise<string>((resolve, reject) => {
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data:image/...;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
    });
    reader.readAsDataURL(file);
    
    const imageBase64 = await base64Promise;
    
    const { data, error } = await supabase.functions.invoke("upload-to-imgbb", {
      body: { image_base64: imageBase64 },
    });
    
    if (error || !data?.url) {
      console.error("Upload error:", error, data);
      throw new Error("Failed to upload image");
    }
    
    return data.url;
  };

  const handleGenerate = async () => {
    if (!productFile) {
      toast({ title: "Please upload a product image", variant: "destructive" });
      return;
    }
    
    if (!isAdmin && credits < CREDIT_COST) {
      toast({ title: "Not enough credits", description: `You need ${CREDIT_COST} credits`, variant: "destructive" });
      return;
    }

    try {
      // Reset state
      setStep('analyzing');
      setProgress(5);
      setStatusMessage("Analyzing product and generating creative prompts...");
      setGeneratedImageUrl(null);
      setGeneratedVideoUrl(null);

      // Upload product image
      const productUrl = await uploadToImgbb(productFile);
      setProgress(10);

      // Step 1: AI Analysis
      const { data: analyzeData, error: analyzeError } = await supabase.functions.invoke(
        "generate-product-video",
        {
          body: {
            action: "analyze",
            productImageUrl: productUrl,
            productName: productName || "Product",
            productDescription,
            videoStyle,
          },
        }
      );

      if (analyzeError || analyzeData?.error) {
        throw new Error(analyzeData?.error || analyzeError?.message || "Analysis failed");
      }

      const { imagePrompt, videoPrompt } = analyzeData;
      setAiPrompts({ imagePrompt, videoPrompt });
      setProgress(20);

      // Step 2: Generate 3D Product Image
      setStep('generating_image');
      setStatusMessage("Creating stunning 3D product visualization...");

      const { data: imageStartData, error: imageStartError } = await supabase.functions.invoke(
        "generate-product-video",
        {
          body: {
            action: "generate_image",
            productImageUrl: productUrl,
            prompt: imagePrompt,
          },
        }
      );

      if (imageStartError || imageStartData?.error) {
        throw new Error(imageStartData?.error || "Image generation failed to start");
      }

      const imageRequestId = imageStartData.request_id;
      
      // Poll for image completion
      let imageCompleted = false;
      let generatedImage = "";
      let imagePollAttempts = 0;
      const maxImageAttempts = 60;

      while (!imageCompleted && imagePollAttempts < maxImageAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        imagePollAttempts++;
        setProgress(20 + Math.min(imagePollAttempts, 30));

        const { data: statusData, error: statusError } = await supabase.functions.invoke(
          "generate-product-video",
          {
            body: {
              action: "status",
              type: "image",
              requestId: imageRequestId,
            },
          }
        );

        if (statusError) throw statusError;

        if (statusData.status === "COMPLETED" && statusData.image_url) {
          imageCompleted = true;
          generatedImage = statusData.image_url;
          setGeneratedImageUrl(generatedImage);
        } else if (statusData.status === "FAILED") {
          throw new Error(statusData.error || "Image generation failed");
        }
      }

      if (!imageCompleted) {
        throw new Error("Image generation timed out");
      }

      setProgress(55);

      // Step 3: Generate Video from Image
      setStep('generating_video');
      setStatusMessage("Animating your product into a dynamic video...");

      const { data: videoStartData, error: videoStartError } = await supabase.functions.invoke(
        "generate-product-video",
        {
          body: {
            action: "generate_video",
            imageUrl: generatedImage,
            prompt: videoPrompt,
          },
        }
      );

      if (videoStartError || videoStartData?.error) {
        throw new Error(videoStartData?.error || "Video generation failed to start");
      }

      const videoRequestId = videoStartData.request_id;

      // Poll for video completion
      let videoCompleted = false;
      let videoPollAttempts = 0;
      const maxVideoAttempts = 120;

      while (!videoCompleted && videoPollAttempts < maxVideoAttempts) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        videoPollAttempts++;
        setProgress(55 + Math.min(videoPollAttempts * 0.35, 40));
        
        const { data: statusData, error: statusError } = await supabase.functions.invoke(
          "generate-product-video",
          {
            body: {
              action: "status",
              type: "video",
              requestId: videoRequestId,
            },
          }
        );

        if (statusError) throw statusError;

        if (statusData.status === "COMPLETED" && statusData.video_url) {
          videoCompleted = true;
          setGeneratedVideoUrl(statusData.video_url);
        } else if (statusData.status === "FAILED") {
          throw new Error(statusData.error || "Video generation failed");
        }
      }

      if (!videoCompleted) {
        throw new Error("Video generation timed out");
      }

      // Deduct credits
      if (!isAdmin && user) {
        const newBalance = await deductCredits(user.id, CREDIT_COST);
        setCredits(newBalance);
      }

      // Save generation
      if (user) {
        await supabase.from("generations").insert({
          user_id: user.id,
          prompt: videoPrompt,
          original_image_url: productUrl,
          generated_image_url: generatedVideoUrl,
          status: "completed",
          tool_name: "creator-studio",
        });
      }

      setStep('completed');
      setProgress(100);
      setStatusMessage("Your product video is ready!");
      
      toast({ title: "Video created successfully!" });

    } catch (error) {
      console.error("Generation error:", error);
      setStep('failed');
      setStatusMessage("Something went wrong. Please try again.");
      toast({
        title: "Generation failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch {
      toast({ title: "Download failed", variant: "destructive" });
    }
  };

  const handleReset = () => {
    setStep('idle');
    setProgress(0);
    setStatusMessage("");
    setGeneratedImageUrl(null);
    setGeneratedVideoUrl(null);
    setAiPrompts(null);
    setProductFile(null);
    setProductName("");
    setProductDescription("");
    setVideoStyle("auto");
  };

  const isGenerating = ['analyzing', 'generating_image', 'generating_video'].includes(step);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold">Product Tips Video Creator</h1>
              <p className="text-muted-foreground">Create viral 3D animated tips videos for your products</p>
            </div>
          </div>
          <CreditsDisplay credits={credits} />
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Configuration */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Product Image
                </CardTitle>
              </CardHeader>
              <CardContent>
                <UploadArea
                  onFileSelect={setProductFile}
                  selectedFile={productFile}
                  label="Upload your product image"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="h-5 w-5" />
                  Product Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="productName">Product Name</Label>
                  <Input
                    id="productName"
                    placeholder="e.g., Wireless Headphones Pro"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    disabled={isGenerating}
                  />
                </div>
                <div>
                  <Label htmlFor="productDescription">Description (optional)</Label>
                  <Textarea
                    id="productDescription"
                    placeholder="Brief description to help AI understand the product..."
                    value={productDescription}
                    onChange={(e) => setProductDescription(e.target.value)}
                    disabled={isGenerating}
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="videoStyle">Video Style</Label>
                  <Select value={videoStyle} onValueChange={setVideoStyle} disabled={isGenerating}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VIDEO_STYLES.map((style) => (
                        <SelectItem key={style.value} value={style.value}>
                          {style.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !productFile || (!isAdmin && credits < CREDIT_COST)}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>Generating...</>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Generate Video ({CREDIT_COST} credits)
                </>
              )}
            </Button>

            {!isAdmin && credits < CREDIT_COST && (
              <p className="text-sm text-destructive text-center">
                You need at least {CREDIT_COST} credits to generate
              </p>
            )}
          </div>

          {/* Right: Progress & Results */}
          <div className="space-y-6">
            {/* Progress Overlay */}
            {isGenerating && (
              <GenerationProgressOverlay
                open={isGenerating}
                stage={step}
                progress={progress}
                statusMessage={statusMessage}
                title="Creating Product Video"
                steps={PRODUCT_VIDEO_PIPELINE_STEPS}
                onClose={() => {}}
              />
            )}

            {/* Generated Image Preview */}
            {generatedImageUrl && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <ImageIcon className="h-5 w-5" />
                      Generated 3D Image
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={gate(() => handleDownload(generatedImageUrl, `product-3d-${Date.now()}.png`))}
                    >
                      {canExport ? <Download className="h-4 w-4 mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                      {canExport ? "Download" : "Unlock"}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <img
                    src={generatedImageUrl}
                    alt="Generated 3D product"
                    className="w-full rounded-lg"
                  />
                </CardContent>
              </Card>
            )}

            {/* Generated Video */}
            {generatedVideoUrl && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Video className="h-5 w-5" />
                      Product Video
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={gate(() => handleDownload(generatedVideoUrl, `product-video-${Date.now()}.mp4`))}
                    >
                      {canExport ? <Download className="h-4 w-4 mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                      {canExport ? "Download" : "Unlock"}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <video
                    src={generatedVideoUrl}
                    controls
                    autoPlay
                    loop
                    muted
                    className="w-full rounded-lg"
                  />
                </CardContent>
              </Card>
            )}

            {/* AI Prompts Display */}
            {aiPrompts && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wand2 className="h-5 w-5" />
                    AI-Generated Prompts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Image Prompt</Label>
                    <p className="text-sm mt-1 p-3 bg-muted rounded-lg">{aiPrompts.imagePrompt}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Video Prompt</Label>
                    <p className="text-sm mt-1 p-3 bg-muted rounded-lg">{aiPrompts.videoPrompt}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reset Button */}
            {(step === 'completed' || step === 'failed') && (
              <Button onClick={handleReset} variant="outline" className="w-full">
                <RefreshCw className="mr-2 h-4 w-4" />
                Start New Generation
              </Button>
            )}

            {/* Failed State */}
            {step === 'failed' && (
              <Card className="border-destructive">
                <CardContent className="pt-6">
                  <p className="text-destructive text-center">{statusMessage}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      <Footer />
      <UnlockDialog open={unlockOpen} onOpenChange={setUnlockOpen} />
    </div>
  );
};

export default ProductVideoCreator;
