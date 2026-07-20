import { Camera } from "lucide-react";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectLabel, SelectItem,
} from "@/components/ui/select";
import { CAMERA_STYLE_GROUPS, CAMERA_STYLE_NONE } from "@/lib/camera-style-presets";

interface Props {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  /** Show a small "Camera style" label above the select. */
  showLabel?: boolean;
}

/**
 * Grouped camera/film style dropdown used across all studios. Default is
 * "No style". Selecting a preset injects its prompt string via cameraStylePrompt().
 */
const CameraStylePresetSelect = ({ value, onChange, className, showLabel = true }: Props) => (
  <div className={className}>
    {showLabel && (
      <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
        <Camera className="h-4 w-4" /> Camera style
      </label>
    )}
    <Select value={value || CAMERA_STYLE_NONE} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="No style" />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        <SelectItem value={CAMERA_STYLE_NONE}>No style</SelectItem>
        {CAMERA_STYLE_GROUPS.map((group) => (
          <SelectGroup key={group.label}>
            <SelectLabel>{group.label}</SelectLabel>
            {group.presets.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  </div>
);

export default CameraStylePresetSelect;
