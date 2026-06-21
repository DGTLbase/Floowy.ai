import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { rendering_speed, num_images, image_url, image_size } = await req.json();
    
    const FAL_API_KEY = Deno.env.get('FAL_API_KEY');
    if (!FAL_API_KEY) {
      throw new Error('FAL_API_KEY is not configured');
    }

    console.log('Reframing image:', { image_url, image_size });

    const requestBody: any = {
      rendering_speed: rendering_speed || "BALANCED",
      num_images: 2, // Always generate exactly 2 images
      image_url,
    };

    // Add image_size if provided (FAL API expects it as an object)
    if (image_size) {
      const clamp = (n: number) => Math.max(512, Math.min(2048, Number(n)));
      const snap64 = (n: number) => Math.round(n / 64) * 64;
      let width = snap64(clamp(image_size.width));
      let height = snap64(clamp(image_size.height));
      // Ensure still within bounds after snapping
      width = Math.max(512, Math.min(2048, width));
      height = Math.max(512, Math.min(2048, height));
      requestBody.image_size = { width, height };
      
      // Also add aspect_ratio to give API more guidance
      const ratio = width / height;
      requestBody.aspect_ratio = ratio > 1 ? 'landscape' : ratio < 1 ? 'portrait' : 'square';
      
      console.log('Using custom dimensions (snapped to 64):', { width, height, aspect_ratio: requestBody.aspect_ratio });
    }

    const response = await fetch('https://queue.fal.run/fal-ai/ideogram/v3/reframe', {
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

    const queueData = await response.json();
    console.log('Queue response:', queueData);

    // Poll for completion
    const statusUrl = queueData.status_url;
    let result = queueData;
    let attempts = 0;
    const maxAttempts = 60; // 60 attempts = ~2 minutes max wait

    while (result.status === 'IN_QUEUE' || result.status === 'IN_PROGRESS') {
      if (attempts >= maxAttempts) {
        throw new Error('Image reframe timed out');
      }

      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      
      const statusResponse = await fetch(statusUrl, {
        headers: {
          'Authorization': `Key ${FAL_API_KEY}`,
        },
      });

      if (!statusResponse.ok) {
        throw new Error(`Status check failed: ${statusResponse.status}`);
      }

      result = await statusResponse.json();
      attempts++;
      console.log(`Polling attempt ${attempts}, status: ${result.status}`);
    }

    if (result.status === 'FAILED') {
      throw new Error(`Image reframe failed: ${result.error || 'Unknown error'}`);
    }

    // Fetch final response payload with images
    const responseUrl = queueData.response_url || result.response_url;
    if (!responseUrl) {
      throw new Error('Missing response_url in queue response');
    }

    const finalResp = await fetch(responseUrl, {
      headers: { 'Authorization': `Key ${FAL_API_KEY}` },
    });
    if (!finalResp.ok) {
      const t = await finalResp.text();
      throw new Error(`Failed to fetch final result: ${finalResp.status} ${t}`);
    }
    const finalData = await finalResp.json();
    console.log('Final reframe result:', finalData);

    return new Response(JSON.stringify(finalData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in reframe-image function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
