import { useEffect, useState, useRef } from "react";
import { LoadingState } from "@/components/LoadingState";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Heart, Users, Sparkles, MessageCircle, Send, Trash2, Reply, X } from "lucide-react";
import BackendLayout from "@/components/BackendLayout";
import PageMeta from "@/components/PageMeta";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { applyWatermarkIfFree } from "@/lib/watermark";

interface PublicGeneration {
  id: string;
  prompt: string;
  generated_image_url: string | null;
  created_at: string;
  tool_name: string | null;
  user_id: string;
}

interface Comment {
  id: string;
  generation_id: string;
  user_id: string;
  content: string;
  created_at: string;
  parent_id: string | null;
}

const TOOL_FILTERS = [
  { label: "All", value: "all" },
  { label: "Fashion Studio", value: "fashion" },
  { label: "Ambience Studio", value: "atmospheric" },
  { label: "Creator Studio", value: "creator-studio" },
  { label: "Idea Studio", value: "idea-studio" },
  { label: "Flat Lay Studio", value: "flatlay-studio" },
  { label: "Ads Studio", value: "ads_listing" },
  { label: "Listing Studio", value: "listing-studio" },
  { label: "Virtual Video Studio", value: "virtual-tour" },
  { label: "Fashion Studio Pro", value: "fashion-2.0" },
];

const TOOL_NAME_MAP: Record<string, string> = Object.fromEntries(
  TOOL_FILTERS.filter(f => f.value !== "all").map(f => [f.value, f.label])
);

const getToolDisplayName = (toolName: string): string => TOOL_NAME_MAP[toolName] || toolName;

