import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, Search, Check, ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export type StyleSelection =
  | { kind: "ai-guess" }
  | { kind: "library"; id: string; image_url: string; name: string }
  | { kind: "user"; id: string; image_url: string; name: string };

interface Category {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
}
interface CuratedStyle {
  id: string;
  category_id: string;
  name: string;
  image_url: string;
  subcategory_id: string | null;
  output_type: "flatlay" | "halo_bust";
}
interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  sort_order: number;
}
interface UserStyle {
  id: string;
  name: string;
  image_url: string;
}

export interface UploadedProduct {
  id: string;
  preview: string;
}

interface Props {
  userId: string | null;
  /** Map of productId -> selection. */
  selections: Record<string, StyleSelection>;
  onSelectionsChange: (next: Record<string, StyleSelection>) => void;
  products: UploadedProduct[];
  onCreditsChanged?: (newBalance: number) => void;
  outputType?: "flatlay" | "halo_bust";
}

export const StylePickerPanel = ({
  userId,
  selections,
  onSelectionsChange,
  products,
  onCreditsChanged,
  outputType = "flatlay",
}: Props) => {
  const { toast } = useToast();
  const [tab, setTab] = useState<"floowy" | "mine">("floowy");
  const [categories, setCategories] = useState<Category[]>([]);
  const [styles, setStyles] = useState<CuratedStyle[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [drillCategory, setDrillCategory] = useState<Category | null>(null);
  const [drillSubcategory, setDrillSubcategory] = useState<Subcategory | null>(null);
  const [userStyles, setUserStyles] = useState<UserStyle[]>([]);
  const [search, setSearch] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState("");
  const [uploading, setUploading] = useState(false);

  // Active product the user is currently styling.
  const [activeProductId, setActiveProductId] = useState<string | null>(
    products[0]?.id ?? null
  );

  useEffect(() => {
    // Keep the active product valid as the products list changes.
    if (products.length === 0) {
      setActiveProductId(null);
      return;
    }
    if (!activeProductId || !products.find((p) => p.id === activeProductId)) {
      // Prefer first product without a selection.
      const next = products.find((p) => !selections[p.id]) ?? products[0];
      setActiveProductId(next.id);
    }
  }, [products, activeProductId, selections]);

  const setSelectionFor = (productId: string, s: StyleSelection) => {
    onSelectionsChange({ ...selections, [productId]: s });
    // Auto-advance to next product missing a selection.
    const idx = products.findIndex((p) => p.id === productId);
    const next =
      products.slice(idx + 1).find((p) => !selections[p.id]) ??
      products.find((p) => p.id !== productId && !selections[p.id]);
    if (next) setActiveProductId(next.id);
  };

  const activeSelection = activeProductId ? selections[activeProductId] ?? null : null;
  const onSelect = (s: StyleSelection) => {
    if (!activeProductId) return;
    setSelectionFor(activeProductId, s);
  };
  const selection = activeSelection;

  useEffect(() => {
    (async () => {
      const { data: cats } = await supabase
        .from("flatlay_style_categories")
        .select("*").order("sort_order");
      const { data: st } = await supabase
        .from("flatlay_styles")
        .select("id,category_id,subcategory_id,name,image_url,output_type")
        .eq("is_active", true)
        .order("sort_order");
      const { data: subs } = await supabase
        .from("flatlay_subcategories")
        .select("*").order("sort_order");
      setCategories(cats || []);
      setStyles((st as any) || []);
      setSubcategories((subs as any) || []);
    })();
  }, []);

  // When output type changes, reset drill-down so the user sees the correct library.
  useEffect(() => {
    setDrillCategory(null);
    setDrillSubcategory(null);
  }, [outputType]);

  // Filter style list by current output type before all downstream usage.
  const stylesForType = styles.filter(
    (s) => (s.output_type || "flatlay") === outputType,
  );

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data } = await supabase
        .from("flatlay_user_styles")
        .select("id,name,image_url")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      setUserStyles(data || []);
    })();
  }, [userId]);

  const handleUpload = async () => {
    if (!uploadFile || !uploadName.trim() || !userId) return;
    setUploading(true);
    try {
      // Upload to storage
      const ext = uploadFile.name.split(".").pop() || "png";
      const path = `${userId}/flatlay-styles/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("user-uploads").upload(path, uploadFile, { upsert: false });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("user-uploads").getPublicUrl(path);

      const { data, error } = await supabase.functions.invoke("save-flatlay-style", {
        body: { name: uploadName.trim(), image_url: pub.publicUrl },
      });
      if (error) throw error;
      const style = (data as any).style;
      setUserStyles((prev) => [{ id: style.id, name: style.name, image_url: style.image_url }, ...prev]);
      if (activeProductId) {
        setSelectionFor(activeProductId, {
          kind: "user",
          id: style.id,
          image_url: style.image_url,
          name: style.name,
        });
      }
      setUploadOpen(false);
      setUploadFile(null);
      setUploadName("");
      // Refresh credits
      if (onCreditsChanged) {
        const { data: c } = await supabase.from("credits").select("balance").eq("user_id", userId).single();
        if (c) onCreditsChanged(c.balance);
      }
      toast({ title: "Style saved", description: "Reusable forever — free to upload." });
    } catch (e: any) {
      console.error(e);
      toast({
        title: "Couldn't save style",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const filteredCategoryStyles = (catId: string) =>
    stylesForType.filter((s) => s.category_id === catId &&
      (search.trim() === "" || s.name.toLowerCase().includes(search.toLowerCase())));

  return (
    <div className="rounded-xl border bg-card p-4 space-y-4">
      {/* Uploaded products strip — pick which product to assign a style to */}
      {products.length > 0 && (
        <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Your products</div>
            <div className="text-xs text-muted-foreground">
              {Object.keys(selections).length}/{products.length} styled
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {products.map((p, i) => {
              const sel = selections[p.id];
              const isActive = activeProductId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setActiveProductId(p.id)}
                  className={cn(
                    "relative shrink-0 rounded-lg border-2 overflow-hidden bg-white transition",
                    isActive ? "border-primary ring-2 ring-primary/30" : "border-transparent hover:border-muted-foreground/40"
                  )}
                  title={`Product ${i + 1}`}
                >
                  <div className="w-16 h-16 relative">
                    <img src={p.preview} alt={`Product ${i + 1}`} className="w-full h-full object-cover" />
                    {sel && sel.kind !== "ai-guess" && (
                      <div className="absolute inset-0 ring-2 ring-primary/60 pointer-events-none" />
                    )}
                    {sel && (
                      <div className="absolute top-0.5 right-0.5 bg-primary text-primary-foreground rounded-full p-0.5">
                        <Check className="h-2.5 w-2.5" />
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] text-center py-0.5">
                      #{i + 1}
                    </div>
                  </div>
                  {sel && sel.kind !== "ai-guess" && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded border-2 border-card bg-white overflow-hidden">
                      <img src={sel.image_url} alt="" className="w-full h-full object-contain" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          {activeProductId && (
            <div className="text-xs text-muted-foreground">
              Choose a reference style for{" "}
              <span className="font-semibold text-foreground">
                Product #{products.findIndex((p) => p.id === activeProductId) + 1}
              </span>
              {selections[activeProductId] && selections[activeProductId].kind !== "ai-guess" && (
                <> — currently <span className="font-medium text-foreground">{(selections[activeProductId] as any).name}</span></>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search styles..."
            className="pl-9"
          />
        </div>
        <div className="inline-flex rounded-lg border p-1 bg-muted">
          <button
            onClick={() => setTab("floowy")}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium transition",
              tab === "floowy" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            )}
          >
            Floowy Styles
          </button>
          <button
            onClick={() => setTab("mine")}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium transition",
              tab === "mine" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            )}
          >
            My Styles
          </button>
        </div>
      </div>

      {tab === "floowy" ? (
        <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1">
          {/* Breadcrumbs */}
          {(drillCategory || drillSubcategory) && (
            <div className="flex items-center gap-1 text-xs">
              <button
                onClick={() => { setDrillCategory(null); setDrillSubcategory(null); }}
                className="text-primary hover:underline"
              >Category</button>
              {drillCategory && (
                <>
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  <button
                    onClick={() => setDrillSubcategory(null)}
                    className={cn(drillSubcategory ? "text-primary hover:underline" : "font-semibold")}
                  >{drillCategory.name}</button>
                </>
              )}
              {drillSubcategory && (
                <>
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  <span className="font-semibold">{drillSubcategory.name}</span>
                </>
              )}
            </div>
          )}

          {/* Level 1: Categories */}
          {!drillCategory && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {categories.map((cat) => {
                const subs = subcategories.filter((s) => s.category_id === cat.id);
                const cover = stylesForType.find((s) => s.category_id === cat.id)?.image_url;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setDrillCategory(cat)}
                    className="rounded-lg border bg-card overflow-hidden text-left hover:border-primary transition group"
                  >
                    <div className="aspect-square bg-white flex items-center justify-center">
                      {cover ? (
                        <img src={cover} alt={cat.name} className="w-full h-full object-contain" loading="lazy" />
                      ) : (
                        <span className="text-muted-foreground text-xs">No image</span>
                      )}
                    </div>
                    <div className="px-3 py-2">
                      <div className="text-sm font-semibold">{cat.name}</div>
                      <div className="text-[11px] text-muted-foreground flex items-center justify-between">
                        <span>{subs.length} sub-categories</span>
                        <ChevronRight className="h-3 w-3" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Level 2: Subcategories */}
          {drillCategory && !drillSubcategory && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {subcategories
                .filter((s) => s.category_id === drillCategory.id)
                .map((sub) => {
                  const variants = stylesForType.filter((st) => st.subcategory_id === sub.id);
                  const cover = variants[0]?.image_url;
                  return (
                    <button
                      key={sub.id}
                      onClick={() => setDrillSubcategory(sub)}
                      className="rounded-lg border bg-card overflow-hidden text-left hover:border-primary transition"
                    >
                      <div className="aspect-square bg-white flex items-center justify-center">
                        {cover ? (
                          <img src={cover} alt={sub.name} className="w-full h-full object-contain" loading="lazy" />
                        ) : (
                          <span className="text-muted-foreground text-xs">No image</span>
                        )}
                      </div>
                      <div className="px-3 py-2">
                        <div className="text-sm font-semibold">{sub.name}</div>
                        <div className="text-[11px] text-muted-foreground flex items-center justify-between">
                          <span>{variants.length} variants</span>
                          <ChevronRight className="h-3 w-3" />
                        </div>
                      </div>
                    </button>
                  );
                })}
            </div>
          )}

          {/* Level 3: Variants */}
          {drillSubcategory && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {stylesForType
                .filter((s) =>
                  s.subcategory_id === drillSubcategory.id &&
                  (search.trim() === "" || s.name.toLowerCase().includes(search.toLowerCase()))
                )
                .map((s) => {
                  const active = selection?.kind === "library" && selection.id === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => onSelect({ kind: "library", id: s.id, image_url: s.image_url, name: s.name })}
                      className={cn(
                        "rounded-lg border-2 overflow-hidden bg-white relative text-left",
                        active ? "border-primary" : "border-transparent hover:border-muted-foreground/40"
                      )}
                    >
                      <div className="aspect-square">
                        <img src={s.image_url} alt={s.name} className="w-full h-full object-contain" loading="lazy" />
                      </div>
                      <div className="px-2 py-1.5 bg-card border-t text-xs font-medium truncate">{s.name}</div>
                      {active && (
                        <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-0.5">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                    </button>
                  );
                })}
            </div>
          )}

          {categories.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-8">
              No curated styles yet. Use "Let AI Guess" or upload your own reference.
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-end">
            <Button onClick={() => setUploadOpen(true)} size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Upload Reference
            </Button>
          </div>
          {userStyles.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">No references uploaded yet.</div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {userStyles.map((s) => {
                const active = selection?.kind === "user" && selection.id === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() =>
                      onSelect({ kind: "user", id: s.id, image_url: s.image_url, name: s.name })
                    }
                    className={cn(
                      "rounded-lg border-2 overflow-hidden aspect-square bg-white relative",
                      active ? "border-primary" : "border-transparent hover:border-muted-foreground/40"
                    )}
                  >
                    <img src={s.image_url} alt={s.name} className="w-full h-full object-contain" loading="lazy" />
                    {active && (
                      <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-0.5">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Custom Reference</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              <strong>Free to upload.</strong> Reuse it across unlimited generations.
            </p>
            <div>
              <Label className="mb-1 block">Style name</Label>
              <Input
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value.slice(0, 60))}
                placeholder="e.g. Brand Hero Layout"
              />
            </div>
            <div>
              <Label className="mb-1 block">Reference image</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              />
              {uploadFile && (
                <img
                  src={URL.createObjectURL(uploadFile)}
                  alt="preview"
                  className="mt-2 max-h-40 rounded border object-contain"
                />
              )}
            </div>
            <Button
              onClick={handleUpload}
              disabled={!uploadFile || !uploadName.trim() || uploading}
              className="w-full"
            >
              {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              {uploading ? "Saving…" : "Save Style"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};