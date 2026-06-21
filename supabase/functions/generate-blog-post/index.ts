import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.69.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, admin-token, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured");

    const { content, imageUrls, beforeAfterPairs } = await req.json();

    if (!content || typeof content !== 'string') {
      return new Response(JSON.stringify({ error: "Content text is required" }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const systemPrompt = `You are a blog post designer for Floowy.ai, an AI-powered visual content generation platform. Your job is to take raw blog content and structure it into a beautifully designed blog post using content blocks.

Available block types:
1. "heading" - Section headings with optional gradient highlight. Fields: headingText (plain part), headingHighlight (gradient colored part)
2. "paragraph" - Body text paragraphs. Fields: text
3. "image" - Full-width images. Fields: imageUrl, imageAlt
4. "benefits" - Bulleted benefit/feature lists with checkmark icons. Fields: items (array of strings)
5. "before-after" - Side-by-side comparison. Fields: beforeImageUrl, beforeLabel, afterImageUrl, afterLabel

Design rules:
- Start with a compelling heading that splits naturally into plain + highlighted gradient parts
- Break long text into multiple paragraph blocks for readability
- Insert images between text sections to create visual rhythm
- Use benefits lists for key takeaways, features, or advantages (3-6 items)
- Use before-after blocks when comparing transformations
- Maintain a professional, modern tone
- Create engaging section headings that mix plain and gradient text
- Each paragraph block should be 2-4 sentences max
- Generate SEO metadata: meta_title (under 60 chars), meta_description (under 160 chars), meta_keywords (comma-separated)
- Generate a catchy title split into title (plain) and title_highlight (gradient)
- Generate a concise excerpt (1-2 sentences)
- Suggest a category from: "Visual Marketing", "Fashion Technology", "AI Technology", "Marketing Strategy"
- Generate a URL-friendly slug

You must respond using the suggest_blog_structure tool.`;

    const userPrompt = `Here is the raw blog content to structure into a beautiful blog post:

---
${content}
---

${imageUrls && imageUrls.length > 0 ? `Available images to use (place them strategically throughout the post):\n${imageUrls.map((url: string, i: number) => `Image ${i + 1}: ${url}`).join('\n')}` : 'No images provided.'}

${beforeAfterPairs && beforeAfterPairs.length > 0 ? `Before/After image pairs:\n${beforeAfterPairs.map((pair: any, i: number) => `Pair ${i + 1}: Before: ${pair.beforeUrl} | After: ${pair.afterUrl}`).join('\n')}` : ''}

Design this into a structured blog post with proper content blocks, SEO metadata, and compelling headings.`;

    const inputSchema = {
      type: "object",
      properties: {
        title: { type: "string", description: "Plain part of the blog title" },
        title_highlight: { type: "string", description: "Gradient highlighted part of the title" },
        slug: { type: "string", description: "URL-friendly slug" },
        excerpt: { type: "string", description: "1-2 sentence excerpt for the blog listing" },
        category: { type: "string", enum: ["Visual Marketing", "Fashion Technology", "AI Technology", "Marketing Strategy"] },
        meta_title: { type: "string", description: "SEO title under 60 chars" },
        meta_description: { type: "string", description: "SEO description under 160 chars" },
        meta_keywords: { type: "string", description: "Comma-separated SEO keywords" },
        cover_image_index: { type: "number", description: "Index of the uploaded image to use as cover (0-based), or -1 if none" },
        content_blocks: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: { type: "string", enum: ["heading", "paragraph", "image", "benefits", "before-after"] },
              headingText: { type: "string" },
              headingHighlight: { type: "string" },
              text: { type: "string" },
              imageUrl: { type: "string" },
              imageAlt: { type: "string" },
              items: { type: "array", items: { type: "string" } },
              beforeImageUrl: { type: "string" },
              beforeLabel: { type: "string" },
              afterImageUrl: { type: "string" },
              afterLabel: { type: "string" },
              image_index: { type: "number", description: "Index of uploaded image to use (0-based)" },
              before_image_index: { type: "number" },
              after_image_index: { type: "number" }
            },
            required: ["type"]
          }
        }
      },
      required: ["title", "title_highlight", "slug", "excerpt", "category", "meta_title", "meta_description", "meta_keywords", "content_blocks"]
    };

    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

    let message;
    try {
      message = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 8000,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
        tools: [
          {
            name: "suggest_blog_structure",
            description: "Return the structured blog post with content blocks and metadata",
            input_schema: inputSchema as any,
          },
        ],
        tool_choice: { type: "tool", name: "suggest_blog_structure" },
      });
    } catch (err: any) {
      const status = err?.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      console.error("Anthropic error:", status, err?.message);
      throw new Error(`AI service error: ${status ?? 'unknown'}`);
    }

    const toolUse = message.content.find((b: any) => b.type === 'tool_use');
    if (!toolUse?.input) {
      throw new Error("AI did not return structured output");
    }

    const result: any = toolUse.input;

    // Map image indices to actual URLs
    if (imageUrls && imageUrls.length > 0) {
      if (result.cover_image_index >= 0 && result.cover_image_index < imageUrls.length) {
        result.cover_image_url = imageUrls[result.cover_image_index];
      }

      for (const block of result.content_blocks) {
        if (block.type === "image" && block.image_index !== undefined && block.image_index >= 0 && block.image_index < imageUrls.length) {
          block.imageUrl = imageUrls[block.image_index];
        }
        if (block.type === "before-after") {
          if (block.before_image_index !== undefined && block.before_image_index >= 0) {
            block.beforeImageUrl = imageUrls[block.before_image_index];
          }
          if (block.after_image_index !== undefined && block.after_image_index >= 0) {
            block.afterImageUrl = imageUrls[block.after_image_index];
          }
        }
        // Clean up index fields
        delete block.image_index;
        delete block.before_image_index;
        delete block.after_image_index;
      }
    }

    // Also map before/after pairs
    if (beforeAfterPairs && beforeAfterPairs.length > 0) {
      for (const block of result.content_blocks) {
        if (block.type === "before-after" && !block.beforeImageUrl && !block.afterImageUrl) {
          const pair = beforeAfterPairs.shift();
          if (pair) {
            block.beforeImageUrl = pair.beforeUrl;
            block.afterImageUrl = pair.afterUrl;
          }
        }
      }
    }

    delete result.cover_image_index;

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("generate-blog-post error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
