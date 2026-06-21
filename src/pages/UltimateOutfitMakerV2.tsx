import { useState, useEffect } from "react";
import DragDropZone from "@/components/DragDropZone";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useAdminToken } from "@/hooks/useAdminToken";
import { ArrowLeft, Upload, Loader2, CheckCircle2, XCircle, Clock, Download, X, RefreshCw, Check, Shield, Sparkles, Pencil } from "lucide-react";
import ImageEditModal from "@/components/ImageEditModal";
import { Progress } from "@/components/ui/progress";
import PlanCreditsDisplay from "@/components/PlanCreditsDisplay";
import UserMenu from "@/components/UserMenu";
import JSZip from "jszip";
import CreditsPurchaseDialog from "@/components/CreditsPurchaseDialog";
import { deductCredits } from "@/hooks/useCreditDeduction";
import logoImage from "@/assets/floowy-logo.png";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOnboardingCheck } from "@/hooks/useOnboardingCheck";
import GenerationProgressOverlay from "@/components/GenerationProgressOverlay";

// Pose preview images
import poseNaturalStanding from "@/assets/poses/pose-natural-standing.jpg";
import poseConfidentStanding from "@/assets/poses/pose-confident-standing.jpg";
import poseHandsOnHips from "@/assets/poses/pose-hands-on-hips.jpg";
import poseArmsCrossed from "@/assets/poses/pose-arms-crossed.jpg";
import poseHandsInPockets from "@/assets/poses/pose-hands-in-pockets.jpg";
import poseOneHandPocket from "@/assets/poses/pose-one-hand-pocket.jpg";
import poseWalking from "@/assets/poses/pose-walking.jpg";
import poseCasualLean from "@/assets/poses/pose-casual-lean.jpg";
import poseSeated from "@/assets/poses/pose-seated.jpg";
import posePerched from "@/assets/poses/pose-perched.jpg";
import poseRunwayWalk from "@/assets/poses/pose-runway-walk.jpg";
import poseContrapposto from "@/assets/poses/pose-contrapposto.jpg";
import poseLookingAway from "@/assets/poses/pose-looking-away.jpg";
import poseOverShoulder from "@/assets/poses/pose-over-shoulder.jpg";
import poseDynamicAction from "@/assets/poses/pose-dynamic-action.jpg";
import poseEditorial from "@/assets/poses/pose-editorial.jpg";
import poseAthletic from "@/assets/poses/pose-athletic.jpg";
import poseElegant from "@/assets/poses/pose-elegant.jpg";

// Hairstyle preview images
import hairstyleBraidedPonytail from "@/assets/hairstyle-braided-ponytail.jpg";
import hairstyleHighKnot from "@/assets/hairstyle-high-knot.jpg";
import hairstyleKnot from "@/assets/hairstyle-knot.jpg";
import hairstyleLoose from "@/assets/hairstyle-loose.jpg";
import hairstyleLowTwistedBun from "@/assets/hairstyle-low-twisted-bun.jpg";
import hairstylePonytail from "@/assets/hairstyle-ponytail.jpg";
import hairstyleTwistedBun from "@/assets/hairstyle-twisted-bun.jpg";
import hairstyleMenBuzz from "@/assets/hairstyle-men-buzz.jpg";
import hairstyleMenCrop from "@/assets/hairstyle-men-crop.jpg";
import hairstyleMenCurly from "@/assets/hairstyle-men-curly.jpg";
import hairstyleMenFade from "@/assets/hairstyle-men-fade.jpg";
import hairstyleMenSidepart from "@/assets/hairstyle-men-sidepart.jpg";
import hairstyleMenSlicked from "@/assets/hairstyle-men-slicked.jpg";

