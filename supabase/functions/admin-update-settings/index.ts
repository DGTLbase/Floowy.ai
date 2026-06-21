import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import bcrypt from "https://esm.sh/bcryptjs@2.4.3";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, admin-token, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Input validation schema
const updateSettingsSchema = z.object({
  email: z.string().email({ message: 'Invalid email format' }).max(255).transform(val => val.trim().toLowerCase()),
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }).max(128).optional(),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify admin session
    const adminToken = req.headers.get('admin-token');
    if (!adminToken) {
      return new Response(
        JSON.stringify({ error: 'Admin token required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate admin token format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(adminToken)) {
      return new Response(
        JSON.stringify({ error: 'Invalid admin token format' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: session, error: sessionError } = await supabaseClient
      .from('admin_sessions')
      .select('admin_id')
      .eq('token', adminToken)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired admin session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate input
    const body = await req.json();
    const parseResult = updateSettingsSchema.safeParse(body);
    
    if (!parseResult.success) {
      console.error('Validation failed:', parseResult.error.errors);
      return new Response(
        JSON.stringify({ error: parseResult.error.errors[0]?.message || 'Invalid input' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { email, password } = parseResult.data;

    // Prepare update data
    const updateData: Record<string, string> = {
      email: email,
      updated_at: new Date().toISOString(),
    };

    // If password is provided, hash it
    if (password) {
      const bcryptHash = bcrypt.hashSync(password, 10);
      updateData.password_hash_bcrypt = bcryptHash;
    }

    // Update admin account
    const { error: updateError } = await supabaseClient
      .from('admin_accounts')
      .update(updateData)
      .eq('id', session.admin_id);

    if (updateError) {
      console.error('Error updating admin:', updateError);
      throw updateError;
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Error in admin-update-settings:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
