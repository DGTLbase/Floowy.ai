import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface AdOutputSettingsProps {
  outputSize: string;
  setOutputSize: (size: string) => void;
  onCreditCostChange?: (credits: number) => void;
}

// Ambience studio aspect ratios
const ASPECT_RATIOS = [
  { label: "21:9", width: 1584, height: 672 },
  { label: "16:9", width: 1376, height: 768 },
  { label: "3:2", width: 1264, height: 848 },
  { label: "4:3", width: 1200, height: 896 },
  { label: "5:4", width: 1152, height: 928 },
  { label: "1:1", width: 1024, height: 1024 },
  { label: "4:5", width: 928, height: 1152 },
  { label: "3:4", width: 896, height: 1200 },
  { label: "2:3", width: 848, height: 1264 },
  { label: "9:16", width: 768, height: 1376 },
];

// Additional ad-specific sizes
const AD_SIZES = [
  { label: "FB Ads", width: 1200, height: 628, description: "1200×628" },
  { label: "Pinterest", width: 960, height: 1200, description: "960×1200" },
  { label: "Banner", width: 1200, height: 300, description: "1200×300" },
];

const RESOLUTIONS = [
  { label: "1K", multiplier: 1, credits: 2 },
  { label: "2K", multiplier: 2, credits: 3 },
  { label: "4K", multiplier: 4, credits: 4 },
];

const AdOutputSettings = ({
  outputSize,
  setOutputSize,
  onCreditCostChange,
}: AdOutputSettingsProps) => {
  const [selectedRatio, setSelectedRatio] = useState("1:1");
  const [selectedAdSize, setSelectedAdSize] = useState<string | null>(null);
  const [resolution, setResolution] = useState(1);

  // Notify parent of credit cost changes
  useEffect(() => {
    const currentRes = RESOLUTIONS.find(r => r.multiplier === resolution);
    const creditCost = selectedAdSize ? 2 : (currentRes?.credits || 2);
    onCreditCostChange?.(creditCost);
  }, [resolution, selectedAdSize, onCreditCostChange]);

  useEffect(() => {
    // Try to match current output size
    const [w, h] = outputSize.split('x').map(Number);
    
    // Check ad sizes first
    const adMatch = AD_SIZES.find(s => s.width === w && s.height === h);
    if (adMatch) {
      setSelectedAdSize(adMatch.label);
      setSelectedRatio("");
      setResolution(1);
      return;
    }

    // Check aspect ratios with multipliers
    for (const ratio of ASPECT_RATIOS) {
      for (const res of RESOLUTIONS) {
        if (ratio.width * res.multiplier === w && ratio.height * res.multiplier === h) {
          setSelectedRatio(ratio.label);
          setSelectedAdSize(null);
          setResolution(res.multiplier);
          return;
        }
      }
    }
  }, []);

  const handleRatioSelect = (ratio: typeof ASPECT_RATIOS[0]) => {
    setSelectedRatio(ratio.label);
    setSelectedAdSize(null);
    const newWidth = Math.round(ratio.width * resolution);
    const newHeight = Math.round(ratio.height * resolution);
    setOutputSize(`${newWidth}x${newHeight}`);
  };

  const handleAdSizeSelect = (size: typeof AD_SIZES[0]) => {
    setSelectedAdSize(size.label);
    setSelectedRatio("");
    setResolution(1); // Ad sizes are fixed, no resolution multiplier
    setOutputSize(`${size.width}x${size.height}`);
  };

  const handleResolutionSelect = (multiplier: number) => {
    if (selectedAdSize) return; // Don't allow resolution change for fixed ad sizes
    setResolution(multiplier);
    const currentRatio = ASPECT_RATIOS.find(r => r.label === selectedRatio) || ASPECT_RATIOS[5];
    const newWidth = Math.round(currentRatio.width * multiplier);
    const newHeight = Math.round(currentRatio.height * multiplier);
    setOutputSize(`${newWidth}x${newHeight}`);
  };

  // Get current dimensions for display
  const getCurrentDimensions = () => {
    if (selectedAdSize) {
      const size = AD_SIZES.find(s => s.label === selectedAdSize);
      return size ? `${size.width}×${size.height}` : outputSize.replace('x', '×');
    }
    const ratio = ASPECT_RATIOS.find(r => r.label === selectedRatio) || ASPECT_RATIOS[5];
    return `${Math.round(ratio.width * resolution)}×${Math.round(ratio.height * resolution)}`;
  };

  return (
    <div className="space-y-6">
      {/* Aspect Ratio Selection */}
      <div>
        <Label className="mb-3 block text-sm font-semibold">Aspect Ratio</Label>
        <div className="grid grid-cols-5 gap-2">
          {ASPECT_RATIOS.map((ratio) => (
            <div
              key={ratio.label}
              onClick={() => handleRatioSelect(ratio)}
              className={cn(
                "flex flex-col items-center justify-center rounded-md border-2 p-2 cursor-pointer transition-all hover:bg-accent hover:text-accent-foreground",
                selectedRatio === ratio.label && !selectedAdSize
                  ? "border-primary bg-primary/10"
                  : "border-muted bg-popover"
              )}
            >
              <span className="text-sm font-semibold">{ratio.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Ad-specific sizes */}
      <div>
        <Label className="mb-3 block text-sm font-semibold">Ad Sizes</Label>
        <div className="grid grid-cols-3 gap-2">
          {AD_SIZES.map((size) => (
            <div
              key={size.label}
              onClick={() => handleAdSizeSelect(size)}
              className={cn(
                "flex flex-col items-center justify-center rounded-md border-2 p-2 cursor-pointer transition-all hover:bg-accent hover:text-accent-foreground",
                selectedAdSize === size.label
                  ? "border-primary bg-primary/10"
                  : "border-muted bg-popover"
              )}
            >
              <span className="text-xs font-semibold">{size.label}</span>
              <span className="text-[10px] text-muted-foreground">{size.description}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Resolution Selection */}
      <div>
        <Label className="mb-3 block text-sm font-semibold">Resolution</Label>
        <p className="text-xs text-muted-foreground mb-2">
          Current: {getCurrentDimensions()}px
          {selectedAdSize && " (fixed size)"}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {RESOLUTIONS.map((res) => (
            <div
              key={res.label}
              onClick={() => handleResolutionSelect(res.multiplier)}
              className={cn(
                "flex flex-col items-center justify-center rounded-md border-2 p-2 cursor-pointer transition-all",
                selectedAdSize ? "opacity-50 cursor-not-allowed" : "hover:bg-accent hover:text-accent-foreground",
                resolution === res.multiplier && !selectedAdSize
                  ? "border-primary bg-primary/10"
                  : "border-muted bg-popover"
              )}
            >
              <span className="text-sm font-semibold">{res.label}</span>
              <span className="text-[10px] text-muted-foreground">{res.credits} credits</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default AdOutputSettings;