const UltimateOutfitMakerV2 = () => {
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
  const [hasAccess, setHasAccess] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(false);
  useOnboardingCheck(true);

  // Hairstyle state
  const [selectedHairstyle, setSelectedHairstyle] = useState<string>('loose');
  const [analyzedHairLength, setAnalyzedHairLength] = useState<'short' | 'medium' | 'long' | null>(null);
  const [isAnalyzingHair, setIsAnalyzingHair] = useState(false);
  const [hairstyleGender, setHairstyleGender] = useState<'women' | 'men'>('women');

  const sanitizeFileName = (filename: string): string => {
    const lastDotIndex = filename.lastIndexOf('.');
    const name = lastDotIndex > 0 ? filename.substring(0, lastDotIndex) : filename;
    const ext = lastDotIndex > 0 ? filename.substring(lastDotIndex) : '';
    const sanitized = name.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-_]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    return sanitized + ext;
  };

  const [products, setProducts] = useState<Array<{
    selectedPieces: string[];
    selectedAngles: Array<'front' | 'back' | 'left' | 'right'>;
    outfitViews: {
      [key: string]: {
        front: File | null;
        back: File | null;
        left: File | null;
        right: File | null;
      };
    };
    accessories: File[];
  }>>([{
    selectedPieces: [],
    selectedAngles: ['front'],
    outfitViews: {
      tops: { front: null, back: null, left: null, right: null },
      trousers: { front: null, back: null, left: null, right: null },
      jacket: { front: null, back: null, left: null, right: null },
      hat: { front: null, back: null, left: null, right: null },
      shoes: { front: null, back: null, left: null, right: null },
      jumpsuit: { front: null, back: null, left: null, right: null },
      dress: { front: null, back: null, left: null, right: null }
    },
    accessories: []
  }]);
  
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const [modelViews, setModelViews] = useState<{
    front: File | null;
    back: File | null;
    left: File | null;
    right: File | null;
  }>({ front: null, back: null, left: null, right: null });
  
  const [outputSize, setOutputSize] = useState({ width: 1024, height: 1024 });
  const [selectedBackground, setSelectedBackground] = useState<string>('light-grey');
  const [selectedLighting, setSelectedLighting] = useState<string>('studio');
  const [backgroundReference, setBackgroundReference] = useState<File | null>(null);
  const [customBackgroundPrompt, setCustomBackgroundPrompt] = useState<string>('');
  const [isOptimizingPrompt, setIsOptimizingPrompt] = useState(false);
  const [selectedPose, setSelectedPose] = useState<string>('natural-standing');
  const [showCreditsPurchase, setShowCreditsPurchase] = useState(false);
  const [currentBatchId, setCurrentBatchId] = useState<string | null>(null);
  const [batchStatus, setBatchStatus] = useState<any>(null);
  const [batchItems, setBatchItems] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [editingOutfitImage, setEditingOutfitImage] = useState<string | null>(null);
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [regenerateBackground, setRegenerateBackground] = useState<string>('light-grey');
  const [regenerateCustomPrompt, setRegenerateCustomPrompt] = useState<string>('');
  const [regenerateBackgroundReference, setRegenerateBackgroundReference] = useState<File | null>(null);
  const [previewImageDimensions, setPreviewImageDimensions] = useState({ width: 0, height: 0 });

  // Hairstyle options with minimum hair length requirements
  const womenHairstyles = [
    { id: 'loose', name: 'Loose', description: 'Hair worn loose and flowing', minLength: 'short' as const, image: hairstyleLoose },
    { id: 'ponytail', name: 'Ponytail', description: 'Simple ponytail', minLength: 'short' as const, image: hairstylePonytail },
    { id: 'braided-ponytail', name: 'Braided Ponytail', description: 'Braided ponytail style', minLength: 'medium' as const, image: hairstyleBraidedPonytail },
    { id: 'high-knot', name: 'High Knot', description: 'High bun/knot style', minLength: 'medium' as const, image: hairstyleHighKnot },
    { id: 'knot', name: 'Knot', description: 'Simple knot/bun', minLength: 'short' as const, image: hairstyleKnot },
    { id: 'twisted-bun', name: 'Twisted Bun', description: 'Elegant twisted bun', minLength: 'medium' as const, image: hairstyleTwistedBun },
    { id: 'low-twisted-bun', name: 'Low Twisted Bun', description: 'Low twisted bun style', minLength: 'medium' as const, image: hairstyleLowTwistedBun },
  ];

  const menHairstyles = [
    { id: 'men-buzz', name: 'Buzz Cut', description: 'Short buzz cut', minLength: 'any' as const, image: hairstyleMenBuzz },
    { id: 'men-crop', name: 'Crop', description: 'Textured crop cut', minLength: 'any' as const, image: hairstyleMenCrop },
    { id: 'men-curly', name: 'Curly', description: 'Natural curly style', minLength: 'short' as const, image: hairstyleMenCurly },
    { id: 'men-fade', name: 'Fade', description: 'Fade haircut', minLength: 'any' as const, image: hairstyleMenFade },
    { id: 'men-sidepart', name: 'Side Part', description: 'Classic side part', minLength: 'short' as const, image: hairstyleMenSidepart },
    { id: 'men-slicked', name: 'Slicked Back', description: 'Slicked back style', minLength: 'short' as const, image: hairstyleMenSlicked },
  ];

  const hairstyleOptions = hairstyleGender === 'women' ? womenHairstyles : menHairstyles;

  const isHairstyleEnabled = (minLength: 'any' | 'short' | 'medium' | 'long'): boolean => {
    if (!analyzedHairLength) return minLength === 'any';
    if (minLength === 'any') return true;
    const lengthOrder = { short: 1, medium: 2, long: 3 };
    return lengthOrder[analyzedHairLength] >= lengthOrder[minLength];
  };

  // Analyze hair length when back model is uploaded
  const analyzeHairLength = async (file: File) => {
    setIsAnalyzingHair(true);
    try {
      // Convert file to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      const imageBase64 = await base64Promise;
      
      const { data, error } = await supabase.functions.invoke('analyze-hair-length', {
        body: { imageBase64 }
      });
      
      if (error) throw error;
      
      setAnalyzedHairLength(data.hairLength);
      toast({
        title: "Hair Analysis Complete",
        description: `Detected: ${data.hairLength} hair length`
      });
    } catch (error: any) {
      console.error('Hair analysis error:', error);
      toast({
        title: "Hair Analysis Failed",
        description: "Could not analyze hair length. You can still select any hairstyle.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzingHair(false);
    }
  };

  // Optimize custom background prompt using AI
  const optimizeBackgroundPrompt = async () => {
    if (!customBackgroundPrompt.trim() || isOptimizingPrompt) return;
    
    setIsOptimizingPrompt(true);
    try {
      const { data, error } = await supabase.functions.invoke('optimize-prompt', {
        body: { prompt: customBackgroundPrompt }
      });

      if (error) {
        console.error('Failed to optimize prompt:', error);
        throw error;
      }
      
      if (data?.optimizedPrompt) {
        setCustomBackgroundPrompt(data.optimizedPrompt);
        toast({
          title: "Prompt Optimized",
          description: "Your background description has been enhanced for better results"
        });
      } else if (data?.error) {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Failed to optimize prompt:', error);
      toast({
        title: "Optimization Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsOptimizingPrompt(false);
    }
  };

  // useEffect and helper functions from BulkMockupGenerator
  useEffect(() => {
    const verifyAdmin = async () => {
      const token = localStorage.getItem('admin_token');
      if (!token) return false;
      try {
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-auth`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
          },
          body: JSON.stringify({ action: 'verify', token })
        });
        return res.ok;
      } catch {}
      return false;
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => {
          checkAccess(session.user.id);
          fetchCredits(session.user.id);
          fetchUserData(session.user.id);
        }, 0);
      } else {
        await verifyAdmin();
      }
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await Promise.all([checkAccess(session.user.id), fetchCredits(session.user.id), fetchUserData(session.user.id)]);
      } else {
        await verifyAdmin();
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkAccess = async (userId: string) => {
    if (!userId) {
      setHasAccess(false);
      setIsCheckingAccess(false);
      return;
    }
    setIsCheckingAccess(true);
    const timeoutId = setTimeout(() => {
      setHasAccess(false);
      setIsCheckingAccess(false);
    }, 10000);

    try {
      const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
      if (roleData) {
        clearTimeout(timeoutId);
        setHasAccess(true);
        setIsCheckingAccess(false);
        return;
      }
      const { data, error } = await supabase.from("user_tool_access").select("has_access").eq("user_id", userId).eq("tool_name", "ultimate-outfit-maker-v2").maybeSingle();
      clearTimeout(timeoutId);
      if (error) {
        setHasAccess(false);
        setIsCheckingAccess(false);
        return;
      }
      setHasAccess(data?.has_access === true);
      setIsCheckingAccess(false);
    } catch (err) {
      clearTimeout(timeoutId);
      setHasAccess(false);
      setIsCheckingAccess(false);
    }
  };

  const fetchUserData = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase.from("profiles").select("email, full_name, plan").eq("id", userId).single();
      if (error) return;
      if (profile) {
        setUserEmail(profile.email || "");
        setUserName(profile.full_name || "");
        setUserPlan(profile.plan || "free");
      }
    } catch (err) {}
  };

  const fetchCredits = async (userId: string) => {
    try {
      const { data, error } = await supabase.from("credits").select("balance").eq("user_id", userId).single();
      if (error) return;
      setCredits(data?.balance || 0);
    } catch (err) {}
  };

  useEffect(() => {
    if (!currentBatchId) return;

    const fetchBatchItems = async () => {
      const { data } = await supabase.from('batch_items').select('*').eq('batch_id', currentBatchId).order('order_index');
      if (data) setBatchItems(data);
    };
    fetchBatchItems();

    const checkStatus = async () => {
      try {
        await supabase.functions.invoke('check-batch-status', { body: { batch_id: currentBatchId } });
      } catch (error) {}
    };
    checkStatus();

    const pollInterval = setInterval(checkStatus, 5000);
    const channel = supabase.channel(`batch-${currentBatchId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'batch_jobs', filter: `id=eq.${currentBatchId}` }, payload => {
        setBatchStatus(payload.new);
        if (payload.new.status === 'completed') {
          toast({ title: "Batch Complete! 🎉", description: `Successfully generated ${payload.new.completed_count} mockups` });
          setIsProcessing(false);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'batch_items', filter: `batch_id=eq.${currentBatchId}` }, async () => {
        const { data } = await supabase.from('batch_items').select('*').eq('batch_id', currentBatchId).order('order_index');
        if (data) setBatchItems(data);
      })
      .subscribe();

    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, [currentBatchId, toast]);

  const getPieceDisplayName = (piece: string): string => {
    const displayNames: { [key: string]: string } = {
      'tops': 'Tops', 'trousers': 'Trousers', 'jacket': 'Jacket/Outerwear',
      'hat': 'Hat', 'shoes': 'Shoes', 'jumpsuit': 'Jumpsuit', 'dress': 'Dress'
    };
    return displayNames[piece] || piece;
  };

  const handleOutfitPieceToggle = (productIdx: number, piece: string) => {
    setProducts(products.map((p, idx) => {
      if (idx !== productIdx) return p;
      const selected = p.selectedPieces.includes(piece);
      const fullOutfits = ['jumpsuit', 'dress'];
      const separatePieces = ['tops', 'trousers', 'jacket', 'hat', 'shoes'];
      let newSelectedPieces: string[];
      if (selected) {
        newSelectedPieces = p.selectedPieces.filter(pc => pc !== piece);
      } else {
        if (fullOutfits.includes(piece)) {
          newSelectedPieces = [piece];
        } else if (separatePieces.includes(piece)) {
          newSelectedPieces = [...p.selectedPieces.filter(pc => !fullOutfits.includes(pc)), piece];
        } else {
          newSelectedPieces = [...p.selectedPieces, piece];
        }
      }
      return { ...p, selectedPieces: newSelectedPieces };
    }));
  };

  const handleOutfitViewUpload = (productIdx: number, piece: string, view: 'front' | 'back' | 'left' | 'right', file: File | null) => {
    setProducts(products.map((p, idx) => {
      if (idx !== productIdx) return p;
      return { ...p, outfitViews: { ...p.outfitViews, [piece]: { ...p.outfitViews[piece], [view]: file } } };
    }));
  };

  const handleModelViewUpload = async (view: 'front' | 'back' | 'left' | 'right', file: File | null) => {
    setModelViews(prev => ({ ...prev, [view]: file }));
    // Trigger hair analysis when back view is uploaded
    if (view === 'back' && file) {
      await analyzeHairLength(file);
    }
  };

  const getRequiredViews = (): Array<'front' | 'back' | 'left' | 'right'> => {
    const allViews = new Set<'front' | 'back' | 'left' | 'right'>();
    products.forEach(product => {
      product.selectedPieces.forEach(piece => {
        const views = product.outfitViews[piece];
        if (views?.front) allViews.add('front');
        if (views?.back) allViews.add('back');
        if (views?.left) allViews.add('left');
        if (views?.right) allViews.add('right');
      });
    });
    return Array.from(allViews);
  };

  const handleAngleToggle = (productIdx: number, angle: 'front' | 'back' | 'left' | 'right') => {
    setProducts(products.map((p, idx) => {
      if (idx !== productIdx) return p;
      const isSelected = p.selectedAngles.includes(angle);
      if (isSelected) {
        if (p.selectedAngles.length === 1) return p;
        return { ...p, selectedAngles: p.selectedAngles.filter(a => a !== angle) };
      } else {
        return { ...p, selectedAngles: [...p.selectedAngles, angle] };
      }
    }));
  };

  const getAvailableViewsForOutfit = (productIdx: number): Array<'front' | 'back' | 'left' | 'right'> => {
    return ['front', 'back', 'left', 'right'];
  };

  const calculateTotalProductViews = (): number => {
    return products.reduce((total, product) => total + product.selectedAngles.length, 0);
  };

  const calculateCreditCost = (): number => {
    const maxDimension = Math.max(outputSize.width, outputSize.height);
    let costPerView = 2;
    if (maxDimension <= 1400) costPerView = 2;
    else if (maxDimension <= 2800) costPerView = 3;
    else costPerView = 4;
    const totalViews = calculateTotalProductViews();
    return totalViews * costPerView;
  };

  const handleStartBatch = async () => {
    if (isProcessing || currentBatchId) {
      toast({ title: "Batch Already Processing", description: "Please wait for the current batch to complete.", variant: "destructive" });
      return;
    }

    const productsWithOutfits = products.filter(p => p.selectedPieces.length > 0);
    if (productsWithOutfits.length === 0) {
      toast({ title: "No Products Created", description: "Please select outfit pieces for at least one product", variant: "destructive" });
      return;
    }

    const allProductsHaveViews = productsWithOutfits.every(product => {
      return product.selectedPieces.every(piece => {
        const views = product.outfitViews[piece];
        return views && (views.front || views.back || views.left || views.right);
      });
    });
    if (!allProductsHaveViews) {
      toast({ title: "Missing Product Views", description: "Please upload at least one view for each selected outfit piece", variant: "destructive" });
      return;
    }

    const hasModelView = modelViews.front || modelViews.back || modelViews.left || modelViews.right;
    if (!hasModelView) {
      toast({ title: "Model Required", description: "Please upload at least one model image", variant: "destructive" });
      return;
    }

    const totalCredits = calculateCreditCost();
    if (!hasAccess && credits < totalCredits) {
      toast({ title: "Insufficient Credits", description: "You don't have enough credits!", variant: "destructive" });
      setShowCreditsPurchase(true);
      return;
    }

    setIsProcessing(true);
    try {
      const timestamp = Date.now();
      const userId = user.id;

      // Upload model views
      const modelUrls: any = {};
      for (const [view, file] of Object.entries(modelViews)) {
        if (file) {
          const sanitizedName = sanitizeFileName(file.name);
          const { data, error } = await supabase.storage.from("user-uploads").upload(`${userId}/${timestamp}-model-${view}-${sanitizedName}`, file, { upsert: true });
          if (!error) {
            const { data: urlData } = supabase.storage.from("user-uploads").getPublicUrl(data.path);
            modelUrls[view] = urlData.publicUrl;
          }
        }
      }

      const modelImgbbUrl = modelUrls.front || modelUrls.back || modelUrls.left || modelUrls.right;

      // Upload products
      const productUrls: any[] = [];
      for (let i = 0; i < productsWithOutfits.length; i++) {
        const product = productsWithOutfits[i];
        const outfitUrls: any = {};
        for (const piece of product.selectedPieces) {
          const views = product.outfitViews[piece];
          const viewUrls: any = {};
          for (const viewName of ['front', 'back', 'left', 'right'] as const) {
            if (views[viewName]) {
              const sanitizedName = sanitizeFileName(views[viewName]!.name);
              const { data, error } = await supabase.storage.from("user-uploads").upload(`${userId}/${timestamp}-product-${i}-${piece}-${viewName}-${sanitizedName}`, views[viewName]!, { upsert: true });
              if (!error) {
                const { data: urlData } = supabase.storage.from("user-uploads").getPublicUrl(data.path);
                viewUrls[viewName] = urlData.publicUrl;
              }
            }
          }
          outfitUrls[piece] = viewUrls;
        }
        productUrls.push(outfitUrls);
      }

      // Upload background reference
      let backgroundReferenceUrl = null;
      if (backgroundReference) {
        const { data, error } = await supabase.storage.from("user-uploads").upload(`${userId}/${timestamp}-background-reference-${backgroundReference.name}`, backgroundReference, { upsert: true });
        if (!error) {
          const { data: urlData } = supabase.storage.from("user-uploads").getPublicUrl(data.path);
          backgroundReferenceUrl = urlData.publicUrl;
        }
      }

      // Upload accessories
      const accessoryUrls: string[][] = [];
      for (let i = 0; i < productsWithOutfits.length; i++) {
        const product = productsWithOutfits[i];
        const urls: string[] = [];
        for (const accessoryFile of product.accessories) {
          const sanitizedName = sanitizeFileName(accessoryFile.name);
          const { data, error } = await supabase.storage.from("user-uploads").upload(`${userId}/${timestamp}-product-${i}-accessory-${sanitizedName}`, accessoryFile, { upsert: true });
          if (!error) {
            const { data: urlData } = supabase.storage.from("user-uploads").getPublicUrl(data.path);
            urls.push(urlData.publicUrl);
          }
        }
        accessoryUrls.push(urls);
      }

      const backgroundMap: { [key: string]: string } = {
        'white': 'pure white background', 'beige': 'warm beige background', 'light-grey': 'light grey background',
        'grey': 'neutral grey background', 'dark-grey': 'dark grey background', 'black': 'solid black background',
        'cream': 'soft cream background', 'navy': 'deep navy blue background', 'sage': 'muted sage green background'
      };
      const backgroundText = customBackgroundPrompt || (backgroundMap[selectedBackground] || backgroundMap['light-grey']);

      const viewsToGenerate: Array<'front' | 'back' | 'left' | 'right'> = [];
      if (modelViews.front) viewsToGenerate.push('front');
      if (modelViews.back) viewsToGenerate.push('back');
      if (modelViews.left) viewsToGenerate.push('left');
      if (modelViews.right) viewsToGenerate.push('right');

      let totalViews = 0;
      const viewMapping: Record<number, 'front' | 'back' | 'left' | 'right'> = {};
      let orderIndexCounter = 0;
      productsWithOutfits.forEach(product => {
        const anglesToGenerate = product.selectedAngles || ['front', 'back', 'left', 'right'];
        anglesToGenerate.forEach(angle => {
          viewMapping[orderIndexCounter] = angle;
          orderIndexCounter++;
        });
        totalViews += anglesToGenerate.length;
      });

      // Get hairstyle description
      const selectedHairstyleOption = hairstyleOptions.find(h => h.id === selectedHairstyle);
      const hairstyleDescription = selectedHairstyle === 'natural' ? 'natural hair as shown in reference' : selectedHairstyleOption?.name || 'natural hair';

      const { data: batchData, error: batchError } = await supabase.from("batch_jobs").insert({
        user_id: userId,
        tool_name: "fashion-2.0",
        status: "processing",
        total_count: totalViews,
        settings: {
          model_url: modelImgbbUrl,
          model_views: modelUrls,
          background: backgroundText,
          custom_background_prompt: customBackgroundPrompt,
          background_reference_url: backgroundReferenceUrl,
          selected_pose: selectedPose,
          selected_hairstyle: selectedHairstyle,
          hairstyle_description: hairstyleDescription,
          analyzed_hair_length: analyzedHairLength,
          selected_lighting: selectedLighting,
          output_size: outputSize,
          product_urls: productUrls,
          accessory_urls: accessoryUrls,
          views_to_generate: viewsToGenerate,
          view_mapping: viewMapping
        }
      }).select().single();

      if (batchError) throw batchError;

      const batchId = batchData.id;
      setCurrentBatchId(batchId);
      setBatchStatus(batchData);

      const batchItemsData = [];
      let orderIndex = 0;
      for (let i = 0; i < productsWithOutfits.length; i++) {
        const product = productsWithOutfits[i];
        const anglesToGenerate = product.selectedAngles || ['front', 'back', 'left', 'right'];
        for (const angle of anglesToGenerate) {
          batchItemsData.push({
            batch_id: batchId,
            product_url: `outfit-${i + 1}-${angle}`,
            status: "pending",
            order_index: orderIndex++
          });
        }
      }

      const { error: itemsError } = await supabase.from("batch_items").insert(batchItemsData);
      if (itemsError) throw itemsError;

      const { error: processError } = await supabase.functions.invoke("process-batch-mockups", { body: { batch_id: batchId } });
      if (processError) {
        await supabase.from("batch_jobs").delete().eq("id", batchId);
        throw processError;
      }

      const newBal1 = await deductCredits(userId, totalCredits);
      setCredits(newBal1);

      toast({ title: "Batch Started", description: `Generating ${totalViews} mockup views.` });
    } catch (error: any) {
      toast({ title: "Failed to Start Batch", description: "Something went wrong. Please try again.", variant: "destructive" });
      setIsProcessing(false);
      setCurrentBatchId(null);
    }
  };

  const handleReset = () => {
    setProducts([{
      selectedPieces: [], selectedAngles: ['front'],
      outfitViews: {
        tops: { front: null, back: null, left: null, right: null },
        trousers: { front: null, back: null, left: null, right: null },
        jacket: { front: null, back: null, left: null, right: null },
        hat: { front: null, back: null, left: null, right: null },
        shoes: { front: null, back: null, left: null, right: null },
        jumpsuit: { front: null, back: null, left: null, right: null },
        dress: { front: null, back: null, left: null, right: null }
      },
      accessories: []
    }]);
    setCurrentProductIndex(0);
    setModelViews({ front: null, back: null, left: null, right: null });
    setSelectedBackground('light-grey');
    setSelectedLighting('studio');
    setBackgroundReference(null);
    setCustomBackgroundPrompt('');
    setSelectedHairstyle('natural');
    setAnalyzedHairLength(null);
    setCurrentBatchId(null);
    setBatchStatus(null);
    setBatchItems([]);
    setIsProcessing(false);
  };

  const handleRegenerateItem = async (itemId: string, itemOrderIndex: number) => {
    if (!currentBatchId) return;
    try {
      await supabase.from('batch_items').update({
        status: 'pending', result_url: null, error_message: null, request_id: null
      }).eq('id', itemId);
      toast({ title: "Regenerating Image", description: `Re-queuing mockup #${itemOrderIndex + 1} for generation` });
      setTimeout(async () => {
        await supabase.functions.invoke('process-batch-mockups', { body: { batch_id: currentBatchId } });
      }, 1000);
    } catch (error: any) {
      toast({ title: "Regeneration Failed", description: "Something went wrong. Please try again.", variant: "destructive" });
    }
  };

  const handleRegenerateBatch = async () => {
    if (!currentBatchId || !batchStatus?.settings) return;
    try {
      const userId = session?.user?.id;
      if (!userId) throw new Error("User not authenticated");

      const totalItems = batchItems.length;
      const maxDim = Math.max(outputSize.width, outputSize.height);
      const creditsPerItem = maxDim <= 1400 ? 2 : maxDim <= 2800 ? 3 : 4;
      const totalCredits = totalItems * creditsPerItem;

      if (credits < totalCredits) {
        toast({ title: "Insufficient Credits", description: `You need ${totalCredits} credits. You have ${credits}.`, variant: "destructive" });
        return;
      }

      setIsProcessing(true);
      setShowRegenerateModal(false);

      let regenerateBackgroundReferenceUrl = null;
      if (regenerateBackgroundReference) {
        const { data, error: uploadError } = await supabase.storage.from("user-uploads").upload(`background-refs/${userId}/${Date.now()}-${regenerateBackgroundReference.name}`, regenerateBackgroundReference);
        if (!uploadError && data) {
          const { data: urlData } = supabase.storage.from("user-uploads").getPublicUrl(data.path);
          regenerateBackgroundReferenceUrl = urlData.publicUrl;
        }
      }

      const updatedSettings = {
        ...batchStatus.settings,
        ...(regenerateBackgroundReferenceUrl ? {
          background_reference_url: regenerateBackgroundReferenceUrl, custom_background_prompt: null, background: null
        } : regenerateCustomPrompt.trim() ? {
          custom_background_prompt: regenerateCustomPrompt.trim(), background_reference_url: null, background: null
        } : {
          background: regenerateBackground, background_reference_url: null, custom_background_prompt: null
        })
      };

      await supabase.from("batch_jobs").update({
        settings: updatedSettings, status: "processing", completed_count: 0, failed_count: 0
      }).eq("id", currentBatchId);

      await supabase.from("batch_items").update({
        status: "pending", result_url: null, error_message: null, request_id: null
      }).eq("batch_id", currentBatchId);

      const { error: processError } = await supabase.functions.invoke("process-batch-mockups", { body: { batch_id: currentBatchId } });
      if (processError) throw processError;

      const newBal2 = await deductCredits(userId, totalCredits);
      setCredits(newBal2);

      toast({ title: "Regenerating Batch", description: `Regenerating ${totalItems} images with new settings.` });
    } catch (error: any) {
      toast({ title: "Regeneration Failed", description: "Something went wrong. Please try again.", variant: "destructive" });
      setIsProcessing(false);
    }
  };

  const progress = batchItems.length > 0 ? batchItems.filter(item => item.status === 'completed').length / batchItems.length * 100 : 0;

  const poseOptions = [
    { id: 'natural-standing', name: 'Natural Standing', image: poseNaturalStanding },
    { id: 'confident-standing', name: 'Confident', image: poseConfidentStanding },
    { id: 'hands-on-hips', name: 'Hands on Hips', image: poseHandsOnHips },
    { id: 'arms-crossed', name: 'Arms Crossed', image: poseArmsCrossed },
    { id: 'hands-in-pockets', name: 'Hands in Pockets', image: poseHandsInPockets },
    { id: 'one-hand-pocket', name: 'One Hand Pocket', image: poseOneHandPocket },
    { id: 'walking', name: 'Walking', image: poseWalking },
    { id: 'casual-lean', name: 'Casual Lean', image: poseCasualLean },
    { id: 'seated', name: 'Seated', image: poseSeated },
    { id: 'perched', name: 'Perched', image: posePerched },
    { id: 'runway-walk', name: 'Runway Walk', image: poseRunwayWalk },
    { id: 'contrapposto', name: 'Contrapposto', image: poseContrapposto },
    { id: 'looking-away', name: 'Looking Away', image: poseLookingAway },
    { id: 'over-shoulder', name: 'Over Shoulder', image: poseOverShoulder },
    { id: 'dynamic-action', name: 'Dynamic Action', image: poseDynamicAction },
    { id: 'editorial', name: 'Editorial', image: poseEditorial },
    { id: 'athletic', name: 'Athletic', image: poseAthletic },
    { id: 'elegant', name: 'Elegant', image: poseElegant },
  ];

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
            {isAdmin ? (
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
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ultimate Outfit Maker V2
              </h2>
              <p className="text-muted-foreground text-lg">
                Create professional outfit mockups with hairstyle selection and pose references
              </p>
            </div>

            {currentBatchId && batchStatus ? (
              // Batch progress UI - same as BulkMockupGenerator
              <div className="space-y-6">
                <div className="bg-card rounded-xl border border-border p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-semibold">Batch Progress</h3>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">
                          {batchItems.filter(item => item.status === 'completed').length} / {batchItems.length} completed
                        </span>
                        <Button variant="ghost" size="icon" onClick={handleReset} className="h-8 w-8">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="space-y-1">
                        <div className="flex items-center justify-center gap-2 text-green-500">
                          <CheckCircle2 className="h-5 w-5" />
                          <span className="text-2xl font-bold">{batchItems.filter(item => item.status === 'completed').length}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">Completed</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-center gap-2 text-blue-500">
                          <Clock className="h-5 w-5" />
                          <span className="text-2xl font-bold">{batchItems.filter(item => item.status === 'pending' || item.status === 'processing').length}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">Pending</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-center gap-2 text-red-500">
                          <XCircle className="h-5 w-5" />
                          <span className="text-2xl font-bold">{batchItems.filter(item => item.status === 'failed').length}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">Failed</p>
                      </div>
                    </div>
                    {batchStatus.status === 'completed' && (
                      <div className="flex gap-2 flex-wrap">
                        <Button onClick={() => { setRegenerateBackground(selectedBackground); setShowRegenerateModal(true); }} variant="outline" className="flex-1">
                          <RefreshCw className="w-4 h-4 mr-2" />Regenerate Batch
                        </Button>
                        <Button onClick={handleReset} className="flex-1">Start New Batch</Button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-card rounded-xl border border-border p-6">
                  <h3 className="text-lg font-semibold mb-4">All Items ({batchItems.length})</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[600px] overflow-y-auto">
                    {batchItems.map(item => {
                      const urlParts = item.product_url?.split('-') || [];
                      const angleFromUrl = urlParts[urlParts.length - 1]?.toLowerCase() || '';
                      const angleLabel = ['front', 'back', 'left', 'right'].includes(angleFromUrl) ? angleFromUrl.charAt(0).toUpperCase() + angleFromUrl.slice(1) : '';
                      return (
                        <div key={item.id} className="relative group">
                          <div className="w-full min-h-[200px] rounded-lg border-2 border-border/50 overflow-hidden bg-muted">
                            {item.status === 'completed' && item.result_url ? (
                              <>
                                <img src={item.result_url} alt={`Result ${item.order_index + 1}`} className="w-full h-auto object-contain cursor-pointer" onClick={() => setPreviewImage(item.result_url)} />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                                  <Button size="sm" variant="secondary" onClick={() => setPreviewImage(item.result_url)}>View</Button>
                                  <Button size="sm" variant="secondary" onClick={() => setEditingOutfitImage(item.result_url)}>
                                    <Pencil className="w-3 h-3 mr-1" />Edit
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => handleRegenerateItem(item.id, item.order_index)}>
                                    <RefreshCw className="w-3 h-3 mr-1" />Regenerate
                                  </Button>
                                </div>
                              </>
                            ) : item.status === 'processing' ? (
                              <div className="w-full min-h-[200px] flex flex-col items-center justify-center gap-2">
                                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                <p className="text-xs text-muted-foreground">Processing...</p>
                              </div>
                            ) : item.status === 'failed' ? (
                              <div className="w-full min-h-[200px] flex flex-col items-center justify-center gap-2 bg-destructive/10">
                                <XCircle className="w-8 h-8 text-destructive" />
                                <p className="text-xs text-destructive text-center px-2">{item.error_message || 'Failed'}</p>
                              </div>
                            ) : (
                              <div className="w-full min-h-[200px] flex flex-col items-center justify-center gap-2">
                                <Clock className="w-8 h-8 text-muted-foreground" />
                                <p className="text-xs text-muted-foreground">Pending...</p>
                              </div>
                            )}
                          </div>
                          <div className="absolute top-2 left-2 bg-background/90 px-2 py-1 rounded text-xs font-semibold">#{item.order_index + 1}</div>
                          {angleLabel && <div className="absolute bottom-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-semibold">{angleLabel}</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              // Configuration UI
              <div className="space-y-6">
                {/* Outfit Configuration - same as BulkMockupGenerator */}
                <div className="bg-card rounded-xl border border-border p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold">Outfit {currentProductIndex + 1} of {products.length}</h3>
                      <p className="text-sm text-muted-foreground mt-1">Select angles and outfit pieces</p>
                    </div>
                    <div className="flex gap-2">
                      {products.length < 10 && (
                        <Button onClick={() => {
                          setProducts([...products, {
                            selectedPieces: [], selectedAngles: ['front'],
                            outfitViews: {
                              tops: { front: null, back: null, left: null, right: null },
                              trousers: { front: null, back: null, left: null, right: null },
                              jacket: { front: null, back: null, left: null, right: null },
                              hat: { front: null, back: null, left: null, right: null },
                              shoes: { front: null, back: null, left: null, right: null },
                              jumpsuit: { front: null, back: null, left: null, right: null },
                              dress: { front: null, back: null, left: null, right: null }
                            },
                            accessories: []
                          }]);
                          setCurrentProductIndex(products.length);
                        }} variant="outline" size="sm">+ Add Outfit</Button>
                      )}
                      {products.length > 1 && (
                        <Button variant="ghost" size="sm" onClick={() => {
                          setProducts(products.filter((_, idx) => idx !== currentProductIndex));
                          setCurrentProductIndex(Math.max(0, currentProductIndex - 1));
                        }}><X className="w-4 h-4 mr-1" />Remove</Button>
                      )}
                    </div>
                  </div>

                  {/* Angle Selection */}
                  <div className="mb-6">
                    <h4 className="text-md font-semibold mb-2">Select Angles *</h4>
                    <div className="grid grid-cols-4 gap-3">
                      {(['front', 'back', 'left', 'right'] as const).map(angle => (
                        <button key={angle} onClick={() => handleAngleToggle(currentProductIndex, angle)}
                          className={`relative px-4 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 border-2 capitalize ${
                            products[currentProductIndex].selectedAngles.includes(angle) ? 'bg-primary/20 text-primary border-primary shadow-lg' : 'bg-card text-foreground border-border hover:border-primary/50'
                          }`}>
                          {products[currentProductIndex].selectedAngles.includes(angle) && <Check className="w-4 h-4" />}
                          {angle}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Outfit Type Selection */}
                  <div className="mb-6">
                    <h4 className="text-md font-semibold mb-4">Select Outfit Type *</h4>
                    <Tabs defaultValue="full" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="full">Full Outfits</TabsTrigger>
                        <TabsTrigger value="separate">Separate Pieces</TabsTrigger>
                      </TabsList>
                      <TabsContent value="full" className="mt-6">
                        <div className="grid grid-cols-2 gap-4">
                          {[{ label: 'Jumpsuit', value: 'jumpsuit' }, { label: 'Dress', value: 'dress' }].map(({ label, value }) => (
                            <button key={value} onClick={() => handleOutfitPieceToggle(currentProductIndex, value)}
                              className={`relative px-6 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 border-2 ${
                                products[currentProductIndex].selectedPieces.includes(value) ? 'bg-primary text-primary-foreground border-primary shadow-lg scale-105' : 'bg-card text-foreground border-border hover:border-primary/50'
                              }`}>
                              {products[currentProductIndex].selectedPieces.includes(value) && <div className="absolute -top-2 -right-2 bg-primary rounded-full p-1 border-2 border-green-700"><Check className="w-4 h-4 text-primary-foreground" /></div>}
                              {label}
                            </button>
                          ))}
                        </div>
                      </TabsContent>
                      <TabsContent value="separate" className="mt-6">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                          {[{ label: 'Tops', value: 'tops' }, { label: 'Jacket/Outerwear', value: 'jacket' }, { label: 'Trousers', value: 'trousers' }, { label: 'Shoes', value: 'shoes' }, { label: 'Hat', value: 'hat' }].map(({ label, value }) => (
                            <button key={value} onClick={() => handleOutfitPieceToggle(currentProductIndex, value)}
                              className={`relative px-6 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 border-2 ${
                                products[currentProductIndex].selectedPieces.includes(value) ? 'bg-primary text-primary-foreground border-primary shadow-lg scale-105' : 'bg-card text-foreground border-border hover:border-primary/50'
                              }`}>
                              {products[currentProductIndex].selectedPieces.includes(value) && <div className="absolute -top-2 -right-2 bg-primary rounded-full p-1 border-2 border-green-700"><Check className="w-4 h-4 text-primary-foreground" /></div>}
                              {label}
                            </button>
                          ))}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>

                  {/* Upload views for selected pieces */}
                  {products[currentProductIndex].selectedPieces.length > 0 && (
                    <div className="space-y-6">
                      <h4 className="text-md font-semibold">Upload Views for Selected Pieces *</h4>
                      {products[currentProductIndex].selectedPieces.map(piece => (
                        <div key={piece} className="pb-6 border-b border-border last:border-b-0">
                          <h5 className="text-sm font-semibold mb-4">{getPieceDisplayName(piece)}</h5>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {(['front', 'back', 'left', 'right'] as const).map(view => (
                              <div key={view} className="space-y-2">
                                <label className="text-xs font-medium capitalize">{view}</label>
                                <DragDropZone onFileDrop={(files) => handleOutfitViewUpload(currentProductIndex, piece, view, files[0] || null)} accept="image/*" className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                                  <input type="file" accept="image/*" onChange={e => handleOutfitViewUpload(currentProductIndex, piece, view, e.target.files?.[0] || null)} className="hidden" id={`product-${currentProductIndex}-${piece}-${view}`} />
                                  <label htmlFor={`product-${currentProductIndex}-${piece}-${view}`} className="cursor-pointer block">
                                    {products[currentProductIndex].outfitViews[piece][view] ? (
                                      <div className="space-y-2">
                                        <img src={URL.createObjectURL(products[currentProductIndex].outfitViews[piece][view]!)} alt={`${piece} ${view}`} className="w-full h-20 object-contain rounded" />
                                        <Button size="sm" variant="ghost" onClick={e => { e.preventDefault(); handleOutfitViewUpload(currentProductIndex, piece, view, null); }}><X className="w-4 h-4 mr-1" />Remove</Button>
                                      </div>
                                    ) : (
                                      <><Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" /><p className="text-xs font-medium">Drop or Upload</p></>
                                    )}
                                  </label>
                                </DragDropZone>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Upload Model Views */}
                <div className="bg-card rounded-xl border border-border p-6">
                  <h3 className="text-lg font-semibold mb-4">Upload Model *</h3>
                  <p className="text-sm text-muted-foreground mb-4">Upload model images for each angle. Back view is used for hair length analysis.</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {getAvailableViewsForOutfit(currentProductIndex).map(view => (
                      <div key={view} className="space-y-2">
                        <label className="text-sm font-medium capitalize">{view} {view === 'back' && '(Hair Analysis)'}</label>
                        <DragDropZone onFileDrop={(files) => handleModelViewUpload(view, files[0] || null)} accept="image/*" className="border-2 border-dashed rounded-lg p-4 text-center transition-colors border-border hover:border-primary/50 min-h-[120px] flex items-center justify-center">
                          <input type="file" accept="image/*" onChange={e => handleModelViewUpload(view, e.target.files?.[0] || null)} className="hidden" id={`model-${view}`} />
                          <label htmlFor={`model-${view}`} className="cursor-pointer block w-full">
                            {modelViews[view] ? (
                              <div className="space-y-2">
                                <img src={URL.createObjectURL(modelViews[view]!)} alt={`Model ${view}`} className="w-full h-20 object-contain rounded" />
                                <Button size="sm" variant="ghost" onClick={e => { e.preventDefault(); handleModelViewUpload(view, null); }}><X className="w-4 h-4 mr-1" />Remove</Button>
                              </div>
                            ) : (
                              <><Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" /><p className="text-xs font-medium">Drop or upload {view}</p></>
                            )}
                          </label>
                        </DragDropZone>
                      </div>
                    ))}
                  </div>
                  {isAnalyzingHair && <p className="text-sm text-primary mt-4 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Analyzing hair length...</p>}
                  {analyzedHairLength && <p className="text-sm text-muted-foreground mt-4">Detected: <span className="font-semibold capitalize text-foreground">{analyzedHairLength}</span> hair length</p>}
                </div>

                {/* Hairstyle Selection - NEW FEATURE */}
                <div className={`bg-card rounded-xl border border-border p-6 transition-opacity ${isAnalyzingHair ? 'opacity-50 pointer-events-none' : ''}`}>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    Select Hairstyle
                    {isAnalyzingHair && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {!modelViews.back ? 'Upload a back model view to enable hairstyle selection' : 
                     analyzedHairLength ? `Based on detected ${analyzedHairLength} hair length, some styles may be unavailable.` : 
                     'Select a hairstyle for the model'}
                  </p>
                  
                  {/* Gender Tabs */}
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => { setHairstyleGender('women'); setSelectedHairstyle('loose'); }}
                      className={`px-6 py-2 rounded-lg font-semibold text-sm transition-all ${
                        hairstyleGender === 'women'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      Women
                    </button>
                    <button
                      onClick={() => { setHairstyleGender('men'); setSelectedHairstyle('men-buzz'); }}
                      className={`px-6 py-2 rounded-lg font-semibold text-sm transition-all ${
                        hairstyleGender === 'men'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      Men
                    </button>
                  </div>

                  <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-3">
                    {hairstyleOptions.map(style => {
                      const enabled = modelViews.back ? isHairstyleEnabled(style.minLength) : true;
                      return (
                        <button
                          key={style.id}
                          onClick={() => enabled && setSelectedHairstyle(style.id)}
                          disabled={!enabled}
                          className={`relative rounded-lg border-2 overflow-hidden transition-all ${
                            selectedHairstyle === style.id
                              ? 'border-primary ring-2 ring-primary ring-offset-2'
                              : enabled ? 'border-border hover:border-primary/50' : 'border-border/30 opacity-50 cursor-not-allowed'
                          }`}
                        >
                          {style.image ? (
                            <img src={style.image} alt={style.name} className="w-full aspect-square object-cover" />
                          ) : (
                            <div className="w-full aspect-square bg-muted flex items-center justify-center">
                              <span className="text-xs text-muted-foreground">Natural</span>
                            </div>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1.5">
                            <div className="text-[10px] font-medium text-white text-center truncate">{style.name}</div>
                          </div>
                          {selectedHairstyle === style.id && (
                            <div className="absolute top-1 right-1 bg-primary rounded-full p-0.5">
                              <Check className="h-3 w-3 text-primary-foreground" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Pose Selection */}
                <div className={`bg-card rounded-xl border border-border p-6 transition-opacity ${isAnalyzingHair ? 'opacity-50 pointer-events-none' : ''}`}>
                  <h3 className="text-lg font-semibold mb-4">Select Pose</h3>
                  <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-9 gap-3">
                    {poseOptions.map(pose => (
                      <button
                        key={pose.id}
                        onClick={() => setSelectedPose(pose.id)}
                        className={`relative rounded-lg border-2 overflow-hidden transition-all ${
                          selectedPose === pose.id ? 'border-primary ring-2 ring-primary ring-offset-2' : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <img src={pose.image} alt={pose.name} className="w-full aspect-[2/3] object-cover" />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                          <div className="text-xs font-medium text-white text-center">{pose.name}</div>
                        </div>
                        {selectedPose === pose.id && (
                          <div className="absolute top-1 right-1 bg-primary rounded-full p-0.5">
                            <Check className="h-3 w-3 text-primary-foreground" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Background Settings */}
                <div className={`bg-card rounded-xl border border-border p-6 transition-opacity ${isAnalyzingHair ? 'opacity-50 pointer-events-none' : ''}`}>
                  <h3 className="text-lg font-semibold mb-4">Background</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className={backgroundReference || customBackgroundPrompt ? 'opacity-50 pointer-events-none' : ''}>
                      <label className="text-sm font-semibold mb-3 block">Background Preset</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'white', label: 'White', color: '#FFFFFF' },
                          { id: 'beige', label: 'Beige', color: '#F5F5DC' },
                          { id: 'light-grey', label: 'Light Grey', color: '#D3D3D3' },
                          { id: 'grey', label: 'Grey', color: '#808080' },
                          { id: 'dark-grey', label: 'Dark Grey', color: '#404040' },
                          { id: 'black', label: 'Black', color: '#000000' },
                        ].map(bg => (
                          <button key={bg.id} onClick={() => { setSelectedBackground(bg.id); setCustomBackgroundPrompt(''); }}
                            disabled={!!backgroundReference || !!customBackgroundPrompt}
                            className={`relative p-3 rounded-lg border-2 text-center transition-all overflow-hidden ${
                              selectedBackground === bg.id && !customBackgroundPrompt && !backgroundReference ? 'border-primary ring-2 ring-primary ring-offset-2' : 'border-border hover:border-primary/50'
                            } ${(backgroundReference || customBackgroundPrompt) ? 'cursor-not-allowed' : ''}`}>
                            <div className="w-full h-12 rounded mb-2 border border-border/20" style={{ backgroundColor: bg.color }} />
                            <div className="text-xs font-semibold">{bg.label}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className={customBackgroundPrompt ? 'opacity-50 pointer-events-none' : ''}>
                        <label className="text-sm font-semibold mb-2 block">Background Reference (Optional)</label>
                        <DragDropZone onFileDrop={(files) => { setBackgroundReference(files[0] || null); if (files[0]) { setSelectedBackground(''); setCustomBackgroundPrompt(''); } }} accept="image/*" disabled={!!customBackgroundPrompt} className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors min-h-[100px] flex items-center justify-center">
                          <input type="file" accept="image/*" onChange={e => {
                            const file = e.target.files?.[0] || null;
                            setBackgroundReference(file);
                            if (file) { setSelectedBackground(''); setCustomBackgroundPrompt(''); }
                          }} className="hidden" id="background-reference" disabled={!!customBackgroundPrompt} />
                          <label htmlFor="background-reference" className={`block w-full ${customBackgroundPrompt ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                            {backgroundReference ? (
                              <div className="space-y-2">
                                <img src={URL.createObjectURL(backgroundReference)} alt="Background reference" className="w-full h-16 object-contain rounded" />
                                <Button size="sm" variant="ghost" onClick={e => { e.preventDefault(); setBackgroundReference(null); }}><X className="w-4 h-4 mr-1" />Remove</Button>
                              </div>
                            ) : (
                              <><Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" /><p className="text-xs font-medium">Drop or Upload Reference</p></>
                            )}
                          </label>
                        </DragDropZone>
                      </div>
                      <div className={backgroundReference ? 'opacity-50 pointer-events-none' : ''}>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-semibold">Custom Background (Optional)</label>
                          {customBackgroundPrompt.trim() && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={optimizeBackgroundPrompt}
                              disabled={isOptimizingPrompt || !!backgroundReference}
                              className="text-xs h-7 px-2 gap-1 text-primary hover:text-primary"
                            >
                              {isOptimizingPrompt ? (
                                <><Loader2 className="w-3 h-3 animate-spin" />Enhancing...</>
                              ) : (
                                <><Sparkles className="w-3 h-3" />Enhance with AI</>
                              )}
                            </Button>
                          )}
                        </div>
                        <textarea
                          value={customBackgroundPrompt}
                          onChange={e => { 
                            setCustomBackgroundPrompt(e.target.value); 
                            if (e.target.value) { 
                              setSelectedBackground(''); 
                              setBackgroundReference(null);
                            } else { 
                              setSelectedBackground('light-grey'); 
                            }
                          }}
                          placeholder="Describe your custom background... (e.g., modern minimalist studio with soft shadows)"
                          className={`w-full h-[100px] p-3 rounded-lg border-2 bg-background text-sm focus:outline-none resize-none ${customBackgroundPrompt.length > 250 ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-primary'}`}
                          disabled={!!backgroundReference}
                        />
                        <div className={`text-xs mt-1 text-right ${customBackgroundPrompt.length > 250 ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                          {customBackgroundPrompt.length}/250 characters
                        </div>
                        {customBackgroundPrompt && customBackgroundPrompt.length <= 40 && (
                          <p className="text-xs text-muted-foreground mt-1">Custom background is active - presets are disabled</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Lighting Presets */}
                  <div className="mt-6">
                    <label className="text-sm font-semibold mb-3 block">Lighting Preset</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                      {[
                        { id: 'studio', label: 'Studio', desc: 'Professional 3-point lighting' },
                        { id: 'natural', label: 'Natural', desc: 'Soft daylight' },
                        { id: 'dramatic', label: 'Dramatic', desc: 'High contrast shadows' },
                        { id: 'soft', label: 'Soft', desc: 'Diffused, minimal shadows' },
                        { id: 'warm', label: 'Warm', desc: 'Golden hour tones' },
                        { id: 'cool', label: 'Cool', desc: 'Blue-toned modern' },
                      ].map(lighting => (
                        <button
                          key={lighting.id}
                          onClick={() => setSelectedLighting(lighting.id)}
                          className={`p-3 rounded-lg border-2 text-left transition-all ${
                            selectedLighting === lighting.id 
                              ? 'border-primary ring-2 ring-primary ring-offset-2 bg-primary/10' 
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="text-sm font-semibold">{lighting.label}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{lighting.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Output Size */}
                <div className={`bg-card rounded-xl border border-border p-6 transition-opacity ${isAnalyzingHair ? 'opacity-50 pointer-events-none' : ''}`}>
                  <h3 className="text-lg font-semibold mb-4">Output Size</h3>
                  <div className="space-y-6">
                    <div>
                      <label className="mb-3 block text-sm font-semibold">Aspect Ratio</label>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                        {[
                          { label: "1:1", width: 1024, height: 1024 },
                          { label: "4:5", width: 928, height: 1152 },
                          { label: "3:4", width: 896, height: 1200 },
                          { label: "2:3", width: 848, height: 1264 },
                          { label: "9:16", width: 768, height: 1376 },
                        ].map(ratio => {
                          const getCurrentMultiplier = () => {
                            const maxDim = Math.max(outputSize.width, outputSize.height);
                            if (maxDim <= 1400) return 1; else if (maxDim <= 2800) return 2; else return 4;
                          };
                          const multiplier = getCurrentMultiplier();
                          const isSelected = outputSize.width === ratio.width * multiplier && outputSize.height === ratio.height * multiplier;
                          return (
                            <div key={ratio.label} onClick={() => setOutputSize({ width: ratio.width * multiplier, height: ratio.height * multiplier })}
                              className={`flex flex-col items-center justify-center rounded-md border-2 p-3 cursor-pointer transition-all hover:bg-accent ${isSelected ? "border-primary bg-primary/10" : "border-muted bg-popover"}`}>
                              <span className="text-sm font-semibold">{ratio.label}</span>
                              <span className="text-xs text-muted-foreground mt-0.5">{ratio.width * multiplier}×{ratio.height * multiplier}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <label className="mb-3 block text-sm font-semibold">Resolution</label>
                      <p className="text-xs text-muted-foreground mb-3">1K = 2 credits · 2K = 3 credits · 4K = 4 credits</p>
                      <div className="grid grid-cols-3 gap-2">
                        {[{ label: "1K", multiplier: 1, maxDim: 1400 }, { label: "2K", multiplier: 2, maxDim: 2800 }, { label: "4K", multiplier: 4, maxDim: 5600 }].map(res => {
                          const maxDim = Math.max(outputSize.width, outputSize.height);
                          const isSelected = maxDim <= res.maxDim && (res.label === "1K" ? maxDim <= 1400 : res.label === "2K" ? maxDim > 1400 && maxDim <= 2800 : maxDim > 2800);
                          return (
                            <div key={res.label} onClick={() => {
                              const baseRatios = [{ label: "1:1", width: 1024, height: 1024 }, { label: "4:5", width: 928, height: 1152 }, { label: "3:4", width: 896, height: 1200 }, { label: "2:3", width: 848, height: 1264 }, { label: "9:16", width: 768, height: 1376 }];
                              const currentRatio = baseRatios.find(r => {
                                const currentMult = Math.max(outputSize.width, outputSize.height) <= 1400 ? 1 : Math.max(outputSize.width, outputSize.height) <= 2800 ? 2 : 4;
                                return outputSize.width === r.width * currentMult && outputSize.height === r.height * currentMult;
                              }) || baseRatios[0];
                              setOutputSize({ width: currentRatio.width * res.multiplier, height: currentRatio.height * res.multiplier });
                            }} className={`flex flex-col items-center justify-center rounded-md border-2 p-3 cursor-pointer transition-all hover:bg-accent ${isSelected ? "border-primary bg-primary/10" : "border-muted bg-popover"}`}>
                              <span className="text-sm font-semibold">{res.label}</span>
                              <span className="text-xs text-muted-foreground mt-0.5">{res.multiplier === 1 ? '2 credits' : res.multiplier === 2 ? '3 credits' : '4 credits'}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Total Cost & Generate */}
                <div className={`bg-card rounded-xl border border-border p-6 transition-opacity ${isAnalyzingHair ? 'opacity-50 pointer-events-none' : ''}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Total Cost</h3>
                    <div className="text-right">
                      <p className="text-3xl font-bold">{calculateCreditCost()}</p>
                      <p className="text-sm text-muted-foreground">credits</p>
                    </div>
                  </div>
                  <Button onClick={handleStartBatch} disabled={isAnalyzingHair || !hasAccess || isProcessing || products.filter(p => p.selectedPieces.length > 0).length === 0 || !(modelViews.front || modelViews.back || modelViews.left || modelViews.right) || credits < calculateCreditCost()} size="lg" className="w-full">
                    <Loader2 className={`mr-2 h-5 w-5 ${isProcessing ? "animate-spin" : "hidden"}`} />
                    {isProcessing ? "Processing..." : `Generate ${calculateTotalProductViews()} Views`}
                  </Button>
                  {!hasAccess && <p className="text-sm text-muted-foreground text-center mt-2">You don't have access to this tool.</p>}
                </div>
              </div>
            )}

            {isProcessing && !currentBatchId && (
              <GenerationProgressOverlay
                open={true}
                stage="uploading"
                progress={15}
                statusMessage="Uploading and preparing images..."
                title="Starting Batch Generation"
              />
            )}
          </div>
        </main>
      </div>

      {/* Preview Image Modal */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-6xl w-full p-0 border-0 bg-transparent shadow-2xl overflow-hidden">
          <div className="relative w-full h-[90vh] rounded-2xl overflow-hidden bg-gradient-to-br from-black/95 via-black/98 to-black/95 backdrop-blur-sm">
            <button onClick={() => setPreviewImage(null)} className="absolute top-4 right-4 z-50 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center transition-all duration-200 hover:scale-110">
              <X className="h-5 w-5 text-white" />
            </button>
            <div className="w-full h-full flex items-center justify-center py-16 px-4">
              {previewImage && <img src={previewImage} alt="Preview" className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg shadow-2xl" />}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Regenerate Batch Modal */}
      <Dialog open={showRegenerateModal} onOpenChange={setShowRegenerateModal}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Regenerate Batch with New Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <p className="text-sm text-muted-foreground">Adjust settings below. All {batchItems.length} images will be regenerated.</p>
            <div>
              <label className="text-sm font-semibold mb-3 block">Background Color</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'white', label: 'White', color: '#ffffff' },
                  { id: 'light-grey', label: 'Light Grey', color: '#d3d3d3' },
                  { id: 'black', label: 'Black', color: '#000000' },
                ].map(bg => (
                  <button key={bg.id} onClick={() => { setRegenerateBackground(bg.id); setRegenerateBackgroundReference(null); setRegenerateCustomPrompt(''); }}
                    className={`p-3 rounded-lg border-2 text-left transition-all flex items-center gap-2 ${regenerateBackground === bg.id ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}>
                    <div className="w-5 h-5 rounded-full border border-border" style={{ backgroundColor: bg.color }} />
                    <span className="text-sm">{bg.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowRegenerateModal(false)}>Cancel</Button>
              <Button className="flex-1" onClick={handleRegenerateBatch} disabled={isProcessing}>
                {isProcessing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Regenerating...</> : <><RefreshCw className="w-4 h-4 mr-2" />Regenerate</>}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <CreditsPurchaseDialog open={showCreditsPurchase} onOpenChange={setShowCreditsPurchase} />

      {editingOutfitImage && (
        <ImageEditModal
          open={!!editingOutfitImage}
          onOpenChange={(open) => { if (!open) setEditingOutfitImage(null); }}
          imageUrl={editingOutfitImage}
          onEditComplete={(newUrl) => {
            setBatchItems(prev => prev.map(item => 
              item.result_url === editingOutfitImage ? { ...item, result_url: newUrl } : item
            ));
          }}
          isAdmin={isAdmin || hasAdminToken}
        />
      )}
    </div>
  );
};

export default UltimateOutfitMakerV2;
