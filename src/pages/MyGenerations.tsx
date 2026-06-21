import { useEffect, useState } from "react";
import { LoadingState } from "@/components/LoadingState";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Clock, Download, Pencil, ChevronLeft, ChevronRight, Globe, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import BackendLayout from "@/components/BackendLayout";
import PageMeta from "@/components/PageMeta";
import ImageEditModal from "@/components/ImageEditModal";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { GenerationsTour } from "@/components/GenerationsTour";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { UnlockDialog } from "@/components/UnlockDialog";
import { applyWatermarkIfFree } from "@/lib/watermark";

const MyGenerations = () => {
  const [user, setUser] = useState<any>(null);
  const [generations, setGenerations] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [editingImageUrl, setEditingImageUrl] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingGenId, setEditingGenId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const itemsPerPage = 20;
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useAdminCheck();
  const { isPaid } = useSubscriptionStatus();
  const canExport = isPaid || isAdmin;
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [watermarkedUrls, setWatermarkedUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
    });
  }, [navigate]);

  useEffect(() => {
    if (user?.id) fetchGenerations();
  }, [user?.id, currentPage]);

  // For free users, lazily fetch watermarked variants for visible generations
  useEffect(() => {
    if (canExport) return;
    generations.forEach((g) => {
      const url = g.generated_image_url;
      if (!url) return;
      if (isVideoUrl(url)) return; // skip videos
      if (watermarkedUrls[url]) return;
      applyWatermarkIfFree(url, g.id).then((wm) => {
        if (wm) setWatermarkedUrls((prev) => ({ ...prev, [url]: wm }));
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generations, canExport]);

  const displayUrl = (clean: string | null | undefined) => {
    if (!clean) return clean ?? "";
    if (canExport) return clean;
    if (isVideoUrl(clean)) return clean;
    return watermarkedUrls[clean] ?? clean;
  };

  const fetchGenerations = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    const from = (currentPage - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;

    const { count } = await supabase
      .from("generations")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "completed");

    if (count !== null) setTotalPages(Math.ceil(count / itemsPerPage));

    const { data } = await supabase
      .from("generations")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .range(from, to);

    if (data) setGenerations(data);
    setIsLoading(false);
  };

  const togglePublic = async (genId: string, currentPublic: boolean) => {
    const { error } = await supabase
      .from("generations")
      .update({ is_public: !currentPublic })
      .eq("id", genId);

    if (!error) {
      setGenerations(prev =>
        prev.map(g => g.id === genId ? { ...g, is_public: !currentPublic } : g)
      );
      toast({
        title: !currentPublic ? "Published to Community" : "Set to Private",
        description: !currentPublic
          ? "Your creation is now visible in the Community gallery"
          : "Your creation is now private",
      });
    }
  };

  const isVideoUrl = (url: string) =>
    url?.includes(".mp4") || url?.includes(".webm") || url?.includes(".mov");

  const handleDownload = async (url: string, id: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `floowy-${id}.${isVideoUrl(url) ? "mp4" : "jpg"}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, "_blank");
    }
  };

  return (
    <BackendLayout>
      <PageMeta title="My Generations | Floowy.ai" description="View and manage all your AI-generated content" canonicalUrl="https://floowy.ai/my-generations" />
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">
              <span className="text-foreground">My</span> <span className="text-primary">Generations</span>
            </h1>
          </div>
          <p className="text-muted-foreground">
            View, edit, and share all your AI-generated content
          </p>
        </div>

        {generations.length > 0 && <GenerationsTour hasGenerations={generations.length > 0} />}

        {isLoading ? (
          <LoadingState context="data" message="Loading your generations..." />
        ) : generations.length === 0 ? (
          <Card className="p-16 text-center">
            <Clock className="w-16 h-16 mx-auto mb-4 text-muted-foreground/40" />
            <h3 className="text-lg font-semibold mb-2">No generations yet</h3>
            <p className="text-muted-foreground text-sm">Start creating content with your AI tools</p>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {generations.map((gen, index) => (
                <Card key={gen.id} className="overflow-hidden border-border/50 hover:shadow-glow transition-all duration-300 group">
                  <div
                    className="aspect-square relative bg-muted cursor-pointer"
                    onClick={() => { setSelectedImage(gen); setIsPreviewOpen(true); }}
                  >
                    {gen.generated_image_url ? (
                      isVideoUrl(gen.generated_image_url) ? (
                        <video src={gen.generated_image_url} className="w-full h-full object-cover" autoPlay muted loop playsInline />
                      ) : (
                        <img src={displayUrl(gen.generated_image_url)} alt="Generated" className="w-full h-full object-cover" loading="lazy" />
                      )
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">Processing...</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      {!isVideoUrl(gen.generated_image_url || "") && (
                        <Button size="icon" variant="secondary" onClick={(e) => {
                          e.stopPropagation();
                          if (!canExport) { setUnlockOpen(true); return; }
                          setEditingImageUrl(gen.generated_image_url);
                          setEditingGenId(gen.id);
                          setIsEditModalOpen(true);
                        }}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                      )}
                      <Button size="icon" variant="secondary" onClick={(e) => {
                        e.stopPropagation();
                        if (!canExport) { setUnlockOpen(true); return; }
                        handleDownload(gen.generated_image_url, gen.id);
                      }}>
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                    {/* Public/Private indicator */}
                    <div className="absolute top-2 right-2">
                      {gen.is_public ? (
                        <div className="w-6 h-6 bg-primary/80 rounded-full flex items-center justify-center">
                          <Globe className="w-3 h-3 text-white" />
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div className="p-2 flex items-center justify-between dark:bg-white/25">
                    <p className="text-xs text-muted-foreground truncate">
                      {new Date(gen.created_at).toLocaleDateString()}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => togglePublic(gen.id, gen.is_public)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        title={gen.is_public ? "Make private" : "Publish to Community"}
                        data-tour-target={index === 0 ? "visibility-toggle" : undefined}
                      >
                        {gen.is_public ? <Globe className="w-3.5 h-3.5 text-primary" /> : <Lock className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                      return (
                        <Button key={page} variant={currentPage === page ? "default" : "outline"} size="icon" onClick={() => setCurrentPage(page)} className="w-10">
                          {page}
                        </Button>
                      );
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                      return <span key={page} className="px-2">...</span>;
                    }
                    return null;
                  })}
                </div>
                <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generated Content</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="space-y-4">
              <div className="relative w-full max-h-[60vh] flex items-center justify-center">
                {isVideoUrl(selectedImage.generated_image_url) ? (
                  <video src={selectedImage.generated_image_url} controls autoPlay loop className="max-w-full max-h-[60vh] h-auto object-contain rounded-lg" />
                ) : (
                  <img src={displayUrl(selectedImage.generated_image_url)} alt="Preview" className="max-w-full max-h-[60vh] h-auto object-contain rounded-lg" />
                )}
              </div>
              <p className="text-sm text-muted-foreground"><span className="font-semibold">Created:</span> {new Date(selectedImage.created_at).toLocaleString()}</p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch checked={selectedImage.is_public} onCheckedChange={() => togglePublic(selectedImage.id, selectedImage.is_public)} />
                  <Label className="text-sm">
                    {selectedImage.is_public ? "Published to Community" : "Private"}
                  </Label>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {editingImageUrl && (
        <ImageEditModal
          open={isEditModalOpen}
          onOpenChange={(open) => {
            setIsEditModalOpen(open);
            if (!open) { setEditingImageUrl(null); setEditingGenId(null); }
          }}
          imageUrl={editingImageUrl}
          onEditComplete={async (newUrl) => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;
            const originalGen = generations.find(g => g.id === editingGenId);
            const { data: newGen } = await supabase
              .from("generations")
              .insert({
                user_id: session.user.id,
                prompt: `${originalGen?.prompt || "Edited image"} (edited)`,
                original_image_url: originalGen?.original_image_url || newUrl,
                generated_image_url: newUrl,
                status: "completed",
              })
              .select()
              .single();
            if (newGen) {
              setGenerations(prev => [newGen, ...prev]);
              setEditingGenId(newGen.id);
            }
            setEditingImageUrl(newUrl);
          }}
          isAdmin={isAdmin}
        />
      )}

      <UnlockDialog open={unlockOpen} onOpenChange={setUnlockOpen} />
    </BackendLayout>
  );
};

export default MyGenerations;
