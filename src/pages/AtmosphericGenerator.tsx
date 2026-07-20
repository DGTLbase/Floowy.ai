import { useState, useEffect } from "react";
import DragDropZone from "@/components/DragDropZone";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Sun, Moon, Package, User, Hand, Upload, X, Shield, Wand2, CheckCircle2, Download } from "lucide-react";
import ModelSelector from "@/components/ModelSelector";
import GenerationProgressOverlay from "@/components/GenerationProgressOverlay";
import { useGenerationProgress } from "@/hooks/useGenerationProgress";
import UploadArea from "@/components/UploadArea";
import ResultDisplay from "@/components/ResultDisplay";
import PlanCreditsDisplay from "@/components/PlanCreditsDisplay";
import UserMenu from "@/components/UserMenu";
import BackgroundSelector from "@/components/BackgroundSelector";
import logoImage from "@/assets/floowy-logo.png";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useOnboardingCheck } from "@/hooks/useOnboardingCheck";
import { AdminToolsSidebar } from "@/components/AdminToolsSidebar";
import CreditsPurchaseDialog from "@/components/CreditsPurchaseDialog";
import { deductCredits } from "@/hooks/useCreditDeduction";
import AmbienceVideoModal from "@/components/AmbienceVideoModal";
import VideoResultModal from "@/components/VideoResultModal";
import CameraStylePresetSelect from "@/components/CameraStylePresetSelect";
import { cameraStylePrompt, CAMERA_STYLE_NONE } from "@/lib/camera-style-presets";

