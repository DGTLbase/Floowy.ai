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

    console.log('Starting batch processing for:', batch_id);

    // Fetch batch job
    const { data: batch, error: batchError } = await supabase
      .from('batch_jobs')
      .select('*')
      .eq('id', batch_id)
      .single();

    if (batchError || !batch) {
      throw new Error('Batch not found');
    }

    // Fetch all pending items
    const { data: items, error: itemsError } = await supabase
      .from('batch_items')
      .select('*')
      .eq('batch_id', batch_id)
      .eq('status', 'pending')
      .order('order_index');

    if (itemsError || !items) {
      throw new Error('Failed to fetch batch items');
    }

    console.log(`Enqueuing ${items.length} items to FAL`);
 
    const settings = batch.settings as any;
    const modelUrl = settings.model_url;
    const modelViews = settings.model_views || {};
    const customBackgroundPrompt = settings.custom_background_prompt || '';
    const backgroundReferenceUrl = settings.background_reference_url || null;
    const selectedPose = settings.selected_pose || 'natural-standing';
    const backgroundText = customBackgroundPrompt || settings.background || 'light grey background';
    const outputSize = settings.output_size || { width: 1024, height: 1024 };
    const productUrls = settings.product_urls || [];
    const accessoryUrls = settings.accessory_urls || [];
    const viewMapping = settings.view_mapping || {};
    
    // Log background settings for debugging
    console.log('Background settings:', {
      customBackgroundPrompt,
      backgroundReferenceUrl,
      backgroundFromSettings: settings.background,
      finalBackgroundText: backgroundText
    });
    
    // Hairstyle settings (text only - no images)
    const selectedHairstyle = settings.selected_hairstyle || 'natural';
    const hairstyleDescription = settings.hairstyle_description || 'natural hair as shown in reference';
    const selectedLighting = settings.selected_lighting || 'studio';

    // Pose descriptions mapping
    const poseDescriptions: Record<string, string> = {
      'natural-standing': 'relaxed standing pose with weight evenly distributed, natural body language',
      'confident-standing': 'upright confident posture with shoulders back, commanding presence',
      'hands-on-hips': 'power pose with both hands resting confidently on hips',
      'arms-crossed': 'professional pose with arms crossed over chest',
      'hands-in-pockets': 'casual relaxed pose with both hands in pockets',
      'one-hand-pocket': 'relaxed pose with one hand casually in pocket',
      'walking': 'dynamic mid-stride walking pose with natural arm swing',
      'casual-lean': 'leaning slightly with relaxed casual body language',
      'seated': 'sitting comfortably on a chair or stool with good posture',
      'perched': 'sitting on edge of surface, poised and ready to stand',
      'runway-walk': 'fashion model runway stride with attitude and confidence',
      'contrapposto': 'classical contrapposto pose with weight shifted to one leg',
      'looking-away': 'gazing thoughtfully off to the side, contemplative expression',
      'over-shoulder': 'looking back over shoulder with engaging expression',
      'dynamic-action': 'energetic movement pose caught mid-motion',
      'editorial': 'high-fashion editorial style pose with dramatic positioning',
      'athletic': 'sporty active stance ready for movement',
      'elegant': 'graceful refined positioning with poise'
    };
    const poseText = poseDescriptions[selectedPose] || poseDescriptions['natural-standing'];
    
    // Lighting descriptions mapping
    // Lighting descriptions with MINIMAL shadows and NO reflections for clean product photography
    // Optimized for e-commerce with flat, even lighting that minimizes distracting shadows
    const lightingDescriptions: Record<string, string> = {
      'studio': 'Professional e-commerce studio lighting with MINIMAL shadows. Use multiple soft fill lights from all directions to eliminate harsh shadows. No floor reflections, no glossy surfaces. Even, flat lighting with very subtle depth. Shadow opacity should be under 10%.',
      'natural': 'Soft natural daylight with MINIMAL shadows. Overcast sky lighting that wraps around the subject evenly. No harsh directional shadows, no reflections on floor. Clean, shadowless appearance.',
      'dramatic': 'Slightly directional lighting but with strong fill to minimize shadow intensity. Subtle depth without dark shadows. No floor reflections. Shadow opacity under 20%.',
      'soft': 'Ultra-soft, diffused lighting from all directions. Nearly shadowless illumination. No reflections, no floor shadows. Completely even lighting across the entire subject.',
      'warm': 'Warm-toned but flat lighting with MINIMAL shadows. Golden tones without harsh shadows. No reflections, clean floor. Shadow opacity under 10%.',
      'cool': 'Cool-toned flat lighting with MINIMAL shadows. Clean, modern aesthetic with even illumination. No reflections, no floor shadows. Nearly shadowless.'
    };
    const lightingText = lightingDescriptions[selectedLighting] || lightingDescriptions['studio'];

    const determineAspectRatio = (width: number, height: number): string => {
      const ratio = width / height;
      const tolerance = 0.05;
      
      if (Math.abs(ratio - 21/9) < tolerance) return "21:9";
      if (Math.abs(ratio - 16/9) < tolerance) return "16:9";
      if (Math.abs(ratio - 3/2) < tolerance) return "3:2";
      if (Math.abs(ratio - 4/3) < tolerance) return "4:3";
      if (Math.abs(ratio - 5/4) < tolerance) return "5:4";
      if (Math.abs(ratio - 1) < tolerance) return "1:1";
      if (Math.abs(ratio - 4/5) < tolerance) return "4:5";
      if (Math.abs(ratio - 3/4) < tolerance) return "3:4";
      if (Math.abs(ratio - 2/3) < tolerance) return "2:3";
      if (Math.abs(ratio - 9/16) < tolerance) return "9:16";
      
      return "1:1";
    };

    const calculateResolution = (size: { width: number; height: number }): string => {
      const maxDimension = Math.max(size.width, size.height);
      if (maxDimension <= 1400) return "1K";
      if (maxDimension <= 2800) return "2K";
      return "4K";
    };

    const aspectRatio = determineAspectRatio(outputSize.width, outputSize.height);
    const resolution = calculateResolution(outputSize);

    // Enqueue all items to FAL
    for (const item of items) {
      try {
        console.log(`Enqueuing item ${item.order_index + 1}/${batch.total_count}`);

        const currentView = viewMapping[item.order_index];
        if (!currentView) {
          throw new Error(`No view mapping found for order_index ${item.order_index}`);
        }
        
        console.log(`Generating view: ${currentView} for order_index ${item.order_index}`);
        
        // Calculate which product this order_index belongs to
        let productIndex = 0;
        let accumulatedItems = 0;
        
        for (let i = 0; i < productUrls.length; i++) {
          const productOutfit = productUrls[i];
          
          const uniqueOutfitViews = new Set<string>();
          ['tops', 'trousers', 'jacket', 'hat', 'jumpsuit', 'dress', 'shoes'].forEach(piece => {
            const pieceObj = productOutfit[piece];
            if (pieceObj) {
              if (pieceObj.front) uniqueOutfitViews.add('front');
              if (pieceObj.back) uniqueOutfitViews.add('back');
              if (pieceObj.left) uniqueOutfitViews.add('left');
              if (pieceObj.right) uniqueOutfitViews.add('right');
            }
          });
          
          const availableViews = ['front', 'back', 'left', 'right'].filter(v => 
            uniqueOutfitViews.has(v)
          );
          const itemsForThisProduct = availableViews.length;
          
          if (item.order_index < accumulatedItems + itemsForThisProduct) {
            productIndex = i;
            break;
          }
          
          accumulatedItems += itemsForThisProduct;
        }
        
        const productOutfit = productUrls[productIndex];
        
        // Determine camera shot based on uploaded clothing pieces
        // If tops + trousers/shoes are uploaded -> full body shot
        // If tops only (no trousers/shoes) -> closeup/upper body shot
        const currentAccessories = accessoryUrls[productIndex] || [];
        const hasTops = productOutfit.tops || productOutfit.jacket;
        const hasTrousersOrShoes = productOutfit.trousers || productOutfit.shoes;
        const hasFullOutfit = productOutfit.jumpsuit || productOutfit.dress;
        
        // Full body if: has trousers/shoes, has full outfit (jumpsuit/dress), or has accessories
        const needsFullBody = hasTrousersOrShoes || hasFullOutfit || currentAccessories.length > 0;
        const bodyFraming = needsFullBody ? 'full-body shot showing from head to toe' : 'closeup upper body shot from waist up';
        
        // Simplified prompt matching Fashion tool style for better model fidelity
        const buildViewPrompt = (view: string): string => {
          const viewInstructions: Record<string, string> = {
            'front': `facing camera directly, ${bodyFraming}`,
            'back': `facing AWAY from camera, back visible, face NOT visible, ${bodyFraming}`,
            'left': `turned 90° left showing left profile, ${bodyFraming}`,
            'right': `turned 90° right showing right profile, ${bodyFraming}`
          };

          // Build simplified background instruction - custom prompt completely overrides all other background options
          let backgroundInstruction: string;
          if (customBackgroundPrompt && customBackgroundPrompt.trim()) {
            // User wrote a custom background prompt - use ONLY this, no other background instructions
            backgroundInstruction = `BACKGROUND: ${customBackgroundPrompt.trim()}. Use EXACTLY this background setting.`;
            console.log(`Using custom background prompt for ${view} view:`, customBackgroundPrompt.trim());
          } else if (backgroundReferenceUrl) {
            // User uploaded a background reference image
            backgroundInstruction = `CRITICAL: Use the LAST image in the reference set as the background reference - match that background environment, setting, colors, and lighting EXACTLY. This background must be IDENTICAL for ALL angle views.`;
          } else {
            // Use preset background
            backgroundInstruction = `${backgroundText}. Background must be IDENTICAL across all angle views.`;
          }

          // CRITICAL: 100% facial feature preservation instruction
          const facialPreservation = `ABSOLUTE FACIAL REPLICA REQUIREMENT: The person's face must be a 100% EXACT replica of the face in the FIRST reference image. This is the HIGHEST PRIORITY. Every facial feature must be IDENTICAL: exact same eye shape, eye color, eyebrow shape, nose shape and size, lip shape and fullness, face shape, jawline, cheekbone structure, forehead shape, skin texture, skin tone, and all facial proportions. The face must be INDISTINGUISHABLE from the reference - as if it's a photograph of the exact same person. Do NOT generate a "similar looking" face - it MUST be the EXACT same face with ZERO alterations or artistic interpretation.`;

          // Color preservation instruction
          const colorPreservation = `CRITICAL COLOR PRESERVATION: The clothing colors must remain EXACTLY as shown in the product images - do NOT alter, shift, or tint the fabric colors due to lighting. Maintain the TRUE original colors of all garments regardless of lighting conditions.`;

          // Lighting instruction - minimal shadows and no reflections
          const lightingConsistency = `CRITICAL LIGHTING: Use flat, even lighting with MINIMAL shadows (under 10% opacity). NO floor reflections, NO glossy surfaces, NO harsh shadows. The background should be clean and shadow-free. Lighting should be consistent across all angle views.`;

          return `${facialPreservation} Edit the person in the FIRST reference image by changing ONLY their clothing/outfit to match the garments shown in the product images. ${colorPreservation} ${lightingConsistency} Keep the person's body proportions, skin tone, hair, and all physical features EXACTLY as they appear in the first image. Keep the EXACT same hairstyle from the first image across all angle views. Position the person in ${poseText}, ${viewInstructions[view] || viewInstructions['front']}. Lighting: ${lightingText}. ${backgroundInstruction} The person's identity and face must remain completely unchanged - 100% facial replica is mandatory.`;
        };
        
        const viewPrompt = buildViewPrompt(currentView);
        
        // Get the model reference for this specific view angle
        // Prioritize the matching angle, then fall back to front, then any available
        const getModelUrlForView = (view: string): string | null => {
          if (modelViews[view]) return modelViews[view];
          if (modelViews.front) return modelViews.front;
          if (modelViews.back) return modelViews.back;
          if (modelViews.left) return modelViews.left;
          if (modelViews.right) return modelViews.right;
          return modelUrl;
        };
        
        const primaryModelUrl = getModelUrlForView(currentView);
        
        if (!primaryModelUrl) {
          throw new Error('No model reference image found');
        }
        
        const imageUrls = [];
        
        // Primary model reference for this specific view angle first
        imageUrls.push(primaryModelUrl);
        
        // Helper function to get best available view
        const getBestView = (piece: any, targetView: string) => {
          if (!piece) return null;
          if (piece[targetView]) return piece[targetView];
          return piece.front || piece.back || piece.left || piece.right || null;
        };
        
        // Add outfit pieces
        const topUrl = getBestView(productOutfit.tops, currentView);
        if (topUrl) imageUrls.push(topUrl);
        
        const jacketUrl = getBestView(productOutfit.jacket, currentView);
        if (jacketUrl) imageUrls.push(jacketUrl);
        
        const trousersUrl = getBestView(productOutfit.trousers, currentView);
        if (trousersUrl) imageUrls.push(trousersUrl);
        
        const jumpsuitUrl = getBestView(productOutfit.jumpsuit, currentView);
        if (jumpsuitUrl) imageUrls.push(jumpsuitUrl);
        
        const dressUrl = getBestView(productOutfit.dress, currentView);
        if (dressUrl) imageUrls.push(dressUrl);
        
        const hatUrl = getBestView(productOutfit.hat, currentView);
        if (hatUrl) imageUrls.push(hatUrl);
        
        const shoesUrl = getBestView(productOutfit.shoes, currentView);
        if (shoesUrl) imageUrls.push(shoesUrl);
        
        // Add accessories
        const productAccessories = accessoryUrls[productIndex] || [];
        for (const accessoryUrl of productAccessories) {
          imageUrls.push(accessoryUrl);
        }

        // Add background reference image if uploaded
        if (backgroundReferenceUrl) {
          imageUrls.push(backgroundReferenceUrl);
        }

        const filteredImageUrls = imageUrls.filter(url => url != null && url !== undefined && url !== '');

        console.log(`Item ${item.order_index + 1} (Product ${productIndex + 1}, ${currentView} view) image URLs:`, filteredImageUrls);
        console.log(`Prompt length: ${viewPrompt.length} characters`);

        // Start generation
        const genResponse = await fetch('https://queue.fal.run/fal-ai/nano-banana-pro/edit', {
          method: 'POST',
          headers: {
            'Authorization': `Key ${FAL_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: viewPrompt,
            image_urls: filteredImageUrls,
            num_images: 1,
            aspect_ratio: aspectRatio,
            output_format: "png",
            resolution,
          }),
        });

        if (!genResponse.ok) {
          throw new Error(`Generation failed: ${genResponse.status}`);
        }

        const queueData = await genResponse.json();
        const requestId = queueData.request_id;

        console.log(`Item ${item.order_index + 1} queued with request_id: ${requestId}`);

        // Update item with request_id and set status to processing
        await supabase
          .from('batch_items')
          .update({ 
            request_id: requestId,
            status: 'processing' 
          })
          .eq('id', item.id);

      } catch (error: any) {
        console.error(`Error enqueuing item ${item.order_index + 1}:`, error);
        
        // Mark item as failed
        await supabase
          .from('batch_items')
          .update({
            status: 'failed',
            error_message: error.message,
            completed_at: new Date().toISOString(),
          })
          .eq('id', item.id);

        // Update batch failed count
        const { data: currentBatch } = await supabase
          .from('batch_jobs')
          .select('failed_count')
          .eq('id', batch_id)
          .single();

        await supabase
          .from('batch_jobs')
          .update({
            failed_count: (currentBatch?.failed_count || 0) + 1,
          })
          .eq('id', batch_id);
      }
    }

    console.log('All items enqueued successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        batch_id,
        items_enqueued: items.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in process-batch-mockups:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});