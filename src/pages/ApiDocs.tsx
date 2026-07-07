import { useState } from "react";
import { Image as ImageIcon, Shirt, Tag, Megaphone, Copy, Check, Terminal, KeyRound, Zap } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PageMeta from "@/components/PageMeta";

const BASE = "https://wjihknoszyjwmpotsnda.supabase.co/functions/v1/api-v1";

/* ---------------- data ---------------- */

interface ToolDoc {
  id: string;
  name: string;
  icon: typeof ImageIcon;
  tagline: string;
  params: Array<{ name: string; required: boolean; desc: string }>;
  example: Record<string, unknown>;
  tip: string;
}

const SHARED_PARAMS = [
  { name: "prompt", required: true, desc: "What to generate — scene, style, setting." },
  { name: "aspect_ratio", required: false, desc: '"1:1" (default), "4:5", "9:16", "16:9".' },
  { name: "resolution", required: false, desc: '"1K" (default) or "2K".' },
];

const TOOLS: ToolDoc[] = [
  {
    id: "ambience", name: "Ambience", icon: ImageIcon,
    tagline: "Place a product in a photorealistic scene or background.",
    params: [
      { name: "image_url", required: true, desc: "Public URL of the product photo." },
      { name: "image_urls", required: false, desc: "Alternative: [product, scene reference] (max 2)." },
      ...SHARED_PARAMS,
    ],
    example: { tool: "ambience", prompt: "product on a marble kitchen counter, soft morning light, shallow depth of field", image_url: "https://your-cdn.com/product.png", aspect_ratio: "1:1" },
    tip: "Describe the setting, lighting and mood — the product itself is preserved from your image.",
  },
  {
    id: "fashion", name: "Fashion", icon: Shirt,
    tagline: "Put clothing on a realistic model — on-model photography without a shoot.",
    params: [
      { name: "image_urls", required: true, desc: "[garment] or [model photo, garment] (max 3)." },
      ...SHARED_PARAMS,
    ],
    example: { tool: "fashion", prompt: "female model wearing this dress, editorial studio lighting, neutral backdrop, full body", image_urls: ["https://your-cdn.com/model.jpg", "https://your-cdn.com/dress.png"], aspect_ratio: "4:5" },
    tip: "Pass a model photo first to keep the same model across your catalog; describe pose and framing.",
  },
  {
    id: "listing", name: "Listing", icon: Tag,
    tagline: "Marketplace-ready images — packshots & lifestyle shots for Amazon, Bol & eBay.",
    params: [
      { name: "image_url", required: true, desc: "Public URL of the product photo." },
      { name: "image_urls", required: false, desc: "Alternative: [product, style reference] (max 2)." },
      ...SHARED_PARAMS,
    ],
    example: { tool: "listing", prompt: "clean white background packshot, soft studio shadow, centered composition", image_url: "https://your-cdn.com/product.png" },
    tip: 'Say "pure white background" for packshots; describe the room/context for lifestyle shots.',
  },
  {
    id: "ads", name: "Ads", icon: Megaphone,
    tagline: "Scroll-stopping ad creatives for Meta, TikTok and Google campaigns.",
    params: [
      { name: "image_url", required: true, desc: "Public URL of the product photo." },
      { name: "image_urls", required: false, desc: "Alternative: [product, brand reference] (max 2)." },
      ...SHARED_PARAMS,
    ],
    example: { tool: "ads", prompt: "bold ad creative, vibrant gradient background, product hero angle, space for headline top-left", image_url: "https://your-cdn.com/product.png", aspect_ratio: "9:16" },
    tip: "Mention where to leave space for ad copy, and match aspect_ratio to the placement (9:16 for Reels).",
  },
];

const NAV = [
  { id: "overview", label: "Overview" },
  { id: "authentication", label: "Authentication" },
  { id: "quickstart", label: "Quickstart" },
  ...TOOLS.map((t) => ({ id: t.id, label: t.name })),
  { id: "errors", label: "Errors" },
];

/* ---------------- primitives ---------------- */

