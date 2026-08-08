// Garment fidelity prompting — shared by Flatlay Studio (generate-flatlay),
// Fashion Studio (edit-fashion-image) and Fashion Studio Pro
// (process-batch-mockups) so all three phrase things identically.
//
// NEGATIVE PROMPTING WAS REMOVED
// fal-ai/nano-banana-pro/edit has no negative_prompt field — its whole input is
// prompt, resolution, enable_web_search, aspect_ratio, num_images,
// system_prompt, safety_tolerance, sync_mode, image_urls, limit_generations,
// seed and output_format. Exclusions were previously routed through
// system_prompt, which is a separate steering field but only a soft hint: the
// model kept adding lining that had been explicitly excluded.
//
// Everything is now stated affirmatively in the positive prompt instead. The
// model responds to descriptions of what the garment IS, not to instructions
// about what to leave out, so "no lining" becomes "the garment is unlined and
// the inside is raw and unfinished".

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
 * Indexed variant, for flows whose prompt addresses reference images as
 * "Image 1 = …, Image 2 = …" (Flatlay Studio) rather than by position.
 * `imageIndex` is the 1-based slot the reference will occupy, or null when
 * only a description was given.
 *
 * `kind` selects the wording:
 *   "fabric" → the outer material of the garment
 *   "lining" → the inner lining, visible at an open collar / cuff / hem
 */
export function referencePromptSegment(
  kind: "fabric" | "lining",
  description: string | null,
  imageIndex: number | null,
): string {
  const parts: string[] = [];

  if (imageIndex !== null) {
    parts.push(
      kind === "fabric"
        ? ` Image ${imageIndex} = FABRIC CLOSE-UP. This is a material swatch of the garment's own fabric — it is NOT a separate product, garment or graphic to add. Reproduce its texture, weave, knit structure and sheen across the garment, and do not substitute a different material.`
        // The old wording ended "if no inside is visible, ignore it entirely",
        // which reads as permission to leave the lining out — and the interior
        // was both vanishing and changing colour between renders. It now pins
        // the colour and states the stability requirement outright.
        // A garment's interior is not one colour. The neck facing and inner
        // collar stand are frequently a different, lighter cloth from the body
        // lining, and treating "the lining" as uniform painted the body lining's
        // colour over the collar too — a jacket whose product photo plainly
        // showed a pale grey neck came back black at the collar, because the
        // lining swatch was dark and outranked everything.
        : ` Image ${imageIndex} = BODY LINING REFERENCE. This is the lining of the garment's BODY — the cloth seen deep inside an open front or zip — and it is not a separate product to add. Use it as the exact reference for that lining's colour, depth of tone, material and finish, and reproduce it identically in every render: it must not lighten, darken, shift hue, pick up a tint from the outer fabric, or change material between generations. It applies ONLY to the body interior. It does NOT govern the inner collar stand, the neck facing, the area behind and around the neck label, or any facing visible at the collar — those surfaces are frequently a different and lighter cloth, and they come from the product image, reproduced in whatever colour the product image actually shows there. Do not paint the body lining's colour across the collar and neck.`,
    );
  }

  if (description) {
    parts.push(
      kind === "fabric"
        ? ` The garment fabric is ${description}.`
        : ` The lining is ${description}, shown only where the inside of the garment is visible.`,
    );
  }

  return parts.join("");
}

/**
 * Turns the user's exclusion list into an affirmative constraint.
 *
 * Not a negative prompt: the text is folded into the positive prompt, phrased
 * as a statement about the finished garment. Negation alone ("no buttons") is
 * what the model kept ignoring, so the exclusions are restated as facts about
 * what the garment IS, and reinforced by the construction lock below.
 *
 * Returns "" when the field is empty, so an untouched form changes nothing.
 */
export function exclusionsPromptSegment(donts: string | null): string {
  if (!donts) return "";
  return (
    ` GARMENT EXCLUSIONS — treat as fact, not preference: the finished garment` +
    ` genuinely does not have ${donts}. Render it as a garment that was made` +
    ` without these features in the first place. If a reference image appears to` +
    ` show any of them, that reading is wrong — omit them entirely.`
  );
}

/**
 * Construction lock. The single biggest failure was the model treating the
 * product photo as inspiration and inventing plausible detailing — a fly on
 * trousers, a different closure, moved pockets. This states the opposite as a
 * hard requirement, affirmatively.
 *
 * Always included for garment work; it describes the source photo as the
 * authority rather than excluding anything.
 */
/**
 * Makes an uploaded fabric swatch actually win.
 *
 * THE PROBLEM THIS SOLVES
 * The base prompts state, in caps and marked highest priority, that the product
 * image is the source of truth for "fabric type, weave, sheen, texture and
 * material finish". referencePromptSegment then asks for the swatch's texture
 * instead — one unemphasised sentence, mid-prompt — and CONSTRUCTION_LOCK
 * closes by repeating that the product image is the source of truth. The model
 * hears "product image owns the material" three times with the last word, and
 * once quietly for the swatch, so it resolves against the swatch and the upload
 * appears to do nothing.
 *
 * This is appended LAST, after the locks, and says explicitly which earlier
 * instruction it overrides and how far the override reaches. Scope is material
 * only: colour, print, pattern and construction still come from the product
 * image, so an uploaded swatch can never silently recolour a garment.
 */
export function fabricOverrideSegment(
  imageIndex: number | null,
  description: string | null,
): string {
  if (imageIndex === null && !description) return "";
  const source = imageIndex !== null ? `image ${imageIndex}` : "the fabric description above";
  return ` MATERIAL SOURCE — this overrides every earlier statement about fabric,` +
    ` including the fidelity rule and the construction rule. Those say to take the` +
    ` material from the product image; for material ONLY that is wrong here. The` +
    ` garment's weave, knit structure, surface texture, grain, pile, nap, weight,` +
    ` drape and sheen come from ${source}. Where the product image and ${source}` +
    ` disagree about material, ${source} wins — render the garment as though it` +
    ` were physically cut and sewn from that exact material, at a realistic scale` +
    ` for a garment of this size. Everything else is unchanged and still comes from` +
    ` the product image: colour, print, pattern, logos, lettering, seams, closures,` +
    ` pockets, cut, fit and proportions.`;
}

/**
 * Keeps coloured flecks from being averaged away.
 *
 * OBSERVED FAILURE
 * A donegal tweed blazer — charcoal ground with red, blue, yellow and cream
 * nepps — came back as a flat, uniform grey herringbone. The flecks were the
 * fabric's entire character and every one of them was gone, despite the prompt
 * saying "retain 100% of colours, prints and patterns" seven times in capitals.
 *
 * Generic fidelity language does not save this, because the model is not
 * disobeying a rule it understood — it is regressing to its prior of what a
 * grey blazer looks like, and fine multi-coloured speckle reads to it as noise
 * worth cleaning up. The instruction has to name the specific thing being lost.
 *
 * Harmless on plain cloth: it is conditional on flecks actually being present.
 */
export const SLUB_LOCK =
  ` FLECK AND SLUB PRESERVATION — if the cloth contains coloured flecks, slubs,` +
  ` nepps or contrasting fibres, as donegal tweed, marl, heather, boucle and` +
  ` salt-and-pepper weaves do, they are the fabric's identity and must survive.` +
  ` Reproduce them as discrete, individually visible specks in their own colours` +
  ` — red, blue, yellow, cream, whatever is present — scattered across every` +
  ` panel at the same density, size and randomness as the input. They stay` +
  ` saturated and distinct against the base tone. Do not average them into the` +
  ` ground colour, do not desaturate them toward grey, do not tidy them into a` +
  ` regular pattern, and do not substitute a clean uniform weave such as plain` +
  ` herringbone or twill for a flecked one. Render the cloth coarse where it is` +
  ` coarse: keep the visible yarn, the woven grain and the surface irregularity` +
  ` rather than smoothing it into a flat printed-looking texture.`;

/**
 * Stops the inside of the garment being reinvented every run.
 *
 * OBSERVED FAILURE
 * The interior colour changed from generation to generation — black one run,
 * something else the next — on garments where no lining reference was given.
 *
 * The cause is an instruction gap, not a bad instruction. Every fidelity rule
 * in these prompts is about the garment's outer appearance, and the only clause
 * that mentions the interior is referencePromptSegment('lining'), which is
 * emitted ONLY when a lining reference or description was supplied. With
 * neither, the model has nothing at all to go on for the neck opening, an open
 * front or a turned cuff, so it invents something — and invention is not stable
 * across runs.
 *
 * Emitted only when there is no lining reference, so it never argues with one.
 */
export function insideDefaultSegment(hasLiningReference: boolean): string {
  if (hasLiningReference) return "";
  return ` INSIDE OF THE GARMENT — no lining reference was supplied, so the` +
    ` interior is copied, never designed. Wherever the inside is visible — the` +
    ` neck opening, an open front or zip, a lapel roll, a folded cuff, a turned` +
    ` hem — reproduce exactly what the product image shows there: the same` +
    ` colour, the same material, the same finish. If the product image shows a` +
    ` lining that contrasts with the outer fabric, that lining is a real part of` +
    ` the garment: keep it, in its own colour, and do NOT replace it by wrapping` +
    ` the outer fabric around to the inside. A jacket that has a lining must still` +
    ` have one. Only where the product image genuinely shows no interior at all,` +
    ` render a plain unobtrusive lining consistent with the garment rather than` +
    ` inventing a bold or contrasting one. What you must not do is change the` +
    ` interior from one render to the next: it is whatever the product image says` +
    ` it is, every time.`;
}

