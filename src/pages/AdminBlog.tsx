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
import { Plus, Trash2, ArrowUp, ArrowDown, Eye, Edit, Image, Type, List, Loader2, ArrowLeft, Sparkles, Upload, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ContentBlock = {
  type: "heading" | "paragraph" | "image" | "benefits" | "before-after";
  headingText?: string;
  headingHighlight?: string;
  text?: string;
  imageUrl?: string;
  imageAlt?: string;
  items?: string[];
  beforeImageUrl?: string;
  beforeLabel?: string;
  afterImageUrl?: string;
  afterLabel?: string;
};

type BlogPost = {
  id: string;
  slug: string;
  title: string;
  title_highlight: string | null;
  excerpt: string;
  category: string;
  cover_image_url: string;
  published_at: string | null;
  is_published: boolean;
  content_blocks: ContentBlock[];
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  created_at: string;
};

const CATEGORIES = ["Visual Marketing", "Fashion Technology", "AI Technology", "Marketing Strategy"];

const AdminBlog = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);

  // AI generator state
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [rawContent, setRawContent] = useState("");
  const [uploadedImages, setUploadedImages] = useState<{ file: File; url: string; preview: string }[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  // Editor form state
  const [formTitle, setFormTitle] = useState("");
  const [formTitleHighlight, setFormTitleHighlight] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formExcerpt, setFormExcerpt] = useState("");
  const [formCategory, setFormCategory] = useState("Visual Marketing");
  const [formCoverUrl, setFormCoverUrl] = useState("");
  const [formIsPublished, setFormIsPublished] = useState(false);
  const [formMetaTitle, setFormMetaTitle] = useState("");
  const [formMetaDesc, setFormMetaDesc] = useState("");
  const [formMetaKeywords, setFormMetaKeywords] = useState("");
  const [formBlocks, setFormBlocks] = useState<ContentBlock[]>([]);

  useEffect(() => {
    const adminToken = localStorage.getItem('admin_token');
    if (!adminToken) {
      navigate("/admin/login");
      return;
    }
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const adminToken = localStorage.getItem('admin_token');
      const { data, error } = await supabase.functions.invoke('admin-save-blog-post', {
        body: { action: 'list' },
        headers: { 'admin-token': adminToken || '' },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setPosts((data?.posts as any[]) || []);
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast({ title: "Error", description: "Failed to load blog posts", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  // Image upload helper
  const uploadImageFile = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop();
    const fileName = `blog/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    
    const { data, error } = await supabase.storage
      .from("user-uploads")
      .upload(`admin-uploads/${fileName}`, file, { cacheControl: "3600", upsert: false });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from("user-uploads")
      .getPublicUrl(`admin-uploads/${fileName}`);

    return urlData.publicUrl;
  };

  const handleImageUpload = async (file: File, callback: (url: string) => void, blockId?: string) => {
    setUploadingImage(blockId || "cover");
    try {
      const url = await uploadImageFile(file);
      callback(url);
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setUploadingImage(null);
    }
  };

  // AI Generator functions
  const handleAddImages = (files: FileList) => {
    const newImages = Array.from(files).map(file => ({
      file,
      url: "",
      preview: URL.createObjectURL(file),
    }));
    setUploadedImages(prev => [...prev, ...newImages]);
  };

  const removeUploadedImage = (index: number) => {
    setUploadedImages(prev => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleGenerate = async () => {
    if (!rawContent.trim()) {
      toast({ title: "Content required", description: "Please paste your blog content first.", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    try {
      // Upload all images first
      let imageUrls: string[] = [];
      if (uploadedImages.length > 0) {
        setIsUploading(true);
        toast({ title: "Uploading images...", description: `Uploading ${uploadedImages.length} images` });
        
        imageUrls = await Promise.all(
          uploadedImages.map(async (img) => {
            if (img.url) return img.url;
            return await uploadImageFile(img.file);
          })
        );
        
        // Update state with uploaded URLs
        setUploadedImages(prev => prev.map((img, i) => ({ ...img, url: imageUrls[i] })));
        setIsUploading(false);
      }

      toast({ title: "Generating blog post...", description: "AI is designing your blog post layout" });

      const { data, error } = await supabase.functions.invoke('generate-blog-post', {
        body: { content: rawContent, imageUrls },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Populate editor with AI results
      setFormTitle(data.title || "");
      setFormTitleHighlight(data.title_highlight || "");
      setFormSlug(data.slug || "");
      setFormExcerpt(data.excerpt || "");
      setFormCategory(data.category || "Visual Marketing");
      setFormCoverUrl(data.cover_image_url || (imageUrls.length > 0 ? imageUrls[0] : ""));
      setFormMetaTitle(data.meta_title || "");
      setFormMetaDesc(data.meta_description || "");
      setFormMetaKeywords(data.meta_keywords || "");
      setFormBlocks(data.content_blocks || []);
      setFormIsPublished(false);

      setIsGeneratorOpen(false);
      setEditingPost(null);
      setIsEditorOpen(true);

      toast({ title: "Blog post generated!", description: "Review and edit the generated post, then publish when ready." });
    } catch (error: any) {
      console.error("Generation error:", error);
      toast({ title: "Generation failed", description: error.message || "Failed to generate blog post", variant: "destructive" });
    } finally {
      setIsGenerating(false);
      setIsUploading(false);
    }
  };

  const openNewPost = () => {
    setEditingPost(null);
    setFormTitle("");
    setFormTitleHighlight("");
    setFormSlug("");
    setFormExcerpt("");
    setFormCategory("Visual Marketing");
    setFormCoverUrl("");
    setFormIsPublished(false);
    setFormMetaTitle("");
    setFormMetaDesc("");
    setFormMetaKeywords("");
    setFormBlocks([]);
    setIsEditorOpen(true);
  };

  const openEditPost = (post: BlogPost) => {
    setEditingPost(post);
    setFormTitle(post.title);
    setFormTitleHighlight(post.title_highlight || "");
    setFormSlug(post.slug);
    setFormExcerpt(post.excerpt);
    setFormCategory(post.category);
    setFormCoverUrl(post.cover_image_url);
    setFormIsPublished(post.is_published);
    setFormMetaTitle(post.meta_title || "");
    setFormMetaDesc(post.meta_description || "");
    setFormMetaKeywords(post.meta_keywords || "");
    setFormBlocks(post.content_blocks || []);
    setIsEditorOpen(true);
  };

  const handleSave = async () => {
    if (!formTitle || !formSlug || !formExcerpt || !formCoverUrl) {
      toast({ title: "Missing fields", description: "Title, slug, excerpt, and cover image are required.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const adminToken = localStorage.getItem('admin_token');
      const postData: any = {
        title: formTitle,
        title_highlight: formTitleHighlight || null,
        slug: formSlug,
        excerpt: formExcerpt,
        category: formCategory,
        cover_image_url: formCoverUrl,
        is_published: formIsPublished,
        published_at: formIsPublished ? new Date().toISOString() : null,
        content_blocks: formBlocks as any,
        meta_title: formMetaTitle || null,
        meta_description: formMetaDesc || null,
        meta_keywords: formMetaKeywords || null,
      };

      if (editingPost) {
        postData.id = editingPost.id;
      }

      const { data, error } = await supabase.functions.invoke('admin-save-blog-post', {
        body: postData,
        headers: { 'admin-token': adminToken || '' },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: editingPost ? "Post updated" : "Post created" });

      setIsEditorOpen(false);
      fetchPosts();
    } catch (error: any) {
      console.error("Error saving post:", error);
      toast({ title: "Error", description: error.message || "Failed to save post", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const adminToken = localStorage.getItem('admin_token');
      const { data, error } = await supabase.functions.invoke('admin-save-blog-post', {
        body: { action: 'delete', id },
        headers: { 'admin-token': adminToken || '' },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "Post deleted" });
      fetchPosts();
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete post", variant: "destructive" });
    }
  };

  // Block management
  const addBlock = (type: ContentBlock["type"]) => {
    const newBlock: ContentBlock = { type };
    if (type === "heading") { newBlock.headingText = ""; newBlock.headingHighlight = ""; }
    if (type === "paragraph") { newBlock.text = ""; }
    if (type === "image") { newBlock.imageUrl = ""; newBlock.imageAlt = ""; }
    if (type === "benefits") { newBlock.items = [""]; }
    if (type === "before-after") { newBlock.beforeImageUrl = ""; newBlock.beforeLabel = "Before"; newBlock.afterImageUrl = ""; newBlock.afterLabel = "After"; }
    setFormBlocks([...formBlocks, newBlock]);
  };

  const updateBlock = (index: number, updates: Partial<ContentBlock>) => {
    const updated = [...formBlocks];
    updated[index] = { ...updated[index], ...updates };
    setFormBlocks(updated);
  };

  const removeBlock = (index: number) => {
    setFormBlocks(formBlocks.filter((_, i) => i !== index));
  };

  const moveBlock = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= formBlocks.length) return;
    const updated = [...formBlocks];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setFormBlocks(updated);
  };

  const addBenefitItem = (blockIndex: number) => {
    const updated = [...formBlocks];
    updated[blockIndex].items = [...(updated[blockIndex].items || []), ""];
    setFormBlocks(updated);
  };

  const updateBenefitItem = (blockIndex: number, itemIndex: number, value: string) => {
    const updated = [...formBlocks];
    if (updated[blockIndex].items) {
      updated[blockIndex].items![itemIndex] = value;
      setFormBlocks(updated);
    }
  };

  const removeBenefitItem = (blockIndex: number, itemIndex: number) => {
    const updated = [...formBlocks];
    updated[blockIndex].items = updated[blockIndex].items?.filter((_, i) => i !== itemIndex);
    setFormBlocks(updated);
  };

  // AI Generator View
  if (isGeneratorOpen) {
    return (
      <AdminLayout>
        <div className="p-6 max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="sm" onClick={() => setIsGeneratorOpen(false)}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <h1 className="text-2xl font-bold flex-1 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              AI Blog Post Generator
            </h1>
          </div>

          <div className="space-y-6">
            {/* Raw Content Input */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label className="text-lg font-semibold">Blog Content</Label>
                  <p className="text-sm text-muted-foreground">
                    Paste your full blog content below. The AI will automatically structure it into headings, paragraphs, benefit lists, and more — matching Floowy's blog style.
                  </p>
                </div>
                <Textarea
                  value={rawContent}
                  onChange={(e) => setRawContent(e.target.value)}
                  placeholder="Paste your entire blog content here... Include all the text, key points, benefits, comparisons, etc. The AI will organize it into a beautiful blog post."
                  rows={16}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground text-right">
                  {rawContent.length} characters
                </p>
              </CardContent>
            </Card>

            {/* Image Uploads */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label className="text-lg font-semibold">Images</Label>
                  <p className="text-sm text-muted-foreground">
                    Upload images to include in the blog post. The AI will decide where to place them for maximum impact.
                  </p>
                </div>

                {/* Upload area */}
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors bg-muted/20">
                  <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Click to upload images</span>
                  <span className="text-xs text-muted-foreground mt-1">PNG, JPG, WebP supported</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => e.target.files && handleAddImages(e.target.files)}
                  />
                </label>

                {/* Uploaded images preview */}
                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {uploadedImages.map((img, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={img.preview}
                          alt={`Upload ${index + 1}`}
                          className="w-full aspect-square object-cover rounded-lg border border-border"
                        />
                        <button
                          onClick={() => removeUploadedImage(index)}
                          className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <span className="absolute bottom-1 left-1 bg-background/80 text-xs px-1.5 py-0.5 rounded">
                          #{index + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !rawContent.trim()}
              className="w-full h-14 text-lg font-semibold"
              size="lg"
            >
              {isGenerating ? (
                <span className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {isUploading ? "Uploading images..." : "AI is designing your post..."}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Generate Blog Post
                </span>
              )}
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Post list view
  if (!isEditorOpen) {
    return (
      <AdminLayout>
        <div className="p-6 max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">Blog Posts</h1>
            <div className="flex items-center gap-3">
              <Button onClick={() => {
                setRawContent("");
                setUploadedImages([]);
                setIsGeneratorOpen(true);
              }}>
                <Sparkles className="w-4 h-4 mr-2" />
                AI Generate
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <p className="text-lg">No blog posts yet.</p>
              <p className="text-sm mt-1">Create your first post to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <Card key={post.id} className="overflow-hidden flex flex-col">
                  {post.cover_image_url && (
                    <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
                      <img
                        src={post.cover_image_url}
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardContent className="p-4 flex flex-col flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={post.is_published ? "default" : "secondary"} className="text-xs">
                        {post.is_published ? "Published" : "Draft"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{post.category}</span>
                    </div>
                    <h3 className="font-semibold line-clamp-2 mb-1">{post.title} {post.title_highlight && <span className="text-primary">{post.title_highlight}</span>}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-4">{post.excerpt}</p>
                    <div className="flex items-center gap-2 mt-auto pt-2 border-t border-border">
                      {post.is_published && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`/blog/${post.slug}`, "_blank")}
                        >
                          <Eye className="w-4 h-4 mr-1" /> View
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => openEditPost(post)}>
                        <Edit className="w-4 h-4 mr-1" /> Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive ml-auto"
                        onClick={() => handleDelete(post.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </AdminLayout>
    );
  }

  // Editor view
  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" onClick={() => setIsEditorOpen(false)}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <h1 className="text-2xl font-bold flex-1">
            {editingPost ? "Edit Post" : "New Post"}
          </h1>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch checked={formIsPublished} onCheckedChange={setFormIsPublished} />
              <Label className="text-sm">{formIsPublished ? "Published" : "Draft"}</Label>
            </div>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {editingPost ? "Update" : "Create"}
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="font-semibold text-lg">Post Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Title (plain part)</Label>
                  <Input
                    value={formTitle}
                    onChange={(e) => {
                      setFormTitle(e.target.value);
                      if (!editingPost) setFormSlug(generateSlug(e.target.value));
                    }}
                    placeholder="The power of"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Title (gradient highlight)</Label>
                  <Input
                    value={formTitleHighlight}
                    onChange={(e) => setFormTitleHighlight(e.target.value)}
                    placeholder="AI-Generated Photos"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>URL Slug</Label>
                  <Input
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    placeholder="ai-generated-photos"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={formCategory} onValueChange={setFormCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Excerpt</Label>
                <Textarea
                  value={formExcerpt}
                  onChange={(e) => setFormExcerpt(e.target.value)}
                  placeholder="Short description shown on the blog listing..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Cover Image</Label>
                <div className="flex items-center gap-3">
                  <Input
                    value={formCoverUrl}
                    onChange={(e) => setFormCoverUrl(e.target.value)}
                    placeholder="Image URL or upload..."
                    className="flex-1"
                  />
                  <label className="cursor-pointer">
                    <Button variant="outline" size="sm" asChild>
                      <span>
                        {uploadingImage === "cover" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Image className="w-4 h-4" />}
                      </span>
                    </Button>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file, (url) => setFormCoverUrl(url));
                      }}
                    />
                  </label>
                </div>
                {formCoverUrl && (
                  <img src={formCoverUrl} alt="Cover preview" className="w-full max-h-48 object-contain rounded-lg mt-2 bg-muted/30" />
                )}
              </div>
            </CardContent>
          </Card>

          {/* SEO */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="font-semibold text-lg">SEO</h2>
              <div className="space-y-2">
                <Label>Meta Title</Label>
                <Input value={formMetaTitle} onChange={(e) => setFormMetaTitle(e.target.value)} placeholder="Page title for SEO" />
              </div>
              <div className="space-y-2">
                <Label>Meta Description</Label>
                <Textarea value={formMetaDesc} onChange={(e) => setFormMetaDesc(e.target.value)} placeholder="SEO description" rows={2} />
              </div>
              <div className="space-y-2">
                <Label>Keywords</Label>
                <Input value={formMetaKeywords} onChange={(e) => setFormMetaKeywords(e.target.value)} placeholder="keyword1, keyword2, ..." />
              </div>
            </CardContent>
          </Card>

          {/* Content Blocks */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="font-semibold text-lg">Content Blocks</h2>

              {formBlocks.map((block, index) => (
                <div key={index} className="border border-border rounded-lg p-4 space-y-3 relative">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="capitalize">{block.type}</Badge>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveBlock(index, -1)} disabled={index === 0}>
                        <ArrowUp className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveBlock(index, 1)} disabled={index === formBlocks.length - 1}>
                        <ArrowDown className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeBlock(index)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {block.type === "heading" && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Plain text</Label>
                        <Input value={block.headingText || ""} onChange={(e) => updateBlock(index, { headingText: e.target.value })} placeholder="How" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Gradient text</Label>
                        <Input value={block.headingHighlight || ""} onChange={(e) => updateBlock(index, { headingHighlight: e.target.value })} placeholder="AI changes everything" />
                      </div>
                    </div>
                  )}

                  {block.type === "paragraph" && (
                    <Textarea
                      value={block.text || ""}
                      onChange={(e) => updateBlock(index, { text: e.target.value })}
                      placeholder="Paragraph text..."
                      rows={4}
                    />
                  )}

                  {block.type === "image" && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Input
                          value={block.imageUrl || ""}
                          onChange={(e) => updateBlock(index, { imageUrl: e.target.value })}
                          placeholder="Image URL"
                          className="flex-1"
                        />
                        <label className="cursor-pointer">
                          <Button variant="outline" size="sm" asChild>
                            <span>
                              {uploadingImage === `block-${index}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Image className="w-4 h-4" />}
                            </span>
                          </Button>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageUpload(file, (url) => updateBlock(index, { imageUrl: url }), `block-${index}`);
                            }}
                          />
                        </label>
                      </div>
                      <Input
                        value={block.imageAlt || ""}
                        onChange={(e) => updateBlock(index, { imageAlt: e.target.value })}
                        placeholder="Alt text"
                      />
                      {block.imageUrl && (
                        <img src={block.imageUrl} alt={block.imageAlt} className="w-full max-h-48 rounded-md object-contain bg-muted/30" />
                      )}
                    </div>
                  )}

                  {block.type === "benefits" && (
                    <div className="space-y-2">
                      {(block.items || []).map((item, itemIdx) => (
                        <div key={itemIdx} className="flex items-center gap-2">
                          <Input
                            value={item}
                            onChange={(e) => updateBenefitItem(index, itemIdx, e.target.value)}
                            placeholder={`Benefit ${itemIdx + 1}`}
                            className="flex-1"
                          />
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeBenefitItem(index, itemIdx)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={() => addBenefitItem(index)}>
                        <Plus className="w-3 h-3 mr-1" />
                        Add item
                      </Button>
                    </div>
                  )}

                  {block.type === "before-after" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs">Before Image</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            value={block.beforeImageUrl || ""}
                            onChange={(e) => updateBlock(index, { beforeImageUrl: e.target.value })}
                            placeholder="Before URL"
                            className="flex-1"
                          />
                          <label className="cursor-pointer">
                            <Button variant="outline" size="sm" asChild>
                              <span>
                                {uploadingImage === `before-${index}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Image className="w-4 h-4" />}
                              </span>
                            </Button>
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageUpload(file, (url) => updateBlock(index, { beforeImageUrl: url }), `before-${index}`);
                            }} />
                          </label>
                        </div>
                        <Input value={block.beforeLabel || ""} onChange={(e) => updateBlock(index, { beforeLabel: e.target.value })} placeholder="Before label" />
                        {block.beforeImageUrl && <img src={block.beforeImageUrl} className="w-full max-h-32 rounded-md object-contain bg-muted/30" />}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">After Image</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            value={block.afterImageUrl || ""}
                            onChange={(e) => updateBlock(index, { afterImageUrl: e.target.value })}
                            placeholder="After URL"
                            className="flex-1"
                          />
                          <label className="cursor-pointer">
                            <Button variant="outline" size="sm" asChild>
                              <span>
                                {uploadingImage === `after-${index}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Image className="w-4 h-4" />}
                              </span>
                            </Button>
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageUpload(file, (url) => updateBlock(index, { afterImageUrl: url }), `after-${index}`);
                            }} />
                          </label>
                        </div>
                        <Input value={block.afterLabel || ""} onChange={(e) => updateBlock(index, { afterLabel: e.target.value })} placeholder="After label" />
                        {block.afterImageUrl && <img src={block.afterImageUrl} className="w-full max-h-32 rounded-md object-contain bg-muted/30" />}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Add block buttons */}
              <div className="flex flex-wrap gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => addBlock("heading")}>
                  <Type className="w-3 h-3 mr-1" /> Heading
                </Button>
                <Button variant="outline" size="sm" onClick={() => addBlock("paragraph")}>
                  <Type className="w-3 h-3 mr-1" /> Paragraph
                </Button>
                <Button variant="outline" size="sm" onClick={() => addBlock("image")}>
                  <Image className="w-3 h-3 mr-1" /> Image
                </Button>
                <Button variant="outline" size="sm" onClick={() => addBlock("benefits")}>
                  <List className="w-3 h-3 mr-1" /> Benefits List
                </Button>
                <Button variant="outline" size="sm" onClick={() => addBlock("before-after")}>
                  <Image className="w-3 h-3 mr-1" /> Before/After
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminBlog;
