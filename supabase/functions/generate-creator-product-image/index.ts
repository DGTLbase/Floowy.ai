import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, requestId, prompt, image_urls, aspect_ratio = "9:16", resolution = "2K" } = await req.json();

    const FAL_API_KEY = Deno.env.get('FAL_API_KEY');
    if (!FAL_API_KEY) {
      throw new Error('FAL_API_KEY is not configured');
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
        console.error('[STATUS CHECK] Error:', statusResponse.status, errorText);
        return new Response(
          JSON.stringify({ status: 'FAILED', error: `Status check failed: ${statusResponse.status}` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const statusData = await statusResponse.json();
      console.log('[STATUS CHECK] Status:', statusData.status);

      if (statusData.status === 'COMPLETED') {
        // Fetch the result from response_url
        if (statusData.response_url) {
          console.log('[STATUS CHECK] Fetching result from:', statusData.response_url);
          
          const resultResponse = await fetch(statusData.response_url, {
            headers: {
              'Authorization': `Key ${FAL_API_KEY}`,
            },
          });

          if (!resultResponse.ok) {
            const errorText = await resultResponse.text();
            console.error('[RESULT FETCH] Error:', resultResponse.status, errorText);
            return new Response(
              JSON.stringify({ status: 'FAILED', error: `Result fetch failed: ${resultResponse.status}` }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          const resultData = await resultResponse.json();
          console.log('[RESULT FETCH] Got result with images:', resultData.images?.length);

          const images = resultData.images?.map((img: any) => img.url) || [];

          return new Response(
            JSON.stringify({ status: 'COMPLETED', images }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Fallback to fetching from request endpoint
        const resultResponse = await fetch(
          `https://queue.fal.run/fal-ai/nano-banana-pro/requests/${requestId}`,
          {
            headers: {
              'Authorization': `Key ${FAL_API_KEY}`,
            },
          }
        );

        if (!resultResponse.ok) {
          const errorText = await resultResponse.text();
          console.error('[RESULT FETCH] Error:', resultResponse.status, errorText);
          return new Response(
            JSON.stringify({ status: 'FAILED', error: `Result fetch failed: ${resultResponse.status}` }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const resultData = await resultResponse.json();
        console.log('[RESULT FETCH] Got result with images:', resultData.images?.length);

        const images = resultData.images?.map((img: any) => img.url) || [];

        return new Response(
          JSON.stringify({ status: 'COMPLETED', images }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (statusData.status === 'FAILED') {
        return new Response(
          JSON.stringify({ status: 'FAILED', error: statusData.error || 'Generation failed' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Still processing
      return new Response(
        JSON.stringify({ status: 'PROCESSING' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Start new generation
    if (action === 'generate') {
      console.log('[GENERATION] Starting product image generation');
      console.log('[GENERATION] Prompt:', prompt);
      console.log('[GENERATION] Image URLs:', image_urls);
      console.log('[GENERATION] Aspect ratio:', aspect_ratio);
      console.log('[GENERATION] Resolution:', resolution);

      // Build request body matching Ambience Studio approach
      // The product image is passed as reference, prompt describes the scene/background
      const requestBody = {
        prompt,
        image_urls,
        num_images: 1,
        aspect_ratio,
        output_format: "png",
        resolution,
      };

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
        console.error('[GENERATION] FAL API error:', response.status, errorText);
        throw new Error(`FAL API error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('[GENERATION] Started, request_id:', data.request_id);

      return new Response(
        JSON.stringify({ request_id: data.request_id, status: 'PROCESSING' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action. Use "generate" or "status".');

  } catch (error) {
    console.error('[ERROR]', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});