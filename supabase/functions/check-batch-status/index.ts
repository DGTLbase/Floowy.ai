import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { batch_id } = await req.json();
    
    if (!batch_id) {
      throw new Error('batch_id is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const FAL_API_KEY = Deno.env.get('FAL_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Checking batch status for:', batch_id);

    // Fetch all processing items
    const { data: items, error: itemsError } = await supabase
      .from('batch_items')
      .select('*')
      .eq('batch_id', batch_id)
      .eq('status', 'processing')
      .not('request_id', 'is', null);

    if (itemsError) {
      throw new Error('Failed to fetch processing items');
    }

    if (!items || items.length === 0) {
      console.log('No processing items to check');
      return new Response(
        JSON.stringify({ success: true, checked: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Checking ${items.length} processing items`);

    let completedCount = 0;
    let failedCount = 0;

    // Check status of each processing item
    for (const item of items) {
      try {
        console.log(`Checking item ${item.order_index + 1} with request_id: ${item.request_id}`);
        
        const statusResponse = await fetch(
          `https://queue.fal.run/fal-ai/nano-banana-pro/requests/${item.request_id}/status`,
          {
            headers: {
              'Authorization': `Key ${FAL_API_KEY}`,
            },
          }
        );

        if (!statusResponse.ok) {
          const errorText = await statusResponse.text();
          console.error(`Status check HTTP error for item ${item.order_index + 1}:`, statusResponse.status, errorText);
          // Don't mark as failed yet – just continue polling next time
          continue;
        }

        const responseText = await statusResponse.text();
        console.log(`Status raw response for item ${item.order_index + 1}:`, responseText);

        let statusData: any;
        try {
          statusData = JSON.parse(responseText);
        } catch (parseError) {
          console.error(`Status JSON parse error for item ${item.order_index + 1}:`, parseError);
          console.error('Status response text:', responseText);
          continue;
        }

        console.log(`Parsed status for item ${item.order_index + 1}:`, JSON.stringify(statusData));

        if (statusData.status === 'COMPLETED') {
          console.log(`Item ${item.order_index + 1} COMPLETED`);

          if (statusData.response_url) {
            console.log(`Fetching result for item ${item.order_index + 1} from:`, statusData.response_url);

            const resultResponse = await fetch(statusData.response_url, {
              headers: {
                'Authorization': `Key ${FAL_API_KEY}`,
              },
            });

            if (!resultResponse.ok) {
              const errorText = await resultResponse.text();
              console.error(`Failed to fetch result for item ${item.order_index + 1}:`, resultResponse.status, errorText);
              continue;
            }

            const resultData = await resultResponse.json();
            console.log(`Result data for item ${item.order_index + 1}:`, JSON.stringify(resultData));

            const imageUrl = resultData.images?.[0]?.url;

            if (imageUrl) {
              console.log(`Updating item ${item.order_index + 1} with image URL: ${imageUrl}`);

              // Get batch job info for user_id
              const { data: batchJob } = await supabase
                .from('batch_jobs')
                .select('user_id, settings')
                .eq('id', batch_id)
                .single();

              const { error: updateError } = await supabase
                .from('batch_items')
                .update({
                  status: 'completed',
                  result_url: imageUrl,
                  completed_at: new Date().toISOString(),
                })
                .eq('id', item.id);

              if (updateError) {
                console.error(`Failed to update item ${item.order_index + 1}:`, updateError);
              } else {
                completedCount++;
                console.log(`Item ${item.order_index + 1} successfully updated in database`);

                // Insert into generations table so it shows on home page
                if (batchJob?.user_id) {
                  const prompt = batchJob.settings ? 
                    JSON.stringify(batchJob.settings).substring(0, 255) : 
                    'Bulk mockup generation';

                  await supabase
                    .from('generations')
                    .insert({
                      user_id: batchJob.user_id,
                      prompt: prompt,
                      original_image_url: item.product_url,
                      generated_image_url: imageUrl,
                      status: 'completed',
                    });
                  
                  console.log(`Item ${item.order_index + 1} added to generations table`);
                }
              }
            } else {
              console.error(`No image URL in result for item ${item.order_index + 1}`);
            }
          } else {
            console.warn(`Item ${item.order_index + 1} COMPLETED but no response_url present`);
          }
        } else if (statusData.status === 'FAILED') {
          console.error(`Item ${item.order_index + 1} FAILED:`, statusData.error);

          await supabase
            .from('batch_items')
            .update({
              status: 'failed',
              error_message: statusData.error || 'Generation failed',
              completed_at: new Date().toISOString(),
            })
            .eq('id', item.id);

          failedCount++;
        } else {
          console.log(`Item ${item.order_index + 1} still in progress, status: ${statusData.status}`);
        }

      } catch (error: any) {
        console.error(`Error checking item ${item.order_index + 1}:`, error.message, error.stack);
        
        // Mark item as failed
        await supabase
          .from('batch_items')
          .update({
            status: 'failed',
            error_message: error.message,
            completed_at: new Date().toISOString(),
          })
          .eq('id', item.id);

        failedCount++;
      }
    }

    // Update batch counts if any items changed
    if (completedCount > 0 || failedCount > 0) {
      const { data: currentBatch } = await supabase
        .from('batch_jobs')
        .select('completed_count, failed_count, total_count')
        .eq('id', batch_id)
        .single();

      if (currentBatch) {
        const newCompletedCount = currentBatch.completed_count + completedCount;
        const newFailedCount = currentBatch.failed_count + failedCount;

        await supabase
          .from('batch_jobs')
          .update({
            completed_count: newCompletedCount,
            failed_count: newFailedCount,
            status: (newCompletedCount + newFailedCount >= currentBatch.total_count) 
              ? 'completed' 
              : 'processing',
            completed_at: (newCompletedCount + newFailedCount >= currentBatch.total_count)
              ? new Date().toISOString()
              : null,
          })
          .eq('id', batch_id);
      }
    }

    console.log(`Status check complete: ${completedCount} completed, ${failedCount} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        checked: items.length,
        completed: completedCount,
        failed: failedCount
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in check-batch-status:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
