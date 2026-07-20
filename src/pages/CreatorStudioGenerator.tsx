import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, LogOut, Settings, Sparkles, Download, RotateCcw, Info, Loader2, Shield, Upload, Wand2, Video, Lock, AlertTriangle } from "lucide-react";
import { Pencil } from "lucide-react";
import VoicePerformanceBlock from "@/components/creator/VoicePerformanceBlock";
import VideoEditingStyleBlock from "@/components/creator/VideoEditingStyleBlock";
import VideoEditModal from "@/components/VideoEditModal";
import { cutStyleById, creditsForDuration, voicePerformanceById, maxVoiceoverWords, countWords, type AspectRatioId, type DurationSec } from "@/lib/creator-studio-config";
import CameraStylePresetSelect from "@/components/CameraStylePresetSelect";
import { cameraStylePrompt, CAMERA_STYLE_NONE } from "@/lib/camera-style-presets";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import UploadArea from "@/components/UploadArea";
import ModelSelector from "@/components/ModelSelector";
import PlanCreditsDisplay from "@/components/PlanCreditsDisplay";
import UserMenu from "@/components/UserMenu";
import logoImage from "@/assets/floowy-logo.png";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useImageGating } from "@/hooks/useImageGating";
import { UnlockDialog } from "@/components/UnlockDialog";
import { useOnboardingCheck } from "@/hooks/useOnboardingCheck";
import { AdminToolsSidebar } from "@/components/AdminToolsSidebar";
import CreditsPurchaseDialog from "@/components/CreditsPurchaseDialog";
import { deductCredits } from "@/hooks/useCreditDeduction";
import GenerationProgressOverlay from "@/components/GenerationProgressOverlay";

const CREATOR_PIPELINE_STEPS = [
  { key: "preparing", label: "Preparing images", icon: Upload },
  { key: "generating_image", label: "Generating image", icon: Wand2 },
  { key: "generating_video", label: "Creating video", icon: Video },
];

