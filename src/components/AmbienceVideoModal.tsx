import { useState, useMemo } from "react";
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

type ModelPresence = "without" | "with" | "hands";

const PRODUCT_VIDEO_STYLES = [
  {
    id: "product-showcase",
    label: "Product Showcase",
    emoji: "📦",
    prompt: "Smooth cinematic camera orbit around the product, slowly revealing every angle and detail. Soft ambient lighting shifts subtly. The product stays perfectly centered and still while the camera glides around it.",
  },
  {
    id: "zoom-reveal",
    label: "Zoom Reveal",
    emoji: "🔍",
    prompt: "Camera starts wide showing the full scene, then slowly zooms into the product revealing fine textures and details. Cinematic depth of field transition. The product remains perfectly still throughout.",
  },
  {
    id: "ambient-drift",
    label: "Ambient Drift",
    emoji: "🌿",
    prompt: "Gentle floating camera movement drifting past the product in its atmospheric setting. Soft light rays shift naturally. Subtle environmental movement like curtain sway or light flicker. Product stays stationary.",
  },
  {
    id: "light-play",
    label: "Light Play",
    emoji: "✨",
    prompt: "Dramatic lighting transition across the product — shadows shift, highlights move, creating a moody cinematic feel. Camera holds steady or moves very slightly. The product remains perfectly still.",
  },
  {
    id: "lifestyle-pan",
    label: "Lifestyle Pan",
    emoji: "🏠",
    prompt: "Slow horizontal pan across the lifestyle scene, revealing the product in context. Smooth, steady camera movement. Natural ambient atmosphere. The product stays in its position while the camera glides.",
  },
  {
    id: "hero-moment",
    label: "Hero Moment",
    emoji: "🎬",
    prompt: "Cinematic hero shot — camera pulls back slowly to reveal the product in a grand, atmospheric setting. Dramatic but elegant. Slight environmental motion like floating particles or soft breeze effect. Product stays perfectly still.",
  },
];

const MODEL_VIDEO_STYLES = [
  {
    id: "model-interact",
    label: "Natural Interaction",
    emoji: "🤝",
    prompt: "The model naturally interacts with the product — picks it up, examines it, uses it with genuine curiosity. Smooth, documentary-style camera. The model's face, facial features, skin tone, and identity must remain exactly identical to the reference image throughout every frame. Maintain natural but clean skin — minimal texture, no exaggerated pores or blemishes. No artificial smoothing or heavy beauty filters.",
  },
  {
    id: "lifestyle-moment",
    label: "Lifestyle Moment",
    emoji: "☕",
    prompt: "The model uses the product in a natural lifestyle moment — casual, relaxed, authentic. Subtle body movement, natural expressions. Camera gently follows the action. The model's face, facial features, skin tone, and identity must remain exactly identical to the reference image throughout every frame. Maintain natural but clean skin — minimal texture, no exaggerated pores or blemishes. No artificial smoothing or heavy beauty filters.",
  },
  {
    id: "slow-reveal",
    label: "Slow Reveal",
    emoji: "🎭",
    prompt: "Camera starts on the model's face showing a subtle smile, then slowly pulls back to reveal them holding or using the product. Elegant reveal moment. The model's face, facial features, skin tone, and identity must remain exactly identical to the reference image throughout every frame. Maintain natural but clean skin — minimal texture, no exaggerated pores or blemishes. No artificial smoothing or heavy beauty filters.",
  },
  {
    id: "pose-transition",
    label: "Pose to Pose",
    emoji: "✨",
    prompt: "The model transitions between natural poses while holding the product — standing, slight turn, then a confident product-forward pose. Smooth transitions. The model's face, facial features, skin tone, and identity must remain exactly identical to the reference image throughout every frame. Maintain natural but clean skin — minimal texture, no exaggerated pores or blemishes. No artificial smoothing or heavy beauty filters.",
  },
  {
    id: "walk-showcase",
    label: "Walk & Showcase",
    emoji: "🚶",
    prompt: "The model walks toward the camera holding the product with confidence. Natural stride, authentic energy. Camera follows from the front. The model's face, facial features, skin tone, and identity must remain exactly identical to the reference image throughout every frame. Maintain natural but clean skin — minimal texture, no exaggerated pores or blemishes. No artificial smoothing or heavy beauty filters.",
  },
  {
    id: "editorial-hold",
    label: "Editorial Hold",
    emoji: "📸",
    prompt: "The model holds the product in an editorial fashion pose with slow, intentional movements. Over-the-shoulder look, product prominently displayed. High-end commercial energy. The model's face, facial features, skin tone, and identity must remain exactly identical to the reference image throughout every frame. Maintain natural but clean skin — minimal texture, no exaggerated pores or blemishes. No artificial smoothing or heavy beauty filters.",
  },
];
const HANDS_VIDEO_STYLES = [
  {
    id: "hands-unbox",
    label: "Unboxing",
    emoji: "📦",
    prompt: "Two hands carefully unbox or unwrap the product, revealing it slowly. Smooth, satisfying movements. Top-down or slight angle camera. Clean, ASMR-like energy. Only hands visible, no face or body.",
  },
  {
    id: "hands-demo",
    label: "Product Demo",
    emoji: "👆",
    prompt: "Two hands demonstrate the product — opening, using, or showing key features with smooth, deliberate gestures. Clear, instructional feel. Steady camera angle. Only hands visible, no face or body.",
  },
  {
    id: "hands-rotate",
    label: "Hold & Rotate",
    emoji: "🔄",
    prompt: "Two hands gently hold the product and slowly rotate it, showing different angles. Careful, appreciative handling. Soft lighting highlights details. Only hands visible, no face or body.",
  },
  {
    id: "hands-arrange",
    label: "Arrange & Style",
    emoji: "🎨",
    prompt: "Two hands arrange the product in its setting — placing it down, adjusting position, styling the scene. Aesthetic, satisfying movements. Only hands visible, no face or body.",
  },
  {
    id: "hands-texture",
    label: "Texture Feel",
    emoji: "🤲",
    prompt: "Two hands gently touch and feel the product surface, highlighting texture and material quality. Sensory, tactile movements. Close-up camera. Only hands visible, no face or body.",
  },
  {
    id: "hands-compare",
    label: "Size Reference",
    emoji: "📏",
    prompt: "One hand holds the product naturally to show its real-world scale relative to hand size. Simple, clean demonstration. Steady camera. Only hands visible, no face or body.",
  },
];

