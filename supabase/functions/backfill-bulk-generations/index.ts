import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, admin-token',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify admin token
    const adminToken = req.headers.get('admin-token');
    if (!adminToken) {
      return new Response(
        JSON.stringify({ error: 'Admin token required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: session, error: sessionError } = await supabase
      .from('admin_sessions')
      .select('admin_id, expires_at')
      .eq('token', adminToken)
      .single();

    if (sessionError || !session || new Date(session.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired admin session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Admin authenticated, starting backfill...');

    // Get all completed batch items with their batch job info
    const { data: items, error: itemsError } = await supabase
      .from('batch_items')
      .select(`
        id,
        product_url,
        result_url,
        completed_at,
        batch_id,
        batch_jobs!inner (
          user_id,
          settings
        )
      `)
      .eq('status', 'completed')
      .not('result_url', 'is', null);

    if (itemsError) {
      throw new Error(`Failed to fetch batch items: ${itemsError.message}`);
    }

    if (!items || items.length === 0) {
      console.log('No completed batch items to backfill');
      return new Response(
        JSON.stringify({ success: true, backfilled: 0, message: 'No items to backfill' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${items.length} completed batch items to backfill`);

    let backfilledCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Process each item
    for (const item of items) {
      try {
        const batchJob = Array.isArray(item.batch_jobs) ? item.batch_jobs[0] : item.batch_jobs;
        
        if (!batchJob?.user_id) {
          console.warn(`Skipping item ${item.id}: no user_id found`);
          skippedCount++;
          continue;
        }

        // Check if this generation already exists (to avoid duplicates)
        const { data: existing } = await supabase
          .from('generations')
          .select('id')
          .eq('original_image_url', item.product_url)
          .eq('generated_image_url', item.result_url)
          .eq('user_id', batchJob.user_id)
          .maybeSingle();

        if (existing) {
          console.log(`Skipping item ${item.id}: already exists in generations table`);
          skippedCount++;
          continue;
        }

        const prompt = batchJob.settings ? 
          JSON.stringify(batchJob.settings).substring(0, 255) : 
          'Bulk mockup generation';

        // Insert into generations table
        const { error: insertError } = await supabase
          .from('generations')
          .insert({
            user_id: batchJob.user_id,
            prompt: prompt,
            original_image_url: item.product_url,
            generated_image_url: item.result_url,
            status: 'completed',
            created_at: item.completed_at || new Date().toISOString(),
          });

        if (insertError) {
          console.error(`Failed to insert item ${item.id}:`, insertError);
          errorCount++;
        } else {
          backfilledCount++;
          console.log(`Backfilled item ${item.id}`);
        }

      } catch (error: any) {
        console.error(`Error processing item ${item.id}:`, error.message);
        errorCount++;
      }
    }

    console.log(`Backfill complete: ${backfilledCount} inserted, ${skippedCount} skipped, ${errorCount} errors`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        backfilled: backfilledCount,
        skipped: skippedCount,
        errors: errorCount,
        total: items.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in backfill-bulk-generations:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