const CreatorStudioGenerator = () => {
  const [user, setUser] = useState<any>(null);
  const [credits, setCredits] = useState<number>(0);
  const [userPlan, setUserPlan] = useState<string>("free");
  const { isAdmin } = useAdminCheck();
  const { canExport, gate, unlockOpen, setUnlockOpen } = useImageGating({ isAdmin });
  useOnboardingCheck();
  const [productFile, setProductFile] = useState<File | null>(null);
  const [productName, setProductName] = useState("");
  const [categoryPreset, setCategoryPreset] = useState("auto");
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [language, setLanguage] = useState("british");
  const [voiceoverOption, setVoiceoverOption] = useState("auto");
  const [customVoiceover, setCustomVoiceover] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("enthusiastic");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [genStatus, setGenStatus] = useState<"idle" | "processing" | "completed" | "failed">("idle");
  const [genMessage, setGenMessage] = useState<string>("");
  const [showResultModal, setShowResultModal] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pipelineStage, setPipelineStage] = useState("preparing");
  const [adminMode, setAdminMode] = useState(false);
  const [showCreditsPurchase, setShowCreditsPurchase] = useState(false);
  const [previewedVoiceover, setPreviewedVoiceover] = useState<string | null>(null);
  const [isPreviewingVoiceover, setIsPreviewingVoiceover] = useState(false);
  const [sceneBackground, setSceneBackground] = useState("");
  const [modelBehavior, setModelBehavior] = useState("");
  // Creator Studio v2 (Omni) — Video Editing Style + Voice Performance
  const [aspectRatio, setAspectRatio] = useState<AspectRatioId>("9:16");
  const [cutStyleId, setCutStyleId] = useState<string>("no-cuts");
  const [duration, setDuration] = useState<DurationSec>(6);
  const [voicePerformance, setVoicePerformance] = useState<string>("enthusiast");
  const [cameraStyle, setCameraStyle] = useState<string>(CAMERA_STYLE_NONE);
  const [videoEditOpen, setVideoEditOpen] = useState(false);
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
      .maybeSingle();

    if (data?.balance != null) setCredits(data.balance);
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

  const handleModelSelect = (modelUrl: string) => {
    setSelectedModel(modelUrl);
    if (modelUrl) setModelFile(null);
  };

  const presetStyles = [
    {
      id: "enthusiastic",
      name: "Enthusiastic Review",
      prompt: "A creator enthusiastically reviewing and demonstrating the product in a well-lit room. Natural handheld camera movement. Genuine excitement and authentic reactions.",
    },
    {
      id: "casual",
      name: "Casual Unboxing",
      prompt: "A casual, relatable unboxing and first impressions video. Natural home setting. Person sitting comfortably, showing the product from different angles.",
    },
    {
      id: "lifestyle",
      name: "Lifestyle Integration",
      prompt: "Product shown naturally integrated into daily life. Person using the product in their authentic environment. Natural lighting. Candid moments.",
    },
    {
      id: "testimonial",
      name: "Personal Testimonial",
      prompt: "A heartfelt testimonial about the product. Person speaking directly to camera in a comfortable setting. Genuine emotions and personal story.",
    },
    {
      id: "tutorial",
      name: "Quick Tutorial",
      prompt: "A friendly tutorial showing how to use the product. Step-by-step demonstration. Person explaining features in an easy-to-understand way.",
    },
    {
      id: "comparison",
      name: "Before & After",
      prompt: "Showing the difference the product makes. Natural setting. Person demonstrating the transformation or improvement.",
    },
  ];

  const handlePreviewVoiceover = async () => {
    if (!productName.trim()) {
      toast({
        title: "Missing product name",
        description: "Please enter a product name",
        variant: "destructive",
      });
      return;
    }

    setIsPreviewingVoiceover(true);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('generate-ugc-video', {
        body: {
          action: 'preview_voiceover',
          productName: productName.trim(),
          categoryPreset: categoryPreset,
          language: language,
          duration_seconds: duration   // scale the preview script to the selected clip length
        }
      });

      if (functionError) {
        // supabase-js hides the real error body in error.context — surface it.
        let detail = functionError.message;
        try {
          const body = await (functionError as any).context?.json?.();
          if (body?.error) detail = body.error;
        } catch { /* not JSON */ }
        throw new Error(detail);
      }

      if (data?.error) throw new Error(data.error);

      if (data.voiceover) {
        setPreviewedVoiceover(data.voiceover);
        toast({
          title: "Voiceover preview generated!",
          description: "Review the script and regenerate if needed",
        });
      } else {
        throw new Error('No voiceover generated');
      }
    } catch (err: any) {
      console.error('Error previewing voiceover:', err);
      toast({
        title: "Failed to preview voiceover",
        description: err.message || 'An error occurred',
        variant: "destructive",
      });
    } finally {
      setIsPreviewingVoiceover(false);
    }
  };

  const handleGenerate = async () => {
    if (!productFile) {
      toast({
        title: "Missing product",
        description: "Please upload a product image",
        variant: "destructive",
      });
      return;
    }

    // Only require model selection when voiceover is enabled
    if (voiceoverOption !== "none" && !selectedModel && !modelFile) {
      toast({
        title: "Missing model",
        description: "Please select a model or upload your own",
        variant: "destructive",
      });
      return;
    }

    if (!selectedStyle) {
      toast({
        title: "Missing style",
        description: "Please select a video style",
        variant: "destructive",
      });
      return;
    }

    if (!isAdmin && !adminMode && credits < 10) {
      toast({
        title: "Insufficient Credits",
        description: "You don't have enough credits!",
        variant: "destructive",
      });
      setShowCreditsPurchase(true);
      return;
    }

    setIsGenerating(true);
    setGenStatus("processing");
    setGenMessage("Preparing images...");
    setGeneratedVideoUrl(null);
    setShowResultModal(true);
    setProgress(10);
    setPipelineStage("preparing");

    try {
      // Helper to resize image to 9:16 aspect ratio
      const resizeTo9x16 = async (blob: Blob): Promise<Blob> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              reject(new Error('Could not get canvas context'));
              return;
            }

            const targetAspectRatio = 9 / 16;
            const sourceAspectRatio = img.width / img.height;

            let sourceWidth = img.width;
            let sourceHeight = img.height;
            let sourceX = 0;
            let sourceY = 0;

            if (sourceAspectRatio > targetAspectRatio) {
              sourceWidth = img.height * targetAspectRatio;
              sourceX = (img.width - sourceWidth) / 2;
            } else {
              sourceHeight = img.width / targetAspectRatio;
              sourceY = (img.height - sourceHeight) / 2;
            }

            const maxWidth = 1080;
            const maxHeight = 1920;
            canvas.width = maxWidth;
            canvas.height = maxHeight;

            ctx.drawImage(
              img,
              sourceX, sourceY, sourceWidth, sourceHeight,
              0, 0, maxWidth, maxHeight
            );

            canvas.toBlob(
              (resizedBlob) => {
                if (resizedBlob) {
                  resolve(resizedBlob);
                } else {
                  reject(new Error('Failed to create resized blob'));
                }
              },
              'image/jpeg',
              0.92
            );
          };
          img.onerror = () => reject(new Error('Failed to load image'));
          img.src = URL.createObjectURL(blob);
        });
      };

      // Helper to convert blob to base64
      const toBase64 = (blob: Blob): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64String = reader.result as string;
            const base64Data = base64String.split(',')[1];
            resolve(base64Data);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      };

      // Resize and upload product image
      setGenMessage("Uploading images...");
      const resizedProduct = await resizeTo9x16(productFile);
      const productBase64 = await toBase64(resizedProduct);
      const { data: productImgbbData, error: productImgbbError } = await supabase.functions.invoke(
        "upload-to-imgbb",
        { body: { image_base64: productBase64 } }
      );
      if (productImgbbError) throw productImgbbError;
      const productUrl = productImgbbData.url;

      // Get model blob (required when voiceover is enabled, OR when model is selected for no-voiceover)
      let modelImageUrl: string | null = null;
      const hasModelSelected = modelFile || selectedModel;
      
      if (voiceoverOption !== "none" || hasModelSelected) {
        if (modelFile || selectedModel) {
          let modelBlob: Blob;
          if (modelFile) {
            modelBlob = modelFile;
          } else if (selectedModel) {
            const resp = await fetch(selectedModel, { cache: 'no-store' });
            if (!resp.ok) throw new Error(`Failed to fetch model image (${resp.status})`);
            modelBlob = await resp.blob();
          } else {
            throw new Error('No model selected');
          }

          // Resize and upload model image
          const resizedModel = await resizeTo9x16(modelBlob);
          const modelBase64 = await toBase64(resizedModel);
          const { data: modelImgbbData, error: modelImgbbError } = await supabase.functions.invoke(
            "upload-to-imgbb",
            { body: { image_base64: modelBase64 } }
          );
          if (modelImgbbError) throw modelImgbbError;
          modelImageUrl = modelImgbbData.url;
        }
      }

      setProgress(25);

      // Build voiceover text - use previewed, custom, or let backend generate
      let voiceoverText = "";
      if (previewedVoiceover) {
        voiceoverText = previewedVoiceover; // Use previewed voiceover if available
      } else if (voiceoverOption === "custom" && customVoiceover.trim()) {
        voiceoverText = customVoiceover;
      }
      // For "auto" without preview, leave empty so backend generates category-specific voiceover

      // Get the selected style prompt
      const stylePrompt = presetStyles.find(s => s.id === selectedStyle)?.prompt || presetStyles[0].prompt;

      // Build scene background portion
      const backgroundPrompt = sceneBackground.trim() 
        ? `Setting/Background: ${sceneBackground.trim()}.` 
        : '';

      let ugcImageUrl: string;

      // Step 1: Generate image using nano-banana-2
      setGenMessage("Generating image...");
      setProgress(30);
      setPipelineStage("generating_image");

      if (modelImageUrl) {
        // UGC image with model (with or without voiceover)
        // For no-voiceover, use modelBehavior for scene direction in image
        const behaviorDirections = modelBehavior.trim() 
          ? `Model behavior/pose: ${modelBehavior.trim()}.` 
          : '';
        
        // Special handling for fashion/clothing category - model wears the clothing
        const isClothingCategory = categoryPreset === 'fashion';
        const clothingInstruction = isClothingCategory 
          ? 'Model WEARING the clothing item directly on their body. NO innerwear visible, NO undershirt, NO tank top underneath. The clothing item is worn as the main/only visible garment on that body area. Natural fit, styled properly.' 
          : 'Model holding or using the product.';
        
        const realisticModelDirective = `Captured as a realistic documentary-style photograph. KEY DETAILS: natural skin texture, authentic emotion, genuine engagement with product. SKIN DETAILS: smooth and natural-looking skin with only minimal, subtle texture — no exaggerated pores or blemishes, but avoid artificial airbrushed perfection. HAIR DETAILS: natural texture, baby hairs, stray hairs. EXPRESSION/POSE: relaxed, unposed. Natural LIGHT DIRECTION: ambient daylight with soft, flattering quality. Neutral color science, realistic contrast, no heavy retouching but maintain a clean, polished-natural look. Shot on LENS: smartphone / 50-85mm, realistic depth of field. CAMERA FEEL: high-quality smartphone photography, organic sharpness, natural color rendering. The image should feel authentic and human — like a well-lit smartphone photo, not AI-generated, not over-processed.`;

        const ugcPrompt = voiceoverOption !== "none"
          ? `${stylePrompt}. ${backgroundPrompt} Medium shot portrait with ${clothingInstruction} ${realisticModelDirective} 9:16 vertical format for social media. No text overlays, no captions, no transition effects, clean and simple.`
          : `${stylePrompt}. ${backgroundPrompt} ${behaviorDirections} ${clothingInstruction} ${realisticModelDirective} Silent demonstration pose - natural, relaxed expression. Model NOT speaking. 9:16 vertical format. No text overlays.`;

        const { data: ugcImageData, error: ugcImageError } = await supabase.functions.invoke(
          'generate-ugc-image',
          {
            body: {
              prompt: ugcPrompt,
              image_urls: [modelImageUrl, productUrl],
            },
          }
        );

        if (ugcImageError) throw ugcImageError;
        if (ugcImageData?.error) {
          throw new Error(ugcImageData.error);
        }

        ugcImageUrl = ugcImageData.image_url;
        console.log('Generated UGC image with model:', ugcImageUrl);
      } else {
        // Product-only image using nano-banana-2 in 9:16 at 2K - NO MODEL
        // Use the uploaded product image as reference, retain it fully without cropping
        // Apply background prompt to create the scene around the product
        const productPrompt = `Keep the exact product from the reference image. DO NOT crop or cut the product. Show the COMPLETE product fully visible. ${backgroundPrompt ? backgroundPrompt : 'Clean professional background, soft neutral tones.'} ${stylePrompt}. Professional product photography. IMPORTANT: NO HUMANS, NO MODELS, NO PEOPLE, NO HANDS, NO FACES. Show ONLY the product centered and fully visible. ${productName ? `Product: ${productName}.` : ''} Clean composition, professional lighting, premium product photography style. 9:16 vertical format for social media. No text overlays, no captions.`;

        // Start async generation with nano-banana-2
        const { data: genStartData, error: genStartError } = await supabase.functions.invoke(
          'generate-creator-product-image',
          {
            body: {
              action: 'generate',
              prompt: productPrompt,
              image_urls: [productUrl],
              aspect_ratio: '9:16',
              resolution: '2K',
            },
          }
        );

        if (genStartError) throw genStartError;
        if (genStartData?.error) {
          throw new Error(genStartData.error);
        }

        const productRequestId = genStartData.request_id;
        console.log('Started product image generation, request_id:', productRequestId);

        // Poll for product image completion
        setGenMessage("Processing product image...");
        let productImageCompleted = false;
        let pollAttempts = 0;
        const maxAttempts = 120; // 4 minutes max

        while (!productImageCompleted && pollAttempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          pollAttempts++;

          const { data: statusData, error: statusError } = await supabase.functions.invoke(
            'generate-creator-product-image',
            {
              body: {
                action: 'status',
                requestId: productRequestId,
              },
            }
          );

          if (statusError) throw statusError;

          if (statusData.status === 'COMPLETED' && statusData.images?.[0]) {
            ugcImageUrl = statusData.images[0];
            productImageCompleted = true;
            console.log('Product image generated:', ugcImageUrl);
          } else if (statusData.status === 'FAILED') {
            throw new Error(statusData.error || 'Product image generation failed');
          }

          setProgress(30 + Math.min(pollAttempts, 20));
        }

        if (!productImageCompleted) {
          throw new Error('Product image generation timed out');
        }
      }

      setProgress(50);

      // Step 2: Generate video from image
      setGenMessage("Generating video from image...");
      setProgress(60);
      setPipelineStage("generating_video");

      // Build video prompt based on voiceover option and model selection
      let videoPrompt = '';
      const hasModelInVideo = modelImageUrl !== null;
      
      if (voiceoverOption === "none") {
        if (hasModelInVideo) {
          // Silent video WITH model
          const behaviorDirections = modelBehavior.trim() 
            ? `Model behavior: ${modelBehavior.trim()}.` 
            : 'Model naturally interacts with product through gestures and expressions.';
          videoPrompt = `${stylePrompt}. ${backgroundPrompt} ${behaviorDirections} Silent UGC-style video with model demonstrating product. NO SPEECH, NO VOICEOVER. Natural gestures, genuine expressions. No text overlays.`;
        } else {
          // Product-only video (no model, no voice)
          const behaviorDirections = modelBehavior.trim() 
            ? `Scene direction: ${modelBehavior.trim()}.` 
            : 'Product showcase with subtle movement and lighting.';
          videoPrompt = `${stylePrompt}. ${backgroundPrompt} ${behaviorDirections} Professional product-only showcase video. NO people, NO voices. Clean and simple.`;
        }
      } else {
        videoPrompt = `${stylePrompt}. ${backgroundPrompt} UGC video with creator speaking. No text overlays, no captions. Clean and authentic.`;
      }

      // Video Editing Style (Omni): fold the chosen cut style + duration into the
      // prompt, and add the voice-performance delivery when there's a voiceover.
      const cutStyle = cutStyleById(cutStyleId);
      videoPrompt += ` Editing style: ${cutStyle.name} — ${cutStyle.description} Target length about ${duration} seconds. Aspect ratio ${aspectRatio}.`;
      if (voiceoverOption !== "none") {
        const vp = voicePerformanceById(voicePerformance);
        videoPrompt += ` Voice performance: ${vp.label} — ${vp.description}`;
      }

      // Camera Style Preset: append the chosen camera style (empty for "No style").
      const cam = cameraStylePrompt(cameraStyle);

      const { data: generateData, error: generateError } = await supabase.functions.invoke(
        'generate-ugc-video',
        {
          body: {
            modelImageUrl: ugcImageUrl, // Use the generated UGC image or product image
            productImageUrl: productUrl, // Pass the actual product image
            prompt: cam ? `${videoPrompt}. ${cam}` : videoPrompt,
            language,
            voiceover: voiceoverText || undefined, // Only pass if custom
            productName: productName, // Pass product name for AI to generate tailored script
            categoryPreset: categoryPreset, // Always pass category for AI context
            generate_audio: voiceoverOption !== "none", // Disable audio when no voiceover selected
            has_model: hasModelInVideo, // Pass whether model is present (for silent videos with model)
            modelBehavior: modelBehavior.trim() || undefined, // Pass model behavior/scene direction for no-voiceover mode
            aspect_ratio: aspectRatio,        // Omni: '9:16' | '16:9'
            cut_style: cutStyleId,            // Omni: chosen cut style id
            duration_seconds: duration,       // Omni: 6 | 8 | 10
            voice_performance: voicePerformance,
            voice_performance_directive: `${voicePerformanceById(voicePerformance).label}: ${voicePerformanceById(voicePerformance).description}`,
          },
        }
      );

      if (generateError) throw generateError;
      
      // Check if the response contains an error from FAL API
      if (generateData?.error) {
        const errorMsg = typeof generateData.error === 'string' 
          ? generateData.error 
          : Array.isArray(generateData.error) 
            ? generateData.error.map((e: any) => e.msg || JSON.stringify(e)).join(', ')
            : JSON.stringify(generateData.error);
        setGenStatus("failed");
        setGenMessage(errorMsg);
        toast({
          title: "Generation Failed",
          description: errorMsg,
          variant: "destructive",
        });
        return;
      }

      const requestId = generateData.request_id;
      setProgress(70);
      
      // Poll for completion
      const pollInterval = setInterval(async () => {
        try {
          const { data: statusData, error: statusError } = await supabase.functions.invoke(
            'generate-ugc-video',
            {
              body: {
                action: 'status',
                requestId: requestId,
              },
            }
          );

          if (statusError) {
            clearInterval(pollInterval);
            throw statusError;
          }

          if (statusData.status === 'COMPLETED' && statusData.video_url) {
            clearInterval(pollInterval);
            setGeneratedVideoUrl(statusData.video_url);
            setGenStatus('completed');

            // Save generation (only if user exists)
            if (user?.id) {
              await supabase.from('generations').insert({
                user_id: user.id,
                prompt: stylePrompt,
                original_image_url: productUrl,
                generated_image_url: statusData.video_url,
                status: 'completed',
                tool_name: 'creator-studio',
              });
            }

            // Deduct credit (skip for admins) - 8s video costs 10 credits
            if (!isAdmin && !adminMode && user?.id) {
              const newBalance = await deductCredits(user.id, 10);
              setCredits(newBalance);
            }
            setIsGenerating(false);
            setProgress(100);
            
            toast({ title: "Success!", description: "Your UGC video has been generated" });
          } else if (statusData.status === 'FAILED' || statusData.error) {
            clearInterval(pollInterval);
            setIsGenerating(false);
            setGenStatus('failed');
            setGenMessage(statusData.error || 'Generation failed');
            setProgress(0);
            throw new Error(statusData.error || 'Generation failed');
          } else {
            setGenStatus('processing');
            setGenMessage('Processing...');
            setProgress(Math.min(progress + 5, 90));
          }
        } catch (error) {
          clearInterval(pollInterval);
          setIsGenerating(false);
          throw error;
        }
      }, 3000);

      // Timeout after 5 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        if (isGenerating) {
          setIsGenerating(false);
          setGenStatus('failed');
          setGenMessage('Timeout: Video generation took too long.');
          setProgress(0);
          toast({
            title: "Timeout",
            description: "Video generation took too long. Please try again.",
            variant: "destructive",
          });
        }
      }, 300000);

    } catch (error) {
      console.error('Generation error:', error);
      setIsGenerating(false);
      setGenStatus('failed');
      setGenMessage("Something went wrong. Please try again.");
      setProgress(0);
      toast({
        title: "Generation failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleReset = () => {
    setGeneratedVideoUrl(null);
    setProductFile(null);
    setProductName("");
    setSelectedModel(null);
    setModelFile(null);
    setSelectedStyle("enthusiastic");
    setCustomVoiceover("");
    setGenStatus("idle");
    setGenMessage("");
    setProgress(0);
  };

  const handleCloseModal = () => {
    setShowResultModal(false);
    if (genStatus === 'completed') {
      handleReset();
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {isAdmin && <AdminToolsSidebar />}
      
      <div className="flex-1 flex flex-col">
        {/* Navigation */}
        <nav className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <img src={logoImage} alt="Floowy.ai" className="h-8 w-auto" />
                <span className="font-bold text-xl text-foreground">Floowy.ai</span>
              </div>
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
                  onAddCredits={() => {}} 
                />
                <UserMenu onAddCredits={() => {}} />
              </div>
            )}
          </div>
        </nav>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Creator Studio
          </h1>
          <p className="text-xl text-muted-foreground">
            Create authentic UGC-style videos for your products
          </p>
          <Link to="/knowledge-base/creator-studio" className="text-sm text-primary hover:underline mt-2 inline-block">
            Need More Clarity? Check our detailed knowledge base guide for step-by-step instructions
          </Link>
        </div>

        <div className="space-y-8">
          {/* First Section: Upload Image + Category Preset, Product Name + Language + Voiceover */}
          <div className="grid md:grid-cols-2 gap-8 items-stretch">
            {/* Left Column: Upload Image + Category Preset */}
            <div className="space-y-6 flex flex-col h-full">
              <div className="flex-1 flex flex-col" data-walkthrough-target="tool-upload">
                <UploadArea
                  onFileSelect={setProductFile}
                  selectedFile={productFile}
                  label="Upload Product Image"
                />
              </div>
              
              {/* Category Preset */}
              <div className="bg-card rounded-xl border border-border p-6 flex-1 flex flex-col" data-walkthrough-target="cs-category">
                <div className="flex items-center gap-3 mb-4">
                  <Label className="text-lg font-semibold">Product Category</Label>
                  <Badge variant="secondary" className="capitalize">
                    {categoryPreset === 'auto' ? 'Auto-Detect' :
                     categoryPreset === 'sunscreen' ? 'Sunscreen/Skincare' :
                     categoryPreset === 'shoes' ? 'Shoes/Footwear' :
                     categoryPreset === 'tech' ? 'Tech/Gadgets' :
                     categoryPreset === 'fashion' ? 'Fashion/Clothing' :
                     categoryPreset === 'makeup' ? 'Makeup/Cosmetics' :
                     categoryPreset === 'food' ? 'Food/Supplements' :
                     categoryPreset === 'fitness' ? 'Fitness' : categoryPreset}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 flex-1">
                  <Button
                    variant="outline"
                    onClick={() => setCategoryPreset('auto')}
                    className={`h-auto py-3 px-4 flex flex-col items-center justify-center text-center transition-all hover:scale-105 hover:border-primary ${
                      categoryPreset === 'auto' ? 'border-primary border-2 bg-primary/10' : ''
                    }`}
                  >
                    <span className="font-medium">Auto-Detect</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setCategoryPreset('sunscreen')}
                    className={`h-auto py-3 px-4 flex flex-col items-center justify-center text-center transition-all hover:scale-105 hover:border-primary ${
                      categoryPreset === 'sunscreen' ? 'border-primary border-2 bg-primary/10' : ''
                    }`}
                  >
                    <span className="font-medium">Sunscreen/Skincare</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setCategoryPreset('shoes')}
                    className={`h-auto py-3 px-4 flex flex-col items-center justify-center text-center transition-all hover:scale-105 hover:border-primary ${
                      categoryPreset === 'shoes' ? 'border-primary border-2 bg-primary/10' : ''
                    }`}
                  >
                    <span className="font-medium">Shoes/Footwear</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setCategoryPreset('tech')}
                    className={`h-auto py-3 px-4 flex flex-col items-center justify-center text-center transition-all hover:scale-105 hover:border-primary ${
                      categoryPreset === 'tech' ? 'border-primary border-2 bg-primary/10' : ''
                    }`}
                  >
                    <span className="font-medium">Tech/Gadgets</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setCategoryPreset('fashion')}
                    className={`h-auto py-3 px-4 flex flex-col items-center justify-center text-center transition-all hover:scale-105 hover:border-primary ${
                      categoryPreset === 'fashion' ? 'border-primary border-2 bg-primary/10' : ''
                    }`}
                  >
                    <span className="font-medium">Fashion/Clothing</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setCategoryPreset('makeup')}
                    className={`h-auto py-3 px-4 flex flex-col items-center justify-center text-center transition-all hover:scale-105 hover:border-primary ${
                      categoryPreset === 'makeup' ? 'border-primary border-2 bg-primary/10' : ''
                    }`}
                  >
                    <span className="font-medium">Makeup/Cosmetics</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setCategoryPreset('food')}
                    className={`h-auto py-3 px-4 flex flex-col items-center justify-center text-center transition-all hover:scale-105 hover:border-primary ${
                      categoryPreset === 'food' ? 'border-primary border-2 bg-primary/10' : ''
                    }`}
                  >
                    <span className="font-medium">Food/Supplements</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setCategoryPreset('fitness')}
                    className={`h-auto py-3 px-4 flex flex-col items-center justify-center text-center transition-all hover:scale-105 hover:border-primary ${
                      categoryPreset === 'fitness' ? 'border-primary border-2 bg-primary/10' : ''
                    }`}
                  >
                    <span className="font-medium">Fitness Equipment</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Right Column: Product Name, Language, Voiceover */}
            <div className="space-y-6 flex flex-col">
              {/* Product Name */}
              <div className="bg-card rounded-xl border border-border p-6" data-walkthrough-target="cs-name">
                <Label htmlFor="productName" className="text-lg font-semibold mb-4 block">
                  Product Name
                </Label>
                <input
                  id="productName"
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g., Lightweight SPF 50 Sunscreen, Running Shoes..."
                  className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Language Selection - Hidden when no voiceover */}
              {voiceoverOption !== "none" && (
                <div className="bg-card rounded-xl border border-border p-6" data-walkthrough-target="cs-language">
                  <div className="flex items-center gap-3 mb-4">
                    <Label className="text-lg font-semibold">Language</Label>
                    <Badge variant="secondary" className="capitalize">
                      {language === 'british' ? 'British English' : 
                       language === 'american' ? 'American English' :
                       language === 'dutch' ? 'Dutch' :
                       language === 'spanish' ? 'Spanish' :
                       language === 'german' ? 'German' :
                       language === 'french' ? 'French' :
                       language === 'italian' ? 'Italian' :
                       language === 'arabic' ? 'Arabic' :
                       language === 'mandarin' ? 'Mandarin' :
                       language === 'portuguese' ? 'Portuguese' : language}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="lg"
                            onClick={() => setLanguage('british')}
                            className={`h-16 w-full flex items-center justify-center p-2 transition-all hover:scale-105 hover:border-primary ${
                              language === 'british' ? 'border-primary border-2 bg-primary/10' : ''
                            }`}
                          >
                            <img 
                              src="https://flagcdn.com/w80/gb.png" 
                              alt="British English"
                              className="w-full h-full object-contain"
                            />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>British English</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="lg"
                            onClick={() => setLanguage('american')}
                            className={`h-16 w-full flex items-center justify-center p-2 transition-all hover:scale-105 hover:border-primary ${
                              language === 'american' ? 'border-primary border-2 bg-primary/10' : ''
                            }`}
                          >
                            <img 
                              src="https://flagcdn.com/w80/us.png" 
                              alt="American English"
                              className="w-full h-full object-contain"
                            />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>American English</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="lg"
                            onClick={() => setLanguage('dutch')}
                            className={`h-16 w-full flex items-center justify-center p-2 transition-all hover:scale-105 hover:border-primary ${
                              language === 'dutch' ? 'border-primary border-2 bg-primary/10' : ''
                            }`}
                          >
                            <img 
                              src="https://flagcdn.com/w80/nl.png" 
                              alt="Dutch"
                              className="w-full h-full object-contain"
                            />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Dutch</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="lg"
                            onClick={() => setLanguage('spanish')}
                            className={`h-16 w-full flex items-center justify-center p-2 transition-all hover:scale-105 hover:border-primary ${
                              language === 'spanish' ? 'border-primary border-2 bg-primary/10' : ''
                            }`}
                          >
                            <img 
                              src="https://flagcdn.com/w80/es.png" 
                              alt="Spanish"
                              className="w-full h-full object-contain"
                            />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Spanish</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="lg"
                            onClick={() => setLanguage('german')}
                            className={`h-16 w-full flex items-center justify-center p-2 transition-all hover:scale-105 hover:border-primary ${
                              language === 'german' ? 'border-primary border-2 bg-primary/10' : ''
                            }`}
                          >
                            <img 
                              src="https://flagcdn.com/w80/de.png" 
                              alt="German"
                              className="w-full h-full object-contain"
                            />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>German</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="lg"
                            onClick={() => setLanguage('french')}
                            className={`h-16 w-full flex items-center justify-center p-2 transition-all hover:scale-105 hover:border-primary ${
                              language === 'french' ? 'border-primary border-2 bg-primary/10' : ''
                            }`}
                          >
                            <img 
                              src="https://flagcdn.com/w80/fr.png" 
                              alt="French"
                              className="w-full h-full object-contain"
                            />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>French</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="lg"
                            onClick={() => setLanguage('italian')}
                            className={`h-16 w-full flex items-center justify-center p-2 transition-all hover:scale-105 hover:border-primary ${
                              language === 'italian' ? 'border-primary border-2 bg-primary/10' : ''
                            }`}
                          >
                            <img 
                              src="https://flagcdn.com/w80/it.png" 
                              alt="Italian"
                              className="w-full h-full object-contain"
                            />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Italian</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="lg"
                            onClick={() => setLanguage('arabic')}
                            className={`h-16 w-full flex items-center justify-center p-2 transition-all hover:scale-105 hover:border-primary ${
                              language === 'arabic' ? 'border-primary border-2 bg-primary/10' : ''
                            }`}
                          >
                            <img 
                              src="https://flagcdn.com/w80/sa.png" 
                              alt="Arabic"
                              className="w-full h-full object-contain"
                            />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Arabic</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="lg"
                            onClick={() => setLanguage('mandarin')}
                            className={`h-16 w-full flex items-center justify-center p-2 transition-all hover:scale-105 hover:border-primary ${
                              language === 'mandarin' ? 'border-primary border-2 bg-primary/10' : ''
                            }`}
                          >
                            <img 
                              src="https://flagcdn.com/w80/cn.png" 
                              alt="Mandarin"
                              className="w-full h-full object-contain"
                            />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Mandarin</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="lg"
                            onClick={() => setLanguage('portuguese')}
                            className={`h-16 w-full flex items-center justify-center p-2 transition-all hover:scale-105 hover:border-primary ${
                              language === 'portuguese' ? 'border-primary border-2 bg-primary/10' : ''
                            }`}
                          >
                            <img 
                              src="https://flagcdn.com/w80/pt.png" 
                              alt="Portuguese"
                              className="w-full h-full object-contain"
                            />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Portuguese</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              )}

              {/* Voiceover Options */}
              <div className="bg-card rounded-xl border border-border p-6 flex-1 flex flex-col" data-walkthrough-target="cs-voiceover">
                <Label className="text-lg font-semibold mb-4">Voiceover</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <Button
                    variant="outline"
                    onClick={() => setVoiceoverOption("auto")}
                    className={`h-auto py-3 px-4 flex flex-col items-center justify-center text-center transition-all hover:scale-105 hover:border-primary ${
                      voiceoverOption === "auto" ? "border-primary border-2 bg-primary/10" : ""
                    }`}
                  >
                    <Sparkles className="h-5 w-5 mb-1" />
                    <span className="font-medium">Auto-generated</span>
                    <span className="text-xs text-muted-foreground">AI creates the script</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setVoiceoverOption("custom")}
                    className={`h-auto py-3 px-4 flex flex-col items-center justify-center text-center transition-all hover:scale-105 hover:border-primary ${
                      voiceoverOption === "custom" ? "border-primary border-2 bg-primary/10" : ""
                    }`}
                  >
                    <Info className="h-5 w-5 mb-1" />
                    <span className="font-medium">Custom text</span>
                    <span className="text-xs text-muted-foreground">Write your own script</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setVoiceoverOption("none")}
                    className={`h-auto py-3 px-4 flex flex-col items-center justify-center text-center transition-all hover:scale-105 hover:border-primary sm:col-span-2 ${
                      voiceoverOption === "none" ? "border-primary border-2 bg-primary/10" : ""
                    }`}
                  >
                    <span className="font-medium">No voiceover</span>
                    <span className="text-xs text-muted-foreground">Silent video with model direction</span>
                  </Button>
                </div>
                
                {voiceoverOption === "auto" && (
                  <div className="space-y-3">
                    <Button
                      onClick={handlePreviewVoiceover}
                      disabled={isPreviewingVoiceover || !productName.trim()}
                      variant="outline"
                      className="w-full"
                    >
                      {isPreviewingVoiceover ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating Preview...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Preview Voiceover
                        </>
                      )}
                    </Button>
                    
                    {previewedVoiceover && (() => {
                      // Exact + warn: the script is spoken word-for-word; we only
                      // flag when it looks too long for the selected clip length.
                      const words = countWords(previewedVoiceover);
                      const maxWords = maxVoiceoverWords(language, duration);
                      const tooLong = words > maxWords + 1;
                      return (
                        <div className="p-4 rounded-lg bg-muted/50 border space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm text-foreground flex-1 leading-relaxed">{previewedVoiceover}</p>
                            <Button
                              onClick={handlePreviewVoiceover}
                              variant="ghost"
                              size="sm"
                              className="shrink-0"
                              title="Regenerate voiceover"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {words} words · spoken exactly as shown
                          </p>
                          {tooLong && (
                            <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-800">
                              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                              <span>
                                This script may be too long to fit {duration} seconds (aim for ~{maxWords} words).
                                It will still be spoken exactly as written, but speech could feel rushed or get cut off —
                                consider a longer duration or regenerate for a shorter script.
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
                
                {voiceoverOption === "custom" && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm text-muted-foreground">Custom Script</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>Please limit your script to approximately 8 seconds of speech for best results.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Textarea
                      placeholder="Enter your custom voiceover text (max ~8 seconds of speech)..."
                      value={customVoiceover}
                      onChange={(e) => setCustomVoiceover(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>
                )}

                {voiceoverOption === "none" && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm text-muted-foreground">Model Behavior / Scene Direction</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>Describe how the model should act or move, and how the scene should look without voiceover.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Textarea
                      placeholder="e.g., Model smiling while holding the product, gentle camera movement, soft lighting..."
                      value={modelBehavior}
                      onChange={(e) => setModelBehavior(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Block 6 (NEW): Voice Performance */}
          <div className="bg-card rounded-xl border border-border p-6">
            <VoicePerformanceBlock value={voicePerformance} onChange={setVoicePerformance} />
          </div>

          {/* Second Section: Select Avatar + Upload Your Own Avatar */}
          <div className="grid grid-cols-1 md:grid-cols-10 gap-6">
            {/* Model Selector with integrated upload */}
            <div className="md:col-span-10">
              <div className="bg-card rounded-xl border border-border p-6" data-walkthrough-target="tool-model">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-lg font-semibold">Select Avatar</h3>
                  {voiceoverOption === "none" && (
                    <Badge variant="secondary" className="text-xs">Optional</Badge>
                  )}
                </div>
                {voiceoverOption === "none" && (
                  <p className="text-sm text-muted-foreground mb-4">
                    Add a model for silent product demonstrations, or skip for product-only videos.
                  </p>
                )}
                <ModelSelector
                    selectedModel={selectedModel}
                    onModelSelect={handleModelSelect}
                    customModelFile={modelFile}
                    onCustomModelFileChange={setModelFile}
                    columns={10}
                  />
                {voiceoverOption === "none" && selectedModel && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSelectedModel(null)} 
                    className="mt-3 text-muted-foreground"
                  >
                    Clear selection (product-only video)
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Third Section: Style Selection in 2 Columns */}
          <div className="bg-card rounded-xl border border-border p-6 space-y-4" data-walkthrough-target="tool-style">
            <Label className="text-lg font-semibold">Video Style</Label>
            <RadioGroup value={selectedStyle} onValueChange={setSelectedStyle} className="grid md:grid-cols-2 gap-4">
              {presetStyles.map((style) => (
                <div key={style.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors border border-border">
                  <RadioGroupItem value={style.id} id={style.id} className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor={style.id} className="cursor-pointer font-medium text-base">
                      {style.name}
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">{style.prompt}</p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Block 9 (NEW): Video Editing Style */}
          <div className="bg-card rounded-xl border border-border p-6">
            <VideoEditingStyleBlock
              aspectRatio={aspectRatio}
              cutStyleId={cutStyleId}
              duration={duration}
              onAspectRatio={setAspectRatio}
              onCutStyle={(id) => { setCutStyleId(id); setDuration(cutStyleById(id).defaultDuration); }}
              onDuration={setDuration}
            />
          </div>

          {/* Camera Style Presets */}
          <div className="bg-card rounded-xl border border-border p-6">
            <CameraStylePresetSelect value={cameraStyle} onChange={setCameraStyle} />
          </div>

          {/* Fourth Section: Scene Background Prompt */}
          <div className="bg-card rounded-xl border border-border p-6 space-y-4" data-walkthrough-target="tool-prompt">
            <div className="flex items-center gap-2">
              <Label className="text-lg font-semibold">Scene Background</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Describe the environment or setting where the video should take place.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Textarea
              placeholder="e.g., Modern living room with natural lighting, cozy bedroom, outdoor garden setting, minimalist white studio..."
              value={sceneBackground}
              onChange={(e) => setSceneBackground(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          {/* Generate Button - Centered */}
          <div className="flex justify-center" data-walkthrough-target="tool-output">
            <Button
              onClick={handleGenerate}
              disabled={!productFile || (voiceoverOption !== "none" && !selectedModel && !modelFile) || !selectedStyle || (!isAdmin && !adminMode && credits < creditsForDuration(duration)) || isGenerating}
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow h-auto py-3 text-lg px-12 flex-col gap-0.5"
            >
              <span className="flex items-center">
                <Sparkles className="w-5 h-5 mr-2" />
                {isAdmin || adminMode
                  ? "Generate UGC video (Admin - Free)"
                  : `Generate UGC video (${creditsForDuration(duration)} credits)`}
              </span>
              <span className="text-xs font-normal opacity-80">
                {duration} sec · {aspectRatio} · {cutStyleById(cutStyleId).name}
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* Generation Progress Overlay */}
      <GenerationProgressOverlay
        open={isGenerating}
        stage={pipelineStage}
        progress={progress}
        statusMessage={genMessage}
        title="Creating Your UGC Video"
        steps={CREATOR_PIPELINE_STEPS}
        onRetry={() => { setPipelineStage("preparing"); handleGenerate(); }}
        onClose={() => { setIsGenerating(false); setPipelineStage("preparing"); }}
      />

      {/* Result Modal */}
      <Dialog open={showResultModal && !isGenerating} onOpenChange={setShowResultModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Video Generation
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">

            {/* Video Result */}
            {genStatus === 'completed' && generatedVideoUrl ? (
              <div className="space-y-4">
                <div className="w-full aspect-video rounded-xl overflow-hidden bg-black">
                  <video 
                    src={generatedVideoUrl} 
                    controls 
                    autoPlay 
                    loop 
                    className="w-full h-full object-contain" 
                  />
                </div>
                <div className="flex gap-3 justify-center">
                  <Button 
                    onClick={gate(async () => {
                      try {
                        const response = await fetch(generatedVideoUrl);
                        const blob = await response.blob();
                        const blobUrl = URL.createObjectURL(blob);
                        const link = document.createElement("a");
                        link.href = blobUrl;
                        link.download = `floowy-ugc-${Date.now()}.mp4`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        URL.revokeObjectURL(blobUrl);
                      } catch (error) {
                        console.error('Download failed:', error);
                        window.open(generatedVideoUrl, '_blank');
                      }
                    })}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {canExport ? <Download className="w-4 h-4 mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
                    {canExport ? "Download Video" : "Unlock to Download"}
                  </Button>
                  <Button variant="outline" onClick={() => setVideoEditOpen(true)}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit Video
                  </Button>
                  <Button variant="outline" onClick={handleCloseModal}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Generate Another
                  </Button>
                </div>
              </div>
            ) : genStatus === 'failed' ? (
              <div className="text-center space-y-4 py-8">
                <div className="text-destructive text-lg font-semibold">Generation Failed</div>
                <p className="text-sm text-muted-foreground">{genMessage}</p>
                <Button onClick={handleCloseModal} variant="outline">
                  Try Again
                </Button>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      {generatedVideoUrl && (
        <VideoEditModal
          open={videoEditOpen}
          onClose={() => setVideoEditOpen(false)}
          videoUrl={generatedVideoUrl}
          onEdited={(url) => setGeneratedVideoUrl(url)}
        />
      )}
      </div>

      <CreditsPurchaseDialog 
        open={showCreditsPurchase}
        onOpenChange={setShowCreditsPurchase}
      />
      <UnlockDialog open={unlockOpen} onOpenChange={setUnlockOpen} />
    </div>
  );
};

export default CreatorStudioGenerator;
