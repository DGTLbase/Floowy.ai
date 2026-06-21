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
    const { email, phone, action } = await req.json();

    console.log('[check-signup-eligibility] Checking:', { email, phone: phone || 'not provided', action });
    
    // Get the client IP address from headers
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const clientIp = forwardedFor?.split(',')[0].trim() || realIp || 'unknown';
    
    console.log('Checking signup eligibility for IP:', clientIp);

    // Create Supabase client with service role to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if email or phone already exists in auth, profiles, and tracking tables
    const { data: existingUser, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (userError) {
      console.error('Error checking existing users:', userError);
      throw userError;
    }

    const emailExists = existingUser?.users?.some(u => u.email === email);
    const authPhoneExists = phone ? existingUser?.users?.some(u => u.phone === phone) : false;

    // Check if phone exists in profiles table (this is where phone is actually stored)
    let profilePhoneExists = false;
    if (phone) {
      const { data: profileRows, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('phone', phone);

      if (profileError) {
        console.error('Error checking phone in profiles table:', profileError);
        throw profileError;
      }

      profilePhoneExists = (profileRows?.length ?? 0) > 0;
      console.log(`Phone ${phone} exists in profiles:`, profilePhoneExists);
    }

    // Phone verification relies solely on profiles table (no redundant storage in tracking table)
    const phoneExists = authPhoneExists || profilePhoneExists;
    
    if (emailExists) {
      return new Response(
        JSON.stringify({ 
          allowed: false, 
          reason: 'email_exists',
          message: 'You can only create 1 free account. This email is already registered.' 
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (phoneExists) {
      return new Response(
        JSON.stringify({ 
          allowed: false, 
          reason: 'phone_exists',
          message: 'You can only create 1 free account. This phone number is already registered.' 
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Store IP for tracking (will be used after successful signup)
    if (action === 'track_ip' && email) {
      // This will be called after signup to associate IP with user
      const { data: userData } = await supabaseAdmin.auth.admin.listUsers();
      const user = userData?.users?.find(u => u.email === email);
      
      if (user) {
        const { error: insertError } = await supabaseAdmin
          .from('user_ip_tracking')
          .insert({ 
            user_id: user.id, 
            ip_address: clientIp
          });
        
        if (insertError) {
          console.error('Error tracking IP:', insertError);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        allowed: true, 
        ip: clientIp 
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in check-signup-eligibility:', error);
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