// Fashion Video Studio — configuration data (briefing v2.0).
// Single source of truth for garment sections, model attributes, fashion context
// presets, editing styles, aspect ratios, durations and the Edit Video chips.
// NOTE: no model/provider/AI/watermark references appear in any user-facing string
// or prompt addition (branding rule — the output presents purely as a Floowy tool).

// Limited preview: only these emails may see/open the Fashion Video Studio (tile
// on the home page + the tool route). Lowercase. Remove to make it public.
export const FASHION_STUDIO_ALLOWED_EMAILS = ["jefcgealon@gmail.com", "quintin@dgtlbase.com"];

export const canAccessFashionStudio = (email?: string | null): boolean =>
  FASHION_STUDIO_ALLOWED_EMAILS.includes((email ?? "").toLowerCase());

// ── Shared video primitives (mirror Creator Studio) ─────────────────────────
export type AspectRatioId = "9:16" | "16:9";
export type DurationSec = 6 | 8 | 10;

export interface AspectRatioOption {
  id: AspectRatioId;
  label: string;
  orientation: string;
  platforms: string;
}

export const ASPECT_RATIOS: AspectRatioOption[] = [
  { id: "9:16", label: "9:16", orientation: "Vertical", platforms: "TikTok, Reels, Shorts" },
  { id: "16:9", label: "16:9", orientation: "Horizontal", platforms: "YouTube, Websites, Lookbooks" },
];

export interface DurationPill {
  seconds: DurationSec;
  credits: number;
}

export const DURATION_PILLS: DurationPill[] = [
  { seconds: 6, credits: 6 },
  { seconds: 8, credits: 8 },
  { seconds: 10, credits: 10 },
];

export const creditsForDuration = (seconds: DurationSec): number =>
  DURATION_PILLS.find((p) => p.seconds === seconds)?.credits ?? seconds;

// ── Garment upload (briefing §3) ────────────────────────────────────────────
export type GarmentCategoryId = "top" | "bottom" | "shoes" | "accessories";

export interface GarmentSection {
  id: GarmentCategoryId;
  label: string;
  required: boolean;   // "at least one section must be filled" — top/bottom drive validation
  maxItems: number;
  examples: string;    // shown in the upload zone
}

export const GARMENT_SECTIONS: GarmentSection[] = [
  { id: "top", label: "Top", required: true, maxItems: 5, examples: "Shirts, jackets, dresses, tops" },
  { id: "bottom", label: "Bottom", required: false, maxItems: 5, examples: "Trousers, skirts, shorts" },
  { id: "shoes", label: "Shoes", required: false, maxItems: 5, examples: "Any footwear" },
  { id: "accessories", label: "Accessories", required: false, maxItems: 5, examples: "Bags, jewellery, hats, sunglasses" },
];

export const GARMENT_ACCEPTED_FORMATS = ["image/jpeg", "image/png", "image/webp"];
export const GARMENT_MAX_BYTES = 20 * 1024 * 1024; // 20MB each

// Any of these input presentations are valid — communicated in the upload zone.
export const GARMENT_INPUT_TYPES = [
  "Flat lay", "Product shot", "On hanger", "On mannequin", "Already worn",
];

/** Priority badge styling (1 = most screen time). Briefing §3.2. */
export function priorityBadgeClass(priority: number): string {
  if (priority === 1) return "bg-primary text-primary-foreground";        // dark green
  if (priority === 2) return "bg-muted-foreground/70 text-background";     // gray
  return "bg-muted text-muted-foreground";                                // lighter
}

// ── Model selection (briefing §4) ───────────────────────────────────────────
export type ModelMethod = "library" | "upload" | "describe";

export interface ModelAttribute {
  id: string;
  label: string;
  options: string[];
  multi: boolean;      // gender allows one OR both
  default: string[];   // default selection
}

