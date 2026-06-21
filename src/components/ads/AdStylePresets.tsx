import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface AdStylePresetsProps {
  stylePreferences: string;
  setStylePreferences: (style: string) => void;
}

const STYLE_PRESETS = [
  {
    id: "modern",
    name: "Modern",
    description: "Clean lines, minimalist",
    style: "Modern, clean, minimalist design with subtle gradients and professional typography"
  },
  {
    id: "vibrant",
    name: "Vibrant",
    description: "Bold, colorful, energetic",
    style: "Vibrant, bold colors with high contrast, energetic and eye-catching design"
  },
  {
    id: "elegant",
    name: "Elegant",
    description: "Luxury, sophisticated",
    style: "Elegant, luxury aesthetic with gold accents, sophisticated and premium feel"
  },
  {
    id: "playful",
    name: "Playful",
    description: "Fun, casual, friendly",
    style: "Playful, fun design with rounded shapes, friendly colors and casual vibe"
  },
  {
    id: "tech",
    name: "Tech",
    description: "Futuristic, sleek",
    style: "Futuristic tech aesthetic with dark background, neon accents, sleek and innovative"
  },
  {
    id: "nature",
    name: "Nature",
    description: "Organic, earthy tones",
    style: "Nature-inspired with earthy tones, organic textures, sustainable and eco-friendly feel"
  },
  {
    id: "retro",
    name: "Retro",
    description: "Vintage, nostalgic",
    style: "Retro vintage style with warm colors, nostalgic feel, classic typography"
  },
  {
    id: "bold",
    name: "Bold",
    description: "Strong, impactful",
    style: "Bold, impactful design with strong typography, high contrast and attention-grabbing elements"
  },
];

const AdStylePresets = ({
  stylePreferences,
  setStylePreferences,
}: AdStylePresetsProps) => {
  const selectedPreset = STYLE_PRESETS.find(p => p.style === stylePreferences);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium">Style Presets</Label>
        <div className="grid grid-cols-2 gap-2">
          {STYLE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => setStylePreferences(preset.style)}
              className={cn(
                "p-3 rounded-lg border text-left transition-all hover:border-primary/50",
                selectedPreset?.id === preset.id
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:bg-muted/50"
              )}
            >
              <p className="font-medium text-sm">{preset.name}</p>
              <p className="text-xs text-muted-foreground">{preset.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="custom-style" className="text-sm font-medium">
          Custom Style (optional)
        </Label>
        <Textarea
          id="custom-style"
          placeholder="Or describe your own style..."
          value={selectedPreset ? "" : stylePreferences}
          onChange={(e) => setStylePreferences(e.target.value)}
          rows={2}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground">
          Select a preset or write your own style description
        </p>
      </div>
    </div>
  );
};

export default AdStylePresets;