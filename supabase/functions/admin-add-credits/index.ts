import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0';
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, admin-token, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Input validation schema
const addCreditsSchema = z.object({
  userId: z.string().uuid({ message: 'Invalid user ID format' }),
  amount: z.number().int().positive().max(10000, { message: 'Amount cannot exceed 10,000' }),
  mode: z.enum(['add', 'deduct']).optional().default('add'),
});

Deno.serve(async (req) => {
  console.log('admin-add-credits called, method:', req.method);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const adminToken = req.headers.get('admin-token');
    console.log('Admin token present:', !!adminToken);
    
    if (!adminToken) {
      console.error('Missing admin token');
      return new Response(
        JSON.stringify({ error: 'Missing admin token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate admin token format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(adminToken)) {
      console.error('Invalid admin token format');
      return new Response(
        JSON.stringify({ error: 'Invalid admin token format' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    const supabaseAdmin = createClient(
      supabaseUrl ?? '',
      supabaseServiceKey ?? ''
    );

    // Verify admin token
    console.log('Verifying admin session...');
    const { data: session } = await supabaseAdmin
      .from('admin_sessions')
      .select('admin_id, expires_at')
      .eq('token', adminToken)
      .maybeSingle();

    if (!session || new Date(session.expires_at) < new Date()) {
      console.error('Invalid or expired admin session');
      return new Response(
        JSON.stringify({ error: 'Invalid or expired admin token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Admin session verified');

    // Parse and validate request body
    const body = await req.json();
    const parseResult = addCreditsSchema.safeParse(body);
    
    if (!parseResult.success) {
      console.error('Validation failed:', parseResult.error.errors);
      return new Response(
        JSON.stringify({ error: parseResult.error.errors[0]?.message || 'Invalid parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { userId, amount, mode } = parseResult.data;
    console.log('Request params:', { userId, amount, mode });

    // Get current balance
    const { data: currentCredit } = await supabaseAdmin
      .from('credits')
      .select('balance')
      .eq('user_id', userId)
      .maybeSingle();

    const currentBalance = currentCredit?.balance || 0;
    const newBalance = mode === 'deduct' ? currentBalance - amount : currentBalance + amount;

    if (mode === 'deduct' && newBalance < 0) {
      return new Response(
        JSON.stringify({ error: `Insufficient credits. Current balance: ${currentBalance}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for integer overflow (max safe integer)
    if (newBalance > Number.MAX_SAFE_INTEGER) {
      return new Response(
        JSON.stringify({ error: 'Credit balance would exceed maximum allowed value' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update credits
    const { error: updateError } = await supabaseAdmin
      .from('credits')
      .update({ balance: newBalance })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Update error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update credits' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log credit history
    const historyAmount = mode === 'deduct' ? -amount : amount;
    const description = mode === 'deduct' ? `Admin deducted ${amount} credits` : `Admin added ${amount} credits`;
    await supabaseAdmin.from('credit_history').insert({
      user_id: userId,
      amount: historyAmount,
      balance_after: newBalance,
      action_type: mode === 'deduct' ? 'admin_deduct' : 'admin_add',
      description,
    });

    console.log('Credits updated successfully');

    return new Response(
      JSON.stringify({ success: true, newBalance }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in admin-add-credits:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
