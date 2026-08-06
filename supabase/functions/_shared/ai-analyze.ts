// Shared structured-analysis helper for the social scraper.
//
// Primary path: Claude (Haiku 4.5) with a forced tool call so the result is
// guaranteed-valid structured JSON. The Anthropic SDK already retries 429/500/529
// with exponential backoff + Retry-After (maxRetries below). If Claude is STILL
// rate-limited / overloaded after those retries, we fall back to Google Gemini
// (same schema, via responseSchema) so comment- and video-analysis keep working
// during Anthropic capacity crunches instead of surfacing a "busy" error.
//
// Requires ANTHROPIC_API_KEY. Gemini fallback additionally requires GEMINI_API_KEY
// (optionally GEMINI_MODEL, default gemini-2.5-flash). If GEMINI_API_KEY is unset,
// a rate-limit simply propagates as before — the fallback is best-effort.

import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.69.0";

export type Provider = "claude" | "gemini";

// Convert a JSON-schema-ish object into Gemini's responseSchema shape: Gemini
// expects UPPERCASE type names and a restricted field set (type/description/enum/
// properties/required/items). Recurses through objects and arrays.
function toGeminiSchema(s: any): any {
  if (!s || typeof s !== "object") return s;
  const out: any = {};
  if (s.type) out.type = String(s.type).toUpperCase();
  if (s.description) out.description = s.description;
  if (s.enum) out.enum = s.enum;
  if (s.properties) {
    out.properties = {};
    for (const [k, v] of Object.entries(s.properties)) out.properties[k] = toGeminiSchema(v);
    if (Array.isArray(s.required)) out.required = s.required;
  }
  if (s.items) out.items = toGeminiSchema(s.items);
  return out;
}

async function analyzeWithGemini(opts: { system: string; prompt: string; schema: any }): Promise<any> {
  const key = Deno.env.get("GEMINI_API_KEY");
  if (!key) {
    throw new Error("Claude is rate-limited and no GEMINI_API_KEY is configured for fallback.");
  }
  const model = Deno.env.get("GEMINI_MODEL") || "gemini-2.5-flash";
  const base = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  // Standard Gemini API keys look like "AIza..." and go in the ?key= query param.
  // Anything else (e.g. an OAuth access token) is sent as a bearer token instead.
  const isApiKey = key.startsWith("AIza");
  const url = isApiKey ? `${base}?key=${encodeURIComponent(key)}` : base;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (!isApiKey) headers["Authorization"] = `Bearer ${key}`;

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: opts.system }] },
      contents: [{ role: "user", parts: [{ text: opts.prompt }] }],
      generationConfig: {
        temperature: 0.4,
        responseMimeType: "application/json",
        responseSchema: toGeminiSchema(opts.schema),
      },
    }),
  });
  if (!res.ok) {
    throw new Error(`Gemini fallback failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
  }
  const j = await res.json();
  const text: string =
    j?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text ?? "").join("") ?? "";
  if (!text.trim()) throw new Error("Gemini returned no content");
  try {
    return JSON.parse(text);
  } catch {
    // Very rarely the model wraps JSON in prose/fences despite responseMimeType.
    const m = text.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
    throw new Error("Gemini returned non-JSON output");
  }
}

/**
 * Produce a structured analysis. Tries Claude first; on a rate-limit / overload
 * that survives the SDK's own retries, falls back to Gemini with the same schema.
 * Returns the parsed object and which provider produced it.
 */
export async function analyzeStructured(opts: {
  anthropicKey: string;
  system: string;
  prompt: string;
  schema: any;
  toolName: string;
  toolDescription?: string;
  maxTokens?: number;
}): Promise<{ result: any; provider: Provider }> {
  const anthropic = new Anthropic({ apiKey: opts.anthropicKey, maxRetries: 5 });
  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: opts.maxTokens ?? 1024,
      system: opts.system,
      messages: [{ role: "user", content: opts.prompt }],
      tools: [{
        name: opts.toolName,
        description: opts.toolDescription ?? "Report the structured analysis.",
        input_schema: opts.schema,
      }],
      tool_choice: { type: "tool", name: opts.toolName },
    });
    const toolUse = message.content.find((b: any) => b.type === "tool_use");
    if (!toolUse?.input) throw new Error("Claude returned no structured result");
    return { result: toolUse.input, provider: "claude" };
  } catch (err: any) {
    const rateLimited =
      err?.status === 429 || err?.status === 529 || err instanceof Anthropic.RateLimitError;
    if (!rateLimited) throw err;
    // Anthropic still busy after retries → hand off to Gemini.
    console.log("[ai-analyze] Claude rate-limited; falling back to Gemini");
    const result = await analyzeWithGemini({ system: opts.system, prompt: opts.prompt, schema: opts.schema });
    return { result, provider: "gemini" };
  }
}
