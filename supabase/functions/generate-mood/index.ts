import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Calculate dimensions based on aspect ratio and resolution
function calculateDimensions(aspectRatio: string, resolution: string): { width: number; height: number } {
  const resolutionMultiplier = resolution === "4K" ? 4 : resolution === "2K" ? 2 : 1;
  const baseSize = 1024;
  
  // Parse aspect ratio (e.g., "16:9", "3:4", "1:1")
  const [widthRatio, heightRatio] = aspectRatio.split(':').map(Number);
  
  if (widthRatio === heightRatio) {
    // Square aspect ratio
    return { width: baseSize * resolutionMultiplier, height: baseSize * resolutionMultiplier };
  } else if (widthRatio > heightRatio) {
    // Landscape
    const width = Math.round(baseSize * (widthRatio / heightRatio) * resolutionMultiplier);
    const height = baseSize * resolutionMultiplier;
    return { width, height };
  } else {
    // Portrait
    const width = baseSize * resolutionMultiplier;
    const height = Math.round(baseSize * (heightRatio / widthRatio) * resolutionMultiplier);
    return { width, height };
  }
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

    const { action, requestId, prompt, imageUrl, modelImageUrl, aspect_ratio = "1:1", resolution = "1K" } = await req.json();

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
              const errBody = await resultResponse.text();
              console.warn('[STATUS CHECK] Result not ready yet:', resultResponse.status, errBody);
              // Treat as still processing — result may not be fully available yet
              return new Response(JSON.stringify({ status: 'IN_PROGRESS' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
              });
            }
            
            const resultText = await resultResponse.text();
            const resultData = JSON.parse(resultText);
            console.log('[STATUS CHECK] Result Data:', JSON.stringify(resultData));
            
            // Calculate dimensions based on aspect_ratio and resolution if missing
            if (resultData.images && Array.isArray(resultData.images)) {
              resultData.images = resultData.images.map((img: any) => {
                if (img.width === null || img.height === null) {
                  const dimensions = calculateDimensions(aspect_ratio, resolution);
                  return { ...img, width: dimensions.width, height: dimensions.height };
                }
                return img;
              });
            }
            
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
    if (action === 'generate' && prompt && imageUrl) {
      console.log('[GENERATION] Starting SINGLE request to generate 2 images');
      console.log('[GENERATION] Prompt:', prompt);
      if (modelImageUrl) {
        console.log('[GENERATION] Using custom model image:', modelImageUrl);
      }
      
      // Build image_urls array - add model image first if provided, then product image
      const imageUrls = modelImageUrl ? [modelImageUrl, imageUrl] : [imageUrl];
      
      // Build request body - ONE request generating 2 images
      const requestBody: any = {
        prompt: prompt,
        image_urls: imageUrls,
        num_images: 2, // CRITICAL: Generate 2 images in ONE request (not 2 separate requests)
        aspect_ratio,
        output_format: "png",
        resolution,
      };
      
      console.log('[GENERATION] Request body num_images:', requestBody.num_images);
      
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
    console.error('Error in generate-mood function:', error);
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