const CodeBlock = ({ code, label = "cURL" }: { code: string; label?: string }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  return (
    <div className="not-prose overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2">
        <span className="flex items-center gap-2 text-xs font-medium text-slate-400">
          <Terminal className="h-3.5 w-3.5" /> {label}
        </span>
        <button onClick={copy} className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-slate-400 transition hover:bg-slate-800 hover:text-slate-200">
          {copied ? <><Check className="h-3.5 w-3.5 text-emerald-400" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-xs leading-relaxed text-slate-200"><code>{code}</code></pre>
    </div>
  );
};

const Method = ({ children }: { children: string }) => (
  <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-primary">{children}</span>
);

const curlFor = (example: Record<string, unknown>) =>
  `curl -X POST ${BASE} \\
  -H "Authorization: Bearer flw_live_..." \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(example, null, 2)}'`;

/* ---------------- page ---------------- */

const ApiDocs = () => (
  <div className="min-h-screen bg-background">
    <PageMeta
      title="Floowy API Documentation"
      description="Integrate Floowy's AI tools — ambience, fashion, listing and ad creatives — into your own app. Per-request pricing with prepaid credits."
      canonicalUrl="https://floowy.ai/api-docs"
    />
    <Navigation />

    {/* Hero */}
    <section className="border-b border-border bg-gradient-to-b from-primary/5 to-transparent px-4 pt-10 pb-12">
      <div className="container mx-auto max-w-5xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
          <Zap className="h-3.5 w-3.5" /> Developer API
        </div>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground md:text-5xl">Floowy API</h1>
        <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
          Generate on-brand product visuals from your own app. One REST endpoint, four tools, per-request billing
          against prepaid credits. Available on Professional &amp; Enterprise plans.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href="#quickstart" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:brightness-110">Quickstart</a>
          <a href="/settings" className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted">Get an API key</a>
        </div>
      </div>
    </section>

    {/* Body: sidebar + content */}
    <div className="container mx-auto max-w-5xl px-4 py-12">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[200px_1fr]">
        {/* Sidebar */}
        <aside className="hidden lg:block">
          <nav className="sticky top-24 space-y-1">
            <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">On this page</p>
            {NAV.map((n) => (
              <a key={n.id} href={`#${n.id}`} className="block rounded-md px-3 py-1.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground">{n.label}</a>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="min-w-0 space-y-16">
          {/* Overview */}
          <section id="overview" className="scroll-mt-24">
            <h2 className="text-2xl font-bold text-foreground">Overview</h2>
            <p className="mt-2 text-muted-foreground">
              Every generation spends <strong className="text-foreground">1 prepaid credit</strong> at your agreed
              per-credit rate. Requests are asynchronous: you submit a job, then poll for the result. Polling and
              balance checks are free.
            </p>
            <div className="mt-4 rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
              <strong className="text-foreground">Images: public links or local files.</strong> Every image parameter
              accepts either a public URL (<code className="text-foreground">image_url</code> /{" "}
              <code className="text-foreground">image_urls</code>) or a base64-encoded local file
              (<code className="text-foreground">image_base64</code> /{" "}
              <code className="text-foreground">images_base64</code>, with or without a{" "}
              <code className="text-foreground">data:</code> prefix). You no longer need to host images publicly first.
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {TOOLS.map((t) => (
                <a key={t.id} href={`#${t.id}`} className="group rounded-xl border border-border p-4 transition hover:border-primary hover:shadow-sm">
                  <t.icon className="h-5 w-5 text-primary" />
                  <div className="mt-2 text-sm font-semibold text-foreground">{t.name}</div>
                  <div className="text-xs text-muted-foreground">Studio</div>
                </a>
              ))}
            </div>
          </section>

          {/* Authentication */}
          <section id="authentication" className="scroll-mt-24">
            <h2 className="flex items-center gap-2 text-2xl font-bold text-foreground"><KeyRound className="h-5 w-5 text-primary" /> Authentication</h2>
            <p className="mt-2 text-muted-foreground">
              Create a key in <strong className="text-foreground">Settings → API Access</strong> (or ask your account
              manager). Send it as a Bearer token — it's shown once at creation, so store it securely.
            </p>
            <div className="mt-4"><CodeBlock label="Header" code={`Authorization: Bearer flw_live_xxxxxxxxxxxxxxxx`} /></div>
          </section>

          {/* Quickstart */}
          <section id="quickstart" className="scroll-mt-24">
            <h2 className="text-2xl font-bold text-foreground">Quickstart</h2>
            <p className="mt-2 text-muted-foreground">The full loop is three calls to one endpoint.</p>

            <div className="mt-5 space-y-5">
              <div>
                <div className="mb-2 flex items-center gap-2"><Method>post</Method><span className="text-sm font-semibold text-foreground">Submit a generation</span><span className="text-xs text-muted-foreground">— charges 1 credit</span></div>
                <CodeBlock code={curlFor({ tool: "ambience", prompt: "product on a marble counter, soft morning light", image_url: "https://your-cdn.com/product.png" })} />
                <p className="mt-2 text-xs text-muted-foreground">→ <code className="rounded bg-muted px-1 py-0.5">{`{ "request_id": "abc", "status": "queued", "credits_remaining": 149 }`}</code></p>
              </div>
              <div>
                <div className="mb-2 flex items-center gap-2"><Method>post</Method><span className="text-sm font-semibold text-foreground">Poll for the result</span><span className="text-xs text-muted-foreground">— free</span></div>
                <CodeBlock code={`curl -X POST ${BASE} \\
  -H "Authorization: Bearer flw_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{ "action": "status", "request_id": "abc" }'`} />
                <p className="mt-2 text-xs text-muted-foreground">→ <code className="rounded bg-muted px-1 py-0.5">{`{ "status": "completed", "images": [{ "url": "https://..." }] }`}</code></p>
              </div>
              <div>
                <div className="mb-2 flex items-center gap-2"><Method>post</Method><span className="text-sm font-semibold text-foreground">Check your balance</span><span className="text-xs text-muted-foreground">— free</span></div>
                <CodeBlock code={`curl -X POST ${BASE} \\
  -H "Authorization: Bearer flw_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{ "action": "balance" }'`} />
              </div>
            </div>
          </section>

          {/* Per-tool guides */}
          {TOOLS.map((t) => (
            <section key={t.id} id={t.id} className="scroll-mt-24">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10"><t.icon className="h-5 w-5 text-primary" /></div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">{t.name} Studio</h2>
                  <p className="text-sm text-muted-foreground">{t.tagline}</p>
                </div>
              </div>

              <div className="mt-4 overflow-hidden rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                    <tr><th className="p-3 font-medium">Parameter</th><th className="p-3 font-medium">Required</th><th className="p-3 font-medium">Description</th></tr>
                  </thead>
                  <tbody>
                    {t.params.map((p) => (
                      <tr key={p.name} className="border-t border-border">
                        <td className="p-3"><code className="rounded bg-muted px-1.5 py-0.5 text-xs text-foreground">{p.name}</code></td>
                        <td className="p-3 text-xs">{p.required ? <span className="font-medium text-primary">required</span> : <span className="text-muted-foreground">optional</span>}</td>
                        <td className="p-3 text-xs text-muted-foreground">{p.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4"><CodeBlock code={curlFor(t.example)} /></div>

              <div className="mt-3 flex gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-foreground">
                <Zap className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span><strong>Tip:</strong> {t.tip}</span>
              </div>
            </section>
          ))}

          {/* Errors */}
          <section id="errors" className="scroll-mt-24">
            <h2 className="text-2xl font-bold text-foreground">Errors</h2>
            <div className="mt-4 overflow-hidden rounded-xl border border-border">
              <table className="w-full text-sm">
                <tbody>
                  {[
                    ["400", "Missing/invalid parameters, or unknown tool"],
                    ["401", "Invalid or revoked key"],
                    ["402", "Out of credits — top up to continue"],
                    ["403", "Plan not eligible, or tool not enabled on this key"],
                    ["502", "Generation failed downstream"],
                  ].map(([code, desc]) => (
                    <tr key={code} className="border-t border-border first:border-t-0">
                      <td className="p-3"><span className="rounded-md bg-destructive/10 px-2 py-0.5 font-mono text-xs font-bold text-destructive">{code}</span></td>
                      <td className="p-3 text-sm text-muted-foreground">{desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              Video tools (product video, fashion video) are coming to the API next. Contact your account manager to
              adjust which tools are enabled on your key.
            </p>
          </section>
        </main>
      </div>
    </div>

    <Footer />
  </div>
);

export default ApiDocs;
