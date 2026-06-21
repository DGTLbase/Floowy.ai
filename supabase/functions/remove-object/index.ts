import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const FAL_API_KEY = Deno.env.get("FAL_API_KEY");
  if (!FAL_API_KEY) {
    return new Response(JSON.stringify({ error: "FAL_API_KEY not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { action, image_url, mask_url, requestId } = await req.json();

    if (action === "status" && requestId) {
      // Poll for status
      const statusRes = await fetch(
        `https://queue.fal.run/fal-ai/object-removal/requests/${requestId}/status`,
        { headers: { Authorization: `Key ${FAL_API_KEY}` } }
      );
      const statusData = await statusRes.json();

      if (statusData.status === "COMPLETED") {
        // Fetch result
        const resultRes = await fetch(
          `https://queue.fal.run/fal-ai/object-removal/requests/${requestId}`,
          { headers: { Authorization: `Key ${FAL_API_KEY}` } }
        );
        const resultData = await resultRes.json();
        return new Response(JSON.stringify({ status: "COMPLETED", ...resultData }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify(statusData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "generate" && image_url && mask_url) {
      // Queue the object removal
      const queueRes = await fetch("https://queue.fal.run/fal-ai/object-removal/mask", {
        method: "POST",
        headers: {
          Authorization: `Key ${FAL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image_url, mask_url }),
      });
      const queueData = await queueRes.json();

      return new Response(JSON.stringify(queueData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action or missing parameters" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Object removal error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
