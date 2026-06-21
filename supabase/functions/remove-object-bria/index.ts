import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, admin-token, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
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

    const { action, requestId, status_url, response_url, image_url, mask_url } = await req.json();

    // Check status of existing request
    if (action === 'status' && requestId) {
      console.log('[REMOVE-OBJECT] Checking status:', requestId);

      const checkUrl = status_url || `https://queue.fal.run/fal-ai/finegrain-eraser/requests/${requestId}/status`;
      const statusResponse = await fetch(checkUrl, {
        method: 'GET',
        headers: { 'Authorization': `Key ${FAL_API_KEY}` },
      });

      if (!statusResponse.ok) {
        const errorText = await statusResponse.text();
        console.error('[REMOVE-OBJECT] Status error:', statusResponse.status, errorText);
        throw new Error(`Status check failed: ${statusResponse.status}`);
      }

      const statusData = await statusResponse.json();
      console.log('[REMOVE-OBJECT] Status:', statusData.status);

      const resultUrl = statusData.response_url || response_url;

      if (statusData.status === 'COMPLETED' && resultUrl) {
        for (let attempt = 0; attempt < 3; attempt++) {
          const resultResponse = await fetch(resultUrl, {
            method: 'GET',
            headers: { 'Authorization': `Key ${FAL_API_KEY}` },
          });
          if (resultResponse.ok) {
            const resultData = await resultResponse.json();
            console.log('[REMOVE-OBJECT] Result keys:', Object.keys(resultData));
            return new Response(JSON.stringify({ status: 'COMPLETED', ...resultData }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          const errText = await resultResponse.text();
          console.error(`[REMOVE-OBJECT] Result fetch attempt ${attempt + 1} failed:`, resultResponse.status, errText);
          if (attempt < 2) await new Promise(r => setTimeout(r, 1500));
        }
        return new Response(JSON.stringify({ status: 'IN_PROGRESS' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify(statusData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Start new removal using Finegrain Eraser
    if (action === 'generate' && image_url && mask_url) {
      console.log('[REMOVE-OBJECT] Starting with Finegrain Eraser');

      const response = await fetch('https://queue.fal.run/fal-ai/finegrain-eraser/mask', {
        method: 'POST',
        headers: {
          'Authorization': `Key ${FAL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_url,
          mask_url,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[REMOVE-OBJECT] API error:', response.status, errorText);
        throw new Error(`API error: ${response.status} ${errorText}`);
      }

      const queueData = await response.json();
      console.log('[REMOVE-OBJECT] Queued:', queueData);

      return new Response(JSON.stringify(queueData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action or missing parameters' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[REMOVE-OBJECT] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
