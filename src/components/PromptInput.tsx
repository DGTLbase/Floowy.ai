import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Wand2, Loader2, Sun, Moon, Package, User, ShoppingCart, UserCircle2, Upload, X } from "lucide-react";
import { Badge } from "./ui/badge";

interface PromptInputProps {
  prompt: string;
  onPromptChange: (prompt: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  hasFile: boolean;
  hasCredits: boolean;
  credits: number;
  setting?: string;
  onSettingChange?: (setting: string) => void;
  modelPresence?: string;
  onModelPresenceChange?: (presence: string) => void;
  modelGender?: string;
  onModelGenderChange?: (gender: string) => void;
  customModelFile?: File | null;
  onCustomModelFileChange?: (file: File | null) => void;
  outputSize?: { width: number; height: number };
  onOutputSizeChange?: (size: { width: number; height: number }) => void;
  isAdmin?: boolean;
}

const stylePresets = [
  "Scandinavian interior, warm lighting",
  "Minimalist studio, natural light",
  "Luxury setting, elegant backdrop",
  "Outdoor nature scene",
  "Modern office environment",
  "Cozy home atmosphere",
];

const PromptInput = ({
  prompt,
  onPromptChange,
  onGenerate,
  isGenerating,
  hasFile,
  hasCredits,
  credits,
  setting = "day",
  onSettingChange,
  modelPresence = "without",
  onModelPresenceChange,
  modelGender = "female",
  onModelGenderChange,
  customModelFile,
  onCustomModelFileChange,
  outputSize = { width: 1024, height: 1024 },
  onOutputSizeChange,
  isAdmin = false,
}: PromptInputProps) => {

  const handleModelFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onCustomModelFileChange) {
      onCustomModelFileChange(file);
    }
  };
  return (
    <div className="bg-card rounded-2xl border border-border/50 p-8 shadow-elegant">
      <h2 className="text-2xl font-bold mb-6 text-foreground">Describe Your Vision</h2>
      
      <div className="space-y-6">
        {/* Time Setting */}
        <div>
          <label className="text-sm font-medium text-foreground mb-3 block">
            Time of Day
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onSettingChange?.("day")}
              className={`px-4 py-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                setting === "day"
                  ? "border-primary bg-primary/10 text-primary font-medium"
                  : "border-border hover:border-primary/50 text-muted-foreground"
              }`}
            >
              <Sun className="w-5 h-5" />
              Day
            </button>
            <button
              type="button"
              onClick={() => onSettingChange?.("night")}
              className={`px-4 py-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                setting === "night"
                  ? "border-primary bg-primary/10 text-primary font-medium"
                  : "border-border hover:border-primary/50 text-muted-foreground"
              }`}
            >
              <Moon className="w-5 h-5" />
              Night
            </button>
          </div>
        </div>

        {/* Model Presence */}
        <div>
          <label className="text-sm font-medium text-foreground mb-3 block">
            Model Presence
          </label>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => onModelPresenceChange?.("without")}
              className={`px-4 py-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                modelPresence === "without"
                  ? "border-primary bg-primary/10 text-primary font-medium"
                  : "border-border hover:border-primary/50 text-muted-foreground"
              }`}
            >
              <Package className="w-5 h-5" />
              Product Only
            </button>
            <button
              type="button"
              onClick={() => onModelPresenceChange?.("with")}
              className={`px-4 py-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                modelPresence === "with"
                  ? "border-primary bg-primary/10 text-primary font-medium"
                  : "border-border hover:border-primary/50 text-muted-foreground"
              }`}
            >
              <User className="w-5 h-5" />
              With Model
            </button>
            <button
              type="button"
              onClick={() => onModelPresenceChange?.("hands")}
              className={`px-4 py-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                modelPresence === "hands"
                  ? "border-primary bg-primary/10 text-primary font-medium"
                  : "border-border hover:border-primary/50 text-muted-foreground"
              }`}
            >
              <User className="w-5 h-5" />
              Hands Only
            </button>
          </div>
        </div>

        {/* Model Gender - Only shown when "With Model" is selected */}
        {modelPresence === "with" && (
          <>
            <div>
              <label className="text-sm font-medium text-foreground mb-3 block">
                Model Option
              </label>
              <div className="space-y-3">
                {/* Gender selection */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      onModelGenderChange?.("male");
                      onCustomModelFileChange?.(null);
                    }}
                    className={`px-4 py-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                      !customModelFile && modelGender === "male"
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "border-border hover:border-primary/50 text-muted-foreground"
                    }`}
                  >
                    <UserCircle2 className="w-5 h-5" />
                    Male
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onModelGenderChange?.("female");
                      onCustomModelFileChange?.(null);
                    }}
                    className={`px-4 py-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                      !customModelFile && modelGender === "female"
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "border-border hover:border-primary/50 text-muted-foreground"
                    }`}
                  >
                    <UserCircle2 className="w-5 h-5" />
                    Female
                  </button>
                </div>

                {/* Or divider */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 border-t border-border"></div>
                  <span className="text-xs text-muted-foreground">OR</span>
                  <div className="flex-1 border-t border-border"></div>
                </div>

                {/* Custom model upload */}
                {!customModelFile ? (
                  <div className="border-2 border-dashed border-primary/30 rounded-lg p-4 hover:border-primary/50 transition-colors">
                    <label className="cursor-pointer flex flex-col items-center gap-2">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleModelFileChange}
                        className="hidden"
                      />
                      <Upload className="w-6 h-6 text-primary" />
                      <span className="text-sm font-medium text-foreground">Upload Your Own Model</span>
                      <span className="text-xs text-muted-foreground">JPG, PNG or WebP • Max 50MB</span>
                    </label>
                  </div>
                ) : (
                  <div className="relative rounded-lg overflow-hidden border-2 border-primary">
                    <img
                      src={URL.createObjectURL(customModelFile)}
                      alt="Custom model"
                      className="w-full h-32 object-cover"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8"
                      onClick={() => onCustomModelFileChange?.(null)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm px-2 py-1">
                      <p className="text-xs text-white truncate">{customModelFile.name}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            What mood or setting do you want?
          </label>
          <Textarea
            placeholder="Enter between 20 and 30 words for best results — e.g., Scandinavian interior, warm lighting, cozy atmosphere..."
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            className="min-h-32 resize-none"
          />
        </div>

        <div>
          <p className="text-sm font-medium text-foreground mb-3">
            Style Presets
          </p>
          <div className="flex flex-wrap gap-2">
            {stylePresets.map((preset) => (
              <Badge
                key={preset}
                variant="outline"
                className="cursor-pointer hover:bg-accent transition-colors"
                onClick={() => onPromptChange(preset)}
              >
                {preset}
              </Badge>
            ))}
          </div>
        </div>

        <Button
          onClick={onGenerate}
          disabled={!hasFile || !prompt.trim() || isGenerating || (!isAdmin && credits === 0)}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow h-12 text-lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Generating...
            </>
          ) : !isAdmin && credits === 0 ? (
            <>
              <ShoppingCart className="w-5 h-5 mr-2" />
              Buy More Credits
            </>
          ) : (
            <>
              <Wand2 className="w-5 h-5 mr-2" />
              {isAdmin ? "Generate (Admin - Free)" : "Generate"}
            </>
          )}
        </Button>

        {!hasFile && (
          <p className="text-sm text-muted-foreground text-center">
            Upload an image to get started • 2 photos for 1 credit
          </p>
        )}

        {!isAdmin && credits === 0 && (
          <p className="text-sm text-destructive text-center">
            No credits remaining
          </p>
        )}
      </div>
    </div>
  );
};

export default PromptInput;