import { useState } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Hand, UserX, User, Wand2 } from "lucide-react";
import ModelSelector from "@/components/ModelSelector";

export type ModelMode = "none" | "hand" | "model";
export type HandInteraction = "auto" | "hold" | "wear";
export type ModelSource = "floowy" | "auto";

interface AdModelSelectorProps {
  mode: ModelMode;
  setMode: (mode: ModelMode) => void;
  handInteraction?: HandInteraction;
  setHandInteraction?: (interaction: HandInteraction) => void;
  customModelFile?: File | null;
  onCustomModelFileChange?: (file: File | null) => void;
  selectedModelUrl?: string | null;
  onModelUrlSelect?: (url: string) => void;
  modelSource?: ModelSource;
  onModelSourceChange?: (source: ModelSource) => void;
  autoGender?: string;
  onAutoGenderChange?: (gender: string) => void;
}

const AdModelSelector = ({
  mode,
  setMode,
  handInteraction = "auto",
  setHandInteraction,
  customModelFile,
  onCustomModelFileChange,
  selectedModelUrl,
  onModelUrlSelect,
  modelSource = "floowy",
  onModelSourceChange,
  autoGender = "female",
  onAutoGenderChange,
}: AdModelSelectorProps) => {

  return (
    <div className="space-y-4">
      {/* Mode Selection */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Display Mode</Label>
        <RadioGroup
          value={mode}
          onValueChange={(value) => setMode(value as ModelMode)}
          className="grid grid-cols-3 gap-2"
        >
          <div>
            <RadioGroupItem value="none" id="mode-none" className="peer sr-only" />
            <Label
              htmlFor="mode-none"
              className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-3 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary transition-all hover:bg-accent hover:text-accent-foreground cursor-pointer"
            >
              <UserX className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">No Model</span>
              <span className="text-[10px] text-muted-foreground">Product only</span>
            </Label>
          </div>
          <div>
            <RadioGroupItem value="hand" id="mode-hand" className="peer sr-only" />
            <Label
              htmlFor="mode-hand"
              className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-3 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary transition-all hover:bg-accent hover:text-accent-foreground cursor-pointer"
            >
              <Hand className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">Hand Only</span>
              <span className="text-[10px] text-muted-foreground">Holding/Wearing</span>
            </Label>
          </div>
          <div>
            <RadioGroupItem value="model" id="mode-model" className="peer sr-only" />
            <Label
              htmlFor="mode-model"
              className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-3 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary transition-all hover:bg-accent hover:text-accent-foreground cursor-pointer"
            >
              <User className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">With Model</span>
              <span className="text-[10px] text-muted-foreground">Select avatar</span>
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Hand Interaction - Only for hand mode */}
      {mode === "hand" && setHandInteraction && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Hand Interaction</Label>
          <div className="grid grid-cols-3 gap-2">
            {(["auto", "hold", "wear"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setHandInteraction(type)}
                className={`flex flex-col items-center justify-center rounded-lg border-2 p-2.5 transition-all cursor-pointer ${
                  handInteraction === type
                    ? "border-primary bg-primary/10"
                    : "border-muted bg-popover hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <span className="text-xs font-medium capitalize">{type}</span>
                <span className="text-[10px] text-muted-foreground">
                  {type === "auto" ? "AI decides" : type === "hold" ? "Grip product" : "On hand/finger"}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Model Source Selection - Only for model mode */}
      {mode === "model" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Model Source</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  onModelSourceChange?.("floowy");
                  onAutoGenderChange?.("female");
                }}
                className={`px-3 py-2.5 rounded-lg border-2 transition-all flex flex-col items-center justify-center gap-1 ${
                  modelSource === "floowy"
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-muted bg-popover hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <User className="h-4 w-4" />
                <span className="text-xs font-medium">Floowy Models</span>
                <span className="text-[10px] text-muted-foreground">Select an avatar</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onModelSourceChange?.("auto");
                  onModelUrlSelect?.("");
                  onCustomModelFileChange?.(null);
                }}
                className={`px-3 py-2.5 rounded-lg border-2 transition-all flex flex-col items-center justify-center gap-1 ${
                  modelSource === "auto"
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-muted bg-popover hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <Wand2 className="h-4 w-4" />
                <span className="text-xs font-medium">Auto Generated</span>
                <span className="text-[10px] text-muted-foreground">AI creates model</span>
              </button>
            </div>
          </div>

          {/* Floowy Models - show ModelSelector */}
          {modelSource === "floowy" && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Choose Avatar</Label>
              <ModelSelector
                selectedModel={selectedModelUrl || null}
                onModelSelect={(url) => onModelUrlSelect?.(url)}
                customModelFile={customModelFile}
                onCustomModelFileChange={onCustomModelFileChange}
                columns={5}
                maxHeight="280px"
              />
            </div>
          )}

          {/* Auto Generated - show gender buttons */}
          {modelSource === "auto" && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Model Gender</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onAutoGenderChange?.("female")}
                  className={`px-4 py-3 rounded-lg border-2 transition-all text-sm font-medium ${
                    autoGender === "female"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-muted bg-popover hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  Female
                </button>
                <button
                  type="button"
                  onClick={() => onAutoGenderChange?.("male")}
                  className={`px-4 py-3 rounded-lg border-2 transition-all text-sm font-medium ${
                    autoGender === "male"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-muted bg-popover hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  Male
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info text */}
      <p className="text-xs text-muted-foreground">
        {mode === "none" && "Product will be displayed standalone on the background"}
        {mode === "hand" && handInteraction === "auto" && "AI will determine if the product should be held or worn"}
        {mode === "hand" && handInteraction === "hold" && "A realistic hand will hold your product"}
        {mode === "hand" && handInteraction === "wear" && "Product will be worn on hand/wrist/finger"}
        {mode === "model" && modelSource === "floowy" && !selectedModelUrl && !customModelFile && "Select an avatar or upload your own model"}
        {mode === "model" && modelSource === "floowy" && (selectedModelUrl || customModelFile) && "Selected model will showcase your product"}
        {mode === "model" && modelSource === "auto" && `AI will generate a ${autoGender} model for your product`}
      </p>
    </div>
  );
};

export default AdModelSelector;
