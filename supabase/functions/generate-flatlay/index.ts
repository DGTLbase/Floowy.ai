import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { cleanText, referencePromptSegment, exclusionsPromptSegment, fabricOverrideSegment, insideDefaultSegment, SLUB_LOCK, SILHOUETTE_LOCK, FRAME_LOCK, INTERIOR_COLOUR_LOCK, CONSTRUCTION_LOCK, PATTERN_LOCK } from "../_shared/fabric-donts.ts";
import { buildFlatlayBaseV2 } from "../_shared/flatlay-prompt.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FAL_API_KEY = Deno.env.get('FAL_API_KEY');
    if (!FAL_API_KEY) {
      throw new Error('FAL_API_KEY is not configured');
    }

    const {
      action,
      requestId,
      productImageUrl,
      referenceImageUrl,
      labelImageUrl,
      resolution = "2K",
      aspectRatio = "1:1",
      imageUrl,
      transparentBackground = false,
      backgroundColor,
      mode = "reference", // "reference" | "ai-guess"
      variant = "flatlay", // "flatlay" | "collar-closeup"
      outputType = "flatlay", // "flatlay" | "halo_bust"
      // New Generation Settings blocks — all optional. Names follow the
      // briefing's payload spec; the older fields above predate it and keep
      // their camelCase.
      fabric_reference_image,
      fabric_description,
      lining_reference_image,
      lining_description,
      negative_prompt,
      seed,
      promptVersion = 1,
    } = await req.json();

    // Remove background action - using synchronous API (faster for small images)
    if (action === 'remove-background' && imageUrl) {
      console.log('[REMOVE BG] Starting background removal for:', imageUrl);
      
      // Use synchronous endpoint instead of queue
      const response = await fetch('https://fal.run/fal-ai/bria/background/remove', {
        method: 'POST',
        headers: {
          'Authorization': `Key ${FAL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image_url: imageUrl }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[REMOVE BG] Error:', response.status, errorText);
        throw new Error(`Background removal failed: ${response.status} - ${errorText}`);
      }

      const resultData = await response.json();
      console.log('[REMOVE BG] Result:', JSON.stringify(resultData));

      // Return immediately with COMPLETED status since sync API returns result directly
      return new Response(JSON.stringify({ status: 'COMPLETED', ...resultData }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check status of existing generation
    if (action === 'status' && requestId) {
      console.log('[STATUS CHECK] Request ID:', requestId);
      
      const statusResponse = await fetch(
        `https://queue.fal.run/fal-ai/nano-banana-pro/requests/${requestId}/status`,
        {
          headers: {
            'Authorization': `Key ${FAL_API_KEY}`,
          },
        }
      );

      if (!statusResponse.ok) {
        const errorText = await statusResponse.text();
        console.error('[STATUS CHECK] HTTP Error:', statusResponse.status, errorText);
        throw new Error(`Status check failed: ${statusResponse.status} - ${errorText}`);
      }

      const responseText = await statusResponse.text();
      console.log('[STATUS CHECK] Raw response:', responseText);
      
      let statusData;
      try {
        statusData = JSON.parse(responseText);
      } catch (parseError) {
        console.error('[STATUS CHECK] JSON parse error:', parseError);
        throw new Error(`Failed to parse status response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }
      
      console.log('[STATUS CHECK] Parsed data:', JSON.stringify(statusData));

      // If COMPLETED, fetch the actual result from response_url
      if (statusData.status === 'COMPLETED') {
        console.log('[STATUS CHECK] COMPLETED!');
        
        if (statusData.response_url) {
          console.log('[STATUS CHECK] Fetching result from:', statusData.response_url);
          
          const resultResponse = await fetch(statusData.response_url, {
            headers: {
              'Authorization': `Key ${FAL_API_KEY}`,
            },
          });
          
          if (!resultResponse.ok) {
            console.error('[STATUS CHECK] Failed to fetch result:', resultResponse.status);
            throw new Error(`Failed to fetch result: ${resultResponse.statusText}`);
          }
          
          const resultData = await resultResponse.json();
          console.log('[STATUS CHECK] Result Data:', JSON.stringify(resultData));
          
          return new Response(JSON.stringify({ status: 'COMPLETED', ...resultData }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });
        }
      }

      return new Response(JSON.stringify(statusData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Start new generation
    if (action === 'generate' && productImageUrl) {
      console.log('[GENERATION] Starting flatlay generation');
      console.log('[GENERATION] Product image:', productImageUrl);
      console.log('[GENERATION] Reference image:', referenceImageUrl || '(none — AI guess)');
      console.log('[GENERATION] Label image:', labelImageUrl || '(none)');
      console.log('[GENERATION] Resolution:', resolution);
      console.log('[GENERATION] Aspect ratio:', aspectRatio);
      console.log('[GENERATION] Mode:', mode, 'transparent:', transparentBackground, 'bg:', backgroundColor);

      // Build the prompt for flatlay / halo-bust generation
      let prompt: string;
      let imageUrls: string[];
      const isHalo = outputType === "halo_bust" && variant !== "collar-closeup";

      if (variant === "collar-closeup") {
        // Closeup of the inner back neck / collar to showcase the brand label
        prompt = `Extreme close-up macro product photo of the INNER BACK NECK / COLLAR area of the garment shown in the input image. Frame tightly on the collar and upper back neckline so the neck/collar label is clearly visible and readable. The garment is laid flat on a clean surface, smooth and unwrinkled, shot from directly above with sharp focus on the label area. No models, no mannequins, no people, no hands.

ABSOLUTE COLOR & IDENTITY RULE (HIGHEST PRIORITY): Retain 100% of the garment's original colors, fabric, weave, sheen, texture, stitching color and style exactly as in the input. Do NOT recolor, restyle or reinterpret any detail.`;
        imageUrls = [productImageUrl];
      } else if (isHalo && referenceImageUrl) {
        prompt = `Create a high-end e-commerce halo bust / ghost mannequin product mockup.

IMAGE 1 — PRIMARY PRODUCT REFERENCE: This is the actual garment. Preserve its design exactly: silhouette, proportions, collar shape and size, shoulder construction, sleeve shape and volume, cuffs, hem treatment, closure type, zipper or button placement and hardware, pockets, seams, darts and every construction detail. Do not redesign, simplify, tidy or alter the garment in any way.

Image 1 is equally the source of truth for how the garment LOOKS. Reproduce its exact colours, shades and tonal contrast, its weave structure and the direction and scale of that weave, its pattern, print, motifs and any coloured flecks or slubs, its surface texture, visible yarn, grain, pile and irregularity, its sheen and material finish, and its stitching, trims and hardware colours. Render the cloth as woven fabric at the same crispness and contrast as image 1 — do NOT smooth, soften, blur, denoise, flatten, de-texture or "clean up" the surface, do not reduce a distinct weave to a faint one, and never substitute a generic even grey or plain flat cloth for a structured or flecked one. If a detail is ambiguous, copy it rather than interpret it.

IMAGE 2 — POSE / COMPOSITION REFERENCE ONLY: Copy only the presentation, pose and overall arrangement. Recreate the garment from image 1 as a clean, symmetrical halo bust / ghost mannequin presentation, front-facing and centred, with the sleeves positioned as in image 2. Do NOT copy image 2's colour, pattern, print, fabric, texture, weave, trims, hardware, collar design or construction. Image 2 contributes arrangement and nothing else — if it shows a different garment, that garment is irrelevant.

HALO-BUST SHAPE: Render the garment as if worn by an invisible body — realistic volume through chest, shoulders, torso and sleeves, fabric draping under its own weight, soft inner shadow at the neck opening, inside the sleeves and at the hem. It reads as filled out, not flat. No person, mannequin, hands, skin, hair or limbs are visible anywhere.

PRODUCT PHOTOGRAPHY STYLE: Preserve the authentic product-image appearance of image 1. The finished result must look like the same physical garment professionally photographed for an online fashion store, not a newly designed or reinterpreted one. Soft diffused studio lighting, subtle realistic contact shadow, crisp fabric detail, accurate proportions, premium catalogue finish.

PRIORITY: Product identity and fabric accuracy outrank the pose reference. Wherever image 1 and image 2 disagree about anything other than pose, arrangement and framing, image 1 wins.`;
        imageUrls = [productImageUrl, referenceImageUrl];
      } else if (isHalo) {
        prompt = `Professional e-commerce GHOST-MANNEQUIN ("halo bust" / invisible mannequin) product photo of the garment shown in the input image. Render it as if worn by an invisible human body: natural three-dimensional shape with realistic volume in the chest/shoulders/torso/arms (and legs/hips for bottoms), correctly draped fabric, soft inner shadow at the neckline opening, inside the sleeves and at the hem, and gentle shading along seams and folds to convey depth. The garment must look filled-out and lifelike, NOT flat. ZERO model, mannequin, person, hands, skin, hair, head, neck, legs or feet may be visible — only the garment with realistic body-shaped volume, shot front-on at eye level for a clean e-commerce look.

ABSOLUTE COLOR & IDENTITY RULE (HIGHEST PRIORITY): Retain 100% of the garment's original colors, hues, saturation, brightness, tone, color temperature, gradients, color blocks, stripes, panel colors, trims, prints, patterns, graphics, text, logos, labels, stitching color and style, buttons, zippers, hardware, fabric type, weave, sheen, texture and finish exactly as in the input. Do NOT recolor, restyle, simplify, "clean up" or reinterpret any detail. Do NOT add or hallucinate any stitching, branding, logos, badges, buttons, zippers, pockets or trims that are not present in the input. The collar, zipper, buttons, plackets, cuffs, pockets and hem must sit in the correct anatomical position and proportion.`;
        imageUrls = [productImageUrl];
      } else if (referenceImageUrl) {
        prompt = `Flatlay product photo. Image 1 = THE GARMENT — the single source of truth for ALL visual properties. Image 2 = LAYOUT / POSE TEMPLATE ONLY, and nothing else.

ABSOLUTE COLOR & IDENTITY RULE (HIGHEST PRIORITY — DO NOT VIOLATE): The garment in the output MUST be a pixel-faithful, 1:1 reproduction of the garment in image 1. Retain 100% of: every color, hue, saturation, brightness, contrast, tone, undertone, color temperature, gradient, ombré, color block, stripe, panel color, trim color, print, pattern, motif, graphic, text, typography, logo, label, tag, emblem, badge, stitching color and style, button color, zipper color, hardware, fabric type, weave, sheen, texture, and material finish exactly as in image 1. Do NOT recolor, tint, shift hue, desaturate, oversaturate, brighten, darken, warm up, cool down, restyle, simplify, smooth, "clean up", reinterpret, stylize, or invent any visual property. The output color of every pixel of the garment must be identical to image 1 under neutral studio lighting. Completely IGNORE all colors, prints, patterns, materials and trims from image 2 — image 2 contributes ZERO visual/color information. If any detail is ambiguous, copy it 1:1 from image 1.

LAYOUT RULE (STRICT 1:1 MATCH): Reproduce image 2's exact pose, fold, position, orientation, rotation, angle, framing, perspective, crop and composition pixel-for-pixel — treat image 2 as a precise template that the garment from image 1 must be re-skinned onto. Every sleeve placement, hem position, collar angle, fold line, overlap and silhouette must match image 2 exactly. The only thing changing from image 2 is the garment identity (which comes 100% from image 1); the arrangement, shape on the surface and camera framing must be indistinguishable from image 2. If image 2 shows folds, replicate the same folds; if image 2 shows the garment fully spread, fully spread it. No models, no mannequins, no people, no hands.`;
        imageUrls = [productImageUrl, referenceImageUrl];
      } else {
        prompt = `Professional e-commerce flatlay product photo of the garment shown in the input image. Arrange it in the most flattering, natural flat-lay position for an online store, completely flat, smooth and unwrinkled — sleeves, hem and all panels fully spread and visible with no folds, creases, or bunching.

ABSOLUTE COLOR & IDENTITY RULE (HIGHEST PRIORITY): Retain 100% of the garment's original colors, hues, saturation, brightness, contrast, tone, color temperature, gradients, color blocks, stripes, panel colors, trims, prints, patterns, graphics, text, logos, labels, stitching, buttons, zippers, hardware, fabric, weave, sheen, texture and finish exactly as in the input. Do NOT recolor, tint, shift hue, desaturate, oversaturate, restyle, simplify, "clean up" or reinterpret any color or detail. No models, no mannequins, no people.`;
        imageUrls = [productImageUrl];
      }

      // Prompt v2 (opt-in A/B). Swaps ONLY the base prompt — image roles, order
      // and every appended block below stay identical, so a v1/v2 comparison at
      // a fixed seed isolates the prompt wording and nothing else.
      const useV2 = Number(promptVersion) === 2;
      if (useV2) {
        prompt = buildFlatlayBaseV2({
          kind: variant === "collar-closeup" ? "collar-closeup" : (isHalo ? "halo_bust" : "flatlay"),
          hasReference: imageUrls.length > 1,
        });
      }

      // Background handling — only when transparent flow is NOT requested,
      // we bake the background into the prompt. Transparent removes bg later.
      if (!transparentBackground) {
        if (backgroundColor) {
          prompt += ` Background: a clean solid ${backgroundColor} surface, evenly lit, no texture, no shadows beyond a soft natural drop shadow under the garment.`;
        } else {
          prompt += ` Clean, neutral background only.`;
        }
      } else {
        prompt += ` Clean, neutral background only.`;
      }

      if (typeof labelImageUrl === 'string' && labelImageUrl.length > 0) {
        const labelImageIndex = imageUrls.length + 1;
        if (variant === "collar-closeup") {
          prompt += ` Image ${imageUrls.length + 1} = NECK COLLAR / BRAND LABEL. Composite this label onto the inner back neckline / collar of the garment so it is the clear focal point of the closeup. Align it perfectly with the curve of the collar, follow the fabric drape, and match the garment's lighting and perspective so it looks naturally sewn in. The label must be sharp, fully visible and centered in the frame. Preserve the label's exact colors, typography, logo, graphics, stitching and proportions 1:1 — do NOT redesign, recolor, translate, restyle, simplify or invent any detail of the label.`;
        } else {
          prompt += ` Image ${labelImageIndex} = NECK COLLAR / BRAND LABEL. Composite this label onto the garment exactly where the inner back neckline / collar sits. Align it perfectly with the curve of the collar, follow the fabric drape, and match the garment's lighting and perspective so it looks naturally sewn in. Preserve the label's exact colors, typography, logo, graphics, stitching and proportions 1:1 — do NOT redesign, recolor, translate, restyle, simplify or invent any detail of the label. Keep its size realistic and subtle.`;
        }
        imageUrls.push(labelImageUrl);
      }

      // Fabric close-up and lining reference. Each is added the same way the
      // label is: work out the 1-based slot it will occupy, name that slot in
      // the prompt, then push the URL. Description-only is supported too.
      const fabricDesc = cleanText(fabric_description);
      const hasFabricImg = typeof fabric_reference_image === 'string' && fabric_reference_image.length > 0;
      // Remembered so the override below can name the same slot. Naming it once
      // here and again at the end is deliberate: the slot has to be introduced
      // where the image is added, but the instruction only wins if it is last.
      let fabricImageIndex: number | null = null;
      if (hasFabricImg || fabricDesc) {
        fabricImageIndex = hasFabricImg ? imageUrls.length + 1 : null;
        prompt += referencePromptSegment('fabric', fabricDesc, fabricImageIndex);
        if (hasFabricImg) imageUrls.push(fabric_reference_image);
      }

      const liningDesc = cleanText(lining_description);
      const hasLiningImg = typeof lining_reference_image === 'string' && lining_reference_image.length > 0;
      const hasLiningReference = hasLiningImg || !!liningDesc;
      if (hasLiningImg || liningDesc) {
        prompt += referencePromptSegment('lining', liningDesc, hasLiningImg ? imageUrls.length + 1 : null);
        if (hasLiningImg) imageUrls.push(lining_reference_image);
      }

      // Garment fidelity. These are stated affirmatively in the positive
      // prompt: nano-banana-pro has no negative_prompt, and system_prompt
      // proved too soft — excluded lining kept appearing anyway.
      // v1 appends both locks. v2 already states construction and pattern
      // fidelity once in its own FIDELITY block — re-appending them would
      // reintroduce the duplication the variant exists to test.
      prompt += (useV2 ? "" : CONSTRUCTION_LOCK + PATTERN_LOCK)
        + exclusionsPromptSegment(cleanText(negative_prompt))
        // LAST, deliberately. The locks above re-assert that the product image
        // owns the material; without the final word an uploaded swatch loses.
        + fabricOverrideSegment(fabricImageIndex, fabricDesc)
        // After the override on purpose. The override can point material at a
        // swatch, and a plain swatch would otherwise licence dropping flecks
        // that the product image actually has. Applies to v2 as well.
        + SLUB_LOCK
        // No-op when a lining reference exists, so the two never disagree.
        + insideDefaultSegment(hasLiningReference)
        // Applies in both prompt versions: reference images have roles but were
        // never told their pixels must stay out of the canvas.
        + FRAME_LOCK
        // Unusual proportions are the design, not an error to be corrected.
        + SILHOUETTE_LOCK
        // ABSOLUTELY LAST. It has to outrank the lining reference introduced
        // hundreds of words earlier, and the model's own default of a black
        // jacket interior, both of which were beating the scoped version.
        + INTERIOR_COLOUR_LOCK;

      const requestBody: any = {
        prompt,
        image_urls: imageUrls,
        num_images: 1,
        aspect_ratio: aspectRatio,
        // PNG, not WebP. fal's webp encode is lossy, and it was softening
        // exactly what this tool exists to reproduce — weave, stitch lines,
        // fine print and subtle tonal steps in the fabric. png is also fal's
        // own default here, and what the other garment studios already use.
        // The cost is file size, which matters most at 4K.
        output_format: "png",
        resolution,
      };

      // Optional seed. Without one, every retry re-rolls the whole composition,
      // so a user who liked the layout but not one detail cannot ask for "the
      // same again, fixed" — and neither can we A/B a prompt change, because
      // two runs differ for reasons unrelated to the edit.
      if (typeof seed === 'number' && Number.isFinite(seed)) {
        requestBody.seed = Math.trunc(seed);
      }

      console.log('[GENERATION] Request body:', JSON.stringify(requestBody));

      const response = await fetch('https://queue.fal.run/fal-ai/nano-banana-pro/edit', {
        method: 'POST',
        headers: {
          'Authorization': `Key ${FAL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('FAL API error:', response.status, errorText);
        throw new Error(`FAL API error: ${response.status} ${errorText}`);
      }

      const responseText = await response.text();
      console.log('[GENERATION] Response text:', responseText);
      
      let queueData;
      try {
        queueData = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        throw new Error(`Failed to parse generation response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }
      
      console.log('[GENERATION] Queued:', queueData);

      return new Response(JSON.stringify(queueData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action or missing parameters' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in generate-flatlay function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
