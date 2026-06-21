import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.69.0";

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

    const { action, requestId, image_url, mask_url, prompt, aspect_ratio = "1:1", resolution = "1K" } = await req.json();

    // ── Status check ──
    if (action === 'status' && requestId) {
      console.log('[REMIX STATUS] Request ID:', requestId);

      const statusResponse = await fetch(
        `https://queue.fal.run/fal-ai/nano-banana-pro/requests/${requestId}/status`,
        { headers: { 'Authorization': `Key ${FAL_API_KEY}` } }
      );

      const rawText = await statusResponse.text();
      const statusData = JSON.parse(rawText);
      console.log('[REMIX STATUS]', statusData.status);

      if (statusData.status === 'COMPLETED' && statusData.response_url) {
        const resultResponse = await fetch(statusData.response_url, {
          headers: { 'Authorization': `Key ${FAL_API_KEY}` },
        });
        if (!resultResponse.ok) throw new Error(`Failed to fetch result: ${resultResponse.statusText}`);
        const resultData = JSON.parse(await resultResponse.text());
        return new Response(JSON.stringify({ status: 'COMPLETED', ...resultData }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify(statusData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Analyze scene (uses Lovable AI) ──
    if (action === 'analyze') {
      const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
      if (!ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is not configured');

      console.log('[REMIX ANALYZE] Analyzing image:', image_url);

      const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

      let analyzeMessage;
      try {
        analyzeMessage = await anthropic.messages.create({
          model: 'claude-haiku-4-5',
          max_tokens: 1024,
          system: `You are an expert advertising analyst. Analyze the provided advertisement image and return a JSON object with:
- "lighting": description of lighting (e.g. "warm studio lighting with soft shadows from upper left")
- "environment": description of the scene/setting (e.g. "modern kitchen with marble countertops")
- "composition": layout/framing description (e.g. "product centered, model on left third, text overlay top right")
- "color_palette": array of dominant color descriptions
- "mood": overall mood/vibe (e.g. "aspirational, premium, youthful energy")
- "recognizable_elements": array of brand-specific elements to remove (logos, specific faces, trademarked items)
- "product_type": what product category is being advertised
- "model_description": if a person is present, describe their pose/styling without identifying them

Return ONLY valid JSON, no markdown.`,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: 'Analyze this advertisement image:' },
                { type: 'image', source: { type: 'url', url: image_url } }
              ]
            }
          ],
        });
      } catch (err: any) {
        console.error('[REMIX ANALYZE] Error:', err?.status, err?.message);
        throw new Error('Scene analysis failed');
      }

      let analysisText = analyzeMessage.content.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('') || '{}';
      // Strip markdown fences if present
      analysisText = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      let analysis;
      try {
        analysis = JSON.parse(analysisText);
      } catch {
        console.error('[REMIX ANALYZE] Failed to parse:', analysisText);
        analysis = { lighting: 'studio lighting', environment: 'clean background', composition: 'centered', mood: 'professional', color_palette: [], recognizable_elements: [], product_type: 'product', model_description: '' };
      }

      console.log('[REMIX ANALYZE] Result:', JSON.stringify(analysis));

      return new Response(JSON.stringify({ analysis }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Generate remix ──
    if (action === 'generate' && image_url) {
      const hasMask = !!mask_url;

      // Build the generation prompt
      const basePrompt = prompt || 'Recreate this scene with a completely unique environment, new models/people, and different props while maintaining the exact same vibe, lighting style, composition, and mood. Remove all recognizable brand elements, logos, and identifiable faces. Add subtle real-life imperfections like natural grain, slight depth-of-field blur, and realistic skin texture. The result should feel like an authentic photograph, not AI-generated.';

      const finalPrompt = hasMask
        ? `${basePrompt} Focus on replacing ONLY the masked/highlighted areas of the image while keeping the rest intact. For the masked areas, generate new content that seamlessly blends with the surrounding unmasked regions.`
        : basePrompt;

      console.log('[REMIX GENERATE] Prompt:', finalPrompt);
      console.log('[REMIX GENERATE] Has mask:', hasMask);

      const inputImageUrls = [image_url];
      if (hasMask) {
        inputImageUrls.push(mask_url);
      }

      const requestBody: Record<string, unknown> = {
        prompt: finalPrompt,
        image_urls: inputImageUrls,
        num_images: 2,
        aspect_ratio,
        output_format: "png",
        resolution,
      };

      const generateResponse = await fetch(
        'https://queue.fal.run/fal-ai/nano-banana-pro/edit',
        {
          method: 'POST',
          headers: {
            'Authorization': `Key ${FAL_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!generateResponse.ok) {
        const errorText = await generateResponse.text();
        console.error('[REMIX GENERATE] Failed:', errorText);
        throw new Error(`Generation failed: ${generateResponse.statusText}`);
      }

      const generateData = await generateResponse.json();
      console.log('[REMIX GENERATE] Started:', generateData);

      return new Response(JSON.stringify(generateData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action or missing parameters' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-remix-image:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
