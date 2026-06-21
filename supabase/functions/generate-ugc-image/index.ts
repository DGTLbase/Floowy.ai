import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { prompt, image_urls } = await req.json();

    const FAL_API_KEY = Deno.env.get('FAL_API_KEY');
    if (!FAL_API_KEY) {
      throw new Error('FAL_API_KEY is not configured');
    }

    console.log('Generating UGC image with prompt:', prompt);
    console.log('Image URLs:', image_urls);

    // Generate the UGC image with FAL nano-banana-pro (Google's Gemini image model).
    // Use the /edit model when reference images are provided, otherwise text-to-image.
    // The synchronous fal.run endpoint blocks until the image is ready, preserving
    // this function's original { image_url } response contract.
    const hasRefs = Array.isArray(image_urls) && image_urls.length > 0;
    const falUrl = hasRefs
      ? 'https://fal.run/fal-ai/nano-banana-pro/edit'
      : 'https://fal.run/fal-ai/nano-banana-pro';

    const falBody: any = {
      prompt,
      num_images: 1,
      output_format: 'png',
    };
    if (hasRefs) falBody.image_urls = image_urls;

    const response = await fetch(falUrl, {
      method: 'POST',
      headers: {
        Authorization: `Key ${FAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(falBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('FAL error:', response.status, errorText);
      throw new Error(`FAL error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('FAL response keys:', Object.keys(data || {}));

    // Extract the generated image URL from the FAL response
    const imageUrl = data.images?.[0]?.url || data.image?.url;
    if (!imageUrl) {
      console.error('No image URL found in FAL response:', JSON.stringify(data));
      throw new Error('No image URL found in response');
    }

    return new Response(JSON.stringify({ image_url: imageUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-ugc-image function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
