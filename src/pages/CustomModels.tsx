import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Sparkles, ShoppingCart, Check, Crown, Loader2 } from "lucide-react";
import { LoadingState } from "@/components/LoadingState";
import { useToast } from "@/hooks/use-toast";
import PlanCreditsDisplay from "@/components/PlanCreditsDisplay";
import UserMenu from "@/components/UserMenu";
import CreditsPurchaseDialog from "@/components/CreditsPurchaseDialog";
import logoImage from "@/assets/floowy-logo.png";

interface CustomModel {
  id: string;
  name: string;
  description: string | null;
  image_url: string;
  price_cents: number;
  gender: string;
  is_active: boolean;
}

const CustomModels = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [user, setUser] = useState<any>(null);
  const [credits, setCredits] = useState(0);
  const [userPlan, setUserPlan] = useState<string>('free');
  const [models, setModels] = useState<CustomModel[]>([]);
  const [purchasedModelIds, setPurchasedModelIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [purchasingModelId, setPurchasingModelId] = useState<string | null>(null);
  const [showCreditsPurchase, setShowCreditsPurchase] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("female");

  // Handle success callback from Stripe
  useEffect(() => {
    const success = searchParams.get('success');
    const modelId = searchParams.get('model_id');
    
    if (success === 'true' && modelId) {
      confirmPurchase(modelId);
    }
    
    if (searchParams.get('canceled') === 'true') {
      toast({
        title: "Purchase Canceled",
        description: "Your purchase was canceled. No charges were made.",
        variant: "destructive",
      });
    }
  }, [searchParams]);

  const confirmPurchase = async (modelId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.functions.invoke('confirm-model-purchase', {
        body: { model_id: modelId },
      });

      if (error) throw error;

      toast({
        title: "Purchase Complete! 🎉",
        description: "You now own this exclusive model. It's available in all your tools!",
      });

      // Refresh purchased models
      fetchPurchasedModels(session.user.id);
      
      // Clear URL params
      window.history.replaceState({}, '', '/custom-models');
    } catch (error) {
      console.error('Error confirming purchase:', error);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      fetchCredits(session.user.id);
      fetchUserPlan(session.user.id);
      fetchModels();
      fetchPurchasedModels(session.user.id);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchCredits = async (userId: string) => {
    const { data } = await supabase
      .from("credits")
      .select("balance")
      .eq("user_id", userId)
      .single();
    if (data) setCredits(data.balance);
  };

  const fetchUserPlan = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", userId)
      .single();
    if (data) setUserPlan(data.plan || 'free');
  };

  const fetchModels = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("custom_models")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching models:", error);
    } else {
      setModels(data || []);
    }
    setIsLoading(false);
  };

  const fetchPurchasedModels = async (userId: string) => {
    const { data, error } = await supabase
      .from("user_purchased_models")
      .select("model_id")
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching purchased models:", error);
    } else {
      setPurchasedModelIds(new Set(data?.map(p => p.model_id) || []));
    }
  };

  const handlePurchase = async (modelId: string) => {
    if (purchasedModelIds.has(modelId)) {
      toast({
        title: "Already Owned",
        description: "You already own this model!",
      });
      return;
    }

    setPurchasingModelId(modelId);

    try {
      const { data, error } = await supabase.functions.invoke('purchase-model', {
        body: { model_id: modelId },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error("Purchase error:", error);
      toast({
        title: "Purchase Failed",
        description: error.message || "Failed to initiate purchase",
        variant: "destructive",
      });
    } finally {
      setPurchasingModelId(null);
    }
  };

  const availableModels = models.filter(m => !purchasedModelIds.has(m.id));
  const ownedModels = models.filter(m => purchasedModelIds.has(m.id));
  
  const femaleModels = availableModels.filter(m => m.gender === 'female');
  const maleModels = availableModels.filter(m => m.gender === 'male');

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-secondary/20 to-background">
      {/* Navigation */}
      <nav className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/home")}
              className="hover:bg-accent"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Link to="/home" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img src={logoImage} alt="Floowy.ai" className="h-8 w-auto" />
              <span className="font-bold text-xl text-foreground">Floowy.ai</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <PlanCreditsDisplay 
              plan={userPlan} 
              credits={credits} 
              onAddCredits={() => setShowCreditsPurchase(true)} 
            />
            <UserMenu onAddCredits={() => setShowCreditsPurchase(true)} />
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-6">
            <Crown className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-primary">Exclusive Collection</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-foreground">Premium</span> <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Custom Models
            </span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Unlock exclusive AI avatars for your creations. Subscribe to use them across all your tools.
          </p>
        </div>

        {/* Owned Models Section */}
        {ownedModels.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Check className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Your Collection</h2>
                <p className="text-sm text-muted-foreground">Models you own and can use in all tools</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {ownedModels.map((model) => (
                <Card 
                  key={model.id}
                  className="overflow-hidden border-primary/30 bg-gradient-to-br from-primary/5 to-background group"
                >
                  <div className="aspect-[3/4] relative overflow-hidden">
                    <img
                      src={model.image_url}
                      alt={model.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-primary text-white">
                        <Check className="h-3 w-3 mr-1" />
                        Owned
                      </Badge>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-foreground truncate">{model.name}</h3>
                    <p className="text-xs text-muted-foreground capitalize">{model.gender} Model</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Available Models */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-accent/50 rounded-xl flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Available Models</h2>
              <p className="text-sm text-muted-foreground">Browse and purchase exclusive avatars</p>
            </div>
          </div>

          {isLoading ? (
            <LoadingState context="data" message="Loading custom models..." />
          ) : availableModels.length === 0 ? (
            <Card className="p-12 text-center">
              <Crown className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-xl font-semibold mb-2">No Models Available</h3>
              <p className="text-muted-foreground">
                {ownedModels.length > 0 
                  ? "You own all available models! Check back later for new releases."
                  : "Check back soon for exclusive model releases."}
              </p>
            </Card>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="female" className="gap-2">
                  Female Models
                  {femaleModels.length > 0 && (
                    <Badge variant="secondary" className="ml-1">{femaleModels.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="male" className="gap-2">
                  Male Models
                  {maleModels.length > 0 && (
                    <Badge variant="secondary" className="ml-1">{maleModels.length}</Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="female">
                <ModelGrid 
                  models={femaleModels} 
                  onPurchase={handlePurchase}
                  purchasingModelId={purchasingModelId}
                />
              </TabsContent>

              <TabsContent value="male">
                <ModelGrid 
                  models={maleModels} 
                  onPurchase={handlePurchase}
                  purchasingModelId={purchasingModelId}
                />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>

      <CreditsPurchaseDialog
        open={showCreditsPurchase}
        onOpenChange={setShowCreditsPurchase}
      />
    </div>
  );
};

interface ModelGridProps {
  models: CustomModel[];
  onPurchase: (modelId: string) => void;
  purchasingModelId: string | null;
}

const ModelGrid = ({ models, onPurchase, purchasingModelId }: ModelGridProps) => {
  if (models.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No models available in this category yet.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {models.map((model) => (
        <Card 
          key={model.id}
          className="overflow-hidden border-border/50 hover:border-primary/50 hover:shadow-glow transition-all duration-300 group"
        >
          <div className="aspect-[3/4] relative overflow-hidden bg-muted">
            <img
              src={model.image_url}
              alt={model.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
              style={{ pointerEvents: 'none' }}
            />
            {/* Repeating diagonal watermark */}
            <div className="absolute inset-0 pointer-events-none select-none overflow-hidden" style={{ zIndex: 2 }}>
              <div
                className="absolute"
                style={{
                  top: '-50%',
                  left: '-50%',
                  width: '200%',
                  height: '200%',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(6, 1fr)',
                  gridTemplateRows: 'repeat(8, 1fr)',
                  gap: '4px',
                  transform: 'rotate(-30deg)',
                }}
              >
                {Array.from({ length: 48 }).map((_, i) => (
                  <img
                    key={i}
                    src={logoImage}
                    alt=""
                    className="w-8 h-auto opacity-30"
                    draggable={false}
                    style={{ filter: 'brightness(10)' }}
                  />
                ))}
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ zIndex: 3 }} />
            <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
              <Button 
                className="w-full gap-2"
                onClick={() => onPurchase(model.id)}
                disabled={purchasingModelId === model.id}
              >
                {purchasingModelId === model.id ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : model.id && purchasingModelId !== model.id ? (
                  <>
                    <ShoppingCart className="h-4 w-4" />
                    Subscribe
                  </>
                ) : null}
              </Button>
            </div>
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-foreground truncate mb-1">{model.name}</h3>
            {model.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{model.description}</p>
            )}
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-xs capitalize">{model.gender}</Badge>
              <span className="text-sm font-bold text-primary">19.95 euro/mo</span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default CustomModels;
