import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.69.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, requestId, modelImageUrl, productImageUrl, prompt, language, voiceover, productName, categoryPreset, generate_audio = true, has_model = false, modelBehavior = '', aspect_ratio = '9:16', duration_seconds = 8, cut_style = '', voice_performance = '', voice_performance_directive = '' } = await req.json();
    const FAL_API_KEY = Deno.env.get('FAL_API_KEY');
    // Video model base (Veo -> Omni swap). Set the FAL_VIDEO_MODEL secret to
    // switch without a code change; submit + status paths both derive from it.
    const VIDEO_MODEL = Deno.env.get('FAL_VIDEO_MODEL') || 'fal-ai/veo3.1';
    // Human-readable spoken language for prompts (keeps generation consistent).
    const spokenLang = language === 'dutch' ? 'Dutch' : language === 'spanish' ? 'Spanish'
      : language === 'french' ? 'French' : language === 'german' ? 'German'
      : language === 'italian' ? 'Italian' : language === 'portuguese' ? 'Portuguese'
      : language === 'british' ? 'British English' : language === 'american' ? 'American English' : 'English';
    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

    if (!FAL_API_KEY) {
      throw new Error('FAL_API_KEY is not configured');
    }

    // Handle voiceover preview action
    if (action === 'preview_voiceover') {
      if (!ANTHROPIC_API_KEY) {
        return new Response(
          JSON.stringify({ error: 'AI service not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Category-specific voiceover prompts
      const categoryInstructions: Record<string, string> = {
        beauty: `Focus on: texture, feel on skin, visible results, how it makes you look/feel. Mention specific benefits like "glowing skin", "smooth texture", "perfect for daily use". Keep it conversational and personal.`,
        fashion: `Focus on: fit, comfort, style versatility, how it looks/feels when worn. Mention things like "perfect fit", "so comfortable", "goes with everything". Keep it relatable and style-focused.`,
        electronics: `Focus on: key features, performance, ease of use, how it improves daily life. Mention specific specs or benefits like "battery lasts forever", "super fast", "makes life easier". Keep it practical and enthusiastic.`,
        food: `Focus on: taste, texture, ingredients, why you love it. Use sensory words like "delicious", "perfect balance", "fresh ingredients". Keep it mouth-watering and authentic.`,
        fitness: `Focus on: performance, comfort during workout, results, motivation. Mention things like "perfect for training", "stays in place", "helps me push harder". Keep it energetic and inspiring.`,
        home: `Focus on: functionality, quality, how it improves your space/life. Mention practical benefits and aesthetic appeal. Keep it warm and relatable.`,
        auto: `Default approach: highlight quality, features, and value.`
      };

      const categoryInstruction = categoryInstructions[categoryPreset] || categoryInstructions.auto;

      // Language-specific instructions
      const getLanguageInstruction = (lang: string): string => {
        if (lang === 'british') {
          return `Write in British English with authentic British phrasing and vocabulary. Use British expressions like "brilliant", "lovely", "proper", "absolutely". Avoid Americanisms. Examples: "This is brilliant!" not "This is awesome!", "It's proper good" not "It's really good", "Absolutely love it" not "Totally love it".`;
        } else if (lang === 'american') {
          return `Write in American English with natural American phrasing and vocabulary.`;
        } else if (lang === 'dutch') {
          return `Schrijf in natuurlijk Nederlands met authentieke Nederlandse uitdrukkingen.`;
        } else if (lang === 'spanish') {
          return `Escribe en español natural con expresiones auténticas.`;
        } else if (lang === 'german') {
          return `Schreibe auf natürlichem Deutsch mit authentischen deutschen Ausdrücken.`;
        } else if (lang === 'french') {
          return `Écris en français naturel avec des expressions authentiques.`;
        } else if (lang === 'italian') {
          return `Scrivi in italiano naturale con espressioni autentiche.`;
        } else if (lang === 'portuguese') {
          return `Escreva em português natural com expressões autênticas.`;
        }
        return 'Use natural, conversational language.';
      };

      const languageInstruction = getLanguageInstruction(language);

      const voiceoverPrompt = `You are creating a short, authentic voiceover script for a UGC (user-generated content) video promoting "${productName}".

${categoryInstruction}

Requirements:
- 15-20 words maximum (must fit in 8 seconds)
- Sound like a real person sharing their genuine experience
- Use casual, conversational language
- Be specific about the product
- No hashtags, no "swipe up", no call-to-action phrases
- Start directly with the content (no "Hey guys" or similar)
- ${languageInstruction}
- CRITICAL LANGUAGE RULE: write the ENTIRE script in ${spokenLang} ONLY. Do NOT mix in any English words or phrases (the brand/product name may stay as-is). Output must be 100% ${spokenLang}.

Example good scripts${language === 'british' ? ' (British English)' : ''}:
${language === 'british' ? `- "This moisturiser is absolutely brilliant! Proper lightweight and keeps my skin hydrated all day long."
- "Finally found jeans that fit properly. So comfortable and they go with literally everything I own."
- "These headphones are incredible. Sound quality is lovely and they're dead comfortable for long sessions."` : `- "This moisturizer changed my skin routine completely. So lightweight but keeps me hydrated all day."
- "Finally found jeans that actually fit right. Comfortable, flattering, and go with everything I own."
- "These headphones are incredible. Sound quality is amazing and they're so comfortable for long sessions."`}

Write ONLY the voiceover script, nothing else.`;

      console.log('Generating voiceover preview with Lovable AI...');

      const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

      let aiMessage;
      try {
        aiMessage = await anthropic.messages.create({
          model: 'claude-haiku-4-5',
          max_tokens: 512,
          messages: [
            {
              role: 'user',
              content: voiceoverPrompt
            }
          ],
        });
      } catch (err: any) {
        console.error('AI API error:', err?.status, err?.message);
        const detail = err?.message || err?.error?.message || (err?.status ? `AI error ${err.status}` : 'unknown AI error');
        return new Response(
          JSON.stringify({ error: `Voiceover preview failed: ${detail}`, status: err?.status ?? null }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const generatedVoiceover = aiMessage.content.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('').trim() || '';

      console.log('Generated voiceover preview:', generatedVoiceover);

      return new Response(
        JSON.stringify({ 
          status: 'SUCCESS',
          voiceover: generatedVoiceover
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Handle status check
    if (action === 'status' && requestId) {
      console.log('Checking status for request:', requestId);
      
      const statusResponse = await fetch(`https://queue.fal.run/${VIDEO_MODEL}/requests/${requestId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Key ${FAL_API_KEY}`,
        },
      });

      if (!statusResponse.ok) {
        const raw = await statusResponse.text();
        try {
          const parsed = JSON.parse(raw);
          console.error('Status check failed:', statusResponse.status, parsed);
          // FAL returns 400 while still processing
          if (statusResponse.status === 400 && (parsed.detail?.includes('in progress') || parsed.detail === 'Request is still in progress')) {
            return new Response(
              JSON.stringify({ status: 'PROCESSING' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          // Any other error -> signal FAILED to the client without 500s
          return new Response(
            JSON.stringify({ status: 'FAILED', error: parsed?.detail || parsed?.error || 'Unknown generation error' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (_) {
          console.error('Status check failed (non-JSON):', statusResponse.status, raw);
          return new Response(
            JSON.stringify({ status: 'FAILED', error: `Status check failed: ${statusResponse.status}` }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      const statusData = await statusResponse.json();
      console.log('Status response:', statusData);

      // If completed, try to read video url directly or via response_url
      const tryExtractVideo = async (): Promise<string | null> => {
        const direct = statusData?.video?.url
          || statusData?.video_url
          || statusData?.output?.video?.url
          || statusData?.output?.videos?.[0]?.url
          || statusData?.videos?.[0]?.url;
        if (direct) return direct as string;

        const respUrl: string | undefined = statusData?.response_url;
        if (respUrl) {
          const res = await fetch(respUrl, { headers: { 'Authorization': `Key ${FAL_API_KEY}` } });
          if (res.ok) {
            const data = await res.json();
            return (
              data?.video?.url ||
              data?.video_url ||
              data?.output?.video?.url ||
              data?.output?.videos?.[0]?.url ||
              data?.videos?.[0]?.url ||
              null
            );
          }
        }
        return null;
      };

      const videoUrl = await tryExtractVideo();

      if (videoUrl) {
        return new Response(
          JSON.stringify({ status: 'COMPLETED', video_url: videoUrl }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Fallback if not ready yet
      return new Response(
        JSON.stringify({ status: 'PROCESSING' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For no-audio (product-only) mode, use the pre-generated image passed from frontend
    // The frontend already generates the product image via nano-banana-pro
    let finalProductImageUrl = productImageUrl;
    
    // If generate_audio is false, we use modelImageUrl as the pre-generated product image
    // (The frontend generates the product image and passes it as modelImageUrl)
    if (!generate_audio && modelImageUrl) {
      console.log('Using pre-generated product image from frontend:', modelImageUrl);
      finalProductImageUrl = modelImageUrl;
    } else if (generate_audio && productImageUrl) {
      // For UGC with model, use the original product image
      console.log('Using original product image for UGC generation:', productImageUrl);
      finalProductImageUrl = productImageUrl;
    }
    
    // STEP 2: Generate video
    console.log('STEP 2: Starting video generation');
    console.log('Model Image URL:', modelImageUrl);
    console.log('Generated Product Image URL:', finalProductImageUrl);
    console.log('Prompt:', prompt);
    console.log('Language:', language);
    console.log('Voiceover:', voiceover);
    console.log('Product Name:', productName);

    // Research product and generate tailored voiceover if not provided
    let enhancedVoiceover = voiceover;
    if (!voiceover && productName && ANTHROPIC_API_KEY) {
      try {
        console.log('Generating product-specific voiceover for:', productName);
        
        // Language-specific word counts, calibrated per 8 seconds then scaled to
        // the selected video duration (6 / 8 / 10 sec) so speech fits the clip.
        const wordCountBase8s: { [key: string]: [number, number] } = {
          'english': [25, 30],
          'dutch': [22, 26],
          'spanish': [28, 32],
          'french': [26, 30],
          'german': [22, 26],
          'italian': [28, 32],
          'portuguese': [28, 32],
        };
        const normalizedLang = (language || 'english').toLowerCase();
        const scriptDuration = [6, 8, 10].includes(Number(duration_seconds)) ? Number(duration_seconds) : 8;
        const [wMin, wMax] = wordCountBase8s[normalizedLang] || [25, 30];
        const scale = scriptDuration / 8;
        const wordCount = `${Math.round(wMin * scale)}-${Math.round(wMax * scale)} words`;
        const languageName = language === 'dutch' ? 'Dutch' : language === 'spanish' ? 'Spanish' : language === 'french' ? 'French' : language === 'german' ? 'German' : language === 'italian' ? 'Italian' : language === 'portuguese' ? 'Portuguese' : 'English';

        // Get language-specific instructions
        const getLanguageInstruction = (lang: string): string => {
          if (lang === 'british') {
            return `Write in British English with authentic British phrasing and vocabulary. Use British expressions like "brilliant", "lovely", "proper", "absolutely". Avoid Americanisms. Examples: "This is brilliant!" not "This is awesome!", "It's proper good" not "It's really good", "Absolutely love it" not "Totally love it".`;
          } else if (lang === 'american') {
            return `Write in American English with natural American phrasing and vocabulary.`;
          } else if (lang === 'dutch') {
            return `Schrijf in natuurlijk Nederlands met authentieke Nederlandse uitdrukkingen.`;
          } else if (lang === 'spanish') {
            return `Escribe en español natural con expresiones auténticas.`;
          } else if (lang === 'german') {
            return `Schreibe auf natürlichem Deutsch mit authentischen deutschen Ausdrücken.`;
          } else if (lang === 'french') {
            return `Écris en français naturel avec des expressions authentiques.`;
          } else if (lang === 'italian') {
            return `Scrivi in italiano naturale con espressioni autentiche.`;
          } else if (lang === 'portuguese') {
            return `Escreva em português natural com expressões autênticas.`;
          }
          return 'Use natural, conversational language.';
        };

        const languageInstruction = getLanguageInstruction(language);

        const anthropic2 = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
        const researchMessage = await anthropic2.messages.create({
            model: 'claude-haiku-4-5',
            max_tokens: 512,
            system: `You are an expert UGC content creator and product analyst. First analyze the product to understand its category, benefits, and target audience. Then create an authentic voiceover script.`,
            messages: [
              {
                role: 'user',
                content: `Product: "${productName}"

STEP 1 - Analyze this product:
- Identify the product category (skincare, makeup, tech, fashion, food, fitness, etc.)
- Determine if it's explicitly gendered (men's/women's product) or neutral
- List 3-4 key benefits specific to this product type

STEP 2 - Write a natural ${languageName} voiceover script for a ${scriptDuration}-second UGC video (EXACTLY ${wordCount}).
${voice_performance_directive ? `Delivery style — write the words to match this voice performance: ${voice_performance_directive}` : ''}

Requirements:
- Talk about SPECIFIC product qualities and benefits based on your analysis
- Use conversational language like recommending to a friend
- Be enthusiastic but genuine
- Keep it SHORT to fit ${scriptDuration} seconds of clear speech
- CRITICAL: Use gender-neutral language ("you", "people", "everyone") UNLESS the product name clearly indicates it's for men (e.g., "Men's Beard Oil") or women (e.g., "Women's Maternity Vitamins")
- ${languageInstruction}

CATEGORY-SPECIFIC GUIDANCE (${categoryPreset || 'general'}):
${categoryPreset === 'beauty' ? `
BEAUTY/SKINCARE FOCUS:
- Mention texture (lightweight, creamy, absorbs quickly, non-greasy)
- Talk about feel on skin (smooth, soft, hydrating, refreshing)
- Describe visible results (glow, even tone, protected skin)
- Mention how it works with other products (under makeup, layering)
Example: "This serum is incredible! Absorbs so fast, feels weightless, and my skin looks so glowy. Perfect base for makeup!"` : ''}
${categoryPreset === 'fashion' ? `
FASHION/STYLE FOCUS:
- Emphasize fit and comfort (true to size, flattering, comfortable all day)
- Talk about versatility (dress up or down, pairs with everything)
- Mention quality feel (soft fabric, well-made, durable)
- Describe how it makes you feel (confident, stylish, put-together)
Example: "These jeans are perfect! Fit like a dream, so comfy I can wear them all day. They go with literally everything!"` : ''}
${categoryPreset === 'fitness' ? `
FITNESS/SPORTS FOCUS:
- Highlight performance (supports workouts, improves recovery, boosts energy)
- Mention comfort during activity (stays in place, breathable, no chafing)
- Talk about results (helps reach goals, feels effective, noticeable difference)
- Describe durability (holds up well, quality construction)
Example: "This protein powder is a game-changer! Mixes smooth, tastes amazing, and really helps my recovery. I feel stronger!"` : ''}
${categoryPreset === 'tech' ? `
TECH/GADGET FOCUS:
- Emphasize ease of use (simple setup, intuitive, user-friendly)
- Talk about performance (fast, reliable, powerful, smooth)
- Mention key features (battery life, connectivity, quality)
- Describe user experience (makes life easier, works great, love using it)
Example: "These earbuds are amazing! Sound quality is incredible, battery lasts all day, and they fit perfectly. Worth it!"` : ''}
${categoryPreset === 'food' ? `
FOOD/BEVERAGE FOCUS:
- Describe taste (delicious, flavorful, satisfying, better than expected)
- Mention texture/experience (creamy, crunchy, smooth, refreshing)
- Talk about convenience (easy to make, quick, ready when you need it)
- Describe effects (energizing, filling, healthy, feel-good)
Example: "This smoothie mix is so good! Tastes amazing, keeps me full for hours, and super easy to make. My new favorite!"` : ''}
${categoryPreset === 'lifestyle' ? `
LIFESTYLE/HOME FOCUS:
- Emphasize how it fits daily routine (makes mornings easier, helps organization)
- Talk about quality of life improvement (more comfortable, saves time, reduces stress)
- Mention design/aesthetics (looks great, fits any space, well-designed)
- Describe practical benefits (durable, easy to clean, multifunctional)
Example: "This organizer changed my life! Everything has a place now. Looks great and makes my mornings so much easier!"` : ''}
${!categoryPreset ? `
GENERAL PRODUCT FOCUS:
- Talk about the main benefit that stands out
- Mention quality and value
- Be specific about what makes it different
- Share genuine enthusiasm
Example: "I'm obsessed with this product! The quality is amazing, it actually works, and totally worth the price."` : ''}

Return ONLY the voiceover script, no analysis or explanations.`
              }
            ],
        });

        enhancedVoiceover = researchMessage.content.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('').trim() || voiceover;
        console.log('Generated tailored voiceover:', enhancedVoiceover);
      } catch (error) {
        console.error('Error generating voiceover:', error);
        // Fall back to original voiceover
      }
    }

    // Detect model gender from voiceover and product type
    const voiceoverLower = (enhancedVoiceover || '').toLowerCase();
    const productLower = (productName || '').toLowerCase();
    
    // Define language name for later use
    const normalizedLang = (language || 'english').toLowerCase();
    const languageName = language === 'dutch' ? 'Dutch' : language === 'spanish' ? 'Spanish' : language === 'french' ? 'French' : language === 'german' ? 'German' : language === 'italian' ? 'Italian' : language === 'portuguese' ? 'Portuguese' : 'English';
    
    // Detect gender from context (only for explicitly gendered products)
    const maleIndicators = ['aftershave', 'beard', 'shaving', "men's", 'for men'];
    const femaleIndicators = ['makeup', 'lipstick', 'mascara', "women's", 'for women'];
    
    const isMaleProduct = maleIndicators.some(word => productLower.includes(word));
    const isFemaleProduct = femaleIndicators.some(word => productLower.includes(word));
    
    // Detect product category for tailored gestures
    const isSkincareOrCosmetic = ['sunscreen', 'moisturizer', 'serum', 'cream', 'lotion', 'aftershave', 'lip', 'makeup'].some(word => productLower.includes(word));
    const isFashionOrAccessory = ['jacket', 'shoes', 'bag', 'watch', 'jewelry', 'clothing'].some(word => productLower.includes(word));
    const isTechOrGadget = ['headphones', 'phone', 'tech', 'gadget', 'device'].some(word => productLower.includes(word));

    // Video config (Omni supports multi-shot cuts; Veo is single-shot). Computed
    // once so the prompt and request body stay consistent.
    const isOmni = VIDEO_MODEL.includes('omni');
    const safeAspect = (aspect_ratio === '16:9' || aspect_ratio === '9:16') ? aspect_ratio : '9:16';
    const safeDuration = [6, 8, 10].includes(Number(duration_seconds)) ? Number(duration_seconds) : 8;
    const allowCuts = isOmni && !!cut_style && cut_style !== 'no-cuts';

    // Cut styles need multiple SEQUENTIAL shots, so the "single continuous shot"
    // rule only applies when cuts are not wanted. Duration follows the selection.
    let enhancedPrompt = `CRITICAL VIDEO RULES:
1. ABSOLUTELY NO TEXT, NO CAPTIONS, NO OVERLAYS, NO SUBTITLES, NO GRAPHICS of any kind.
${allowCuts
  ? '2. Use clean, deliberate hard CUTS and angle changes over time as described. Cuts are SEQUENTIAL in time - NEVER split screens, collage/grid, picture-in-picture, or side-by-side panels shown at once.'
  : '2. SINGLE CONTINUOUS SHOT ONLY - NO split screens, NO multiple frames, NO collage layouts, NO before/after panels, NO side-by-side views.\n3. ONE perspective throughout the entire video - do NOT show multiple camera angles or views simultaneously.'}
This is a REAL video recording, NOT a slideshow or montage.

An approximately ${safeDuration}-second smooth, natural product video. ${prompt}. `;
    
    // CRITICAL PRODUCT INTEGRITY RULES
    enhancedPrompt += 'PRODUCT INTEGRITY: Keep the product in its EXACT original form - NO warping, NO distortion, NO morphing, NO transformation of the product. ';
    
    // CRITICAL CAMERA INSTRUCTIONS - Emphasis on natural, continuous footage
    enhancedPrompt += allowCuts
      ? 'CAMERA: Natural, motivated camera work with purposeful moves between cuts (orbits, push-ins, reframes) as the style calls for. Keep it authentic, not gimmicky. '
      : 'CAMERA: Gentle, natural handheld feel like a real phone recording. Slight natural micro-movements are OK but NO dramatic zooms, NO pans, NO artificial camera effects. ';
    
    // NATURAL FLOW - Not robotic
    enhancedPrompt += 'NATURAL FLOW: Smooth, organic motion throughout. Movements should feel genuine and spontaneous, not staged or mechanical. Real-life pacing and rhythm. ';
    
    // REINFORCE SINGLE FRAME RULE
    enhancedPrompt += 'SINGLE FRAME ONLY: The entire video must be ONE continuous view - absolutely NO grid layouts, NO picture-in-picture, NO split compositions. ';
    
    // Check if we're generating with audio/model or product-only
    // Use has_model flag to determine if a model was selected (for no-voiceover + model case)
    if (generate_audio && modelImageUrl) {
      // UGC-style with creator speaking
      const languageInstruction = language && language !== 'english' ? `in ${languageName} ` : '';
      
      if (isMaleProduct) {
        enhancedPrompt += `A male creator speaks ${languageInstruction}naturally and authentically for EXACTLY 8 seconds. `;
      } else if (isFemaleProduct) {
        enhancedPrompt += `A female creator speaks ${languageInstruction}naturally and authentically for EXACTLY 8 seconds. `;
      } else {
        enhancedPrompt += `A creator speaks ${languageInstruction}naturally and authentically for EXACTLY 8 seconds. `;
      }
      
      // Natural delivery style
      enhancedPrompt += 'Relaxed, conversational delivery - like talking to a friend. Natural pauses, genuine expressions, comfortable body language. ';
      
      // Add product-specific gestures and movements based on category
      if (categoryPreset === 'beauty') {
        enhancedPrompt += 'Gently shows product, perhaps touches face or demonstrates texture. Soft, genuine reactions. Natural beauty vlog style. ';
      } else if (categoryPreset === 'fashion') {
        enhancedPrompt += 'Shows off the item casually, maybe adjusts it or demonstrates how it looks. Relaxed try-on haul vibes. ';
      } else if (categoryPreset === 'fitness') {
        enhancedPrompt += 'Energetic but natural demonstration. Shows product in context. Authentic fitness influencer style. ';
      } else if (categoryPreset === 'tech') {
        enhancedPrompt += 'Casually handles the device, points out features naturally. Genuine tech review feel. ';
      } else if (categoryPreset === 'food') {
        enhancedPrompt += 'Shows the food/drink appetizingly, maybe takes a taste. Genuine food review style. ';
      } else if (categoryPreset === 'lifestyle') {
        enhancedPrompt += 'Demonstrates product in everyday context. Authentic day-in-the-life vibe. ';
      } else {
        enhancedPrompt += 'Natural gestures while discussing the product. Genuine, relatable content creator style. ';
      }
      
      enhancedPrompt += 'UGC aesthetic with natural lighting. ONE continuous take, no cuts. ';

      if (enhancedVoiceover) {
        enhancedPrompt += `SPOKEN LANGUAGE (CRITICAL): the creator speaks ENTIRELY in ${spokenLang}. Every spoken word MUST be in ${spokenLang} - absolutely NO English words or phrases mixed in, except the brand/product name. The creator says exactly, word-for-word in ${spokenLang}: "${enhancedVoiceover}" - delivered naturally over ${safeDuration} seconds with comfortable pacing. `;
      }
    } else if (has_model && modelImageUrl) {
      // Silent video WITH model (no voiceover option but model selected)
      // Use modelBehavior for custom scene direction if provided
      enhancedPrompt += 'SILENT VIDEO - NO speech, NO voiceover, NO audio. ';
      
      if (modelBehavior) {
        // User provided custom model behavior/scene direction - use it as the primary direction
        enhancedPrompt += `Model behavior and scene direction: ${modelBehavior}. `;
        enhancedPrompt += 'Execute this direction naturally with genuine expressions and smooth movements. ';
      } else {
        // Default behavior based on category
        enhancedPrompt += 'The model interacts with the product silently through natural gestures and expressions. ';
        enhancedPrompt += 'Genuine reactions, soft smiles, natural movements. Like a silent product demonstration. ';
        
        if (categoryPreset === 'beauty') {
          enhancedPrompt += 'Model gently applies or holds beauty product, shows texture on skin, genuine satisfied expression. ';
        } else if (categoryPreset === 'fashion') {
          enhancedPrompt += 'Model silently shows off fashion item, adjusts fit, confident natural poses. ';
        } else if (categoryPreset === 'fitness') {
          enhancedPrompt += 'Model demonstrates fitness product in use, natural athletic movements. ';
        } else if (categoryPreset === 'tech') {
          enhancedPrompt += 'Model handles tech device, explores features silently, impressed expressions. ';
        } else if (categoryPreset === 'food') {
          enhancedPrompt += 'Model presents food/drink, perhaps tastes it, genuine enjoyment. ';
        } else {
          enhancedPrompt += 'Model naturally interacts with product, genuine expressions of satisfaction. ';
        }
      }
      
      enhancedPrompt += 'Soft, natural lighting. Smooth continuous footage. No text overlays. ';
    } else {
      // Product-only video without model - ABSOLUTELY NO HUMANS
      enhancedPrompt += 'PRODUCT-ONLY VIDEO: ABSOLUTELY NO humans, NO people, NO models, NO faces, NO hands, NO body parts. ';
      enhancedPrompt += 'SILENT - NO audio, NO voiceover, NO speech. ';
      enhancedPrompt += `Clean product showcase of ${productName || 'the product'}. `;
      
      if (modelBehavior) {
        // User provided custom scene direction for product-only video
        enhancedPrompt += `Scene direction: ${modelBehavior}. `;
      } else {
        enhancedPrompt += 'Product rests elegantly on a surface or is displayed with subtle ambient movement (gentle light shifts, soft shadows). ';
      }
      
      // Add product-specific visual treatments
      if (categoryPreset === 'beauty') {
        enhancedPrompt += 'Luxurious beauty product presentation. Soft diffused lighting, gentle reflections, premium atmosphere. ';
      } else if (categoryPreset === 'fashion') {
        enhancedPrompt += 'Elegant fashion item display. Sophisticated lighting, clean composition. Item displayed flat or on form. ';
      } else if (categoryPreset === 'tech') {
        enhancedPrompt += 'Sleek tech product showcase. Modern clean lighting, subtle ambient glow, premium tech aesthetic. ';
      } else if (categoryPreset === 'food') {
        enhancedPrompt += 'Appetizing food presentation. Warm inviting lighting, steam or condensation details if applicable. ';
      } else {
        enhancedPrompt += 'Professional product display with elegant lighting and premium feel. ';
      }
      
      enhancedPrompt += 'Cinematic quality. ONE continuous shot. ZERO human elements. ';
    }
    
    // Add product context if available
    if (finalProductImageUrl) {
      enhancedPrompt += `The product being showcased matches the item in the reference image.`;
    }

    // Use model image if available, otherwise use the generated product image
    const imageForVideo = (generate_audio && modelImageUrl) ? modelImageUrl : (has_model && modelImageUrl) ? modelImageUrl : finalProductImageUrl;
    
    if (!imageForVideo) {
      return new Response(
        JSON.stringify({ error: 'No image available for video generation' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Omni: send only the confirmed params (prompt, image_url, aspect_ratio) —
    // duration is conveyed via the prompt. Veo keeps its fuller body.
    const requestBody: Record<string, unknown> = isOmni
      ? { image_url: imageForVideo, prompt: enhancedPrompt, aspect_ratio: safeAspect }
      : { image_url: imageForVideo, prompt: enhancedPrompt, resolution: "720p", aspect_ratio: safeAspect, duration: `${safeDuration}s` };
    console.log('Video config:', { model: VIDEO_MODEL, aspect_ratio: safeAspect, duration: safeDuration, cut_style, allowCuts, voice_performance });

    console.log('Request body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(`https://queue.fal.run/${VIDEO_MODEL}/image-to-video`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('FAL API error:', response.status, errorText);
      
      // Return a more user-friendly error instead of throwing
      return new Response(
        JSON.stringify({ 
          error: `Video generation failed. This may be a temporary issue with the video generation service. Please try again in a few moments.`,
          technical_details: `FAL API returned ${response.status}: ${errorText}`
        }),
        { 
          status: 200, // Return 200 so frontend can handle gracefully
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const data = await response.json();
    console.log('FAL API response:', data);

    return new Response(
      JSON.stringify({
        request_id: data.request_id,
        status: 'PROCESSING',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-ugc-video:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
