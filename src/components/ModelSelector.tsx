import { useState, useEffect, useMemo, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Crown, Upload, X, Search, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { getDefaultModels, type ModelData, type Gender, type Ethnicity, type AgeCategory, type BodyType, type UseCase } from "./model-selector/modelData";
import ModelFilters from "./model-selector/ModelFilters";
import ModelCard from "./model-selector/ModelCard";
import ModelDetailDialog from "./model-selector/ModelDetailDialog";

interface ModelSelectorProps {
  selectedModel: string | null;
  onModelSelect: (modelUrl: string) => void;
  customModelFile?: File | null;
  onCustomModelFileChange?: (file: File | null) => void;
  compact?: boolean;
  columns?: number;
  maxHeight?: string;
}

interface PurchasedModel {
  id: string;
  name: string;
  image_url: string;
  gender: string;
}

const ModelSelector = ({ selectedModel, onModelSelect, customModelFile, onCustomModelFileChange, compact, columns, maxHeight = "320px" }: ModelSelectorProps) => {
  const baseUrl = window.location.origin;
  const cacheBuster = "v13";

  const [purchasedModels, setPurchasedModels] = useState<PurchasedModel[]>([]);
  const [genderFilter, setGenderFilter] = useState<Gender | "all">("all");
  const [ethnicityFilter, setEthnicityFilter] = useState<Ethnicity | "all">("all");
  const [ageCategoryFilter, setAgeCategoryFilter] = useState<AgeCategory | "all">("all");
  const [bodyTypeFilter, setBodyTypeFilter] = useState<BodyType | "all">("all");
  const [useCaseFilter, setUseCaseFilter] = useState<UseCase | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [detailModel, setDetailModel] = useState<(ModelData & { isPremium?: boolean }) | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file && onCustomModelFileChange) {
      onCustomModelFileChange(file);
      onModelSelect("");
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const clearCustomModel = () => {
    if (onCustomModelFileChange) onCustomModelFileChange(null);
  };

  const [dbModels, setDbModels] = useState<ModelData[]>([]);

  useEffect(() => {
    const fetchFreeModels = async () => {
      const { data } = await supabase.from("default_models").select("*").eq("is_active", true).order("sort_order");
      if (data) {
        setDbModels(data.map((m: any) => ({
          id: m.id,
          url: m.image_url.startsWith("http") ? m.image_url : `${baseUrl}${m.image_url}?${cacheBuster}`,
          preview: m.image_url.startsWith("http") ? m.image_url : `${m.image_url}?${cacheBuster}`,
          name: m.name,
          gender: m.gender as Gender,
          ageGroup: "adult" as const,
          ethnicity: m.ethnicity as Ethnicity,
          ageCategory: (m.age_category || "20 – 30") as AgeCategory,
          bodyType: (m.body_type || "Average") as BodyType,
          useCase: (m.use_case || "Fashion") as UseCase,
        })));
      }
    };

    const fetchPurchasedModels = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: purchases } = await supabase.from("user_purchased_models").select("model_id").eq("user_id", user.id);
      if (!purchases || purchases.length === 0) return;
      const modelIds = purchases.map(p => p.model_id);
      const { data: models } = await supabase.from("custom_models").select("id, name, image_url, gender").in("id", modelIds).eq("is_active", true);
      if (models) setPurchasedModels(models);
    };

    fetchFreeModels();
    fetchPurchasedModels();

    const channel = supabase.channel('model-selector-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'default_models' }, () => fetchFreeModels())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [baseUrl, cacheBuster]);

  const defaultModels = dbModels;

  const filteredModels = useMemo(() => {
    return defaultModels.filter((m) => {
      if (genderFilter !== "all" && m.gender !== genderFilter) return false;
      if (ethnicityFilter !== "all" && m.ethnicity !== ethnicityFilter) return false;
      if (ageCategoryFilter !== "all" && m.ageCategory !== ageCategoryFilter) return false;
      if (bodyTypeFilter !== "all" && m.bodyType !== bodyTypeFilter) return false;
      if (useCaseFilter !== "all" && m.useCase !== useCaseFilter) return false;
      if (searchQuery && !m.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [defaultModels, genderFilter, ethnicityFilter, ageCategoryFilter, bodyTypeFilter, useCaseFilter, searchQuery]);

  const premiumModels = purchasedModels.map((model) => {
    const imageUrl = model.image_url.startsWith("http")
      ? model.image_url
      : `${baseUrl}${model.image_url}`;
    return {
      id: `custom-${model.id}`,
      url: imageUrl,
      preview: model.image_url.startsWith("http") ? model.image_url : model.image_url,
      name: model.name,
      gender: (model.gender as Gender) || "female",
      ageGroup: "adult" as const,
      ethnicity: "Mixed" as Ethnicity,
      isPremium: true,
    };
  });

  const openDetail = (model: ModelData & { isPremium?: boolean }) => {
    setDetailModel(model);
    setDetailOpen(true);
  };

  const colCount = columns || (compact ? 4 : 5);
  const gridColsMap: Record<number, string> = {
    4: "grid-cols-4",
    5: "grid-cols-5",
    6: "grid-cols-6",
    7: "grid-cols-7",
    8: "grid-cols-8",
    9: "grid-cols-9",
    10: "grid-cols-10",
  };
  const gridCols = gridColsMap[colCount] || `grid-cols-${colCount}`;

  return (
    <div>
      {/* Toolbar: Search + Filters + Upload */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[140px] max-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 text-xs pl-8 pr-3"
          />
        </div>

        {/* Filters */}
        <ModelFilters
          genderFilter={genderFilter}
          setGenderFilter={setGenderFilter}
          ethnicityFilter={ethnicityFilter}
          setEthnicityFilter={setEthnicityFilter}
          ageCategoryFilter={ageCategoryFilter}
          setAgeCategoryFilter={setAgeCategoryFilter}
          bodyTypeFilter={bodyTypeFilter}
          setBodyTypeFilter={setBodyTypeFilter}
          useCaseFilter={useCaseFilter}
          setUseCaseFilter={setUseCaseFilter}
        />

        {/* Upload button - pushed to end */}
        {onCustomModelFileChange && (
          <div className="ml-auto shrink-0">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleFileUpload}
            />
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-8 text-xs"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-3.5 w-3.5" />
              Upload
            </Button>
          </div>
        )}
      </div>

      {/* Scrollable grid area */}
      <div className="overflow-y-auto p-1 -m-1" style={{ maxHeight }}>
        {/* Premium purchased models */}
        {premiumModels.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-primary">Premium Models</span>
            </div>
            <div className={`grid ${gridCols} gap-2 mb-3`}>
              {premiumModels.map((model) => (
                <ModelCard
                  key={model.id}
                  {...model}
                  isSelected={selectedModel === model.url}
                  onSelect={onModelSelect}
                  onPreview={() => openDetail(model)}
                />
              ))}
            </div>
            <div className="border-b border-border/50 mb-3" />
          </div>
        )}

        {/* Default models grid (with custom upload as first item) */}
        <div className={`grid ${gridCols} gap-2`}>
          {/* Custom uploaded model - rendered inline as first card */}
          {customModelFile && onCustomModelFileChange && (
            <Card
              className={`relative cursor-pointer overflow-hidden transition-all hover:scale-105 group border-primary/30 ${
                !selectedModel ? "ring-2 ring-primary ring-offset-2" : ""
              }`}
              onClick={() => onModelSelect("")}
            >
              <div className="aspect-[2/3] relative">
                <img
                  src={URL.createObjectURL(customModelFile)}
                  alt="Custom model"
                  className="w-full h-full object-cover"
                />
                {!selectedModel && (
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                    <div className="bg-primary rounded-full p-1">
                      <Check className="h-4 w-4 text-primary-foreground" />
                    </div>
                  </div>
                )}
                <div className="absolute top-1 left-1">
                  <Upload className="h-3 w-3 text-primary drop-shadow-md" />
                </div>
                <button
                  className="absolute top-1 right-1 bg-background/80 backdrop-blur-sm rounded-full p-1 opacity-0 group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground transition-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearCustomModel();
                  }}
                  title="Remove"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              <div className="p-1.5 bg-background/95 text-center">
                <p className="text-xs font-medium truncate">{customModelFile.name}</p>
              </div>
            </Card>
          )}

          {filteredModels.map((model) => (
            <ModelCard
              key={model.id}
              {...model}
              isSelected={selectedModel === model.url}
              onSelect={onModelSelect}
              onPreview={() => openDetail(model)}
            />
          ))}
          {filteredModels.length === 0 && !customModelFile && (
            <div className="py-6 text-center text-muted-foreground text-sm" style={{ gridColumn: "1 / -1" }}>
              No avatars match your filters.
            </div>
          )}
        </div>
      </div>

      <ModelDetailDialog
        model={detailModel}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        isSelected={detailModel ? selectedModel === detailModel.url : false}
        onSelect={onModelSelect}
      />
    </div>
  );
};

export default ModelSelector;
