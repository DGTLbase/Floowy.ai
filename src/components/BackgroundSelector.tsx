import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check } from "lucide-react";

interface BackgroundSelectorProps {
  backgroundColor: string;
  onColorChange: (color: string) => void;
  selectedBackground: string | null;
  onBackgroundSelect: (backgroundUrl: string | null) => void;
  customBackgroundPrompt: string;
  onCustomBackgroundPromptChange: (prompt: string) => void;
  outputSize: { width: number; height: number };
  onOutputSizeChange: (size: { width: number; height: number }) => void;
  hideBackgroundOptions?: boolean;
}

import { useState, useEffect } from "react";

const BackgroundSelector = ({
  backgroundColor,
  onColorChange,
  selectedBackground,
  onBackgroundSelect,
  customBackgroundPrompt,
  onCustomBackgroundPromptChange,
  outputSize,
  onOutputSizeChange,
  hideBackgroundOptions = false,
}: BackgroundSelectorProps) => {
  const aspectRatios = [
    { label: "21:9", value: "21:9", width: 1584, height: 672 },
    { label: "16:9", value: "16:9", width: 1376, height: 768 },
    { label: "3:2", value: "3:2", width: 1264, height: 848 },
    { label: "4:3", value: "4:3", width: 1200, height: 896 },
    { label: "5:4", value: "5:4", width: 1152, height: 928 },
    { label: "1:1", value: "1:1", width: 1024, height: 1024 },
    { label: "4:5", value: "4:5", width: 928, height: 1152 },
    { label: "3:4", value: "3:4", width: 896, height: 1200 },
    { label: "2:3", value: "2:3", width: 848, height: 1264 },
    { label: "9:16", value: "9:16", width: 768, height: 1376 },
  ];

  const resolutions = [
    { label: "1K", value: "1k", multiplier: 1 },
    { label: "2K", value: "2k", multiplier: 2 },
    { label: "4K", value: "4k", multiplier: 4 },
  ];

  // Determine current aspect ratio and resolution
  const getCurrentAspectRatio = () => {
    for (const ratio of aspectRatios) {
      // Check if the output size matches this aspect ratio (with any multiplier)
      for (const res of resolutions) {
        if (
          outputSize.width === ratio.width * res.multiplier &&
          outputSize.height === ratio.height * res.multiplier
        ) {
          return ratio.value;
        }
      }
    }
    return aspectRatios[0].value;
  };

  const getCurrentResolution = () => {
    const currentRatio = aspectRatios.find(r => r.value === getCurrentAspectRatio());
    if (!currentRatio) return resolutions[0].value;

    for (const res of resolutions) {
      if (
        outputSize.width === currentRatio.width * res.multiplier &&
        outputSize.height === currentRatio.height * res.multiplier
      ) {
        return res.value;
      }
    }
    return resolutions[0].value;
  };

  const [selectedAspectRatio, setSelectedAspectRatio] = useState(getCurrentAspectRatio());
  const [selectedResolution, setSelectedResolution] = useState(getCurrentResolution());

  useEffect(() => {
    const newRatio = getCurrentAspectRatio();
    const newRes = getCurrentResolution();
    setSelectedAspectRatio(newRatio);
    setSelectedResolution(newRes);
  }, [outputSize]);

  const backgrounds = [
    { id: "bg-1", color: "#F8F8F8", name: "Studio White" },
    { id: "bg-2", color: "linear-gradient(to bottom, #E8E8E8, #D8D8D8)", name: "Light Grey" },
    { id: "bg-3", color: "linear-gradient(to bottom, #FAF5F0, #F5EFE7)", name: "Cream" },
    { id: "bg-4", color: "linear-gradient(to bottom, #2C2C2C, #1A1A1A)", name: "Studio Black" },
    { id: "bg-5", color: "linear-gradient(to bottom, #FFE5E5, #FFD6D6)", name: "Soft Pink" },
    { id: "bg-6", color: "linear-gradient(to bottom, #E3F2FD, #BBDEFB)", name: "Light Blue" },
    { id: "bg-7", color: "linear-gradient(to bottom, #E8DCC4, #D4C5A9)", name: "Neutral Beige" },
    { id: "bg-8", color: "linear-gradient(to bottom, #E8F5E9, #C8E6C9)", name: "Mint Green" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Left panel - Background options (hidden if hideBackgroundOptions is true) */}
      {!hideBackgroundOptions && (
        <div className="bg-card rounded-xl border border-border p-6 md:col-span-2" data-walkthrough-target="fs-bg">
          <h3 className="text-lg font-semibold mb-4">Select a background option below or write a prompt for your custom background</h3>
          
          <div className="space-y-6">
          {/* Pre-made backgrounds */}
          <div>
            <Label className="mb-3 block">Select Background</Label>
            <div className="grid grid-cols-8 gap-2">
              {backgrounds.map((bg) => (
                <div key={bg.id} className="flex flex-col items-center gap-1">
                  <Card
                    className={`relative cursor-pointer overflow-hidden transition-all hover:scale-105 w-full ${
                      selectedBackground === bg.color
                        ? "ring-2 ring-primary ring-offset-1"
                        : ""
                    }`}
                    onClick={() => {
                      onBackgroundSelect(selectedBackground === bg.color ? null : bg.color);
                    }}
                  >
                    <div className="aspect-square w-full relative" style={{ background: bg.color }}>
                      {selectedBackground === bg.color && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <div className="bg-primary rounded-full p-0.5">
                            <Check className="h-3 w-3 text-primary-foreground" />
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                  <p className="text-[10px] text-center font-medium text-foreground/80 leading-tight">{bg.name}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <div>
            <Label htmlFor="bg-color" className="mb-2 block">
              Choose Custom Color
            </Label>
            <div className="flex gap-3 items-center">
              <Input
                id="bg-color"
                type="color"
                value={backgroundColor}
                onChange={(e) => {
                  onColorChange(e.target.value);
                  onBackgroundSelect(null);
                }}
                className="w-20 h-10 cursor-pointer"
              />
              <Input
                type="text"
                value={backgroundColor}
                onChange={(e) => {
                  onColorChange(e.target.value);
                  onBackgroundSelect(null);
                }}
                placeholder="#FFFFFF"
                className="flex-1"
              />
            </div>
          </div>

          {/* Custom background prompt */}
          <div>
            <Label htmlFor="bg-prompt" className="mb-2 block">
              Or Write Custom Background Prompt
            </Label>
            <Textarea
              id="bg-prompt"
              value={customBackgroundPrompt}
              onChange={(e) => onCustomBackgroundPromptChange(e.target.value)}
              placeholder="Describe your custom background (e.g., 'sunset beach with golden sand', 'modern office interior')"
              className={`min-h-[80px] ${customBackgroundPrompt.length > 250 ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
            />
            <div className={`text-xs mt-1 text-right ${customBackgroundPrompt.length > 250 ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
              {customBackgroundPrompt.length}/250 characters
            </div>
          </div>
          </div>
        </div>
      )}

      {/* Right panel - Output Size */}
      <div className={`bg-card rounded-xl border border-border p-6 ${hideBackgroundOptions ? 'md:col-span-2' : 'md:col-span-2'}`} data-walkthrough-target="fs-output">
        <h3 className="text-lg font-semibold mb-4">Output Size</h3>
        
        <div className="space-y-6">
          {/* Aspect Ratio Selection */}
          <div>
            <Label className="mb-3 block">Aspect Ratio</Label>
            <div className="grid grid-cols-2 gap-2 max-h-[320px] overflow-y-auto pr-2">
            {aspectRatios.map((ratio) => {
                const resolution = resolutions.find(r => r.value === selectedResolution);
                const multiplier = resolution?.multiplier || 1;
                const displayWidth = ratio.width * multiplier;
                const displayHeight = ratio.height * multiplier;
                
                return (
                  <div
                    key={ratio.value}
                    onClick={() => {
                      setSelectedAspectRatio(ratio.value);
                      onOutputSizeChange({
                        width: displayWidth,
                        height: displayHeight,
                      });
                    }}
                    className={`flex flex-col items-center justify-center rounded-md border-2 p-2 cursor-pointer transition-all hover:bg-accent hover:text-accent-foreground ${
                      selectedAspectRatio === ratio.value
                        ? "border-primary bg-primary/10"
                        : "border-muted bg-popover"
                    }`}
                  >
                    <span className="text-sm font-semibold">{ratio.label}</span>
                    <span className="text-xs text-muted-foreground mt-0.5">
                      {displayWidth}×{displayHeight}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Resolution Selection */}
          <div>
            <Label className="mb-3 block text-sm font-semibold">
              Resolution
            </Label>
            <p className="text-xs text-muted-foreground mb-3">
              1K = 2 credits · 2K = 3 credits · 4K = 4 credits
            </p>
            <div className="grid grid-cols-3 gap-2">
              {resolutions.map((res) => (
                <div
                  key={res.value}
                  onClick={() => {
                    setSelectedResolution(res.value);
                    const ratio = aspectRatios.find(r => r.value === selectedAspectRatio);
                    if (ratio) {
                      onOutputSizeChange({
                        width: ratio.width * res.multiplier,
                        height: ratio.height * res.multiplier,
                      });
                    }
                  }}
                  className={`flex flex-col items-center justify-center rounded-md border-2 p-3 cursor-pointer transition-all hover:bg-accent hover:text-accent-foreground ${
                    selectedResolution === res.value
                      ? "border-primary bg-primary/10"
                      : "border-muted bg-popover"
                  }`}
                >
                  <span className="text-sm font-semibold">{res.label}</span>
                  <span className="text-xs text-muted-foreground mt-0.5">
                    {res.multiplier === 1 ? '2 credits' : res.multiplier === 2 ? '3 credits' : '4 credits'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackgroundSelector;