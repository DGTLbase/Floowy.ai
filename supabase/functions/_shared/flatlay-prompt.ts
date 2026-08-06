// Consolidated flatlay base prompts (prompt version 2).
//
// WHY THIS EXISTS
// The v1 prompts state the same constraint many times in competing phrasings:
// seven separate "HIGHEST PRIORITY" claims and eleven "DO NOT"s across the
// flatlay paths, plus CONSTRUCTION_LOCK and PATTERN_LOCK appended on top. The
// halo+reference base alone is ~3,600 characters before anything is added.
//
// Seven highest priorities cannot all be highest. Restating one rule in many
// forms spreads salience rather than concentrating it, and models tend to
// satisfy the last framing they read. These say each thing once, in priority
// order, concretely — roughly a third of the length.
//
// This is a HYPOTHESIS under test, not an established improvement. It is opt-in
// via promptVersion: 2 and meant to be compared against v1 with a fixed seed,
// same product, same reference. v1 remains the default until the comparison
// says otherwise.

export type FlatlayKind = "flatlay" | "halo_bust" | "collar-closeup";

/** Stated once, and the only place fidelity is described in v2. */
const FIDELITY = (source: string) =>
  `GARMENT FIDELITY — ${source} is the sole source of truth for how the garment looks. ` +
  `Reproduce exactly: every colour and shade, gradient and colour block, print, pattern, ` +
  `motif, graphic, logo, label and any printed lettering, plus weave, texture, sheen, ` +
  `stitching colour and style, buttons, zips, trims and hardware. Reproduce the construction ` +
  `as built: the same seams, panels, closures, pockets, collar and cuffs, in the same places, ` +
  `at the same proportions. Add nothing that is not there — no invented stitching, branding, ` +
  `pockets or trims — and remove nothing that is. If a detail is unclear, copy it rather than ` +
  `interpret it. If the fabric is patterned, the pattern runs continuously and correctly across ` +
  `every panel, matching at the seams and following the drape, at consistent scale and angle.`;

const LAYOUT_TEMPLATE =
  `LAYOUT — image 1 is a template for arrangement only and contributes nothing to how the ` +
  `garment looks. Reproduce its pose, fold, rotation, framing, perspective, crop, scale and ` +
  `centring exactly: same sleeve placement, hem position, collar angle, fold lines and overlaps. ` +
  `Do not mirror, straighten or re-frame it. Ignore image 1's colours, prints, materials and trims entirely.`;

const HALO_SHAPE =
  `SHAPE — render the garment as if worn by an invisible body: realistic volume through chest, ` +
  `shoulders, torso and sleeves, fabric draping under its own weight, soft inner shadow at the ` +
  `neck opening, inside the sleeves and at the hem. It reads as filled out, not flat. No person, ` +
  `mannequin, hands, skin, hair or limbs are visible anywhere — only the garment holding a body shape.`;

const NO_PEOPLE = `The frame contains only the garment: no models, mannequins, people or hands.`;

/**
 * The base prompt, before background / label / fabric / lining / exclusions are
 * appended by the caller exactly as they are for v1.
 */
export function buildFlatlayBaseV2(opts: {
  kind: FlatlayKind;
  hasReference: boolean;
}): string {
  const { kind, hasReference } = opts;

  if (kind === "collar-closeup") {
    return [
      `Extreme close-up macro product photo of the inner back neck and collar of the garment in ` +
        `the input image, laid flat, smooth and unwrinkled, shot from directly above with sharp ` +
        `focus on the neck label so it is fully readable and centred in frame.`,
      FIDELITY("the input image"),
      NO_PEOPLE,
    ].join("\n\n");
  }

  if (kind === "halo_bust") {
    return hasReference
      ? [
          `Professional e-commerce ghost-mannequin (invisible mannequin) product photo. ` +
            `Image 1 sets the pose and orientation. Image 2 is the garment.`,
          `ORIENTATION — match image 1's view angle, camera height and tilt, body rotation, ` +
            `shoulder line, lean, sleeve position, hem angle, crop, scale and centring exactly. ` +
            `If image 1 shows the back, output the back; if it shows a three-quarter view, output ` +
            `that same three-quarter view at the same rotation. Do not mirror, flip or normalise it.`,
          FIDELITY("image 2"),
          HALO_SHAPE,
        ].join("\n\n")
      : [
          `Professional e-commerce ghost-mannequin (invisible mannequin) product photo of the ` +
            `garment in the input image, shot front-on at eye level.`,
          FIDELITY("the input image"),
          HALO_SHAPE,
        ].join("\n\n");
  }

  return hasReference
    ? [
        `Professional e-commerce flatlay product photo. Image 1 sets the layout. Image 2 is the garment.`,
        LAYOUT_TEMPLATE,
        FIDELITY("image 2"),
        NO_PEOPLE,
      ].join("\n\n")
    : [
        `Professional e-commerce flatlay product photo of the garment in the input image, laid ` +
          `flat and arranged in its most natural, flattering position for an online store — ` +
          `sleeves, hem and every panel spread and visible, smooth, with no bunching.`,
        FIDELITY("the input image"),
        NO_PEOPLE,
      ].join("\n\n");
}
