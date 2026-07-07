import { useEffect, useState } from "react";
import { LoadingState } from "@/components/LoadingState";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sparkles, Image, Clock, X, Coins, TrendingUp, Zap, Video, Wand2, Download, ChevronLeft, ChevronRight, Lock, LayoutGrid, Crown, Pencil, Film } from "lucide-react";
import ImageEditModal from "@/components/ImageEditModal";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { useToast } from "@/hooks/use-toast";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import CreditsPurchaseDialog from "@/components/CreditsPurchaseDialog";
import KnowledgeBasePromptModal from "@/components/KnowledgeBasePromptModal";
import { useKnowledgeBaseBonus } from "@/hooks/useKnowledgeBaseBonus";
import BackendLayout from "@/components/BackendLayout";
import CustomModelsPanel from "@/components/CustomModelsPanel";
import fashionCover from "@/assets/fashion-cover-new-5.png";
import atmosphericCover from "@/assets/Ambience-6.png";
import creatorStudioCover from "@/assets/creator-feature-video-new.mp4";
import fashionVideoDemo from "@/assets/fashion-video-demo.mp4";
import ideaStudioCover from "@/assets/idea-studio-hero-after.png";
import fashion2Cover from "@/assets/fashion-pro-cover.png";
import flatlayStudioCover from "@/assets/Flatlay-2.png";
import adsStudioPreview from "@/assets/ads-studio-preview.png";
import listingStudioPreview from "@/assets/listing-studio-preview.png";
import virtualVideoStudioCover from "@/assets/virtual-studio-cover.mp4";
import { canAccessFashionStudio } from "@/lib/fashion-video-config";

const Home = () => {
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [credits, setCredits] = useState<number>(0);
  const [creditsUsed, setCreditsUsed] = useState<number>(0);
  const [recentGenerations, setRecentGenerations] = useState<any[]>([]);
  const [totalGenerations, setTotalGenerations] = useState<number>(0);
  const [toolAccess, setToolAccess] = useState<Record<string, boolean>>({});
  const [userPlan, setUserPlan] = useState<string>('free');
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [creditsPurchaseOpen, setCreditsPurchaseOpen] = useState(false);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
  const [editingImageUrl, setEditingImageUrl] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingGenId, setEditingGenId] = useState<string | null>(null);
