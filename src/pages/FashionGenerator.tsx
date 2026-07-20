import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useUpsell } from "@/hooks/useUpsell";
import { ArrowLeft, Loader2, Shield, Video, Download, Upload, Wand2, CheckCircle2 } from "lucide-react";
import GenerationProgressOverlay from "@/components/GenerationProgressOverlay";
import { useGenerationProgress } from "@/hooks/useGenerationProgress";
import PlanCreditsDisplay from "@/components/PlanCreditsDisplay";
import UserMenu from "@/components/UserMenu";
import ResultDisplay from "@/components/ResultDisplay";
import UploadArea from "@/components/UploadArea";
import ModelSelector from "@/components/ModelSelector";
import BackgroundSelector from "@/components/BackgroundSelector";
import FashionPromptInput from "@/components/FashionPromptInput";
import PoseSelector from "@/components/PoseSelector";
import logoImage from "@/assets/floowy-logo.png";
import { Link } from "react-router-dom";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useOnboardingCheck } from "@/hooks/useOnboardingCheck";
import { AdminToolsSidebar } from "@/components/AdminToolsSidebar";
import CreditsPurchaseDialog from "@/components/CreditsPurchaseDialog";
import { checkAndSendOutOfCreditsEmail, deductCredits } from "@/hooks/useCreditDeduction";
import FashionVideoModal from "@/components/FashionVideoModal";
import VideoResultModal from "@/components/VideoResultModal";
import CameraStylePresetSelect from "@/components/CameraStylePresetSelect";
import { cameraStylePrompt, CAMERA_STYLE_NONE } from "@/lib/camera-style-presets";

