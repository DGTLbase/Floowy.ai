import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Eye, EyeOff, MessageCircle, Heart, Loader2, RefreshCw, RotateCcw } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CommunityGeneration {
  id: string;
  prompt: string;
  generated_image_url: string | null;
  original_image_url: string;
  created_at: string;
  tool_name: string | null;
  user_id: string;
  is_public: boolean;
}

export function AdminCommunityPanel() {
  const [activeTab, setActiveTab] = useState<"public" | "hidden">("public");
  const [generations, setGenerations] = useState<CommunityGeneration[]>([]);
  const [hiddenGenerations, setHiddenGenerations] = useState<CommunityGeneration[]>([]);
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [previewGen, setPreviewGen] = useState<CommunityGeneration | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchCommunityGenerations();
    fetchHiddenGenerations();
  }, []);

  const fetchCommunityGenerations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("generations")
      .select("id, prompt, generated_image_url, original_image_url, created_at, tool_name, user_id, is_public")
      .eq("is_public", true)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      toast({ title: "Error", description: "Failed to load community generations", variant: "destructive" });
      setLoading(false);
      return;
    }

    if (data) {
      setGenerations(data);

      // Fetch user names via admin edge function (profiles RLS blocks anon access)
      const adminToken = localStorage.getItem("admin_token");
      if (adminToken) {
        const { data: usersData } = await supabase.functions.invoke("admin-get-users", {
          headers: { "admin-token": adminToken },
        });
        if (usersData?.users) {
          const names: Record<string, string> = {};
          usersData.users.forEach((u: any) => { names[u.id] = u.full_name || u.email || "Anonymous"; });
          setUserNames(names);
        }
      }

      // Fetch like counts
      const genIds = data.map((g) => g.id);
      if (genIds.length > 0) {
        const { data: likes } = await supabase
          .from("generation_likes")
          .select("generation_id")
          .in("generation_id", genIds);
        if (likes) {
          const counts: Record<string, number> = {};
          likes.forEach((l) => { counts[l.generation_id] = (counts[l.generation_id] || 0) + 1; });
          setLikeCounts(counts);
        }

        const { data: comments } = await supabase
          .from("generation_comments")
          .select("generation_id")
          .in("generation_id", genIds);
        if (comments) {
          const counts: Record<string, number> = {};
          comments.forEach((c) => { counts[c.generation_id] = (counts[c.generation_id] || 0) + 1; });
          setCommentCounts(counts);
        }
      }
    }
    setLoading(false);
  };

  const fetchHiddenGenerations = async () => {
    const adminToken = localStorage.getItem("admin_token");
    if (!adminToken) return;

    const { data, error } = await supabase.functions.invoke("admin-get-hidden-generations", {
      headers: { "admin-token": adminToken },
    });

    if (data?.generations) {
      setHiddenGenerations(data.generations);
    }
  };

  const handleRemoveFromCommunity = async (genId: string) => {
    const { error } = await supabase
      .from("generations")
      .update({ is_public: false })
      .eq("id", genId);

    if (error) {
      toast({ title: "Error", description: "Failed to remove from community", variant: "destructive" });
      return;
    }

    const gen = generations.find((g) => g.id === genId);
    setGenerations((prev) => prev.filter((g) => g.id !== genId));
    if (gen) setHiddenGenerations((prev) => [{ ...gen, is_public: false }, ...prev]);
    toast({ title: "Removed", description: "Generation removed from community" });
  };

  const handleRestoreToCommunity = async (genId: string) => {
    const { error } = await supabase
      .from("generations")
      .update({ is_public: true })
      .eq("id", genId);

    if (error) {
      toast({ title: "Error", description: "Failed to restore generation", variant: "destructive" });
      return;
    }

    const gen = hiddenGenerations.find((g) => g.id === genId);
    setHiddenGenerations((prev) => prev.filter((g) => g.id !== genId));
    if (gen) setGenerations((prev) => [{ ...gen, is_public: true }, ...prev]);
    toast({ title: "Restored", description: "Generation restored to community" });
  };

  const handleDeleteGeneration = async (genId: string) => {
    await supabase.from("generation_comments").delete().eq("generation_id", genId);
    await supabase.from("generation_likes").delete().eq("generation_id", genId);
    
    const { error } = await supabase
      .from("generations")
      .delete()
      .eq("id", genId);

    if (error) {
      toast({ title: "Error", description: "Failed to delete generation", variant: "destructive" });
      return;
    }

    setGenerations((prev) => prev.filter((g) => g.id !== genId));
    setHiddenGenerations((prev) => prev.filter((g) => g.id !== genId));
    toast({ title: "Deleted", description: "Generation permanently deleted" });
  };

  const isVideoUrl = (url: string) => {
    return url?.match(/\.(mp4|webm|mov)/i) || url?.includes('video');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Community Management</h2>
          <p className="text-muted-foreground mt-1">
            {generations.length} public · {hiddenGenerations.length} hidden
          </p>
        </div>
        <Button variant="outline" onClick={() => { fetchCommunityGenerations(); fetchHiddenGenerations(); }} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={activeTab === "public" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("public")}
        >
          <Eye className="w-4 h-4 mr-1" /> Public ({generations.length})
        </Button>
        <Button
          variant={activeTab === "hidden" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("hidden")}
        >
          <EyeOff className="w-4 h-4 mr-1" /> Hidden ({hiddenGenerations.length})
        </Button>
      </div>

      {activeTab === "public" && (
        <>
          {generations.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p>No public generations in the community gallery.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {generations.map((gen) => (
                <Card key={gen.id} className="overflow-hidden group relative">
                  <div className="aspect-square relative cursor-pointer" onClick={() => setPreviewGen(gen)}>
                    {gen.generated_image_url && (
                      isVideoUrl(gen.generated_image_url) ? (
                        <video src={gen.generated_image_url} className="w-full h-full object-cover" muted crossOrigin="anonymous" />
                      ) : (
                        <img src={gen.generated_image_url} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" referrerPolicy="no-referrer" />
                      )
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Eye className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="p-3 space-y-2">
                    <p className="text-xs text-muted-foreground truncate">{userNames[gen.user_id] || "Unknown user"}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {gen.tool_name && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{gen.tool_name}</Badge>}
                      <span className="flex items-center gap-0.5"><Heart className="w-3 h-3" /> {likeCounts[gen.id] || 0}</span>
                      <span className="flex items-center gap-0.5"><MessageCircle className="w-3 h-3" /> {commentCounts[gen.id] || 0}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{new Date(gen.created_at).toLocaleDateString()}</p>
                    <div className="flex gap-2 pt-1">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline" className="flex-1 text-xs h-7 gap-1"><EyeOff className="w-3 h-3" /> Hide</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove from community?</AlertDialogTitle>
                            <AlertDialogDescription>This will hide the generation from the community gallery. The user will keep it in their generations.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleRemoveFromCommunity(gen.id)}>Hide from community</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive" className="flex-1 text-xs h-7 gap-1"><Trash2 className="w-3 h-3" /> Delete</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Permanently delete?</AlertDialogTitle>
                            <AlertDialogDescription>This will permanently delete this generation, its comments, and likes. This action cannot be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteGeneration(gen.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete permanently</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === "hidden" && (
        <>
          {hiddenGenerations.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p>No hidden generations.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {hiddenGenerations.map((gen) => (
                <Card key={gen.id} className="overflow-hidden group relative opacity-75 hover:opacity-100 transition-opacity">
                  <div className="aspect-square relative cursor-pointer" onClick={() => setPreviewGen(gen)}>
                    {gen.generated_image_url && (
                      isVideoUrl(gen.generated_image_url) ? (
                        <video src={gen.generated_image_url} className="w-full h-full object-cover" muted crossOrigin="anonymous" />
                      ) : (
                        <img src={gen.generated_image_url} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" referrerPolicy="no-referrer" />
                      )
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Eye className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="p-3 space-y-2">
                    <p className="text-xs text-muted-foreground truncate">{userNames[gen.user_id] || "Unknown user"}</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(gen.created_at).toLocaleDateString()}</p>
                    <div className="flex gap-2 pt-1">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline" className="flex-1 text-xs h-7 gap-1"><RotateCcw className="w-3 h-3" /> Restore</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Restore to community?</AlertDialogTitle>
                            <AlertDialogDescription>This will make the generation visible again in the community gallery.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleRestoreToCommunity(gen.id)}>Restore</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive" className="flex-1 text-xs h-7 gap-1"><Trash2 className="w-3 h-3" /> Delete</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Permanently delete?</AlertDialogTitle>
                            <AlertDialogDescription>This will permanently delete this generation. This action cannot be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteGeneration(gen.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete permanently</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewGen} onOpenChange={(open) => !open && setPreviewGen(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Generation Preview</DialogTitle>
          </DialogHeader>
          <div className="w-full h-full flex items-center justify-center bg-black/95 rounded-lg overflow-hidden">
            {previewGen?.generated_image_url && (
              isVideoUrl(previewGen.generated_image_url) ? (
                <video
                  src={previewGen.generated_image_url}
                  className="max-w-full max-h-[85vh] object-contain"
                  controls
                  autoPlay
                  loop
                  crossOrigin="anonymous"
                />
              ) : (
                <img
                  src={previewGen.generated_image_url}
                  alt=""
                  className="max-w-full max-h-[85vh] object-contain"
                  crossOrigin="anonymous"
                  referrerPolicy="no-referrer"
                />
              )
            )}
          </div>
          {previewGen && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
              <p className="text-white text-sm">{previewGen.prompt}</p>
              <p className="text-white/70 text-xs mt-1">
                By {userNames[previewGen.user_id] || "Unknown"} · {new Date(previewGen.created_at).toLocaleString()}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
