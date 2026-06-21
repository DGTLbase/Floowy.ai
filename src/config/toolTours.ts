import type { ToolTourStep } from "@/components/ToolWalkthroughTour";

export interface ToolTourConfig {
  toolKey: string;
  route: string;
  steps: ToolTourStep[];
}

/** Each tool's first-time 5-step walkthrough. Mirrors the Ambience pattern. */
export const TOOL_TOURS: Record<string, ToolTourConfig> = {
  fashion: {
    toolKey: "fashion",
    route: "/tool/fashion",
    steps: [
      { target: "tool-upload", title: "Upload your garment", body: "Drag in or browse for the main clothing item you want to dress your model in. Use a clear, front-facing photo on a plain background." },
      { target: "fs-pose", title: "Select a pose", body: "Pick a pose for your model — front, side, or three-quarter — to control the framing of the shot." },
      { target: "tool-model", title: "Select an avatar", body: "Choose from our library of AI models or upload your own. Filter by gender, age, body type, and ethnicity." },
      { target: "fs-extras", title: "Add tops, trousers & shoes", body: "Optionally upload additional garments so your model wears the full outfit instead of just the main piece." },
      { target: "fs-accessories", title: "Add accessories", body: "Optionally drop in jewelry, bags, watches or other accessories — they're incorporated realistically into the look." },
      { target: "fs-bg", title: "Pick a background", body: "Choose a preset background, set a custom color, or describe a custom scene with a short prompt." },
      { target: "fs-output", title: "Output size & resolution", body: "Set your aspect ratio and resolution tier (1K fast, 2K pro, 4K ultra). Higher resolution costs more credits." },
      { target: "fs-generate", title: "Generate", body: "Hit Generate to render your shot. Credits are only spent on successful runs." },
    ],
  },
  "fashion-2.0": {
    toolKey: "fashion-2.0",
    route: "/tool/fashion-2.0",
    steps: [
      { target: "fsp-angles", placement: "bottom", title: "Select Angles for This Outfit", body: "Pick which angles — front, back, left, right — you want generated for this outfit. Each selected angle becomes one mockup." },
      { target: "tool-upload", placement: "bottom", title: "Select Outfit Type", body: "Choose a full outfit (one-piece) or separate pieces (layered look), then upload the views for each piece you've selected." },
      { target: "tool-model", placement: "bottom", title: "Upload Model", body: "Upload front, back, left and right photos of your model. The more views you upload, the more angles you can generate." },
      { target: "tool-prompt", placement: "bottom", title: "Select Pose", body: "Pick the pose your model should hold across all generated mockups." },
      { target: "tool-style", placement: "bottom", title: "Background", body: "Pick a background preset, upload a reference image, or describe a custom scene." },
      { target: "tool-output", placement: "bottom", title: "Output Size and Resolution", body: "Set the aspect ratio and resolution tier (1K, 2K, 4K). Higher resolution costs more credits." },
      { target: "fsp-generate", placement: "bottom", title: "Generate", body: "Hit Generate to render all selected views. Credits are only spent on successful runs." },
    ],
  },
  "flatlay-studio": {
    toolKey: "flatlay-studio",
    route: "/tool/flatlay-studio",
    steps: [
      { target: "tool-model", title: "Pick a generation mode", body: "Choose Reference Based for the most accurate result, or let AI guess the layout for a faster pass." },
      { target: "tool-upload", title: "Add your products", body: "Drop in up to 10 product images. Each becomes its own flat lay — original fold and orientation are respected." },
      { target: "tool-style", title: "Choose a reference style", body: "On the Style step, pick from the Floowy library, upload your own reference, or reuse a saved one." },
      { target: "tool-output", title: "Settings: background & size", body: "On the Settings step, set background color (or transparent), aspect ratio, and resolution." },
      { target: "tool-prompt", title: "Review & generate", body: "On the Summary step, double-check your setup and hit Generate. Credits are only spent on successful runs." },
    ],
  },
  "ads-listing": {
    toolKey: "ads-listing",
    route: "/tool/ads-listing-studio",
    steps: [
      { target: "tool-upload", title: "Upload your product", body: "Add the product you want to turn into an ad creative or marketplace listing." },
      { target: "tool-output", title: "Pick size & resolution", body: "Choose aspect ratio (square, story, landscape) and resolution. This sets the canvas for your ad." },
      { target: "tool-style", title: "Set the background", body: "Pick a background color or describe a custom scene to match your channel — Meta, TikTok, marketplace listings." },
      { target: "tool-model", title: "Pick model or product-only", body: "Choose Product Only for clean catalog shots or pick a model for lifestyle ads." },
      { target: "tool-prompt", title: "Add headline & text", body: "Write your headline copy, CTA, and logo placement. Text overlays on top of the generated visual." },
    ],
  },
  "listing-studio": {
    toolKey: "listing-studio",
    route: "/tool/listing-studio",
    steps: [
      { target: "ls-upload", title: "Upload your product", body: "Drop in the product photo you want featured in your marketplace listing image." },
      { target: "ls-output", placement: "top", title: "Size & resolution", body: "Pick the aspect ratio and resolution tier (1K, 2K, 4K). Higher resolution costs more credits." },
      { target: "ls-bg", placement: "top", title: "Background", body: "Keep the original or switch on a custom background — describe the scene and pick a fallback color." },
      { target: "ls-model", placement: "top", title: "Model", body: "Choose Product Only, Hand Only, or With Model. For With Model, pick a Floowy avatar or let AI generate one." },
      { target: "ls-brand", placement: "top", title: "Brand colors (optional)", body: "Add primary and secondary brand colors to tint accents, bars, and icons across the layout." },
      { target: "ls-logo", placement: "top", title: "Logo (optional)", body: "Upload your logo and set its position and size on the final image." },
      { target: "ls-language", placement: "top", title: "Overlay language", body: "Pick the language used for any text overlays AI writes into the image." },
      { target: "ls-template", placement: "top", title: "Template & platform", body: "Choose a layout — USP, Step-by-step, or Describe yourself — and the marketplace it's tailored for." },
      { target: "ls-generate", placement: "top", title: "Generate", body: "Hit Generate to render your listing image. Credits are only spent on successful runs." },
    ],
  },
  "creator-studio": {
    toolKey: "creator-studio",
    route: "/tool/creator-studio",
    steps: [
      { target: "tool-upload", title: "Upload your product", body: "Add the product you want a creator to showcase — UGC-style content starts here." },
      { target: "cs-name", title: "Name your product", body: "Type the product name. It's used in the auto-generated voiceover script and on-screen mentions." },
      { target: "cs-language", title: "Pick a language", body: "Choose the voiceover language and accent — your creator will speak in this voice." },
      { target: "cs-category", title: "Set the category", body: "Pick the product category (or leave on Auto-Detect) so the AI tailors the script and angles." },
      { target: "cs-voiceover", title: "Choose voiceover style", body: "Let AI write the script, write your own custom voiceover, or generate a silent video." },
      { target: "tool-model", title: "Pick a creator", body: "Browse the avatar grid and pick the creator persona that fits your audience." },
      { target: "tool-style", title: "Choose a video style", body: "Pick the UGC style — selfie, hand-held, mirror, lifestyle — to set the camera feel." },
      { target: "tool-prompt", title: "Describe the scene", body: "Add a short scene direction (20-30 words) — environment, action, and product placement." },
      { target: "tool-output", title: "Generate", body: "Hit Generate to produce your UGC video. Credits are only spent on successful runs." },
    ],
  },
  "idea-studio": {
    toolKey: "idea-studio",
    route: "/tool/idea-studio",
    steps: [
      { target: "tool-upload", title: "Add reference & product", body: "Upload a reference photo (the scene/vibe you want) on the left and the product you want featured on the right." },
      { target: "tool-model", title: "Pick an avatar (optional)", body: "Optionally choose an avatar or upload your own model to anchor the scene around a person." },
      { target: "tool-prompt", title: "Describe background & lighting", body: "Write a short prompt describing the setting and lighting style — e.g. soft morning light in a minimalist loft." },
      { target: "tool-style", title: "Choose output size", body: "Pick the aspect ratio and resolution for your final image." },
      { target: "tool-output", title: "Generate", body: "Hit Generate to render your idea. Credits are only spent on successful runs — iterate freely." },
     ],
   },
   atmospheric: {
     toolKey: "atmospheric",
     route: "/tool/atmospheric",
     steps: [
       { target: "ambience-intro", title: "Welcome to Ambience Studio", body: "Turn product shots into moody, atmospheric scenes. Here's a quick tour of the controls." },
       { target: "ambience-upload", title: "Upload your product", body: "Drop in a clean product photo — ideally on a plain background so the AI can relight it." },
       { target: "ambience-time", title: "Time of Day", body: "Pick Day or Night to set the overall lighting direction for your scene." },
       { target: "ambience-mode", title: "Model Presence", body: "Choose whether to include a model with your product, and pick gender or upload a custom model." },
       { target: "ambience-mood", title: "Mood & Style Presets", body: "Pick a mood preset or describe a custom atmosphere — warm golden hour, cinematic noir, soft minimalist, etc." },
       { target: "ambience-output", title: "Output size & resolution", body: "Set aspect ratio and resolution tier (1K, 2K, 4K). Higher resolution costs more credits." },
       { target: "ambience-generate", title: "Generate", body: "Hit Generate to render your atmospheric shots. Credits are only spent on successful runs." },
     ],
   },
   "virtual-tour": {
     toolKey: "virtual-tour",
     route: "/tool/property-studio",
     steps: [
       { target: "vt-images", placement: "side", title: "Property Images", body: "Upload at least 2 photos of the property. Each image becomes a 4s animated clip — drag to reorder them in the final video." },
       { target: "vt-logo", placement: "side", title: "Logo (optional)", body: "Drop in your agency or brand logo to overlay it on the final property video." },
       { target: "vt-details", placement: "side", title: "Property Details", body: "Add the project name, address and price. These are used in the on-screen titles and voiceover script." },
       { target: "vt-aspect", placement: "side", title: "Aspect Ratio", body: "Pick 16:9 for landscape (web, YouTube) or 9:16 for portrait (Reels, TikTok, Stories)." },
       { target: "vt-generate", placement: "side", title: "Generate", body: "Hit Generate Property Video to render the full tour. Credits are only spent on successful runs." },
     ],
   },
 };