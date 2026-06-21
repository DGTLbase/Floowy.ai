import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { Image } from "https://deno.land/x/imagescript@1.2.17/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, admin-token, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Module-level cache for the logo bytes so we only fetch once per cold start
let cachedLogoBytes: Uint8Array | null = null;
async function getLogoBytes(): Promise<Uint8Array> {
  if (cachedLogoBytes) return cachedLogoBytes;
  const logoResp = await fetch(
    "https://fjzifykgvdsownlscgct.supabase.co/storage/v1/object/public/generated/watermark-assets/floowy-logo.png",
  );
  if (!logoResp.ok) throw new Error("Failed to load Floowy logo");
  cachedLogoBytes = new Uint8Array(await logoResp.arrayBuffer());
  return cachedLogoBytes;
}

/**
 * apply-watermark
 * Input: { image_url: string, generation_id?: string }
 * Output: { watermarked_url: string }
 *
 * Downloads source image, composites a tiled diagonal "FLOOWY" text watermark,
 * uploads PNG to the public `generated` bucket under `watermarked/...`,
 * and returns the public URL. If `generation_id` is provided, also persists
 * `watermarked_image_url` on the row (server-side, bypassing RLS).
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image_url, generation_id } = await req.json();
    if (!image_url || typeof image_url !== "string") {
      return new Response(JSON.stringify({ error: "image_url required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[apply-watermark] start", { image_url, generation_id });

    // 1. Fetch source image and load (cached) logo in parallel
    const [srcResp, logoBytes] = await Promise.all([
      fetch(image_url),
      getLogoBytes(),
    ]);
    if (!srcResp.ok) {
      throw new Error(`Failed to fetch source image: ${srcResp.status}`);
    }
    const srcBytes = new Uint8Array(await srcResp.arrayBuffer());
    const img = await Image.decode(srcBytes);
    const logo = await Image.decode(logoBytes);

    // Scale logo width relative to source image (smaller for denser tiling)
    const targetWidth = Math.max(80, Math.round(img.width / 10));
    const scale = targetWidth / logo.width;
    logo.resize(targetWidth, Math.round(logo.height * scale));

    // Recolor every visible pixel to white while keeping shape, then apply
    // ~35% global opacity for a translucent overlay.
    for (let i = 0; i < logo.bitmap.length; i += 4) {
      const a = logo.bitmap[i + 3];
      if (a > 0) {
        logo.bitmap[i] = 255;
        logo.bitmap[i + 1] = 255;
        logo.bitmap[i + 2] = 255;
        logo.bitmap[i + 3] = Math.round(a * 0.35);
      }
    }

    // 3. Pre-rotate the tile ONCE (huge perf win) at -30deg for diagonal look
    const tileFg = logo.rotate(-30);

    // 4. Tile densely across the image with diagonal staggered offset
    const stepX = Math.round(tileFg.width * 0.9);
    const stepY = Math.round(tileFg.height * 0.9);
    let row = 0;
    for (let y = -stepY; y < img.height + stepY; y += stepY) {
      const offsetX = (row % 2 === 0) ? 0 : Math.round(stepX / 2);
      for (let x = -stepX; x < img.width + stepX; x += stepX) {
        img.composite(tileFg, x + offsetX, y);
      }
      row++;
    }

    // 5. Encode result as JPEG (much faster + smaller than PNG)
    const outBytes = await img.encodeJPEG(85);

    // 5. Upload to Supabase storage
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const fileName = `watermarked/${
      generation_id ?? crypto.randomUUID()
    }-${Date.now()}.jpg`;

    const { error: uploadErr } = await supabase.storage
      .from("generated")
      .upload(fileName, outBytes, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (uploadErr) {
      console.error("[apply-watermark] upload error", uploadErr);
      throw new Error(`Upload failed: ${uploadErr.message}`);
    }

    const { data: pub } = supabase.storage
      .from("generated")
      .getPublicUrl(fileName);
    const watermarked_url = pub.publicUrl;

    // 6. Optionally persist on the generations row
    if (generation_id) {
      const { error: updErr } = await supabase
        .from("generations")
        .update({ watermarked_image_url: watermarked_url })
        .eq("id", generation_id);
      if (updErr) {
        console.warn(
          "[apply-watermark] failed to persist on generation row",
          updErr,
        );
      }
    }

    console.log("[apply-watermark] done", { watermarked_url });

    return new Response(JSON.stringify({ watermarked_url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[apply-watermark] error", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});