interface AmbienceVideoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (prompt: string) => void;
  isGenerating: boolean;
  imageUrl: string;
  modelPresence: ModelPresence;
  creditCost?: number;
  credits?: number;
  isAdmin?: boolean;
}

const AmbienceVideoModal = ({
  open,
  onOpenChange,
  onGenerate,
  isGenerating,
  imageUrl,
  modelPresence,
  creditCost = 5,
  credits = 0,
  isAdmin = false,
}: AmbienceVideoModalProps) => {
  const [customPrompt, setCustomPrompt] = useState("");

  const styles = useMemo(() => {
    if (modelPresence === "with") return MODEL_VIDEO_STYLES;
    if (modelPresence === "hands") return HANDS_VIDEO_STYLES;
    return PRODUCT_VIDEO_STYLES;
  }, [modelPresence]);

  const [selectedStyle, setSelectedStyle] = useState(styles[0]?.id || "");

  // Reset selection when styles change
  const prevPresenceRef = useMemo(() => modelPresence, [modelPresence]);
  if (selectedStyle && !styles.find((s) => s.id === selectedStyle)) {
    // Style not in current list, reset
    setTimeout(() => setSelectedStyle(styles[0]?.id || ""), 0);
  }

  const handleGenerate = () => {
    const style = styles.find((s) => s.id === selectedStyle);
    if (style) {
      const finalPrompt = customPrompt.trim()
        ? `${style.prompt} Additional instructions: ${customPrompt.trim()}`
        : style.prompt;
      onGenerate(finalPrompt);
    }
  };

  const categoryLabel =
    modelPresence === "with"
      ? "Model + Product"
      : modelPresence === "hands"
      ? "Hands + Product"
      : "Product Only";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">Create Ambience Video</DialogTitle>
          <DialogDescription>
            Choose a video style for your 6-second {categoryLabel.toLowerCase()} clip
          </DialogDescription>
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
          placeholder="Add custom instructions (optional) — e.g. 'slow motion', 'warm golden light'..."
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

export default AmbienceVideoModal;
