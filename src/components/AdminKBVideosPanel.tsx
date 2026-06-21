import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Video, Save, Trash2, Loader2, ExternalLink } from "lucide-react";

const TOOL_NAMES = [
  "Ads Studio",
  "Ambience Studio",
  "Creator Studio",
  "Fashion Studio",
  "Fashion Studio Pro",
  "Flat Lay Studio",
  "Idea Studio",
  "Listing Studio",
  "Prompt Guide",
  "Virtual Video Studio",
];

interface KBVideo {
  id: string;
  tool_name: string;
  video_url: string;
}

const getAdminToken = () => localStorage.getItem("admin_token") || "";

export function AdminKBVideosPanel() {
  const [videos, setVideos] = useState<KBVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchVideos();
  }, []);

  const invoke = async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("admin-manage-kb-videos", {
      body,
      headers: { "admin-token": getAdminToken() },
    });
    if (error) throw error;
    return data;
  };

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const data = await invoke({ action: "list" });
      const vids = data.videos || [];
      setVideos(vids);
      const urlMap: Record<string, string> = {};
      vids.forEach((v: KBVideo) => {
        urlMap[v.tool_name] = v.video_url;
      });
      setUrls(urlMap);
    } catch {
      toast({ title: "Failed to load videos", variant: "destructive" });
    }
    setLoading(false);
  };

  const handleSave = async (toolName: string) => {
    const url = urls[toolName]?.trim();
    if (!url) {
      toast({ title: "Please enter a video URL", variant: "destructive" });
      return;
    }
    setSaving(toolName);
    try {
      await invoke({ action: "upsert", tool_name: toolName, video_url: url });
      toast({ title: "Video URL saved" });
      fetchVideos();
    } catch (err: any) {
      toast({ title: "Failed to save", description: err.message, variant: "destructive" });
    }
    setSaving(null);
  };

  const handleDelete = async (toolName: string) => {
    try {
      await invoke({ action: "delete", tool_name: toolName });
      toast({ title: "Video removed" });
      setUrls((prev) => ({ ...prev, [toolName]: "" }));
      fetchVideos();
    } catch (err: any) {
      toast({ title: "Failed to delete", description: err.message, variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground">Knowledge Base Videos</h1>
        <p className="text-muted-foreground mt-1">
          Manage video URLs for each tool's Knowledge Base card preview.
        </p>
      </div>

      <div className="grid gap-4">
        {TOOL_NAMES.map((toolName) => {
          const hasVideo = !!videos.find((v) => v.tool_name === toolName);
          return (
            <div
              key={toolName}
              className="bg-card rounded-xl border border-border/50 p-5 flex flex-col sm:flex-row sm:items-end gap-4"
            >
              <div className="flex-1 space-y-2">
                <Label className="flex items-center gap-2 text-sm font-semibold">
                  <Video className="w-4 h-4 text-primary" />
                  {toolName}
                  {hasVideo && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  )}
                </Label>
                <Input
                  placeholder="https://example.com/video.mp4"
                  value={urls[toolName] || ""}
                  onChange={(e) =>
                    setUrls((prev) => ({ ...prev, [toolName]: e.target.value }))
                  }
                />
              </div>

              <div className="flex gap-2 shrink-0">
                {urls[toolName] && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(urls[toolName], "_blank")}
                    title="Preview"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={() => handleSave(toolName)}
                  disabled={saving === toolName}
                >
                  {saving === toolName ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-1" />
                  )}
                  Save
                </Button>
                {hasVideo && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(toolName)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