/**
 * Keeps fragments of the reference images out of the canvas.
 *
 * OBSERVED FAILURE
 * A soft pink/peach blob appeared in the top-left corner of an otherwise clean
 * flatlay — foreign material, most likely bled in from one of the reference or
 * swatch images.
 *
 * The prompts ask for a "clean, neutral background" but never state that the
 * frame may contain ONLY the garment. Reference images are described by role
 * ("layout template", "fabric close-up") without ever saying their pixels must
 * not appear, so a stray corner of one is not obviously a violation.
 */
export const FRAME_LOCK =
  ` FRAME CONTENTS — the finished image contains the garment and the specified` +
  ` background, and nothing else at all. No part of any reference, template,` +
  ` swatch or label image may appear anywhere in the frame: no corner, edge,` +
  ` fragment, smear or colour bleed from them, and no second copy of the` +
  ` garment. No hanger, hook, rail, clip, pin, tag, price ticket, packaging,` +
  ` prop, hand, furniture, floor, wall or window. The background is even and` +
  ` unbroken right to all four edges and into every corner, carrying nothing but` +
  ` the garment's own soft shadow.`;

/**
 * Stops distinctive proportions being normalised into ordinary ones.
 *
 * OBSERVED FAILURE
 * A bomber whose defining feature is a large, wide collar sweeping across the
 * shoulders came back with an ordinary shirt collar roughly half the size.
 * Everything else was faithful. Its brass zip also rendered as cold chrome.
 *
 * Same mechanism as the flecks: the model is not ignoring "preserve the collar",
 * it is regressing toward its prior of what a bomber jacket looks like, and an
 * exaggerated collar is unusual, so it gets averaged toward typical. Naming
 * "collar shape and size" in a list is not enough — the instruction has to say
 * that the unusual proportion is deliberate and must survive at its true scale.
 */
export const SILHOUETTE_LOCK =
  ` DISTINCTIVE PROPORTIONS — this garment's unusual features are deliberate` +
  ` design, not deviations to be corrected. Reproduce them at their true scale` +
  ` relative to the body. If the collar is oversized, wide, long or dramatically` +
  ` pointed, it stays exactly that large and that shape, covering the same span` +
  ` of the shoulders as in the product image. If the shoulders are gathered or` +
  ` shirred, the gathers stay as full and as densely packed. If the body is boxy` +
  ` or cropped, the sleeves full or blouson, the hem or cuffs banded, those` +
  ` proportions stay. Do not normalise anything toward a conventional garment:` +
  ` do not shrink an oversized collar to a standard one, do not slim a boxy body,` +
  ` do not lengthen a cropped one, do not reduce gathering, and do not regularise` +
  ` a distinctive shape into a generic one. Reproduce metal hardware in its own` +
  ` finish and tone as well — a warm brass or gold zip, button or buckle stays` +
  ` warm and gold, a cold nickel or silver one stays cold and silver, matching` +
  ` the product image exactly rather than defaulting to silver.`;

export const CONSTRUCTION_LOCK =
  ` CONSTRUCTION FIDELITY — the product image is the source of truth, not a` +
  ` starting point. Reproduce the garment exactly as built: the same closure` +
  ` type and position, the same number and placement of buttons, zips, studs and` +
  ` pockets, the same seams, darts, vents, collar and cuff shapes, the same` +
  ` length, cut and fit. Add nothing that is not visible in the product image —` +
  ` no fly, no extra pocket, no topstitching, no hardware — and remove or` +
  ` reposition nothing that is. Where a detail is unclear, reproduce what is` +
  ` visible rather than inventing what such a garment usually has.`;

/**
 * Pattern hold. Patterns were surviving only on whichever panel sat sharpest in
 * frame; the rest went plain. This requires continuity per panel.
 */
export const PATTERN_LOCK =
  ` PATTERN CONTINUITY — if the fabric is patterned (stripe, check, herringbone,` +
  ` twill, print), that pattern must appear on EVERY panel of the garment: front,` +
  ` back, sleeves, collar, lapel, cuffs, pockets and any belt or trim. Match the` +
  ` scale, spacing, colour and direction shown in the product image, following` +
  ` the natural grain of each panel. The pattern must not fade, blur, simplify or` +
  ` become plain fabric anywhere, including areas in shadow, at the edges of the` +
  ` frame, or under folds.`;

