import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();
    
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    // Get the client IP address from headers
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const clientIp = forwardedFor?.split(',')[0].trim() || realIp || 'unknown';
    
    console.log('Tracking IP for user:', userId, 'IP:', clientIp);

    // Create Supabase client with service role to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Upsert the IP tracking record (insert or update if user_id already exists)
    const { error: upsertError } = await supabaseAdmin
      .from('user_ip_tracking')
      .upsert(
        { 
          user_id: userId, 
          ip_address: clientIp 
        },
        { 
          onConflict: 'user_id',
          ignoreDuplicates: false 
        }
      );
    
    if (upsertError) {
      console.error('Error tracking IP:', upsertError);
      throw upsertError;
    }
    
    console.log('IP tracked/updated successfully for user:', userId);

    return new Response(
      JSON.stringify({ success: true }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in track-user-ip:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});