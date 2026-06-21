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
    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

    if (!FAL_API_KEY) {
      throw new Error('FAL_API_KEY is not configured');
    }

    const body = await req.json();
    const { action, requestId, productImageUrl, productName, productDescription, videoStyle } = body;

    console.log('[PRODUCT-VIDEO] Action:', action, 'RequestId:', requestId);

    // ============================================
    // ACTION: STATUS - Check generation status
    // ============================================
    if (action === 'status' && requestId) {
      const { type } = body; // 'image' or 'video'
      console.log('[STATUS] Checking status for:', type, 'Request ID:', requestId);

      if (type === 'image') {
        // Check nano-banana-pro status
        const statusResponse = await fetch(
          `https://queue.fal.run/fal-ai/nano-banana-pro/requests/${requestId}/status`,
          {
            headers: { 'Authorization': `Key ${FAL_API_KEY}` },
          }
        );

        const statusData = await statusResponse.json();
        console.log('[STATUS] Image status:', statusData.status);

        if (statusData.status === 'COMPLETED' && statusData.response_url) {
          const resultResponse = await fetch(statusData.response_url, {
            headers: { 'Authorization': `Key ${FAL_API_KEY}` },
          });
          const resultData = await resultResponse.json();
          
          return new Response(
            JSON.stringify({ 
              status: 'COMPLETED', 
              image_url: resultData.images?.[0]?.url || resultData.image?.url 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ status: statusData.status || 'PROCESSING' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (type === 'video') {
        // Check veo3.1 status
        const statusResponse = await fetch(
          `https://queue.fal.run/fal-ai/veo3.1/requests/${requestId}`,
          {
            method: 'GET',
            headers: { 'Authorization': `Key ${FAL_API_KEY}` },
          }
        );

        if (!statusResponse.ok) {
          const raw = await statusResponse.text();
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
        console.log('[STATUS] Video status:', JSON.stringify(statusData));

        // Try to extract video URL
        const videoUrl = statusData?.video?.url
          || statusData?.video_url
          || statusData?.output?.video?.url
          || statusData?.output?.videos?.[0]?.url
          || statusData?.videos?.[0]?.url;

        if (videoUrl) {
          return new Response(
            JSON.stringify({ status: 'COMPLETED', video_url: videoUrl }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check response_url if no direct video URL
        if (statusData?.response_url) {
          const res = await fetch(statusData.response_url, {
            headers: { 'Authorization': `Key ${FAL_API_KEY}` },
          });
          if (res.ok) {
            const data = await res.json();
            const url = data?.video?.url || data?.video_url || data?.videos?.[0]?.url;
            if (url) {
              return new Response(
                JSON.stringify({ status: 'COMPLETED', video_url: url }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }
          }
        }

        return new Response(
          JSON.stringify({ status: 'PROCESSING' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // ============================================
    // ACTION: ANALYZE - Use AI to generate creative prompt
    // ============================================
    if (action === 'analyze') {
      console.log('[ANALYZE] Generating creative prompt for product');

      if (!ANTHROPIC_API_KEY) {
        throw new Error('ANTHROPIC_API_KEY is not configured');
      }

      const systemPrompt = `You are a creative director specializing in viral social media "tips" and "hacks" style product videos. 
Your task is to create compelling visual prompts for generating eye-catching 3D animated "tips" videos that showcase product features.

The goal is to create videos similar to popular TikTok/Instagram "tip" content - where a product floats, rotates, or animates in a visually stunning way to highlight its features.

Based on the product information provided, generate:
1. An IMAGE PROMPT for creating a stunning 3D stylized product visualization with a "tips video" aesthetic
2. A VIDEO PROMPT for animating the product in an engaging "tips/hacks" social media style

Guidelines for IMAGE:
- Create a floating, 3D rendered product on a clean gradient or abstract background
- Add subtle glow, reflections, and premium lighting
- The product should look like it's ready to be animated
- Think: floating in space, dramatic angles, product hero shot

Guidelines for VIDEO:
- Smooth rotation or orbital movement around the product
- Dynamic zoom-in to highlight product details
- Add subtle particle effects or light rays for visual interest
- Movement should feel satisfying and "viral-worthy"
- Perfect for social media tips/tutorial content
- 5 seconds of smooth, engaging motion

Respond in JSON format:
{
  "imagePrompt": "detailed prompt for 3D product image in tips-video style...",
  "videoPrompt": "detailed prompt for animated tips-style video...",
  "suggestedStyle": "one of: futuristic, elegant, vibrant, minimal"
}`;

      const userMessage = `Product: ${productName || 'Product'}
Description: ${productDescription || 'A product for tips video'}
Preferred Style: ${videoStyle || 'auto-detect based on product'}

Create compelling prompts for a 3D animated "tips" style product video for social media.`;

      const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

      let aiMessage;
      try {
        aiMessage = await anthropic.messages.create({
          model: 'claude-haiku-4-5',
          max_tokens: 2048,
          system: systemPrompt,
          messages: [
            { role: 'user', content: userMessage },
          ],
        });
      } catch (err: any) {
        const status = err?.status;
        console.error('[ANALYZE] AI error:', status, err?.message);
        if (status === 429) {
          return new Response(
            JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        throw new Error(`AI analysis failed: ${status ?? 'unknown'}`);
      }

      const content = aiMessage.content.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('') || '';
      
      // Parse JSON from response
      let prompts;
      try {
        // Extract JSON from potential markdown code blocks
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                         content.match(/```\s*([\s\S]*?)\s*```/) ||
                         [null, content];
        prompts = JSON.parse(jsonMatch[1] || content);
      } catch {
        console.log('[ANALYZE] Could not parse JSON, using defaults');
        prompts = {
          imagePrompt: `A stunning 3D visualization of ${productName || 'the product'} with dramatic lighting, floating in an abstract gradient space with subtle particles and reflections. Premium product photography style, ultra-detailed, photorealistic rendering.`,
          videoPrompt: `Smooth orbital camera movement around ${productName || 'the product'}, with dynamic lighting transitions, subtle floating particles, and premium 3D aesthetic. Seamless loop, cinematic quality.`,
          suggestedStyle: 'elegant',
        };
      }

      console.log('[ANALYZE] Generated prompts:', prompts);

      return new Response(
        JSON.stringify({ status: 'success', ...prompts }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================
    // ACTION: GENERATE_IMAGE - Create 3D stylized product image
    // ============================================
    if (action === 'generate_image') {
      const { prompt } = body;
      console.log('[GENERATE_IMAGE] Starting with prompt:', prompt);

      const requestBody = {
        prompt: prompt,
        image_urls: [productImageUrl],
        num_images: 1,
        aspect_ratio: '1:1',
        output_format: 'png',
        resolution: '2K',
      };

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
        console.error('[GENERATE_IMAGE] FAL error:', errorText);
        throw new Error(`Image generation failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('[GENERATE_IMAGE] Started, request_id:', data.request_id);

      return new Response(
        JSON.stringify({ request_id: data.request_id, status: 'PROCESSING' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================
    // ACTION: GENERATE_VIDEO - Create animated video from image
    // ============================================
    if (action === 'generate_video') {
      const { imageUrl, prompt } = body;
      console.log('[GENERATE_VIDEO] Starting with image:', imageUrl);

      const videoPrompt = `${prompt}. 
CRITICAL RULES:
- NO text overlays or captions
- NO split screens or picture-in-picture
- Single continuous shot
- Smooth camera movements
- Product must remain clearly visible throughout
- High quality, professional motion graphics`;

      const response = await fetch('https://queue.fal.run/fal-ai/veo3.1/image-to-video', {
        method: 'POST',
        headers: {
          'Authorization': `Key ${FAL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_url: imageUrl,
          prompt: videoPrompt,
          resolution: '720p',
          aspect_ratio: '1:1',
          duration: 5,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[GENERATE_VIDEO] FAL error:', errorText);
        throw new Error(`Video generation failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('[GENERATE_VIDEO] Started, request_id:', data.request_id);

      return new Response(
        JSON.stringify({ request_id: data.request_id, status: 'PROCESSING' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('[PRODUCT-VIDEO] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
