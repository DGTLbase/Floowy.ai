const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, admin-token, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...params } = await req.json();
    const FAL_API_KEY = Deno.env.get('FAL_API_KEY');
    const SHOTSTACK_API_KEY = Deno.env.get('SHOTSTACK_API_KEY');

    if (!FAL_API_KEY) throw new Error('FAL_API_KEY not configured');

    switch (action) {
      case 'generate_video': {
        const { image_url, aspect_ratio } = params;
        const isPortrait = aspect_ratio === '9:16';
        const endpoint = isPortrait
          ? 'https://queue.fal.run/fal-ai/bytedance/seedance/v1.5/pro/image-to-video'
          : 'https://queue.fal.run/fal-ai/kling-video/v2.5-turbo/pro/image-to-video';
        console.log('Submitting image to', endpoint, 'image_url:', image_url, 'aspect_ratio:', aspect_ratio || '16:9');

        const bodyPayload = isPortrait
          ? {
              image_url,
              aspect_ratio: '9:16',
              duration: '5',
              resolution: '720p',
              generate_audio: false,
              camera_fixed: false,
              prompt: "Cinematic slow push-in camera movement at a natural real-world speed. Smooth, steady motion as if filmed on a gimbal. Realistic lighting and shadows consistent with the environment. If the original image contains no person, do NOT generate or add any people. Maintain scene authenticity.",
            }
          : {
              image_url,
              aspect_ratio: aspect_ratio || '16:9',
              prompt: "Cinematic slow push-in camera movement at a natural real-world speed (no fast motion, no acceleration spikes). Smooth, steady motion as if filmed on a gimbal. Realistic lighting and shadows consistent with the environment. All human movement must follow natural human biomechanics — normal walking speed, proper foot placement, natural arm swing, realistic weight shift. Strict collision physics: no walking through walls, furniture, doors, or objects. No body clipping, no object intersection, no overlapping actions. Characters must respect spatial boundaries and interact physically correctly with the environment. If the original image contains no person, do NOT generate or add any people. Maintain scene authenticity.",
            };

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Key ${FAL_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bodyPayload),
        });
        const data = await response.json();
        console.log('Video queue response:', JSON.stringify(data));
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'check_status': {
        const { request_id, endpoint, status_url, response_url } = params;
        let baseUrl: string;
        if (endpoint === 'music') {
          baseUrl = 'https://queue.fal.run/CassetteAI/music-generator';
        } else if (endpoint === 'video-portrait') {
          baseUrl = 'https://queue.fal.run/fal-ai/bytedance/seedance/v1.5/pro/image-to-video';
        } else {
          baseUrl = 'https://queue.fal.run/fal-ai/kling-video/v2.5-turbo/pro/image-to-video';
        }

        const actualStatusUrl = status_url || `${baseUrl}/requests/${request_id}/status`;
        const actualResponseUrl = response_url || `${baseUrl}/requests/${request_id}`;

        console.log('Checking status at:', actualStatusUrl);
        const statusResponse = await fetch(actualStatusUrl, {
          headers: { 'Authorization': `Key ${FAL_API_KEY}` },
        });
        const statusText = await statusResponse.text();
        console.log('Status response text:', statusText);
        let statusData;
        try {
          statusData = JSON.parse(statusText);
        } catch {
          console.error('Failed to parse status response:', statusText);
          return new Response(JSON.stringify({ status: 'IN_QUEUE', raw: statusText }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (statusData.status === 'COMPLETED') {
          console.log('Fetching result from:', actualResponseUrl);
          const resultResponse = await fetch(actualResponseUrl, {
            headers: { 'Authorization': `Key ${FAL_API_KEY}` },
          });
          const resultText = await resultResponse.text();
          console.log('Result response text:', resultText.substring(0, 200));
          let resultData;
          try {
            resultData = JSON.parse(resultText);
          } catch {
            console.error('Failed to parse result response:', resultText);
            throw new Error('Failed to parse result from FAL API');
          }
          return new Response(JSON.stringify({ status: 'COMPLETED', result: resultData }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify(statusData), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'generate_music': {
        const { duration, prompt } = params;
        console.log('Submitting music generation, duration:', duration, 's');
        const response = await fetch('https://queue.fal.run/CassetteAI/music-generator', {
          method: 'POST',
          headers: {
            'Authorization': `Key ${FAL_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: prompt || "Soft cinematic ambient background music for a luxury real estate virtual walkthrough. Warm piano melody, subtle atmospheric pads, light modern percussion, and gentle string textures. Minimal and elegant. Mid-tempo (90 BPM). Inspiring, calm, upscale, and inviting. No vocals.",
            duration: duration || 21,
          }),
        });
        const data = await response.json();
        console.log('Music queue response:', JSON.stringify(data));
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'proxy_asset': {
        const { url, filename } = params;
        console.log('Proxying asset to Supabase storage:', filename);
        
        const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error('Supabase config missing');

        const assetResponse = await fetch(url);
        if (!assetResponse.ok) throw new Error(`Failed to download asset: ${assetResponse.status}`);
        const assetBlob = await assetResponse.blob();
        
        const contentType = assetResponse.headers.get('content-type') || 
          (filename.endsWith('.wav') ? 'audio/wav' : 
           filename.endsWith('.mp3') ? 'audio/mpeg' : 'video/mp4');

        const storagePath = `property-studio/${filename}`;

        const uploadResponse = await fetch(
          `${SUPABASE_URL}/storage/v1/object/generated/${storagePath}`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              'Content-Type': contentType,
              'x-upsert': 'true',
            },
            body: assetBlob,
          }
        );
        if (!uploadResponse.ok) {
          const errText = await uploadResponse.text();
          throw new Error(`Storage upload failed: ${errText}`);
        }

        const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/generated/${storagePath}`;
        console.log('Asset proxied to:', publicUrl);
        return new Response(JSON.stringify({ url: publicUrl }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'merge': {
        if (!SHOTSTACK_API_KEY) throw new Error('SHOTSTACK_API_KEY not configured');
        const { timeline } = params;
        console.log('Submitting to Shotstack for rendering');
        const response = await fetch('https://api.shotstack.io/edit/v1/render', {
          method: 'POST',
          headers: {
            'x-api-key': SHOTSTACK_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(timeline),
        });
        const data = await response.json();
        console.log('Shotstack render response:', JSON.stringify(data));
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'check_merge': {
        if (!SHOTSTACK_API_KEY) throw new Error('SHOTSTACK_API_KEY not configured');
        const { render_id } = params;
        const response = await fetch(`https://api.shotstack.io/edit/v1/render/${render_id}`, {
          headers: { 'x-api-key': SHOTSTACK_API_KEY },
        });
        const data = await response.json();
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error: any) {
    console.error('Error in generate-virtual-tour:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
