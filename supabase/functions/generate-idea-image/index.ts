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
    const FAL_API_KEY = Deno.env.get('FAL_API_KEY');
    if (!FAL_API_KEY) {
      throw new Error('FAL_API_KEY is not configured');
    }

    const { action, requestId, reference_url, product_url, model_url, background_prompt, aspect_ratio = "1:1", resolution = "1K" } = await req.json();

    // Check status of existing generation
    if (action === 'status' && requestId) {
      console.log('[STATUS CHECK] Request ID:', requestId);
      
      try {
        const statusResponse = await fetch(
          `https://queue.fal.run/fal-ai/nano-banana-pro/requests/${requestId}/status`,
          {
            headers: {
              'Authorization': `Key ${FAL_API_KEY}`,
            },
          }
        );

        const rawText = await statusResponse.text();
        console.log('[STATUS CHECK] Raw response:', rawText);
        
        const statusData = JSON.parse(rawText);
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
            
            const resultText = await resultResponse.text();
            const resultData = JSON.parse(resultText);
            console.log('[STATUS CHECK] Result Data:', JSON.stringify(resultData));
            
            // Return the result data WITH status included so frontend can recognize completion
            return new Response(JSON.stringify({ 
              status: 'COMPLETED',
              ...resultData 
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            });
          } else {
            console.error('[STATUS CHECK] No response_url in COMPLETED status');
          }
        }

        // For IN_PROGRESS, IN_QUEUE, etc., return the status as-is
        return new Response(JSON.stringify(statusData), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      } catch (parseError) {
        console.error('[STATUS CHECK] Parse error:', parseError);
        throw new Error(`Status check parsing failed: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }
    }

    // Start new generation
    if (action === 'generate' && reference_url && product_url) {
      // Construct prompt based on inputs
      let prompt = model_url 
        ? `Replace the product and model displayed in this image. Remove any existing product logos or branding from the scene, and use only the logo and branding from the uploaded product image.`
        : `Replace the product displayed in this image. Remove any existing product logos or branding from the scene, and use only the logo and branding from the uploaded product image.`;
      
      if (background_prompt) {
        prompt += ` Change the background settings into: ${background_prompt}.`;
      }

      console.log('Starting generation:', { prompt, reference_url, product_url, model_url });

      // Build image_urls array based on what's provided
      const inputImageUrls = [reference_url, product_url];
      if (model_url) {
        inputImageUrls.push(model_url);
      }

      // Build request body
      const requestBody: any = {
        prompt,
        image_urls: inputImageUrls,
        num_images: 2, // Generate 2 variations
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
        console.error('Generation failed:', errorText);
        throw new Error(`Generation failed: ${generateResponse.statusText}`);
      }

      const generateData = await generateResponse.json();
      console.log('Generation started:', generateData);

      return new Response(JSON.stringify(generateData), {
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
    console.error('Error in generate-idea-image function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
