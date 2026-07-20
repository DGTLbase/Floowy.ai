import { useState, useEffect } from "react";
import DragDropZone from "@/components/DragDropZone";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useAdminToken } from "@/hooks/useAdminToken";
import { ArrowLeft, Upload, Loader2, CheckCircle2, XCircle, Clock, Download, X, RefreshCw, Check, Shield } from "lucide-react";
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
import CameraStylePresetSelect from "@/components/CameraStylePresetSelect";
import { cameraStylePrompt, CAMERA_STYLE_NONE } from "@/lib/camera-style-presets";

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
const BulkMockupGenerator = () => {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const {
    isAdmin,
    isLoading: isLoadingAdmin
  } = useAdminCheck();
  const hasAdminToken = useAdminToken();
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [credits, setCredits] = useState(0);
  const [userPlan, setUserPlan] = useState<string>("free");
  const [hasAccess, setHasAccess] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(false);
  useOnboardingCheck(true); // Skip onboarding check for special-access tool

  // Helper function to sanitize filenames for storage
  const sanitizeFileName = (filename: string): string => {
    // Get file extension
    const lastDotIndex = filename.lastIndexOf('.');
    const name = lastDotIndex > 0 ? filename.substring(0, lastDotIndex) : filename;
    const ext = lastDotIndex > 0 ? filename.substring(lastDotIndex) : '';

    // Replace spaces and special characters with hyphens
    const sanitized = name.replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/[^a-zA-Z0-9-_]/g, '-') // Replace special chars with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

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
      tops: {
        front: null,
        back: null,
        left: null,
        right: null
      },
      trousers: {
        front: null,
        back: null,
        left: null,
        right: null
      },
      jacket: {
        front: null,
        back: null,
        left: null,
        right: null
      },
      hat: {
        front: null,
        back: null,
        left: null,
        right: null
      },
      shoes: {
        front: null,
        back: null,
        left: null,
        right: null
      },
      jumpsuit: {
        front: null,
        back: null,
        left: null,
        right: null
      },
      dress: {
        front: null,
        back: null,
        left: null,
        right: null
      }
    },
    accessories: []
  }]);
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const [modelViews, setModelViews] = useState<{
    front: File | null;
    back: File | null;
    left: File | null;
    right: File | null;
  }>({
    front: null,
    back: null,
    left: null,
    right: null
  });
  const [outputSize, setOutputSize] = useState({
    width: 1024,
    height: 1024
  });
  const [selectedBackground, setSelectedBackground] = useState<string>('light-grey');
  const [backgroundReference, setBackgroundReference] = useState<File | null>(null);
  const [customBackgroundPrompt, setCustomBackgroundPrompt] = useState<string>('');
  const [selectedPose, setSelectedPose] = useState<string>('natural-standing');
  const [cameraStyle, setCameraStyle] = useState<string>(CAMERA_STYLE_NONE);
  const [showCreditsPurchase, setShowCreditsPurchase] = useState(false);
  const [currentBatchId, setCurrentBatchId] = useState<string | null>(null);
  const [batchStatus, setBatchStatus] = useState<any>(null);
  const [batchItems, setBatchItems] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [regenerateBackground, setRegenerateBackground] = useState<string>('light-grey');
  const [regenerateCustomPrompt, setRegenerateCustomPrompt] = useState<string>('');
  const [regenerateBackgroundReference, setRegenerateBackgroundReference] = useState<File | null>(null);
  const [regenerateOutputSize, setRegenerateOutputSize] = useState({ width: 1024, height: 1024 });
  const [regenerateResolution, setRegenerateResolution] = useState<'1K' | '2K' | '4K'>('1K');
  const [previewImageDimensions, setPreviewImageDimensions] = useState({
    width: 0,
    height: 0
  });
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
          body: JSON.stringify({
            action: 'verify',
            token
          })
        });
        return res.ok;
      } catch {}
      return false;
    };
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        // Defer async operations to prevent auth deadlock
        setTimeout(() => {
          checkAccess(session.user.id);
          fetchCredits(session.user.id);
          fetchUserData(session.user.id);
        }, 0);
      } else {
        setTimeout(() => verifyAdmin(), 0);
      }
    });
    supabase.auth.getSession().then(async ({
      data: {
        session
      }
    }) => {
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
      console.error("No userId provided to checkAccess");
      setHasAccess(false);
      setIsCheckingAccess(false);
      return;
    }
    console.log("Starting access check for user:", userId);
    setIsCheckingAccess(true);

    // Add timeout to prevent infinite checking
    const timeoutId = setTimeout(() => {
      console.warn("Access check timed out after 10s, assuming no access");
      setHasAccess(false);
      setIsCheckingAccess(false);
    }, 10000);
    try {
      // Check if user is admin first
      const {
        data: roleData
      } = await supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
      if (roleData) {
        clearTimeout(timeoutId);
        console.log("Admin user detected, granting access");
        setHasAccess(true);
        setIsCheckingAccess(false);
        return;
      }

      // If not admin, check tool access
      const {
        data,
        error
      } = await supabase.from("user_tool_access").select("has_access").eq("user_id", userId).eq("tool_name", "fashion-2.0").maybeSingle();
      clearTimeout(timeoutId);
      console.log("Access check completed:", {
        data,
        error,
        userId
      });
      if (error) {
        console.error("Access check error:", error);
        setHasAccess(false);
        setIsCheckingAccess(false);
        return;
      }
      const access = data?.has_access === true;
      console.log("Setting hasAccess to:", access);
      setHasAccess(access);
      setIsCheckingAccess(false);
    } catch (err) {
      clearTimeout(timeoutId);
      console.error("Access check exception:", err);
      setHasAccess(false);
      setIsCheckingAccess(false);
    }
  };
  const fetchUserData = async (userId: string) => {
    try {
      const {
        data: profile,
        error
      } = await supabase.from("profiles").select("email, full_name, plan").eq("id", userId).single();
      if (error) {
        console.error("Error fetching profile:", error);
        return;
      }
      if (profile) {
        setUserEmail(profile.email || "");
        setUserName(profile.full_name || "");
        setUserPlan(profile.plan || "free");
      }
    } catch (err) {
      console.error("Profile fetch exception:", err);
    }
  };
  const fetchCredits = async (userId: string) => {
    try {
      const {
        data,
        error
      } = await supabase.from("credits").select("balance").eq("user_id", userId).single();
      if (error) {
        console.error("Error fetching credits:", error);
        return;
      }
      setCredits(data?.balance || 0);
    } catch (err) {
      console.error("Credits fetch exception:", err);
    }
  };
  useEffect(() => {
    console.log('Batch polling useEffect triggered. currentBatchId:', currentBatchId);
    if (!currentBatchId) {
      console.log('No currentBatchId, skipping polling setup');
      return;
    }

    // Fetch initial batch items
    const fetchBatchItems = async () => {
      const {
        data
      } = await supabase.from('batch_items').select('*').eq('batch_id', currentBatchId).order('order_index');
      if (data) {
        setBatchItems(data);
      }
    };
    fetchBatchItems();

    // Function to check batch status
    const checkStatus = async () => {
      console.log('Checking batch status for:', currentBatchId);
      try {
        const {
          data,
          error
        } = await supabase.functions.invoke('check-batch-status', {
          body: {
            batch_id: currentBatchId
          }
        });
        console.log('Status check response:', {
          data,
          error
        });
        if (error) {
          console.error('Status check error:', error);
        }
      } catch (error) {
        console.error('Status check exception:', error);
      }
    };

    // Call immediately on mount
    console.log('Starting immediate status check for batch:', currentBatchId);
    checkStatus();

    // Poll batch status every 5 seconds
    console.log('Starting polling interval for batch:', currentBatchId);
    const pollInterval = setInterval(checkStatus, 5000);
    const channel = supabase.channel(`batch-${currentBatchId}`).on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'batch_jobs',
      filter: `id=eq.${currentBatchId}`
    }, payload => {
      console.log('Batch status update:', payload);
      setBatchStatus(payload.new);

      // Show completion notification
      if (payload.new.status === 'completed') {
        toast({
          title: "Batch Complete! 🎉",
          description: `Successfully generated ${payload.new.completed_count} mockups`
        });
        setIsProcessing(false);
      }
    }).on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'batch_items',
      filter: `batch_id=eq.${currentBatchId}`
    }, async payload => {
      console.log('Batch item update:', payload);
      // Refresh all items to ensure correct order and state
      const {
        data
      } = await supabase.from('batch_items').select('*').eq('batch_id', currentBatchId).order('order_index');
      if (data) {
        setBatchItems(data);
      }
    }).subscribe();
    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, [currentBatchId, toast]);

  // Debug logging for button state

  const getPieceDisplayName = (piece: string): string => {
    const displayNames: {
      [key: string]: string;
    } = {
      'tops': 'Tops',
      'trousers': 'Trousers',
      'jacket': 'Jacket/Outerwear',
      'hat': 'Hat',
      'shoes': 'Shoes',
      'jumpsuit': 'Jumpsuit',
      'dress': 'Dress'
    };
    return displayNames[piece] || piece;
  };
  const handleOutfitPieceToggle = (productIdx: number, piece: string) => {
    setProducts(products.map((p, idx) => {
      if (idx !== productIdx) return p;
      const selected = p.selectedPieces.includes(piece);

      // Full outfit items (jumpsuit, dress) are mutually exclusive with separate pieces
      const fullOutfits = ['jumpsuit', 'dress'];
      const separatePieces = ['tops', 'trousers', 'jacket', 'hat', 'shoes'];
      let newSelectedPieces: string[];
      if (selected) {
        // Deselecting the piece
        newSelectedPieces = p.selectedPieces.filter(pc => pc !== piece);
      } else {
        // Selecting a piece
        if (fullOutfits.includes(piece)) {
          // If selecting a full outfit, clear all separate pieces
          newSelectedPieces = [piece];
        } else if (separatePieces.includes(piece)) {
          // If selecting a separate piece, clear any full outfits
          newSelectedPieces = [...p.selectedPieces.filter(pc => !fullOutfits.includes(pc)), piece];
        } else {
          newSelectedPieces = [...p.selectedPieces, piece];
        }
      }
      return {
        ...p,
        selectedPieces: newSelectedPieces
      };
    }));
  };
  const handleOutfitViewUpload = (productIdx: number, piece: string, view: 'front' | 'back' | 'left' | 'right', file: File | null) => {
    setProducts(products.map((p, idx) => {
      if (idx !== productIdx) return p;
      return {
        ...p,
        outfitViews: {
          ...p.outfitViews,
          [piece]: {
            ...p.outfitViews[piece],
            [view]: file
          }
        }
      };
    }));
  };

  // Handle model view upload
  const handleModelViewUpload = (view: 'front' | 'back' | 'left' | 'right', file: File | null) => {
    setModelViews(prev => ({ ...prev, [view]: file }));
  };

  // Get which views are required based on uploaded outfit pieces
  const getRequiredViews = (): Array<'front' | 'back' | 'left' | 'right'> => {
    const allViews = new Set<'front' | 'back' | 'left' | 'right'>();
    products.forEach(product => {
      product.selectedPieces.forEach(piece => {
        const views = product.outfitViews[piece];
        if (views && views.front) allViews.add('front');
        if (views && views.back) allViews.add('back');
        if (views && views.left) allViews.add('left');
        if (views && views.right) allViews.add('right');
      });
    });
    return Array.from(allViews);
  };

  // Handle angle toggle for a specific outfit
  const handleAngleToggle = (productIdx: number, angle: 'front' | 'back' | 'left' | 'right') => {
    setProducts(products.map((p, idx) => {
      if (idx !== productIdx) return p;
      const isSelected = p.selectedAngles.includes(angle);
      if (isSelected) {
        // Don't allow deselecting if it's the only angle
        if (p.selectedAngles.length === 1) return p;
        return { ...p, selectedAngles: p.selectedAngles.filter(a => a !== angle) };
      } else {
        return { ...p, selectedAngles: [...p.selectedAngles, angle] };
      }
    }));
  };

  // Get available views for an outfit (all 4 views are always available)
  const getAvailableViewsForOutfit = (productIdx: number): Array<'front' | 'back' | 'left' | 'right'> => {
    return ['front', 'back', 'left', 'right'];
  };

  // Calculate how many distinct outfit views will be generated across all products
  const calculateTotalProductViews = (): number => {
    // Sum up selected angles for all outfits (regardless of whether pieces are selected)
    return products.reduce((total, product) => total + product.selectedAngles.length, 0);
  };
  const calculateCreditCost = (): number => {
    const maxDimension = Math.max(outputSize.width, outputSize.height);
    let costPerView = 2; // Default 1K = 2 credits per view

    if (maxDimension <= 1400) costPerView = 2;else if (maxDimension <= 2800) costPerView = 3;else costPerView = 4;

    // Calculate total views based on uploaded outfit pieces
    const totalViews = calculateTotalProductViews();
    return totalViews * costPerView;
  };
  const handleStartBatch = async () => {
    // Prevent duplicate batch starts
    if (isProcessing || currentBatchId) {
      toast({
        title: "Batch Already Processing",
        description: "Please wait for the current batch to complete.",
        variant: "destructive"
      });
      return;
    }

    // Check if at least one product has outfit pieces selected
    const productsWithOutfits = products.filter(p => p.selectedPieces.length > 0);
    if (productsWithOutfits.length === 0) {
      toast({
        title: "No Products Created",
        description: "Please select outfit pieces for at least one product",
        variant: "destructive"
      });
      return;
    }

    // Check if all products with selected pieces have at least one view uploaded
    const allProductsHaveViews = productsWithOutfits.every(product => {
      return product.selectedPieces.every(piece => {
        const views = product.outfitViews[piece];
        return views && (views.front || views.back || views.left || views.right);
      });
    });
    if (!allProductsHaveViews) {
      toast({
        title: "Missing Product Views",
        description: "Please upload at least one view for each selected outfit piece",
        variant: "destructive"
      });
      return;
    }

    // Check if at least one model view is uploaded (front view recommended for best consistency)
    const hasModelView = modelViews.front || modelViews.back || modelViews.left || modelViews.right;
    if (!hasModelView) {
      toast({
        title: "Model Required",
        description: "Please upload at least one model image (front view recommended for consistent face and hairstyle across all views)",
        variant: "destructive"
      });
      setIsProcessing(false);
      return;
    }
    const totalCredits = calculateCreditCost();
    if (!isAdmin && !hasAdminToken && !hasAccess && credits < totalCredits) {
      toast({
        title: "Insufficient Credits",
        description: "You don't have enough credits!",
        variant: "destructive"
      });
      setShowCreditsPurchase(true);
      return;
    }
    setIsProcessing(true);
    try {
      const timestamp = Date.now();
      const userId = user.id;

      // Upload model views to storage
      const modelUrls: any = {};
      for (const [view, file] of Object.entries(modelViews)) {
        if (file) {
          const sanitizedName = sanitizeFileName(file.name);
          const {
            data,
            error
          } = await supabase.storage.from("user-uploads").upload(`${userId}/${timestamp}-model-${view}-${sanitizedName}`, file, {
            upsert: true
          });
          if (error) {
            console.error(`Failed to upload model ${view}:`, error);
            toast({
              title: "Upload Error",
              description: `Failed to upload model ${view} image. Please try again.`,
              variant: "destructive"
            });
          } else {
            const {
              data: urlData
            } = supabase.storage.from("user-uploads").getPublicUrl(data.path);
            modelUrls[view] = urlData.publicUrl;
          }
        }
      }

      // Use the front view as the primary model URL, or the first available view
      const modelImgbbUrl = modelUrls.front || modelUrls.back || modelUrls.left || modelUrls.right;

      // Upload products - only products with outfit pieces selected
      const productUrls: any[] = [];
      for (let i = 0; i < productsWithOutfits.length; i++) {
        const product = productsWithOutfits[i];
        const outfitUrls: any = {};

        // Upload each selected outfit piece
        for (const piece of product.selectedPieces) {
          const views = product.outfitViews[piece];
          const viewUrls: any = {};

          // Upload front view
          if (views.front) {
            const sanitizedName = sanitizeFileName(views.front.name);
            const {
              data,
              error
            } = await supabase.storage.from("user-uploads").upload(`${userId}/${timestamp}-product-${i}-${piece}-front-${sanitizedName}`, views.front, {
              upsert: true
            });
            if (!error) {
              const {
                data: urlData
              } = supabase.storage.from("user-uploads").getPublicUrl(data.path);
              viewUrls.front = urlData.publicUrl;
            }
          }

          // Upload back view
          if (views.back) {
            const sanitizedName = sanitizeFileName(views.back.name);
            const {
              data,
              error
            } = await supabase.storage.from("user-uploads").upload(`${userId}/${timestamp}-product-${i}-${piece}-back-${sanitizedName}`, views.back, {
              upsert: true
            });
            if (!error) {
              const {
                data: urlData
              } = supabase.storage.from("user-uploads").getPublicUrl(data.path);
              viewUrls.back = urlData.publicUrl;
            }
          }

          // Upload left view
          if (views.left) {
            const sanitizedName = sanitizeFileName(views.left.name);
            const {
              data,
              error
            } = await supabase.storage.from("user-uploads").upload(`${userId}/${timestamp}-product-${i}-${piece}-left-${sanitizedName}`, views.left, {
              upsert: true
            });
            if (!error) {
              const {
                data: urlData
              } = supabase.storage.from("user-uploads").getPublicUrl(data.path);
              viewUrls.left = urlData.publicUrl;
            }
          }

          // Upload right view
          if (views.right) {
            const sanitizedName = sanitizeFileName(views.right.name);
            const {
              data,
              error
            } = await supabase.storage.from("user-uploads").upload(`${userId}/${timestamp}-product-${i}-${piece}-right-${sanitizedName}`, views.right, {
              upsert: true
            });
            if (!error) {
              const {
                data: urlData
              } = supabase.storage.from("user-uploads").getPublicUrl(data.path);
              viewUrls.right = urlData.publicUrl;
            }
          }
          outfitUrls[piece] = viewUrls;
        }
        productUrls.push(outfitUrls);
      }

      // Upload background reference if provided
      let backgroundReferenceUrl = null;
      if (backgroundReference) {
        const {
          data,
          error
        } = await supabase.storage.from("user-uploads").upload(`${userId}/${timestamp}-background-reference-${backgroundReference.name}`, backgroundReference, {
          upsert: true
        });
        if (!error) {
          const {
            data: urlData
          } = supabase.storage.from("user-uploads").getPublicUrl(data.path);
          backgroundReferenceUrl = urlData.publicUrl;
        }
      }

      // Upload accessories for each product
      const accessoryUrls: string[][] = [];
      for (let i = 0; i < productsWithOutfits.length; i++) {
        const product = productsWithOutfits[i];
        const urls: string[] = [];
        for (const accessoryFile of product.accessories) {
          const sanitizedName = sanitizeFileName(accessoryFile.name);
          const {
            data,
            error
          } = await supabase.storage.from("user-uploads").upload(`${userId}/${timestamp}-product-${i}-accessory-${sanitizedName}`, accessoryFile, {
            upsert: true
          });
          if (!error) {
            const {
              data: urlData
            } = supabase.storage.from("user-uploads").getPublicUrl(data.path);
            urls.push(urlData.publicUrl);
          }
        }
        accessoryUrls.push(urls);
      }
      const backgroundMap: {
        [key: string]: string;
      } = {
        'white': 'pure white background',
        'beige': 'warm beige background',
        'light-grey': 'light grey background',
        'grey': 'neutral grey background',
        'dark-grey': 'dark grey background',
        'black': 'solid black background',
        'cream': 'soft cream background',
        'navy': 'deep navy blue background',
        'sage': 'muted sage green background'
      };
      // Use custom prompt if provided, otherwise use preset mappings
      const basePrompt = customBackgroundPrompt || (backgroundMap[selectedBackground] || backgroundMap['light-grey']);
      const cam = cameraStylePrompt(cameraStyle);
      const backgroundText = cam ? `${basePrompt}. ${cam}` : basePrompt;

      // Determine which views to generate based on uploaded model views
      const viewsToGenerate: Array<'front' | 'back' | 'left' | 'right'> = [];
      if (modelViews.front) viewsToGenerate.push('front');
      if (modelViews.back) viewsToGenerate.push('back');
      if (modelViews.left) viewsToGenerate.push('left');
      if (modelViews.right) viewsToGenerate.push('right');

      // Calculate total views based on user's selected angles (not uploaded views)
      let totalViews = 0;
      const viewMapping: Record<number, 'front' | 'back' | 'left' | 'right'> = {}; // Maps order_index to view
      let orderIndexCounter = 0;
      productsWithOutfits.forEach(product => {
        // Use selectedAngles to determine which views to generate
        const anglesToGenerate = product.selectedAngles || ['front', 'back', 'left', 'right'];

        // Map each order index to its corresponding angle
        anglesToGenerate.forEach(angle => {
          viewMapping[orderIndexCounter] = angle;
          orderIndexCounter++;
        });
        totalViews += anglesToGenerate.length;
      });

      // Create batch job for all products with generated views
      const {
        data: batchData,
        error: batchError
      } = await supabase.from("batch_jobs").insert({
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

      // Create batch items based on user's selected angles (not uploaded views)
      const batchItemsData = [];
      let orderIndex = 0;
      for (let i = 0; i < productsWithOutfits.length; i++) {
        const product = productsWithOutfits[i];

        // Use selectedAngles to determine which views to generate
        const anglesToGenerate = product.selectedAngles || ['front', 'back', 'left', 'right'];

        // Create one batch item per selected angle
        for (const angle of anglesToGenerate) {
          batchItemsData.push({
            batch_id: batchId,
            product_url: `outfit-${i + 1}-${angle}`,
            status: "pending",
            order_index: orderIndex++
          });
        }
      }
      const {
        error: itemsError
      } = await supabase.from("batch_items").insert(batchItemsData);
      if (itemsError) throw itemsError;

      // Start processing via edge function
      const {
        data: processData,
        error: processError
      } = await supabase.functions.invoke("process-batch-mockups", {
        body: {
          batch_id: batchId
        }
      });
      
      if (processError) {
        console.error("Edge function invocation error:", processError);
        // Clean up batch job if edge function fails
        await supabase.from("batch_jobs").delete().eq("id", batchId);
        throw processError;
      }

      // Deduct credits (skip for admins)
      if (!isAdmin && !hasAdminToken) {
        const newBal1 = await deductCredits(userId, totalCredits);
        setCredits(newBal1);
      }
      toast({
        title: "Batch Started",
        description: `Generating ${totalViews} mockup views. Products with multiple outfit views will generate accordingly. You'll be notified when complete.`
      });
    } catch (error: any) {
      console.error("Batch start error:", error);
      toast({
        title: "Failed to Start Batch",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
      setIsProcessing(false);
      setCurrentBatchId(null);
    }
  };
  const handleReset = () => {
    setProducts([{
      selectedPieces: [],
      selectedAngles: ['front'],
      outfitViews: {
        tops: {
          front: null,
          back: null,
          left: null,
          right: null
        },
        trousers: {
          front: null,
          back: null,
          left: null,
          right: null
        },
        jacket: {
          front: null,
          back: null,
          left: null,
          right: null
        },
        hat: {
          front: null,
          back: null,
          left: null,
          right: null
        },
        jumpsuit: {
          front: null,
          back: null,
          left: null,
          right: null
        },
        dress: {
          front: null,
          back: null,
          left: null,
          right: null
        }
      },
      accessories: []
    }]);
    setCurrentProductIndex(0);
    setModelViews({
      front: null,
      back: null,
      left: null,
      right: null
    });
    setSelectedBackground('light-grey');
    setBackgroundReference(null);
    setCustomBackgroundPrompt('');
    setCurrentBatchId(null);
    setBatchStatus(null);
    setBatchItems([]);
    setIsProcessing(false);
  };
  const handleRegenerateItem = async (itemId: string, itemOrderIndex: number) => {
    if (!currentBatchId) return;
    try {
      // Mark item as pending to trigger regeneration
      await supabase.from('batch_items').update({
        status: 'pending',
        result_url: null,
        error_message: null,
        request_id: null
      }).eq('id', itemId);
      toast({
        title: "Regenerating Image",
        description: `Re-queuing mockup #${itemOrderIndex + 1} for generation`
      });

      // Trigger batch processing for pending items
      setTimeout(async () => {
        await supabase.functions.invoke('process-batch-mockups', {
          body: {
            batch_id: currentBatchId
          }
        });
      }, 1000);
    } catch (error: any) {
      console.error('Regenerate error:', error);
      toast({
        title: "Regeneration Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleRegenerateBatch = async () => {
    if (!currentBatchId || !batchStatus?.settings) return;
    
    try {
      const userId = session?.user?.id;
      if (!userId) throw new Error("User not authenticated");

      // Calculate credits needed based on regenerate output size
      const totalItems = batchItems.length;
      const maxDim = Math.max(regenerateOutputSize.width, regenerateOutputSize.height);
      const creditsPerItem = maxDim <= 1400 ? 2 : maxDim <= 2800 ? 3 : 4;
      const totalCredits = totalItems * creditsPerItem;

      if (!isAdmin && !hasAdminToken && credits < totalCredits) {
        toast({
          title: "Insufficient Credits",
          description: `You need ${totalCredits} credits to regenerate this batch. You have ${credits}.`,
          variant: "destructive"
        });
        return;
      }

      setIsProcessing(true);
      setShowRegenerateModal(false);

      // Upload background reference if provided
      let regenerateBackgroundReferenceUrl = null;
      if (regenerateBackgroundReference) {
        const { data, error: uploadError } = await supabase.storage
          .from("user-uploads")
          .upload(`background-refs/${userId}/${Date.now()}-${regenerateBackgroundReference.name}`, regenerateBackgroundReference);
        if (!uploadError && data) {
          const { data: urlData } = supabase.storage.from("user-uploads").getPublicUrl(data.path);
          regenerateBackgroundReferenceUrl = urlData.publicUrl;
        }
      }

      // Update settings including output size and background
      const updatedSettings = {
        ...batchStatus.settings,
        output_size: regenerateOutputSize,
        ...(regenerateBackgroundReferenceUrl ? {
          background_reference_url: regenerateBackgroundReferenceUrl,
          custom_background_prompt: null,
          background: null
        } : regenerateCustomPrompt.trim() ? {
          custom_background_prompt: regenerateCustomPrompt.trim(),
          background_reference_url: null,
          background: null
        } : {
          background: regenerateBackground,
          background_reference_url: null,
          custom_background_prompt: null
        })
      };

      // Also update the local outputSize state
      setOutputSize(regenerateOutputSize);

      await supabase.from("batch_jobs").update({
        settings: updatedSettings,
        status: "processing",
        completed_count: 0,
        failed_count: 0
      }).eq("id", currentBatchId);

      // Reset all batch items to pending
      await supabase.from("batch_items").update({
        status: "pending",
        result_url: null,
        error_message: null,
        request_id: null
      }).eq("batch_id", currentBatchId);

      // Trigger reprocessing
      const { error: processError } = await supabase.functions.invoke("process-batch-mockups", {
        body: { batch_id: currentBatchId }
      });

      if (processError) throw processError;

      // Deduct credits (skip for admins)
      if (!isAdmin && !hasAdminToken) {
        const newBal2 = await deductCredits(userId, totalCredits);
        setCredits(newBal2);
      }

      toast({
        title: "Regenerating Batch",
        description: `Regenerating ${totalItems} images with new settings.`
      });

    } catch (error: any) {
      console.error("Regenerate batch error:", error);
      toast({
        title: "Regeneration Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  };

  const progress = batchItems.length > 0 ? batchItems.filter(item => item.status === 'completed').length / batchItems.length * 100 : 0;
  return <div className="min-h-screen bg-gradient-to-b from-background via-secondary/20 to-background flex">
      <div className="flex-1 flex flex-col">
        {/* Navigation */}
        <nav className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                to="/home"
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <img src={logoImage} alt="Floowy.ai" className="h-8 w-auto" />
                <span className="font-bold text-xl text-foreground">Floowy.ai</span>
              </Link>
            </div>
            {isAdmin ? <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full">
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">Admin Mode</span>
              </div> : <div className="flex items-center gap-4">
                <PlanCreditsDisplay plan={userPlan} credits={credits} onAddCredits={() => {}} />
                <UserMenu onAddCredits={() => {}} />
              </div>}
          </div>
        </nav>

        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Fashion Studio Pro
              </h2>
              <p className="text-muted-foreground text-lg">
                Create professional 4-angle outfit mockups with AI models
              </p>
            </div>

            {currentBatchId && batchStatus ? <div className="space-y-6">
                <div className="bg-card rounded-xl border border-border p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-semibold">Batch Progress</h3>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">
                          {batchItems.filter(item => item.status === 'completed').length} / {batchItems.length} completed
                        </span>
                        <Button variant="outline" size="sm" onClick={async () => {
                      console.log('Manual status check triggered for:', currentBatchId);
                      try {
                        const {
                          data,
                          error
                        } = await supabase.functions.invoke('check-batch-status', {
                          body: {
                            batch_id: currentBatchId
                          }
                        });
                        console.log('Manual status check response:', {
                          data,
                          error
                        });
                        if (error) {
                          toast({
                            title: "Status Check Failed",
                            description: "Something went wrong. Please try again.",
                            variant: "destructive"
                          });
                        } else {
                          toast({
                            title: "Status Updated",
                            description: `Checked ${data?.checked || 0} items`
                          });
                        }
                      } catch (error: any) {
                        console.error('Manual status check error:', error);
                        toast({
                          title: "Error",
                          description: "Something went wrong. Please try again.",
                          variant: "destructive"
                        });
                      }
                    }} className="h-8">
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Refresh Status
                        </Button>
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
                          <span className="text-2xl font-bold">
                            {batchItems.filter(item => item.status === 'completed').length}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">Completed</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-center gap-2 text-blue-500">
                          <Clock className="h-5 w-5" />
                          <span className="text-2xl font-bold">
                            {batchItems.filter(item => item.status === 'pending' || item.status === 'processing').length}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">Pending</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-center gap-2 text-red-500">
                          <XCircle className="h-5 w-5" />
                          <span className="text-2xl font-bold">
                            {batchItems.filter(item => item.status === 'failed').length}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">Failed</p>
                      </div>
                    </div>

                    {batchStatus.status === 'completed' && <div className="flex gap-2 flex-wrap">
                        <Button onClick={async () => {
                    const completedItems = batchItems.filter(item => item.status === 'completed' && item.result_url);
                    try {
                      const zip = new JSZip();
                      toast({
                        title: "Preparing Download",
                        description: `Packaging ${completedItems.length} images...`
                      });

                      // Fetch all images and add to zip
                      for (let i = 0; i < completedItems.length; i++) {
                        const item = completedItems[i];
                        const response = await fetch(item.result_url!);
                        const blob = await response.blob();
                        zip.file(`mockup-${item.order_index + 1}.png`, blob);
                      }

                      // Generate zip file
                      const zipBlob = await zip.generateAsync({
                        type: "blob"
                      });

                      // Download zip
                      const link = document.createElement("a");
                      link.href = URL.createObjectURL(zipBlob);
                      link.download = `mockups-${Date.now()}.zip`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      URL.revokeObjectURL(link.href);
                      toast({
                        title: "Download Complete",
                        description: `Downloaded ${completedItems.length} images as zip`
                      });
                    } catch (error) {
                      console.error('Zip download failed:', error);
                      toast({
                        title: "Download Failed",
                        description: "Failed to create zip file",
                        variant: "destructive"
                      });
                    }
                  }} variant="outline" className="flex-1">
                          <Download className="w-4 h-4 mr-2" />
                          Download All (ZIP)
                        </Button>
                        <Button onClick={() => {
                          setRegenerateBackground(selectedBackground);
                          setRegenerateOutputSize(outputSize);
                          setRegenerateResolution(outputSize.width <= 1400 && outputSize.height <= 1400 ? '1K' : outputSize.width <= 2800 && outputSize.height <= 2800 ? '2K' : '4K');
                          setShowRegenerateModal(true);
                        }} variant="outline" className="flex-1">
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Regenerate Batch
                        </Button>
                        <Button onClick={handleReset} className="flex-1">
                          Start New Batch
                        </Button>
                      </div>}
                  </div>
                </div>

                <div className="bg-card rounded-xl border border-border p-6">
                  <h3 className="text-lg font-semibold mb-4">
                    All Items ({batchItems.length})
                  </h3>
                   <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[600px] overflow-y-auto">
                    {batchItems.map(item => {
                      // Extract angle from product_url (format: outfit-X-ANGLE)
                      const urlParts = item.product_url?.split('-') || [];
                      const angleFromUrl = urlParts[urlParts.length - 1]?.toLowerCase() || '';
                      const angleLabel = ['front', 'back', 'left', 'right'].includes(angleFromUrl) 
                        ? angleFromUrl.charAt(0).toUpperCase() + angleFromUrl.slice(1)
                        : '';
                      
                      return (
                        <div key={item.id} className="relative group">
                          <div className="w-full min-h-[200px] rounded-lg border-2 border-border/50 overflow-hidden bg-muted">
                            {item.status === 'completed' && item.result_url ? <>
                                <img src={item.result_url} alt={`Result ${item.order_index + 1}`} className="w-full h-auto object-contain cursor-pointer" onClick={() => setPreviewImage(item.result_url)} />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                                  <div className="flex gap-2">
                                    <Button size="sm" variant="secondary" onClick={() => setPreviewImage(item.result_url)}>
                                      View
                                    </Button>
                                    <Button size="sm" variant="secondary" onClick={async (e) => {
                                      e.stopPropagation();
                                      const url = item.result_url;
                                      try {
                                        const response = await fetch(url, { mode: 'cors' });
                                        const blob = await response.blob();
                                        const blobUrl = URL.createObjectURL(blob);
                                        const link = document.createElement('a');
                                        link.href = blobUrl;
                                        link.download = `floowy-mockup-${item.order_index + 1}.png`;
                                        link.style.display = 'none';
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                        setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
                                      } catch {
                                        // Fallback: canvas approach
                                        const img = new Image();
                                        img.crossOrigin = 'anonymous';
                                        img.onload = () => {
                                          const canvas = document.createElement('canvas');
                                          canvas.width = img.naturalWidth;
                                          canvas.height = img.naturalHeight;
                                          const ctx = canvas.getContext('2d');
                                          ctx?.drawImage(img, 0, 0);
                                          canvas.toBlob((blob) => {
                                            if (blob) {
                                              const blobUrl = URL.createObjectURL(blob);
                                              const link = document.createElement('a');
                                              link.href = blobUrl;
                                              link.download = `floowy-mockup-${item.order_index + 1}.png`;
                                              link.style.display = 'none';
                                              document.body.appendChild(link);
                                              link.click();
                                              document.body.removeChild(link);
                                              setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
                                            }
                                          }, 'image/png');
                                        };
                                        img.src = url;
                                      }
                                    }}>
                                      <Download className="w-4 h-4" />
                                    </Button>
                                  </div>
                                  <Button size="sm" variant="outline" className="w-full" onClick={() => handleRegenerateItem(item.id, item.order_index)}>
                                    <RefreshCw className="w-3 h-3 mr-1" />
                                    Regenerate
                                  </Button>
                                </div>
                              </> : item.status === 'processing' ? <div className="w-full min-h-[200px] flex flex-col items-center justify-center gap-2">
                                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                <p className="text-xs text-muted-foreground">Processing...</p>
                              </div> : item.status === 'failed' ? <div className="relative w-full min-h-[200px]">
                                <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-destructive/10">
                                  <XCircle className="w-8 h-8 text-destructive" />
                                  <p className="text-xs text-destructive text-center px-2">
                                    {item.error_message || 'Failed'}
                                  </p>
                                </div>
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Button size="sm" variant="secondary" onClick={() => handleRegenerateItem(item.id, item.order_index)}>
                                    <RefreshCw className="w-3 h-3 mr-1" />
                                    Retry
                                  </Button>
                                </div>
                              </div> : <div className="w-full min-h-[200px] flex flex-col items-center justify-center gap-2">
                                <Clock className="w-8 h-8 text-muted-foreground" />
                                <p className="text-xs text-muted-foreground">Pending...</p>
                              </div>}
                          </div>
                          <div className="absolute top-2 left-2 bg-background/90 px-2 py-1 rounded text-xs font-semibold">
                            #{item.order_index + 1}
                          </div>
                          {angleLabel && (
                            <div className="absolute bottom-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-semibold">
                              {angleLabel}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div> : <div className="space-y-6">
                {/* Outfit Configuration Section */}
                <div className="bg-card rounded-xl border border-border p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold">Outfit {currentProductIndex + 1} of {products.length}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Select angles and outfit pieces for each outfit (up to 10 outfits total)
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {products.length < 10 && <Button onClick={() => {
                    setProducts([...products, {
                      selectedPieces: [],
                      selectedAngles: ['front'],
                      outfitViews: {
                        tops: {
                          front: null,
                          back: null,
                          left: null,
                          right: null
                        },
                        trousers: {
                          front: null,
                          back: null,
                          left: null,
                          right: null
                        },
                        jacket: {
                          front: null,
                          back: null,
                          left: null,
                          right: null
                        },
                        hat: {
                          front: null,
                          back: null,
                          left: null,
                          right: null
                        },
                        shoes: {
                          front: null,
                          back: null,
                          left: null,
                          right: null
                        },
                        jumpsuit: {
                          front: null,
                          back: null,
                          left: null,
                          right: null
                        },
                        dress: {
                          front: null,
                          back: null,
                          left: null,
                          right: null
                        }
                      },
                      accessories: []
                    }]);
                    setCurrentProductIndex(products.length);
                  }} variant="outline" size="sm">
                          + Add Outfit
                        </Button>}
                      {products.length > 1 && <Button variant="ghost" size="sm" onClick={() => {
                    setProducts(products.filter((_, idx) => idx !== currentProductIndex));
                    setCurrentProductIndex(Math.max(0, currentProductIndex - 1));
                  }}>
                          <X className="w-4 h-4 mr-1" />
                          Remove
                        </Button>}
                    </div>
                  </div>

                   {/* Angle Selection for this Outfit */}
                   <div className="mb-6" data-walkthrough-target="fsp-angles">
                    <h4 className="text-md font-semibold mb-2">Select Angles for This Outfit *</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Choose which angles to generate ({products[currentProductIndex].selectedAngles.length} selected)
                    </p>
                    <div className="grid grid-cols-4 gap-3">
                      {(['front', 'back', 'left', 'right'] as const).map(angle => <button key={angle} onClick={() => handleAngleToggle(currentProductIndex, angle)} className={`relative px-4 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 border-2 capitalize ${products[currentProductIndex].selectedAngles.includes(angle) ? 'bg-primary/20 text-primary border-primary shadow-lg' : 'bg-card text-foreground border-border hover:border-primary/50 hover:bg-accent'}`}>
                          {products[currentProductIndex].selectedAngles.includes(angle) && <Check className="w-4 h-4" />}
                          {angle}
                        </button>)}
                    </div>
                  </div>

                  {/* Outfit Piece Selection */}
                  <div className="mb-6" data-walkthrough-target="tool-upload">
                    <h4 className="text-md font-semibold mb-4">Select Outfit Type *</h4>
                    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        <strong>Note:</strong> Only views you upload for outfit pieces will be generated. Choose either separate pieces (layered look) or a full outfit (one-piece garment).
                      </p>
                    </div>
                    
                    {/* Outfit Pieces Selection with Tabs */}
                    <Tabs defaultValue="full" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="full">Full Outfits</TabsTrigger>
                        <TabsTrigger value="separate">Separate Pieces</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="full" className="mt-6">
                        <div className="grid grid-cols-2 gap-4">
                          {[{
                        label: 'Jumpsuit',
                        value: 'jumpsuit'
                      }, {
                        label: 'Dress',
                        value: 'dress'
                      }].map(({
                        label,
                        value
                      }) => <button key={value} onClick={() => handleOutfitPieceToggle(currentProductIndex, value)} className={`relative px-6 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 border-2 ${products[currentProductIndex].selectedPieces.includes(value) ? 'bg-primary text-primary-foreground border-primary shadow-lg scale-105' : 'bg-card text-foreground border-border hover:border-primary/50 hover:bg-accent'}`}>
                              {products[currentProductIndex].selectedPieces.includes(value) && <div className="absolute -top-2 -right-2 bg-primary rounded-full p-1 border-2 border-green-700">
                                  <Check className="w-4 h-4 text-primary-foreground" />
                                </div>}
                              {label}
                            </button>)}
                        </div>
                      </TabsContent>

                      <TabsContent value="separate" className="mt-6">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                          {[{
                        label: 'Tops',
                        value: 'tops'
                      }, {
                        label: 'Jacket/Outerwear',
                        value: 'jacket'
                      }, {
                        label: 'Trousers',
                        value: 'trousers'
                      }, {
                        label: 'Shoes',
                        value: 'shoes'
                      }, {
                        label: 'Hat',
                        value: 'hat'
                      }].map(({
                        label,
                        value
                      }) => <button key={value} onClick={() => handleOutfitPieceToggle(currentProductIndex, value)} className={`relative px-6 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 border-2 ${products[currentProductIndex].selectedPieces.includes(value) ? 'bg-primary text-primary-foreground border-primary shadow-lg scale-105' : 'bg-card text-foreground border-border hover:border-primary/50 hover:bg-accent'}`}>
                              {products[currentProductIndex].selectedPieces.includes(value) && <div className="absolute -top-2 -right-2 bg-primary rounded-full p-1 border-2 border-green-700">
                                  <Check className="w-4 h-4 text-primary-foreground" />
                                </div>}
                              {label}
                            </button>)}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>

                  {/* Upload views for each selected piece */}
                  {products[currentProductIndex].selectedPieces.length > 0 && <div className="space-y-6">
                      <h4 className="text-md font-semibold">Upload Views for Selected Pieces *</h4>
                      {products[currentProductIndex].selectedPieces.map(piece => <div key={piece} className="pb-6 border-b border-border last:border-b-0">
                          <h5 className="text-sm font-semibold mb-4">{getPieceDisplayName(piece)} - Upload all views for better output</h5>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {(['front', 'back', 'left', 'right'] as const).map(view => <div key={view} className="space-y-2">
                                <label className="text-xs font-medium capitalize">{view}</label>
                                <DragDropZone onFileDrop={(files) => handleOutfitViewUpload(currentProductIndex, piece, view, files[0] || null)} accept="image/*" className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                                  <input type="file" accept="image/*" onChange={e => handleOutfitViewUpload(currentProductIndex, piece, view, e.target.files?.[0] || null)} className="hidden" id={`product-${currentProductIndex}-${piece}-${view}`} />
                                  <label htmlFor={`product-${currentProductIndex}-${piece}-${view}`} className="cursor-pointer block">
                                    {products[currentProductIndex].outfitViews[piece]?.[view] ? <div className="space-y-2">
                                        <img src={URL.createObjectURL(products[currentProductIndex].outfitViews[piece][view]!)} alt={`${piece} ${view}`} className="w-full h-20 object-contain rounded" />
                                        <Button size="sm" variant="ghost" onClick={e => {
                              e.preventDefault();
                              handleOutfitViewUpload(currentProductIndex, piece, view, null);
                            }}>
                                          <X className="w-4 h-4 mr-1" />
                                          Remove
                                        </Button>
                                      </div> : <>
                                        <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                                        <p className="text-xs font-medium">Upload</p>
                                      </>}
                                  </label>
                                </DragDropZone>
                              </div>)}
                          </div>
                        </div>)}
                      
                      {/* Accessories Upload */}
                      <div className="pt-4 border-t border-border">
                        <h5 className="text-sm font-semibold mb-2">Accessories (Optional)</h5>
                        <p className="text-xs text-muted-foreground mb-4">
                          Upload images of accessories (jewelry, bags, etc.) to be incorporated realistically
                        </p>
                        <div className="space-y-4">
                          <div className="flex flex-wrap gap-2">
                            {products[currentProductIndex].accessories.map((file, idx) => <div key={idx} className="relative group">
                                <img src={URL.createObjectURL(file)} alt={`Accessory ${idx + 1}`} className="w-20 h-20 object-cover rounded border-2 border-border" />
                                <Button size="sm" variant="ghost" className="absolute -top-2 -right-2 h-6 w-6 p-0 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-full" onClick={() => {
                          setProducts(products.map((p, i) => i === currentProductIndex ? {
                            ...p,
                            accessories: p.accessories.filter((_, aIdx) => aIdx !== idx)
                          } : p));
                        }}>
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>)}
                          </div>
                          <DragDropZone onFileDrop={(files) => { setProducts(products.map((p, i) => i === currentProductIndex ? { ...p, accessories: [...p.accessories, ...files] } : p)); }} accept="image/*" multiple className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                            <input type="file" accept="image/*" multiple onChange={e => {
                        const files = Array.from(e.target.files || []);
                        setProducts(products.map((p, i) => i === currentProductIndex ? {
                          ...p,
                          accessories: [...p.accessories, ...files]
                        } : p));
                      }} className="hidden" id={`accessories-${currentProductIndex}`} />
                            <label htmlFor={`accessories-${currentProductIndex}`} className="cursor-pointer block">
                              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                              <p className="text-sm font-medium">Drop or Upload Accessories</p>
                              <p className="text-xs text-muted-foreground">Select multiple files</p>
                            </label>
                          </DragDropZone>
                        </div>
                      </div>
                    </div>}

                  {/* Navigation buttons */}
                  <div className="flex gap-2 mt-6 pt-6 border-t border-border">
                    <Button variant="outline" onClick={() => setCurrentProductIndex(Math.max(0, currentProductIndex - 1))} disabled={currentProductIndex === 0} className="flex-1">
                      Previous Outfit
                    </Button>
                    <Button variant="outline" onClick={() => setCurrentProductIndex(Math.min(products.length - 1, currentProductIndex + 1))} disabled={currentProductIndex === products.length - 1} className="flex-1">
                      Next Outfit
                    </Button>
                  </div>
                </div>

                {/* Upload Model Views */}
                <div className="bg-card rounded-xl border border-border p-6" data-walkthrough-target="tool-model">
                  <h3 className="text-lg font-semibold mb-4">Upload Model *</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {(() => {
                      // Check if any product has all 4 angles selected
                      const hasAllAngles = products.some(p => p.selectedAngles.length === 4);
                      if (hasAllAngles) {
                        return "Upload model images for each angle. Each uploaded model will be used as reference for that specific angle to ensure consistent facial and body features.";
                      }
                      const requiredViews = getRequiredViews();
                      if (requiredViews.length === 0) {
                        return "Upload model views after selecting outfit pieces above.";
                      }
                      return `Upload model for: ${requiredViews.join(', ')} views (based on outfit uploads). Each angle uses its specific model reference for best consistency.`;
                    })()}
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {getAvailableViewsForOutfit(currentProductIndex).map(view => {
                      const requiredViews = getRequiredViews();
                      // Enable all uploads if any product has all 4 angles selected
                      const hasAllAngles = products.some(p => p.selectedAngles.length === 4);
                      const isEnabled = hasAllAngles || requiredViews.includes(view) || requiredViews.length === 0;
                      return (
                        <div key={view} className="space-y-2">
                          <label className="text-sm font-medium capitalize">
                            {view} {view === 'front' && '(Primary)'}
                          </label>
                          <DragDropZone onFileDrop={(files) => handleModelViewUpload(view, files[0] || null)} accept="image/*" disabled={!isEnabled} className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors min-h-[120px] flex items-center justify-center ${isEnabled ? 'border-border hover:border-primary/50' : 'border-border/30 opacity-50'}`}>
                            <input type="file" accept="image/*" onChange={e => {
                              const file = e.target.files?.[0] || null;
                              handleModelViewUpload(view, file);
                            }} className="hidden" id={`model-${view}`} disabled={!isEnabled} />
                            <label htmlFor={`model-${view}`} className={`block w-full ${!isEnabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                              {modelViews[view] ? (
                                <div className="space-y-2">
                                  <img src={URL.createObjectURL(modelViews[view]!)} alt={`Model ${view}`} className="w-full h-20 object-contain rounded" />
                                  <Button size="sm" variant="ghost" onClick={e => {
                                    e.preventDefault();
                                    handleModelViewUpload(view, null);
                                  }}>
                                    <X className="w-4 h-4 mr-1" />
                                    Remove
                                  </Button>
                                </div>
                              ) : (
                                <>
                                  <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                                  <p className="text-xs font-medium">Drop or upload {view}</p>
                                </>
                              )}
                            </label>
                          </DragDropZone>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Pose Presets */}
                <div className="bg-card rounded-xl border border-border p-6" data-walkthrough-target="tool-prompt">
                  <h3 className="text-lg font-semibold mb-4">Select Pose</h3>
                  <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-9 gap-3">
                    {[
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
                    ].map(pose => (
                      <button
                        key={pose.id}
                        onClick={() => setSelectedPose(pose.id)}
                        className={`relative rounded-lg border-2 overflow-hidden transition-all ${
                          selectedPose === pose.id
                            ? 'border-primary ring-2 ring-primary ring-offset-2'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <img 
                          src={pose.image} 
                          alt={pose.name} 
                          className="w-full aspect-[2/3] object-cover"
                        />
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
                  <div className="mt-6 max-w-xs">
                    <CameraStylePresetSelect value={cameraStyle} onChange={setCameraStyle} />
                  </div>
                </div>

                {/* Background Settings */}
                <div className="bg-card rounded-xl border border-border p-6" data-walkthrough-target="tool-style">
                  <h3 className="text-lg font-semibold mb-4">Background</h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column - Background Presets */}
                    <div className={backgroundReference ? 'opacity-50 pointer-events-none' : ''}>
                      <label className="text-sm font-semibold mb-3 block">
                        Background Preset {backgroundReference && <span className="text-xs font-normal text-muted-foreground">(disabled)</span>}
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'white', label: 'White', color: '#FFFFFF' },
                          { id: 'beige', label: 'Beige', color: '#F5F5DC' },
                          { id: 'light-grey', label: 'Light Grey', color: '#D3D3D3' },
                          { id: 'grey', label: 'Grey', color: '#808080' },
                          { id: 'dark-grey', label: 'Dark Grey', color: '#404040' },
                          { id: 'black', label: 'Black', color: '#000000' },
                          { id: 'cream', label: 'Cream', color: '#FFFDD0' },
                          { id: 'navy', label: 'Navy', color: '#001F3F' },
                          { id: 'sage', label: 'Sage', color: '#9CAF88' }
                        ].map(bg => (
                          <button 
                            key={bg.id} 
                            onClick={() => {
                              setSelectedBackground(bg.id);
                              setCustomBackgroundPrompt('');
                            }} 
                            className={`relative p-3 rounded-lg border-2 text-center transition-all overflow-hidden ${
                              selectedBackground === bg.id && !customBackgroundPrompt 
                                ? 'border-primary ring-2 ring-primary ring-offset-2' 
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <div className="w-full h-12 rounded mb-2 border border-border/20" style={{ backgroundColor: bg.color }} />
                            <div className="text-xs font-semibold">{bg.label}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Right Column - Reference & Custom Prompt */}
                    <div className="space-y-4">
                      {/* Background Reference Upload */}
                      <div>
                        <label className="text-sm font-semibold mb-2 block">Background Reference (Optional)</label>
                        <p className="text-xs text-muted-foreground mb-2">Upload an image to use as background reference</p>
                        <DragDropZone onFileDrop={(files) => { setBackgroundReference(files[0] || null); if (files[0]) { setSelectedBackground(''); setCustomBackgroundPrompt(''); } }} accept="image/*" className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors min-h-[100px] flex items-center justify-center">
                          <input type="file" accept="image/*" onChange={e => {
                            const file = e.target.files?.[0] || null;
                            setBackgroundReference(file);
                            if (file) {
                              setSelectedBackground('');
                              setCustomBackgroundPrompt('');
                            }
                          }} className="hidden" id="background-reference" />
                          <label htmlFor="background-reference" className="cursor-pointer block w-full">
                            {backgroundReference ? (
                              <div className="space-y-2">
                                <img src={URL.createObjectURL(backgroundReference)} alt="Background reference" className="w-full h-16 object-contain rounded" />
                                <Button size="sm" variant="ghost" onClick={e => {
                                  e.preventDefault();
                                  setBackgroundReference(null);
                                }}>
                                  <X className="w-4 h-4 mr-1" />
                                  Remove
                                </Button>
                              </div>
                            ) : (
                              <>
                                <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                                <p className="text-xs font-medium">Drop or Upload Reference</p>
                              </>
                            )}
                          </label>
                        </DragDropZone>
                        {backgroundReference && (
                          <p className="text-xs text-primary mt-2">Background reference active - presets are disabled</p>
                        )}
                      </div>

                      {/* Custom Background Prompt */}
                      <div className={backgroundReference ? 'opacity-50 pointer-events-none' : ''}>
                        <label className="text-sm font-semibold mb-2 block">
                          Custom Background (Optional) {backgroundReference && <span className="text-xs font-normal text-muted-foreground">(disabled)</span>}
                        </label>
                        <textarea 
                          value={customBackgroundPrompt} 
                          onChange={e => {
                            setCustomBackgroundPrompt(e.target.value);
                            if (e.target.value) {
                              setSelectedBackground('');
                            } else {
                              setSelectedBackground('light-grey');
                            }
                          }} 
                          placeholder="Describe your custom background, e.g., 'Sunset beach' or 'Modern studio'" 
                        className={`w-full h-[160px] p-3 rounded-lg border-2 bg-background text-sm focus:outline-none resize-none ${customBackgroundPrompt.length > 250 ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-primary'}`}
                          disabled={!!backgroundReference}
                        />
                        <div className={`text-xs mt-1 text-right ${customBackgroundPrompt.length > 250 ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                          {customBackgroundPrompt.length}/250 characters
                        </div>
                        {customBackgroundPrompt && !backgroundReference && customBackgroundPrompt.length <= 40 && (
                          <p className="text-xs text-muted-foreground mt-1">Custom prompt active - presets are disabled</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Output Size - Following Fashion Tool Layout */}
                <div className="bg-card rounded-xl border border-border p-6" data-walkthrough-target="tool-output">
                  <h3 className="text-lg font-semibold mb-4">Output Size</h3>
                  
                  <div className="space-y-6">
                    {/* Aspect Ratio Selection */}
                    <div>
                      <label className="mb-3 block text-sm font-semibold">Aspect Ratio</label>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 max-h-[320px] overflow-y-auto pr-2">
                        {[{
                      label: "21:9",
                      width: 1584,
                      height: 672
                    }, {
                      label: "16:9",
                      width: 1376,
                      height: 768
                    }, {
                      label: "3:2",
                      width: 1264,
                      height: 848
                    }, {
                      label: "4:3",
                      width: 1200,
                      height: 896
                    }, {
                      label: "5:4",
                      width: 1152,
                      height: 928
                    }, {
                      label: "1:1",
                      width: 1024,
                      height: 1024
                    }, {
                      label: "4:5",
                      width: 928,
                      height: 1152
                    }, {
                      label: "3:4",
                      width: 896,
                      height: 1200
                    }, {
                      label: "2:3",
                      width: 848,
                      height: 1264
                    }, {
                      label: "9:16",
                      width: 768,
                      height: 1376
                    }].map(ratio => {
                      const getCurrentMultiplier = () => {
                        const maxDim = Math.max(outputSize.width, outputSize.height);
                        if (maxDim <= 1400) return 1;else if (maxDim <= 2800) return 2;else return 4;
                      };
                      const multiplier = getCurrentMultiplier();
                      const isSelected = outputSize.width === ratio.width * multiplier && outputSize.height === ratio.height * multiplier;
                      return <div key={ratio.label} onClick={() => setOutputSize({
                        width: ratio.width * multiplier,
                        height: ratio.height * multiplier
                      })} className={`flex flex-col items-center justify-center rounded-md border-2 p-3 cursor-pointer transition-all hover:bg-accent hover:text-accent-foreground ${isSelected ? "border-primary bg-primary/10" : "border-muted bg-popover"}`}>
                              <span className="text-sm font-semibold">{ratio.label}</span>
                              <span className="text-xs text-muted-foreground mt-0.5">
                                {ratio.width * multiplier}×{ratio.height * multiplier}
                              </span>
                            </div>;
                    })}
                      </div>
                    </div>

                    {/* Resolution Selection */}
                    <div>
                      <label className="mb-3 block text-sm font-semibold">Resolution</label>
                      <p className="text-xs text-muted-foreground mb-3">1K = 2 credits/outfit · 2K = 3 credits/outfit · 4K = 4 credits/outfit</p>
                      <div className="grid grid-cols-3 gap-2">
                        {[{
                      label: "1K",
                      multiplier: 1,
                      maxDim: 1400
                    }, {
                      label: "2K",
                      multiplier: 2,
                      maxDim: 2800
                    }, {
                      label: "4K",
                      multiplier: 4,
                      maxDim: 5600
                    }].map(res => {
                      const maxDim = Math.max(outputSize.width, outputSize.height);
                      const isSelected = maxDim <= res.maxDim && (res.label === "1K" ? maxDim <= 1400 : res.label === "2K" ? maxDim > 1400 && maxDim <= 2800 : maxDim > 2800);
                      return <div key={res.label} onClick={() => {
                        // Find current aspect ratio
                        const baseRatios = [{
                          label: "21:9",
                          width: 1584,
                          height: 672
                        }, {
                          label: "16:9",
                          width: 1376,
                          height: 768
                        }, {
                          label: "3:2",
                          width: 1264,
                          height: 848
                        }, {
                          label: "4:3",
                          width: 1200,
                          height: 896
                        }, {
                          label: "5:4",
                          width: 1152,
                          height: 928
                        }, {
                          label: "1:1",
                          width: 1024,
                          height: 1024
                        }, {
                          label: "4:5",
                          width: 928,
                          height: 1152
                        }, {
                          label: "3:4",
                          width: 896,
                          height: 1200
                        }, {
                          label: "2:3",
                          width: 848,
                          height: 1264
                        }, {
                          label: "9:16",
                          width: 768,
                          height: 1376
                        }];
                        const currentRatio = baseRatios.find(r => {
                          const currentMult = Math.max(outputSize.width, outputSize.height) <= 1400 ? 1 : Math.max(outputSize.width, outputSize.height) <= 2800 ? 2 : 4;
                          return outputSize.width === r.width * currentMult && outputSize.height === r.height * currentMult;
                        }) || baseRatios[5]; // Default to 1:1

                        setOutputSize({
                          width: currentRatio.width * res.multiplier,
                          height: currentRatio.height * res.multiplier
                        });
                      }} className={`flex flex-col items-center justify-center rounded-md border-2 p-3 cursor-pointer transition-all hover:bg-accent hover:text-accent-foreground ${isSelected ? "border-primary bg-primary/10" : "border-muted bg-popover"}`}>
                              <span className="text-sm font-semibold">{res.label}</span>
                              <span className="text-xs text-muted-foreground mt-0.5">
                                {res.multiplier === 1 ? '2 credits' : res.multiplier === 2 ? '3 credits' : '4 credits'}
                              </span>
                            </div>;
                    })}
                      </div>
                    </div>
                  </div>
                </div>

                  <div className="bg-card rounded-xl border border-border p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">Total Cost</h3>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold">{calculateCreditCost()}</p>
                        <p className="text-sm text-muted-foreground">credits</p>
                      </div>
                    </div>

                    <Button data-walkthrough-target="fsp-generate" onClick={handleStartBatch} disabled={!hasAccess || isProcessing || products.filter(p => p.selectedPieces.length > 0).length === 0 || !(modelViews.front || modelViews.back || modelViews.left || modelViews.right) || (!isAdmin && !hasAdminToken && credits < calculateCreditCost())} size="lg" className="w-full">
                      <Loader2 className={`mr-2 h-5 w-5 ${isProcessing ? "animate-spin" : "hidden"}`} />
                      {isProcessing ? "Processing..." : (() => {
                        const totalViews = calculateTotalProductViews();
                        return totalViews > 0 ? `Generate ${totalViews} Views` : "Generate Views";
                      })()}
                    </Button>

                  {!hasAccess && <p className="text-sm text-muted-foreground text-center">
                      You don't have access to this tool. Please contact support.
                    </p>}
                  {products.filter(p => p.selectedPieces.length > 0).length === 0 && hasAccess && <p className="text-sm text-muted-foreground text-center">
                      Select outfit pieces for at least one product to continue
                    </p>}
                  {!(modelViews.front || modelViews.back || modelViews.left || modelViews.right) && hasAccess && <p className="text-sm text-muted-foreground text-center">
                      Upload at least one model view to continue
                    </p>}
                  {!isAdmin && !hasAdminToken && credits < calculateCreditCost() && hasAccess && <p className="text-sm text-destructive text-center">
                      Insufficient credits. You need {calculateCreditCost()} credits.
                    </p>}
                </div>
              </div>}

            {isProcessing && !currentBatchId && <GenerationProgressOverlay
                open={true}
                stage="uploading"
                progress={15}
                statusMessage="Uploading and preparing images..."
                title="Starting Batch Generation"
              />}
          </div>
        </main>
      </div>

      {/* Preview Image Modal */}
      <Dialog open={!!previewImage} onOpenChange={() => {
      setPreviewImage(null);
      setPreviewImageDimensions({
        width: 0,
        height: 0
      });
    }}>
        <DialogContent className="max-w-6xl w-full p-0 border-0 bg-transparent shadow-2xl overflow-hidden">
          <div className="relative w-full h-[90vh] rounded-2xl overflow-hidden bg-gradient-to-br from-black/95 via-black/98 to-black/95 backdrop-blur-sm">
            {/* Close Button - styled to be more prominent */}
            <button onClick={() => {
            setPreviewImage(null);
            setPreviewImageDimensions({
              width: 0,
              height: 0
            });
          }} className="absolute top-4 right-4 z-50 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center transition-all duration-200 hover:scale-110 group">
              <X className="h-5 w-5 text-white group-hover:rotate-90 transition-transform duration-200" />
            </button>
            
            {/* Download Button */}
            {previewImage && <button 
              onClick={async (e) => {
                e.stopPropagation();
                const downloadImage = async (url: string) => {
                  try {
                    // Try fetching with cors
                    const response = await fetch(url, { mode: 'cors' });
                    const blob = await response.blob();
                    const blobUrl = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = blobUrl;
                    link.download = `floowy-mockup-${Date.now()}.png`;
                    link.style.display = 'none';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
                    return true;
                  } catch {
                    return false;
                  }
                };
                
                // Try direct fetch first
                const success = await downloadImage(previewImage);
                if (!success) {
                  // Fallback: use canvas to force download
                  const img = new Image();
                  img.crossOrigin = 'anonymous';
                  img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.naturalWidth;
                    canvas.height = img.naturalHeight;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0);
                    canvas.toBlob((blob) => {
                      if (blob) {
                        const blobUrl = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = blobUrl;
                        link.download = `floowy-mockup-${Date.now()}.png`;
                        link.style.display = 'none';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
                      }
                    }, 'image/png');
                  };
                  img.onerror = () => {
                    // Final fallback: open in new tab
                    window.open(previewImage, '_blank');
                  };
                  img.src = previewImage;
                }
              }}
              className="absolute top-4 right-20 z-50 h-10 px-4 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 flex items-center gap-2 transition-all duration-200 hover:scale-105 group"
            >
                <Download className="h-4 w-4 text-white" />
                <span className="text-sm font-medium text-white">Download</span>
              </button>}

            {/* Image Container with reduced padding and animation */}
            <div className="w-full h-full flex items-center justify-center py-16 px-4">
              {previewImage && <div className="relative w-full h-full flex items-center justify-center animate-in fade-in zoom-in-95 duration-300">
                  <img src={previewImage} alt="Preview" className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg shadow-2xl" onLoad={e => {
                const img = e.currentTarget;
                setPreviewImageDimensions({
                  width: img.naturalWidth,
                  height: img.naturalHeight
                });
              }} />
                  {/* Subtle glow effect around image */}
                  <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/20 to-accent/20 blur-3xl opacity-50" />
                </div>}
            </div>

            {/* Image info overlay at bottom */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
              {previewImageDimensions.width > 0 && <p className="text-white text-sm font-medium mb-2">
                  {previewImageDimensions.width} × {previewImageDimensions.height} px
                </p>}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-sm font-medium">AI Generated Mockup</p>
                </div>
                <p className="text-white/60 text-xs">Press ESC to close</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Regenerate Batch Modal */}
      <Dialog open={showRegenerateModal} onOpenChange={setShowRegenerateModal}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Regenerate Batch with New Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <p className="text-sm text-muted-foreground">
              Adjust the settings below. All {batchItems.length} images will be regenerated with the new settings.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column - Background Options */}
              <div className="space-y-6">
                {/* Background Selection */}
                <div>
                  <label className="text-sm font-semibold mb-3 block">Background Color</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'white', label: 'White', color: '#ffffff' },
                      { id: 'beige', label: 'Beige', color: '#f5f5dc' },
                      { id: 'light-grey', label: 'Light Grey', color: '#d3d3d3' },
                      { id: 'grey', label: 'Grey', color: '#808080' },
                      { id: 'dark-grey', label: 'Dark Grey', color: '#404040' },
                      { id: 'black', label: 'Black', color: '#000000' },
                      { id: 'cream', label: 'Cream', color: '#fffdd0' },
                      { id: 'navy', label: 'Navy', color: '#000080' },
                      { id: 'sage', label: 'Sage', color: '#b2ac88' }
                    ].map(bg => (
                      <button
                        key={bg.id}
                        onClick={() => {
                          setRegenerateBackground(bg.id);
                          setRegenerateBackgroundReference(null);
                          setRegenerateCustomPrompt('');
                        }}
                        disabled={!!regenerateCustomPrompt.trim() || !!regenerateBackgroundReference}
                        className={`p-2 rounded-lg border-2 text-left transition-all flex items-center gap-2 ${
                          regenerateBackground === bg.id && !regenerateCustomPrompt.trim() && !regenerateBackgroundReference
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        } ${(!!regenerateCustomPrompt.trim() || !!regenerateBackgroundReference) ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div
                          className="w-4 h-4 rounded-full border border-border flex-shrink-0"
                          style={{ backgroundColor: bg.color }}
                        />
                        <span className="text-xs">{bg.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Background Reference Upload */}
                <div>
                  <label className="text-sm font-semibold mb-2 block">
                    Background Reference Image
                  </label>
                  <DragDropZone onFileDrop={(files) => { setRegenerateBackgroundReference(files[0] || null); if (files[0]) { setRegenerateBackground(''); setRegenerateCustomPrompt(''); } }} accept="image/*" className="relative block cursor-pointer">
                    <label className="relative block cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setRegenerateBackgroundReference(file);
                        if (file) {
                          setRegenerateBackground('');
                          setRegenerateCustomPrompt('');
                        }
                      }}
                    />
                    {regenerateBackgroundReference ? (
                      <div className="relative border-2 border-primary rounded-lg overflow-hidden">
                        <img
                          src={URL.createObjectURL(regenerateBackgroundReference)}
                          alt="Background reference"
                          className="w-full h-20 object-cover"
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          className="absolute top-1 right-1 h-6 w-6 p-0 bg-background/80"
                          onClick={(e) => {
                            e.preventDefault();
                            setRegenerateBackgroundReference(null);
                          }}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-border rounded-lg p-3 text-center hover:border-primary/50 transition-colors">
                        <Upload className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Drop or click to upload</span>
                      </div>
                    )}
                  </label>
                  </DragDropZone>
                </div>

                {/* Custom Background Prompt */}
                <div>
                  <label className="text-sm font-semibold mb-2 block">
                    Custom Background Prompt
                  </label>
                  <textarea
                    value={regenerateCustomPrompt}
                    onChange={(e) => {
                      setRegenerateCustomPrompt(e.target.value);
                      if (e.target.value.trim()) {
                        setRegenerateBackground('');
                        setRegenerateBackgroundReference(null);
                      }
                    }}
                    placeholder="e.g., Professional studio with soft lighting..."
                    className="w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                    disabled={!!regenerateBackgroundReference}
                  />
                </div>
              </div>

              {/* Right Column - Output Size Options */}
              <div className="space-y-6">
                {/* Aspect Ratio */}
                <div>
                  <label className="text-sm font-semibold mb-3 block">Aspect Ratio</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: '1:1', width: 1024, height: 1024, label: '1:1' },
                      { id: '4:5', width: 1024, height: 1280, label: '4:5' },
                      { id: '3:4', width: 1024, height: 1365, label: '3:4' },
                      { id: '2:3', width: 1024, height: 1536, label: '2:3' },
                      { id: '9:16', width: 1024, height: 1820, label: '9:16' },
                      { id: '5:4', width: 1280, height: 1024, label: '5:4' },
                      { id: '4:3', width: 1365, height: 1024, label: '4:3' },
                      { id: '3:2', width: 1536, height: 1024, label: '3:2' },
                      { id: '16:9', width: 1820, height: 1024, label: '16:9' }
                    ].map(ratio => (
                      <button
                        key={ratio.id}
                        onClick={() => setRegenerateOutputSize({ width: ratio.width, height: ratio.height })}
                        className={`p-2 rounded-lg border-2 text-center transition-all ${
                          regenerateOutputSize.width === ratio.width && regenerateOutputSize.height === ratio.height
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <span className="text-sm font-medium">{ratio.label}</span>
                        <div className="text-[10px] text-muted-foreground">{ratio.width}×{ratio.height}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Resolution */}
                <div>
                  <label className="text-sm font-semibold mb-3 block">Resolution</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: '1K', label: '1K', credits: 2, multiplier: 1 },
                      { id: '2K', label: '2K', credits: 3, multiplier: 2 },
                      { id: '4K', label: '4K', credits: 4, multiplier: 4 }
                    ].map(res => (
                      <button
                        key={res.id}
                        onClick={() => setRegenerateResolution(res.id as '1K' | '2K' | '4K')}
                        className={`p-3 rounded-lg border-2 text-center transition-all ${
                          regenerateResolution === res.id
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <span className="text-sm font-medium block">{res.label}</span>
                        <span className="text-xs text-muted-foreground">{res.credits} credits/image</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Credits Info */}
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      {(() => {
                        const creditsPerItem = regenerateResolution === '1K' ? 2 : regenerateResolution === '2K' ? 3 : 4;
                        return batchItems.length * creditsPerItem;
                      })()} credits
                    </span>{' '}
                    will be deducted for regenerating this batch.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    You have <span className="font-medium">{credits} credits</span> available.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowRegenerateModal(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleRegenerateBatch}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Regenerating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Regenerate Batch
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <CreditsPurchaseDialog open={showCreditsPurchase} onOpenChange={setShowCreditsPurchase} />
    </div>;
};
export default BulkMockupGenerator;