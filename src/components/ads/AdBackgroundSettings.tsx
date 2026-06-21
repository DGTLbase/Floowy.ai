import { ChromePicker } from "react-color";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";

interface AdBackgroundSettingsProps {
  backgroundColor: string;
  setBackgroundColor: (color: string) => void;
  useCustomBackground: boolean;
  setUseCustomBackground: (use: boolean) => void;
  backgroundPrompt: string;
  setBackgroundPrompt: (prompt: string) => void;
}

const AdBackgroundSettings = ({
  backgroundColor,
  setBackgroundColor,
  useCustomBackground,
  setUseCustomBackground,
  backgroundPrompt,
  setBackgroundPrompt,
}: AdBackgroundSettingsProps) => {
  const maxChars = 250;

  return (
    <div className="space-y-4">
      {/* Custom Background Toggle */}
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">Use Custom Background</Label>
        <Switch
          checked={useCustomBackground}
          onCheckedChange={setUseCustomBackground}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {useCustomBackground 
          ? "Background will use your color or prompt description" 
          : "AI will generate a suitable background"}
      </p>

      {useCustomBackground && (
        <div className="space-y-4">
          {/* Background Prompt */}
          <div>
            <Label className="mb-2 block text-sm font-semibold">Background Description</Label>
            <Input
              value={backgroundPrompt}
              onChange={(e) => setBackgroundPrompt(e.target.value.slice(0, maxChars))}
              placeholder="e.g., modern living room, beach sunset, minimalist white studio"
              className="mb-1"
            />
            <p className="text-xs text-muted-foreground">
              {backgroundPrompt.length}/{maxChars} characters
            </p>
          </div>

          {/* Background Color */}
          <div>
            <Label className="mb-2 block text-sm font-semibold">Background Color</Label>
            <p className="text-xs text-muted-foreground mb-2">
              {backgroundPrompt ? "Color will be used if prompt doesn't specify" : "Solid color background"}
            </p>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start gap-3">
                  <div
                    className="w-6 h-6 rounded border"
                    style={{ backgroundColor }}
                  />
                  <span>{backgroundColor}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <ChromePicker
                  color={backgroundColor}
                  onChange={(color) => setBackgroundColor(color.hex)}
                  disableAlpha
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdBackgroundSettings;
