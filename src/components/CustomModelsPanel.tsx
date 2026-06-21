import { useState, useEffect } from "react";
import floowyLogo from "@/assets/floowy-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, Crown, Eye, Loader2, ShoppingCart, Sparkles, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from "react-router-dom";

interface CustomModel {
  id: string;
  name: string;
  description: string | null;
  image_url: string;
  price_cents: number;
  gender: string;
  is_active: boolean;
}

interface FreeModel {
  id: string;
  name: string;
  image_url: string;
  gender: string;
  ethnicity: string;
  age_category: string;
  body_type: string;
  use_case: string;
  is_active: boolean;
  sort_order: number;
}

const CustomModelsPanel = () => {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const [models, setModels] = useState<CustomModel[]>([]);
  const [defaultModels, setDefaultModels] = useState<FreeModel[]>([]);
  const [purchasedModelIds, setPurchasedModelIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [purchasingModelId, setPurchasingModelId] = useState<string | null>(null);
  const [freeGender, setFreeGender] = useState<"all" | "female" | "male">("all");
  const [paidGender, setPaidGender] = useState<"all" | "female" | "male">("all");
  const [freeEthnicity, setFreeEthnicity] = useState<string>("all");
  const [paidEthnicity, setPaidEthnicity] = useState<string>("all");
  const [freeAgeCategory, setFreeAgeCategory] = useState<string>("all");
  const [freeBodyType, setFreeBodyType] = useState<string>("all");
  const [freeUseCase, setFreeUseCase] = useState<string>("all");

  // Handle Stripe success callback
  useEffect(() => {
    const success = searchParams.get("success");
    const modelId = searchParams.get("model_id");
    if (success === "true" && modelId) {
      confirmPurchase(modelId);
    }
    if (searchParams.get("canceled") === "true") {
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

      const { error } = await supabase.functions.invoke("confirm-model-purchase", {
        body: { model_id: modelId },
      });
      if (error) throw error;

      toast({
        title: "Purchase Complete! 🎉",
        description: "You now own this exclusive model. It's available in all your tools!",
      });

      fetchPurchasedModels(session.user.id);
      window.history.replaceState({}, "", "/home?tab=custom-models");
    } catch (error) {
      console.error("Error confirming purchase:", error);
    }
  };

  const fetchFreeModels = async () => {
    const { data } = await supabase.from("default_models").select("*").eq("is_active", true).order("sort_order");
    if (data) setDefaultModels(data);
  };

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      fetchModels();
      fetchFreeModels();
      fetchPurchasedModels(session.user.id);
    };
    init();

    // Realtime subscriptions
    const freeChannel = supabase.channel('default-models-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'default_models' }, () => fetchFreeModels())
      .subscribe();
    const premiumChannel = supabase.channel('custom-models-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'custom_models' }, () => fetchModels())
      .subscribe();

    return () => { supabase.removeChannel(freeChannel); supabase.removeChannel(premiumChannel); };
  }, []);

  const fetchModels = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from("custom_models")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    if (data) setModels(data);
    setIsLoading(false);
  };

  const fetchPurchasedModels = async (userId: string) => {
    const { data } = await supabase
      .from("user_purchased_models")
      .select("model_id")
      .eq("user_id", userId);
    if (data) setPurchasedModelIds(new Set(data.map((p) => p.model_id)));
  };

  const handlePurchase = async (modelId: string) => {
    if (purchasedModelIds.has(modelId)) {
      toast({ title: "Already Owned", description: "You already own this model!" });
      return;
    }
    setPurchasingModelId(modelId);
    try {
      const { data, error } = await supabase.functions.invoke("purchase-model", {
        body: { model_id: modelId },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (error: any) {
      toast({
        title: "Purchase Failed",
        description: error.message || "Failed to initiate purchase",
        variant: "destructive",
      });
    } finally {
      setPurchasingModelId(null);
    }
  };

  const mapEthnicity = (eth: string): string => {
    const map: Record<string, string> = {
      "European": "European", "African": "African", "Middle Eastern": "Middle Eastern",
      "East Asian": "Asian", "South Asian": "Asian", "Latin American": "Latin American", "Mixed": "Mixed",
    };
    return map[eth] || eth;
  };

  const filteredFreeModels = defaultModels.filter((m) => {
    if (freeGender !== "all" && m.gender !== freeGender) return false;
    if (freeEthnicity !== "all" && mapEthnicity(m.ethnicity) !== freeEthnicity) return false;
    if (freeAgeCategory !== "all" && m.age_category !== freeAgeCategory) return false;
    if (freeBodyType !== "all" && m.body_type !== freeBodyType) return false;
    if (freeUseCase !== "all" && m.use_case !== freeUseCase) return false;
    return true;
  });

  const ownedModels = models.filter((m) => purchasedModelIds.has(m.id));
  const filteredPaidModels = paidGender === "all" ? models : models.filter((m) => m.gender === paidGender);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full mb-4">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-xs font-medium text-primary">Model Collection</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold mb-2">
          <span className="text-foreground">AI</span> <span className="text-primary">Model Avatars</span>
        </h2>
        <p className="text-muted-foreground">
          Browse free avatars or unlock exclusive premium models for your creations.
        </p>
      </div>

      {/* Main Tabs: Free vs Paid */}
      <Tabs defaultValue="free" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="free" className="gap-2">
            <Users className="h-3.5 w-3.5" />
            Free Models
            <Badge variant="secondary" className="ml-1 text-[10px]">{defaultModels.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="paid" className="gap-2">
            <Crown className="h-3.5 w-3.5" />
            Premium Models
            <Badge variant="secondary" className="ml-1 text-[10px]">{models.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="free">
          <ModelFilterBar gender={freeGender} onGenderChange={setFreeGender} ethnicity={freeEthnicity} onEthnicityChange={setFreeEthnicity} showEthnicity ageCategory={freeAgeCategory} onAgeCategoryChange={setFreeAgeCategory} bodyType={freeBodyType} onBodyTypeChange={setFreeBodyType} useCase={freeUseCase} onUseCaseChange={setFreeUseCase} showExtendedFilters />
          <FreeModelGrid models={filteredFreeModels} />
        </TabsContent>

        <TabsContent value="paid">
          {models.length === 0 ? (
            <Card className="p-10 text-center">
              <Crown className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold mb-1">No Premium Models Available</h3>
              <p className="text-sm text-muted-foreground">Check back soon for exclusive model releases.</p>
            </Card>
          ) : (
            <>
              <ModelFilterBar gender={paidGender} onGenderChange={setPaidGender} ethnicity={paidEthnicity} onEthnicityChange={setPaidEthnicity} />
              <ModelGrid models={filteredPaidModels} onPurchase={handlePurchase} purchasingModelId={purchasingModelId} purchasedModelIds={purchasedModelIds} />
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

const ethnicityOptions = ["all", "European", "African", "Asian", "Middle Eastern", "Latin American", "Mixed"];
const ageCategoryOptions = ["all", "1 – 2.5", "7 – 13", "13 – 18", "20 – 30", "30 – 50", "50 – 65", "65+"];
const bodyTypeOptions = ["all", "Slim", "Athletic", "Average", "Curvy", "Overweight", "Plus size"];
const useCaseOptions = ["all", "Fashion", "E-commerce", "Lifestyle"];

const ModelFilterBar = ({
  gender, onGenderChange, ethnicity, onEthnicityChange, showEthnicity = false,
  ageCategory, onAgeCategoryChange, bodyType, onBodyTypeChange, useCase, onUseCaseChange, showExtendedFilters = false,
}: {
  gender: "all" | "female" | "male";
  onGenderChange: (v: "all" | "female" | "male") => void;
  ethnicity: string;
  onEthnicityChange: (v: string) => void;
  showEthnicity?: boolean;
  ageCategory?: string;
  onAgeCategoryChange?: (v: string) => void;
  bodyType?: string;
  onBodyTypeChange?: (v: string) => void;
  useCase?: string;
  onUseCaseChange?: (v: string) => void;
  showExtendedFilters?: boolean;
}) => {
  const genderOptions: { label: string; value: "all" | "female" | "male" }[] = [
    { label: "All", value: "all" },
    { label: "Female", value: "female" },
    { label: "Male", value: "male" },
  ];
  return (
    <div className="flex justify-end items-center gap-2 mb-4 flex-wrap">
      {showEthnicity && (
        <Select value={ethnicity} onValueChange={onEthnicityChange}>
          <SelectTrigger className="h-7 text-[11px] w-[140px]">
            <SelectValue placeholder="Ethnicity" />
          </SelectTrigger>
          <SelectContent>
            {ethnicityOptions.map((opt) => (
              <SelectItem key={opt} value={opt} className="text-[11px]">
                {opt === "all" ? "All Ethnicities" : opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {showExtendedFilters && onAgeCategoryChange && (
        <Select value={ageCategory || "all"} onValueChange={onAgeCategoryChange}>
          <SelectTrigger className="h-7 text-[11px] w-[120px]">
            <SelectValue placeholder="Age" />
          </SelectTrigger>
          <SelectContent>
            {ageCategoryOptions.map((opt) => (
              <SelectItem key={opt} value={opt} className="text-[11px]">
                {opt === "all" ? "All Ages" : opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {showExtendedFilters && onBodyTypeChange && (
        <Select value={bodyType || "all"} onValueChange={onBodyTypeChange}>
          <SelectTrigger className="h-7 text-[11px] w-[130px]">
            <SelectValue placeholder="Body Type" />
          </SelectTrigger>
          <SelectContent>
            {bodyTypeOptions.map((opt) => (
              <SelectItem key={opt} value={opt} className="text-[11px]">
                {opt === "all" ? "All Body Types" : opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {showExtendedFilters && onUseCaseChange && (
        <Select value={useCase || "all"} onValueChange={onUseCaseChange}>
          <SelectTrigger className="h-7 text-[11px] w-[130px]">
            <SelectValue placeholder="Use Case" />
          </SelectTrigger>
          <SelectContent>
            {useCaseOptions.map((opt) => (
              <SelectItem key={opt} value={opt} className="text-[11px]">
                {opt === "all" ? "All Use Cases" : opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {genderOptions.map((opt) => (
        <Button
          key={opt.value}
          size="sm"
          variant={gender === opt.value ? "default" : "outline"}
          className="h-7 text-[11px] px-3"
          onClick={() => onGenderChange(opt.value)}
        >
          {opt.label}
        </Button>
      ))}
    </div>
  );
};

const ModelGrid = ({
  models,
  onPurchase,
  purchasingModelId,
  purchasedModelIds,
}: {
  models: CustomModel[];
  onPurchase: (id: string) => void;
  purchasingModelId: string | null;
  purchasedModelIds: Set<string>;
}) => {
  const [previewModel, setPreviewModel] = useState<CustomModel | null>(null);

  if (models.length === 0) {
    return <div className="text-center py-8 text-muted-foreground text-sm">No models available in this category yet.</div>;
  }

  return (
    <>
      <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
        {models.map((model) => {
          const isOwned = purchasedModelIds.has(model.id);
          return (
            <Card
              key={model.id}
              className={`overflow-hidden transition-all duration-300 group ${
                isOwned
                  ? "border-primary/30 bg-gradient-to-br from-primary/5 to-background"
                  : "border-border/50 hover:border-primary/50 hover:shadow-glow"
              }`}
            >
              <div className="aspect-[3/4] relative overflow-hidden bg-muted">
                <img
                  src={model.image_url}
                  alt={model.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  draggable={false}
                  onContextMenu={!isOwned ? (e) => e.preventDefault() : undefined}
                  style={!isOwned ? { pointerEvents: 'none' } : undefined}
                />
                {/* Repeating diagonal watermark for unpurchased models */}
                {!isOwned && (
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
                          src={floowyLogo}
                          alt=""
                          className="w-8 h-auto opacity-30"
                          draggable={false}
                          style={{ filter: 'brightness(10)' }}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {isOwned && (
                  <div className="absolute top-1.5 left-1.5">
                    <Badge className="bg-primary text-primary-foreground text-[9px] px-1.5 py-0.5">
                      <Check className="h-2.5 w-2.5 mr-0.5" /> Owned
                    </Badge>
                  </div>
                )}
                {/* Eye preview button */}
                <button
                  className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-all duration-300 cursor-pointer"
                  onClick={() => setPreviewModel(model)}
                  style={{ zIndex: 3 }}
                >
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-background/80 backdrop-blur-sm rounded-full p-2">
                    <Eye className="h-4 w-4 text-foreground" />
                  </div>
                </button>
                {!isOwned && (
                  <div className="absolute bottom-0 left-0 right-0 p-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-10">
                    <Button
                      size="sm"
                      className="w-full gap-1.5 text-[11px] h-7 bg-primary hover:bg-primary/90 text-primary-foreground"
                      onClick={(e) => { e.stopPropagation(); onPurchase(model.id); }}
                      disabled={purchasingModelId === model.id}
                    >
                      {purchasingModelId === model.id ? (
                        <><Loader2 className="h-3 w-3 animate-spin" /> Processing...</>
                      ) : (
                        <><ShoppingCart className="h-3 w-3" /> Subscribe</>
                      )}
                    </Button>
                  </div>
                )}
              </div>
              <div className="p-2 text-center">
                <h4 className="font-medium text-xs truncate">{model.name}</h4>
                {isOwned ? (
                  <span className="text-[10px] text-primary font-medium">Active</span>
                ) : (
                  <span className="text-[10px] font-semibold text-primary">€19.95/mo</span>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!previewModel} onOpenChange={(open) => !open && setPreviewModel(null)}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden border-border/50">
          {previewModel && (
            <div className="animate-scale-in">
              <div className="aspect-[3/4] relative overflow-hidden bg-muted">
                <img
                  src={previewModel.image_url}
                  alt={previewModel.name}
                  className="w-full h-full object-cover"
                  draggable={false}
                  onContextMenu={!purchasedModelIds.has(previewModel.id) ? (e) => e.preventDefault() : undefined}
                />
                {/* Repeating diagonal watermark on preview */}
                {!purchasedModelIds.has(previewModel.id) && (
                  <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
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
                        gap: '8px',
                        transform: 'rotate(-30deg)',
                      }}
                    >
                      {Array.from({ length: 48 }).map((_, i) => (
                        <img
                          key={i}
                          src={floowyLogo}
                          alt=""
                          className="w-10 h-auto opacity-30"
                          draggable={false}
                          style={{ filter: 'brightness(10)' }}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {purchasedModelIds.has(previewModel.id) && (
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-primary text-primary-foreground text-[10px]">
                      <Check className="h-3 w-3 mr-1" /> Owned
                    </Badge>
                  </div>
                )}
              </div>
              <div className="p-4 space-y-2">
                <h3 className="font-semibold text-lg">{previewModel.name}</h3>
                {previewModel.description && (
                  <p className="text-sm text-muted-foreground">{previewModel.description}</p>
                )}
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] capitalize">{previewModel.gender}</Badge>
                  {purchasedModelIds.has(previewModel.id) ? (
                    <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">Active Subscription</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px]">€19.95/mo</Badge>
                  )}
                </div>
                {!purchasedModelIds.has(previewModel.id) && (
                  <Button
                    size="sm"
                    className="w-full gap-2 mt-2 bg-primary hover:bg-primary/90 text-primary-foreground hover:border-primary/50 hover:shadow-glow"
                    onClick={() => { onPurchase(previewModel.id); setPreviewModel(null); }}
                    disabled={purchasingModelId === previewModel.id}
                  >
                    {purchasingModelId === previewModel.id ? (
                      <><Loader2 className="h-3 w-3 animate-spin" /> Processing...</>
                    ) : (
                      <><ShoppingCart className="h-3 w-3" /> Subscribe</>
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

const resolveModelUrl = (url: string) => {
  if (url.startsWith('http')) return url;
  // Relative paths like /models/model-3.png need the production origin
  const origin = window.location.origin;
  return `${origin}${url}`;
};

const FreeModelGrid = ({ models }: { models: FreeModel[] }) => {
  const [previewModel, setPreviewModel] = useState<FreeModel | null>(null);

  return (
    <>
      <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
        {models.map((model) => (
          <Card
            key={model.id}
            className="overflow-hidden border-border/50 hover:border-muted-foreground/30 transition-all duration-300 group relative"
          >
            <div className="aspect-[3/4] relative overflow-hidden bg-muted">
              <img
                src={resolveModelUrl(model.image_url)}
                alt={model.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <button
                className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-all duration-300 cursor-pointer"
                onClick={() => setPreviewModel(model)}
              >
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-background/80 backdrop-blur-sm rounded-full p-2">
                  <Eye className="h-4 w-4 text-foreground" />
                </div>
              </button>
            </div>
            <div className="p-2 text-center">
              <h4 className="font-medium text-xs truncate">{model.name}</h4>
              <p className="text-[10px] text-muted-foreground capitalize">{model.ethnicity}</p>
              <p className="text-[10px] text-muted-foreground">{model.age_category} · {model.body_type}</p>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={!!previewModel} onOpenChange={(open) => !open && setPreviewModel(null)}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden border-border/50">
          {previewModel && (
            <div className="animate-scale-in">
              <div className="aspect-[3/4] relative overflow-hidden bg-muted">
                <img
                  src={resolveModelUrl(previewModel.image_url)}
                  alt={previewModel.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4 space-y-1">
                <h3 className="font-semibold text-lg">{previewModel.name}</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-[10px] capitalize">{previewModel.gender}</Badge>
                  <Badge variant="secondary" className="text-[10px] capitalize">{previewModel.ethnicity}</Badge>
                  <Badge variant="secondary" className="text-[10px]">{previewModel.age_category}</Badge>
                  <Badge variant="secondary" className="text-[10px]">{previewModel.body_type}</Badge>
                  <Badge variant="secondary" className="text-[10px]">{previewModel.use_case}</Badge>
                  <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">Free</Badge>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CustomModelsPanel;
