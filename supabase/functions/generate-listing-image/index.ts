import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.69.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const FAL_GENERATE_URL = "https://queue.fal.run/fal-ai/nano-banana-pro/edit";
const FAL_BASE_REQUEST_URL = "https://queue.fal.run/fal-ai/nano-banana-pro/requests";

// ----- Template prompts (from Listing Studio briefing) -----

function buildUspPrompt(v: Record<string, string>) {
  return `${v.platform} product listing image. Full-bleed lifestyle photo of ${v.product_name} placed naturally in ${v.setting}. ${v.model_instruction}

The product is the central hero element, styled with contextually appropriate props: ${v.lifestyle_props}. ${v.color_palette_description} tones throughout the scene matching the product's appearance.

Eye-level shot, shallow depth of field focused on the product. Warm, cinematic lighting with soft natural shadows creating a premium, aspirational atmosphere.

Overlaid on the image:

HEADLINE: Bold headline text "${v.headline_usp}" in ${v.headline_font} font, positioned top-center, with a smaller supporting subheadline "${v.subheadline_text}" placed directly beneath it. The subheadline is visually subordinate to the headline — roughly 40–50% of its size, lighter weight, same font family, and tonally consistent with the overall composition. No background pill, bar, or container; the subheadline sits cleanly on the image as a refinement of the headline statement.

USP BLOCKS: Three USP blocks with semi-transparent dark background pills, each with a ${v.icon_color} icon and white text:
(1) ${v.usp1_icon} – "${v.usp1_text}"
(2) ${v.usp2_icon} – "${v.usp2_text}"
(3) ${v.usp3_icon} – "${v.usp3_text}"

${v.logo_instruction}

${v.brand_color_instruction}

All visible overlay text must be written in ${v.language}.

Cinematic color grading with ${v.color_palette_description}. Clean, professional, marketplace-optimized composition.`;
}

function buildStepsPrompt(v: Record<string, string>) {
  return `${v.platform} product listing image with step-by-step instruction layout. Full-bleed soft background in ${v.color_palette_description} tones. ${v.model_instruction}

The ${v.product_name} is shown as the hero product in the center. Around it, three numbered instruction steps are arranged in a clean visual flow, each with a small circular product photo and white text on semi-transparent background pills in tones matching ${v.color_palette_description}:

Step 1 – circle photo showing ${v.step1_visual} – ${v.accent_color} icon with number "1" – white text: "${v.step1_text}"
Step 2 – circle photo showing ${v.step2_visual} – ${v.accent_color} icon with number "2" – white text: "${v.step2_text}"
Step 3 – circle photo showing ${v.step3_visual} – ${v.accent_color} icon with number "3" – white text: "${v.step3_text}"

Below the steps, a ${v.accent_color} accent bar with bold white text: "${v.summary_bar_steps}".

At the top-center: bold headline text "${v.headline_steps}" in ${v.headline_font} font.

Three small USP icons in a row at the bottom with white text:
(1) ${v.mini1_icon} – "${v.mini1_text}"
(2) ${v.mini2_icon} – "${v.mini2_text}"
(3) ${v.mini3_icon} – "${v.mini3_text}"

${v.logo_instruction}

${v.brand_color_instruction}

All visible overlay text must be written in ${v.language}.

Cinematic soft-focus aesthetic with ${v.color_palette_description}, gentle shadows, and a clean minimalist product feel.`;
}

function buildDescribePrompt(v: Record<string, string>) {
  return `${v.platform} product listing image. ${v.user_free_description}

The ${v.product_name} is the central hero element in the composition. ${v.model_instruction}

${v.color_palette_description} tones matching the product's appearance. Cinematic lighting with soft natural shadows. Eye-level shot, shallow depth of field focused on the product.

${v.text_elements_instruction}

${v.logo_instruction}

${v.brand_color_instruction}

All visible overlay text must be written in ${v.language}.

Professional, marketplace-optimized composition with clean contrast and premium feel.`;
}

// ----- Helpers -----

