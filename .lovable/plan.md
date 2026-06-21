# Halo Bust (Ghost-Mannequin) Output Type — Flatlay Studio

## What we're shipping

1. **Output Type selector** at the top of Step 2 (Style), radio-card pattern matching the Step 1 Generation Mode cards:
   - **Flatlay** (default) — "Garment laid flat from above."
   - **Halo Bust** — "Ghost-mannequin render with body shape. No model visible."
2. **Reference library swaps** based on Output Type. Categories (Tops, Bottoms, Outerwear, Dresses) stay the same; only the images shown inside swap to the matching type.
3. **Reference conditioning fix** so the reference image is treated as POSE/SHAPE TEMPLATE ONLY and the user's uploaded product is the single source of truth for color, fabric, prints, trims, hardware, and identity.
4. **Halo bust prompt** tuned for the visual quality bar (3D body shape, soft inner shadows at neckline/sleeves/hem, no mannequin/model, correct collar/zipper/button placement, no hallucinated stitching/logos/trims).
5. **Admin panel update**: tag each reference style with its output type so the library can be curated.

## Behavior details

- Switching Output Type does not lose product selections, but clears per-product reference picks (since references are different libraries).
- "My Styles" (user uploads) remain available under both output types — uploaded references are user-owned and the user knows what they're for.
- "Let AI Guess" mode (Step 1) still skips Step 2 and works for both output types; the generation prompt branches on Output Type.
- Credit cost, aspect ratio, resolution, transparent background, background color, and neck-label compositing all work identically for both output types.

## Technical changes

### Database
- New migration adding `output_type text not null default 'flatlay'` to `public.flatlay_styles`, with a check constraint `('flatlay','halo_bust')` and an index on `(output_type, category_id, subcategory_id, sort_order)`.
- All existing rows default to `'flatlay'` so nothing breaks.

### Edge functions
- `admin-manage-flatlay-styles`: accept and persist `output_type` on create/update; return it in `list`.
- `generate-flatlay`: accept `outputType` ('flatlay' | 'halo_bust'). When `halo_bust`, swap to a new prompt that:
  - Treats `referenceImageUrl` strictly as pose/shape/proportion template (zero color/material/identity contribution).
  - Treats `productImageUrl` as the absolute source for color, fabric, weave, stitching, prints, trims, hardware.
  - Requests a ghost-mannequin / invisible-mannequin render with realistic body volume, soft inner shadows at neck/sleeves/hem, correct collar/zipper/button placement, no model or mannequin visible.
  - When no reference is provided (AI-guess), produces a generic well-fitting ghost-mannequin render.

### Frontend
- `FlatlayStudio.tsx`: new `outputType` state, passed into `StylePickerPanel` and into the `generate-flatlay` invoke body. Step 2 header copy updated.
- `StylePickerPanel.tsx`: new `outputType` prop + Output Type selector cards at the top. Library query filters by `output_type`. Switching type clears non-AI-guess selections.
- `AdminFlatlayStylesPanel.tsx`: add an Output Type segmented control on the create/edit style dialog and a top-level filter so admins can curate Flatlay vs Halo Bust libraries side by side.

### Out of scope for this change
- Pre-populating the halo-bust library with curated images. After the schema and UI ship, the admin can upload halo-bust references through the existing admin panel (now filtered by output type).
- Changing pricing or any unrelated Flatlay Studio behavior.

## Review

After implementation finishes, the preview URL (top of the chat) is the staging link — you can review there before publishing.