const Community = () => {
  const [generations, setGenerations] = useState<PublicGeneration[]>([]);
  const { isPaid } = useSubscriptionStatus();
  const [watermarkedUrls, setWatermarkedUrls] = useState<Record<string, string>>({});

  // Lazy-fetch watermarked variants for free viewers
  useEffect(() => {
    if (isPaid) return;
    generations.forEach((g) => {
      const url = g.generated_image_url;
      if (!url) return;
      if (url.endsWith(".mp4") || url.endsWith(".webm") || url.endsWith(".mov")) return;
      if (watermarkedUrls[url]) return;
      applyWatermarkIfFree(url, g.id).then((wm) => {
        if (wm) setWatermarkedUrls((prev) => ({ ...prev, [url]: wm }));
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generations, isPaid]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<PublicGeneration | null>(null);
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) setCurrentUserId(session.user.id);
      fetchPublicGenerations(session?.user?.id || null);
    };
    init();
  }, []);

  const fetchPublicGenerations = async (userId: string | null) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("generations")
      .select("id, prompt, generated_image_url, created_at, tool_name, user_id")
      .eq("is_public", true)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error && data) {
      setGenerations(data);

      const userIds = [...new Set(data.map((g) => g.user_id))];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .rpc("get_profile_names", { _user_ids: userIds });
        if (profiles) {
          const names: Record<string, string> = {};
          profiles.forEach((p) => { names[p.id] = p.full_name || "Anonymous"; });
          setUserNames(names);
        }
      }

      // Fetch like counts
      const genIds = data.map((g) => g.id);
      if (genIds.length > 0) {
        const { data: likes } = await supabase
          .from("generation_likes")
          .select("generation_id, user_id")
          .in("generation_id", genIds);

        if (likes) {
          const counts: Record<string, number> = {};
          const myLikes = new Set<string>();
          likes.forEach((l: any) => {
            counts[l.generation_id] = (counts[l.generation_id] || 0) + 1;
            if (userId && l.user_id === userId) myLikes.add(l.generation_id);
          });
          setLikeCounts(counts);
          setUserLikes(myLikes);
        }

        // Fetch comment counts
        const { data: commentsData } = await supabase
          .from("generation_comments")
          .select("generation_id")
          .in("generation_id", genIds);

        if (commentsData) {
          const cCounts: Record<string, number> = {};
          commentsData.forEach((c: any) => {
            cCounts[c.generation_id] = (cCounts[c.generation_id] || 0) + 1;
          });
          setCommentCounts(cCounts);
        }
      }
    }
    setLoading(false);
  };

  const fetchComments = async (generationId: string) => {
    setCommentsLoading(true);
    const { data, error } = await supabase
      .from("generation_comments")
      .select("id, generation_id, user_id, content, created_at, parent_id")
      .eq("generation_id", generationId)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setComments(data as Comment[]);
      const newUserIds = data.map((c) => c.user_id).filter((id) => !userNames[id]);
      if (newUserIds.length > 0) {
        const { data: profiles } = await supabase
          .rpc("get_profile_names", { _user_ids: [...new Set(newUserIds)] });
        if (profiles) {
          setUserNames((prev) => {
            const updated = { ...prev };
            profiles.forEach((p) => { updated[p.id] = p.full_name || "Anonymous"; });
            return updated;
          });
        }
      }
    }
    setCommentsLoading(false);
  };

  const handleSubmitComment = async () => {
    if (!currentUserId || !selectedImage || !newComment.trim()) return;
    if (newComment.trim().length > 500) {
      toast({ title: "Comment too long", description: "Comments must be under 500 characters.", variant: "destructive" });
      return;
    }

    setSubmittingComment(true);
    const insertData: any = {
      generation_id: selectedImage.id,
      user_id: currentUserId,
      content: newComment.trim(),
    };
    if (replyingTo) {
      insertData.parent_id = replyingTo.id;
    }

    const { data, error } = await supabase
      .from("generation_comments")
      .insert(insertData)
      .select("id, generation_id, user_id, content, created_at, parent_id")
      .single();

    if (!error && data) {
      setComments((prev) => [...prev, data as Comment]);
      setCommentCounts((prev) => ({
        ...prev,
        [selectedImage.id]: (prev[selectedImage.id] || 0) + 1,
      }));
      setNewComment("");
      setReplyingTo(null);
      setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } else {
      toast({ title: "Error", description: "Failed to post comment.", variant: "destructive" });
    }
    setSubmittingComment(false);
  };

  const handleDeleteComment = async (commentId: string, generationId: string) => {
    // Count this comment + its replies
    const replyCount = comments.filter((c) => c.parent_id === commentId).length;
    const totalRemoved = 1 + replyCount;

    const { error } = await supabase
      .from("generation_comments")
      .delete()
      .eq("id", commentId);

    if (!error) {
      setComments((prev) => prev.filter((c) => c.id !== commentId && c.parent_id !== commentId));
      setCommentCounts((prev) => ({
        ...prev,
        [generationId]: Math.max(0, (prev[generationId] || 0) - totalRemoved),
      }));
      if (replyingTo?.id === commentId) setReplyingTo(null);
    }
  };

  const handleReply = (comment: Comment) => {
    setReplyingTo(comment);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleOpenPreview = (gen: PublicGeneration) => {
    setSelectedImage(gen);
    setComments([]);
    setNewComment("");
    setReplyingTo(null);
    fetchComments(gen.id);
  };

  const handleLike = async (genId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!currentUserId) return;

    const isLiked = userLikes.has(genId);

    setUserLikes((prev) => {
      const next = new Set(prev);
      if (isLiked) next.delete(genId); else next.add(genId);
      return next;
    });
    setLikeCounts((prev) => ({
      ...prev,
      [genId]: (prev[genId] || 0) + (isLiked ? -1 : 1),
    }));

    if (isLiked) {
      await supabase
        .from("generation_likes")
        .delete()
        .eq("generation_id", genId)
        .eq("user_id", currentUserId);
    } else {
      await supabase
        .from("generation_likes")
        .insert({ generation_id: genId, user_id: currentUserId });
    }
  };

  const isVideoUrl = (url: string) => {
    return url?.includes(".mp4") || url?.includes(".webm") || url?.includes(".mov");
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  // Group comments: top-level and replies
  const topLevelComments = comments.filter((c) => !c.parent_id);
  const repliesMap: Record<string, Comment[]> = {};
  comments.forEach((c) => {
    if (c.parent_id) {
      if (!repliesMap[c.parent_id]) repliesMap[c.parent_id] = [];
      repliesMap[c.parent_id].push(c);
    }
  });

  const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => (
    <div className={cn("flex gap-2 group/comment-item", isReply && "ml-8")}>
      <div className={cn(
        "rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5",
        isReply ? "w-5 h-5" : "w-6 h-6"
      )}>
        <span className={cn("font-semibold text-primary", isReply ? "text-[8px]" : "text-[9px]")}>
          {(userNames[comment.user_id] || "A").charAt(0).toUpperCase()}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-foreground">
            {userNames[comment.user_id] || "Anonymous"}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {timeAgo(comment.created_at)}
          </span>
          {comment.user_id === currentUserId && (
            <button
              onClick={() => handleDeleteComment(comment.id, comment.generation_id)}
              className="opacity-0 group-hover/comment-item:opacity-100 transition-opacity ml-auto"
            >
              <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive transition-colors" />
            </button>
          )}
        </div>
        {isReply && comment.parent_id && (
          <span className="text-[10px] text-primary/70">
            @{userNames[comments.find((c) => c.id === comment.parent_id)?.user_id || ""] || "Anonymous"}
          </span>
        )}
        <p className="text-xs text-muted-foreground mt-0.5 break-words">{comment.content}</p>
        {currentUserId && !isReply && (
          <button
            onClick={() => handleReply(comment)}
            className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground hover:text-primary transition-colors"
          >
            <Reply className="w-3 h-3" />
            Reply
          </button>
        )}
      </div>
    </div>
  );

  return (
    <BackendLayout>
      <PageMeta title="Community Gallery | Floowy.ai" description="Explore AI-generated content from the Floowy community" canonicalUrl="https://floowy.ai/community" />
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">
              <span className="text-foreground">Community</span> <span className="text-primary">Gallery</span>
            </h1>
          </div>
           <p className="text-muted-foreground">
             Explore amazing AI-generated content shared by the Floowy community
           </p>
         </div>

        {/* Tool Filters */}
        <div className="mb-6 flex flex-wrap gap-2">
          {TOOL_FILTERS.map((filter) => (
            <Button
              key={filter.value}
              variant={activeFilter === filter.value ? "default" : "outline"}
              size="sm"
              className={cn(
                "text-xs rounded-full",
                activeFilter === filter.value
                  ? "bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setActiveFilter(filter.value)}
            >
              {filter.label}
            </Button>
          ))}
        </div>

        {/* Gallery */}
        {loading ? (
          <LoadingState context="data" message="Loading community gallery..." />
        ) : generations.filter(g => activeFilter === "all" || g.tool_name === activeFilter).length === 0 ? (
          <Card className="p-16 text-center">
            <Sparkles className="w-16 h-16 mx-auto mb-4 text-muted-foreground/40" />
            <h3 className="text-lg font-semibold mb-2">
              {activeFilter === "all" ? "No public generations yet" : "No generations for this tool yet"}
            </h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              {activeFilter === "all"
                ? 'Be the first to share your creation! You can publish any of your generations from "My Generations" to showcase them here.'
                : "Try selecting a different tool or check back later for new community creations."}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {generations.filter(g => activeFilter === "all" || g.tool_name === activeFilter).map((gen) => (
              <Card
                key={gen.id}
                className="overflow-hidden border border-border bg-card hover:shadow-glow transition-all duration-300 group cursor-pointer"
                onClick={() => handleOpenPreview(gen)}
              >
                <div className="aspect-square relative bg-muted">
                  {gen.generated_image_url && (
                    isVideoUrl(gen.generated_image_url) ? (
                      <video
                        src={gen.generated_image_url}
                        className="w-full h-full object-cover"
                        autoPlay muted loop playsInline
                      />
                    ) : (
                      <img
                        src={isPaid ? gen.generated_image_url : (watermarkedUrls[gen.generated_image_url] ?? gen.generated_image_url)}
                        alt="Community creation"
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    )
                  )}
                  {gen.tool_name && (
                    <Badge className="absolute top-2 left-2 text-[10px] bg-background/80 backdrop-blur-sm text-foreground">
                      {getToolDisplayName(gen.tool_name)}
                    </Badge>
                  )}
                </div>
                <div className="p-2 flex items-center justify-between bg-tool-card-bottom">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-semibold text-primary">
                        {(userNames[gen.user_id] || "A").charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {new Date(gen.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="flex items-center gap-1 group/comment"
                      onClick={(e) => { e.stopPropagation(); handleOpenPreview(gen); }}
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-muted-foreground group-hover/comment:text-primary transition-colors" />
                      <span className="text-[10px] font-medium text-muted-foreground">
                        {commentCounts[gen.id] || 0}
                      </span>
                    </button>
                    <button
                      className="flex items-center gap-1 group/like"
                      onClick={(e) => handleLike(gen.id, e)}
                    >
                      <Heart
                        className={cn(
                          "w-3.5 h-3.5 transition-all",
                          userLikes.has(gen.id)
                            ? "fill-red-500 text-red-500 scale-110"
                            : "text-muted-foreground group-hover/like:text-red-400"
                        )}
                      />
                      <span className={cn(
                        "text-[10px] font-medium",
                        userLikes.has(gen.id) ? "text-red-500" : "text-muted-foreground"
                      )}>
                        {likeCounts[gen.id] || 0}
                      </span>
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Preview Dialog with Comments */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Community Creation</DialogTitle>
          </DialogHeader>
          {selectedImage?.generated_image_url && (
            <div className="space-y-4">
              <div className="relative w-full max-h-[50vh] flex items-center justify-center">
                {isVideoUrl(selectedImage.generated_image_url) ? (
                  <video
                    src={selectedImage.generated_image_url}
                    controls autoPlay loop
                    className="max-w-full max-h-[50vh] h-auto object-contain rounded-lg"
                  />
                ) : (
                  <img
                    src={isPaid ? selectedImage.generated_image_url : (watermarkedUrls[selectedImage.generated_image_url] ?? selectedImage.generated_image_url)}
                    alt="Community creation"
                    className="max-w-full max-h-[50vh] h-auto object-contain rounded-lg"
                  />
                )}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-semibold text-primary">
                      {(userNames[selectedImage.user_id] || "A").charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(selectedImage.created_at).toLocaleString()}
                  </span>
                </div>
                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border hover:border-red-300 transition-colors"
                  onClick={() => handleLike(selectedImage.id)}
                >
                  <Heart
                    className={cn(
                      "w-4 h-4 transition-all",
                      userLikes.has(selectedImage.id)
                        ? "fill-red-500 text-red-500"
                        : "text-muted-foreground"
                    )}
                  />
                  <span className={cn(
                    "text-xs font-medium",
                    userLikes.has(selectedImage.id) ? "text-red-500" : "text-muted-foreground"
                  )}>
                    {likeCounts[selectedImage.id] || 0}
                  </span>
                </button>
              </div>

              {/* Comments Section */}
              <div className="border-t border-border pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <MessageCircle className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">
                    Comments ({commentCounts[selectedImage.id] || 0})
                  </h3>
                </div>

                {/* Comments List with Threading */}
                <div className="space-y-3 max-h-[250px] overflow-y-auto mb-3 scrollbar-green">
                  {commentsLoading ? (
                    <p className="text-xs text-muted-foreground text-center py-4">Loading comments...</p>
                  ) : comments.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">No comments yet. Be the first to comment!</p>
                  ) : (
                    topLevelComments.map((comment) => (
                      <div key={comment.id} className="space-y-2">
                        <CommentItem comment={comment} />
                        {/* Replies */}
                        {repliesMap[comment.id]?.map((reply) => (
                          <CommentItem key={reply.id} comment={reply} isReply />
                        ))}
                      </div>
                    ))
                  )}
                  <div ref={commentsEndRef} />
                </div>

                {/* Reply indicator */}
                {replyingTo && (
                  <div className="flex items-center gap-2 px-3 py-1.5 mb-2 bg-primary/5 border border-primary/20 rounded-lg">
                    <Reply className="w-3 h-3 text-primary shrink-0" />
                    <span className="text-[11px] text-primary truncate">
                      Replying to {userNames[replyingTo.user_id] || "Anonymous"}
                    </span>
                    <button
                      onClick={() => setReplyingTo(null)}
                      className="ml-auto shrink-0"
                    >
                      <X className="w-3 h-3 text-muted-foreground hover:text-foreground transition-colors" />
                    </button>
                  </div>
                )}

                {/* Comment Input */}
                {currentUserId ? (
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-[9px] font-semibold text-primary">
                        {(userNames[currentUserId] || "Y").charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-1.5 border border-border focus-within:border-primary transition-colors">
                      <input
                        ref={inputRef}
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmitComment(); } }}
                        placeholder={replyingTo ? `Reply to ${userNames[replyingTo.user_id] || "Anonymous"}...` : "Write a comment..."}
                        maxLength={500}
                        className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 shrink-0"
                        disabled={!newComment.trim() || submittingComment}
                        onClick={handleSubmitComment}
                      >
                        <Send className={cn("w-3.5 h-3.5", newComment.trim() ? "text-primary" : "text-muted-foreground")} />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center">Log in to comment</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </BackendLayout>
  );
};

export default Community;
