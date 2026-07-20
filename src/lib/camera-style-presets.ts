// Camera / Film Style Presets (briefing 2026-07-10). A dropdown on each studio
// injects a camera/film style string into the generation prompt. Single source of
// truth — edit the prompt strings here without touching any studio page.
// Default is "No style" (CAMERA_STYLE_NONE) → nothing injected.

export interface CameraPreset { id: string; label: string; prompt: string; }
export interface CameraPresetGroup { label: string; presets: CameraPreset[]; }

export const CAMERA_STYLE_NONE = "none";

export const CAMERA_STYLE_GROUPS: CameraPresetGroup[] = [
  {
    label: "Film cameras",
    presets: [
      { id: "contax-t2", label: "Contax T2", prompt: "Shot on Contax T2, Kodak Portra 400, flash photography, slight grain" },
      { id: "mamiya-rz67", label: "Mamiya RZ67", prompt: "Shot on Mamiya RZ67, medium format film, faded warm tones, analog grain" },
      { id: "canon-ae1", label: "Canon AE-1", prompt: "Shot on Canon AE-1, 35mm film, Kodak Gold 200, vintage tones" },
    ],
  },
  {
    label: "Smartphone cameras",
    presets: [
      { id: "iphone-16-pro", label: "iPhone 16 Pro", prompt: "Shot on iPhone 16 Pro, natural light, candid look, 35mm feel" },
      { id: "iphone-15-pro-max", label: "iPhone 15 Pro Max", prompt: "Shot on iPhone 15 Pro Max, flash on, raw authentic vibe" },
      { id: "samsung-s24-ultra", label: "Samsung Galaxy S24 Ultra", prompt: "Shot on Samsung Galaxy S24 Ultra, night mode, moody tones, sharp detail" },
      { id: "samsung-s23-ultra", label: "Samsung Galaxy S23 Ultra", prompt: "Shot on Samsung Galaxy S23 Ultra, portrait mode, vivid colors, soft bokeh" },
      { id: "pixel-8-pro", label: "Google Pixel 8 Pro", prompt: "Shot on Google Pixel 8 Pro, natural light, true-to-life colors, subtle HDR" },
      { id: "huawei-p60-pro", label: "Huawei P60 Pro", prompt: "Shot on Huawei P60 Pro, XMAGE color, warm natural tones, soft depth" },
      { id: "oneplus-12", label: "OnePlus 12", prompt: "Shot on OnePlus 12, Hasselblad color science, rich tones, sharp detail" },
      { id: "xiaomi-14-ultra", label: "Xiaomi 14 Ultra", prompt: "Shot on Xiaomi 14 Ultra, Leica Summilux lens, cinematic color, fine grain" },
    ],
  },
  {
    label: "Professional cameras",
    presets: [
      { id: "hasselblad-h6d", label: "Hasselblad H6D", prompt: "Shot on Hasselblad H6D, medium format, studio lighting, ultra sharp" },
      { id: "leica-m11", label: "Leica M11", prompt: "Shot on Leica M11, 50mm Summilux, natural daylight, crisp detail" },
      { id: "canon-eos-r5", label: "Canon EOS R5", prompt: "Shot on Canon EOS R5, 85mm f/1.2, cinematic shallow depth" },
      { id: "sony-a7r-iv", label: "Sony A7R IV", prompt: "Shot on Sony A7R IV, 70-200mm, three-point lighting" },
      { id: "fujifilm-gfx-100s", label: "Fujifilm GFX 100S", prompt: "Shot on Fujifilm GFX 100S, 110mm f/2, hyper detailed" },
      { id: "nikon-z9", label: "Nikon Z9", prompt: "Shot on Nikon Z9, 24-70mm, documentary style" },
    ],
  },
];

const PRESET_BY_ID: Record<string, CameraPreset> = Object.fromEntries(
  CAMERA_STYLE_GROUPS.flatMap((g) => g.presets).map((p) => [p.id, p]),
);

// The style string to append to a generation prompt for a given selection.
// Returns "" for "No style" / unknown, so callers can safely concatenate.
export const cameraStylePrompt = (id?: string | null): string =>
  id && id !== CAMERA_STYLE_NONE ? PRESET_BY_ID[id]?.prompt ?? "" : "";
