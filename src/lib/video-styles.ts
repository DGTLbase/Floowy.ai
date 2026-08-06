// Video style presets for the "make a video" button on photo results.
//
// WHY THE PROMPTS READ THE WAY THEY DO
// The endpoint is Omni reference-to-video, not image-to-video. The still is a
// REFERENCE the model builds a new video from — it is not the first frame it
// animates. Nothing carries over unless the prompt says so, and the model
// exposes no negative_prompt, so identity and product fidelity have to be
// stated affirmatively, exactly as the image studios state garment fidelity
// (see supabase/functions/_shared/fabric-donts.ts).

export interface VideoStyle {
  id: string;
  label: string;
  emoji: string;
  prompt: string;
}

/** Appended to every style prompt before it is sent. */
export const REFERENCE_FIDELITY =
  " The reference image is the source of truth for how everything looks." +
  " Reproduce the subject exactly as shown: the same person with the same face —" +
  " face shape, bone structure, skin tone, eye colour and eye shape, eyebrows," +
  " nose, lips, jawline, hairline, hair colour and hairstyle — and the same" +
  " products and garments with their exact colours, prints, logos, lettering," +
  " patterns, textures, cut and proportions. This is one single individual and" +
  " one single set of products, identical in every frame, at every camera angle" +
  " and after every cut. Render it as one full-frame live-action shot with" +
  " natural, realistic movement and premium commercial production quality, and" +
  " keep the frame clear of captions, subtitles, titles and watermarks — the only" +
  " lettering visible is the lettering that is physically on the products.";

/** Idea Studio — a product placed into a reimagined scene. */
export const IDEA_STUDIO_VIDEO_STYLES: VideoStyle[] = [
  {
    id: "scene-reveal",
    label: "Scene Reveal",
    emoji: "🎬",
    prompt:
      "The camera pulls back slowly and steadily to reveal the full scene around the product, ending on a wide, composed hero framing. Cinematic and unhurried. The product stays exactly where it is while the camera moves.",
  },
  {
    id: "product-orbit",
    label: "Product Orbit",
    emoji: "🔄",
    prompt:
      "A smooth cinematic orbit around the product, gliding through the scene to show it from several angles. Steady, continuous camera motion. The product stays centred and stationary throughout.",
  },
  {
    id: "ambient-drift",
    label: "Ambient Drift",
    emoji: "🌿",
    prompt:
      "A gentle floating camera drift past the product in its setting. Soft light shifts naturally and the environment breathes — a curtain sways, leaves stir, dust catches the light. The product stays perfectly still.",
  },
  {
    id: "light-shift",
    label: "Light Shift",
    emoji: "✨",
    prompt:
      "Light moves across the scene — shadows travel, highlights bloom and fade, the mood warms. The camera holds nearly still and lets the lighting carry the shot. The product remains perfectly still.",
  },
  {
    id: "zoom-in-detail",
    label: "Zoom to Detail",
    emoji: "🔍",
    prompt:
      "The camera starts wide on the whole scene, then pushes in slowly on the product until its texture and fine detail fill the frame. Cinematic depth-of-field shift as it settles. The product stays still.",
  },
  {
    id: "lifestyle-pan",
    label: "Lifestyle Pan",
    emoji: "🏠",
    prompt:
      "A slow horizontal pan across the scene that discovers the product in context, showing how it lives in the space. Smooth, even camera speed. The product stays in place as the camera glides past.",
  },
];

/** Fashion Studio Pro — outfit mockups worn by a model. */
export const FASHION_PRO_VIDEO_STYLES: VideoStyle[] = [
  {
    id: "runway-walk",
    label: "Runway Walk",
    emoji: "👠",
    prompt:
      "The model walks confidently toward the camera with smooth, elegant strides and poised posture. Professional catwalk energy, rhythmic movement, the full outfit clearly visible head to toe.",
  },
  {
    id: "slow-spin",
    label: "360° Slow Spin",
    emoji: "🔄",
    prompt:
      "The model turns a full slow circle in place, showing the outfit from every side. Graceful, even rotation, arms relaxed, calm confident expression. The garments stay clearly readable throughout the turn.",
  },
  {
    id: "pose-transition",
    label: "Pose to Pose",
    emoji: "✨",
    prompt:
      "The model moves through three elegant poses — standing tall, a slight hip shift, then a hand-on-hip power pose. Fluid, deliberate transitions with editorial fashion energy.",
  },
  {
    id: "street-style",
    label: "Street Style",
    emoji: "🏙️",
    prompt:
      "The model walks casually toward the camera with relaxed street-style confidence. A light breeze moves the fabric, body language natural and candid.",
  },
  {
    id: "editorial-glam",
    label: "Editorial Glam",
    emoji: "📸",
    prompt:
      "The model holds dramatic editorial poses with slow, intentional movement — a hair flip, an over-the-shoulder look, a confident step forward. High-fashion magazine energy with cinematic lighting.",
  },
  {
    id: "outfit-reveal",
    label: "Outfit Reveal",
    emoji: "🎬",
    prompt:
      "The camera starts close on the model's face, then pulls back steadily to reveal the complete outfit head to toe. The model holds a confident pose as the look lands.",
  },
];

/** Style prompt + the fidelity clause + whatever the user typed. */
export const buildVideoPrompt = (style: VideoStyle, customPrompt: string): string => {
  const extra = customPrompt.trim();
  return `${style.prompt}${REFERENCE_FIDELITY}${extra ? ` Additional instructions: ${extra}` : ""}`;
};
