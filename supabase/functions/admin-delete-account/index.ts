import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, admin-token, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const adminToken = req.headers.get('admin-token');
    
    if (!adminToken) {
      return new Response(
        JSON.stringify({ error: 'Admin token required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify admin token
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('admin_sessions')
      .select('admin_id')
      .eq('token', adminToken)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired admin token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { adminId } = await req.json();
    
    if (!adminId) {
      return new Response(
        JSON.stringify({ error: 'Admin ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Deleting admin account:', adminId);

    // Prevent self-deletion
    if (adminId === session.admin_id) {
      return new Response(
        JSON.stringify({ error: 'Cannot delete your own admin account' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Delete all sessions for this admin
    const { error: sessionsError } = await supabaseAdmin
      .from('admin_sessions')
      .delete()
      .eq('admin_id', adminId);

    if (sessionsError) {
      console.error('Error deleting admin sessions:', sessionsError);
      throw sessionsError;
    }

    // Delete the admin account
    const { error: deleteError } = await supabaseAdmin
      .from('admin_accounts')
      .delete()
      .eq('id', adminId);
    
    if (deleteError) {
      console.error('Error deleting admin account:', deleteError);
      throw deleteError;
    }

    console.log('Successfully deleted admin account:', adminId);

    return new Response(
      JSON.stringify({ success: true }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in admin-delete-account:', error);
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
