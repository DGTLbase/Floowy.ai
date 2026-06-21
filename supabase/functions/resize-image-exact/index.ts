import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

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
    const { image_url, width, height } = await req.json();
    
    if (!image_url || !width || !height) {
      throw new Error('Missing required parameters: image_url, width, height');
    }

    // Clamp dimensions to safe range
    const targetWidth = Math.max(512, Math.min(2048, Number(width)));
    const targetHeight = Math.max(512, Math.min(2048, Number(height)));

    console.log('Resizing image to exact dimensions:', { image_url, targetWidth, targetHeight });

    // Fetch the source image
    const imageResponse = await fetch(image_url);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch source image: ${imageResponse.status}`);
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    
    // Use ImageMagick via the 'imagescript' library for Deno
    const { Image } = await import("https://deno.land/x/imagescript@1.2.15/mod.ts");
    
    // Decode the image
    const image = await Image.decode(new Uint8Array(imageBuffer));
    
    // Resize to exact dimensions
    const resized = image.resize(targetWidth, targetHeight);
    
    // Encode back to PNG
    const outputBuffer = await resized.encode();
    
    // Upload to Supabase Storage
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Generate unique filename
    const filename = `resized-${Date.now()}-${targetWidth}x${targetHeight}.png`;
    const filePath = `resized/${filename}`;
    
    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('user-uploads')
      .upload(filePath, outputBuffer, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false,
      });
    
    if (uploadError) {
      throw new Error(`Failed to upload resized image: ${uploadError.message}`);
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase
      .storage
      .from('user-uploads')
      .getPublicUrl(filePath);

    console.log('Successfully resized and uploaded image:', { publicUrl, width: targetWidth, height: targetHeight });

    return new Response(JSON.stringify({ 
      image_url: publicUrl,
      width: targetWidth,
      height: targetHeight 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in resize-image-exact function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
