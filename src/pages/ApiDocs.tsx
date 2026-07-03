import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PageMeta from "@/components/PageMeta";

const BASE = "https://wjihknoszyjwmpotsnda.supabase.co/functions/v1/api-v1";

const Code = ({ children }: { children: string }) => (
  <pre className="overflow-x-auto rounded-lg border border-border bg-muted/40 p-4 text-xs leading-relaxed">
    <code>{children}</code>
  </pre>
);

const ApiDocs = () => (
  <div className="min-h-screen bg-background">
    <PageMeta
      title="Floowy API Documentation"
      description="Integrate Floowy's AI content tools into your own app. Per-request pricing, prepaid credits, simple REST endpoints."
      canonicalUrl="https://floowy.ai/api-docs"
    />
    <Navigation />
    <section className="px-4 pt-32 pb-20">
      <div className="container mx-auto max-w-3xl prose prose-lg">
        <h1 className="text-4xl font-bold text-foreground">Floowy API</h1>
        <p className="text-muted-foreground">
          Integrate Floowy's AI tools into your own product. Available on Professional and Enterprise
          plans. Each generation spends prepaid credits at your agreed per-credit rate.
        </p>

        <h2 className="mt-10 text-2xl font-bold text-foreground">Authentication</h2>
        <p className="text-muted-foreground">
          Create a key in <strong>Settings → API Access</strong> (or ask your account manager). Send it as a
          Bearer token. Your key is shown once — store it securely.
        </p>
        <Code>{`Authorization: Bearer flw_live_xxxxxxxxxxxxxxxx`}</Code>

        <h2 className="mt-10 text-2xl font-bold text-foreground">Generate an image</h2>
        <p className="text-muted-foreground">
          Charges <strong>1 credit</strong> and returns a <code>request_id</code>. Returns HTTP 402 if you're out
          of credits.
        </p>
        <Code>{`curl -X POST ${BASE} \\
  -H "Authorization: Bearer flw_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "tool": "ambience",
    "prompt": "product on a marble kitchen counter, soft morning light",
    "image_url": "https://your-cdn.com/product.png",
    "aspect_ratio": "1:1",
    "resolution": "1K"
  }'

# → { "request_id": "abc123", "status": "queued", "credits_remaining": 149 }`}</Code>

        <h2 className="mt-10 text-2xl font-bold text-foreground">Poll for the result</h2>
        <p className="text-muted-foreground">Free. Poll until <code>status</code> is <code>completed</code>.</p>
        <Code>{`curl -X POST ${BASE} \\
  -H "Authorization: Bearer flw_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{ "action": "status", "request_id": "abc123" }'

# → { "status": "completed", "images": [{ "url": "https://..." }] }`}</Code>

        <h2 className="mt-10 text-2xl font-bold text-foreground">Check your balance</h2>
        <Code>{`curl -X POST ${BASE} \\
  -H "Authorization: Bearer flw_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{ "action": "balance" }'

# → { "credits_remaining": 149 }`}</Code>

        <h2 className="mt-10 text-2xl font-bold text-foreground">Errors</h2>
        <ul className="text-muted-foreground">
          <li><strong>401</strong> — invalid or revoked key</li>
          <li><strong>402</strong> — out of credits (top up to continue)</li>
          <li><strong>403</strong> — plan no longer eligible (Professional/Enterprise required)</li>
          <li><strong>502</strong> — generation failed downstream</li>
        </ul>

        <p className="mt-10 text-sm text-muted-foreground">
          More tools (fashion, listing, video) are being added. Contact your account manager to enable them on
          your key.
        </p>
      </div>
    </section>
    <Footer />
  </div>
);

export default ApiDocs;
