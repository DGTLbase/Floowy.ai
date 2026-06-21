import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Eye, EyeOff, GripVertical, Loader2, Upload, ArrowUp, ArrowDown } from "lucide-react";

interface GalleryItem {
  id: string;
  src_url: string;
  alt: string;
  type: string;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export function AdminGalleryPanel() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [newItem, setNewItem] = useState({ src_url: "", alt: "", type: "image" });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const adminToken = localStorage.getItem("admin_token");

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-manage-gallery", {
        body: { action: "list" },
        headers: { "admin-token": adminToken || "" },
      });
      if (error) throw error;
      setItems((data?.items || []).sort((a: GalleryItem, b: GalleryItem) => a.sort_order - b.sort_order));
    } catch (err: any) {
      toast({ title: "Error loading gallery", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVisibility = async (item: GalleryItem) => {
    try {
      const { error } = await supabase.functions.invoke("admin-manage-gallery", {
        body: { action: "update", id: item.id, is_visible: !item.is_visible },
        headers: { "admin-token": adminToken || "" },
      });
      if (error) throw error;
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_visible: !i.is_visible } : i));
      toast({ title: `Item ${item.is_visible ? "hidden" : "shown"}` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteItemId) return;
    try {
      const { error } = await supabase.functions.invoke("admin-manage-gallery", {
        body: { action: "delete", id: deleteItemId },
        headers: { "admin-token": adminToken || "" },
      });
      if (error) throw error;
      setItems(prev => prev.filter(i => i.id !== deleteItemId));
      toast({ title: "Item deleted" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setDeleteItemId(null);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");
    if (!isVideo && !isImage) {
      toast({ title: "Invalid file type", description: "Please upload an image or video", variant: "destructive" });
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 50MB", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const form = new FormData();
      form.append("action", "upload");
      form.append("file", file, file.name);

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const res = await fetch(`${supabaseUrl}/functions/v1/admin-manage-gallery`, {
        method: "POST",
        headers: {
          "admin-token": adminToken || "",
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Upload failed");
      if (!data?.public_url) throw new Error("Upload failed");

      setNewItem(prev => ({
        ...prev,
        src_url: data.public_url,
        type: isVideo ? "video" : "image",
      }));
      toast({ title: "File uploaded" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAdd = async () => {
    if (!newItem.src_url) {
      toast({ title: "Please upload a file or enter a URL", variant: "destructive" });
      return;
    }
    try {
      const maxOrder = items.length > 0 ? Math.max(...items.map(i => i.sort_order)) : 0;
      const { error } = await supabase.functions.invoke("admin-manage-gallery", {
        body: { action: "add", src_url: newItem.src_url, alt: newItem.alt, type: newItem.type, sort_order: maxOrder + 1 },
        headers: { "admin-token": adminToken || "" },
      });
      if (error) throw error;
      toast({ title: "Item added" });
      setNewItem({ src_url: "", alt: "", type: "image" });
      setAddDialogOpen(false);
      fetchItems();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleReorder = async (itemId: string, direction: "up" | "down") => {
    const idx = items.findIndex(i => i.id === itemId);
    if ((direction === "up" && idx === 0) || (direction === "down" && idx === items.length - 1)) return;

    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    const currentItem = items[idx];
    const swapItem = items[swapIdx];

    try {
      await supabase.functions.invoke("admin-manage-gallery", {
        body: { action: "reorder", id: currentItem.id, sort_order: swapItem.sort_order },
        headers: { "admin-token": adminToken || "" },
      });
      await supabase.functions.invoke("admin-manage-gallery", {
        body: { action: "reorder", id: swapItem.id, sort_order: currentItem.sort_order },
        headers: { "admin-token": adminToken || "" },
      });

      const newItems = [...items];
      newItems[idx] = { ...swapItem, sort_order: currentItem.sort_order };
      newItems[swapIdx] = { ...currentItem, sort_order: swapItem.sort_order };
      newItems.sort((a, b) => a.sort_order - b.sort_order);
      setItems(newItems);
    } catch (err: any) {
      toast({ title: "Reorder failed", description: err.message, variant: "destructive" });
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
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Scrolling Gallery</h2>
          <p className="text-muted-foreground text-sm">Manage images and videos in the landing page gallery</p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Add Item
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {items.map((item, idx) => (
          <div
            key={item.id}
            className={`relative rounded-xl overflow-hidden border transition-all group ${
              item.is_visible ? "border-border" : "border-destructive/40 opacity-60"
            }`}
          >
            <div className="aspect-[3/4] bg-muted">
              {item.type === "video" ? (
                <video src={item.src_url} className="w-full h-full object-cover" muted loop autoPlay playsInline />
              ) : (
                <img src={item.src_url} alt={item.alt} className="w-full h-full object-cover" />
              )}
            </div>

            {/* Overlay controls */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" className="text-white hover:bg-white/20 h-8 w-8" onClick={() => handleReorder(item.id, "up")} disabled={idx === 0}>
                  <ArrowUp className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" className="text-white hover:bg-white/20 h-8 w-8" onClick={() => handleReorder(item.id, "down")} disabled={idx === items.length - 1}>
                  <ArrowDown className="w-4 h-4" />
                </Button>
              </div>
              <Button size="sm" variant="ghost" className="text-white hover:bg-white/20" onClick={() => handleToggleVisibility(item)}>
                {item.is_visible ? <><EyeOff className="w-4 h-4 mr-1" /> Hide</> : <><Eye className="w-4 h-4 mr-1" /> Show</>}
              </Button>
              <Button size="sm" variant="ghost" className="text-red-400 hover:bg-red-500/20" onClick={() => setDeleteItemId(item.id)}>
                <Trash2 className="w-4 h-4 mr-1" /> Delete
              </Button>
            </div>

            {/* Badges */}
            <div className="absolute top-2 left-2 flex gap-1">
              <Badge variant="secondary" className="text-[10px]">{item.type}</Badge>
              {!item.is_visible && <Badge variant="destructive" className="text-[10px]">Hidden</Badge>}
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
              <p className="text-white text-xs truncate">{item.alt || "No alt text"}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Add Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Gallery Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Upload File</Label>
              <div className="mt-1">
                <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={handleFileUpload} className="hidden" />
                <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                  {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                  {uploading ? "Uploading..." : "Choose file"}
                </Button>
              </div>
            </div>
            <div>
              <Label>Or paste URL</Label>
              <Input value={newItem.src_url} onChange={e => setNewItem(p => ({ ...p, src_url: e.target.value }))} placeholder="https://..." />
            </div>
            <div>
              <Label>Alt Text</Label>
              <Input value={newItem.alt} onChange={e => setNewItem(p => ({ ...p, alt: e.target.value }))} placeholder="Describe the image/video" />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={newItem.type} onValueChange={v => setNewItem(p => ({ ...p, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newItem.src_url && (
              <div className="rounded-lg overflow-hidden border border-border aspect-video">
                {newItem.type === "video" ? (
                  <video src={newItem.src_url} className="w-full h-full object-cover" muted autoPlay loop playsInline />
                ) : (
                  <img src={newItem.src_url} alt="Preview" className="w-full h-full object-cover" />
                )}
              </div>
            )}
            <Button className="w-full" onClick={handleAdd} disabled={!newItem.src_url}>Add to Gallery</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteItemId} onOpenChange={open => !open && setDeleteItemId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete gallery item?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove this item from the gallery.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