function modelInstruction(
  displayMode: string,
  modelDescription?: string,
  hasModelImage?: boolean,
  autoModel?: boolean,
  autoGender?: string,
) {
  switch (displayMode) {
    case "product_only":
      return "No human model in the image. The product is shown on its own in the scene.";
    case "hand_only":
      return "Only a human hand is visible holding or interacting with the product. No face, no full body. Natural skin tone, realistic hand.";
    case "with_model":
      if (hasModelImage) {
        return `Use the provided model reference image as the person in the scene. Preserve their face, skin tone, hair, body type and overall identity exactly. The model is naturally interacting with the product. ${modelDescription || ""} Realistic skin and proportions, documentary-style photography.`.trim();
      }
      if (autoModel) {
        const g = autoGender === "male" ? "male" : "female";
        return `An AI-generated ${g} human model is shown naturally interacting with the product. Realistic skin, natural proportions, documentary-style photography, contemporary look that fits the product context.`;
      }
      return modelDescription
        ? `A human model is shown with the product. ${modelDescription}. Natural pose, realistic skin and proportions.`
        : "A human model is shown naturally interacting with the product. Realistic skin and proportions.";
    default:
      return "No human model in the image. The product is shown on its own in the scene.";
  }
}

function logoInstruction(logo?: { position?: string; size?: number; provided?: boolean }) {
  if (!logo?.provided) return "";
  const pos = (logo.position || "bottom-center").replace(/-/g, " ");
  const size = logo.size || 60;
  return `LOGO: Provided logo placed at ${pos}, size ${size}px. Preserve logo aspect ratio and original colors.`;
}

function brandColorInstruction(primary?: string, secondary?: string) {
  if (!primary && !secondary) {
    return "Brand color integration: derive accent and icon colors from the product's natural palette.";
  }
  if (primary && !secondary) {
    return `Brand color integration: primary accent color is ${primary}. Use it for the bottom bar, step number icons, and USP pill accents. Use a lighter/softer tint of ${primary} for secondary icon colors.`;
  }
  return `Brand color integration: primary accent color is ${primary}, secondary accent is ${secondary}. Use ${primary} for bottom bar and step number icons. Use ${secondary} for USP icons and mini-USP icons. Background tones blend both brand colors with the product's natural palette.`;
}

function colorPaletteFromBg(useCustomBg: boolean, bgPrompt?: string, bgColor?: string) {
  if (useCustomBg && bgPrompt) return bgPrompt;
  if (useCustomBg && bgColor) return `${bgColor} solid background`;
  return "natural tones derived from the product";
}

function settingFromBg(useCustomBg: boolean, bgPrompt?: string, bgColor?: string) {
  if (useCustomBg && bgPrompt) return bgPrompt;
  if (useCustomBg && bgColor) return `a clean ${bgColor} solid background scene`;
  return "an environment that complements the product";
}

function accentDefaults(primary?: string, secondary?: string) {
  return {
    accent_color: primary || "the product's dominant color",
    icon_color: secondary || (primary ? `a softer tint of ${primary}` : "the product's accent color"),
  };
}

// ----- AI auto-fill via Lovable AI Gateway -----

