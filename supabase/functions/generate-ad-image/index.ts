import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface TextConfig {
  type: string;
  text: string;
  position: string;
  fontSize: number;
  color: string;
  fontFamily: string;
  fontWeight: string;
  fontStyle: string;
  textDecoration?: string;
  backgroundColor?: string;
  icon?: string;
}

interface LogoConfig {
  url: string;
  position: string;
  size: number;
}

const getPositionDescription = (position: string): string => {
  const positions: Record<string, string> = {
    'top-left': 'at the top left corner of the image',
    'top-center': 'at the top center of the image',
    'top-right': 'at the top right corner of the image',
    'center-left': 'on the left side of the image, vertically centered',
    'center': 'in the center of the image',
    'center-right': 'on the right side of the image, vertically centered',
    'bottom-left': 'at the bottom left corner of the image',
    'bottom-center': 'at the bottom center of the image',
    'bottom-right': 'at the bottom right corner of the image',
  };
  return positions[position] || 'in an appropriate position';
};

// Convert hex color codes to readable color names to prevent AI from rendering them as text
const getColorName = (hex: string): string => {
  const colorMap: Record<string, string> = {
    '#ffffff': 'white',
    '#fff': 'white',
    '#000000': 'black',
    '#000': 'black',
    '#ff0000': 'red',
    '#00ff00': 'green',
    '#0000ff': 'blue',
    '#ffff00': 'yellow',
    '#f0ab5d': 'golden/amber',
    '#f97316': 'orange',
    '#10b981': 'emerald green',
    '#3b82f6': 'blue',
    '#8b5cf6': 'purple',
    '#ec4899': 'pink',
    '#ef4444': 'red',
    '#22c55e': 'green',
    '#1a1a2e': 'dark navy',
  };
  
  const lowerHex = hex?.toLowerCase() || '';
  if (colorMap[lowerHex]) return colorMap[lowerHex];
  
  // Try to determine color from hex if not in map
  if (lowerHex.startsWith('#')) {
    const r = parseInt(lowerHex.slice(1, 3), 16) || 0;
    const g = parseInt(lowerHex.slice(3, 5), 16) || 0;
    const b = parseInt(lowerHex.slice(5, 7), 16) || 0;
    
    // Determine dominant color
    if (r > 200 && g > 200 && b > 200) return 'light/white';
    if (r < 50 && g < 50 && b < 50) return 'dark/black';
    if (r > g && r > b) return r > 200 ? 'light red/pink' : 'red';
    if (g > r && g > b) return g > 200 ? 'light green' : 'green';
    if (b > r && b > g) return b > 200 ? 'light blue' : 'blue';
    if (r > 150 && g > 100 && b < 100) return 'orange/amber';
  }
  
  return 'colored';
};

