import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Branding-clean prompt for Omni reference-image-to-video: the reference images
// carry the garments (+ the model), so the prompt just directs how to combine and
// animate them. Priority = array order per category (higher priority = more focus).
function buildFashionPrompt(opts: {
  modelPrompt: string;
  hasModelRef: boolean;
  contextPrompt: string;
  editingPrompt: string;
  allowCuts: boolean;
  garmentSummary: Record<string, number>;
  duration: number;
  audioPrompt?: string;
}): string {
  const { modelPrompt, hasModelRef, contextPrompt, editingPrompt, allowCuts, garmentSummary, duration, audioPrompt } = opts;

  const worn: string[] = [];
  if ((garmentSummary.top ?? 0) > 0) worn.push('top');
  if ((garmentSummary.bottom ?? 0) > 0) worn.push('bottom');
  if ((garmentSummary.shoes ?? 0) > 0) worn.push('footwear');
  if ((garmentSummary.accessories ?? 0) > 0) worn.push('accessories');
  const outfitLine = worn.length
    ? `The reference images include the garments (${worn.join(', ')}). Combine them into one complete cohesive outfit and keep each garment's exact colour, pattern, texture and proportions.`
    : 'Combine the garments in the reference images into one complete cohesive outfit, keeping their exact colours and details.';

  const modelLine = hasModelRef
    ? 'Feature the model shown in the reference images, wearing the styled outfit.'
    : (modelPrompt ? `Feature ${modelPrompt} wearing the styled outfit.` : 'Feature a professional fashion model wearing the styled outfit.');

  return [
    `A high-quality styled fashion video, approximately ${duration} seconds.`,
    modelLine,
    outfitLine,
    contextPrompt ? `Scene and atmosphere: ${contextPrompt}` : '',
    editingPrompt ? `Camera and editing: ${editingPrompt}` : '',
    audioPrompt || '',
    allowCuts
      ? 'Use clean, deliberate sequential cuts over time — never split screens, collage or side-by-side panels shown at once.'
      : 'Single continuous shot — no cuts, no split screens, no collage.',
    'Keep every garment in its exact original form — no warping, morphing or distortion.',
    'No text, captions, subtitles, logos, brand names or watermarks anywhere. One full-frame composition. Natural, realistic human movement. Premium professional fashion production quality.',
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

    // ============================================
    // ACTION: STATUS - Check video generation status
    // ============================================
    if (action === 'status' && requestId) {
      const { statusUrl, responseUrl } = body;
      console.log('[STATUS] Checking status for request:', requestId);

      // Use the status_url from the queue response
      const checkUrl = statusUrl || `https://queue.fal.run/fal-ai/kling-video/v3/requests/${requestId}/status`;
      
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
        const resultUrl = responseUrl || statusData.response_url || `https://queue.fal.run/fal-ai/kling-video/v3/requests/${requestId}`;
        console.log('[STATUS] Fetching result from:', resultUrl);
        
        const resultResponse = await fetch(resultUrl, {
          headers: { 'Authorization': `Key ${FAL_API_KEY}` },
        });

        if (resultResponse.ok) {
          const resultData = await resultResponse.json();
          console.log('[STATUS] Result data keys:', Object.keys(resultData));
          
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
        }

        // If we couldn't get the video from response_url, report as still processing
        return new Response(
          JSON.stringify({ status: 'PROCESSING' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ status: statusData.status === 'IN_QUEUE' ? 'PROCESSING' : (statusData.status || 'PROCESSING') }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================
    // ACTION: GENERATE - Submit video generation
    // ============================================
    if (action === 'generate') {
      const { imageUrl, prompt } = body;
      console.log('[GENERATE] Starting video from image:', imageUrl);

      const videoPrompt = `${prompt || 'A model showcasing the outfit with smooth, natural movement. Subtle body rotation, confident walk or pose transition. Clean background, professional fashion video feel.'}
CRITICAL RULES:
- STRICTLY PRESERVE the exact facial features, face shape, skin tone, eye color, nose, lips, jawline, and all distinguishing characteristics of the person in the reference image — zero alterations allowed
- The person in every frame must be a 100% identical replica of the reference image face
- NO morphing, aging, de-aging, or any facial modification whatsoever
- NO text overlays or captions
- NO split screens or picture-in-picture
- Single continuous shot
- Smooth, natural human movement
- The outfit and model must remain clearly visible throughout
- High quality, cinematic fashion video`;

      const requestBody = {
        prompt: videoPrompt,
        start_image_url: imageUrl,
        duration: "6",
        generate_audio: false,
        shot_type: "customize",
        aspect_ratio: "9:16",
        negative_prompt: "blur, distort, low quality, text overlay, split screen, watermark, face change, face morph, different person, altered facial features, different face shape, different skin tone",
        cfg_scale: 0.5,
      };

      const response = await fetch('https://queue.fal.run/fal-ai/kling-video/v3/pro/image-to-video', {
        method: 'POST',
        headers: {
          'Authorization': `Key ${FAL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[GENERATE] FAL error:', errorText);
        throw new Error(`Video generation failed: ${response.status}`);
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
        reference_image_urls = [],
        has_model_ref = false,
        model_prompt = '',
        context_prompt = '',
        editing_prompt = '',
        editing_allows_cuts = false,
        audio_prompt = '',
        generate_audio = true,   // false when the user picks "No sound"
        garment_summary = {},   // { top:number, bottom:number, shoes:number, accessories:number }
        aspect_ratio = '9:16',
        duration_seconds = 6,
      } = body;

      if (!Array.isArray(reference_image_urls) || reference_image_urls.length === 0) {
        throw new Error('reference_image_urls is required');
      }

      const safeAspect = (aspect_ratio === '16:9' || aspect_ratio === '9:16') ? aspect_ratio : '9:16';
      const safeDuration = [6, 8, 10].includes(Number(duration_seconds)) ? Number(duration_seconds) : 6;

      const videoPrompt = buildFashionPrompt({
        modelPrompt: model_prompt,
        hasModelRef: has_model_ref,
        contextPrompt: context_prompt,
        editingPrompt: editing_prompt,
        allowCuts: editing_allows_cuts,
        garmentSummary: garment_summary,
        duration: safeDuration,
        audioPrompt: audio_prompt,
      });

      // Omni reference-image-to-video: send the garments + model + scene directly as
      // reference images (no separate compose step). Endpoint + params are
      // env-overridable so the exact fal path can be set without a code change.
      const VIDEO_MODEL = Deno.env.get('FAL_VIDEO_MODEL') || 'google/gemini-omni-flash';
      const REF_MODEL = Deno.env.get('FAL_VIDEO_REF_MODEL') || `${VIDEO_MODEL}/reference-to-video`;

      // Both Seedance and Omni support generate_audio (false = fully silent).
      const requestBody: Record<string, unknown> = {
        prompt: videoPrompt,
        image_urls: reference_image_urls,
        aspect_ratio: safeAspect,
        duration: safeDuration,
        generate_audio,
      };

      console.log('[GENERATE_STUDIO] config:', { model: REF_MODEL, safeAspect, safeDuration, refs: reference_image_urls.length, has_model_ref });

      const response = await fetch(`https://queue.fal.run/${REF_MODEL}`, {
        method: 'POST',
        headers: { 'Authorization': `Key ${FAL_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[GENERATE_STUDIO] FAL error:', errorText);
        throw new Error(`Video generation failed: ${response.status} ${errorText.slice(0, 400)}`);
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