async function autoFillVariables(opts: {
  template: "usp" | "steps" | "describe";
  productImageUrl: string;
  language: string;
  platform: string;
}) {
  const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
  if (!ANTHROPIC_API_KEY) return null;

  const schemas: Record<string, any> = {
    usp: {
      name: "fill_usp",
      description: "Fill USP listing template variables based on the product image.",
      parameters: {
        type: "object",
        properties: {
          product_name: { type: "string" },
          setting: { type: "string", description: "Lifestyle setting where the product naturally fits" },
          lifestyle_props: { type: "string", description: "Comma-separated contextually appropriate props" },
          headline_usp: { type: "string", description: `Short bold headline in ${opts.language}` },
          subheadline_text: { type: "string", description: `Short supporting subheadline in ${opts.language}, refining the headline` },
          usp1_icon: { type: "string", description: "Single emoji" },
          usp1_text: { type: "string", description: `Short USP text in ${opts.language}` },
          usp2_icon: { type: "string" },
          usp2_text: { type: "string" },
          usp3_icon: { type: "string" },
          usp3_text: { type: "string" },
        },
        required: [
          "product_name", "setting", "lifestyle_props", "headline_usp", "subheadline_text",
          "usp1_icon", "usp1_text", "usp2_icon", "usp2_text", "usp3_icon", "usp3_text",
        ],
        additionalProperties: false,
      },
    },
    steps: {
      name: "fill_steps",
      description: "Fill step-by-step listing template variables based on the product image.",
      parameters: {
        type: "object",
        properties: {
          product_name: { type: "string" },
          headline_steps: { type: "string", description: `Headline in ${opts.language}` },
          step1_visual: { type: "string" },
          step1_text: { type: "string", description: `Instruction in ${opts.language}` },
          step2_visual: { type: "string" },
          step2_text: { type: "string" },
          step3_visual: { type: "string" },
          step3_text: { type: "string" },
          summary_bar_steps: { type: "string", description: `Summary tagline in ${opts.language}` },
          mini1_icon: { type: "string", description: "Single emoji" },
          mini1_text: { type: "string" },
          mini2_icon: { type: "string" },
          mini2_text: { type: "string" },
          mini3_icon: { type: "string" },
          mini3_text: { type: "string" },
        },
        required: [
          "product_name", "headline_steps",
          "step1_visual", "step1_text", "step2_visual", "step2_text", "step3_visual", "step3_text",
          "summary_bar_steps",
          "mini1_icon", "mini1_text", "mini2_icon", "mini2_text", "mini3_icon", "mini3_text",
        ],
        additionalProperties: false,
      },
    },
    describe: {
      name: "fill_describe",
      description: "Fill describe-yourself listing template product name based on the image.",
      parameters: {
        type: "object",
        properties: {
          product_name: { type: "string" },
        },
        required: ["product_name"],
        additionalProperties: false,
      },
    },
  };

  const tool = schemas[opts.template];
  const system =
    "You are an ecommerce copywriter. Look at the product image and fill the requested variables. " +
    `All user-facing copy MUST be written in ${opts.language}. Use one short emoji for icon fields. ` +
    "Keep texts punchy and marketplace-friendly. Never include hex codes in visible copy.";

  try {
    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1024,
      system,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: `Platform: ${opts.platform}. Fill the variables for the ${opts.template} listing template.` },
            { type: "image", source: { type: "url", url: opts.productImageUrl } },
          ],
        },
      ],
      tools: [{ name: tool.name, description: tool.description, input_schema: tool.parameters }],
      tool_choice: { type: "tool", name: tool.name },
    });

    const call = message.content.find((b: any) => b.type === "tool_use");
    if (!call?.input) return null;
    return call.input;
  } catch (e) {
    console.error("[AUTO-FILL] error", e);
    return null;
  }
}

