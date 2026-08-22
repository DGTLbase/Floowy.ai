// Video Recreation Studio — configuration (briefing v1.0).
// Transforms an existing uploaded video via chip-selected edits. Single source of
// truth for access, credits, limits and the edit-builder chips. No model/provider
// references appear in any user-facing string (branding rule).

// Limited preview: only these emails see the home tile + can open the tool route.
// Admins are additionally allowed at the page level. Lowercase.
export const VIDEO_RECREATION_ALLOWED_EMAILS = ["jefcgealon@gmail.com", "quintin@dgtlbase.com", "donny@dgtlbase.com"];
export const canAccessVideoRecreation = (email?: string | null): boolean =>
  VIDEO_RECREATION_ALLOWED_EMAILS.includes((email ?? "").toLowerCase());

// Fixed cost per generation (any number of edits).
export const RECREATION_CREDITS = 8;
export const MAX_VIDEO_MB = 500;
// Upload duration cap. The recreation backend uses an omni/gemini video-to-video
// model (not Veo's ~8s ceiling), which handles longer clips; 10s was over-cautious.
// Safe to raise: a length the model can't process just fails the job, and credits
// deduct ONLY on a successful render (recreate-video charges nothing on failure).
export const MAX_VIDEO_SECONDS = 30;
export const CUSTOM_MAX_CHARS = 300;
export const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/quicktime"]; // MP4, MOV

export type RecCategoryId = "scene" | "product" | "lighting" | "style" | "time";
export interface RecChip { id: string; label: string; prompt: string; icon: string; }
export interface RecCategory { id: RecCategoryId; label: string; icon: string; chips: RecChip[]; }

// icon = lucide-react component name, resolved in the page.
export const REC_CATEGORIES: RecCategory[] = [
  {
    id: "scene", label: "Scene", icon: "MapPin",
    chips: [
      { id: "hotel-lobby", label: "Luxury hotel lobby", icon: "Building2", prompt: "Replace the background scene with an elegant luxury hotel lobby — marble surfaces, warm ambient lighting, upscale interior." },
      { id: "rooftop", label: "Rooftop terrace", icon: "Building", prompt: "Set the scene on a stylish rooftop terrace with a city skyline backdrop." },
      { id: "beach-sunset", label: "Beach at sunset", icon: "Sunset", prompt: "Place the scene on a beach at sunset with warm golden light and gentle ocean waves." },
      { id: "forest", label: "Dense forest", icon: "Trees", prompt: "Set the scene in a lush dense forest with natural greenery and dappled light." },
      { id: "city-night", label: "City street at night", icon: "Moon", prompt: "Set the scene on a vibrant city street at night with neon signage and soft bokeh lights." },
      { id: "white-studio", label: "White studio", icon: "Frame", prompt: "Place the subject on a clean, seamless white studio backdrop." },
      { id: "kitchen", label: "Modern kitchen", icon: "Utensils", prompt: "Set the scene in a bright, modern kitchen interior." },
      { id: "market", label: "Outdoor market", icon: "Store", prompt: "Set the scene in a lively outdoor market with stalls and warm ambience." },
    ],
  },
  {
    id: "product", label: "Product", icon: "Box",
    chips: [
      { id: "highlight", label: "Highlight product", icon: "Focus", prompt: "Draw focus to the product with a subtle highlight and shallow depth of field." },
      { id: "change-color", label: "Change color", icon: "Paintbrush", prompt: "Tastefully change the product's colour while keeping its shape, logos and details." },
      { id: "float", label: "Make it float", icon: "Feather", prompt: "Make the product gently float in mid-air with a weightless, premium feel." },
      { id: "reflection", label: "Add reflection", icon: "FlipVertical", prompt: "Add a clean reflective surface beneath the product with a realistic reflection." },
      { id: "condensation", label: "Add condensation", icon: "Droplets", prompt: "Add fresh condensation droplets on the product surface for a cool, fresh look." },
      { id: "particles", label: "Add particles", icon: "Sparkles", prompt: "Add subtle floating particles and sparkles around the product for a premium atmosphere." },
      { id: "remove", label: "Remove product", icon: "Eraser", prompt: "Remove the product from the scene while keeping the environment and motion intact." },
    ],
  },
  {
    id: "lighting", label: "Lighting", icon: "Sun",
    chips: [
      { id: "warm-golden", label: "Warm golden", icon: "Sun", prompt: "Relight the scene with warm golden tones." },
      { id: "cool-studio", label: "Cool studio", icon: "Lightbulb", prompt: "Relight with cool, even studio lighting." },
      { id: "dramatic", label: "Dramatic shadows", icon: "Drama", prompt: "Add dramatic directional lighting with deep, defined shadows." },
      { id: "neon", label: "Neon glow", icon: "Zap", prompt: "Add a colourful neon glow lighting the scene." },
      { id: "soft", label: "Soft diffused", icon: "Cloud", prompt: "Use soft, diffused, flattering lighting." },
      { id: "sunrise-back", label: "Sunrise backlight", icon: "Sunrise", prompt: "Backlight the subject with a warm sunrise glow and gentle lens flare." },
      { id: "candle", label: "Candlelight", icon: "Flame", prompt: "Light the scene with warm, flickering candlelight." },
    ],
  },
  {
    id: "style", label: "Style", icon: "Palette",
    chips: [
      { id: "cinematic", label: "Cinematic grade", icon: "Clapperboard", prompt: "Apply a cinematic colour grade with rich contrast and filmic tones." },
      { id: "bw", label: "Black and white", icon: "Contrast", prompt: "Convert to a high-contrast black and white look." },
      { id: "vintage", label: "Vintage film", icon: "Camera", prompt: "Apply a vintage film look with subtle grain and faded colours." },
      { id: "hyperreal", label: "Hyper-realistic", icon: "Gem", prompt: "Enhance to a crisp, hyper-realistic, high-detail look." },
      { id: "cartoon", label: "Cartoon", icon: "Smile", prompt: "Restyle into a stylised cartoon / animated look." },
      { id: "editorial", label: "Luxury editorial", icon: "Crown", prompt: "Apply a luxury editorial magazine aesthetic." },
    ],
  },
  {
    id: "time", label: "Time of day", icon: "Clock",
    chips: [
      { id: "morning", label: "Morning", icon: "CloudSun", prompt: "Set the time of day to bright, fresh morning light." },
      { id: "golden-hour", label: "Golden hour", icon: "SunMedium", prompt: "Set the time to golden hour with a warm, low sun." },
      { id: "blue-hour", label: "Blue hour", icon: "CloudMoon", prompt: "Set the time to blue hour twilight." },
      { id: "night", label: "Night", icon: "MoonStar", prompt: "Set the time of day to night." },
      { id: "overcast", label: "Overcast day", icon: "Cloudy", prompt: "Set the time to a soft, overcast day." },
    ],
  },
];

export const REC_TABS: { id: "all" | RecCategoryId; label: string; icon: string }[] = [
  { id: "all", label: "All", icon: "LayoutGrid" },
  ...REC_CATEGORIES.map((c) => ({ id: c.id, label: c.label, icon: c.icon })),
];

// Flat lookup of every chip by id.
export const REC_CHIP_BY_ID: Record<string, RecChip> = Object.fromEntries(
  REC_CATEGORIES.flatMap((c) => c.chips.map((ch) => [ch.id, ch])),
);
