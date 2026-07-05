import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PageMeta from "@/components/PageMeta";

const BASE = "https://wjihknoszyjwmpotsnda.supabase.co/functions/v1/api-v1";

interface ToolDoc {
  id: string;
  name: string;
  tagline: string;
  params: Array<{ name: string; required: boolean; desc: string }>;
  example: Record<string, unknown>;
  tip: string;
}

const SHARED_PARAMS: Array<{ name: string; required: boolean; desc: string }> = [
  { name: "prompt", required: true, desc: "What to generate — scene, style, setting." },
  { name: "aspect_ratio", required: false, desc: '"1:1" (default), "4:5", "9:16", "16:9".' },
  { name: "resolution", required: false, desc: '"1K" (default) or "2K".' },
];

const TOOLS: ToolDoc[] = [
  {
    id: "ambience",
    name: "Ambience Studio",
    tagline: "Place a product in a photorealistic scene or background.",
    params: [
      { name: "image_url", required: true, desc: "Public URL of the product photo." },
      { name: "image_urls", required: false, desc: "Alternative: [product, scene reference] (max 2)." },
      ...SHARED_PARAMS,
    ],
    example: {
      tool: "ambience",
      prompt: "product on a marble kitchen counter, soft morning light, shallow depth of field",
      image_url: "https://your-cdn.com/product.png",
      aspect_ratio: "1:1",
    },
    tip: "Describe the setting, lighting and mood — the product itself is preserved from your image.",
  },
  {
    id: "fashion",
    name: "Fashion Studio",
    tagline: "Put clothing on a realistic model — on-model photography without a photoshoot.",
    params: [
      { name: "image_urls", required: true, desc: "[garment photo] or [model photo, garment photo] (max 3)." },
      ...SHARED_PARAMS,
    ],
    example: {
      tool: "fashion",
      prompt: "female model wearing this dress, studio editorial lighting, neutral backdrop, full body",
      image_urls: ["https://your-cdn.com/model.jpg", "https://your-cdn.com/dress.png"],
      aspect_ratio: "4:5",
    },
    tip: "Pass a model photo first to keep the same model across your catalog; describe pose and framing in the prompt.",
  },
  {
    id: "listing",
    name: "Listing Studio",
    tagline: "Marketplace-ready listing images — clean packshots and lifestyle shots for Amazon, Bol & eBay.",
    params: [
      { name: "image_url", required: true, desc: "Public URL of the product photo." },
      { name: "image_urls", required: false, desc: "Alternative: [product, style reference] (max 2)." },
      ...SHARED_PARAMS,
    ],
    example: {
      tool: "listing",
      prompt: "clean white background packshot, soft studio shadow, centered composition, ecommerce listing",
      image_url: "https://your-cdn.com/product.png",
    },
    tip: 'For white-background packshots say "pure white background"; for lifestyle shots describe the room/context.',
  },
  {
    id: "ads",
    name: "Ads Studio",
    tagline: "Scroll-stopping ad creatives for Meta, TikTok and Google campaigns.",
    params: [
      { name: "image_url", required: true, desc: "Public URL of the product photo." },
      { name: "image_urls", required: false, desc: "Alternative: [product, brand reference] (max 2)." },
      ...SHARED_PARAMS,
    ],
    example: {
      tool: "ads",
      prompt: "bold ad creative, vibrant gradient background, product hero angle, space for headline top-left",
      image_url: "https://your-cdn.com/product.png",
      aspect_ratio: "9:16",
    },
    tip: "Mention where to leave negative space for your ad copy, and match aspect_ratio to the placement (9:16 for Reels/TikTok).",
  },
];

const curlFor = (example: Record<string, unknown>) =>
  `curl -X POST ${BASE} \\
  -H "Authorization: Bearer flw_live_..." \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(example, null, 2)}'`;

const Code = ({ children }: { children: string }) => (
  <pre className="overflow-x-auto rounded-lg border border-border bg-muted/40 p-4 text-xs leading-relaxed">
    <code>{children}</code>
  </pre>
);

