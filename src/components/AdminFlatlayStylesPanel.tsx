import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Plus, Upload, Trash2, Edit, ChevronRight } from "lucide-react";

interface Category { id: string; name: string; slug: string; sort_order: number; }
interface Subcategory { id: string; category_id: string; name: string; slug: string; sort_order: number; }
interface Style {
  id: string; category_id: string | null; subcategory_id: string | null;
  name: string; image_url: string; is_active: boolean; sort_order: number;
  output_type?: "flatlay" | "halo_bust";
}

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve((r.result as string).split(",")[1]);
    r.onerror = reject;
    r.readAsDataURL(file);
  });

export function AdminFlatlayStylesPanel() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [styles, setStyles] = useState<Style[]>([]);

  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [activeSubId, setActiveSubId] = useState<string | null>(null);

  const [subDialogOpen, setSubDialogOpen] = useState(false);
  const [editSub, setEditSub] = useState<Subcategory | null>(null);
  const [subName, setSubName] = useState("");
  const [subSort, setSubSort] = useState<number>(0);

  const [styleDialogOpen, setStyleDialogOpen] = useState(false);
  const [editStyle, setEditStyle] = useState<Style | null>(null);
  const [styleName, setStyleName] = useState("");
  const [styleSort, setStyleSort] = useState<number>(0);
  const [styleActive, setStyleActive] = useState(true);
  const [styleImageUrl, setStyleImageUrl] = useState("");
  const [styleOutputType, setStyleOutputType] = useState<"flatlay" | "halo_bust">("flatlay");
  const [outputFilter, setOutputFilter] = useState<"flatlay" | "halo_bust">("flatlay");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [deleteSubId, setDeleteSubId] = useState<string | null>(null);
  const [deleteStyleId, setDeleteStyleId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const adminToken = typeof window !== "undefined" ? localStorage.getItem("admin_token") || "" : "";

  const invoke = async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("admin-manage-flatlay-styles", {
      body, headers: { "admin-token": adminToken },
    });
    if (error) throw new Error(error.message);
    if ((data as any)?.error) throw new Error((data as any).error);
    return data as any;
  };

  const load = async () => {
    setLoading(true);
    try {
      const data = await invoke({ action: "list" });
      setCategories(data.categories || []);
      setSubcategories(data.subcategories || []);
      setStyles(data.styles || []);
      if (!activeCategoryId && data.categories?.length) {
        setActiveCategoryId(data.categories[0].id);
      }
    } catch (e: any) {
      toast({ title: "Failed to load", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const stylesForFilter = styles.filter(s => (s.output_type || "flatlay") === outputFilter);
  const currentSubs = subcategories.filter(s => s.category_id === activeCategoryId);
  const currentStyles = stylesForFilter.filter(s => s.subcategory_id === activeSubId);

  // ---- Subcategory ----
  const openNewSub = () => {
    setEditSub(null);
    setSubName("");
    setSubSort((currentSubs.at(-1)?.sort_order ?? 0) + 10);
    setSubDialogOpen(true);
  };
  const openEditSub = (s: Subcategory) => {
    setEditSub(s); setSubName(s.name); setSubSort(s.sort_order);
    setSubDialogOpen(true);
  };
  const saveSub = async () => {
    if (!subName.trim() || !activeCategoryId) return;
    setSaving(true);
    try {
      if (editSub) {
        await invoke({ action: "update_subcategory", id: editSub.id, name: subName.trim(), sort_order: subSort });
      } else {
        await invoke({ action: "add_subcategory", category_id: activeCategoryId, name: subName.trim(), sort_order: subSort });
      }
      toast({ title: editSub ? "Subcategory updated" : "Subcategory added" });
      setSubDialogOpen(false);
      await load();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };
  const removeSub = async () => {
    if (!deleteSubId) return;
    try {
      await invoke({ action: "delete_subcategory", id: deleteSubId });
      toast({ title: "Subcategory deleted" });
      if (activeSubId === deleteSubId) setActiveSubId(null);
      setDeleteSubId(null);
      await load();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  // ---- Style ----
  const openNewStyle = () => {
    setEditStyle(null);
    setStyleName("");
    setStyleSort((currentStyles.at(-1)?.sort_order ?? 0) + 10);
    setStyleActive(true);
    setStyleImageUrl("");
    setStyleOutputType(outputFilter);
    setStyleDialogOpen(true);
  };
  const openEditStyle = (s: Style) => {
    setEditStyle(s);
    setStyleName(s.name); setStyleSort(s.sort_order);
    setStyleActive(s.is_active); setStyleImageUrl(s.image_url);
    setStyleOutputType((s.output_type as any) || "flatlay");
    setStyleDialogOpen(true);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Image too large", description: "Max 10MB", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const b64 = await fileToBase64(file);
      const res = await invoke({
        action: "upload_image",
        file_base64: b64,
        content_type: file.type,
        filename: file.name,
      });
      setStyleImageUrl(res.url);
      toast({ title: "Image uploaded" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const saveStyle = async () => {
    if (!styleName.trim() || !styleImageUrl || !activeCategoryId || !activeSubId) {
      toast({ title: "Missing fields", description: "Name and image are required.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (editStyle) {
        await invoke({
          action: "update_style", id: editStyle.id,
          name: styleName.trim(), image_url: styleImageUrl,
          sort_order: styleSort, is_active: styleActive,
          output_type: styleOutputType,
        });
      } else {
        await invoke({
          action: "add_style",
          category_id: activeCategoryId, subcategory_id: activeSubId,
          name: styleName.trim(), image_url: styleImageUrl,
          sort_order: styleSort, is_active: styleActive,
          output_type: styleOutputType,
        });
      }
      toast({ title: editStyle ? "Variant updated" : "Variant added" });
      setStyleDialogOpen(false);
      await load();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const removeStyle = async () => {
    if (!deleteStyleId) return;
    try {
      await invoke({ action: "delete_style", id: deleteStyleId });
      toast({ title: "Variant deleted" });
      setDeleteStyleId(null);
      await load();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground">Flatlay Styles</h2>
        <p className="text-muted-foreground text-sm">
          Manage subcategories and image variants for the Flatlay Studio style picker.
        </p>
      </div>

      {/* Output Type filter */}
      <div className="mb-4 inline-flex rounded-lg border p-1 bg-muted">
        {(["flatlay", "halo_bust"] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setOutputFilter(t); setActiveSubId(null); }}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
              outputFilter === t ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            {t === "flatlay" ? "Flatlay" : "Halo Bust"}
            <span className="ml-2 text-xs opacity-70">
              {styles.filter(s => (s.output_type || "flatlay") === t).length}
            </span>
          </button>
        ))}
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map(cat => {
          const active = cat.id === activeCategoryId;
          return (
            <button
              key={cat.id}
              onClick={() => { setActiveCategoryId(cat.id); setActiveSubId(null); }}
              className={`px-3 py-1.5 rounded-md text-sm border transition ${
                active ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-muted"
              }`}
            >
              {cat.name}
              <span className="ml-2 text-xs opacity-70">
                {subcategories.filter(s => s.category_id === cat.id).length}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
        {/* Subcategories list */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Subcategories</h3>
            <Button size="sm" onClick={openNewSub} disabled={!activeCategoryId}>
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          </div>
          {currentSubs.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">No subcategories yet.</p>
          ) : (
            <ul className="space-y-1">
              {currentSubs.map(sub => {
                const active = sub.id === activeSubId;
                const count = stylesForFilter.filter(s => s.subcategory_id === sub.id).length;
                return (
                  <li key={sub.id}>
                    <div
                      className={`flex items-center gap-1 rounded-md px-2 py-1.5 group ${
                        active ? "bg-primary/10" : "hover:bg-muted"
                      }`}
                    >
                      <button
                        onClick={() => setActiveSubId(sub.id)}
                        className="flex-1 text-left flex items-center justify-between"
                      >
                        <span className="text-sm font-medium truncate">{sub.name}</span>
                        <span className="text-xs text-muted-foreground">{count}</span>
                      </button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100"
                        onClick={() => openEditSub(sub)}>
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive"
                        onClick={() => setDeleteSubId(sub.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* Variants grid */}
        <Card className="p-4 min-h-[400px]">
          {!activeSubId ? (
            <div className="text-sm text-muted-foreground text-center py-16">
              Select a subcategory to manage its variants.
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <span>{categories.find(c => c.id === activeCategoryId)?.name}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                  <span className="font-semibold text-foreground">
                    {currentSubs.find(s => s.id === activeSubId)?.name}
                  </span>
                </div>
                <Button size="sm" onClick={openNewStyle}>
                  <Plus className="w-4 h-4 mr-1" /> Add Variant
                </Button>
              </div>

              {currentStyles.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12">No variants yet.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {currentStyles.map(s => (
                    <div key={s.id} className="rounded-lg border overflow-hidden bg-card group relative">
                      <div className="aspect-square bg-white">
                        <img src={s.image_url} alt={s.name} className="w-full h-full object-contain" loading="lazy" />
                      </div>
                      <div className="px-2 py-1.5 border-t flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium truncate">{s.name}</p>
                          <p className="text-[10px] text-muted-foreground">#{s.sort_order}</p>
                        </div>
                        {!s.is_active && <Badge variant="secondary" className="text-[10px]">Off</Badge>}
                      </div>
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition">
                        <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => openEditStyle(s)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => setDeleteStyleId(s.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </Card>
      </div>

      {/* Subcategory Dialog */}
      <Dialog open={subDialogOpen} onOpenChange={setSubDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editSub ? "Edit Subcategory" : "New Subcategory"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Name</Label>
              <Input value={subName} onChange={e => setSubName(e.target.value)} placeholder="e.g. Dresses" />
            </div>
            <div>
              <Label>Sort order</Label>
              <Input type="number" value={subSort} onChange={e => setSubSort(Number(e.target.value))} />
            </div>
            <Button className="w-full" onClick={saveSub} disabled={saving || !subName.trim()}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editSub ? "Save" : "Add"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Style Dialog */}
      <Dialog open={styleDialogOpen} onOpenChange={setStyleDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editStyle ? "Edit Variant" : "New Variant"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Name</Label>
              <Input value={styleName} onChange={e => setStyleName(e.target.value)} placeholder="e.g. Triangle Bikini Top" />
            </div>
            <div>
              <Label>Image</Label>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
              <div className="flex gap-2 mt-1">
                <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading} type="button">
                  {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                  {uploading ? "Uploading..." : styleImageUrl ? "Replace image" : "Upload image"}
                </Button>
              </div>
              <Input
                className="mt-2"
                value={styleImageUrl}
                onChange={e => setStyleImageUrl(e.target.value)}
                placeholder="Or paste image URL"
              />
              {styleImageUrl && (
                <div className="mt-2 rounded-lg overflow-hidden border bg-white aspect-square max-w-[200px]">
                  <img src={styleImageUrl} alt="preview" className="w-full h-full object-contain" />
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Sort order</Label>
                <Input type="number" value={styleSort} onChange={e => setStyleSort(Number(e.target.value))} />
              </div>
              <div className="flex items-end gap-2">
                <Switch checked={styleActive} onCheckedChange={setStyleActive} />
                <span className="text-sm">{styleActive ? "Active" : "Hidden"}</span>
              </div>
            </div>
            <div>
              <Label>Output Type</Label>
              <Select value={styleOutputType} onValueChange={(v) => setStyleOutputType(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="flatlay">Flatlay</SelectItem>
                  <SelectItem value="halo_bust">Halo Bust (ghost-mannequin)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={saveStyle} disabled={saving || uploading || !styleName.trim() || !styleImageUrl}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editStyle ? "Save" : "Add Variant"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteSubId} onOpenChange={o => !o && setDeleteSubId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete subcategory?</AlertDialogTitle>
            <AlertDialogDescription>
              All variants inside this subcategory will be deleted. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={removeSub} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteStyleId} onOpenChange={o => !o && setDeleteStyleId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete variant?</AlertDialogTitle>
            <AlertDialogDescription>This variant will be removed from the picker.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={removeStyle} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}