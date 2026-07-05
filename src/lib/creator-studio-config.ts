// Creator Studio v2 (Omni rebuild) — configuration data.
// Single source of truth for the new Video Editing Style block, duration pills,
// voice performance, and the post-generation Video Editing Tool chips.
// NOTE: no model/provider names appear in any user-facing string (branding rule).

export type AspectRatioId = "9:16" | "16:9";
export type DurationSec = 6 | 8 | 10;
export type Fit = "best" | "ok" | "not-ideal";

export interface AspectRatioOption {
  id: AspectRatioId;
  label: string;          // "9:16"
  orientation: string;    // "Vertical"
  platforms: string;      // "TikTok, Reels, Shorts"
}

export const ASPECT_RATIOS: AspectRatioOption[] = [
  { id: "9:16", label: "9:16", orientation: "Vertical", platforms: "TikTok, Reels, Shorts" },
  { id: "16:9", label: "16:9", orientation: "Horizontal", platforms: "YouTube, Websites, Television" },
];

export interface CutStyle {
  id: string;
  name: string;
  description: string;
  defaultDuration: DurationSec;
  fit: Record<AspectRatioId, Fit>;
  /** Why the default duration suits this style — shown under the duration pills. */
  durationHint: string;
}

export const CUT_STYLES: CutStyle[] = [
  {
    id: "no-cuts",
    name: "No cuts",
    description: "Single continuous shot from start to end. Classic UGC feel.",
    defaultDuration: 6,
    fit: { "9:16": "ok", "16:9": "ok" },
    durationHint: "6 sec keeps a single continuous shot punchy and natural.",
  },
  {
    id: "high-dopamine",
    name: "High Dopamine",
    description: "Fast cuts every 1-2 sec. Multiple angles. Built for TikTok scroll-stop.",
    defaultDuration: 8,
    fit: { "9:16": "best", "16:9": "not-ideal" },
    durationHint: "8 sec fits several fast cuts without losing the scroll-stop energy.",
  },
  {
    id: "short-cinematic",
    name: "Short Cinematic",
    description: "2-3 deliberate, composed cuts. Clean transitions. Premium brand feel.",
    defaultDuration: 10,
    fit: { "9:16": "ok", "16:9": "best" },
    durationHint: "10 sec gives each composed cut room to breathe for a premium feel.",
  },
  {
    id: "unboxing-flow",
    name: "Unboxing Flow",
    description: "Reveal-focused cuts: packaging, product, close-up. Builds anticipation.",
    defaultDuration: 8,
    fit: { "9:16": "best", "16:9": "ok" },
    durationHint: "8 sec paces the packaging → product → close-up reveal just right.",
  },
  {
    id: "before-after",
    name: "Before & After",
    description: "Hard cut between a problem shot and a solution shot. High contrast impact.",
    defaultDuration: 8,
    fit: { "9:16": "best", "16:9": "best" },
    durationHint: "8 sec lands the problem → solution contrast with maximum impact.",
  },
  {
    id: "product-spotlight",
    name: "Product Spotlight",
    description: "Slow orbit around product. Macro close-up shots. No talking head.",
    defaultDuration: 6,
    fit: { "9:16": "ok", "16:9": "best" },
    durationHint: "6 sec is enough for a slow orbit and a macro close-up.",
  },
  {
    id: "scene-transition",
    name: "Scene Transition",
    description: "Cuts across 2-3 different locations or settings. Lifestyle breadth.",
    defaultDuration: 10,
    fit: { "9:16": "best", "16:9": "best" },
    durationHint: "10 sec covers 2-3 locations without feeling rushed.",
  },
  {
    id: "day-in-the-life",
    name: "Day-in-the-life",
    description: "Morning, midday and evening structure. Product woven naturally through.",
    defaultDuration: 10,
    fit: { "9:16": "ok", "16:9": "best" },
    durationHint: "10 sec lets the morning → midday → evening story play out naturally.",
  },
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

export const cutStyleById = (id: string): CutStyle =>
  CUT_STYLES.find((c) => c.id === id) ?? CUT_STYLES[0];

// ── Voice Performance (new block #6) ────────────────────────────────────────
// Controls how the voiceover is delivered (per the mockup). The `icon` maps to
// a lucide icon in VoicePerformanceBlock.
export interface VoicePerformance {
  id: string;
  label: string;
  description: string;
  icon: string;
}

export const VOICE_PERFORMANCES: VoicePerformance[] = [
  { id: "enthusiast", label: "Enthusiast", icon: "Zap", description: "High energy, genuine excitement. Sounds like a real fan of the product." },
  { id: "gen-z", label: "Gen-Z", icon: "Gamepad2", description: "Casual, fast-paced, trend-native. Built for TikTok and Reels." },
  { id: "narrator", label: "Narrator", icon: "BookOpen", description: "Clear, warm and measured. Classic voiceover feel for any product." },
  { id: "authoritative", label: "Authoritative", icon: "Crown", description: "Confident and direct. Commands trust. Suits premium and tech brands." },
  { id: "asmr", label: "ASMR", icon: "Feather", description: "Soft, close and intimate. Whisper-quiet delivery that pulls people in." },
  { id: "storyteller", label: "Storyteller", icon: "Heart", description: "Emotional and personal. Feels like a recommendation from a friend." },
  { id: "educator", label: "Educator", icon: "ListChecks", description: "Step-by-step, clear and helpful. Perfect for tutorials and how-tos." },
  { id: "hype", label: "Hype", icon: "Flame", description: "Punchy, loud energy, short lines. Built for drops, launches and promos." },
];

export const voicePerformanceById = (id: string): VoicePerformance =>
  VOICE_PERFORMANCES.find((v) => v.id === id) ?? VOICE_PERFORMANCES[0];

// ── Post-generation Video Editing Tool ──────────────────────────────────────
export const VIDEO_EDIT_CREDITS = 5;
export const VIDEO_EDIT_MAX_CHARS = 500;

export interface EditChip {
  label: string;
  prompt: string;
}

export const VIDEO_EDIT_CHIPS: EditChip[] = [
  { label: "Warmer lighting", prompt: "Make the lighting warmer and more cinematic" },
  { label: "Slow motion", prompt: "Add slow motion to the product reveal moment" },
  { label: "Faster cuts", prompt: "Add upbeat energy and faster pacing to the cuts" },
  { label: "Text overlay", prompt: "Add a subtle text overlay with the product name" },
  { label: "Vibrant colors", prompt: "Make the color grade more vibrant and saturated" },
  { label: "Outdoor scene", prompt: "Move the scene to a bright outdoor environment" },
  { label: "Close-up focus", prompt: "Add an extreme close-up shot of the product label" },
];
