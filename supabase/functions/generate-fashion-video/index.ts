import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getUserTier, isAdmin, tierMeets, tierDenied } from "../_shared/tier.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Branding-clean prompt for Omni reference-to-video. The garments (and optional
// model) are sent directly as reference images — there is NO composed still — so
// the prompt must describe the model, tell it to wear the referenced garments,
// and (when a slot has multiples) rotate through each one per segment.
function buildFashionPrompt(opts: {
  modelPrompt: string;
  hasModelRef: boolean;
  contextPrompt: string;
  editingPrompt: string;
  allowCuts: boolean;
  garmentSummary: Record<string, number>;
  duration: number;
  audioPrompt?: string;
  rotation?: { label: string; count: number } | null;
}): string {
  const { modelPrompt, hasModelRef, contextPrompt, editingPrompt, allowCuts, garmentSummary, duration, audioPrompt, rotation } = opts;
  const rotating = !!rotation && rotation.count > 1;

  const modelLine = hasModelRef
    ? 'Feature the exact model shown in the reference images, wearing the referenced garments. Keep this same person — the same face and identity — for the entire video.'
    : (modelPrompt
        ? `Feature ${modelPrompt} wearing the referenced garments. Keep this same person — the same face and identity — for the entire video.`
        : 'Feature a professional fashion model wearing the referenced garments. Keep the same model — the same face and identity — for the entire video.');

  // The garment categories present in the references (constant part of the look).
  const worn: string[] = [];
  if ((garmentSummary.top ?? 0) > 0 && rotation?.label !== 'tops') worn.push('top');
  if ((garmentSummary.bottom ?? 0) > 0 && rotation?.label !== 'bottoms') worn.push('bottom');
  if ((garmentSummary.shoes ?? 0) > 0 && rotation?.label !== 'pairs of shoes') worn.push('footwear');
  if ((garmentSummary.accessories ?? 0) > 0 && rotation?.label !== 'accessories') worn.push('accessories');

  let outfitLine: string;
  if (rotating) {
    // Even distribution: split the runtime into equal segments, one look each.
    const seg = duration / rotation!.count;
    const windows = Array.from({ length: rotation!.count }, (_, i) =>
      `${rotation!.label.replace(/s$/, '')} ${i + 1} from ${(i * seg).toFixed(1)}s to ${((i + 1) * seg).toFixed(1)}s`).join(', ');
    const constant = worn.length ? ` combined with the same ${worn.join(', ')} throughout` : '';
    outfitLine =
      `The reference images include ${rotation!.count} DIFFERENT ${rotation!.label}. The model wears them ONE AT A TIME${constant}, each ${rotation!.label.replace(/s$/, '')} shown for an EQUAL segment of the runtime. Split the ${duration}s into ${rotation!.count} equal ${seg.toFixed(1)}s segments and wear exactly one per segment, changing with a clean quick cut on each boundary: ${windows}. Distribute the time evenly — never linger on one or rush the others, and do not repeat one. Keep each garment's exact colour, pattern, texture and proportions; between segments ONLY the ${rotation!.label} change, everything else stays identical.`;
  } else {
    outfitLine = worn.length
      ? `The reference images include the garments (${worn.join(', ')}). Combine them into one complete cohesive outfit and keep each garment's exact colour, pattern, texture and proportions.`
      : "Combine the garments in the reference images into one complete cohesive outfit, keeping their exact colours and details.";
  }

  return [
    `A high-quality styled fashion video, approximately ${duration} seconds.`,
    modelLine,
    outfitLine,
    contextPrompt ? `Scene and atmosphere: ${contextPrompt}` : '',
    editingPrompt ? `Camera and editing: ${editingPrompt}` : '',
    audioPrompt || '',
    (allowCuts || rotating)
      ? 'Use clean, deliberate sequential cuts over time — never split screens, collage or side-by-side panels shown at once.'
      : 'Single continuous shot — no cuts, no split screens, no collage.',
    'CRITICAL — the model is ONE single consistent person from the first frame to the last. Keep the exact same face and facial features: identical face shape, bone structure and proportions, skin tone and complexion, eye colour and eye shape, eyebrows, nose, lips and mouth, jawline, cheekbones, ears, hairline, hair colour and hairstyle. This same recognisable individual must appear in every shot, every camera angle, every cut, every segment and every single frame. Absolutely NO face swap, NO morphing, NO blending with a different face, NO aging or de-aging, NO gradual drift or shifting of the identity over time — the face must never change. This is especially important across cuts and between outfit/garment segments: after any cut or garment change it is still the exact same person with the exact same face. Do not beautify, reshape or "average" the face — reproduce the reference person faithfully and hold it stable throughout.',
    'CRITICAL — reproduce every garment EXACTLY as it appears in the reference images: identical colours and exact shades, prints, graphics, logos, brand marks, embroidery, any text or lettering printed on the clothing, patterns, stripes, seams, stitching, buttons, zips, collars, textures, cut and fit. Preserve all original logos, prints and graphics that are ON the garments — do NOT remove, blur, recolour, redraw, reposition, simplify or invent any garment detail. No warping, morphing or distortion.',
    'Do NOT add any on-screen text, captions, subtitles, titles, watermarks, or overlay graphics/logos that are not part of the garments themselves. One full-frame composition. Natural, realistic human movement. Premium professional fashion production quality.',
  ].filter(Boolean).join(' ');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FAL_API_KEY = Deno.env.get('FAL_API_KEY');
    if (!FAL_API_KEY) {
      throw new Error('FAL_API_KEY is not configured');
    }

    const body = await req.json();
    const { action, requestId } = body;

    console.log('[FASHION-VIDEO] Action:', action, 'RequestId:', requestId);

    // Every video path in this function runs on Omni reference-to-video. Both the
    // per-image "make a video" button and Fashion Video Studio share this model so
    // there is one endpoint to reason about, and it stays env-overridable so the
    // exact fal path can change without a code deploy.
    //
    // Verified input schema (fal OpenAPI, google/gemini-omni-flash/reference-to-video):
    //   prompt      string, required, max 20000 chars
    //   image_urls  string[], required, 1–10 items
    //   aspect_ratio "16:9" | "9:16", default "16:9"
    //   duration    INTEGER seconds, 3–10, default 8
    // There is no negative_prompt, no generate_audio, no cfg_scale and no
    // start_image_url — anything the model must avoid has to be said
    // affirmatively in the prompt instead.
    const VIDEO_MODEL = Deno.env.get('FAL_VIDEO_MODEL_FASHION') || 'google/gemini-omni-flash';
    const REF_MODEL = Deno.env.get('FAL_VIDEO_REF_MODEL') || `${VIDEO_MODEL}/reference-to-video`;

    // Tier gate (Tier Briefing): Fashion Video Studio is a Starter+ tool. Only
    // guard the generation actions (status polling stays open). Admins bypass.
    if (action === 'generate' || action === 'generate_studio') {
      const supa = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        { auth: { persistSession: false } },
      );
      const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
      const { data: userData } = await supa.auth.getUser(token);
      const uid = userData?.user?.id;
      if (!uid) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (!(await isAdmin(supa, uid)) && !tierMeets(await getUserTier(supa, uid), 'starter')) {
        return tierDenied('starter', corsHeaders);
      }
    }

    // ============================================
    // ACTION: STATUS - Check video generation status
    // ============================================
    if (action === 'status' && requestId) {
      const { statusUrl, responseUrl } = body;
      console.log('[STATUS] Checking status for request:', requestId);

      // Use the status_url from the queue response. The fallback drops the model's
      // sub-path because fal's queue is keyed on the base app id.
      const checkUrl = statusUrl || `https://queue.fal.run/${VIDEO_MODEL}/requests/${requestId}/status`;
      
      const statusResponse = await fetch(checkUrl, {
        method: 'GET',
        headers: { 'Authorization': `Key ${FAL_API_KEY}` },
      });

      if (!statusResponse.ok) {
        const raw = await statusResponse.text();
        console.log('[STATUS] Non-OK response:', statusResponse.status, raw);
        try {
          const parsed = JSON.parse(raw);
          if (statusResponse.status === 400 &&
            (parsed.detail?.includes('in progress') || parsed.detail === 'Request is still in progress')) {
            return new Response(
              JSON.stringify({ status: 'PROCESSING' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          return new Response(
            JSON.stringify({ status: 'FAILED', error: parsed?.detail || 'Unknown error' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch {
          return new Response(
            JSON.stringify({ status: 'FAILED', error: `Status check failed: ${statusResponse.status}` }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      const statusData = await statusResponse.json();
      console.log('[STATUS] Video status data:', JSON.stringify(statusData));

      if (statusData.status === 'COMPLETED') {
        // Fetch actual result from response_url
        const resultUrl = responseUrl || statusData.response_url || `https://queue.fal.run/${VIDEO_MODEL}/requests/${requestId}`;
        console.log('[STATUS] Fetching result from:', resultUrl);

        const resultResponse = await fetch(resultUrl, {
          headers: { 'Authorization': `Key ${FAL_API_KEY}` },
        });

        const resultRaw = await resultResponse.text();
        let resultData: any = null;
        try { resultData = JSON.parse(resultRaw); } catch { /* non-JSON body */ }

        const videoUrl = resultData?.video?.url
          || resultData?.video_url
          || resultData?.output?.video?.url
          || resultData?.output?.videos?.[0]?.url
          || resultData?.videos?.[0]?.url;

        if (videoUrl) {
          return new Response(
            JSON.stringify({ status: 'COMPLETED', video_url: videoUrl }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Completed but produced NO video → the model failed for these inputs
        // (e.g. "Could not generate a video within given inputs"). Surface the
        // provider's reason as FAILED so the user is told why, instead of looping
        // until timeout with a generic message.
        const reason =
          resultData?.detail || resultData?.error?.message || resultData?.error ||
          resultData?.message || (resultRaw ? resultRaw.slice(0, 400) : '') ||
          'The model could not generate a video from the given inputs.';
        console.error('[STATUS] Completed without a video:', resultResponse.status, resultRaw.slice(0, 400));
        return new Response(
          JSON.stringify({ status: 'FAILED', error: typeof reason === 'string' ? reason : JSON.stringify(reason) }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Explicit error/failed queue states → surface, don't keep polling.
      const s = String(statusData.status || '').toUpperCase();
      if (s === 'ERROR' || s === 'FAILED') {
        const reason =
          statusData?.error?.message || statusData?.error || statusData?.detail ||
          'Video generation failed for the given inputs.';
        return new Response(
          JSON.stringify({ status: 'FAILED', error: typeof reason === 'string' ? reason : JSON.stringify(reason) }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ status: 'PROCESSING' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================
    // ACTION: GENERATE - Submit video generation
    // ============================================
    if (action === 'generate') {
      const { imageUrl, prompt, aspect_ratio = '9:16', duration_seconds = 6 } = body;
      console.log('[GENERATE] Starting video from reference image:', imageUrl);

      if (!imageUrl || typeof imageUrl !== 'string') {
        throw new Error('imageUrl is required');
      }

      const safeAspect = (aspect_ratio === '16:9' || aspect_ratio === '9:16') ? aspect_ratio : '9:16';
      // Schema bounds: integer, 3–10 seconds. A string here is not what the model
      // declares, so send a real number.
      const safeDuration = Math.min(10, Math.max(3, Math.round(Number(duration_seconds) || 6)));

      // Reference-to-video, not image-to-video: the still is a reference the model
      // builds from, not a first frame it animates. Nothing carries over unless the
      // prompt says so — and since the model has no negative_prompt, every rule is
      // phrased as a positive statement of what the footage IS, the same way the
      // image studios state garment fidelity.
      const videoPrompt = `${prompt || 'A model showcasing the outfit with smooth, natural movement. Subtle body rotation, a confident walk or pose transition. Clean background, professional fashion video feel.'}

FIDELITY — the reference image is the source of truth. The person in the video is the same individual shown there, with the same face shape, bone structure, skin tone, eye colour and eye shape, eyebrows, nose, lips, jawline, hairline, hair colour and hairstyle, held identical in every single frame, at every camera angle and across any cut. The garments and products are the ones shown there, with the same colours, prints, logos, lettering, patterns, textures, cut and proportions, and they stay clearly visible throughout. Render it as one continuous full-frame live-action shot with natural, realistic human movement and premium production quality. The only lettering anywhere in frame is the lettering physically printed on the garments and products.`;

      const requestBody = {
        prompt: videoPrompt,
        image_urls: [imageUrl],
        aspect_ratio: safeAspect,
        duration: safeDuration,
      };

      console.log('[GENERATE] request:', JSON.stringify({
        model: REF_MODEL, aspect_ratio: safeAspect, duration: safeDuration, prompt_chars: videoPrompt.length,
      }));

      const response = await fetch(`https://queue.fal.run/${REF_MODEL}`, {
        method: 'POST',
        headers: {
          'Authorization': `Key ${FAL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        // Full body, not truncated: a 422 names the exact field that was rejected.
        const errorText = await response.text();
        console.error(`[GENERATE] FAL ${response.status} for ${REF_MODEL}:`, errorText);
        throw new Error(`Video generation failed (${response.status}): ${errorText.slice(0, 800)}`);
      }

      const data = await response.json();
      console.log('[GENERATE] Started, request_id:', data.request_id);

      return new Response(
        JSON.stringify({ 
          request_id: data.request_id, 
          status_url: data.status_url,
          response_url: data.response_url,
          status: 'PROCESSING' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================
    // ACTION: GENERATE_STUDIO - Fashion Video Studio (briefing v2.0)
    // Rich prompt construction from garments (priority-ordered per category),
    // model config, fashion context and editing style. Branding-clean output.
    // ============================================
    if (action === 'generate_studio') {
      const {
        reference_image_urls = [],   // model (optional) + garment reference images
        has_model_ref = false,
        model_prompt = '',
        garment_summary = {},        // { top, bottom, shoes, accessories } counts
        context_prompt = '',
        editing_prompt = '',
        editing_allows_cuts = false,
        audio_prompt = '',
        generate_audio = true,     // false when the user picks "No sound"
        aspect_ratio = '9:16',
        duration_seconds = 6,
        outfit_rotation = null,    // { label, count } when a slot has multiple garments
      } = body;

      if (!Array.isArray(reference_image_urls) || reference_image_urls.length === 0) {
        throw new Error('reference_image_urls is required');
      }

      const safeAspect = (aspect_ratio === '16:9' || aspect_ratio === '9:16') ? aspect_ratio : '9:16';
      const safeDuration = [6, 8, 10].includes(Number(duration_seconds)) ? Number(duration_seconds) : 6;
      const rotation = outfit_rotation && typeof outfit_rotation.count === 'number' && outfit_rotation.count > 1
        ? { label: String(outfit_rotation.label || 'looks'), count: Math.min(Number(outfit_rotation.count), 5) }
        : null;

      const videoPrompt = buildFashionPrompt({
        modelPrompt: model_prompt,
        hasModelRef: has_model_ref,
        garmentSummary: garment_summary,
        contextPrompt: context_prompt,
        editingPrompt: editing_prompt,
        allowCuts: editing_allows_cuts,
        duration: safeDuration,
        audioPrompt: audio_prompt,
        rotation,
      });

      // Send garments (+ optional model) straight to Omni reference-to-video — no
      // compose step. Model id comes from the shared constants above.
      //
      // duration is an INTEGER in this model's schema (3–10). It used to be sent as
      // a string on the assumption that fal video schemas use string enums, which
      // is true of some models but not this one.
      //
      // generate_audio is deliberately NOT sent: reference-to-video declares no
      // audio field at all, so the value was being discarded by fal anyway. It is
      // still accepted and logged, but note that this model gives us no way to
      // honour a "No sound" choice — that switch currently cannot affect output.
      const requestBody: Record<string, unknown> = {
        prompt: videoPrompt,
        image_urls: reference_image_urls,
        aspect_ratio: safeAspect,
        duration: safeDuration,
      };

      console.log('[GENERATE_STUDIO] request:', JSON.stringify({
        model: REF_MODEL, aspect_ratio: safeAspect, duration: safeDuration,
        image_urls_count: reference_image_urls.length, has_model_ref, generate_audio, rotation,
      }));

      const response = await fetch(`https://queue.fal.run/${REF_MODEL}`, {
        method: 'POST',
        headers: { 'Authorization': `Key ${FAL_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        // Surface the FULL fal error (not truncated) — the 422 body names the exact
        // field/limit that was rejected (e.g. too many reference images).
        console.error(`[GENERATE_STUDIO] FAL ${response.status} for ${REF_MODEL} with ${reference_image_urls.length} reference image(s):`, errorText);
        throw new Error(`Video generation failed (${response.status}): ${errorText.slice(0, 800)}`);
      }

      const data = await response.json();
      return new Response(
        JSON.stringify({
          request_id: data.request_id,
          status_url: data.status_url,
          response_url: data.response_url,
          status: 'PROCESSING',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('[FASHION-VIDEO] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