export const MODEL_ATTRIBUTES: ModelAttribute[] = [
  { id: "gender", label: "Gender", options: ["Female", "Male"], multi: true, default: ["Female"] },
  { id: "age", label: "Age range", options: ["18-25", "26-35", "36-50"], multi: false, default: ["18-25"] },
  { id: "body", label: "Body type", options: ["Slim", "Athletic", "Curvy"], multi: false, default: ["Slim"] },
  { id: "skin", label: "Skin tone", options: ["Light", "Medium", "Dark"], multi: false, default: ["Medium"] },
  { id: "hair", label: "Hair", options: ["Dark", "Blonde", "Red"], multi: false, default: ["Dark"] },
];

export const MODEL_DESCRIBE_MAX_CHARS = 200;
export const MODEL_DESCRIBE_PLACEHOLDER =
  "e.g., Tall female model, early 20s, athletic build, dark skin tone, natural curly hair, confident pose...";
export const MODEL_UPLOAD_ACCEPTED = ["image/jpeg", "image/png"];

/** Default library-attribute selection keyed by attribute id. */
export const MODEL_LIBRARY_DEFAULTS: Record<string, string[]> = Object.fromEntries(
  MODEL_ATTRIBUTES.map((a) => [a.id, [...a.default]]),
);

/** Build the model description string from selected library attributes. */
export function libraryModelPrompt(selected: Record<string, string[]>): string {
  const gender = (selected.gender ?? []).join(" and ") || "Female";
  const parts = [
    `${gender.toLowerCase()} model`,
    `${(selected.age ?? [])[0] ?? "18-25"} years old`,
    `${((selected.body ?? [])[0] ?? "Slim").toLowerCase()} build`,
    `${((selected.skin ?? [])[0] ?? "Medium").toLowerCase()} skin tone`,
    `${((selected.hair ?? [])[0] ?? "Dark").toLowerCase()} hair`,
  ];
  return parts.join(", ");
}

// ── Fashion context presets (briefing §5) ───────────────────────────────────
export interface ContextPreset {
  id: string;
  name: string;
  description: string;   // short card copy
  prompt: string;        // full prompt addition
}

export const CONTEXT_PRESETS: ContextPreset[] = [
  {
    id: "street-urban",
    name: "Street / urban",
    description: "City sidewalks, graffiti walls, urban energy.",
    prompt: "Urban street environment. City sidewalks, brick walls, graffiti murals and urban architecture. Natural overcast daylight. Editorial street photography aesthetic.",
  },
  {
    id: "luxury-runway",
    name: "Luxury runway",
    description: "Clean white runway, dramatic lighting, high-fashion production.",
    prompt: "High-fashion runway setting. Clean white polished floor, dramatic overhead key lighting, minimal background. Professional fashion show production quality.",
  },
  {
    id: "casual-lifestyle",
    name: "Casual lifestyle",
    description: "Park, cafe, city stroll. Natural light, relaxed and aspirational.",
    prompt: "Casual lifestyle environment. Outdoor park, coffee shop terrace or city pavement stroll. Warm natural daylight. Relaxed, aspirational and authentic feel.",
  },
  {
    id: "sporty-athleisure",
    name: "Sporty / athleisure",
    description: "Gym, outdoor track, urban workout. Active and energetic.",
    prompt: "Active sports environment. Modern gym interior, outdoor running track or urban workout space. Dynamic lighting, energetic atmosphere.",
  },
  {
    id: "beach-resort",
    name: "Beach / resort",
    description: "Sandy shores, ocean backdrop, warm golden light.",
    prompt: "Beach and resort setting. Sandy shore with ocean in background. Warm golden hour sunlight. Holiday and resort wear atmosphere.",
  },
  {
    id: "evening-nightlife",
    name: "Evening / nightlife",
    description: "Neon-lit streets, rooftop bars, upscale venues. Night-out wear.",
    prompt: "Evening nightlife environment. Neon-lit city streets, upscale rooftop bar or luxury venue interior. Warm artificial lighting mixed with city night atmosphere.",
  },
  {
    id: "studio-minimal",
    name: "Studio minimal",
    description: "Pure white or grey backdrop, clean light. E-commerce ready.",
    prompt: "Minimal studio setting. Pure white seamless background, soft diffused studio lighting from all sides. Clean, product-focused and e-commerce ready.",
  },
  {
    id: "nature-organic",
    name: "Nature / organic",
    description: "Forest, fields, coastal cliffs. Earthy and sustainable feel.",
    prompt: "Natural outdoor environment. Dense forest, open countryside fields or coastal cliffs. Soft natural daylight. Organic, earthy and sustainable atmosphere.",
  },
];

