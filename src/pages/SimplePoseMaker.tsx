 import { useState, useEffect } from "react";
 import DragDropZone from "@/components/DragDropZone";
 import { useNavigate } from "react-router-dom";
 import { supabase } from "@/integrations/supabase/client";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { useToast } from "@/hooks/use-toast";
 import { useAdminCheck } from "@/hooks/useAdminCheck";
 import { useAdminToken } from "@/hooks/useAdminToken";
import { ArrowLeft, Upload, Loader2, X, Download, Shield, RefreshCw, Pencil, Wand2, CheckCircle2, Image as ImageIcon, Lock } from "lucide-react";
import GenerationProgressOverlay from "@/components/GenerationProgressOverlay";
import ImageEditModal from "@/components/ImageEditModal";
  import PlanCreditsDisplay from "@/components/PlanCreditsDisplay";
  import UserMenu from "@/components/UserMenu";
   import logoImage from "@/assets/floowy-logo.png";
   import { deductCredits } from "@/hooks/useCreditDeduction";
  import { Link } from "react-router-dom";
 import { useOnboardingCheck } from "@/hooks/useOnboardingCheck";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useImageGating } from "@/hooks/useImageGating";
import { UnlockDialog } from "@/components/UnlockDialog";
 
 const SimplePoseMaker = () => {
   const navigate = useNavigate();
   const { toast } = useToast();
   const { isAdmin, isLoading: isLoadingAdmin } = useAdminCheck();
   const hasAdminToken = useAdminToken();
   const [user, setUser] = useState<any>(null);
   const [session, setSession] = useState<any>(null);
   const [userEmail, setUserEmail] = useState<string>("");
   const [userName, setUserName] = useState<string>("");
   const [credits, setCredits] = useState(0);
   const [userPlan, setUserPlan] = useState<string>("free");
   useOnboardingCheck(true);
 
  // Clothing uploads - front and back views
  const [clothingFront, setClothingFront] = useState<File | null>(null);
  const [clothingBack, setClothingBack] = useState<File | null>(null);
  
  // Model upload
   const [modelImage, setModelImage] = useState<File | null>(null);
  
  // Pose reference uploads - front and back
  const [poseFront, setPoseFront] = useState<File | null>(null);
  const [poseBack, setPoseBack] = useState<File | null>(null);
  
  // Angle selection
  const [selectedAngles, setSelectedAngles] = useState<Array<'front' | 'back'>>(['front', 'back']);
  
   const [backgroundHex, setBackgroundHex] = useState<string>("#FFFFFF");
  const [selectedRatio, setSelectedRatio] = useState("1:1");
  const [resolution, setResolution] = useState<"1K" | "2K" | "4K">("1K");
 
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState<{
    front: 'pending' | 'processing' | 'completed' | 'failed';
    back: 'pending' | 'processing' | 'completed' | 'failed';
  }>({ front: 'pending', back: 'pending' });
  const [generatedImages, setGeneratedImages] = useState<{ front?: string; back?: string }>({});
  const [editingPoseImage, setEditingPoseImage] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showGeneratingDialog, setShowGeneratingDialog] = useState(false);
  const { canExport, displayUrl, gate, unlockOpen, setUnlockOpen } = useImageGating({
    isAdmin: isAdmin || hasAdminToken,
    urls: [generatedImages.front, generatedImages.back].filter(Boolean) as string[],
  });
 
  const ASPECT_RATIOS = [
    { label: "1:1", width: 1024, height: 1024 },
    { label: "2:3", width: 1024, height: 1536 },
    { label: "3:2", width: 1536, height: 1024 },
    { label: "4:5", width: 1024, height: 1280 },
    { label: "5:4", width: 1280, height: 1024 },
    { label: "9:16", width: 1080, height: 1920 },
    { label: "16:9", width: 1920, height: 1080 },
  ];

  const RESOLUTIONS = [
    { label: "1K", multiplier: 1, credits: 2 },
    { label: "2K", multiplier: 2, credits: 3 },
    { label: "4K", multiplier: 4, credits: 4 },
  ];

  const getOutputSize = () => {
    const ratio = ASPECT_RATIOS.find(r => r.label === selectedRatio) || ASPECT_RATIOS[0];
    const res = RESOLUTIONS.find(r => r.label === resolution) || RESOLUTIONS[0];
    return {
      width: Math.round(ratio.width * res.multiplier),
      height: Math.round(ratio.height * res.multiplier)
    };
  };
 
   useEffect(() => {
     const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
       setSession(session);
       setUser(session?.user ?? null);
       if (session?.user) {
         setTimeout(() => {
           fetchCredits(session.user.id);
           fetchUserData(session.user.id);
         }, 0);
       }
     });
 
     supabase.auth.getSession().then(async ({ data: { session } }) => {
       setSession(session);
       setUser(session?.user ?? null);
       if (session?.user) {
         await Promise.all([fetchCredits(session.user.id), fetchUserData(session.user.id)]);
       }
     });
 
     return () => subscription.unsubscribe();
   }, [navigate]);
 
   const fetchUserData = async (userId: string) => {
     try {
       const { data: profile } = await supabase.from("profiles").select("email, full_name, plan").eq("id", userId).single();
       if (profile) {
         setUserEmail(profile.email || "");
         setUserName(profile.full_name || "");
         setUserPlan(profile.plan || "free");
       }
     } catch (err) {}
   };
 
   const fetchCredits = async (userId: string) => {
     try {
       const { data } = await supabase.from("credits").select("balance").eq("user_id", userId).single();
       setCredits(data?.balance || 0);
     } catch (err) {}
   };
 
    const uploadToStorage = async (file: File): Promise<string> => {
      const userId = session?.user?.id;
      const isAdminMode = isAdmin || hasAdminToken;
      
      if (!userId && !isAdminMode) throw new Error('Not authenticated');
      
      const timestamp = Date.now();
      const ext = file.name.split('.').pop() || 'png';
      // Use admin folder for admin mode, otherwise user-specific folder
      const folder = userId || 'admin-uploads';
      const filePath = `${folder}/simple-pose-${timestamp}-${Math.random().toString(36).substring(7)}.${ext}`;
      
      const { data, error } = await supabase.storage
        .from('user-uploads')
        .upload(filePath, file, { upsert: true });
      
      if (error) {
        console.error('Storage upload error:', error);
        throw new Error(`Failed to upload image: ${error.message}`);
      }
      
      const { data: urlData } = supabase.storage
        .from('user-uploads')
        .getPublicUrl(data.path);
      
      return urlData.publicUrl;
    };
 
  const calculateCreditsPerImage = (): number => {
    const res = RESOLUTIONS.find(r => r.label === resolution);
    return res?.credits || 2;
   };
 
  const calculateTotalCredits = (): number => {
    return selectedAngles.length * calculateCreditsPerImage();
  };

  // Poll for generation status with client-side polling
  const pollForStatus = async (
    statusUrl: string, 
    responseUrl: string, 
    maxAttempts = 120
  ): Promise<{ status: string; image_url?: string; error?: string }> => {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Poll every 2 seconds
      
      
      
      const { data, error } = await supabase.functions.invoke('generate-simple-pose', {
        body: {
          action: 'check_status',
          status_url: statusUrl,
          response_url: responseUrl
        }
      });
      
      if (error) {
        console.error('Status check error:', error);
        continue;
      }
      
      console.log(`Poll attempt ${attempt + 1}:`, data?.status);
      
      if (data?.status === 'COMPLETED') {
        return { status: 'COMPLETED', image_url: data.image_url };
      }
      
      if (data?.status === 'FAILED') {
        return { status: 'FAILED', error: data.error };
      }
    }
    
    return { status: 'FAILED', error: 'Generation timed out' };
  };
 
  const toggleAngle = (angle: 'front' | 'back') => {
    setSelectedAngles(prev => {
      if (prev.includes(angle)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter(a => a !== angle);
      }
      return [...prev, angle];
    });
  };

  const canGenerate = (): boolean => {
    // Check if all required images for selected angles are uploaded
    const hasFrontImages = selectedAngles.includes('front') ? (clothingFront && poseFront) : true;
    const hasBackImages = selectedAngles.includes('back') ? (clothingBack && poseBack) : true;
    return !!(modelImage && hasFrontImages && hasBackImages);
  };

   const handleGenerate = async () => {
    if (!canGenerate()) {
      toast({ title: "Missing Images", description: "Please upload all required images for selected angles", variant: "destructive" });
       return;
     }
 
      const userId = session?.user?.id;
      if (!userId && !isAdmin && !hasAdminToken) {
        toast({ title: "Not Authenticated", description: "Please log in to continue", variant: "destructive" });
        return;
      }
 
    const creditsNeeded = calculateTotalCredits();
      if (!isAdmin && !hasAdminToken && credits < creditsNeeded) {
        toast({ title: "Insufficient Credits", description: `You need ${creditsNeeded} credits`, variant: "destructive" });
        return;
      }
 
    setIsGenerating(true);
    setGenerationStatus({ front: 'pending', back: 'pending' });
    setGeneratedImages({});
    setCurrentStep(1);
    setGenerationProgress(0);
    setShowGeneratingDialog(true);
 
     try {
      // Upload model image first (shared for both angles)
      const modelUrl = await uploadToStorage(modelImage!);
      console.log('Model uploaded:', modelUrl);

      // Process each selected angle
      const outputSize = getOutputSize();
      const isSingleView = selectedAngles.length === 1;

      for (const angle of selectedAngles) {
        setGenerationStatus(prev => ({ ...prev, [angle]: 'processing' }));
        setCurrentStep(1);
        setGenerationProgress(0);

        // Start a smooth progress timer: increments every 2s, caps at 95%
        let progressValue = 0;
        const progressTimer = setInterval(() => {
          progressValue = Math.min(95, progressValue + 2);
          setGenerationProgress(progressValue);
        }, 2000);
        
        try {
          const clothingFile = angle === 'front' ? clothingFront : clothingBack;
          const poseFile = angle === 'front' ? poseFront : poseBack;
          
          if (!clothingFile || !poseFile) {
            throw new Error(`Missing images for ${angle} angle`);
          }

          // Upload clothing and pose for this angle
          const [clothingUrl, poseUrl] = await Promise.all([
            uploadToStorage(clothingFile),
            uploadToStorage(poseFile)
          ]);

          console.log(`${angle} images uploaded:`, { clothingUrl, poseUrl });

          // STEP 1: Seedream - Apply clothing to pose reference
          console.log(`${angle}: Starting Step 1 - Clothing onto Pose (Seedream)`);
          const { data: step1Queue, error: step1Error } = await supabase.functions.invoke('generate-simple-pose', {
            body: {
              action: 'queue_step1',
              pose_url: poseUrl,
              clothing_url: clothingUrl
            }
          });

          if (step1Error) throw step1Error;
          if (step1Queue?.status !== 'QUEUED') throw new Error('Failed to queue Step 1');
          
          console.log(`${angle}: Step 1 queued, polling...`);
          const step1Result = await pollForStatus(
            step1Queue.status_url, 
            step1Queue.response_url, 
            120
          );
          
          if (step1Result.status !== 'COMPLETED' || !step1Result.image_url) {
            throw new Error(step1Result.error || 'Step 1 failed');
          }
          
          console.log(`${angle}: Step 1 completed:`, step1Result.image_url);
          setCurrentStep(2);
          
          // STEP 2: Nano Banana - Swap model while keeping pose and clothes
          console.log(`${angle}: Starting Step 2 - Model Swap (Nano Banana)`);
          const { data: step2Queue, error: step2Error } = await supabase.functions.invoke('generate-simple-pose', {
            body: {
              action: 'queue_step2',
              step1_result_url: step1Result.image_url,
              model_url: modelUrl,
            }
          });

          if (step2Error) throw step2Error;
          if (step2Queue?.status !== 'QUEUED') throw new Error('Failed to queue Step 2');
          
          console.log(`${angle}: Step 2 queued, polling...`);
          const step2Result = await pollForStatus(
            step2Queue.status_url, 
            step2Queue.response_url,
            120
          );
          
          if (step2Result.status !== 'COMPLETED' || !step2Result.image_url) {
            throw new Error(step2Result.error || 'Step 2 failed');
          }
          
          console.log(`${angle}: Step 2 completed:`, step2Result.image_url);
          
          // Done — jump to 100%
          clearInterval(progressTimer);
          setGenerationProgress(100);
          setGeneratedImages(prev => ({ ...prev, [angle]: step2Result.image_url }));
          setGenerationStatus(prev => ({ ...prev, [angle]: 'completed' }));
        } catch (angleError: any) {
          clearInterval(progressTimer);
          console.error(`Error generating ${angle}:`, angleError);
          setGenerationStatus(prev => ({ ...prev, [angle]: 'failed' }));
        }
      }

      // Deduct credits for successful generations
       const successCount = Object.values(generatedImages).filter(Boolean).length + selectedAngles.length;
      if (!isAdmin && !hasAdminToken && userId && successCount > 0) {
        const newBalance = await deductCredits(userId, creditsNeeded);
        setCredits(newBalance);
       }

      toast({ title: "Generation Complete!", description: `Generated ${selectedAngles.length} image(s)` });
     } catch (error: any) {
       console.error('Generation error:', error);
       toast({ title: "Generation Failed", description: "Something went wrong. Please try again.", variant: "destructive" });
     } finally {
       setIsGenerating(false);
     }
   };
 
   const handleDownload = async (url: string, angle: string) => {
     try {
       const response = await fetch(url);
       const blob = await response.blob();
       const link = document.createElement('a');
       link.href = URL.createObjectURL(blob);
       link.download = `simple-pose-${angle}-${Date.now()}.png`;
       link.click();
       URL.revokeObjectURL(link.href);
     } catch (error) {
       toast({ title: "Download Failed", variant: "destructive" });
     }
   };
 
   const handleReset = () => {
    setClothingFront(null);
    setClothingBack(null);
     setModelImage(null);
    setPoseFront(null);
    setPoseBack(null);
     setBackgroundHex("#FFFFFF");
     setGeneratedImages({});
    setSelectedAngles(['front', 'back']);
    setGenerationStatus({ front: 'pending', back: 'pending' });
   setShowGeneratingDialog(false);
   };
 
   const renderUploadBox = (
     label: string,
     file: File | null,
     setFile: (f: File | null) => void,
    description: string,
    compact: boolean = false
   ) => (
     <div className="space-y-2">
       <Label className="text-sm font-semibold">{label}</Label>
       {file ? (
        <div className="relative rounded-lg overflow-hidden border-2 border-primary bg-muted">
            <img
              src={URL.createObjectURL(file)}
              alt={label}
             className={`w-full ${compact ? 'h-28' : 'h-40'} object-contain`}
           />
           <Button
             variant="destructive"
             size="icon"
             className="absolute top-2 right-2 h-8 w-8"
             onClick={() => setFile(null)}
           >
             <X className="w-4 h-4" />
           </Button>
         </div>
       ) : (
         <DragDropZone onFileDrop={(files) => { if (files[0]) setFile(files[0]); }} accept="image/*" className="w-full">
         <label className={`border-2 border-dashed border-border rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors ${compact ? 'h-28' : 'h-40'}`}>
           <input
             type="file"
             accept="image/*"
             className="hidden"
             onChange={(e) => {
               const f = e.target.files?.[0];
               if (f) setFile(f);
             }}
           />
          <Upload className={`${compact ? 'w-6 h-6' : 'w-8 h-8'} text-muted-foreground mb-2`} />
          <span className="text-xs text-muted-foreground text-center">Drop or click · {description}</span>
         </label>
         </DragDropZone>
       )}
     </div>
   );
 
  const completedCount = Object.values(generatedImages).filter(Boolean).length;

   return (
     <div className="min-h-screen bg-gradient-to-b from-background via-secondary/20 to-background flex">
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
              {(isAdmin || hasAdminToken) ? (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">Admin Mode</span>
                </div>
              ) : (
               <div className="flex items-center gap-4">
                 <PlanCreditsDisplay plan={userPlan} credits={credits} onAddCredits={() => {}} />
                 <UserMenu onAddCredits={() => {}} />
               </div>
             )}
           </div>
         </nav>
 
         <main className="container mx-auto px-4 py-8">
           <div className="max-w-5xl mx-auto">
             <div className="text-center mb-8">
               <h2 className="text-3xl md:text-4xl font-bold mb-4">
                 Simple Pose Maker
               </h2>
               <p className="text-muted-foreground text-lg">
                 Transfer clothing to a model with precise pose matching
               </p>
             </div>
 
             <div className="grid lg:grid-cols-2 gap-8">
               {/* Left Column - Inputs */}
               <div className="space-y-6">
                {/* Model Upload */}
                 <div className="bg-card rounded-xl border border-border p-6 space-y-6">
                  <h3 className="text-lg font-semibold">Model</h3>
                  {renderUploadBox("Model Image", modelImage, setModelImage, "Upload the model to dress")}
                 </div>
 
                {/* Angle Selection */}
                 <div className="bg-card rounded-xl border border-border p-6 space-y-6">
                  <h3 className="text-lg font-semibold">Select Angles to Generate</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => toggleAngle('front')}
                      className={`px-4 py-3 rounded-lg border-2 transition-all ${
                        selectedAngles.includes('front')
                          ? "border-primary bg-primary/10 text-primary font-medium"
                          : "border-border hover:border-primary/50 text-muted-foreground"
                      }`}
                    >
                      Front View
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleAngle('back')}
                      className={`px-4 py-3 rounded-lg border-2 transition-all ${
                        selectedAngles.includes('back')
                          ? "border-primary bg-primary/10 text-primary font-medium"
                          : "border-border hover:border-primary/50 text-muted-foreground"
                      }`}
                    >
                      Back View
                    </button>
                   </div>
                </div>
 
                {/* Front View Uploads */}
                {selectedAngles.includes('front') && (
                  <div className="bg-card rounded-xl border border-border p-6 space-y-4">
                    <h3 className="text-lg font-semibold">Front View</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {renderUploadBox("Clothing (Front)", clothingFront, setClothingFront, "Front view of clothing", true)}
                      {renderUploadBox("Pose Reference (Front)", poseFront, setPoseFront, "Front pose reference", true)}
                     </div>
                   </div>
                )}
 
                {/* Back View Uploads */}
                {selectedAngles.includes('back') && (
                  <div className="bg-card rounded-xl border border-border p-6 space-y-4">
                    <h3 className="text-lg font-semibold">Back View</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {renderUploadBox("Clothing (Back)", clothingBack, setClothingBack, "Back view of clothing", true)}
                      {renderUploadBox("Pose Reference (Back)", poseBack, setPoseBack, "Back pose reference", true)}
                    </div>
                   </div>
                )}
 
               </div>
 
               {/* Right Column - Settings */}
               <div className="space-y-6">
                 {/* Background Hex */}
                 <div className="bg-card rounded-xl border border-border p-6 space-y-4">
                   <h3 className="text-lg font-semibold">Background Color</h3>
                   <div className="flex gap-3">
                     <div
                       className="w-12 h-12 rounded-lg border border-border flex-shrink-0"
                       style={{ backgroundColor: backgroundHex }}
                     />
                     <Input
                       type="text"
                       value={backgroundHex}
                       onChange={(e) => setBackgroundHex(e.target.value)}
                       placeholder="#FFFFFF"
                       className="flex-1"
                     />
                   </div>
                 </div>

                 {/* Output Size */}
                 <div className="bg-card rounded-xl border border-border p-6 space-y-4">
                   <h3 className="text-lg font-semibold">Output Size</h3>
                   <div>
                     <Label className="text-sm font-medium mb-3 block">Aspect Ratio</Label>
                     <div className="grid grid-cols-4 gap-2">
                       {ASPECT_RATIOS.map((ratio) => (
                         <button
                           key={ratio.label}
                           type="button"
                           onClick={() => setSelectedRatio(ratio.label)}
                           className={cn(
                             "px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all",
                             selectedRatio === ratio.label
                               ? "border-primary bg-primary/10 text-primary"
                               : "border-border hover:border-primary/50 text-muted-foreground"
                           )}
                         >
                           {ratio.label}
                         </button>
                       ))}
                     </div>
                   </div>

                   <div>
                     <Label className="text-sm font-medium mb-3 block">Resolution</Label>
                     <div className="grid grid-cols-3 gap-2">
                       {RESOLUTIONS.map((res) => (
                         <button
                           key={res.label}
                           type="button"
                           onClick={() => setResolution(res.label as "1K" | "2K" | "4K")}
                           className={cn(
                             "flex flex-col items-center justify-center px-4 py-3 rounded-lg border-2 transition-all",
                             resolution === res.label
                               ? "border-primary bg-primary/10"
                               : "border-border hover:border-primary/50"
                           )}
                         >
                           <span className="text-sm font-semibold">{res.label}</span>
                           <span className="text-[10px] text-muted-foreground">{res.credits} credits</span>
                         </button>
                       ))}
                     </div>
                   </div>

                   <p className="text-xs text-muted-foreground text-center">
                     Output: {getOutputSize().width}×{getOutputSize().height}px
                   </p>
                 </div>

                 {/* Generate Button */}
                 <div className="bg-card rounded-xl border border-border p-6 space-y-4">
                    <Button
                      onClick={handleGenerate}
                      disabled={isGenerating || !canGenerate() || (!isAdmin && !hasAdminToken && credits < calculateTotalCredits())}
                      className="w-full"
                      size="lg"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (isAdmin || hasAdminToken) ? (
                        <>
                          Generate {selectedAngles.length} View{selectedAngles.length > 1 ? 's' : ''} (Admin)
                        </>
                      ) : (
                        <>
                          Generate {selectedAngles.length} View{selectedAngles.length > 1 ? 's' : ''} ({calculateTotalCredits()} credits)
                        </>
                      )}
                    </Button>

                   {Object.keys(generatedImages).length > 0 && !showGeneratingDialog && (
                     <Button variant="outline" onClick={handleReset} className="w-full">
                       <RefreshCw className="w-4 h-4 mr-2" />
                       Start New
                     </Button>
                   )}
                 </div>
               </div>
             </div>
           </div>
         </main>
 
         {/* Generation Progress Overlay */}
         <GenerationProgressOverlay
           open={isGenerating}
           stage={currentStep === 1 ? "clothing_transfer" : "model_swap"}
           progress={generationProgress}
           statusMessage={currentStep === 1 ? "Applying clothing to pose..." : "Swapping model..."}
           title="Creating Your Mockup"
           steps={[
             { key: "clothing_transfer", label: "Clothing transfer", icon: Upload },
             { key: "model_swap", label: "Model swap", icon: Wand2 },
             { key: "finalizing", label: "Finalizing", icon: ImageIcon },
           ]}
           onClose={() => {}}
         />

         {/* Generation Dialog */}
         <Dialog open={showGeneratingDialog && !isGenerating} onOpenChange={setShowGeneratingDialog}>
           <DialogContent className="sm:max-w-2xl">
             <DialogHeader>
               <DialogTitle>
                 Generated Images
               </DialogTitle>
             </DialogHeader>
              
              <div className="space-y-4">

                {/* Center single card for single-view, grid for both */}
                <div className={cn(
                  selectedAngles.length === 1
                    ? "flex justify-center" 
                    : "grid grid-cols-2 gap-4"
                )}>
                  {selectedAngles.includes('front') && (
                    <div className={cn(
                      "space-y-2",
                      selectedAngles.length === 1 && "max-w-xs w-full"
                    )}>
                      <Label className="text-sm font-medium">Front View</Label>
                      {generatedImages.front ? (
                        <div className="relative group">
                          <img
                            src={displayUrl(generatedImages.front)}
                            alt="Front view"
                            className="w-full rounded-lg cursor-pointer"
                            onClick={() => {
                              setShowGeneratingDialog(false);
                              setPreviewImage(generatedImages.front!);
                            }}
                          />
                          <Button
                            size="icon"
                            variant="secondary"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={gate(() => handleDownload(generatedImages.front!, 'front'))}
                          >
                            {canExport ? <Download className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                          </Button>
                          <Button
                            size="icon"
                            variant="secondary"
                            className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={gate(() => setEditingPoseImage(generatedImages.front!))}
                          >
                            {canExport ? <Pencil className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                          </Button>
                        </div>
                      ) : (
                        <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                          {generationStatus.front === 'processing' ? (
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                          ) : generationStatus.front === 'failed' ? (
                            <span className="text-destructive text-sm">Failed</span>
                          ) : (
                            <span className="text-muted-foreground text-sm">Pending...</span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                 {selectedAngles.includes('back') && (
                   <div className={cn(
                     "space-y-2",
                     selectedAngles.length === 1 && "max-w-xs w-full"
                   )}>
                     <Label className="text-sm font-medium">Back View</Label>
                     {generatedImages.back ? (
                       <div className="relative group">
                         <img
                           src={displayUrl(generatedImages.back)}
                           alt="Back view"
                           className="w-full rounded-lg cursor-pointer"
                           onClick={() => {
                             setShowGeneratingDialog(false);
                             setPreviewImage(generatedImages.back!);
                           }}
                         />
                         <Button
                           size="icon"
                           variant="secondary"
                           className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                           onClick={gate(() => handleDownload(generatedImages.back!, 'back'))}
                         >
                           {canExport ? <Download className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                         </Button>
                         <Button
                           size="icon"
                           variant="secondary"
                           className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity"
                           onClick={gate(() => setEditingPoseImage(generatedImages.back!))}
                         >
                           {canExport ? <Pencil className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                         </Button>
                       </div>
                     ) : (
                       <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                         {generationStatus.back === 'processing' ? (
                           <Loader2 className="w-8 h-8 animate-spin text-primary" />
                         ) : generationStatus.back === 'failed' ? (
                           <span className="text-destructive text-sm">Failed</span>
                         ) : (
                           <span className="text-muted-foreground text-sm">Pending...</span>
                         )}
                       </div>
                     )}
                   </div>
                 )}
               </div>

               {!isGenerating && Object.keys(generatedImages).length > 0 && (
                 <div className="flex gap-3 pt-4">
                   <Button 
                     variant="outline" 
                     className="flex-1"
                     onClick={() => {
                       setShowGeneratingDialog(false);
                       handleReset();
                     }}
                   >
                     <RefreshCw className="w-4 h-4 mr-2" />
                     Start New
                   </Button>
                   <Button 
                     className="flex-1"
                     onClick={() => setShowGeneratingDialog(false)}
                   >
                     Close
                   </Button>
                 </div>
               )}
             </div>
           </DialogContent>
         </Dialog>

         {/* Preview Modal */}
         {previewImage && (
           <div 
             className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
             onClick={() => setPreviewImage(null)}
           >
             <div className="relative max-w-4xl max-h-[90vh]">
               <img
                 src={displayUrl(previewImage)}
                 alt="Preview"
                 className="max-w-full max-h-[90vh] object-contain rounded-lg"
               />
               <Button
                 variant="secondary"
                 size="icon"
                 className="absolute top-2 right-2"
                 onClick={() => setPreviewImage(null)}
               >
                 <X className="w-4 h-4" />
               </Button>
             </div>
           </div>
         )}

         {editingPoseImage && (
           <ImageEditModal
             open={!!editingPoseImage}
             onOpenChange={(open) => { if (!open) setEditingPoseImage(null); }}
             imageUrl={editingPoseImage}
             onEditComplete={(newUrl) => {
               setGeneratedImages(prev => {
                 if (prev.front === editingPoseImage) return { ...prev, front: newUrl };
                 if (prev.back === editingPoseImage) return { ...prev, back: newUrl };
                 return prev;
               });
             }}
             isAdmin={isAdmin || hasAdminToken}
           />
         )}
         <UnlockDialog open={unlockOpen} onOpenChange={setUnlockOpen} />
       </div>
     </div>
   );
 };
 
 export default SimplePoseMaker;