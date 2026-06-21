import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/AdminLayout";
import {
  Plus, Trash2, Edit, Eye, Loader2, ArrowLeft, Image as ImageIcon,
  Copy, Settings2, X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type CaseStat = { value: string; label: string };
type CaseCategory = { id: string; name: string; slug: string; sort_order: number };

type CaseRow = {
  id: string;
  slug: string;
  client_name: string;
  subtitle: string;
  tags: string[];
  header_bg_color: string;
  client_logo_url: string | null;
  hero_image_url: string | null;
  category_id: string | null;
  case_categories?: { id: string; name: string; slug: string } | null;
  intro_text: string;
  stats: CaseStat[];
  problem_text: string;
  solution_text: string;
  comparison_left_label: string;
  comparison_left_image_url: string | null;
  comparison_right_label: string;
  comparison_right_image_url: string | null;
  quote_text: string;
  quote_attribution: string;
  key_results: string[];
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  og_image_url: string | null;
  is_published: boolean;
  published_at: string | null;
  updated_at: string;
};

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const emptyStats: CaseStat[] = [
  { value: "", label: "" },
  { value: "", label: "" },
  { value: "", label: "" },
];

const AdminCases = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [cases, setCases] = useState<CaseRow[]>([]);
  const [categories, setCategories] = useState<CaseCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editing, setEditing] = useState<CaseRow | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  // Categories manager
  const [catManagerOpen, setCatManagerOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<CaseRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state
  const [fSlug, setFSlug] = useState("");
  const [fClientName, setFClientName] = useState("");
  const [fSubtitle, setFSubtitle] = useState("");
  const [fTags, setFTags] = useState<string>("");
  const [fHeaderColor, setFHeaderColor] = useState("#1DB954");
  const [fLogo, setFLogo] = useState("");
  const [fHero, setFHero] = useState("");
  const [fCategoryId, setFCategoryId] = useState<string>("");
  const [fIntro, setFIntro] = useState("");
  const [fStats, setFStats] = useState<CaseStat[]>(emptyStats);
  const [fProblem, setFProblem] = useState("");
  const [fSolution, setFSolution] = useState("");
  const [fLeftLabel, setFLeftLabel] = useState("Before Floowy");
  const [fLeftImg, setFLeftImg] = useState("");
  const [fRightLabel, setFRightLabel] = useState("With Floowy");
  const [fRightImg, setFRightImg] = useState("");
  const [fQuote, setFQuote] = useState("");
  const [fAttribution, setFAttribution] = useState("");
  const [fKeyResults, setFKeyResults] = useState<string[]>([""]);
  const [fMetaTitle, setFMetaTitle] = useState("");
  const [fMetaDesc, setFMetaDesc] = useState("");
  const [fKeywords, setFKeywords] = useState("");
  const [fOgImage, setFOgImage] = useState("");
  const [fPublished, setFPublished] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("admin_token")) {
      navigate("/admin/login");
      return;
    }
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setIsLoading(true);
    await Promise.all([fetchCases(), fetchCategories()]);
    setIsLoading(false);
  };

  const fetchCases = async () => {
    const adminToken = localStorage.getItem("admin_token");
    const { data, error } = await supabase.functions.invoke("admin-save-case", {
      body: { action: "list" },
      headers: { "admin-token": adminToken || "" },
    });
    if (error || data?.error) {
      toast({ title: "Error", description: "Failed to load cases", variant: "destructive" });
      return;
    }
    setCases(data?.cases || []);
  };

  const fetchCategories = async () => {
    const adminToken = localStorage.getItem("admin_token");
    const { data, error } = await supabase.functions.invoke("admin-manage-case-categories", {
      body: { action: "list" },
      headers: { "admin-token": adminToken || "" },
    });
    if (error || data?.error) return;
    setCategories(data?.categories || []);
  };

  const uploadFile = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop();
    const path = `admin-uploads/cases/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("user-uploads").upload(path, file, { cacheControl: "3600" });
    if (error) throw error;
    return supabase.storage.from("user-uploads").getPublicUrl(path).data.publicUrl;
  };

  const handleUpload = async (file: File, key: string, setter: (url: string) => void) => {
    setUploadingKey(key);
    try {
      setter(await uploadFile(file));
    } catch (e) {
      toast({ title: "Upload failed", description: e instanceof Error ? e.message : "Try again", variant: "destructive" });
    } finally {
      setUploadingKey(null);
    }
  };

  const openNew = () => {
    setEditing(null);
    setFSlug(""); setFClientName(""); setFSubtitle(""); setFTags("");
    setFHeaderColor("#1DB954"); setFLogo(""); setFHero("");
    setFCategoryId(categories[0]?.id || "");
    setFIntro(""); setFStats(emptyStats); setFProblem(""); setFSolution("");
    setFLeftLabel("Before Floowy"); setFLeftImg("");
    setFRightLabel("With Floowy"); setFRightImg("");
    setFQuote(""); setFAttribution(""); setFKeyResults([""]);
    setFMetaTitle(""); setFMetaDesc(""); setFKeywords(""); setFOgImage("");
    setFPublished(false);
    setIsEditorOpen(true);
  };

  const openEdit = (c: CaseRow) => {
    setEditing(c);
    setFSlug(c.slug); setFClientName(c.client_name); setFSubtitle(c.subtitle);
    setFTags((c.tags || []).join(", "));
    setFHeaderColor(c.header_bg_color || "#1DB954");
    setFLogo(c.client_logo_url || ""); setFHero(c.hero_image_url || "");
    setFCategoryId(c.category_id || "");
    setFIntro(c.intro_text || "");
    setFStats((c.stats && c.stats.length === 3) ? c.stats : emptyStats);
    setFProblem(c.problem_text || ""); setFSolution(c.solution_text || "");
    setFLeftLabel(c.comparison_left_label || "Before Floowy");
    setFLeftImg(c.comparison_left_image_url || "");
    setFRightLabel(c.comparison_right_label || "With Floowy");
    setFRightImg(c.comparison_right_image_url || "");
    setFQuote(c.quote_text || ""); setFAttribution(c.quote_attribution || "");
    setFKeyResults(c.key_results?.length ? c.key_results : [""]);
    setFMetaTitle(c.meta_title || ""); setFMetaDesc(c.meta_description || "");
    setFKeywords(c.meta_keywords || ""); setFOgImage(c.og_image_url || "");
    setFPublished(c.is_published);
    setIsEditorOpen(true);
  };

  const handleSave = async () => {
    if (!fClientName || !fSlug) {
      toast({ title: "Missing fields", description: "Client name and slug are required", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const payload: Record<string, unknown> = {
        slug: fSlug,
        client_name: fClientName,
        subtitle: fSubtitle,
        tags: fTags.split(",").map((t) => t.trim()).filter(Boolean),
        header_bg_color: fHeaderColor,
        client_logo_url: fLogo || null,
        hero_image_url: fHero || null,
        category_id: fCategoryId || null,
        intro_text: fIntro,
        stats: fStats,
        problem_text: fProblem,
        solution_text: fSolution,
        comparison_left_label: fLeftLabel,
        comparison_left_image_url: fLeftImg || null,
        comparison_right_label: fRightLabel,
        comparison_right_image_url: fRightImg || null,
        quote_text: fQuote,
        quote_attribution: fAttribution,
        key_results: fKeyResults.filter((r) => r.trim()),
        meta_title: fMetaTitle || null,
        meta_description: fMetaDesc || null,
        meta_keywords: fKeywords || null,
        og_image_url: fOgImage || null,
        is_published: fPublished,
        published_at: fPublished ? new Date().toISOString() : null,
      };
      if (editing) (payload as Record<string, unknown>).id = editing.id;

      const adminToken = localStorage.getItem("admin_token");
      const { data, error } = await supabase.functions.invoke("admin-save-case", {
        body: payload,
        headers: { "admin-token": adminToken || "" },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message || "Save failed");
      toast({ title: editing ? "Case updated" : "Case created" });
      setIsEditorOpen(false);
      fetchCases();
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Failed to save", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const adminToken = localStorage.getItem("admin_token");
    const { data, error } = await supabase.functions.invoke("admin-save-case", {
      body: { action: "delete", id: deleteTarget.id },
      headers: { "admin-token": adminToken || "" },
    });
    setIsDeleting(false);
    if (error || data?.error) {
      toast({ title: "Error", description: "Delete failed", variant: "destructive" });
      return;
    }
    toast({ title: "Case deleted" });
    setDeleteTarget(null);
    fetchCases();
  };

  const handleDuplicate = async (id: string) => {
    const adminToken = localStorage.getItem("admin_token");
    const { data, error } = await supabase.functions.invoke("admin-save-case", {
      body: { action: "duplicate", id },
      headers: { "admin-token": adminToken || "" },
    });
    if (error || data?.error) {
      toast({ title: "Error", description: "Duplicate failed", variant: "destructive" });
      return;
    }
    toast({ title: "Case duplicated" });
    fetchCases();
  };

  const togglePublished = async (c: CaseRow) => {
    const adminToken = localStorage.getItem("admin_token");
    const { error } = await supabase.functions.invoke("admin-save-case", {
      body: {
        id: c.id,
        is_published: !c.is_published,
        published_at: !c.is_published ? new Date().toISOString() : null,
      },
      headers: { "admin-token": adminToken || "" },
    });
    if (error) {
      toast({ title: "Error", description: "Failed to update", variant: "destructive" });
      return;
    }
    fetchCases();
  };

  // Category manager
  const addCategory = async () => {
    if (!newCatName.trim()) return;
    const adminToken = localStorage.getItem("admin_token");
    const { data, error } = await supabase.functions.invoke("admin-manage-case-categories", {
      body: { action: "create", name: newCatName.trim() },
      headers: { "admin-token": adminToken || "" },
    });
    if (error || data?.error) {
      toast({ title: "Error", description: data?.error || "Failed to add", variant: "destructive" });
      return;
    }
    setNewCatName("");
    fetchCategories();
  };

  const deleteCategory = async (id: string) => {
    if (!confirm("Delete this category? Cases using it will become uncategorized.")) return;
    const adminToken = localStorage.getItem("admin_token");
    await supabase.functions.invoke("admin-manage-case-categories", {
      body: { action: "delete", id },
      headers: { "admin-token": adminToken || "" },
    });
    fetchCategories();
  };

  // ============ EDITOR ============
  if (isEditorOpen) {
    return (
      <AdminLayout>
        <div className="p-6 max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setIsEditorOpen(false)}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <h1 className="text-2xl font-bold flex-1">{editing ? "Edit Case" : "New Case"}</h1>
            <div className="flex items-center gap-3">
              <Switch checked={fPublished} onCheckedChange={setFPublished} />
              <Label className="text-sm">{fPublished ? "Published" : "Draft"}</Label>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {editing ? "Update" : "Create"}
              </Button>
            </div>
          </div>

          {/* Case Details */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="font-semibold text-lg">Case Details</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Client Name *</Label>
                  <Input value={fClientName} onChange={(e) => {
                    setFClientName(e.target.value);
                    if (!editing) setFSlug(slugify(e.target.value));
                  }} placeholder="Welhof" />
                </div>
                <div className="space-y-2">
                  <Label>URL Slug *</Label>
                  <Input value={fSlug} onChange={(e) => setFSlug(slugify(e.target.value))} placeholder="welhof" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Subtitle</Label>
                <Input value={fSubtitle} onChange={(e) => setFSubtitle(e.target.value)}
                  placeholder="Boosting conversion rates with AI…" />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tags (comma separated)</Label>
                  <Input value={fTags} onChange={(e) => setFTags(e.target.value)} placeholder="Case Study, Retail" />
                </div>
                <div className="space-y-2">
                  <Label>Industry / Category</Label>
                  <div className="flex gap-2">
                    <Select value={fCategoryId} onValueChange={setFCategoryId}>
                      <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" onClick={() => setCatManagerOpen(true)} title="Manage categories">
                      <Settings2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Header Background Color</Label>
                  <div className="flex gap-2">
                    <Input type="color" value={fHeaderColor} onChange={(e) => setFHeaderColor(e.target.value)} className="w-16 h-10 p-1" />
                    <Input value={fHeaderColor} onChange={(e) => setFHeaderColor(e.target.value)} placeholder="#1DB954" />
                  </div>
                </div>
                <ImageField label="Client Logo" url={fLogo} setUrl={setFLogo} k="logo" handleUpload={handleUpload} uploadingKey={uploadingKey} />
              </div>
              <ImageField label="Hero / Result Image" url={fHero} setUrl={setFHero} k="hero" handleUpload={handleUpload} uploadingKey={uploadingKey} />
            </CardContent>
          </Card>

          {/* SEO */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="font-semibold text-lg">SEO</h2>
              <div className="space-y-2">
                <Label>Meta Title</Label>
                <Input value={fMetaTitle} onChange={(e) => setFMetaTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Meta Description</Label>
                <Textarea value={fMetaDesc} onChange={(e) => setFMetaDesc(e.target.value)} rows={2} />
              </div>
              <div className="space-y-2">
                <Label>Keywords</Label>
                <Input value={fKeywords} onChange={(e) => setFKeywords(e.target.value)} placeholder="kw1, kw2, ..." />
              </div>
              <ImageField label="OG Image (social sharing)" url={fOgImage} setUrl={setFOgImage} k="og" handleUpload={handleUpload} uploadingKey={uploadingKey} />
            </CardContent>
          </Card>

          {/* Block 1 */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <Badge variant="outline">Block 1 — Intro Text</Badge>
              <Textarea value={fIntro} onChange={(e) => setFIntro(e.target.value)} rows={4}
                placeholder="Welhof, a fast-growing retailer…" />
            </CardContent>
          </Card>

          {/* Block 2 */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <Badge variant="outline">Block 2 — The Results (3 stats)</Badge>
              <div className="grid md:grid-cols-3 gap-4">
                {fStats.map((stat, i) => (
                  <div key={i} className="space-y-2 border rounded-md p-3">
                    <Label className="text-xs">Stat {i + 1} value</Label>
                    <Input value={stat.value} onChange={(e) => {
                      const next = [...fStats]; next[i] = { ...next[i], value: e.target.value }; setFStats(next);
                    }} placeholder="+22%" />
                    <Label className="text-xs">Label</Label>
                    <Input value={stat.label} onChange={(e) => {
                      const next = [...fStats]; next[i] = { ...next[i], label: e.target.value }; setFStats(next);
                    }} placeholder="Conversion Rate" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Block 3 */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <Badge variant="outline">Block 3 — The Problem</Badge>
              <Textarea value={fProblem} onChange={(e) => setFProblem(e.target.value)} rows={4}
                placeholder="Why the client needed Floowy…" />
            </CardContent>
          </Card>

          {/* Block 4 */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <Badge variant="outline">Block 4 — How We Achieved This</Badge>
              <Textarea value={fSolution} onChange={(e) => setFSolution(e.target.value)} rows={4}
                placeholder="Our approach…" />
            </CardContent>
          </Card>

          {/* Block 5 */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <Badge variant="outline">Block 5 — Visual Comparison</Badge>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2 border rounded-md p-3">
                  <Label className="text-xs">Left Label</Label>
                  <Input value={fLeftLabel} onChange={(e) => setFLeftLabel(e.target.value)} />
                  <ImageField label="Left Image" url={fLeftImg} setUrl={setFLeftImg} k="left" handleUpload={handleUpload} uploadingKey={uploadingKey} />
                </div>
                <div className="space-y-2 border rounded-md p-3">
                  <Label className="text-xs">Right Label</Label>
                  <Input value={fRightLabel} onChange={(e) => setFRightLabel(e.target.value)} />
                  <ImageField label="Right Image" url={fRightImg} setUrl={setFRightImg} k="right" handleUpload={handleUpload} uploadingKey={uploadingKey} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Block 6 */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <Badge variant="outline">Block 6 — Customer Quote</Badge>
              <Textarea value={fQuote} onChange={(e) => setFQuote(e.target.value)} rows={3} placeholder="Quote text…" />
              <Input value={fAttribution} onChange={(e) => setFAttribution(e.target.value)} placeholder="Name and/or role" />
            </CardContent>
          </Card>

          {/* Block 7 */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <Badge variant="outline">Block 7 — Key Results</Badge>
              {fKeyResults.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <Input value={item} onChange={(e) => {
                    const next = [...fKeyResults]; next[i] = e.target.value; setFKeyResults(next);
                  }} placeholder={`Result ${i + 1}`} />
                  <Button variant="ghost" size="icon" className="text-destructive"
                    onClick={() => setFKeyResults(fKeyResults.filter((_, idx) => idx !== i))}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => setFKeyResults([...fKeyResults, ""])}>
                <Plus className="w-3 h-3 mr-1" /> Add item
              </Button>
            </CardContent>
          </Card>

          {/* Block 8 — info only */}
          <Card>
            <CardContent className="p-6">
              <Badge variant="outline" className="mb-2">Block 8 — CTA Buttons</Badge>
              <p className="text-sm text-muted-foreground">
                Two CTA buttons (“Start for €1” and “Book a call”) render automatically on every published case page.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Categories manager dialog */}
        <Dialog open={catManagerOpen} onOpenChange={setCatManagerOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Manage Industry Categories</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="New category name" />
                <Button onClick={addCategory}><Plus className="w-4 h-4 mr-1" />Add</Button>
              </div>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {categories.map((c) => (
                  <div key={c.id} className="flex items-center justify-between border rounded-md p-2">
                    <span>{c.name} <span className="text-xs text-muted-foreground">/{c.slug}</span></span>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteCategory(c.id)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    );
  }

  // ============ LIST ============
  return (
    <AdminLayout>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Cases</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setCatManagerOpen(true)}>
              <Settings2 className="w-4 h-4 mr-2" /> Categories
            </Button>
            <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" /> Add Case</Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : cases.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg">No cases yet.</p>
            <p className="text-sm mt-1">Create your first case to get started.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cases.map((c) => (
              <Card key={c.id} className="overflow-hidden flex flex-col">
                {c.hero_image_url && (
                  <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
                    <img src={c.hero_image_url} alt={c.client_name} className="w-full h-full object-cover" />
                  </div>
                )}
                <CardContent className="p-4 flex flex-col flex-1 gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={c.is_published ? "default" : "secondary"}>{c.is_published ? "Published" : "Draft"}</Badge>
                    {c.case_categories?.name && <span className="text-xs text-muted-foreground">{c.case_categories.name}</span>}
                  </div>
                  <h3 className="font-semibold">{c.client_name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">{c.subtitle}</p>
                  <p className="text-xs text-muted-foreground mt-auto">
                    Updated {new Date(c.updated_at).toLocaleDateString()}
                  </p>
                  <div className="flex items-center gap-2 pt-2 border-t border-border flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <Switch checked={c.is_published} onCheckedChange={() => togglePublished(c)} />
                    </div>
                    {c.is_published && (
                      <Button variant="outline" size="sm" onClick={() => window.open(`/cases/${c.slug}`, "_blank")}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => openEdit(c)}><Edit className="w-4 h-4" /></Button>
                    <Button variant="outline" size="sm" onClick={() => handleDuplicate(c.id)}><Copy className="w-4 h-4" /></Button>
                    <Button variant="outline" size="sm" className="text-destructive ml-auto" onClick={() => setDeleteTarget(c)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete case?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteTarget?.client_name}</strong>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDelete(); }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Categories manager dialog (list view) */}
      <Dialog open={catManagerOpen} onOpenChange={setCatManagerOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Manage Industry Categories</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="New category name" />
              <Button onClick={addCategory}><Plus className="w-4 h-4 mr-1" />Add</Button>
            </div>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {categories.map((c) => (
                <div key={c.id} className="flex items-center justify-between border rounded-md p-2">
                  <span>{c.name} <span className="text-xs text-muted-foreground">/{c.slug}</span></span>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteCategory(c.id)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

/** Reusable image upload field */
function ImageField({
  label, url, setUrl, k, handleUpload, uploadingKey,
}: {
  label: string;
  url: string;
  setUrl: (s: string) => void;
  k: string;
  handleUpload: (file: File, key: string, setter: (url: string) => void) => Promise<void>;
  uploadingKey: string | null;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Image URL" className="flex-1" />
        <label className="cursor-pointer">
          <Button variant="outline" size="sm" asChild>
            <span>{uploadingKey === k ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}</span>
          </Button>
          <input type="file" accept="image/*" className="hidden" onChange={(e) => {
            const file = e.target.files?.[0]; if (file) handleUpload(file, k, setUrl);
          }} />
        </label>
      </div>
      {url && <img src={url} alt={label} className="w-full max-h-40 object-contain rounded-md bg-muted/30" />}
    </div>
  );
}

export default AdminCases;