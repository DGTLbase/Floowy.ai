import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Video, Loader2 } from "lucide-react";
import { VideoStyle, buildVideoPrompt } from "@/lib/video-styles";

interface StudioVideoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Receives the fully-built prompt, fidelity clause and custom text included. */
  onGenerate: (prompt: string) => void;
  isGenerating: boolean;
  imageUrl: string;
  styles: VideoStyle[];
  title: string;
  description: string;
  placeholder?: string;
  creditCost?: number;
  credits?: number;
  isAdmin?: boolean;
}

/**
 * Style picker for the "make a video" button on a photo result.
 *
 * Studio-agnostic: the presets and copy come in as props so Idea Studio and
 * Fashion Studio Pro share one component instead of each growing a copy of it.
 */
const StudioVideoModal = ({
  open,
  onOpenChange,
  onGenerate,
  isGenerating,
  imageUrl,
  styles,
  title,
  description,
  placeholder = "Add custom instructions (optional) — e.g. 'slow motion', 'warm golden light'...",
  creditCost = 5,
  credits = 0,
  isAdmin = false,
}: StudioVideoModalProps) => {
  const [selectedStyle, setSelectedStyle] = useState(styles[0]?.id ?? "");
  const [customPrompt, setCustomPrompt] = useState("");

  // Keep the selection valid if the caller swaps the preset list.
  useEffect(() => {
    if (!styles.some((s) => s.id === selectedStyle)) {
      setSelectedStyle(styles[0]?.id ?? "");
    }
  }, [styles, selectedStyle]);

  const handleGenerate = () => {
    const style = styles.find((s) => s.id === selectedStyle);
    if (style) onGenerate(buildVideoPrompt(style, customPrompt));
  };

  const cannotAfford = !isAdmin && credits < creditCost;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex gap-4 mt-2">
          <div className="w-24 h-32 rounded-lg overflow-hidden border border-border shrink-0">
            <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
          </div>

          <div className="flex-1 grid grid-cols-2 gap-2">
            {styles.map((style) => (
              <button
                key={style.id}
                onClick={() => setSelectedStyle(style.id)}
                disabled={isGenerating}
                aria-pressed={selectedStyle === style.id}
                className={`group relative text-left p-3 rounded-xl border-2 transition-all duration-200 text-sm
                  ${
                    selectedStyle === style.id
                      ? "border-primary bg-primary/10 shadow-[0_0_12px_hsl(var(--primary)/0.2)]"
                      : "border-border/60 hover:border-primary/40 hover:bg-accent/50"
                  } ${isGenerating ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground text-[13px] leading-tight">
                    {style.label}
                  </span>
                </div>
                {selectedStyle === style.id && (
                  <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
                )}
              </button>
            ))}
          </div>
        </div>

        <Textarea
          placeholder={placeholder}
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          disabled={isGenerating}
          className="mt-1 resize-none text-sm"
          rows={2}
        />

        <Button
          onClick={handleGenerate}
          disabled={isGenerating || cannotAfford}
          className="w-full mt-2 shadow-glow"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating Video...
            </>
          ) : (
            <>
              <Video className="w-4 h-4 mr-2" />
              Generate Video ({creditCost} credits)
            </>
          )}
        </Button>

        {cannotAfford && (
          <p className="text-sm text-destructive text-center -mt-1">
            You need at least {creditCost} credits to generate a video
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default StudioVideoModal;
