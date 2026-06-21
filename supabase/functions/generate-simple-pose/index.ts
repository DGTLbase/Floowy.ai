const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Queue Seedream v4.5 Edit for clothing onto pose (Step 1)
async function queueStep1(poseUrl: string, clothingUrl: string, apiKey: string) {
  const prompt = "Replace the clothing from image 1 with image 2 and make sure it fits realistically. Make sure the person is always centered.";
  
  const response = await fetch('https://queue.fal.run/fal-ai/bytedance/seedream/v4.5/edit', {
    method: 'POST',
    headers: {
      'Authorization': `Key ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      image_urls: [poseUrl, clothingUrl],
      image_size: "auto_2K",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Seedream Step 1 queue error:', errorText);
    throw new Error(`Failed to queue Seedream Step 1: ${response.status}`);
  }

  const queueData = await response.json();
  return {
    request_id: queueData.request_id,
    status_url: queueData.status_url,
    response_url: queueData.response_url
  };
}

// Queue Nano Banana Pro for model swap (Step 2)
async function queueStep2(step1ResultUrl: string, modelUrl: string, apiKey: string) {
  const prompt = "Replace the person in image 1 with the exact person from image 2. Keep the exact same pose, clothing, camera angle and background from image 1. Only cnage the person and make sure to keep the backgroound and clothing style from image 1.";
  
  const response = await fetch('https://queue.fal.run/fal-ai/nano-banana-pro/edit', {
    method: 'POST',
    headers: {
      'Authorization': `Key ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      image_urls: [step1ResultUrl, modelUrl],
      num_images: 1,
      output_format: "png",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Nano Banana Step 2 queue error:', errorText);
    throw new Error(`Failed to queue Nano Banana Step 2: ${response.status}`);
  }

  const queueData = await response.json();
  return {
    request_id: queueData.request_id,
    status_url: queueData.status_url,
    response_url: queueData.response_url
  };
}


// Check status of a queued job
async function checkStatus(statusUrl: string, responseUrl: string, apiKey: string) {
  const statusResponse = await fetch(statusUrl, {
    headers: { 'Authorization': `Key ${apiKey}` },
  });

  if (!statusResponse.ok) {
    throw new Error(`Status check failed: ${statusResponse.status}`);
  }

  const statusData = await statusResponse.json();
  console.log('Status data:', JSON.stringify(statusData));
  
  if (statusData.status === 'COMPLETED') {
    const imageUrl = 
      statusData.response?.images?.[0]?.url ||
      statusData.response_body?.images?.[0]?.url ||
      statusData.output?.images?.[0]?.url ||
      statusData.result?.images?.[0]?.url ||
      statusData.images?.[0]?.url;
    
    if (imageUrl) {
      console.log('Found image in status data:', imageUrl);
      return { status: 'COMPLETED', image_url: imageUrl };
    }
    
    console.log('No image in status data, fetching from response URL');
    try {
      const resultResponse = await fetch(responseUrl, {
        headers: { 'Authorization': `Key ${apiKey}` },
      });

      if (!resultResponse.ok) {
        const errorText = await resultResponse.text();
        console.error('Result fetch error:', resultResponse.status, errorText);
        return {
          status: 'FAILED',
          error: `Generation completed but result fetch failed (${resultResponse.status}).`
        };
      }

      const resultData = await resultResponse.json();
      console.log('Result data:', JSON.stringify(resultData));
      const fetchedImageUrl = resultData.images?.[0]?.url;
      
      if (!fetchedImageUrl) {
        console.error('No image URL in result data:', resultData);
        return { status: 'FAILED', error: 'Generation completed but no image was returned' };
      }
      
      return { status: 'COMPLETED', image_url: fetchedImageUrl };
    } catch (fetchError) {
      console.error('Error fetching result:', fetchError);
      return {
        status: 'FAILED',
        error: `Failed to retrieve result: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`
      };
    }
  }

  if (statusData.status === 'FAILED') {
    return { status: 'FAILED', error: statusData.error || statusData.detail || 'Generation failed' };
  }

  return { status: 'IN_PROGRESS' };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action } = body;

    const FAL_API_KEY = Deno.env.get('FAL_API_KEY');
    if (!FAL_API_KEY) {
      throw new Error('FAL_API_KEY is not configured');
    }

    // ACTION: queue_step1 - Seedream clothing onto pose
    if (action === 'queue_step1') {
      const { pose_url, clothing_url } = body;
      if (!pose_url || !clothing_url) throw new Error('pose_url and clothing_url are required');
      
      console.log('Queueing Step 1 (Seedream - Clothing onto Pose):', { pose_url, clothing_url });
      const queueInfo = await queueStep1(pose_url, clothing_url, FAL_API_KEY);
      
      return new Response(
        JSON.stringify({ status: 'QUEUED', step: 1, ...queueInfo }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // ACTION: queue_step2 - Nano Banana model swap
    if (action === 'queue_step2') {
      const { step1_result_url, model_url } = body;
      if (!step1_result_url || !model_url) throw new Error('step1_result_url and model_url are required');
      
      console.log('Queueing Step 2 (Nano Banana - Model Swap):', { step1_result_url, model_url });
      const queueInfo = await queueStep2(step1_result_url, model_url, FAL_API_KEY);
      
      return new Response(
        JSON.stringify({ status: 'QUEUED', step: 2, ...queueInfo }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // ACTION: check_status
    if (action === 'check_status') {
      const { status_url, response_url } = body;
      if (!status_url || !response_url) throw new Error('status_url and response_url are required');
      
      const result = await checkStatus(status_url, response_url, FAL_API_KEY);
      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    throw new Error('Invalid action. Use queue_step1, queue_step2, or check_status');

  } catch (error: any) {
    console.error('Error in generate-simple-pose:', error);
    return new Response(
      JSON.stringify({ status: 'FAILED', error: error.message || 'Generation failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
