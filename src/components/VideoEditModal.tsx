import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Sparkles, Download, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { VIDEO_EDIT_CHIPS, VIDEO_EDIT_CREDITS, VIDEO_EDIT_MAX_CHARS } from "@/lib/creator-studio-config";

interface VideoVersion {
  label: string;      // "Original", "v1", ...
  url: string;
}

interface EditChip { label: string; prompt: string; }

interface VideoEditModalProps {
  open: boolean;
  onClose: () => void;
  videoUrl: string;            // the freshly generated video
  onEdited?: (url: string) => void;   // notify parent of the latest active version
  chips?: EditChip[];          // suggestion chips (per-tool; defaults to Creator Studio's)
}

/**
 * Post-generation Video Editing Tool (briefing §5). Same modal shell / topbar /
 * Apply-button style as the Image Editor, but entirely prompt-based (no brush/
 * wand/lasso). Adds a version-history strip. 5 credits per successful edit.
 */
const VideoEditModal = ({ open, onClose, videoUrl, onEdited, chips = VIDEO_EDIT_CHIPS }: VideoEditModalProps) => {
  const [versions, setVersions] = useState<VideoVersion[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [prompt, setPrompt] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  const { toast } = useToast();

  // Seed with the original whenever the source video changes.
  useEffect(() => {
    if (videoUrl) {
      setVersions([{ label: "Original", url: videoUrl }]);
      setActiveIdx(0);
      setPrompt("");
    }
  }, [videoUrl]);

  const active = versions[activeIdx];

  const download = useCallback(async () => {
    if (!active) return;
    try {
      const res = await fetch(active.url);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `floowy-ugc-${active.label.toLowerCase()}-${Date.now()}.mp4`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    } catch {
      window.open(active.url, "_blank");
    }
  }, [active]);

  const apply = async () => {
    if (!prompt.trim() || !active) return;
    setIsApplying(true);
    try {
      // Async contract: submit the edit, then poll for completion (avoids the
      // edge-function timeout that a long synchronous edit would hit). Credits (5)
      // are deducted server-side only on successful completion (briefing §5.7).
      const { data: sub, error: subErr } = await supabase.functions.invoke("edit-video", {
        body: { action: "submit", video_url: active.url, prompt: prompt.trim() },
      });
      if (subErr) {
        // supabase-js hides the real error body in error.context — surface it.
        let detail = subErr.message;
        try {
          const b = await (subErr as any).context?.json?.();
          if (b?.error) detail = b.error;
        } catch { /* not JSON */ }
        throw new Error(detail);
      }
      if (sub?.error) throw new Error(sub.error);
      const { status_url, response_url } = sub ?? {};
      if (!status_url || !response_url) throw new Error("Could not start the edit.");

      const newUrl = await new Promise<string>((resolve, reject) => {
        const started = Date.now();
        const iv = setInterval(async () => {
          if (Date.now() - started > 5 * 60 * 1000) {
            clearInterval(iv); reject(new Error("Edit timed out. No credits were charged."));
            return;
          }
          try {
            const { data: st } = await supabase.functions.invoke("edit-video", {
              body: { action: "status", status_url, response_url },
            });
            if (st?.status === "COMPLETED" && st.video_url) { clearInterval(iv); resolve(st.video_url); }
            else if (st?.status === "FAILED") { clearInterval(iv); reject(new Error(st.error || "Edit failed")); }
          } catch { /* transient — keep polling */ }
        }, 4000);
      });

      const nextLabel = `v${versions.length}`;
      const next = [...versions, { label: nextLabel, url: newUrl }];
      setVersions(next);
      setActiveIdx(next.length - 1);
      setPrompt("");
      onEdited?.(newUrl);
      toast({ title: "Edit applied", description: `${nextLabel} created — ${VIDEO_EDIT_CREDITS} credits used.` });
    } catch (e) {
      // Failed task = 0 credits (briefing §5.7)
      toast({
        title: "Edit failed",
        description: e instanceof Error ? e.message : "No credits were charged. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsApplying(false);
    }
  };

  const canApply = prompt.trim().length > 0 && !isApplying;
  const remaining = VIDEO_EDIT_MAX_CHARS - prompt.length;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[100vw] max-h-[100dvh] h-[100dvh] w-[100vw] overflow-hidden p-0 gap-0 border-none bg-background [&>button.absolute]:hidden rounded-none flex flex-col">
        {/* Top bar — identical pattern to Image Editor */}
        <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 border-b border-border/50 shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <span className="font-semibold text-sm">Edit Video</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={download}
              className="h-7 px-2.5 rounded-md hover:bg-muted flex items-center justify-center gap-1.5 transition-colors text-muted-foreground hover:text-foreground text-xs font-medium"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Download</span>
            </button>
            <button
              onClick={onClose}
              className="h-7 w-7 rounded-md hover:bg-muted flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto flex max-w-2xl flex-col gap-5 px-4 py-6">
            {/* Video preview */}
            <div className="w-full overflow-hidden rounded-xl bg-black">
              {active && (
                <video key={active.url} src={active.url} controls loop className="mx-auto max-h-[52vh] w-full object-contain" />
              )}
            </div>

            {/* Prompt suggestion chips */}
            <div className="flex flex-wrap gap-2">
              {chips.map((c) => (
                <button
                  key={c.label}
                  type="button"
                  onClick={() => setPrompt(c.prompt)}
                  className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-primary hover:bg-primary/5"
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Prompt input */}
            <div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value.slice(0, VIDEO_EDIT_MAX_CHARS))}
                placeholder="Describe the change you want to make to the video…"
                rows={3}
                className="w-full resize-none rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <div className="mt-1 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {VIDEO_EDIT_CREDITS} credits per edit · regardless of change
                </span>
                <span className={`text-xs ${remaining < 20 ? "text-amber-600" : "text-muted-foreground"}`}>
                  {remaining}
                </span>
              </div>
            </div>

            {/* Apply */}
            <button
              onClick={apply}
              disabled={!canApply}
              className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition hover:brightness-110 disabled:opacity-50"
            >
              {isApplying ? <><Loader2 className="h-4 w-4 animate-spin" /> Applying…</>
                          : <>Apply · {VIDEO_EDIT_CREDITS} credits</>}
            </button>

            {/* Version history strip */}
            {versions.length > 1 && (
              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Versions</div>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {versions.map((v, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => { setActiveIdx(i); onEdited?.(v.url); }}
                      className={`shrink-0 overflow-hidden rounded-lg border-2 transition ${
                        i === activeIdx ? "border-primary" : "border-transparent hover:border-border"
                      }`}
                    >
                      <video src={v.url} muted className="h-20 w-14 bg-black object-cover" />
                      <div className={`px-1 py-0.5 text-center text-[10px] font-semibold ${
                        i === activeIdx ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}>
                        {v.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VideoEditModal;