// Convert aspect ratio string to fal.ai format
const getFalAspectRatio = (aspectRatio: string): string => {
  // fal.ai supports: "21:9", "16:9", "4:3", "1:1", "3:4", "9:16", "9:21"
  const [w, h] = aspectRatio.split(':').map(Number);
  const ratio = w / h;
  
  if (ratio >= 2.3) return "21:9";
  if (ratio >= 1.7) return "16:9";
  if (ratio >= 1.3) return "4:3";
  if (ratio >= 0.95 && ratio <= 1.05) return "1:1";
  if (ratio >= 0.7) return "3:4";
  if (ratio >= 0.5) return "9:16";
  return "9:21";
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FAL_API_KEY = Deno.env.get('FAL_API_KEY');
    if (!FAL_API_KEY) {
      throw new Error('FAL_API_KEY is not configured');
    }

    const requestData = await req.json();
    const { action, requestId } = requestData;

    // Check status of existing generation
    if (action === 'status' && requestId) {
      console.log('[STATUS CHECK] Request ID:', requestId);
      
      try {
        const statusResponse = await fetch(
          `https://queue.fal.run/fal-ai/nano-banana-pro/requests/${requestId}/status`,
          {
            headers: {
              'Authorization': `Key ${FAL_API_KEY}`,
            },
          }
        );

        const rawText = await statusResponse.text();
        console.log('[STATUS CHECK] Raw response:', rawText);
        
        const statusData = JSON.parse(rawText);
        console.log('[STATUS CHECK] Parsed data:', JSON.stringify(statusData));

        // If COMPLETED, fetch the actual result from response_url
        if (statusData.status === 'COMPLETED') {
          console.log('[STATUS CHECK] COMPLETED!');
          
          if (statusData.response_url) {
            console.log('[STATUS CHECK] Fetching result from:', statusData.response_url);
            
            const resultResponse = await fetch(statusData.response_url, {
              headers: {
                'Authorization': `Key ${FAL_API_KEY}`,
              },
            });
            
            if (!resultResponse.ok) {
              console.error('[STATUS CHECK] Failed to fetch result:', resultResponse.status);
              throw new Error(`Failed to fetch result: ${resultResponse.statusText}`);
            }
            
            const resultText = await resultResponse.text();
            const resultData = JSON.parse(resultText);
            console.log('[STATUS CHECK] Result Data:', JSON.stringify(resultData));
            
            // Return the result data WITH status included so frontend can recognize completion
            return new Response(JSON.stringify({ 
              status: 'COMPLETED',
              ...resultData 
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            });
          } else {
            console.error('[STATUS CHECK] No response_url in COMPLETED status');
          }
        }

        // For IN_PROGRESS, IN_QUEUE, etc., return the status as-is
        return new Response(JSON.stringify(statusData), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      } catch (parseError) {
        console.error('[STATUS CHECK] Parse error:', parseError);
        throw new Error(`Status check parsing failed: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }
    }

    // Start new generation
    if (action === 'generate') {
      const { 
        product_image_url, 
        model_mode,
        hand_interaction,
        custom_model_url,
        output_size,
        aspect_ratio,
        background_color,
        background_prompt,
        use_custom_background,
        text_config,
        logo_config 
      } = requestData;

      const textConfigs: TextConfig[] = text_config || [];
      const logoConf: LogoConfig | null = logo_config;

      // Build detailed text placement instructions - NO LABELS in output
      const textInstructions: string[] = [];
      
      // Track feature texts separately for better grouping
      const featureTexts: string[] = [];
      
      for (const config of textConfigs) {
        if (!config.text?.trim()) continue;
        
        const posDesc = getPositionDescription(config.position);
        const styleDesc: string[] = [];
        
        if (config.fontWeight === 'bold') styleDesc.push('bold');
        if (config.fontStyle === 'italic') styleDesc.push('italic');
        if (config.fontWeight === 'bold' && config.fontStyle === 'italic') {
          styleDesc.length = 0;
          styleDesc.push('bold italic');
        }
        if (config.textDecoration === 'underline') styleDesc.push('underlined');
        
        let instruction = '';
        
        // Get font family for styling
        const fontFamily = config.fontFamily || 'sans-serif';
        const fontDesc = fontFamily !== 'sans-serif' ? ` in ${fontFamily} font` : '';
        
        // Build cleaner instructions without exposing technical color codes as visible text
        if (config.type === 'cta') {
          const colorName = getColorName(config.color);
          const bgColorName = getColorName(config.backgroundColor || '#10b981');
          instruction = `- CTA Button: Display the text "${config.text}" ${posDesc}${fontDesc}. Style it as a clickable button with ${bgColorName} background and ${colorName} text${styleDesc.length ? `, ${styleDesc.join(' ')}` : ''}.`;
        } else if (config.type === 'feature') {
          // Collect features for grouped display
          featureTexts.push(config.text);
        } else {
          const colorName = getColorName(config.color);
          instruction = `- Text: "${config.text}" ${posDesc}${fontDesc}, ${colorName} color${styleDesc.length ? `, ${styleDesc.join(' ')} style` : ''}.`;
        }
        
        if (instruction) textInstructions.push(instruction);
      }
      
      // Add features as a simple list
      if (featureTexts.length > 0) {
        const featureConfig = textConfigs.find(c => c.type === 'feature');
        const featurePosDesc = featureConfig ? getPositionDescription(featureConfig.position) : 'on the left side';
        const featureColorName = featureConfig ? getColorName(featureConfig.color) : 'white';
        const featureFontFamily = featureConfig?.fontFamily || 'sans-serif';
        const featureFontDesc = featureFontFamily !== 'sans-serif' ? ` in ${featureFontFamily} font` : '';
        
        const featuresWithIcons = featureTexts.map(f => `    ✓ "${f}"`);
        
        textInstructions.push(`- Features: Display these items ONCE ${featurePosDesc}${featureFontDesc} with ${featureColorName} text:\n${featuresWithIcons.join('\n')}`);
      }

      // Logo instruction
      let logoInstruction = '';
      if (logoConf?.url) {
        const logoPosDesc = getPositionDescription(logoConf.position);
        const logoSizeDesc = logoConf.size > 100 ? 'large' : logoConf.size > 60 ? 'medium' : 'small';
        logoInstruction = `LOGO: Place the logo image ${logoPosDesc} at a ${logoSizeDesc} size. Keep it subtle but visible.`;
      }

      // Parse output size
      const [width, height] = (output_size || '1080x1080').split('x').map(Number);

      // Get background color name to avoid exposing hex codes
      const bgColorName = getColorName(background_color || '#1a1a2e');
      
      let backgroundInstruction = '';
      if (use_custom_background) {
        if (background_prompt?.trim()) {
          backgroundInstruction = `Create a background based on this description: "${background_prompt}". Use ${bgColorName} tones if needed.`;
        } else {
          backgroundInstruction = `Use a solid ${bgColorName} background color. Do not add gradients or textures, use a clean solid color background.`;
        }
      } else {
        backgroundInstruction = `Create an attractive, professional background that complements the product. You may use gradients, subtle textures, or creative backgrounds that enhance the advertisement.`;
      }

      // Build model/display mode instruction - SIMPLIFIED as per user request
      const backgroundDesc = background_prompt?.trim() || 'modern japandi style living room';
      
      // Check if custom model is provided
      const hasCustomModel = custom_model_url && (model_mode === 'female' || model_mode === 'male' || !model_mode || model_mode === 'none');
      
      let modelInstruction = '';
      
      if (hasCustomModel) {
        // Custom model uploaded - explicitly reference the second image as the model
        const genderHint = model_mode === 'male' ? 'male' : model_mode === 'female' ? 'female' : '';
        modelInstruction = `You are provided with TWO images:
1. FIRST IMAGE: The product image - this is the product to showcase
2. SECOND IMAGE: The model reference - this is the ${genderHint} person who MUST appear in the final image

Create a realistic mockup where the person from the SECOND IMAGE (the model reference) is using/holding/wearing the product from the FIRST IMAGE. Background setting: ${backgroundDesc}.

CRITICAL - MODEL REFERENCE REQUIREMENTS:
- The person in the output MUST be the EXACT same person shown in the SECOND IMAGE (model reference)
- Recreate the person with ZERO alterations to their appearance
- Maintain 100% identical facial features: same eyes, nose, lips, jawline, face shape, hair
- Preserve exact skin tone, texture, and complexion
- Keep the same body proportions and build
- The output must look like a real photo of THIS SPECIFIC PERSON using the product
- Ensure the product size is realistic and proportional to the model`;
      } else if (model_mode === 'hand') {
        modelInstruction = `Close-up shot of realistic hands holding/using this product, captured as a realistic documentary-style photograph. HAND DETAILS: natural skin texture with minimal visible detail, correct anatomy (5 fingers per hand). Background setting: ${backgroundDesc}. Natural LIGHT DIRECTION: ambient daylight with soft, flattering quality. Neutral color science, clean natural look. Shot on LENS: smartphone, realistic depth of field, organic sharpness. The image should feel real and natural. Ensure the product size is realistic and proportional to the hand.`;
      } else if (model_mode === 'female') {
        modelInstruction = `Medium shot portrait of a 25-35-year-old female model, naturally using this product, captured as a realistic documentary-style photograph. KEY DETAILS: natural skin texture, authentic emotion, genuine engagement with product. SKIN DETAILS: smooth and natural-looking skin with only minimal, subtle texture — no exaggerated pores or blemishes, but avoid artificial airbrushed perfection. HAIR DETAILS: natural texture, baby hairs, stray hairs. EXPRESSION/POSE: relaxed, unposed. Background setting: ${backgroundDesc}. Natural LIGHT DIRECTION: ambient daylight / window light with soft, flattering quality. Neutral color science, realistic contrast, no heavy retouching but maintain a clean, polished-natural look. Shot on LENS: 50-85mm, realistic depth of field. CAMERA FEEL: high-quality smartphone photography, organic sharpness, natural color rendering. The image should feel authentic and human — like a well-lit smartphone photo, not AI-generated, not over-processed. Ensure the product size is realistic and proportional to the model.`;
      } else if (model_mode === 'male') {
        modelInstruction = `Medium shot portrait of a 25-35-year-old male model, naturally using this product, captured as a realistic documentary-style photograph. KEY DETAILS: natural skin texture, authentic emotion, genuine engagement with product. SKIN DETAILS: smooth and natural-looking skin with only minimal, subtle texture — no exaggerated pores or blemishes, but avoid artificial airbrushed perfection. HAIR DETAILS: natural texture, facial hair details, baby hairs. EXPRESSION/POSE: relaxed, unposed. Background setting: ${backgroundDesc}. Natural LIGHT DIRECTION: ambient daylight / window light with soft, flattering quality. Neutral color science, realistic contrast, no heavy retouching but maintain a clean, polished-natural look. Shot on LENS: 50-85mm, realistic depth of field. CAMERA FEEL: high-quality smartphone photography, organic sharpness, natural color rendering. The image should feel authentic and human — like a well-lit smartphone photo, not AI-generated, not over-processed. Ensure the product size is realistic and proportional to the model.`;
      } else {
        modelInstruction = `Create a realistic mockup of this product in a realistic setting. Background setting: ${backgroundDesc}. Ensure the product size is realistic and proportional to its surroundings - the product should appear at its actual real-world scale relative to the environment.`;
      }

      // Use provided aspect ratio or calculate from output size
      const finalAspectRatio = aspect_ratio || `${width}:${height}`;
      const falAspectRatio = getFalAspectRatio(finalAspectRatio);
      const isSquare = width === height;
      const isWide = width > height;
      
      const aspectDescription = isSquare 
        ? 'square (1:1)' 
        : isWide 
          ? `wide/landscape (${finalAspectRatio})` 
          : `tall/portrait (${finalAspectRatio})`;

      console.log('Aspect ratio from payload:', aspect_ratio, 'Final aspect ratio:', finalAspectRatio, 'FAL aspect ratio:', falAspectRatio, 'Dimensions:', width, 'x', height);

      const prompt = `${modelInstruction}

TEXT OVERLAY REQUIREMENTS:
${textInstructions.length > 0 ? textInstructions.join('\n') : 'No text elements specified.'}

${logoInstruction}

CANVAS REQUIREMENTS:
- Output dimensions: ${width}x${height} pixels
- Aspect ratio: ${aspectDescription}
- Fill the ENTIRE canvas edge-to-edge

IMPORTANT:
- Keep the product exactly as shown in the original image
- Ensure all text is readable with good contrast
- Include all specified text elements with their icons`;

      console.log('Generating ad image with fal.ai prompt:', prompt);

      // Build image_urls array
      const inputImageUrls = [product_image_url];
      
      // Add custom model image if provided
      if (hasCustomModel && custom_model_url) {
        inputImageUrls.push(custom_model_url);
        console.log('Including custom model in image_urls');
      }
      
      if (logoConf?.url) {
        inputImageUrls.push(logoConf.url);
      }

      // Build request body for fal.ai
      const requestBody: any = {
        prompt,
        image_urls: inputImageUrls,
        num_images: 2,
        aspect_ratio: falAspectRatio,
        output_format: "png",
        resolution: "1K",
      };

      console.log('FAL request body:', JSON.stringify(requestBody));

      const generateResponse = await fetch(
        'https://queue.fal.run/fal-ai/nano-banana-pro/edit',
        {
          method: 'POST',
          headers: {
            'Authorization': `Key ${FAL_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!generateResponse.ok) {
        const errorText = await generateResponse.text();
        console.error('FAL generation failed:', errorText);
        throw new Error(`FAL generation failed: ${generateResponse.statusText}`);
      }

      const generateData = await generateResponse.json();
      console.log('FAL generation started:', generateData);

      return new Response(JSON.stringify({
        status: 'PROCESSING',
        request_id: generateData.request_id,
        ...generateData
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action or missing parameters' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in generate-ad-image function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