const { isPaid } = useSubscriptionStatus();
const previewUrl = (gen: any) =>
  isPaid ? gen.generated_image_url : (gen.watermarked_image_url ?? gen.generated_image_url);
  const itemsPerPage = 10;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get("tab");
  const { toast } = useToast();
  const { isAdmin } = useAdminCheck();
  const { hasClaimed, showPromptModal, setShowPromptModal, isLoading: bonusLoading } = useKnowledgeBaseBonus();

  // Show knowledge base prompt modal after onboarding check completes
  useEffect(() => {
    if (!isCheckingOnboarding && !bonusLoading && hasClaimed === false && user) {
      // Check if we've shown the modal in this session
      const hasShownThisSession = sessionStorage.getItem('kb_prompt_shown');
      if (!hasShownThisSession) {
        // Delay showing the modal slightly for better UX
        const timer = setTimeout(() => {
          setShowPromptModal(true);
          sessionStorage.setItem('kb_prompt_shown', 'true');
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [isCheckingOnboarding, bonusLoading, hasClaimed, user, setShowPromptModal]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      } else {
        const userId = session.user.id;
        // Defer async operations to prevent auth deadlock
        setTimeout(() => {
          checkOnboardingStatus(userId);
          fetchCredits(userId);
          fetchRecentGenerations(userId);
          fetchTotalGenerations(userId);
          fetchUserPlan(userId);
          fetchToolAccess(userId);
        }, 0);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user?.id) {
      fetchRecentGenerations(user.id);
    }
  }, [currentPage, user?.id]);

  // Realtime subscription for generations
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel('generations-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'generations',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT' && (payload.new as any).status === 'completed') {
            // Prepend new generation on page 1, or refetch current page
            if (currentPage === 1) {
              setRecentGenerations(prev => {
                const updated = [payload.new as any, ...prev];
                return updated.slice(0, itemsPerPage);
              });
              setTotalGenerations(prev => prev + 1);
            } else {
              fetchRecentGenerations(user.id);
            }
          } else if (payload.eventType === 'UPDATE' && (payload.new as any).status === 'completed') {
            setRecentGenerations(prev => {
              const exists = prev.find(g => g.id === (payload.new as any).id);
              if (exists) {
                return prev.map(g => g.id === (payload.new as any).id ? payload.new as any : g);
              }
              // New completed generation, prepend on page 1
              if (currentPage === 1) {
                return [payload.new as any, ...prev].slice(0, itemsPerPage);
              }
              return prev;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, currentPage]);

  const checkOnboardingStatus = async (userId: string) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", userId)
      .single();

    if (!profile?.onboarding_completed) {
      navigate("/onboarding");
    } else {
      setIsCheckingOnboarding(false);
    }
  };

  const fetchCredits = async (userId: string) => {
    const { data, error } = await supabase
      .from("credits")
      .select("balance, total_credits_used")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Error fetching credits:", error);
      return;
    }

    if (data) {
      setCredits(data.balance);
      setCreditsUsed((data as any).total_credits_used ?? 0);
    }
  };

  const fetchRecentGenerations = async (userId: string) => {
    // Get total count first
    const { count } = await supabase
      .from("generations")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "completed");

    if (count !== null) {
      setTotalPages(Math.ceil(count / itemsPerPage));
    }

    // Fetch paginated data
    const offset = (currentPage - 1) * itemsPerPage;
    const { data, error } = await supabase
      .from("generations")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .range(offset, offset + itemsPerPage - 1);

    if (error) {
      console.error("Error fetching recent generations:", error);
      return;
    }
    
    if (data) {
      console.log("Recent generations:", data);
      setRecentGenerations(data);
    }
  };

  const fetchTotalGenerations = async (userId: string) => {
    const { count, error } = await supabase
      .from("generations")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "completed");

    if (error) {
      console.error("Error fetching total generations:", error);
      return;
    }

    if (count !== null) setTotalGenerations(count);
  };

  const fetchUserPlan = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching user plan:", error);
      return;
    }

    if (data) {
      setUserPlan(data.plan);
    }
  };

  const fetchToolAccess = async (userId: string) => {
    const { data, error } = await supabase
      .from("user_tool_access")
      .select("tool_name, has_access")
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching tool access:", error);
      return;
    }

    if (data) {
      const accessMap = data.reduce((acc, item) => {
        acc[item.tool_name] = item.has_access;
        return acc;
      }, {} as Record<string, boolean>);
      setToolAccess(accessMap);
    }
  };

  // Check if user has access to a tool based on plan and explicit access
  const hasToolAccess = (toolName: string) => {
    // Admins have access to all tools
    if (isAdmin) {
      return true;
    }

    // Check explicit access first (admin-granted)
    if (toolAccess[toolName] !== undefined) {
      return toolAccess[toolName];
    }

    // Default plan-based access: main tools are ON by default
    if (toolName === 'fashion' || toolName === 'atmospheric' || toolName === 'creator-studio' || toolName === 'idea-studio' || toolName === 'ultimate-outfit-maker') {
      return true;
    }

    // Special tools require explicit admin grant (OFF by default)
    if (toolName === 'fashion-2.0' || toolName === 'ultimate-outfit-maker-v2' || toolName === 'flatlay-studio' || toolName === 'simple_pose_maker') {
      return false;
    }

    return false;
  };


  const handleImageClick = (generation: any) => {
    setSelectedImage(generation);
    setIsPreviewOpen(true);
  };

  const handleDownload = async (url: string, generationId: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      const ext = isVideoUrl(url) ? 'mp4' : 'jpg';
      link.download = `floowy-${generationId}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
      window.open(url, '_blank');
    }
  };

  // Check if URL is a video
  const isVideoUrl = (url: string) => {
    return url.includes('.mp4') || url.includes('.webm') || url.includes('.mov') || url.toLowerCase().endsWith('_video.png');
  };

  return (
    <BackendLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        {isCheckingOnboarding ? (
          <LoadingState context="data" message="Loading your dashboard..." />
        ) : activeTab === "custom-models" ? (
          <CustomModelsPanel />
        ) : (
        <>
        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            <span className="text-primary">Welcome</span> <span className="dark:text-white text-header-dark">back!</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Create stunning AI-generated content with your tools
          </p>
        </div>

        {/* Credits Overview */}
        <div className="mb-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border border-primary/40 bg-card bg-gradient-to-br from-primary/10 via-card to-card hover:shadow-glow transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription>Credits Remaining</CardDescription>
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Coins className="w-5 h-5 text-primary" />
                </div>
              </div>
              <CardTitle className="text-4xl font-bold mt-2">{credits}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border border-primary/40 bg-card bg-gradient-to-br from-accent/10 via-card to-card hover:shadow-glow transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription>Credits Used</CardDescription>
                <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-accent-foreground" />
                </div>
              </div>
              <CardTitle className="text-4xl font-bold mt-2">{creditsUsed}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border border-primary/40 bg-card bg-gradient-to-br from-primary-glow/10 via-card to-card hover:shadow-glow transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription>Total Generations</CardDescription>
                <div className="w-10 h-10 bg-primary-glow/10 rounded-xl flex items-center justify-center">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
              </div>
              <CardTitle className="text-4xl font-bold mt-2">{totalGenerations}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">
            <span className="text-foreground">Your AI</span> <span className="text-primary">Tools</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Ads Studio */}
            <Card 
              className="cursor-pointer hover:shadow-glow transition-all duration-300 border border-border bg-card hover:-translate-y-1 overflow-hidden group h-[300px] flex flex-col"
              onClick={() => navigate("/tool/ads-listing-studio")}
            >
              <div className="relative h-[200px] overflow-hidden">
                <img 
                  src={adsStudioPreview} 
                  alt="Ads Studio"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="flex-1 p-3 flex flex-col justify-center bg-tool-card-bottom">
                <p className="text-[10px] text-primary font-semibold uppercase mb-0.5">ADVERTISING</p>
                <h3 className="text-sm font-bold text-foreground mb-2">Ads Studio</h3>
                <Button size="sm" variant="outline" className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground bg-transparent">Start Creating</Button>
              </div>
            </Card>

            {/* Ambiance Studio - Always accessible */}
            <Card 
              className="cursor-pointer hover:shadow-glow transition-all duration-300 border border-border bg-card hover:-translate-y-1 overflow-hidden group h-[300px] flex flex-col"
              onClick={() => navigate("/tool/atmospheric")}
            >
              <div className="relative h-[200px] overflow-hidden">
                <img 
                  src={atmosphericCover} 
                  alt="Ambiance Studio"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="flex-1 p-3 flex flex-col justify-center bg-tool-card-bottom">
                <p className="text-[10px] text-primary font-semibold uppercase mb-0.5">PRODUCT PHOTOGRAPHY</p>
                <h3 className="text-sm font-bold text-foreground mb-2">Ambience Studio</h3>
                <Button size="sm" variant="outline" className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground bg-transparent">Start Creating</Button>
              </div>
            </Card>

            {/* Creator Studio */}
            <Card 
              className={`transition-all duration-300 border border-border bg-card overflow-hidden group h-[300px] flex flex-col ${
                hasToolAccess('creator-studio')
                  ? 'cursor-pointer hover:shadow-glow hover:-translate-y-1'
                  : 'opacity-75 relative'
              }`}
              onClick={() => hasToolAccess('creator-studio') && navigate("/tool/creator-studio")}
            >
              <div className="relative h-[200px] overflow-hidden">
                <video 
                  src={creatorStudioCover}
                  className="w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                />
                {!hasToolAccess('creator-studio') && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                    <div className="text-center text-white">
                      <Lock className="w-8 h-8 mx-auto mb-1" />
                      <p className="text-xs font-semibold">Upgrade to unlock</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex-1 p-3 flex flex-col justify-center bg-tool-card-bottom">
                <p className="text-[10px] text-primary font-semibold uppercase mb-0.5">UGC VIDEO</p>
                <h3 className="text-sm font-bold text-foreground mb-2">Creator Studio</h3>
                <Button size="sm" variant="outline" className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground bg-transparent" onClick={(e) => { if (!hasToolAccess('creator-studio')) { e.stopPropagation(); navigate("/payment"); } }}>
                  {hasToolAccess('creator-studio') ? 'Start Creating' : 'Upgrade Plan'}
                </Button>
              </div>
            </Card>

            {/* Fashion Video Studio — limited preview (allowlisted emails only) */}
            {canAccessFashionStudio(user?.email) && (
              <Card
                className="cursor-pointer hover:shadow-glow transition-all duration-300 border border-border bg-card hover:-translate-y-1 overflow-hidden group h-[300px] flex flex-col"
                onClick={() => navigate("/tool/fashion-video-studio")}
              >
                <div className="relative h-[200px] overflow-hidden">
                  <video
                    src={fashionVideoDemo}
                    className="w-full h-full object-cover"
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                  <div className="absolute right-2 top-2 rounded-full bg-primary/90 px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                    Preview
                  </div>
                </div>
                <div className="flex-1 p-3 flex flex-col justify-center bg-tool-card-bottom">
                  <p className="text-[10px] text-primary font-semibold uppercase mb-0.5">FASHION VIDEO</p>
                  <h3 className="text-sm font-bold text-foreground mb-2">Fashion Video Studio</h3>
                  <Button size="sm" variant="outline" className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground bg-transparent">Start Creating</Button>
                </div>
              </Card>
            )}

            {/* Fashion Studio - Always accessible */}
            <Card 
              className="cursor-pointer hover:shadow-glow transition-all duration-300 border border-border bg-card hover:-translate-y-1 overflow-hidden group h-[300px] flex flex-col"
              onClick={() => navigate("/tool/fashion")}
            >
              <div className="relative h-[200px] overflow-hidden">
                <img 
                  src={fashionCover} 
                  alt="Fashion Studio"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="flex-1 p-3 flex flex-col justify-center bg-tool-card-bottom">
                <p className="text-[10px] text-primary font-semibold uppercase mb-0.5">E-COMMERCE</p>
                <h3 className="text-sm font-bold text-foreground mb-2">Fashion Studio</h3>
                <Button size="sm" variant="outline" className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground bg-transparent">Start Creating</Button>
              </div>
            </Card>

            {/* Flatlay Studio */}
            <Card 
              className="cursor-pointer hover:shadow-glow transition-all duration-300 border border-border bg-card hover:-translate-y-1 overflow-hidden group h-[300px] flex flex-col"
              onClick={() => navigate("/tool/flatlay-studio")}
            >
              <div className="relative h-[200px] overflow-hidden">
                <img 
                  src={flatlayStudioCover} 
                  alt="Flatlay Studio"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="flex-1 p-3 flex flex-col justify-center bg-tool-card-bottom">
                <p className="text-[10px] text-primary font-semibold uppercase mb-0.5">SOCIAL MEDIA</p>
                <h3 className="text-sm font-bold text-foreground mb-2">Flatlay Studio</h3>
                <Button size="sm" variant="outline" className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground bg-transparent">Start Creating</Button>
              </div>
            </Card>

            {/* Idea Studio */}
            <Card 
              className={`transition-all duration-300 border border-border bg-card overflow-hidden group h-[300px] flex flex-col ${
                hasToolAccess('idea-studio')
                  ? 'cursor-pointer hover:shadow-glow hover:-translate-y-1'
                  : 'opacity-75 relative'
              }`}
              onClick={() => hasToolAccess('idea-studio') && navigate("/tool/idea-studio")}
            >
              <div className="relative h-[200px] overflow-hidden">
                <img 
                  src={ideaStudioCover} 
                  alt="Idea Studio"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {!hasToolAccess('idea-studio') && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                    <div className="text-center text-white">
                      <Lock className="w-8 h-8 mx-auto mb-1" />
                      <p className="text-xs font-semibold">Upgrade to unlock</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex-1 p-3 flex flex-col justify-center bg-tool-card-bottom">
                <p className="text-[10px] text-primary font-semibold uppercase mb-0.5">AI IDEATION</p>
                <h3 className="text-sm font-bold text-foreground mb-2">Idea Studio</h3>
                <Button size="sm" variant="outline" className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground bg-transparent" onClick={(e) => { if (!hasToolAccess('idea-studio')) { e.stopPropagation(); navigate("/payment"); } }}>
                  {hasToolAccess('idea-studio') ? 'Start Creating' : 'Upgrade Plan'}
                </Button>
              </div>
            </Card>

            {/* Listing Studio */}
            <Card 
              className="cursor-pointer hover:shadow-glow transition-all duration-300 border border-border bg-card hover:-translate-y-1 overflow-hidden group h-[300px] flex flex-col"
              onClick={() => navigate("/tool/listing-studio")}
            >
              <div className="relative h-[200px] overflow-hidden">
                <img 
                  src={listingStudioPreview} 
                  alt="Listing Studio"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="flex-1 p-3 flex flex-col justify-center bg-tool-card-bottom">
                <p className="text-[10px] text-primary font-semibold uppercase mb-0.5">MARKETPLACES</p>
                <h3 className="text-sm font-bold text-foreground mb-2">Listing Studio</h3>
                <Button size="sm" variant="outline" className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground bg-transparent">Start Creating</Button>
              </div>
            </Card>

            {/* Virtual Tour Studio */}
            <Card 
              className="cursor-pointer hover:shadow-glow transition-all duration-300 border border-border bg-card hover:-translate-y-1 overflow-hidden group h-[300px] flex flex-col"
              onClick={() => navigate("/tool/property-studio")}
            >
              <div className="relative h-[200px] overflow-hidden">
                <video
                  src={virtualVideoStudioCover}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              </div>
              <div className="flex-1 p-3 flex flex-col justify-center bg-tool-card-bottom">
                <p className="text-[10px] text-primary font-semibold uppercase mb-0.5">REAL ESTATE</p>
                <h3 className="text-sm font-bold text-foreground mb-2">Virtual Video Studio</h3>
                <Button size="sm" variant="outline" className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground bg-transparent">Start Creating</Button>
              </div>
            </Card>

            {/* Fashion Studio Pro - Special Access Only */}
            {hasToolAccess('ultimate-outfit-maker') && (
              <Card 
                className="cursor-pointer hover:shadow-glow transition-all duration-300 border border-border bg-card hover:-translate-y-1 overflow-hidden group h-[300px] flex flex-col"
                onClick={() => navigate("/tool/ultimate-outfit-maker")}
              >
                <div className="relative h-[200px] overflow-hidden">
                  <img 
                    src={fashion2Cover} 
                    alt="Fashion Studio Pro"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute top-2 right-2 bg-primary text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                    SPECIAL
                  </div>
                </div>
                <div className="flex-1 p-3 flex flex-col justify-center bg-tool-card-bottom">
                  <p className="text-[10px] text-primary font-semibold uppercase mb-0.5">BULK PROCESSING</p>
                  <h3 className="text-sm font-bold text-foreground mb-2">Fashion Studio Pro</h3>
                  <Button size="sm" variant="outline" className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground bg-transparent">Start Creating</Button>
                </div>
              </Card>
            )}

            {/* Ultimate Outfit Maker V2 - Special Access Only */}
            {hasToolAccess('ultimate-outfit-maker-v2') && (
              <Card 
                className="cursor-pointer hover:shadow-glow transition-all duration-300 border border-border bg-card hover:-translate-y-1 overflow-hidden group h-[300px] flex flex-col"
                onClick={() => navigate("/tool/ultimate-outfit-maker-v2")}
              >
                <div className="relative h-[200px] overflow-hidden">
                  <img 
                    src={fashion2Cover} 
                    alt="Ultimate Outfit Maker 2.0"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute top-2 right-2 bg-primary text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                    SPECIAL
                  </div>
                </div>
                <div className="flex-1 p-3 flex flex-col justify-center bg-tool-card-bottom">
                  <p className="text-[10px] text-primary font-semibold uppercase mb-0.5">HAIRSTYLES & POSES</p>
                  <h3 className="text-sm font-bold text-foreground mb-2">Outfit Maker 2.0</h3>
                  <Button size="sm" variant="outline" className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground bg-transparent">Start Creating</Button>
                </div>
              </Card>
            )}

            {/* Outfit Maker CK - Special Access Only */}
            {hasToolAccess('simple_pose_maker') && (
              <Card 
                className="cursor-pointer hover:shadow-glow transition-all duration-300 border border-border bg-card hover:-translate-y-1 overflow-hidden group h-[300px] flex flex-col"
                onClick={() => navigate("/tool/simple-pose-maker")}
              >
                <div className="relative h-[200px] overflow-hidden">
                  <img 
                    src={fashionCover} 
                    alt="Outfit Maker CK"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute top-2 right-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                    SPECIAL
                  </div>
                </div>
                <div className="flex-1 p-3 flex flex-col justify-center bg-tool-card-bottom">
                  <p className="text-[10px] text-orange-500 font-semibold uppercase mb-0.5">CLOTHING TRANSFER</p>
                  <h3 className="text-sm font-bold text-foreground mb-2">Outfit Maker CK</h3>
                  <Button size="sm" variant="outline" className="w-full border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white bg-transparent">Start Creating</Button>
                </div>
              </Card>
            )}

          </div>
        </div>

        </>
        )}
      </div>

      {/* Preview Modal */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generated Content</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="space-y-4">
              <div className="relative w-full max-h-[60vh] flex items-center justify-center">
                {isVideoUrl(selectedImage.generated_image_url) ? (
                  <video 
                    src={selectedImage.generated_image_url} 
                    controls
                    autoPlay
                    loop
                    className="max-w-full max-h-[60vh] h-auto object-contain rounded-lg"
                  />
                ) : (
                  <img 
                    src={previewUrl(selectedImage)} 
                    alt="Generated content preview"
                    className="max-w-full max-h-[60vh] h-auto object-contain rounded-lg"
                  />
                )}
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold">Created:</span> {new Date(selectedImage.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <CreditsPurchaseDialog
        open={creditsPurchaseOpen}
        onOpenChange={setCreditsPurchaseOpen}
      />
      
      <KnowledgeBasePromptModal 
        open={showPromptModal} 
        onOpenChange={setShowPromptModal} 
      />

      {editingImageUrl && (
        <ImageEditModal
          open={isEditModalOpen}
          onOpenChange={(open) => {
            setIsEditModalOpen(open);
            if (!open) {
              setEditingImageUrl(null);
              setEditingGenId(null);
            }
          }}
          imageUrl={editingImageUrl}
          onEditComplete={async (newUrl) => {
            // Get user session
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;

            // Find the original generation to copy its prompt
            const originalGen = recentGenerations.find(g => g.id === editingGenId);
            const prompt = originalGen?.prompt || "Edited image";
            const originalImageUrl = originalGen?.original_image_url || newUrl;

            // Insert as a NEW generation record
            const { data: newGen } = await supabase
              .from("generations")
              .insert({
                user_id: session.user.id,
                prompt: `${prompt} (edited)`,
                original_image_url: originalImageUrl,
                generated_image_url: newUrl,
                status: "completed",
              })
              .select()
              .single();

            // Prepend the new generation to the list
            if (newGen) {
              setRecentGenerations(prev => [newGen, ...prev]);
              setEditingGenId(newGen.id);
            }

            // Update the editing URL to stay in sync for further edits
            setEditingImageUrl(newUrl);
          }}
          isAdmin={isAdmin}
        />
      )}
    </BackendLayout>
  );
};

export default Home;
