import { useState } from "react";
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

const VIDEO_STYLES = [
  {
    id: "runway-walk",
    label: "Runway Walk",
    emoji: "👠",
    prompt: "A fashion model walking confidently down a runway with smooth, elegant strides. Camera follows from the front. Professional catwalk energy, rhythmic hip movement, poised posture. The model's face, facial features, skin tone, and identity must remain exactly identical to the reference image throughout every frame.",
  },
  {
    id: "slow-spin",
    label: "360° Slow Spin",
    emoji: "🔄",
    prompt: "The model slowly spins 360 degrees in place, showcasing the full outfit from every angle. Smooth, graceful rotation. Arms relaxed at sides, natural confident expression. The model's face, facial features, skin tone, and identity must remain exactly identical to the reference image throughout every frame.",
  },
  {
    id: "pose-transition",
    label: "Pose to Pose",
    emoji: "✨",
    prompt: "The model transitions between 3 elegant poses — standing straight, slight hip shift, then a hand-on-hip power pose. Smooth, fluid transitions between each pose. Editorial fashion energy. The model's face, facial features, skin tone, and identity must remain exactly identical to the reference image throughout every frame.",
  },
  {
    id: "street-style",
    label: "Street Style",
    emoji: "🏙️",
    prompt: "The model walks casually toward the camera with natural street-style confidence. Slight breeze effect on clothing, relaxed body language, candid fashion photography vibe. The model's face, facial features, skin tone, and identity must remain exactly identical to the reference image throughout every frame.",
  },
  {
    id: "editorial-glam",
    label: "Editorial Glam",
    emoji: "📸",
    prompt: "The model strikes dramatic editorial poses with slow, intentional movements. Hair flip, over-the-shoulder look, and a confident stride. High fashion magazine shoot energy, cinematic lighting. The model's face, facial features, skin tone, and identity must remain exactly identical to the reference image throughout every frame.",
  },
  {
    id: "outfit-reveal",
    label: "Outfit Reveal",
    emoji: "🎬",
    prompt: "Camera starts zoomed in on the model's face, then slowly pulls back to reveal the full outfit from head to toe. The model holds a confident pose as the outfit is fully revealed. Dramatic reveal moment. The model's face, facial features, skin tone, and identity must remain exactly identical to the reference image throughout every frame.",
  },
];

interface FashionVideoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (prompt: string) => void;
  isGenerating: boolean;
  imageUrl: string;
  creditCost?: number;
  credits?: number;
  isAdmin?: boolean;
}

const FashionVideoModal = ({
  open,
  onOpenChange,
  onGenerate,
  isGenerating,
  imageUrl,
  creditCost = 5,
  credits = 0,
  isAdmin = false,
}: FashionVideoModalProps) => {
  const [selectedStyle, setSelectedStyle] = useState<string>("runway-walk");
  const [customPrompt, setCustomPrompt] = useState<string>("");

  const handleGenerate = () => {
    const style = VIDEO_STYLES.find((s) => s.id === selectedStyle);
    if (style) {
      const finalPrompt = customPrompt.trim()
        ? `${style.prompt} Additional instructions: ${customPrompt.trim()}`
        : style.prompt;
      onGenerate(finalPrompt);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">Create Fashion Video</DialogTitle>
          <DialogDescription>
            Choose a video style for your 6-second fashion clip
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-4 mt-2">
          <div className="w-24 h-32 rounded-lg overflow-hidden border border-border shrink-0">
            <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
          </div>

          <div className="flex-1 grid grid-cols-2 gap-2">
            {VIDEO_STYLES.map((style) => (
              <button
                key={style.id}
                onClick={() => setSelectedStyle(style.id)}
                disabled={isGenerating}
                className={`group relative text-left p-3 rounded-xl border-2 transition-all duration-200 text-sm
                  ${
                    selectedStyle === style.id
                      ? "border-primary bg-primary/10 shadow-[0_0_12px_hsl(var(--primary)/0.2)]"
                      : "border-border/60 hover:border-primary/40 hover:bg-accent/50"
                  } ${isGenerating ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground text-[13px] leading-tight">{style.label}</span>
                </div>
                {selectedStyle === style.id && (
                  <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
                )}
              </button>
            ))}
          </div>
        </div>

        <Textarea
          placeholder="Add custom instructions (optional) — e.g. 'slow motion wind effect', 'dramatic lighting changes'..."
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          disabled={isGenerating}
          className="mt-1 resize-none text-sm"
          rows={2}
        />

        <Button
          onClick={handleGenerate}
          disabled={isGenerating || (!isAdmin && credits < creditCost)}
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

        {!isAdmin && credits < creditCost && (
          <p className="text-sm text-destructive text-center -mt-1">
            You need at least {creditCost} credits to generate a video
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FashionVideoModal;