const AtmosphericGenerator = () => {
  const [user, setUser] = useState<any>(null);
  const [credits, setCredits] = useState<number>(0);
  const [userPlan, setUserPlan] = useState<string>("free");
  const { isAdmin } = useAdminCheck();
  useOnboardingCheck();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState("");
  const [setting, setSetting] = useState("day");
  const [modelPresence, setModelPresence] = useState("without");
  const [modelGender, setModelGender] = useState("female");
  const [modelSource, setModelSource] = useState<"floowy" | "auto">("floowy");
  const [customModelFile, setCustomModelFile] = useState<File | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [outputSize, setOutputSize] = useState({ width: 1024, height: 1024 });
  const [cameraStyle, setCameraStyle] = useState<string>(CAMERA_STYLE_NONE);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [adminMode, setAdminMode] = useState(false);
  const [showCreditsPurchase, setShowCreditsPurchase] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [videoModalImageUrl, setVideoModalImageUrl] = useState("");
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [videoResultModalOpen, setVideoResultModalOpen] = useState(false);
  const videoGenProgress = useGenerationProgress();
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
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ action: 'verify', token })
        });
        if (res.ok) { setAdminMode(true); return true; }
      } catch {}
      return false;
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      // Defer — never call supabase-backed work synchronously inside this callback.
      if (!session) {
        setTimeout(() => verifyAdmin(), 0);
      }
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session) {
        await verifyAdmin();
      }
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
    if (!uploadedFile || !prompt.trim()) {
      toast({
        title: "Missing information",
        description: "Please upload an image and enter a prompt",
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
    const completedImages: string[] = [];

    try {
      // Upload image to storage first (or use base64 for admin mode)
      const fileExt = uploadedFile.name.split('.').pop();
      const fileName = `${user?.id || 'admin'}/${Date.now()}.${fileExt}`;
      
      let publicUrl: string;
      
      if (adminMode && !user) {
        // Admin mode - use base64 upload via edge function
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64String = reader.result as string;
            resolve(base64String.split(',')[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(uploadedFile);
        });
        
        const { data, error } = await supabase.functions.invoke(
          "upload-to-imgbb",
          { body: { image_base64: base64 } }
        );
        
        if (error) throw error;
        publicUrl = data.url;
      } else {
        // Regular user - upload to storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('products')
          .upload(fileName, uploadedFile);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl: storageUrl } } = supabase.storage
          .from('products')
          .getPublicUrl(fileName);
        
        publicUrl = storageUrl;
      }

      // Upload custom model if provided (either uploaded file or selected avatar)
      let customModelUrl: string | null = null;
      if (customModelFile) {
        if (user?.id) {
          // Use Supabase Storage for authenticated users (avoids imgbb size limits)
          const modelExt = customModelFile.name.split('.').pop();
          const modelFileName = `${user.id}/model-${Date.now()}.${modelExt}`;
          const { error: modelUploadError } = await supabase.storage
            .from('user-uploads')
            .upload(modelFileName, customModelFile);
          if (modelUploadError) throw modelUploadError;
          const { data: { publicUrl: modelPublicUrl } } = supabase.storage
            .from('user-uploads')
            .getPublicUrl(modelFileName);
          customModelUrl = modelPublicUrl;
        } else {
          // Admin mode fallback - use imgbb
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(customModelFile);
          });
          const { data: imgbbData, error: imgbbError } = await supabase.functions.invoke(
            "upload-to-imgbb",
            { body: { image_base64: base64 } }
          );
          if (imgbbError) throw imgbbError;
          customModelUrl = imgbbData.url;
        }
      } else if (selectedModel && modelPresence === "with" && modelSource === "floowy") {
        // Selected avatar is a local app asset or DB URL — check if it's externally accessible
        // If it's a relative path or lovableproject.com URL, fetch and upload to Supabase Storage
        const isExternalUrl = selectedModel.startsWith('http') && 
          !selectedModel.includes('lovableproject.com') && 
          !selectedModel.includes('localhost');
        
        if (isExternalUrl) {
          customModelUrl = selectedModel;
        } else {
          // Fetch the image and upload to Supabase Storage so FAL can access it
          const response = await fetch(selectedModel);
          const blob = await response.blob();
          const ext = selectedModel.split('.').pop()?.split('?')[0] || 'png';
          const modelFileName = `${user?.id || 'admin'}/avatar-${Date.now()}.${ext}`;
          const { error: avatarUploadError } = await supabase.storage
            .from('user-uploads')
            .upload(modelFileName, blob, { contentType: blob.type || 'image/png' });
          if (avatarUploadError) throw avatarUploadError;
          const { data: { publicUrl: avatarPublicUrl } } = supabase.storage
            .from('user-uploads')
            .getPublicUrl(modelFileName);
          customModelUrl = avatarPublicUrl;
        }
      }

      // Build enhanced prompt with strict product sizing rules
      let enhancedPrompt;
      
      if (modelPresence === "without") {
        enhancedPrompt = `Create a professional closeup photo of this product. Setting: ${setting}. CRITICAL: The product must remain at a completely realistic, true-to-life physical size – do NOT scale it up or down compared to a real object. It should occupy a natural portion of the frame and never appear oversized or miniaturized. Strictly preserve all proportions, thickness and length of the product exactly as in the original uploaded photo. Style reference: ${prompt}. Strictly do not show any person.`;
      } else if (modelPresence === "hands") {
        enhancedPrompt = `Create a professional product photo showing EXACTLY TWO HANDS MAXIMUM (or parts of two hands/arms) holding/using this product. Setting: ${setting}. CRITICAL HAND COUNT: Show ONLY one person's hands – maximum two hands total, no extra hands, no additional fingers, no duplicate hands. The hands/arms should interact with the product naturally – no face, no full body, no torso. CRITICAL PRODUCT SIZE: The product must be realistically sized relative to the hands: it should fit in the hand exactly as a real product would, matching the physical size and proportions from the original uploaded photo. Do NOT exaggerate or shrink the product. The hands must be anatomically correct (5 fingers per hand) and proportionate to the product. Maintain all product details. Style reference: ${prompt}`;
      } else {
        const realisticModelBase = `Captured as a realistic documentary-style photograph. KEY DETAILS: natural skin texture, authentic emotion, genuine engagement with product. SKIN DETAILS: smooth and natural-looking skin with only minimal, subtle texture — no exaggerated pores or blemishes, but avoid artificial airbrushed perfection. HAIR DETAILS: natural texture, baby hairs, stray hairs. BONE/MUSCLE STRUCTURE: natural jawline, cheekbones. EXPRESSION/POSE: relaxed, unposed, naturally interacting with the product. Natural LIGHT DIRECTION: ${setting === 'day' ? 'ambient daylight / window light' : 'warm ambient interior light'} with soft, flattering quality. Neutral color science, realistic contrast, no heavy retouching but maintain a clean, polished-natural look. Shot on LENS: 50-85mm, realistic depth of field. CAMERA FEEL: high-quality smartphone photography, organic sharpness, natural color rendering. The image should feel authentic and human — like a well-lit smartphone photo, not AI-generated, not over-processed.`;

        if (customModelUrl) {
          enhancedPrompt = `Medium shot portrait of the EXACT same person from the reference image, holding/using this product. ${realisticModelBase} CRITICAL: The model must be the SAME person from the reference image — recreate with ZERO alterations to appearance, facial features, skin tone, hair. The product must stay at a realistic, true-to-life size relative to the model's face and hands, matching how large it appears in the original uploaded photo. Do NOT change the product scale or proportions. Maintain all product details. Style reference: ${prompt}`;
        } else {
          enhancedPrompt = `Medium shot portrait of a ${modelGender === 'male' ? '25-35-year-old male' : '25-35-year-old female'} model, naturally holding/using this product. ${realisticModelBase} CRITICAL: The product must be realistically sized relative to the model's face and hands, matching a believable real-world scale. Never make the product larger than the hand or tiny like a toy. Maintain all product details and proportions. Style reference: ${prompt}`;
        }
      }

      // Inject selected camera style into the main prompt (skip when "No style")
      const cam = cameraStylePrompt(cameraStyle);
      const finalPrompt = cam ? `${enhancedPrompt}. ${cam}` : enhancedPrompt;

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

      console.log('[GENERATION START] Making SINGLE request for 2 images...');
      console.log('[GENERATION CONFIG]', {
        aspectRatio,
        resolution,
        hasCustomModel: !!customModelUrl,
        modelPresence,
        setting,
        numImages: 2  // Explicitly showing we request 2 images in ONE call
      });

      genProgress.setGenerating("AI is creating your atmospheric photos...");
      // Make ONE request that generates 2 images (not 2 separate requests)
      const { data: generateData, error: generateError } = await supabase.functions.invoke(
        'generate-mood',
        {
          body: {
            action: 'generate',
            prompt: finalPrompt,
            imageUrl: publicUrl,
            modelImageUrl: customModelUrl,
            aspect_ratio: aspectRatio,
            resolution,
          },
        }
      );

      if (generateError) throw generateError;

      const requestId = generateData.request_id;
      
      // Poll for completion with exponential backoff
      await new Promise<void>((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 90; // ~4 minutes max
        let currentDelay = 3000; // Start at 3 seconds
        
        const scheduleNextPoll = () => {
          setTimeout(async () => {
            try {
              attempts++;
              // Exponential backoff: gradually increase delay up to 8 seconds
              currentDelay = Math.min(currentDelay + 200, 8000);
            
            const { data: statusData, error: statusError } = await supabase.functions.invoke(
              'generate-mood',
              {
                body: {
                  action: 'status',
                  requestId: requestId,
                },
              }
            );

            if (statusError) {
              reject(statusError);
              return;
            }

            console.log(`Polling attempt ${attempts}/${maxAttempts}, status: ${statusData.status || 'checking...'}`);

            // Check if completed - images array indicates completion
            if (statusData.images && Array.isArray(statusData.images)) {
              genProgress.setFinalizing("Saving your images...");
              
              // Process images from the single request (use first 2 to enforce limit)
              let imageUrls: string[] = [];
              if (Array.isArray(statusData.images)) {
                imageUrls = statusData.images.map((img: any) => img.url).filter(Boolean);
              }

              console.log(`[GENERATION COMPLETE] Received ${imageUrls.length} images from API`);

              if (imageUrls.length > 2) {
                console.warn(`[WARN] API returned ${imageUrls.length} images, trimming to first 2 to respect tool limit`);
                imageUrls = imageUrls.slice(0, 2);
              }

              if (imageUrls.length < 2) {
                console.error(`[ERROR] Expected at least 2 images but received ${imageUrls.length}`);
                reject(new Error(`Expected at least 2 images in response, got ${imageUrls.length}`));
                return;
              }

              // Save both images and push to completedImages
              for (const imageUrl of imageUrls) {
                completedImages.push(imageUrl);
                
                // Save to database (only if user exists)
                if (user?.id) {
                  await supabase.from('generations').insert({
                    user_id: user.id,
                    prompt: enhancedPrompt,
                    original_image_url: publicUrl,
                    generated_image_url: imageUrl,
                    status: 'completed',
                    tool_name: 'atmospheric',
                  });
                }
              }

              resolve();
            } else if (statusData.status === 'FAILED' || statusData.error) {
              reject(new Error(statusData.error || 'Generation failed'));
            } else if (attempts >= maxAttempts) {
              reject(new Error('Generation timeout - please try again'));
            } else {
              // Continue polling with backoff
              scheduleNextPoll();
            }
          } catch (error) {
            reject(error);
          }
        }, currentDelay);
        };
        
        // Start first poll
        scheduleNextPoll();
      });

      // Calculate credit cost based on resolution tier
      const creditCost = resolution === "1K" ? 2 : resolution === "2K" ? 3 : 4;

      // Deduct credits for both images (skip for admins)
      if (!isAdmin && !adminMode && user?.id) {
        const newBalance = await deductCredits(user.id, creditCost);
        setCredits(newBalance);
      }

      // All images generated successfully
      genProgress.complete();
      setGeneratedImages(completedImages);
      setIsGenerating(false);
      
      toast({
        title: "Success!",
        description: "Your atmospheric photos have been generated",
      });

    } catch (error) {
      genProgress.fail("Something went wrong. Please try again.");
      console.error('Generation error:', error);
      setIsGenerating(false);
      toast({
        title: "Generation failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  const checkIsAdmin = async () => {
    if (!user) return false;
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();
    return !!data;
  };

  const handleAdminAccess = async () => {
    const isAdmin = await checkIsAdmin();
    if (isAdmin) {
      navigate("/admin");
    } else {
      toast({
        title: "Access denied",
        description: "You don't have admin privileges",
        variant: "destructive",
      });
    }
  };

  const VIDEO_CREDIT_COST = 5;

  const VIDEO_PIPELINE_STEPS = [
    { key: "uploading", label: "Submitting request", icon: Upload },
    { key: "generating", label: "Creating video", icon: Wand2 },
    { key: "finalizing", label: "Finalizing video", icon: CheckCircle2 },
  ];

  const openVideoModal = (imageUrl: string) => {
    setVideoModalImageUrl(imageUrl);
    setVideoModalOpen(true);
  };

  const handleMakeVideo = async (imageUrl: string, prompt?: string) => {
    if (!isAdmin && !adminMode && credits < VIDEO_CREDIT_COST) {
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
            prompt: prompt || 'Smooth cinematic camera orbit around the product. Soft ambient lighting. The product stays perfectly centered and still while the camera glides around it.',
          },
        }
      );

      if (queueError) throw queueError;
      if (queueData?.error) throw new Error(typeof queueData.error === 'string' ? queueData.error : JSON.stringify(queueData.error));

      const requestId = queueData.request_id;
      const statusUrl = queueData.status_url;
      const responseUrl = queueData.response_url;

      videoGenProgress.setGenerating("AI is creating your video...");

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

        if (statusData?.status === 'COMPLETED' && statusData?.video_url) {
          completed = true;
          videoGenProgress.setFinalizing("Preparing your video...");
          await new Promise(resolve => setTimeout(resolve, 1000));
          setGeneratedVideoUrl(statusData.video_url);
          setVideoResultModalOpen(true);

          if (!isAdmin && !adminMode && user?.id) {
            try {
              const newBalance = await deductCredits(user.id, VIDEO_CREDIT_COST);
              setCredits(newBalance);
            } catch (creditError) {
              console.error("Credit deduction error:", creditError);
            }
          }

          if (user?.id) {
            try {
              await supabase.from("generations").insert({
                user_id: user.id,
                original_image_url: imageUrl,
                generated_image_url: statusData.video_url,
                prompt: prompt || "Ambience video generation",
                status: "completed",
                tool_name: "ambience-video",
              });
            } catch (saveError) {
              console.error("Error saving video:", saveError);
            }
          }

          videoGenProgress.complete();
          toast({ title: "Video Ready!", description: "Your ambience video has been generated." });
        } else if (statusData?.status === 'FAILED') {
          throw new Error(typeof statusData?.error === 'string' ? statusData.error : 'Video generation failed');
        }
      }

      if (!completed) throw new Error('Video generation timed out');
    } catch (error: any) {
      console.error("Video generation error:", error);
      videoGenProgress.fail(typeof error?.message === 'string' ? error.message : "Something went wrong.");
      toast({
        title: "Video Generation Failed",
        description: typeof error?.message === 'string' ? error.message : "Something went wrong.",
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
      a.download = `floowy-ambience-video-${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      window.open(generatedVideoUrl, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {(isAdmin || adminMode) && <AdminToolsSidebar />}
      
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

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-12" data-walkthrough-target="ambience-intro">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Atmospheric Photo Generator
          </h1>
          <p className="text-xl text-muted-foreground">
            Upload your product and describe the mood you want to create
          </p>
          <Link to="/knowledge-base/ambience-studio" className="text-sm text-primary hover:underline mt-2 inline-block">
            Need More Clarity? Check our detailed knowledge base guide for step-by-step instructions
          </Link>
        </div>

        {generatedImages.length === 0 ? (
          <div className="space-y-6">
            {/* Row 1: Upload + Time of Day (L) | Model Presence (R) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div data-walkthrough-target="ambience-upload">
                <UploadArea
                  onFileSelect={setUploadedFile}
                  selectedFile={uploadedFile}
                />
                </div>
                {/* Time Setting */}
                <div className="bg-card rounded-xl border border-border p-6" data-walkthrough-target="ambience-time">
                  <label className="text-sm font-medium text-foreground mb-3 block">
                    Time of Day
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSetting("day")}
                      className={`px-4 py-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                        setting === "day"
                          ? "border-primary bg-primary/10 text-primary font-medium"
                          : "border-border hover:border-primary/50 text-muted-foreground"
                      }`}
                    >
                      <Sun className="w-5 h-5" />
                      Day
                    </button>
                    <button
                      type="button"
                      onClick={() => setSetting("night")}
                      className={`px-4 py-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                        setting === "night"
                          ? "border-primary bg-primary/10 text-primary font-medium"
                          : "border-border hover:border-primary/50 text-muted-foreground"
                      }`}
                    >
                      <Moon className="w-5 h-5" />
                      Night
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="bg-card rounded-xl border border-border p-6 space-y-6" data-walkthrough-target="ambience-mode">
                {/* Model Presence */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-3 block">
                    Model Presence
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setModelPresence("without")}
                      className={`px-4 py-3 rounded-lg border-2 transition-all flex flex-col items-center justify-center gap-2 ${
                        modelPresence === "without"
                          ? "border-primary bg-primary/10 text-primary font-medium"
                          : "border-border hover:border-primary/50 text-muted-foreground"
                      }`}
                    >
                      <Package className="w-5 h-5" />
                      Product Only
                    </button>
                    <button
                      type="button"
                      onClick={() => setModelPresence("with")}
                      className={`px-4 py-3 rounded-lg border-2 transition-all flex flex-col items-center justify-center gap-2 ${
                        modelPresence === "with"
                          ? "border-primary bg-primary/10 text-primary font-medium"
                          : "border-border hover:border-primary/50 text-muted-foreground"
                      }`}
                    >
                      <User className="w-5 h-5" />
                      With Model
                    </button>
                    <button
                      type="button"
                      onClick={() => setModelPresence("hands")}
                      className={`px-4 py-3 rounded-lg border-2 transition-all flex flex-col items-center justify-center gap-2 ${
                        modelPresence === "hands"
                          ? "border-primary bg-primary/10 text-primary font-medium"
                          : "border-border hover:border-primary/50 text-muted-foreground"
                      }`}
                    >
                      <Hand className="w-5 h-5" />
                      Hands Only
                    </button>
                  </div>
                </div>

                {/* Model Source - Only shown when "With Model" is selected */}
                {modelPresence === "with" && (
                  <div className="space-y-4">
                    <label className="text-sm font-medium text-foreground block">
                      Model Source
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => { setModelSource("floowy"); setModelGender("female"); }}
                        className={`px-4 py-3 rounded-lg border-2 transition-all flex flex-col items-center justify-center gap-1 ${
                          modelSource === "floowy"
                            ? "border-primary bg-primary/10 text-primary font-medium"
                            : "border-border hover:border-primary/50 text-muted-foreground"
                        }`}
                      >
                        <User className="w-5 h-5" />
                        <span className="text-xs font-medium">Floowy Models</span>
                        <span className="text-[10px] text-muted-foreground">Select an avatar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { setModelSource("auto"); setSelectedModel(null); setCustomModelFile(null); }}
                        className={`px-4 py-3 rounded-lg border-2 transition-all flex flex-col items-center justify-center gap-1 ${
                          modelSource === "auto"
                            ? "border-primary bg-primary/10 text-primary font-medium"
                            : "border-border hover:border-primary/50 text-muted-foreground"
                        }`}
                      >
                        <Wand2 className="w-5 h-5" />
                        <span className="text-xs font-medium">Auto Generated</span>
                        <span className="text-[10px] text-muted-foreground">AI creates model</span>
                      </button>
                    </div>

                    {/* Floowy Models - show ModelSelector */}
                    {modelSource === "floowy" && (
                      <div>
                        <label className="text-sm font-medium text-foreground mb-3 block">
                          Choose Avatar
                        </label>
                        <ModelSelector
                          selectedModel={selectedModel}
                          onModelSelect={(url) => {
                            setSelectedModel(url);
                            if (url) setCustomModelFile(null);
                          }}
                          customModelFile={customModelFile}
                          onCustomModelFileChange={(file) => {
                            setCustomModelFile(file);
                            if (file) setSelectedModel(null);
                          }}
                        />
                      </div>
                    )}

                    {/* Auto Generated - show gender buttons */}
                    {modelSource === "auto" && (
                      <div>
                        <label className="text-sm font-medium text-foreground mb-3 block">
                          Model Gender
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setModelGender("female")}
                            className={`px-4 py-3 rounded-lg border-2 transition-all text-sm font-medium ${
                              modelGender === "female"
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border hover:border-primary/50 text-muted-foreground"
                            }`}
                          >
                            Female
                          </button>
                          <button
                            type="button"
                            onClick={() => setModelGender("male")}
                            className={`px-4 py-3 rounded-lg border-2 transition-all text-sm font-medium ${
                              modelGender === "male"
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border hover:border-primary/50 text-muted-foreground"
                            }`}
                          >
                            Male
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Row 2: Mood prompt/style presets (L) | Output size (R) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Mood and Style Presets */}
              <div className="bg-card rounded-xl border border-border p-6 space-y-6" data-walkthrough-target="ambience-mood">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    What mood or setting do you want?
                  </label>
                  <Textarea
                    placeholder="Enter between 20 and 30 words for best results — e.g., Scandinavian interior, warm lighting, cozy atmosphere..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className={`min-h-32 resize-none ${prompt.length > 250 ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  />
                  <div className={`text-xs mt-1 text-right ${prompt.length > 250 ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                    {prompt.length}/250 characters
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-foreground mb-3">
                    Style Presets
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {["Scandinavian interior, warm lighting", "Minimalist studio, natural light", "Luxury setting, elegant backdrop", "Outdoor nature scene", "Modern office environment", "Cozy home atmosphere"].map((preset) => (
                      <Badge
                        key={preset}
                        variant="outline"
                        className="cursor-pointer hover:bg-accent transition-colors"
                        onClick={() => setPrompt(preset)}
                      >
                        {preset}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Camera Style Presets */}
                <CameraStylePresetSelect value={cameraStyle} onChange={setCameraStyle} />
              </div>

              {/* Output Size */}
              <div data-walkthrough-target="ambience-output">
              <BackgroundSelector
                backgroundColor="#F8F8F8"
                onColorChange={() => {}}
                selectedBackground={null}
                onBackgroundSelect={() => {}}
                customBackgroundPrompt=""
                onCustomBackgroundPromptChange={() => {}}
                outputSize={outputSize}
                onOutputSizeChange={setOutputSize}
                hideBackgroundOptions={true}
              />
              </div>
            </div>

            {/* Generate Button */}
            <div className="flex justify-center" data-walkthrough-target="ambience-generate">
              <Button
                onClick={handleGenerate}
                disabled={!uploadedFile || !prompt.trim() || isGenerating || (!isAdmin && !adminMode && credits < (() => {
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
                    {isAdmin || adminMode ? "Generate (Admin - Free)" : (() => {
                      const maxDimension = Math.max(outputSize.width, outputSize.height);
                      const creditCost = maxDimension <= 1400 ? 2 : maxDimension <= 2800 ? 3 : 4;
                      return `Generate (${creditCost} credits)`;
                    })()}
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <ResultDisplay
              imageUrls={generatedImages}
              onReset={() => {
                setGeneratedImages([]);
                setUploadedFile(null);
                setPrompt("");
                setSetting("day");
                setModelPresence("without");
                setModelGender("female");
                setModelSource("floowy");
                setCustomModelFile(null);
                setGeneratedVideoUrl(null);
              }}
              onRegenerate={handleGenerate}
              isRegenerating={isGenerating}
              isAdmin={isAdmin || adminMode}
              onMakeVideo={openVideoModal}
            />

            {/* Video Result Modal */}
            {generatedVideoUrl && (
              <VideoResultModal
                open={videoResultModalOpen}
                onOpenChange={setVideoResultModalOpen}
                videoUrl={generatedVideoUrl}
                title="Your Ambience Video"
                onDownload={handleDownloadVideo}
                onRegenerate={() => openVideoModal(videoModalImageUrl)}
                isRegenerating={isGeneratingVideo}
              />
            )}
          </div>
        )}
      </div>
      
      <GenerationProgressOverlay
        open={genProgress.isActive || genProgress.stage === "failed"}
        stage={genProgress.stage}
        progress={genProgress.progress}
        statusMessage={genProgress.statusMessage}
        title="Creating Your Atmospheric Photos"
        onRetry={() => { genProgress.reset(); handleGenerate(); }}
        onClose={() => genProgress.reset()}
      />

      <GenerationProgressOverlay
        open={videoGenProgress.isActive || videoGenProgress.stage === "failed"}
        stage={videoGenProgress.stage}
        progress={videoGenProgress.progress}
        statusMessage={videoGenProgress.statusMessage}
        title="Creating Your Ambience Video"
        onRetry={() => { videoGenProgress.reset(); }}
        onClose={() => videoGenProgress.reset()}
      />

      <AmbienceVideoModal
        open={videoModalOpen}
        onOpenChange={setVideoModalOpen}
        onGenerate={(prompt) => handleMakeVideo(videoModalImageUrl, prompt)}
        isGenerating={isGeneratingVideo}
        imageUrl={videoModalImageUrl}
        modelPresence={modelPresence as "without" | "with" | "hands"}
        creditCost={VIDEO_CREDIT_COST}
        credits={credits}
        isAdmin={isAdmin || adminMode}
      />
      </div>

      <CreditsPurchaseDialog 
        open={showCreditsPurchase}
        onOpenChange={setShowCreditsPurchase}
      />
    </div>
  );
};

export default AtmosphericGenerator;
