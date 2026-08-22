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
  const key = (Deno.env.get("GEMINI_API_KEY") || "").trim();
  if (!key) {
    throw new Error("GEMINI_API_KEY is not configured for the analysis provider.");
  }
  const model = (Deno.env.get("GEMINI_MODEL") || "gemini-2.5-flash").trim();
  const base = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  // Authenticate with the x-goog-api-key header — the correct method for a Google
  // AI Studio API key regardless of its prefix. (The old code only used ?key= for
  // keys starting with "AIza" and otherwise sent an OAuth Bearer token, which
  // Google rejected with 401 "Expected OAuth 2 access token".)
  const res = await fetch(base, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
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
  const geminiConfigured = !!Deno.env.get("GEMINI_API_KEY");
  const errors: string[] = [];

  // Gemini is the DEFAULT provider now: the Anthropic account's credit/rate limits
  // were failing every analysis (a credit-exhaustion error is a 400, not a 429, so
  // it never triggered a fallback and surfaced as a 500). Gemini runs first when
  // GEMINI_API_KEY is set; Claude is the fallback (or the primary if Gemini is
  // unset, preserving the old behaviour).
  if (geminiConfigured) {
    try {
      const result = await analyzeWithGemini({ system: opts.system, prompt: opts.prompt, schema: opts.schema });
      return { result, provider: "gemini" };
    } catch (gemErr: any) {
      errors.push(`gemini: ${gemErr?.message ?? gemErr}`);
      console.error("[ai-analyze] Gemini failed; falling back to Claude:", gemErr?.message ?? gemErr);
    }
  }

  try {
    const anthropic = new Anthropic({ apiKey: opts.anthropicKey, maxRetries: 5 });
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
  } catch (claudeErr: any) {
    errors.push(`claude[${claudeErr?.status ?? "?"}]: ${claudeErr?.message ?? claudeErr}`);
    // Preserve a rate-limit status so the caller can return a friendly 429; else
    // surface every provider's error together for diagnosis.
    const rl = claudeErr?.status === 429 || claudeErr?.status === 529 || claudeErr instanceof Anthropic.RateLimitError;
    const out: any = new Error(`All analysis providers failed — ${errors.join(" | ")}`);
    out.status = rl ? 429 : claudeErr?.status;
    throw out;
  }
}
