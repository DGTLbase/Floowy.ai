import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image_base64 } = await req.json();
    
    if (!image_base64) {
      throw new Error('image_base64 is required');
    }

    console.log('Uploading to imgbb, image size:', image_base64.length, 'chars');

    const IMGBB_API_KEY = Deno.env.get('IMGBB_API_KEY');
    if (!IMGBB_API_KEY) {
      throw new Error('IMGBB_API_KEY not configured');
    }

    // Upload to imgbb
    const formData = new FormData();
    formData.append('image', image_base64);

    const uploadResponse = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: 'POST',
      body: formData,
    });

    const uploadData = await uploadResponse.json();

    if (!uploadResponse.ok || !uploadData.success) {
      throw new Error(`imgbb upload failed: ${JSON.stringify(uploadData)}`);
    }

    console.log('Upload successful:', uploadData.data.url);

    return new Response(
      JSON.stringify({ url: uploadData.data.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in upload-to-imgbb function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
