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
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Category = { id: string; name: string; slug: string; sort_order: number };
type FaqItem = { question: string; answer: string };
type CaseLite = {
  id: string; slug: string; client_name: string; subtitle: string;
  hero_image_url: string | null; client_logo_url: string | null;
  category_id: string | null;
};

type IndustryPageRow = {
  id: string;
  industry_name: string;
  slug: string;
  category_id: string | null;
  case_categories?: { id: string; name: string; slug: string } | null;
  header_bg_color: string;
  hero_image_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  og_image_url: string | null;
  intro_title: string;
  intro_body: string;
  recognition_title: string;
  recognition_bullets: string[];
  solution_title: string;
  solution_body: string;
  cases_section_title: string;
  case_1_id: string | null;
  case_2_id: string | null;
  case_3_id: string | null;
  faq_section_title: string;
  faq_items: FaqItem[];
  is_published: boolean;
  published_at: string | null;
  updated_at: string;
};

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const NONE = "__none__";

const AdminIndustries = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [pages, setPages] = useState<IndustryPageRow[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cases, setCases] = useState<CaseLite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editing, setEditing] = useState<IndustryPageRow | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  const [catManagerOpen, setCatManagerOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<IndustryPageRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form
  const [fName, setFName] = useState("");
  const [fSlug, setFSlug] = useState("");
  const [fCategoryId, setFCategoryId] = useState<string>("");
  const [fHeaderColor, setFHeaderColor] = useState("#1DB954");
  const [fHero, setFHero] = useState("");
  const [fMetaTitle, setFMetaTitle] = useState("");
  const [fMetaDesc, setFMetaDesc] = useState("");
  const [fKeywords, setFKeywords] = useState("");
  const [fOgImage, setFOgImage] = useState("");
  const [fIntroTitle, setFIntroTitle] = useState("");
  const [fIntroBody, setFIntroBody] = useState("");
  const [fRecognitionTitle, setFRecognitionTitle] = useState("Sound familiar?");
  const [fBullets, setFBullets] = useState<string[]>([""]);
  const [fSolutionTitle, setFSolutionTitle] = useState("How Floowy solves this");
  const [fSolutionBody, setFSolutionBody] = useState("");
  const [fCasesTitle, setFCasesTitle] = useState("See how other brands use Floowy");
  const [fCase1, setFCase1] = useState<string>("");
  const [fCase2, setFCase2] = useState<string>("");
  const [fCase3, setFCase3] = useState<string>("");
  const [fFaqTitle, setFFaqTitle] = useState("Frequently asked questions");
  const [fFaqs, setFFaqs] = useState<FaqItem[]>([{ question: "", answer: "" }]);
  const [fPublished, setFPublished] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("admin_token")) {
      navigate("/admin/login");
      return;
    }
    fetchAll();
  }, []);

  const adminToken = () => localStorage.getItem("admin_token") || "";

  const fetchAll = async () => {
    setIsLoading(true);
    await Promise.all([fetchPages(), fetchCategories(), fetchCases()]);
    setIsLoading(false);
  };

  const fetchPages = async () => {
    const { data, error } = await supabase.functions.invoke("admin-save-industry-page", {
      body: { action: "list" },
      headers: { "admin-token": adminToken() },
    });
    if (error || data?.error) {
      toast({ title: "Error", description: "Failed to load industry pages", variant: "destructive" });
      return;
    }
    setPages(data?.pages || []);
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase.functions.invoke("admin-manage-case-categories", {
      body: { action: "list" },
      headers: { "admin-token": adminToken() },
    });
    if (error || data?.error) return;
    setCategories(data?.categories || []);
  };

  const fetchCases = async () => {
    const { data, error } = await supabase.functions.invoke("admin-save-industry-page", {
      body: { action: "list-cases" },
      headers: { "admin-token": adminToken() },
    });
    if (error || data?.error) return;
    setCases(data?.cases || []);
  };

  const uploadFile = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop();
    const path = `admin-uploads/industries/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
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

  const resetForm = () => {
    setFName(""); setFSlug(""); setFCategoryId(""); setFHeaderColor("#1DB954");
    setFHero(""); setFMetaTitle(""); setFMetaDesc(""); setFKeywords(""); setFOgImage("");
    setFIntroTitle(""); setFIntroBody("");
    setFRecognitionTitle("Sound familiar?"); setFBullets([""]);
    setFSolutionTitle("How Floowy solves this"); setFSolutionBody("");
    setFCasesTitle("See how other brands use Floowy");
    setFCase1(""); setFCase2(""); setFCase3("");
    setFFaqTitle("Frequently asked questions"); setFFaqs([{ question: "", answer: "" }]);
    setFPublished(false);
  };

  const openNew = () => {
    setEditing(null);
    resetForm();
    setIsEditorOpen(true);
  };

  const openEdit = (p: IndustryPageRow) => {
    setEditing(p);
    setFName(p.industry_name); setFSlug(p.slug);
    setFCategoryId(p.category_id || "");
    setFHeaderColor(p.header_bg_color || "#1DB954");
    setFHero(p.hero_image_url || "");
    setFMetaTitle(p.meta_title || ""); setFMetaDesc(p.meta_description || "");
    setFKeywords(p.meta_keywords || ""); setFOgImage(p.og_image_url || "");
    setFIntroTitle(p.intro_title || ""); setFIntroBody(p.intro_body || "");
    setFRecognitionTitle(p.recognition_title || "Sound familiar?");
    setFBullets(p.recognition_bullets?.length ? p.recognition_bullets : [""]);
    setFSolutionTitle(p.solution_title || "How Floowy solves this");
    setFSolutionBody(p.solution_body || "");
    setFCasesTitle(p.cases_section_title || "See how other brands use Floowy");
    setFCase1(p.case_1_id || ""); setFCase2(p.case_2_id || ""); setFCase3(p.case_3_id || "");
    setFFaqTitle(p.faq_section_title || "Frequently asked questions");
    setFFaqs(p.faq_items?.length ? p.faq_items : [{ question: "", answer: "" }]);
    setFPublished(p.is_published);
    setIsEditorOpen(true);
  };

  const handleSave = async () => {
    if (!fName || !fSlug) {
      toast({ title: "Missing fields", description: "Industry name and slug are required", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const payload: Record<string, unknown> = {
        industry_name: fName,
        slug: fSlug,
        category_id: fCategoryId || null,
        header_bg_color: fHeaderColor,
        hero_image_url: fHero || null,
        meta_title: fMetaTitle || null,
        meta_description: fMetaDesc || null,
        meta_keywords: fKeywords || null,
        og_image_url: fOgImage || null,
        intro_title: fIntroTitle,
        intro_body: fIntroBody,
        recognition_title: fRecognitionTitle,
        recognition_bullets: fBullets.map((b) => b.trim()).filter(Boolean),
        solution_title: fSolutionTitle,
        solution_body: fSolutionBody,
        cases_section_title: fCasesTitle,
        case_1_id: fCase1 || null,
        case_2_id: fCase2 || null,
        case_3_id: fCase3 || null,
        faq_section_title: fFaqTitle,
        faq_items: fFaqs.filter((f) => f.question.trim() || f.answer.trim()),
        is_published: fPublished,
        published_at: fPublished ? new Date().toISOString() : null,
      };
      if (editing) (payload as Record<string, unknown>).id = editing.id;

      const { data, error } = await supabase.functions.invoke("admin-save-industry-page", {
        body: payload,
        headers: { "admin-token": adminToken() },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message || "Save failed");
      toast({ title: editing ? "Industry page updated" : "Industry page created" });
      setIsEditorOpen(false);
      fetchPages();
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Failed to save", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const { data, error } = await supabase.functions.invoke("admin-save-industry-page", {
      body: { action: "delete", id: deleteTarget.id },
      headers: { "admin-token": adminToken() },
    });
    setIsDeleting(false);
    if (error || data?.error) {
      toast({ title: "Error", description: "Delete failed", variant: "destructive" });
      return;
    }
    toast({ title: "Industry page deleted" });
    setDeleteTarget(null);
    fetchPages();
  };

  const handleDuplicate = async (id: string) => {
    const { data, error } = await supabase.functions.invoke("admin-save-industry-page", {
      body: { action: "duplicate", id },
      headers: { "admin-token": adminToken() },
    });
    if (error || data?.error) {
      toast({ title: "Error", description: "Duplicate failed", variant: "destructive" });
      return;
    }
    toast({ title: "Industry page duplicated" });
    fetchPages();
  };

  const togglePublished = async (p: IndustryPageRow) => {
    const { error } = await supabase.functions.invoke("admin-save-industry-page", {
      body: {
        id: p.id,
        is_published: !p.is_published,
        published_at: !p.is_published ? new Date().toISOString() : null,
      },
      headers: { "admin-token": adminToken() },
    });
    if (error) {
      toast({ title: "Error", description: "Failed to update", variant: "destructive" });
      return;
    }
    fetchPages();
  };

  const addCategory = async () => {
    if (!newCatName.trim()) return;
    const { data, error } = await supabase.functions.invoke("admin-manage-case-categories", {
      body: { action: "create", name: newCatName.trim() },
      headers: { "admin-token": adminToken() },
    });
    if (error || data?.error) {
      toast({ title: "Error", description: data?.error || "Failed to add", variant: "destructive" });
      return;
    }
    setNewCatName("");
    fetchCategories();
  };

  const deleteCategory = async (id: string) => {
    const used = pages.some((p) => p.category_id === id);
    if (used && !confirm("This industry is used by industry pages. They will become uncategorized. Continue?")) return;
    if (!used && !confirm("Delete this industry?")) return;
    await supabase.functions.invoke("admin-manage-case-categories", {
      body: { action: "delete", id },
      headers: { "admin-token": adminToken() },
    });
    fetchCategories();
  };

  // Suggested cases for dropdowns: same category first, then all others
  const orderedCases = (() => {
    if (!fCategoryId) return cases;
    const matching = cases.filter((c) => c.category_id === fCategoryId);
    const others = cases.filter((c) => c.category_id !== fCategoryId);
    return [...matching, ...others];
  })();

  const renderCaseSelect = (value: string, setter: (v: string) => void, label: string) => (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>
      <Select value={value || NONE} onValueChange={(v) => setter(v === NONE ? "" : v)}>
        <SelectTrigger><SelectValue placeholder="Select a case" /></SelectTrigger>
        <SelectContent className="max-h-72">
          <SelectItem value={NONE}>— None —</SelectItem>
          {orderedCases.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.client_name}
              {fCategoryId && c.category_id === fCategoryId ? "  ★" : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  // ============ EDITOR ============
  if (isEditorOpen) {
    return (
      <AdminLayout>
        <div className="p-6 max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setIsEditorOpen(false)}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <h1 className="text-2xl font-bold flex-1">{editing ? "Edit Industry Page" : "New Industry Page"}</h1>
            <div className="flex items-center gap-3">
              <Switch checked={fPublished} onCheckedChange={setFPublished} />
              <Label className="text-sm">{fPublished ? "Published" : "Draft"}</Label>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {editing ? "Update" : "Create"}
              </Button>
            </div>
          </div>

          {/* Industry Page Details */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="font-semibold text-lg">Industry Page Details</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Industry Name *</Label>
                  <Input value={fName} onChange={(e) => {
                    setFName(e.target.value);
                    if (!editing) setFSlug(slugify(e.target.value));
                  }} placeholder="Fashion" />
                </div>
                <div className="space-y-2">
                  <Label>URL Slug *</Label>
                  <Input value={fSlug} onChange={(e) => setFSlug(slugify(e.target.value))} placeholder="fashion" />
                  <p className="text-xs text-muted-foreground">Page URL: /industries/{fSlug || "..."}</p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Industry Category</Label>
                  <div className="flex gap-2">
                    <Select value={fCategoryId || NONE} onValueChange={(v) => setFCategoryId(v === NONE ? "" : v)}>
                      <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>— None —</SelectItem>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" onClick={() => setCatManagerOpen(true)} title="Manage industries">
                      <Settings2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Header Background Color</Label>
                  <div className="flex gap-2">
                    <Input type="color" value={fHeaderColor} onChange={(e) => setFHeaderColor(e.target.value)} className="w-16 h-10 p-1" />
                    <Input value={fHeaderColor} onChange={(e) => setFHeaderColor(e.target.value)} placeholder="#1DB954" />
                  </div>
                </div>
              </div>
              <ImageField label="Hero / Header Image" url={fHero} setUrl={setFHero} k="hero" handleUpload={handleUpload} uploadingKey={uploadingKey} />
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

          {/* Block 1 — Intro */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <Badge variant="outline">Block 1 — Intro</Badge>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={fIntroTitle} onChange={(e) => setFIntroTitle(e.target.value)}
                  placeholder="AI-powered visuals for fashion brands that move fast." />
              </div>
              <div className="space-y-2">
                <Label>Body</Label>
                <Textarea value={fIntroBody} onChange={(e) => setFIntroBody(e.target.value)} rows={5}
                  placeholder="Every season brings new collections..." />
              </div>
            </CardContent>
          </Card>

          {/* Block 2 — Recognition */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <Badge variant="outline">Block 2 — Recognition (4–6 bullets)</Badge>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={fRecognitionTitle} onChange={(e) => setFRecognitionTitle(e.target.value)} />
              </div>
              {fBullets.map((b, i) => (
                <div key={i} className="flex gap-2">
                  <Input value={b} onChange={(e) => {
                    const next = [...fBullets]; next[i] = e.target.value; setFBullets(next);
                  }} placeholder={`Pain point ${i + 1}`} />
                  <Button variant="ghost" size="icon" className="text-destructive"
                    onClick={() => setFBullets(fBullets.filter((_, idx) => idx !== i))}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => setFBullets([...fBullets, ""])}>
                <Plus className="w-3 h-3 mr-1" /> Add bullet
              </Button>
            </CardContent>
          </Card>

          {/* Block 3 — Solution */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <Badge variant="outline">Block 3 — Solution</Badge>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={fSolutionTitle} onChange={(e) => setFSolutionTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Body</Label>
                <Textarea value={fSolutionBody} onChange={(e) => setFSolutionBody(e.target.value)} rows={5} />
              </div>
            </CardContent>
          </Card>

          {/* Block 4 — Case Reference */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <Badge variant="outline">Block 4 — Case Reference (3 cases)</Badge>
              <div className="space-y-2">
                <Label>Section Title</Label>
                <Input value={fCasesTitle} onChange={(e) => setFCasesTitle(e.target.value)} />
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="border rounded-md p-3">{renderCaseSelect(fCase1, setFCase1, "Card 1")}</div>
                <div className="border rounded-md p-3">{renderCaseSelect(fCase2, setFCase2, "Card 2")}</div>
                <div className="border rounded-md p-3">{renderCaseSelect(fCase3, setFCase3, "Card 3")}</div>
              </div>
              <p className="text-xs text-muted-foreground">★ marks cases tagged with the selected industry. Live data (image, stat, logo) is pulled from the linked case.</p>
            </CardContent>
          </Card>

          {/* Block 5 — FAQ */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <Badge variant="outline">Block 5 — FAQ (8–10 recommended)</Badge>
              <div className="space-y-2">
                <Label>Section Title</Label>
                <Input value={fFaqTitle} onChange={(e) => setFFaqTitle(e.target.value)} />
              </div>
              {fFaqs.map((f, i) => (
                <div key={i} className="space-y-2 border rounded-md p-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">FAQ {i + 1}</Label>
                    <Button variant="ghost" size="icon" className="text-destructive h-7 w-7"
                      onClick={() => setFFaqs(fFaqs.filter((_, idx) => idx !== i))}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <Input value={f.question} onChange={(e) => {
                    const next = [...fFaqs]; next[i] = { ...next[i], question: e.target.value }; setFFaqs(next);
                  }} placeholder="Question" />
                  <Textarea value={f.answer} onChange={(e) => {
                    const next = [...fFaqs]; next[i] = { ...next[i], answer: e.target.value }; setFFaqs(next);
                  }} placeholder="Answer" rows={3} />
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => setFFaqs([...fFaqs, { question: "", answer: "" }])}>
                <Plus className="w-3 h-3 mr-1" /> Add FAQ
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Industries (categories) manager dialog */}
        <Dialog open={catManagerOpen} onOpenChange={setCatManagerOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Manage Industries</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Shared with the Cases module. Changes here affect both modules.
              </p>
              <div className="flex gap-2">
                <Input value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="New industry name" />
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
          <h1 className="text-3xl font-bold">Industry Pages</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setCatManagerOpen(true)}>
              <Settings2 className="w-4 h-4 mr-2" /> Industries
            </Button>
            <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" /> Add Industry Page</Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : pages.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg">No industry pages yet.</p>
            <p className="text-sm mt-1">Create your first industry page to get started.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {pages.map((p) => (
              <Card key={p.id} className="overflow-hidden flex flex-col">
                {p.hero_image_url && (
                  <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
                    <img src={p.hero_image_url} alt={p.industry_name} className="w-full h-full object-cover" />
                  </div>
                )}
                <CardContent className="p-4 flex flex-col flex-1 gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={p.is_published ? "default" : "secondary"}>{p.is_published ? "Published" : "Draft"}</Badge>
                    {p.case_categories?.name && <span className="text-xs text-muted-foreground">{p.case_categories.name}</span>}
                  </div>
                  <h3 className="font-semibold">{p.industry_name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">/industries/{p.slug}</p>
                  <p className="text-xs text-muted-foreground mt-auto">
                    Updated {new Date(p.updated_at).toLocaleDateString()}
                  </p>
                  <div className="flex items-center gap-2 pt-2 border-t border-border flex-wrap">
                    <Switch checked={p.is_published} onCheckedChange={() => togglePublished(p)} />
                    {p.is_published && (
                      <Button variant="outline" size="sm" onClick={() => window.open(`/industries/${p.slug}`, "_blank")}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => openEdit(p)}><Edit className="w-4 h-4" /></Button>
                    <Button variant="outline" size="sm" onClick={() => handleDuplicate(p.id)}><Copy className="w-4 h-4" /></Button>
                    <Button variant="outline" size="sm" className="text-destructive ml-auto" onClick={() => setDeleteTarget(p)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete industry page?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteTarget?.industry_name}</strong>. This action cannot be undone.
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

      <Dialog open={catManagerOpen} onOpenChange={setCatManagerOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Manage Industries</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Shared with the Cases module. Changes here affect both modules.
            </p>
            <div className="flex gap-2">
              <Input value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="New industry name" />
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

export default AdminIndustries;