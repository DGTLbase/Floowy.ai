import { supabase } from "@/integrations/supabase/client";

// Cache the logo image once per page load
let logoImgPromise: Promise<HTMLImageElement> | null = null;
const LOGO_URL =
  "https://fjzifykgvdsownlscgct.supabase.co/storage/v1/object/public/generated/watermark-assets/floowy-logo.png";

function loadLogo(): Promise<HTMLImageElement> {
  if (!logoImgPromise) {
    logoImgPromise = new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = LOGO_URL;
    });
  }
  return logoImgPromise;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * applyWatermarkClient — instant, in-browser tiled watermark.
 * Returns a blob: URL ready to display immediately. No edge call.
 */
export async function applyWatermarkClient(
  imageUrl: string,
): Promise<string | null> {
  try {
    const [src, logo] = await Promise.all([loadImage(imageUrl), loadLogo()]);
    const canvas = document.createElement("canvas");
    canvas.width = src.naturalWidth;
    canvas.height = src.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(src, 0, 0);

    const tileW = Math.max(80, Math.round(canvas.width / 10));
    const tileH = Math.round((logo.naturalHeight / logo.naturalWidth) * tileW);
    const stepX = Math.round(tileW * 0.9);
    const stepY = Math.round(tileH * 0.9);

    // White-tinted logo tile
    const tint = document.createElement("canvas");
    tint.width = tileW;
    tint.height = tileH;
    const tctx = tint.getContext("2d")!;
    tctx.drawImage(logo, 0, 0, tileW, tileH);
    tctx.globalCompositeOperation = "source-in";
    tctx.fillStyle = "#ffffff";
    tctx.fillRect(0, 0, tileW, tileH);

    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((-30 * Math.PI) / 180);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);

    const pad = Math.max(canvas.width, canvas.height);
    let row = 0;
    for (let y = -pad; y < canvas.height + pad; y += stepY) {
      const offX = row % 2 === 0 ? 0 : Math.round(stepX / 2);
      for (let x = -pad; x < canvas.width + pad; x += stepX) {
        ctx.drawImage(tint, x + offX, y);
      }
      row++;
    }
    ctx.restore();

    return await new Promise((resolve) => {
      canvas.toBlob(
        (blob) => resolve(blob ? URL.createObjectURL(blob) : null),
        "image/jpeg",
        0.85,
      );
    });
  } catch (e) {
    console.warn("[applyWatermarkClient] failed", e);
    return null;
  }
}

/**
 * applyWatermarkIfFree
 * Server-side watermarking via edge function (persisted URL).
 * For instant display use applyWatermarkClient first.
 */
export async function applyWatermarkIfFree(
  imageUrl: string,
  generationId?: string,
): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke("apply-watermark", {
      body: { image_url: imageUrl, generation_id: generationId },
    });
    if (error) return null;
    return (data?.watermarked_url as string) ?? null;
  } catch {
    return null;
  }
}

/**
 * applyWatermarksBatch — parallel server-side watermarking.
 */
export async function applyWatermarksBatch(
  imageUrls: string[],
  generationIds?: (string | undefined)[],
): Promise<string[]> {
  return Promise.all(
    imageUrls.map((url, i) =>
      applyWatermarkIfFree(url, generationIds?.[i]).then((w) => w ?? url),
    ),
  );
}