const ApiDocs = () => (
  <div className="min-h-screen bg-background">
    <PageMeta
      title="Floowy API Documentation"
      description="Integrate Floowy's AI tools — ambience, fashion, listing and ad creatives — into your own app. Per-request pricing with prepaid credits."
      canonicalUrl="https://floowy.ai/api-docs"
    />
    <Navigation />
    <section className="px-4 pt-32 pb-20">
      <div className="container mx-auto max-w-3xl prose prose-lg">
        <h1 className="text-4xl font-bold text-foreground">Floowy API</h1>
        <p className="text-muted-foreground">
          Integrate Floowy's AI tools into your own product. Available on Professional and Enterprise plans.
          Every generation spends <strong>1 prepaid credit</strong> at your agreed per-credit rate.
        </p>

        {/* Tool index */}
        <div className="not-prose my-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {TOOLS.map((t) => (
            <a key={t.id} href={`#${t.id}`}
               className="rounded-lg border border-border p-3 text-center text-sm font-semibold text-foreground hover:border-primary hover:text-primary">
              {t.name.replace(" Studio", "")}
            </a>
          ))}
        </div>

        <h2 className="mt-10 text-2xl font-bold text-foreground">Authentication</h2>
        <p className="text-muted-foreground">
          Create a key in <strong>Settings → API Access</strong> (or ask your account manager). Send it as a Bearer
          token — it's shown once at creation, store it securely.
        </p>
        <Code>{`Authorization: Bearer flw_live_xxxxxxxxxxxxxxxx`}</Code>

        <h2 className="mt-10 text-2xl font-bold text-foreground">How every tool works</h2>
        <p className="text-muted-foreground">
          One endpoint, async queue: submit a generation (charges 1 credit, returns a <code>request_id</code>), then
          poll until complete. Polling and balance checks are free.
        </p>
        <Code>{`# 1) Submit  →  { "request_id": "...", "status": "queued", "credits_remaining": 149 }
POST ${BASE}   { "tool": "<tool>", "prompt": "...", "image_url": "..." }

# 2) Poll    →  { "status": "completed", "images": [{ "url": "https://..." }] }
POST ${BASE}   { "action": "status", "request_id": "..." }

# Balance   →  { "credits_remaining": 149 }
POST ${BASE}   { "action": "balance" }`}</Code>

        {/* Per-tool guides */}
        {TOOLS.map((t) => (
          <div key={t.id} id={t.id} className="mt-14 scroll-mt-24">
            <h2 className="text-2xl font-bold text-foreground">{t.name}</h2>
            <p className="text-muted-foreground">{t.tagline}</p>
            <div className="not-prose my-4 overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                  <tr><th className="p-2.5">Parameter</th><th className="p-2.5">Required</th><th className="p-2.5">Description</th></tr>
                </thead>
                <tbody>
                  {t.params.map((p) => (
                    <tr key={p.name} className="border-t border-border">
                      <td className="p-2.5"><code className="text-xs">{p.name}</code></td>
                      <td className="p-2.5 text-xs">{p.required ? "✅" : "—"}</td>
                      <td className="p-2.5 text-xs text-muted-foreground">{p.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Code>{curlFor(t.example)}</Code>
            <p className="text-sm text-muted-foreground"><strong>Tip:</strong> {t.tip}</p>
          </div>
        ))}

        <h2 className="mt-14 text-2xl font-bold text-foreground">Errors</h2>
        <ul className="text-muted-foreground">
          <li><strong>400</strong> — missing/invalid parameters, or unknown tool</li>
          <li><strong>401</strong> — invalid or revoked key</li>
          <li><strong>402</strong> — out of credits (top up to continue)</li>
          <li><strong>403</strong> — plan no longer eligible, or tool not enabled on this key</li>
          <li><strong>502</strong> — generation failed downstream</li>
        </ul>

        <p className="mt-10 text-sm text-muted-foreground">
          Video tools (product video, fashion video) are coming to the API next. Contact your account manager to
          adjust which tools are enabled on your key.
        </p>
      </div>
    </section>
    <Footer />
  </div>
);

export default ApiDocs;