export const CONTEXT_DEFAULT_ID = "street-urban";
export const CONTEXT_CUSTOM_MAX_CHARS = 200;
export const CONTEXT_CUSTOM_PLACEHOLDER =
  "e.g., Rainy Paris street at dusk with cafe lights in the background";

export const contextById = (id: string): ContextPreset | undefined =>
  CONTEXT_PRESETS.find((c) => c.id === id);

// ── Video editing styles (briefing §6) ──────────────────────────────────────
export interface EditingStyle {
  id: string;
  name: string;
  description: string;
  prompt: string;
  cuts: string;   // "None" | "2-3" | "5+" ...
}

export const EDITING_STYLES: EditingStyle[] = [
  {
    id: "slow-reveal",
    name: "Slow reveal",
    description: "Single fluid pan from head to toe. Elegant and composed.",
    prompt: "Camera performs a slow continuous pan from head to toe revealing the full outfit. No cuts. Smooth and elegant movement.",
    cuts: "None",
  },
  {
    id: "editorial-cuts",
    name: "Editorial cuts",
    description: "2-3 deliberate cuts. Different angles and garment details. Magazine feel.",
    prompt: "2-3 deliberate editorial cuts: wide establishing shot, three-quarter angle, close-up on garment detail. Fashion magazine aesthetic.",
    cuts: "2-3",
  },
  {
    id: "high-energy",
    name: "High energy",
    description: "Fast cuts, dynamic angles, movement-driven. Built for TikTok and Reels.",
    prompt: "Fast-paced editing with cuts every 1-2 seconds. Dynamic camera angles, movement and energy. Optimised for social media scroll-stop.",
    cuts: "5+",
  },
  {
    id: "runway-walk",
    name: "Runway walk",
    description: "Model walks toward camera with front and profile cuts. Catwalk feel.",
    prompt: "Model walks directly toward camera on a runway. Cut between front-facing approach and side profile view. Classic catwalk presentation.",
    cuts: "2",
  },
  {
    id: "360-spin",
    name: "360 spin",
    description: "Camera orbits the full outfit. Every angle shown. Ideal for e-commerce.",
    prompt: "Camera performs a full 360-degree orbit around the model revealing all angles of the outfit. Smooth continuous rotation.",
    cuts: "None",
  },
  {
    id: "detail-focus",
    name: "Detail focus",
    description: "Macro cuts on fabric, stitching and textures. Craftsmanship showcase.",
    prompt: "Series of extreme close-up cuts on fabric texture, stitching details, buttons, zips and garment construction. Tactile and premium.",
    cuts: "4-6",
  },
];

export const EDITING_DEFAULT_ID = "slow-reveal";
export const EDITING_CUSTOM_MAX_CHARS = 200;
export const EDITING_CUSTOM_PLACEHOLDER =
  "e.g., Quick outfit reveal starting from the shoes upward with a dramatic zoom on the logo";

export const editingStyleById = (id: string): EditingStyle | undefined =>
  EDITING_STYLES.find((e) => e.id === id);

// Whether a style permits sequential hard cuts (drives the backend prompt).
export const editingStyleAllowsCuts = (id: string): boolean => {
  const s = editingStyleById(id);
  return !!s && s.cuts !== "None";
};

// ── Audio (generated video now includes sound) ──────────────────────────────
export interface AudioOption {
  id: string;
  label: string;
  description: string;
  prompt: string;            // audio directive appended to the video prompt
  hasMusicStyle?: boolean;
}

