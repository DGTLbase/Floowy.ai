import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.69.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    if (!ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Optimizing prompt:', prompt.substring(0, 50) + '...');

    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

    let message;
    try {
      message = await anthropic.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 256,
        system:
          'You are an expert at writing concise, effective prompts for AI image generation backgrounds. Your task is to take a user description and make it more specific, visual, and effective for generating professional product photography backgrounds. CRITICAL: Keep your response under 250 characters total. Focus on: lighting, colors, textures, atmosphere. Output ONLY the improved prompt, nothing else.',
        messages: [
          {
            role: 'user',
            content: `Improve this background description for product photography: "${prompt}"`,
          },
        ],
      });
    } catch (err: any) {
      const status = err?.status;
      if (status === 429) {
        console.error('Rate limit exceeded');
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      console.error('Anthropic error:', status, err?.message);
      return new Response(
        JSON.stringify({ error: 'AI service error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const optimizedPrompt = message.content
      .filter((b: any) => b.type === 'text')
      .map((b: any) => b.text)
      .join('')
      .trim();

    if (!optimizedPrompt) {
      console.error('No optimized prompt in response:', JSON.stringify(message));
      return new Response(
        JSON.stringify({ error: 'Failed to generate optimized prompt' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Prompt optimized successfully');
    return new Response(
      JSON.stringify({ optimizedPrompt }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error optimizing prompt:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
