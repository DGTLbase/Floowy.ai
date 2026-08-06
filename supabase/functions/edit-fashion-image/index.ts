import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { cleanText, fabricPromptSegment, exclusionsPromptSegment, CONSTRUCTION_LOCK, PATTERN_LOCK } from "../_shared/fabric-donts.ts";

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

    const {
      action, requestId, prompt, image_urls,
      aspect_ratio = "1:1", resolution = "1K", num_images = 2,
      // Fabric reference + exclusions (all optional).
      fabric_description, has_fabric_image, donts,
    } = await req.json();

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
        console.error('[STATUS CHECK] HTTP Error:', statusResponse.status, errorText);
        throw new Error(`Status check failed: ${statusResponse.status} - ${errorText}`);
      }

      const responseText = await statusResponse.text();
      console.log('[STATUS CHECK] Raw response:', responseText);
      
      let statusData;
      try {
        statusData = JSON.parse(responseText);
      } catch (parseError) {
        console.error('[STATUS CHECK] JSON parse error:', parseError);
        console.error('[STATUS CHECK] Response text:', responseText);
        throw new Error(`Failed to parse status response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }
      
      console.log('[STATUS CHECK] Parsed data:', JSON.stringify(statusData));

      // If COMPLETED, fetch the actual result from response_url
      if (statusData.status === 'COMPLETED') {
        console.log('[STATUS CHECK] COMPLETED!');
        
        if (statusData.response_url) {
          console.log('[STATUS CHECK] Fetching result from:', statusData.response_url);
          
          // Retry fetching result up to 3 times with delay (fal.ai can return 500 briefly after completion)
          let resultData = null;
          let lastError = '';
          for (let attempt = 0; attempt < 3; attempt++) {
            if (attempt > 0) {
              console.log(`[STATUS CHECK] Retry attempt ${attempt + 1}...`);
              await new Promise(r => setTimeout(r, 2000));
            }
            
            const resultResponse = await fetch(statusData.response_url, {
              headers: {
                'Authorization': `Key ${FAL_API_KEY}`,
              },
            });
            
            if (resultResponse.ok) {
              resultData = await resultResponse.json();
              console.log('[STATUS CHECK] Result Data:', JSON.stringify(resultData));
              break;
            } else {
              lastError = `${resultResponse.status} ${resultResponse.statusText}`;
              const errBody = await resultResponse.text();
              console.error(`[STATUS CHECK] Fetch result attempt ${attempt + 1} failed:`, lastError, errBody);
            }
          }
          
          if (!resultData) {
            throw new Error(`Failed to fetch result after 3 attempts: ${lastError}`);
          }
          
          const mergedData = { ...statusData, ...resultData };
          
          return new Response(JSON.stringify(mergedData), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });
        }
      }

      return new Response(JSON.stringify(statusData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Start new generation
    if (action === 'generate' && prompt && image_urls) {
      console.log('Starting generation:', { prompt, image_urls, aspect_ratio, resolution });

      // The fabric close-up is appended last by the client, so point the model
      // at that slot. Both are no-ops when the user left the fields empty.
      const fabricText = fabricPromptSegment(
        cleanText(fabric_description),
        has_fabric_image ? "last" : null,
      );
      const constraints =
        CONSTRUCTION_LOCK + PATTERN_LOCK + exclusionsPromptSegment(cleanText(donts));

      const requestBody: any = {
        prompt: `${prompt}${fabricText}${constraints}`,
        image_urls,
        num_images,
        aspect_ratio,
        output_format: "png",
        resolution,
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
        console.error('FAL API error:', response.status, errorText);
        throw new Error(`FAL API error: ${response.status} ${errorText}`);
      }

      const responseText = await response.text();
      console.log('Generation response text:', responseText);
      
      let queueData;
      try {
        queueData = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Response text:', responseText);
        throw new Error(`Failed to parse generation response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }
      
      console.log('Generation queued:', queueData);

      return new Response(JSON.stringify(queueData), {
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
    console.error('Error in edit-fashion-image function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