export const AUDIO_OPTIONS: AudioOption[] = [
  { id: "natural", label: "Natural sound", description: "Ambient sound that fits the scene.", prompt: "AUDIO: natural ambient sound that matches the scene. No voiceover, no speech." },
  { id: "music", label: "Background music", description: "Add music — no speech.", prompt: "AUDIO: background music only, no speech, no voiceover.", hasMusicStyle: true },
  { id: "sfx", label: "SFX only", description: "Subtle sound effects, no music.", prompt: "AUDIO: subtle sound effects and foley only (footsteps, fabric, ambience). No music, no speech, no voiceover." },
  { id: "silent", label: "No sound", description: "Completely silent.", prompt: "AUDIO: completely silent — no music, no sound effects, no speech, no voiceover." },
];

export const AUDIO_DEFAULT_ID = "natural";

export interface MusicStyle { id: string; label: string; prompt: string; }
export const MUSIC_STYLES: MusicStyle[] = [
  { id: "upbeat", label: "Upbeat", prompt: "upbeat, energetic" },
  { id: "chill", label: "Chill", prompt: "chill, relaxed, lo-fi" },
  { id: "cinematic", label: "Cinematic", prompt: "cinematic, dramatic" },
  { id: "elegant", label: "Elegant", prompt: "elegant, sophisticated fashion-runway" },
];
export const MUSIC_DEFAULT_ID = "upbeat";

export const audioOptionById = (id: string): AudioOption =>
  AUDIO_OPTIONS.find((a) => a.id === id) ?? AUDIO_OPTIONS[0];
export const musicStyleById = (id: string): MusicStyle =>
  MUSIC_STYLES.find((m) => m.id === id) ?? MUSIC_STYLES[0];

/** Final audio directive from the selected option (+ music style when applicable). */
export function resolveAudioPrompt(audioId: string, musicStyleId: string): string {
  const opt = audioOptionById(audioId);
  if (opt.hasMusicStyle) {
    return `AUDIO: ${musicStyleById(musicStyleId).prompt} background music, no speech, no voiceover.`;
  }
  return opt.prompt;
}

// ── Post-generation Edit Video (briefing §8) ────────────────────────────────
export const FASHION_EDIT_CREDITS = 5;
export const FASHION_EDIT_MAX_CHARS = 500;

export interface EditChip {
  label: string;
  prompt: string;
}

export const FASHION_EDIT_CHIPS: EditChip[] = [
  { label: "Change scene", prompt: "Move the scene to a luxury hotel lobby environment" },
  { label: "Better lighting", prompt: "Improve the lighting to be warmer and more flattering" },
  { label: "Add movement", prompt: "Add more natural movement and flow to the model's walk" },
  { label: "Focus on outfit", prompt: "Zoom in tighter on the garment and reduce background" },
  { label: "Different angle", prompt: "Show the outfit from a different camera angle" },
  { label: "Slower pace", prompt: "Slow down the camera movement for a more elegant feel" },
  { label: "Sharper detail", prompt: "Enhance sharpness and clarity on the garment texture" },
  { label: "More energy", prompt: "Make the editing faster and more dynamic" },
];

// ── Generate-button + validation helpers (briefing §3 validation, §7) ───────
export interface GarmentCounts {
  top: number;
  bottom: number;
  shoes: number;
  accessories: number;
}

/**
 * Validation (briefing §3): at least one garment overall, and specifically at
 * least one Top or Bottom (shoes/accessories alone is not enough).
 * Returns null when valid, otherwise the message to show.
 */
export function garmentValidationError(counts: GarmentCounts): string | null {
  const total = counts.top + counts.bottom + counts.shoes + counts.accessories;
  if (total === 0) return "Please upload at least one garment to continue.";
  if (counts.top === 0 && counts.bottom === 0) {
    return "Please upload at least one top or bottom garment.";
  }
  return null;
}
