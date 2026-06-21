import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Crown, Edit, Loader2, Plus, Search, Trash2, Upload, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DefaultModel {
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

interface PremiumModel {
  id: string;
  name: string;
  description: string | null;
  image_url: string;
  price_cents: number;
  gender: string;
  is_active: boolean;
  stripe_price_id: string | null;
}

const ETHNICITIES = ["European", "African", "Middle Eastern", "East Asian", "South Asian", "Latin American", "Mixed"];
const GENDERS = ["female", "male"];
const AGE_CATEGORIES = ["1 – 2.5", "7 – 13", "13 – 18", "20 – 30", "30 – 50", "50 – 65", "65+"];
const BODY_TYPES = ["Slim", "Athletic", "Average", "Curvy", "Overweight", "Plus size"];
const USE_CASES = ["Fashion", "E-commerce", "Lifestyle"];

const getAdminToken = () => localStorage.getItem("admin_token") || "";

const invokeAdminModels = async (body: Record<string, any>) => {
  const { data, error } = await supabase.functions.invoke("admin-manage-models", {
    body,
    headers: { "admin-token": getAdminToken() },
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data;
};

export const AdminModelsPanel = () => {
  const { toast } = useToast();
  const [freeModels, setFreeModels] = useState<DefaultModel[]>([]);
  const [premiumModels, setPremiumModels] = useState<PremiumModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editModel, setEditModel] = useState<(DefaultModel | PremiumModel) | null>(null);
  const [editType, setEditType] = useState<"free" | "premium">("free");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editGender, setEditGender] = useState("female");
  const [editEthnicity, setEditEthnicity] = useState("European");
  const [editAgeCategory, setEditAgeCategory] = useState("20 – 30");
  const [editBodyType, setEditBodyType] = useState("Average");
  const [editUseCase, setEditUseCase] = useState("Fashion");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [editDescription, setEditDescription] = useState("");
  const [editPriceCents, setEditPriceCents] = useState(1995);

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    setIsLoading(true);
    try {
      const [freeRes, premiumRes] = await Promise.all([
        invokeAdminModels({ action: "list", model_type: "free" }),
        invokeAdminModels({ action: "list", model_type: "premium" }),
      ]);
      if (freeRes?.models) setFreeModels(freeRes.models);
      if (premiumRes?.models) setPremiumModels(premiumRes.models);
    } catch (error: any) {
      toast({ title: "Error loading models", description: error.message, variant: "destructive" });
    }
    setIsLoading(false);
  };

  const openEditDialog = (model: DefaultModel | PremiumModel, type: "free" | "premium") => {
    setEditModel(model);
    setEditType(type);
    setEditName(model.name);
    setEditGender(model.gender);
    setEditImageUrl(model.image_url);
    setEditIsActive(model.is_active);
    if (type === "free") {
      setEditEthnicity((model as DefaultModel).ethnicity);
      setEditAgeCategory((model as DefaultModel).age_category || "20 – 30");
      setEditBodyType((model as DefaultModel).body_type || "Average");
      setEditUseCase((model as DefaultModel).use_case || "Fashion");
    } else {
      setEditDescription((model as PremiumModel).description || "");
      setEditPriceCents((model as PremiumModel).price_cents);
    }
    setEditDialogOpen(true);
  };

  const openAddDialog = (type: "free" | "premium") => {
    setEditModel(null);
    setEditType(type);
    setEditName("");
    setEditGender("female");
    setEditEthnicity("European");
    setEditAgeCategory("20 – 30");
    setEditBodyType("Average");
    setEditUseCase("Fashion");
    setEditImageUrl("");
    setEditIsActive(true);
    setEditDescription("");
    setEditPriceCents(1995);
    setEditDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editName || !editImageUrl) {
      toast({ title: "Missing fields", description: "Name and image URL are required.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      if (editType === "free") {
        const payload = {
          name: editName,
          gender: editGender,
          ethnicity: editEthnicity,
          age_category: editAgeCategory,
          body_type: editBodyType,
          use_case: editUseCase,
          image_url: editImageUrl,
          is_active: editIsActive,
        };
        if (editModel) {
          await invokeAdminModels({ action: "update", model_type: "free", id: editModel.id, payload });
        } else {
          const maxSort = freeModels.length > 0 ? Math.max(...freeModels.map(m => m.sort_order)) + 1 : 1;
          await invokeAdminModels({ action: "add", model_type: "free", payload: { ...payload, sort_order: maxSort } });
        }
      } else {
        const payload = {
          name: editName,
          gender: editGender,
          image_url: editImageUrl,
          is_active: editIsActive,
          description: editDescription || null,
          price_cents: editPriceCents,
        };
        if (editModel) {
          await invokeAdminModels({ action: "update", model_type: "premium", id: editModel.id, payload });
        } else {
          await invokeAdminModels({ action: "add", model_type: "premium", payload });
        }
      }
      toast({ title: editModel ? "Model updated" : "Model added" });
      setEditDialogOpen(false);
      fetchModels();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, type: "free" | "premium") => {
    try {
      await invokeAdminModels({ action: "delete", model_type: type, id });
      toast({ title: "Model deleted" });
      fetchModels();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const toggleActive = async (id: string, type: "free" | "premium", current: boolean) => {
    try {
      await invokeAdminModels({ action: "toggle_active", model_type: type, id, is_active: !current });
      fetchModels();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const filteredFree = freeModels.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredPremium = premiumModels.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Model Management</h2>
        <p className="text-muted-foreground text-sm">Manage free and premium model avatars. Changes update in real-time for users.</p>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search models..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs defaultValue="free">
        <TabsList className="mb-6">
          <TabsTrigger value="free" className="gap-2">
            <Users className="h-3.5 w-3.5" />
            Free Models
            <Badge variant="secondary" className="text-[10px]">{freeModels.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="premium" className="gap-2">
            <Crown className="h-3.5 w-3.5" />
            Premium Models
            <Badge variant="secondary" className="text-[10px]">{premiumModels.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="free">
          <div className="flex justify-end mb-4">
            <Button size="sm" onClick={() => openAddDialog("free")} className="gap-2">
              <Plus className="h-4 w-4" /> Add Free Model
            </Button>
          </div>
          <ModelTable
            models={filteredFree}
            type="free"
            onEdit={(m) => openEditDialog(m, "free")}
            onDelete={(id) => handleDelete(id, "free")}
            onToggle={(id, active) => toggleActive(id, "free", active)}
          />
        </TabsContent>

        <TabsContent value="premium">
          <div className="flex justify-end mb-4">
            <Button size="sm" onClick={() => openAddDialog("premium")} className="gap-2">
              <Plus className="h-4 w-4" /> Add Premium Model
            </Button>
          </div>
          <ModelTable
            models={filteredPremium}
            type="premium"
            onEdit={(m) => openEditDialog(m, "premium")}
            onDelete={(id) => handleDelete(id, "premium")}
            onToggle={(id, active) => toggleActive(id, "premium", active)}
          />
        </TabsContent>
      </Tabs>

      {/* Edit/Add Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editModel ? "Edit Model" : `Add ${editType === "free" ? "Free" : "Premium"} Model`}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {editImageUrl && (
              <div className="w-24 h-32 rounded-lg overflow-hidden border border-border bg-muted mx-auto">
                <img src={editImageUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name</Label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Model name" />
              </div>
              <div>
                <Label>Gender</Label>
                <Select value={editGender} onValueChange={setEditGender}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {GENDERS.map(g => <SelectItem key={g} value={g} className="capitalize">{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {editType === "free" && (
              <>
                <div>
                  <Label>Ethnicity</Label>
                  <Select value={editEthnicity} onValueChange={setEditEthnicity}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ETHNICITIES.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Age Category</Label>
                    <Select value={editAgeCategory} onValueChange={setEditAgeCategory}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {AGE_CATEGORIES.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Body Type</Label>
                    <Select value={editBodyType} onValueChange={setEditBodyType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {BODY_TYPES.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Use Case</Label>
                    <Select value={editUseCase} onValueChange={setEditUseCase}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {USE_CASES.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

            <div>
              <Label>Image</Label>
              <div className="flex gap-2">
                <Input value={editImageUrl} onChange={(e) => setEditImageUrl(e.target.value)} placeholder="Paste URL or upload" className="flex-1" />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 50 * 1024 * 1024) {
                      toast({ title: "File too large", description: "Max 50MB", variant: "destructive" });
                      return;
                    }
                    setIsUploading(true);
                    try {
                      const reader = new FileReader();
                      reader.onload = async () => {
                        const base64 = (reader.result as string).split(",")[1];
                        const { data, error } = await supabase.functions.invoke("upload-to-imgbb", {
                          body: { image_base64: base64 },
                        });
                        if (error || !data?.url) throw new Error(error?.message || "Upload failed");
                        setEditImageUrl(data.url);
                        toast({ title: "Image uploaded" });
                        setIsUploading(false);
                      };
                      reader.readAsDataURL(file);
                    } catch (err: any) {
                      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
                      setIsUploading(false);
                    }
                    e.target.value = "";
                  }}
                />
                <Button type="button" variant="outline" size="icon" disabled={isUploading} onClick={() => fileInputRef.current?.click()}>
                  {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {editType === "premium" && (
              <>
                <div>
                  <Label>Description</Label>
                  <Input value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="Optional description" />
                </div>
                <div>
                  <Label>Price (cents)</Label>
                  <Input type="number" value={editPriceCents} onChange={(e) => setEditPriceCents(Number(e.target.value))} />
                </div>
              </>
            )}

            <div className="flex items-center gap-2">
              <Switch checked={editIsActive} onCheckedChange={setEditIsActive} />
              <Label>Active</Label>
            </div>

            <Button onClick={handleSave} disabled={isSaving} className="w-full">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editModel ? "Save Changes" : "Add Model"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Reusable table for both model types
const ModelTable = ({
  models,
  type,
  onEdit,
  onDelete,
  onToggle,
}: {
  models: any[];
  type: "free" | "premium";
  onEdit: (model: any) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, currentActive: boolean) => void;
}) => {
  if (models.length === 0) {
    return <div className="text-center py-10 text-muted-foreground text-sm">No models found.</div>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
      {models.map((model) => (
        <Card key={model.id} className={`overflow-hidden group transition-all ${!model.is_active ? "opacity-50" : ""}`}>
          <div className="aspect-[3/4] relative overflow-hidden bg-muted">
            <img src={model.image_url} alt={model.name} className="w-full h-full object-cover" loading="lazy" />
            {!model.is_active && (
              <div className="absolute top-1.5 left-1.5">
                <Badge variant="destructive" className="text-[9px]">Inactive</Badge>
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100">
              <Button size="icon" variant="secondary" className="h-7 w-7" onClick={() => onEdit(model)}>
                <Edit className="h-3 w-3" />
              </Button>
              <Button
                size="icon"
                variant="secondary"
                className="h-7 w-7"
                onClick={() => onToggle(model.id, model.is_active)}
              >
                <span className="text-[9px] font-bold">{model.is_active ? "OFF" : "ON"}</span>
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="icon" variant="destructive" className="h-7 w-7">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete {model.name}?</AlertDialogTitle>
                    <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(model.id)}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
          <div className="p-2 text-center">
            <h4 className="font-medium text-xs truncate">{model.name}</h4>
            <p className="text-[10px] text-muted-foreground capitalize">
              {model.gender} {type === "free" ? `· ${model.ethnicity}` : `· €${(model.price_cents / 100).toFixed(2)}`}
            </p>
            {type === "free" && model.age_category && (
              <p className="text-[9px] text-muted-foreground">{model.age_category} · {model.body_type || "Average"} · {model.use_case || "Fashion"}</p>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
};
