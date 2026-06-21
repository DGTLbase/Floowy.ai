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
    const { imageUrl, imageBase64 } = await req.json();

    if (!imageUrl && !imageBase64) {
      throw new Error('Image URL or base64 data is required');
    }

    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }

    // Use base64 if provided, otherwise use URL
    const imageData = imageBase64 || imageUrl;
    console.log('Analyzing hair length, using:', imageBase64 ? 'base64 data' : 'URL');

    // Build the Anthropic image source (data URI -> base64 source, otherwise URL source)
    let imageSource: any;
    if (typeof imageData === 'string' && imageData.startsWith('data:')) {
      const m = imageData.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.*)$/);
      if (!m) throw new Error('Invalid base64 image data');
      imageSource = { type: 'base64', media_type: m[1], data: m[2] };
    } else {
      imageSource = { type: 'url', url: imageData };
    }

    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 16,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this image and determine the hair length. Respond with ONLY ONE of these categories:
- "short" - Hair above chin level, very short hair, pixie cuts, buzz cuts, ear-length or shorter
- "medium" - Hair from chin to shoulder level, or just past shoulders. Can form a ponytail or small bun. Includes bob cuts, shoulder-length hair.
- "long" - Hair clearly below shoulders, mid-back or longer. Can form long braids, long ponytails.

If hair reaches or is near the shoulders, classify as "medium".

Just respond with the single word: short, medium, or long`,
            },
            {
              type: 'image',
              source: imageSource,
            },
          ],
        },
      ],
    });

    console.log('Vision API result:', JSON.stringify(message));

    const output = message.content
      .filter((b: any) => b.type === 'text')
      .map((b: any) => b.text)
      .join('')
      .toLowerCase();

    let hairLength: 'short' | 'medium' | 'long' = 'medium';

    if (output.includes('short')) {
      hairLength = 'short';
    } else if (output.includes('long')) {
      hairLength = 'long';
    } else if (output.includes('medium')) {
      hairLength = 'medium';
    }

    console.log('Detected hair length:', hairLength);

    return new Response(
      JSON.stringify({ hairLength, rawOutput: output }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error analyzing hair length:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