// ----- Server -----

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FAL_API_KEY = Deno.env.get("FAL_API_KEY");
    if (!FAL_API_KEY) throw new Error("FAL_API_KEY is not configured");

    const body = await req.json();
    const action = body.action;

    // ----- STATUS -----
    if (action === "status" && body.requestId) {
      const requestId = body.requestId;
      const statusResp = await fetch(`${FAL_BASE_REQUEST_URL}/${requestId}/status`, {
        headers: { Authorization: `Key ${FAL_API_KEY}` },
      });
      const statusText = await statusResp.text();
      let statusData: any = {};
      try { statusData = JSON.parse(statusText); } catch { /* */ }
      console.log("[LISTING STATUS]", requestId, statusResp.status, statusData.status);

      if (statusResp.ok && statusData.status === "COMPLETED") {
        // Fetch result
        const resultResp = await fetch(`${FAL_BASE_REQUEST_URL}/${requestId}`, {
          headers: { Authorization: `Key ${FAL_API_KEY}` },
        });
        if (!resultResp.ok) {
          const errBody = await resultResp.text();
          console.error("[LISTING STATUS] result fetch failed", resultResp.status, errBody);
          return new Response(JSON.stringify({ status: "IN_PROGRESS" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const resultData = await resultResp.json();
        const images = resultData.images || resultData.data?.images || [];
        return new Response(
          JSON.stringify({ status: "COMPLETED", images }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(JSON.stringify(statusData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // ----- GENERATE -----
    if (action === "generate") {
      const {
        template = "usp", // 'usp' | 'steps' | 'describe'
        product_image_url,
        platform = "Amazon",
        aspect_ratio = "1:1",
        resolution = "1K",
        language = "English",
        display_mode = "product_only", // product_only | hand_only | with_model
        model_description,
        model_image_url,
        auto_model = false,
        auto_model_gender,
        use_custom_background = false,
        background_prompt,
        background_color,
        primary_brand_color,
        secondary_brand_color,
        logo_url,
        logo_position = "bottom-center",
        logo_size = 60,
        user_free_description,
        text_elements_summary, // string for describe template (headline/sub/features summary)
        headline_font = "modern sans-serif",
      } = body;

      if (!product_image_url) {
        return new Response(JSON.stringify({ error: "product_image_url required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Auto-fill template variables using Lovable AI
      const filled = await autoFillVariables({
        template,
        productImageUrl: product_image_url,
        language,
        platform,
      });

      const productName = filled?.product_name || "the product";
      const accents = accentDefaults(primary_brand_color, secondary_brand_color);
      const palette = colorPaletteFromBg(use_custom_background, background_prompt, background_color);
      const setting = settingFromBg(use_custom_background, background_prompt, background_color);
      const modelInstr = modelInstruction(
        display_mode,
        model_description,
        !!model_image_url,
        auto_model,
        auto_model_gender,
      );
      const logoInstr = logoInstruction({ provided: !!logo_url, position: logo_position, size: logo_size });
      const brandInstr = brandColorInstruction(primary_brand_color, secondary_brand_color);

      let prompt = "";
      const common = {
        platform,
        product_name: productName,
        setting,
        model_instruction: modelInstr,
        color_palette_description: palette,
        accent_color: accents.accent_color,
        icon_color: accents.icon_color,
        logo_instruction: logoInstr,
        brand_color_instruction: brandInstr,
        headline_font,
        language,
      };

      if (template === "usp") {
        prompt = buildUspPrompt({
          ...common,
          lifestyle_props: filled?.lifestyle_props || "props that match the product context",
          headline_usp: filled?.headline_usp || "",
          subheadline_text: filled?.subheadline_text || "",
          usp1_icon: filled?.usp1_icon || "✓",
          usp1_text: filled?.usp1_text || "",
          usp2_icon: filled?.usp2_icon || "✓",
          usp2_text: filled?.usp2_text || "",
          usp3_icon: filled?.usp3_icon || "✓",
          usp3_text: filled?.usp3_text || "",
        });
      } else if (template === "steps") {
        prompt = buildStepsPrompt({
          ...common,
          step1_visual: filled?.step1_visual || "the product being prepared",
          step1_text: filled?.step1_text || "",
          step2_visual: filled?.step2_visual || "the product being used",
          step2_text: filled?.step2_text || "",
          step3_visual: filled?.step3_visual || "the result of using the product",
          step3_text: filled?.step3_text || "",
          summary_bar_steps: filled?.summary_bar_steps || "",
          headline_steps: filled?.headline_steps || "",
          mini1_icon: filled?.mini1_icon || "✓",
          mini1_text: filled?.mini1_text || "",
          mini2_icon: filled?.mini2_icon || "✓",
          mini2_text: filled?.mini2_text || "",
          mini3_icon: filled?.mini3_icon || "✓",
          mini3_text: filled?.mini3_text || "",
        });
      } else {
        prompt = buildDescribePrompt({
          ...common,
          user_free_description: user_free_description || "Marketplace-ready listing photo with premium feel.",
          text_elements_instruction: text_elements_summary
            ? `Overlay these text elements (AI chooses positions): ${text_elements_summary}.`
            : "",
        });
      }

      const image_urls = [product_image_url];
      if (logo_url) image_urls.push(logo_url);
      if (display_mode === "with_model" && model_image_url) image_urls.push(model_image_url);

      console.log("[LISTING GEN] template=", template, "platform=", platform, "ratio=", aspect_ratio, "res=", resolution);
      console.log("[LISTING GEN] prompt:", prompt);

      const queueResp = await fetch(FAL_GENERATE_URL, {
        method: "POST",
        headers: {
          Authorization: `Key ${FAL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          image_urls,
          aspect_ratio,
          num_images: 2,
          output_format: "png",
          resolution,
        }),
      });

      const queueText = await queueResp.text();
      if (!queueResp.ok) {
        console.error("[LISTING GEN] fal error", queueResp.status, queueText);
        return new Response(
          JSON.stringify({ error: `FAL error ${queueResp.status}: ${queueText}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      let queueData: any = {};
      try { queueData = JSON.parse(queueText); } catch { /* */ }
      console.log("[LISTING GEN] queued", queueData);

      return new Response(
        JSON.stringify({
          status: "PROCESSING",
          request_id: queueData.request_id,
          status_url: queueData.status_url,
          response_url: queueData.response_url,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[LISTING] error", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});