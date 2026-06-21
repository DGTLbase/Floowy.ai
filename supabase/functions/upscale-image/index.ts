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
    const { image_url } = await req.json();
    
    console.log('Upscaling image with Topaz');

    const FAL_KEY = Deno.env.get('FAL_API_KEY');
    if (!FAL_KEY) {
      throw new Error('FAL_API_KEY not configured');
    }

    // Call FAL Topaz upscaler
    const response = await fetch('https://queue.fal.run/fal-ai/topaz/upscale/image', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_url,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('FAL Topaz upscaler error:', error);
      throw new Error(`FAL Topaz upscaler failed: ${error}`);
    }

    const queueResult = await response.json();
    console.log('Upscaler queued:', queueResult);

    // Poll for results
    let attempts = 0;
    const maxAttempts = 60;
    let finalResult = null;

    while (attempts < maxAttempts) {
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 2000));

      const statusResponse = await fetch(queueResult.status_url, {
        headers: {
          'Authorization': `Key ${FAL_KEY}`,
        },
      });

      const statusData = await statusResponse.json();
      console.log(`Polling attempt ${attempts}, status: ${statusData.status}`);

      if (statusData.status === 'COMPLETED') {
        const resultResponse = await fetch(queueResult.response_url, {
          headers: {
            'Authorization': `Key ${FAL_KEY}`,
          },
        });
        finalResult = await resultResponse.json();
        break;
      } else if (statusData.status === 'FAILED') {
        throw new Error('Upscaling failed');
      }
    }

    if (!finalResult) {
      throw new Error('Upscaling timed out');
    }

    console.log('Final upscaled result:', finalResult);

    return new Response(
      JSON.stringify({ image_url: finalResult.image.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in upscale-image function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
