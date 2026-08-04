// Fabric reference + Don'ts (exclusions) — shared by Fashion Studio
// (edit-fashion-image) and Fashion Studio Pro (process-batch-mockups) so both
// flows phrase them identically.
//
// WHY THE DON'TS ARE NOT APPENDED TO THE PROMPT
// Both studios run fal-ai/nano-banana-pro/edit, whose input schema is:
//   prompt, resolution, enable_web_search, aspect_ratio, num_images,
//   system_prompt, safety_tolerance, sync_mode, image_urls,
//   limit_generations, seed, output_format
// There is NO negative_prompt field. Concatenating exclusions into `prompt` is
// exactly the failure the briefing is trying to prevent — "no buttons" sitting
// in the positive prompt reads to the model as a request for buttons. So the
// exclusions travel in `system_prompt`, which is a separate steering field.

/** Trim + collapse whitespace; empty/whitespace-only becomes null. */
export const cleanText = (v: unknown): string | null => {
  const s = typeof v === "string" ? v.trim().replace(/\s+/g, " ") : "";
  return s.length > 0 ? s : null;
};

/**
 * Sentence describing the fabric reference, appended to the positive prompt.
 *
 * `imagePosition` says where the close-up sits in image_urls, because the model
 * is told which slot to look at:
 *   "last"           → nothing follows it
 *   "second-to-last" → a background reference follows it (Pro only)
 *   null             → no close-up was uploaded (description only)
 *
 * Returns "" when neither a close-up nor a description was given, so an
 * untouched form leaves the prompt byte-identical to today's.
 */
export function fabricPromptSegment(
  description: string | null,
  imagePosition: "last" | "second-to-last" | null,
): string {
  const parts: string[] = [];

  if (imagePosition) {
    const which = imagePosition === "last" ? "LAST" : "SECOND-TO-LAST";
    parts.push(
      ` FABRIC REFERENCE: the ${which} reference image is a close-up of the actual fabric — it is a material swatch, NOT a garment to add to the outfit and NOT a person. Reproduce its texture, weave, knit structure, sheen and how it catches light on the garment. Do not invent a different material.`,
    );
  }

  if (description) {
    parts.push(
      ` The garment fabric is ${description}. Render it as that material${
        imagePosition ? ", consistent with the close-up reference" : ""
      }.`,
    );
  }

  return parts.join("");
}

/**
 * The `system_prompt` sent to fal. Returns null when the user left Don'ts
 * empty, so the request body is unchanged from today's for existing users.
 */
export function dontsSystemPrompt(donts: string | null): string | null {
  if (!donts) return null;
  return (
    "The following elements must NOT appear anywhere in the generated image. " +
    "Treat each as a strict exclusion, never as something to add: " +
    donts +
    ". If the reference images contain any of these, omit them from the result."
  );
}