const FashionGenerator = () => {
  const { trackStudioUse } = useUpsell();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [credits, setCredits] = useState(0);
  const [userPlan, setUserPlan] = useState<string>("free");
  const [userEmail, setUserEmail] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const { isAdmin } = useAdminCheck();
  useOnboardingCheck();
  const [productFile, setProductFile] = useState<File | null>(null);
  const [topsFile, setTopsFile] = useState<File | null>(null);
  const [trousersFile, setTrousersFile] = useState<File | null>(null);
  const [shoesFile, setShoesFile] = useState<File | null>(null);
  const [accessoryFiles, setAccessoryFiles] = useState<File[]>([]);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [customModelFile, setCustomModelFile] = useState<File | null>(null);
  const [backgroundColor, setBackgroundColor] = useState<string>("#F8F8F8");
  const [selectedBackground, setSelectedBackground] = useState<string | null>("#F8F8F8");
  const [customBackgroundPrompt, setCustomBackgroundPrompt] = useState<string>("");
  const [selectedPose, setSelectedPose] = useState<string>("standing");
  const [cameraStyle, setCameraStyle] = useState<string>(CAMERA_STYLE_NONE);
  const [outputSize, setOutputSize] = useState({ width: 1024, height: 1024 });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [adminMode, setAdminMode] = useState(false);
  const [showCreditsPurchase, setShowCreditsPurchase] = useState(false);
  const genProgress = useGenerationProgress();
  const videoGenProgress = useGenerationProgress();
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [videoResultModalOpen, setVideoResultModalOpen] = useState(false);
  const [videoProgress, setVideoProgress] = useState<string>("");
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [videoModalImageUrl, setVideoModalImageUrl] = useState<string>("");

  useEffect(() => {
    const verifyAdmin = async () => {
      const token = localStorage.getItem('admin_token');
      if (!token) return false;
      try {
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-auth`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ action: 'verify', token })
        });
        if (res.ok) {
          setAdminMode(true);
          return true;
        }
      } catch {}
      return false;
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Defer supabase-touching work — calling it inside the callback deadlocks the auth lock.
      if (session?.user) {
        setUser(session.user);
        setTimeout(() => fetchCredits(session.user.id), 0);
      } else {
        setTimeout(() => verifyAdmin(), 0);
      }
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchCredits(session.user.id);
      } else {
        await verifyAdmin();
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
    
    // Fetch user plan, email, and name
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan, email, full_name")
      .eq("id", userId)
      .single();

    if (profile) {
      setUserPlan(profile.plan);
      setUserEmail(profile.email || '');
      setUserName(profile.full_name || '');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  // Calculate credit cost based on resolution: 1K=2, 2K=3, 4K=4
  const calculateCreditCost = (size: { width: number; height: number }): number => {
    const maxDimension = Math.max(size.width, size.height);
    
    if (maxDimension <= 1400) return 2; // 1K resolution
    if (maxDimension <= 2800) return 3; // 2K resolution
    return 4; // 4K resolution
  };

  // Calculate resolution tier for API
  const calculateResolution = (size: { width: number; height: number }): string => {
    const maxDimension = Math.max(size.width, size.height);
    
    if (maxDimension <= 1400) return "1K";
    if (maxDimension <= 2800) return "2K";
    return "4K";
  };

  const uploadFile = async (file: File, path: string) => {
    // For admin mode, convert to base64 and upload via edge function
    if (adminMode && !user) {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          resolve(base64String.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      const { data, error } = await supabase.functions.invoke(
        "upload-to-imgbb",
        { body: { image_base64: base64 } }
      );
      
      if (error) throw error;
      return data.url;
    }
    
    // Regular user flow
    const { data, error } = await supabase.storage
      .from("user-uploads")
      .upload(path, file, { upsert: true });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from("user-uploads")
      .getPublicUrl(path);

    return urlData.publicUrl;
  };

  const handleGenerate = async () => {
    // Calculate credit cost based on output size
    const creditCost = calculateCreditCost(outputSize);

    if (!productFile) {
      toast({
        title: "Missing Product",
        description: "Please upload a product image",
        variant: "destructive",
      });
      return;
    }

    if (!selectedModel && !customModelFile) {
      toast({
        title: "Missing Model",
        description: "Please select or upload a model",
        variant: "destructive",
      });
      return;
    }

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
      // Upload all files
      const timestamp = Date.now();
      const userId = user?.id || 'admin';

      const productUrl = await uploadFile(
        productFile,
        `${userId}/${timestamp}-product-${productFile.name}`
      );

      // Convert model image to blob, then upload to imgbb
      console.log('Fetching model image...');
      let modelBlob: Blob;
      
      if (customModelFile) {
        // Use custom uploaded model
        modelBlob = customModelFile;
      } else {
        // Use selected predefined model
        const modelResponse = await fetch(selectedModel as string);
        modelBlob = await modelResponse.blob();
      }
      
      // Convert blob to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64String = reader.result as string;
          // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
          const base64Data = base64String.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(modelBlob);
      });
      
      const modelBase64 = await base64Promise;
      
      console.log('Uploading model to imgbb...');
      const { data: imgbbData, error: imgbbError } = await supabase.functions.invoke(
        "upload-to-imgbb",
        {
          body: {
            image_base64: modelBase64,
          },
        }
      );

      if (imgbbError) throw imgbbError;

      const modelImgbbUrl = imgbbData.url;
      console.log('Model uploaded to imgbb:', modelImgbbUrl);

      const urls: string[] = [modelImgbbUrl, productUrl];
      
      if (topsFile) {
        const topsUrl = await uploadFile(
          topsFile,
          `${userId}/${timestamp}-tops-${topsFile.name}`
        );
        urls.push(topsUrl);
      }
      
      if (trousersFile) {
        const trousersUrl = await uploadFile(
          trousersFile,
          `${userId}/${timestamp}-trousers-${trousersFile.name}`
        );
        urls.push(trousersUrl);
      }
      
      if (shoesFile) {
        const shoesUrl = await uploadFile(
          shoesFile,
          `${userId}/${timestamp}-shoes-${shoesFile.name}`
        );
        urls.push(shoesUrl);
      }

      // Upload accessories
      for (const accessoryFile of accessoryFiles) {
        const accessoryUrl = await uploadFile(
          accessoryFile,
          `${userId}/${timestamp}-accessory-${accessoryFile.name}`
        );
        urls.push(accessoryUrl);
      }

      console.log('All image URLs for generation:', urls);

      // Determine background for prompt
      let backgroundText = "";
      if (customBackgroundPrompt.trim()) {
        // Use custom background prompt if provided
        backgroundText = customBackgroundPrompt.trim();
      } else {
        // Use selected or default background
        const background = selectedBackground || backgroundColor;
        backgroundText = background.startsWith('linear-gradient') 
          ? `studio gradient background (${background})` 
          : `solid background color ${background}`;
      }

      // Determine pose description
      const poseDescriptions: Record<string, string> = {
        "standing": "natural standing pose, facing forward",
        "casual": "relaxed casual pose with hands in pockets or arms crossed",
        "walking": "dynamic walking pose, mid-stride",
        "sitting": "seated pose in a comfortable position",
        "side-view": "standing pose showing side profile view",
        "action": "dynamic action pose with movement captured"
      };
      const poseText = poseDescriptions[selectedPose] || poseDescriptions["standing"];

      const accessoriesText = accessoryFiles.length > 0 ? ` Also incorporate the accessories shown in the reference images (jewelry, bags, watches, etc.) realistically on the person, matching natural placement and proportions.` : '';

      const basePrompt = `Medium shot portrait of the person from the FIRST reference image, captured as a realistic documentary-style photograph. Edit ONLY their clothing/outfit to match the garments shown in the subsequent product images. Keep the person's face, body, skin tone, hair, and all physical features EXACTLY as they appear — do not modify or alter the person in any way. KEY DETAILS: natural skin texture, authentic expression, genuine pose. SKIN DETAILS: smooth and natural-looking skin with only minimal, subtle texture — no exaggerated pores or blemishes, but avoid artificial airbrushed perfection. HAIR DETAILS: natural texture, baby hairs, stray hairs. The clothing must drape and fold naturally on the body with realistic fabric texture, wrinkles, and shadows maintaining physical consistency.${accessoriesText} Position the person in ${poseText}. Background: ${backgroundText}. Natural LIGHT DIRECTION: soft studio window light with flattering quality. Neutral color science, realistic contrast, no heavy retouching but maintain a clean, polished-natural look. Shot on LENS: 50-85mm, realistic depth of field. CAMERA FEEL: high-quality smartphone photography, organic sharpness, natural color rendering. The person's identity must remain completely unchanged. The image should feel authentic and human — like a well-lit smartphone photo, not AI-generated, not over-processed.`;
      const cam = cameraStylePrompt(cameraStyle);
      const prompt = cam ? `${basePrompt}. ${cam}` : basePrompt;

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
      const resolution = calculateResolution(outputSize);
      console.log('Using aspect ratio:', aspectRatio, 'resolution:', resolution);

      genProgress.setGenerating("AI is creating your mockup...");
      // Start generation with async polling
      const { data: queueData, error: queueError } = await supabase.functions.invoke(
        "edit-fashion-image",
        {
          body: {
            action: 'generate',
            prompt,
            image_urls: urls,
            aspect_ratio: aspectRatio,
            resolution,
          },
        }
      );

      if (queueError) throw queueError;

      const requestId = queueData.request_id;
      console.log('Generation started, request ID:', requestId);

      // Poll for completion with exponential backoff
      let completed = false;
      let attempts = 0;
      const maxAttempts = 90; // ~4 minutes max with backoff

      while (!completed && attempts < maxAttempts) {
        // Exponential backoff: start at 3s, increase gradually
        const waitTime = Math.min(3000 + (attempts * 200), 8000);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        attempts++;

        const { data: statusData, error: statusError } = await supabase.functions.invoke(
          "edit-fashion-image",
          {
            body: {
              action: 'status',
              requestId: requestId,
            },
          }
        );

        if (statusError) throw statusError;

        console.log(`Polling attempt ${attempts}/${maxAttempts}, status:`, statusData.status);

        if (statusData.status === 'COMPLETED') {
          genProgress.setFinalizing("Saving your images...");
          completed = true;
          const imageUrls = statusData.images?.map((img: any) => img.url) || [];
          if (!imageUrls.length) {
            throw new Error('No images returned from generation');
          }

          console.log('Generated images:', imageUrls);

          // Save generations for each returned image URL (only if user exists)
          if (userId !== 'admin' && user?.id) {
            const rows = imageUrls.map((url: string) => ({
              user_id: userId,
              original_image_url: urls[0],
              generated_image_url: url,
              prompt,
              status: 'completed',
              tool_name: 'fashion',
            }));
            await supabase.from("generations").insert(rows);
          }

          // Deduct credit (skip for admins)
          if (!isAdmin && !adminMode && user?.id) {
            const newBalance = await deductCredits(userId, creditCost);
            setCredits(newBalance);
            await checkAndSendOutOfCreditsEmail(newBalance, userEmail, userName);
          }
          genProgress.complete();
          setGeneratedImages(imageUrls);

          toast({
            title: "Success!",
            description: "Your fashion mockup has been generated",
          });
          // Contextual upsell: after a few Fashion Studio generations, nudge
          // toward Fashion Video / Fashion Pro (respecting frequency caps).
          trackStudioUse("fashion");
          break;
        } else if (statusData.status === 'FAILED') {
          throw new Error(statusData.error || 'Generation failed');
        }
      }

      if (!completed) {
        throw new Error('Generation timeout - please try again');
      }
    } catch (error: any) {
      console.error("Generation error:", error);
      genProgress.fail("Something went wrong. Please try again.");
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
    setProductFile(null);
    setTopsFile(null);
    setTrousersFile(null);
    setShoesFile(null);
    setAccessoryFiles([]);
    setSelectedModel(null);
    setCustomModelFile(null);
    setGeneratedVideoUrl(null);
    setVideoProgress("");
  };

  const openVideoModal = (imageUrl: string) => {
    setVideoModalImageUrl(imageUrl);
    setVideoModalOpen(true);
  };

  const VIDEO_PIPELINE_STEPS = [
    { key: "uploading", label: "Submitting request", icon: Upload },
    { key: "generating", label: "Creating video", icon: Wand2 },
    { key: "finalizing", label: "Finalizing video", icon: CheckCircle2 },
  ];

  const VIDEO_CREDIT_COST = 5;

  const handleMakeVideo = async (imageUrl: string, prompt?: string) => {
    // Credit check (skip for admins)
    if (!isAdmin && credits < VIDEO_CREDIT_COST) {
      toast({
        title: "Not enough credits",
        description: `You need ${VIDEO_CREDIT_COST} credits to generate a video. You have ${credits}.`,
        variant: "destructive",
      });
      setShowCreditsPurchase(true);
      return;
    }

    setVideoModalOpen(false);
    setIsGeneratingVideo(true);
    setGeneratedVideoUrl(null);
    videoGenProgress.start();

    try {
      const { data: queueData, error: queueError } = await supabase.functions.invoke(
        "generate-fashion-video",
        {
          body: {
            action: 'generate',
            imageUrl,
            prompt: prompt || 'A fashion model confidently showcasing the outfit with smooth, natural movement. Subtle body rotation, elegant pose transition. Clean background, premium fashion video aesthetic.',
          },
        }
      );

      if (queueError) throw queueError;
      if (queueData?.error) throw new Error(typeof queueData.error === 'string' ? queueData.error : JSON.stringify(queueData.error));

      const requestId = queueData.request_id;
      const statusUrl = queueData.status_url;
      const responseUrl = queueData.response_url;
      console.log('[FASHION-VIDEO] Started, request_id:', requestId, 'status_url:', statusUrl);
      
      videoGenProgress.setGenerating("AI is creating your fashion video...");

      // Poll for completion
      let completed = false;
      let attempts = 0;
      const maxAttempts = 120;

      while (!completed && attempts < maxAttempts) {
        const waitTime = Math.min(4000 + (attempts * 300), 10000);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        attempts++;

        const { data: statusData, error: statusError } = await supabase.functions.invoke(
          "generate-fashion-video",
          { body: { action: 'status', requestId, statusUrl, responseUrl } }
        );

        if (statusError) throw statusError;

        console.log(`[FASHION-VIDEO] Poll ${attempts}/${maxAttempts}:`, statusData?.status);

        if (statusData?.status === 'COMPLETED' && statusData?.video_url) {
          completed = true;
          videoGenProgress.setFinalizing("Preparing your video...");
          await new Promise(resolve => setTimeout(resolve, 1000));
          setGeneratedVideoUrl(statusData.video_url);
          setVideoResultModalOpen(true);

          // Deduct credits
          if (!isAdmin && user?.id) {
            try {
              const newBalance = await deductCredits(user.id, VIDEO_CREDIT_COST);
              setCredits(newBalance);
              await checkAndSendOutOfCreditsEmail(newBalance, userEmail, userName);
            } catch (creditError) {
              console.error("Credit deduction error:", creditError);
            }
          }

          // Save video to generations table
          if (user?.id) {
            try {
              await supabase.from("generations").insert({
                user_id: user.id,
                original_image_url: imageUrl,
                generated_image_url: statusData.video_url,
                prompt: prompt || "Fashion video generation",
                status: "completed",
                tool_name: "fashion-video",
              });
            } catch (saveError) {
              console.error("Error saving video to generations:", saveError);
            }
          }

          videoGenProgress.complete();
          toast({ title: "Video Ready!", description: "Your fashion video has been generated." });
        } else if (statusData?.status === 'FAILED') {
          throw new Error(typeof statusData?.error === 'string' ? statusData.error : 'Video generation failed');
        }
      }

      if (!completed) throw new Error('Video generation timed out');
    } catch (error: any) {
      console.error("Video generation error:", error);
      videoGenProgress.fail(typeof error?.message === 'string' ? error.message : "Something went wrong. Please try again.");
      toast({
        title: "Video Generation Failed",
        description: typeof error?.message === 'string' ? error.message : "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const handleDownloadVideo = async () => {
    if (!generatedVideoUrl) return;
    try {
      const response = await fetch(generatedVideoUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `floowy-fashion-video-${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      window.open(generatedVideoUrl, '_blank');
    }
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
              Create Product Mockups
            </h2>
            <p className="text-muted-foreground text-lg">
              Upload your product and create professional mockups with AI models
            </p>
            <Link to="/knowledge-base/fashion-studio" className="text-sm text-primary hover:underline mt-2 inline-block">
              Need More Clarity? Check our detailed knowledge base guide for step-by-step instructions
            </Link>
          </div>

          {generatedImages.length > 0 ? (
            <div className="space-y-6">
              <ResultDisplay
                imageUrls={generatedImages}
                onReset={handleReset}
                onRegenerate={handleGenerate}
                isRegenerating={isGenerating}
                isAdmin={isAdmin || adminMode}
              />

              {/* Make a Video Section */}
              <div className="bg-card rounded-2xl border border-border/50 p-8 shadow-elegant">
                <h3 className="text-xl font-bold text-foreground mb-2">Create a Fashion Video</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Turn your generated image into a stunning 6-second fashion video
                </p>

                <div className="space-y-3">
                  {videoProgress && (
                    <div className="flex items-center gap-3 text-sm text-muted-foreground bg-secondary/50 rounded-lg p-3">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      {videoProgress}
                    </div>
                  )}
                  <div className="flex gap-2 flex-wrap">
                    {generatedImages.map((url, i) => (
                      <Button
                        key={i}
                        onClick={() => openVideoModal(url)}
                        disabled={isGeneratingVideo}
                        variant="outline"
                        className="gap-2"
                      >
                        {isGeneratingVideo ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Video className="w-4 h-4" />
                        )}
                        {generatedImages.length > 1 ? `Make Video from Image ${i + 1}` : 'Make a Video'}
                      </Button>
                    ))}
                    {generatedVideoUrl && (
                      <Button
                        variant="secondary"
                        onClick={() => setVideoResultModalOpen(true)}
                        className="gap-2"
                      >
                        <Video className="w-4 h-4" />
                        View Last Video
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Upload Clothing and Select Pose side by side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div data-walkthrough-target="tool-upload">
                  <UploadArea
                    label="Upload Clothing"
                    onFileSelect={setProductFile}
                    selectedFile={productFile}
                    compact
                  />
                </div>

                <div data-walkthrough-target="fs-pose" className="space-y-4">
                  <PoseSelector
                    selectedPose={selectedPose}
                    onPoseSelect={setSelectedPose}
                  />
                  <CameraStylePresetSelect value={cameraStyle} onChange={setCameraStyle} />
                </div>
              </div>

              {/* Model Selector with integrated upload */}
              <div className="bg-card rounded-xl border border-border p-6" data-walkthrough-target="tool-model">
                <h3 className="text-lg font-semibold mb-4">Select Avatar</h3>
                <ModelSelector
                    selectedModel={selectedModel}
                    onModelSelect={(model) => {
                      setSelectedModel(model);
                      if (model) setCustomModelFile(null);
                    }}
                    customModelFile={customModelFile}
                    onCustomModelFileChange={(file) => {
                      setCustomModelFile(file);
                      if (file) setSelectedModel(null);
                    }}
                    maxHeight="400px"
                    columns={10}
                  />
              </div>

              {/* Upload optional clothing items in one line with compact mode */}
              <div className="bg-card rounded-xl border border-border p-6" data-walkthrough-target="fs-extras">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <UploadArea label="Upload Tops (Optional)" onFileSelect={setTopsFile} selectedFile={topsFile} compact />
                  <UploadArea label="Upload Trousers (Optional)" onFileSelect={setTrousersFile} selectedFile={trousersFile} compact />
                  <UploadArea label="Upload Shoes (Optional)" onFileSelect={setShoesFile} selectedFile={shoesFile} compact />
                </div>
              </div>

              {/* Accessories Upload */}
              <div className="bg-card rounded-xl border border-border p-6" data-walkthrough-target="fs-accessories">
                <h3 className="text-lg font-semibold mb-1">Accessories (Optional)</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload images of accessories (jewelry, bags, watches, etc.) to be incorporated realistically.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {accessoryFiles.map((file, index) => (
                    <div key={index} className="relative group rounded-lg border border-border overflow-hidden bg-muted">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Accessory ${index + 1}`}
                        className="w-full aspect-square object-contain p-2"
                      />
                      <button
                        onClick={() => setAccessoryFiles(prev => prev.filter((_, i) => i !== index))}
                        className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <span className="sr-only">Remove</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                      <div className="text-[10px] text-center text-muted-foreground truncate px-1 pb-1">{file.name}</div>
                    </div>
                  ))}
                  <label className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer aspect-square bg-muted/30">
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground font-medium">Add Accessory</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length > 0) {
                          setAccessoryFiles(prev => [...prev, ...files]);
                        }
                        e.target.value = '';
                      }}
                    />
                  </label>
                </div>
              </div>

              <div>
              <BackgroundSelector
                backgroundColor={backgroundColor}
                onColorChange={setBackgroundColor}
                selectedBackground={selectedBackground}
                onBackgroundSelect={setSelectedBackground}
                customBackgroundPrompt={customBackgroundPrompt}
                onCustomBackgroundPromptChange={setCustomBackgroundPrompt}
                outputSize={outputSize}
                onOutputSizeChange={setOutputSize}
              />
              </div>

              <div data-walkthrough-target="fs-generate">
              <FashionPromptInput
                isGenerating={isGenerating}
                hasProduct={!!productFile}
                hasModel={!!selectedModel || !!customModelFile}
                credits={credits}
                creditCost={calculateCreditCost(outputSize)}
                onGenerate={handleGenerate}
                isAdmin={isAdmin || adminMode}
              />
              </div>
            </div>
          )}

          <GenerationProgressOverlay
            open={genProgress.isActive || genProgress.stage === "failed"}
            stage={genProgress.stage}
            progress={genProgress.progress}
            statusMessage={genProgress.statusMessage}
            title="Creating Your Mockup"
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

      <FashionVideoModal
        open={videoModalOpen}
        onOpenChange={setVideoModalOpen}
        onGenerate={(prompt) => handleMakeVideo(videoModalImageUrl, prompt)}
        isGenerating={isGeneratingVideo}
        imageUrl={videoModalImageUrl}
        creditCost={VIDEO_CREDIT_COST}
        credits={credits}
        isAdmin={isAdmin || adminMode}
      />

      <GenerationProgressOverlay
        open={videoGenProgress.isActive || videoGenProgress.stage === "failed"}
        stage={videoGenProgress.stage}
        progress={videoGenProgress.progress}
        statusMessage={videoGenProgress.statusMessage}
        title="Creating Your Fashion Video"
        steps={VIDEO_PIPELINE_STEPS}
        onRetry={() => { videoGenProgress.reset(); handleMakeVideo(videoModalImageUrl); }}
        onClose={() => videoGenProgress.reset()}
      />

      {generatedVideoUrl && (
        <VideoResultModal
          open={videoResultModalOpen}
          onOpenChange={setVideoResultModalOpen}
          videoUrl={generatedVideoUrl}
          title="Your Fashion Video"
          onDownload={handleDownloadVideo}
          onRegenerate={() => openVideoModal(generatedImages[0])}
          isRegenerating={isGeneratingVideo}
        />
      )}
    </div>
  );
};

export default FashionGenerator;