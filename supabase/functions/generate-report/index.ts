// Report generation (Scraper Report Briefing v1).
// After a scrape, turns the scrape data into a Floowy-styled PDF via the Claude
// API using one of two fixed custom Agent Skills (Insights Report / Contentplan).
//
// Flow (all validation happens BEFORE any credit is charged):
//   auth → report-type valid → tier gate → form valid (brand + url) →
//   load project + scrape data (reject empty) → idempotency check →
//   bundle-window price → balance check (402) → insert 'processing' row →
//   generate PDF (Claude Skills + code execution, or a stub) → upload to storage
//   → deduct credits (ONLY now, on success) → record in generations → mark
//   'completed'. Any failure marks the row 'failed' and charges nothing, which
//   satisfies the briefing's "auto-refund on failure" by never charging early.
//
// The live Claude call is behind a flag: it runs only when ANTHROPIC_API_KEY and
// the skill id are present and REPORTS_STUB !== "1". Otherwise a stub PDF is
// produced so the whole flow (gating, credits, bundle window, storage, download,
// My Generations) is testable without Anthropic credits.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getUserTier, isAdmin } from "../_shared/tier.ts";
import {
  REPORTS,
  isReportType,
  isReportLanguage,
  canRunReport,
  reportPrice,
  DEFAULT_REPORT_LANGUAGE,
  REPORT_LANGUAGE_NAMES,
  type ReportType,
} from "../_shared/report-config.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const STORAGE_BUCKET = "generated";
// Report PDFs are served under the app's own domain via a Vercel proxy rewrite
// (/r/<object-path> → the Supabase public storage object), so the storage host
// isn't exposed and downloads are same-origin. Override with REPORT_PUBLIC_BASE.
const PUBLIC_PDF_BASE = Deno.env.get("REPORT_PUBLIC_BASE") || "https://floowy.ai/r";
// Sonnet 5 rather than Opus 4.8: same job at $3/$15 per MTok instead of $5/$25
// (and $2/$10 under the introductory rate through 2026-08-31). See the request
// body below — Sonnet 5 changes the thinking default, so that is set explicitly.
const CLAUDE_MODEL = "claude-sonnet-5";
const ANTHROPIC_VERSION = "2023-06-01";
// Cap the scrape JSON we send to the model. The skill only needs a representative
// sample to find patterns; sending 200 full rows makes the render take minutes.
// We cap the item count AND strip each item to high-signal fields.
const MAX_ITEMS_TO_MODEL = 45;
const MAX_JSON_CHARS = 110_000;

// High-signal fields kept per scraped item (union across the platform tables).
// Everything else (raw provider blobs, thumbnails, ids, author metadata) is
// dropped to cut tokens and speed up analysis.
const KEEP_FIELDS = [
  "title", "caption", "description", "text", "ad_text", "headline", "hashtags",
  "plays", "views", "play_count", "likes", "like_count", "comments_count",
  "comment_count", "shares", "share_count", "reactions_count", "impressions",
  "video_analysis", "ad_analysis", "comments_analysis", "comment_analysis",
  "posted_at", "author", "username", "page_name",
];
const trimItem = (it: Record<string, unknown>): Record<string, unknown> => {
  const o: Record<string, unknown> = {};
  for (const k of KEEP_FIELDS) if (it[k] != null) o[k] = it[k];
  return o;
};

/* ── Scrape source mapping (project.platform + source_type → table + label) ── */
function tableFor(platform: string, sourceType: string): string | null {
  if (platform === "meta_ads") return "meta_ads";
  if (platform === "tiktok") return sourceType === "ad" ? "ads" : "videos";
  if (platform === "instagram") return "instagram_posts";
  if (platform === "facebook") return "facebook_posts";
  return null;
}
function sourceLabel(platform: string, sourceType: string): string {
  switch (platform) {
    case "tiktok": return sourceType === "ad" ? "TikTok Ads" : "TikTok";
    case "instagram": return "Instagram";
    case "facebook": return "Facebook";
    case "meta_ads": return "Meta Ads Library";
    default: return platform;
  }
}

/* ── Minimal valid PDF (stub path) ───────────────────────────────────────────
   Builds a single-page A4 PDF with a few lines of text and a correct xref so any
   viewer opens it. Only used when the live Claude call is disabled. */
function makeStubPdf(title: string, lines: string[]): Uint8Array {
  const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  const body: string[] = ["BT", "/F1 22 Tf", "72 780 Td", `(${esc(title)}) Tj`, "/F1 12 Tf"];
  let y = 748;
  for (const ln of lines) {
    body.push(`1 0 0 1 72 ${y} Tm`, `(${esc(ln)}) Tj`);
    y -= 20;
  }
  body.push("ET");
  const content = body.join("\n");

  const objs = [
    "<</Type/Catalog/Pages 2 0 R>>",
    "<</Type/Pages/Kids[3 0 R]/Count 1>>",
    "<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>",
    "<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>",
    `<</Length ${content.length}>>\nstream\n${content}\nendstream`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objs.forEach((o, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) pdf += `${String(off).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer\n<</Size ${objs.length + 1}/Root 1 0 R>>\nstartxref\n${xrefStart}\n%%EOF`;
  return new TextEncoder().encode(pdf);
}

/* ── Live Claude path: run the skill in the code-execution container, get PDF ── */
async function generateWithClaude(opts: {
  apiKey: string;
  skillId: string;
  reportLabel: string;
  skillName: string;
  brand: string;
  website: string;
  sourceLabel: string;
  scrapeJson: string;
  /** Report language code (validated against REPORT_LANGUAGE_CODES). */
  language: string;
}): Promise<{ bytes: Uint8Array; messageId: string | null }> {
  // files-api beta is REQUIRED for created files to be returned as file_ids.
  const betaHeader = "code-execution-2025-08-25,skills-2025-10-02,files-api-2025-04-14";
  const languageName = REPORT_LANGUAGE_NAMES[opts.language] ?? opts.language;
  const userText =
    `Generate the "${opts.reportLabel}" as a PDF using the ${opts.skillName} skill, ` +
    `following Route B (the Floowy.ai product feature): no interactive intake, always Floowy ` +
    `house style (house="floowy"), output format PDF.\n` +
    `Brand / company name: ${opts.brand}\n` +
    `Website URL: ${opts.website}\n` +
    // The skill treats `language` as a form field and writes EVERYTHING the
    // reader sees in it (headings, fixed sentences, page chrome, filename) —
    // it must never infer the language from the scrape data.
    `language: ${opts.language} (${languageName})\n` +
    `Scrape source: ${opts.sourceLabel}\n\n` +
    `Write the entire report in ${languageName}, and pass lang="${opts.language}" to both ` +
    `cover_html_floowy() and render().\n\n` +
    `Analyze the following scrape data (JSON) and produce the report. IMPORTANT for this ` +
    `environment: save the final PDF to the current working directory (e.g. ./report.pdf), NOT ` +
    `to /mnt/user-data/outputs, so it is returned as a downloadable file.\n\n` +
    "```json\n" + opts.scrapeJson + "\n```";

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": opts.apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
      "anthropic-beta": betaHeader,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      // Sonnet 5 shares max_tokens between thinking and the visible response,
      // and thinking is ON unless disabled — so this is higher than the 16k that
      // sufficed on Opus 4.8 (where omitting `thinking` meant no thinking).
      max_tokens: 24000,
      // Explicit rather than omitted: on Sonnet 5 an omitted `thinking` field
      // already means adaptive, so leaving it out would silently enable thinking
      // on a call that never had it. Kept ON deliberately — this run only
      // succeeds if the model actually calls code_execution, and Sonnet 5
      // reaches for tools noticeably less with thinking disabled.
      thinking: { type: "adaptive" },
      // The cost lever. Sonnet 5 defaults to `high`; `medium` is the step down
      // that keeps quality while cutting thinking tokens.
      output_config: { effort: "medium" },
      container: { skills: [{ type: "custom", skill_id: opts.skillId, version: "latest" }] },
      tools: [{ type: "code_execution_20260521", name: "code_execution" }],
      messages: [{ role: "user", content: userText }],
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Anthropic messages error ${res.status}: ${JSON.stringify(data).slice(0, 400)}`);
  }

  // Collect every file_id referenced anywhere in the response content, then pick
  // the one whose filename ends in .pdf.
  const fileIds: string[] = [];
  const walk = (node: unknown) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) return node.forEach(walk);
    const o = node as Record<string, unknown>;
    if (typeof o.file_id === "string") fileIds.push(o.file_id);
    for (const v of Object.values(o)) walk(v);
  };
  walk(data.content);
  if (fileIds.length === 0) {
    throw new Error(`No output file produced by the skill. Response: ${JSON.stringify(data).slice(0, 400)}`);
  }

  let pdfId = fileIds[0];
  for (const id of fileIds) {
    try {
      const meta = await fetch(`https://api.anthropic.com/v1/files/${id}`, {
        headers: { "x-api-key": opts.apiKey, "anthropic-version": ANTHROPIC_VERSION, "anthropic-beta": "files-api-2025-04-14" },
      }).then((r) => r.json());
      if (typeof meta?.filename === "string" && meta.filename.toLowerCase().endsWith(".pdf")) { pdfId = id; break; }
    } catch { /* keep default */ }
  }

  const fileRes = await fetch(`https://api.anthropic.com/v1/files/${pdfId}/content`, {
    headers: { "x-api-key": opts.apiKey, "anthropic-version": ANTHROPIC_VERSION, "anthropic-beta": "files-api-2025-04-14" },
  });
  if (!fileRes.ok) throw new Error(`File download error ${fileRes.status}`);
  const bytes = new Uint8Array(await fileRes.arrayBuffer());
  return { bytes, messageId: typeof data.id === "string" ? data.id : null };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  let rowId: string | null = null;
  try {
    const body = await req.json().catch(() => ({}));
    const reportType = body.reportType as ReportType;
    const projectId = String(body.projectId ?? "");
    const brand = String(body.brandName ?? "").trim();
    const website = String(body.websiteUrl ?? "").trim();
    const idemKey: string | null = body.idempotencyKey ? String(body.idempotencyKey) : null;
    // The dropdown always sends a value; fall back rather than reject so an older
    // cached client build keeps working (it just gets today's Dutch default).
    const language = isReportLanguage(body.language) ? body.language : DEFAULT_REPORT_LANGUAGE;

    // Auth
    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData.user) return json({ error: "Unauthorized" }, 401);
    const user = userData.user;

    // 1) Report type valid
    if (!isReportType(reportType)) return json({ error: "Invalid report type." }, 400);
    const meta = REPORTS[reportType];

    // 2) Tier gate (admins bypass)
    const adminUser = await isAdmin(admin, user.id);
    const tier = await getUserTier(admin, user.id);
    if (!adminUser && !canRunReport(tier, reportType)) {
      return json(
        { error: `The ${meta.label} requires the ${meta.minTier} plan or higher.`, upgrade: true, requiredTier: meta.minTier },
        403,
      );
    }

    // 3) Form valid — both fields required before we go anywhere near a charge
    if (!brand) return json({ error: "Brand / company name is required." }, 400);
    if (!website) return json({ error: "Website URL is required." }, 400);

    // 4) Load the project (must exist and belong to the user)
    if (!projectId) return json({ error: "projectId is required." }, 400);
    const { data: project } = await admin
      .from("projects")
      .select("id, user_id, platform, source_type")
      .eq("id", projectId)
      .maybeSingle();
    if (!project || project.user_id !== user.id) return json({ error: "Project not found." }, 404);

    const platform = String(project.platform ?? "tiktok");
    const sourceType = String(project.source_type ?? "post");
    const table = tableFor(platform, sourceType);
    if (!table) return json({ error: "Unsupported scrape platform." }, 400);

    // 5) Load scrape data — reject empty/incomplete BEFORE any deduction
    const { data: items } = await admin
      .from(table)
      .select("*")
      .eq("project_id", projectId)
      .limit(MAX_ITEMS_TO_MODEL);
    if (!items || items.length === 0) {
      return json({ error: "No scrape data to build a report from. Run a scrape first." }, 400);
    }
    // Most recent scrape_run for provenance.
    const { data: lastRun } = await admin
      .from("scrape_runs")
      .select("id")
      .eq("project_id", projectId)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // 6) Idempotency — a double-submit reuses the existing row (never double-charges)
    if (idemKey) {
      const { data: existing } = await admin
        .from("report_generations")
        .select("*")
        .eq("user_id", user.id)
        .eq("idempotency_key", idemKey)
        .maybeSingle();
      if (existing) {
        if (existing.status === "completed") {
          return json({ status: "completed", id: existing.id, report_type: existing.report_type, pdf_url: existing.pdf_url, credits_charged: existing.credits_charged });
        }
        if (existing.status === "processing") return json({ status: "processing", id: existing.id }, 202);
        // failed → allow a retry by reusing the row
        await admin.from("report_generations").update({ status: "processing", error: null }).eq("id", existing.id);
        rowId = existing.id;
      }
    }

    // 7) Bundle-window price — the "first purchase" is the most recent COMPLETED
    //    report of the OTHER type for this user + project.
    const otherType: ReportType = reportType === "insights" ? "contentplan" : "insights";
    const { data: prior } = await admin
      .from("report_generations")
      .select("completed_at")
      .eq("user_id", user.id)
      .eq("project_id", projectId)
      .eq("report_type", otherType)
      .eq("status", "completed")
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const firstPurchasedAtMs = prior?.completed_at ? new Date(prior.completed_at).getTime() : null;
    const nowMs = Date.now();
    const price = reportPrice(tier, reportType, firstPurchasedAtMs, nowMs);
    const isBundlePrice = price < meta.credits;

    // 8) Balance check (admins are not charged)
    if (!adminUser) {
      const { data: creditRow } = await admin.from("credits").select("balance").eq("user_id", user.id).maybeSingle();
      if ((creditRow?.balance ?? 0) < price) {
        return json({ error: `Not enough credits — ${price} required.`, code: "insufficient_credits", required: price }, 402);
      }
    }

    // 9) Insert the processing row (unless we're reusing a failed one)
    if (!rowId) {
      const { data: inserted, error: insErr } = await admin
        .from("report_generations")
        .insert({
          user_id: user.id,
          report_type: reportType,
          status: "processing",
          project_id: projectId,
          scrape_run_id: lastRun?.id ?? null,
          scrape_source: platform,
          brand_name: brand,
          website_url: website,
          credits_charged: 0,
          is_bundle_price: isBundlePrice,
          idempotency_key: idemKey,
        })
        .select("id")
        .single();
      if (insErr) {
        // Likely a concurrent duplicate on the idempotency unique index.
        const { data: dup } = await admin
          .from("report_generations").select("id, status").eq("user_id", user.id).eq("idempotency_key", idemKey).maybeSingle();
        if (dup) return json({ status: dup.status, id: dup.id }, 202);
        throw new Error(`Could not create report record: ${insErr.message}`);
      }
      rowId = inserted.id;
    }

    // 10) Build the scrape JSON payload — strip each item to high-signal fields,
    //     then trim the count until it fits the char budget.
    const trimmed = items.map((it) => trimItem(it as Record<string, unknown>));
    let scrapeJson = JSON.stringify(trimmed);
    if (scrapeJson.length > MAX_JSON_CHARS) {
      let n = trimmed.length;
      while (n > 5 && JSON.stringify(trimmed.slice(0, n)).length > MAX_JSON_CHARS) n = Math.floor(n / 2);
      scrapeJson = JSON.stringify(trimmed.slice(0, n));
    }

    // 11) Run the heavy work (Claude Skills render + upload + charge) in the
    //     BACKGROUND so the browser gets an immediate 202 and the HTTP response
    //     isn't tied to the ~60-90s render. The client polls report_generations
    //     for the row's final status. Credits are charged only on success, so a
    //     failed background run charges nothing.
    const capturedRowId = rowId;
    const runGeneration = async () => {
      try {
        const apiKey = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
        const skillId = Deno.env.get(meta.skillIdEnv) ?? "";
        const stub = Deno.env.get("REPORTS_STUB") === "1" || !apiKey || !skillId;

        let pdfBytes: Uint8Array;
        let claudeMessageId: string | null = null;
        if (stub) {
          pdfBytes = makeStubPdf(`${meta.label} — ${brand}`, [
            `Source: ${sourceLabel(platform, sourceType)}`,
            `Website: ${website}`,
            `Language: ${REPORT_LANGUAGE_NAMES[language] ?? language}`,
            `Items analyzed: ${items.length}`,
            `(Stub PDF — live Claude Skills generation not enabled)`,
          ]);
        } else {
          const out = await generateWithClaude({
            apiKey, skillId, reportLabel: meta.label, skillName: meta.skillName,
            brand, website, sourceLabel: sourceLabel(platform, sourceType), scrapeJson,
            language,
          });
          pdfBytes = out.bytes;
          claudeMessageId = out.messageId;
        }

        const safeBrand = brand.replace(/[^a-zA-Z0-9]+/g, "_").slice(0, 40) || "report";
        const path = `reports/${user.id}/${capturedRowId}_${safeBrand}_${reportType}.pdf`;
        const up = await admin.storage.from(STORAGE_BUCKET).upload(path, pdfBytes, {
          contentType: "application/pdf", upsert: true,
        });
        if (up.error) throw new Error(`Storage upload failed: ${up.error.message}`);
        // Branded, same-origin URL (proxied to storage by the /r/ Vercel rewrite).
        const pdfUrl = `${PUBLIC_PDF_BASE}/${path}`;

        // Charge credits — ONLY now, on success (admins skip)
        if (!adminUser) {
          const { error: dedErr } = await admin.rpc("deduct_credits", { p_user_id: user.id, p_amount: price });
          if (dedErr) console.error("[generate-report] deduct failed", dedErr.message);
        }

        // Record in generations so it appears in "My Generations"
        let generationId: string | null = null;
        try {
          const { data: gen } = await admin
            .from("generations")
            .insert({
              user_id: user.id,
              prompt: `${meta.label} — ${brand}`,
              original_image_url: pdfUrl, // schema requires NOT NULL; reused for the PDF
              generated_image_url: pdfUrl,
              status: "completed",
              tool_name: meta.toolName,
            })
            .select("id").single();
          generationId = gen?.id ?? null;
        } catch (e) {
          console.error("[generate-report] generations insert failed", e);
        }

        await admin
          .from("report_generations")
          .update({
            status: "completed",
            credits_charged: adminUser ? 0 : price,
            pdf_url: pdfUrl,
            pdf_path: path,
            generation_id: generationId,
            claude_message_id: claudeMessageId,
            completed_at: new Date().toISOString(),
          })
          .eq("id", capturedRowId);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error("[generate-report] generation failed", msg);
        await admin.from("report_generations")
          .update({ status: "failed", error: msg }).eq("id", capturedRowId).then(() => {}, () => {});
      }
    };

    const waitUntil = (globalThis as any).EdgeRuntime?.waitUntil;
    if (typeof waitUntil === "function") waitUntil(runGeneration());
    else await runGeneration(); // local/dev fallback (blocks until done)

    return json({
      status: "processing",
      id: rowId,
      report_type: reportType,
      credits_estimate: adminUser ? 0 : price,
      is_bundle_price: isBundlePrice,
    }, 202);
  } catch (e) {
    // Errors during validation/insert (before the background task was scheduled).
    const msg = e instanceof Error ? e.message : String(e);
    if (rowId) {
      await admin.from("report_generations").update({ status: "failed", error: msg }).eq("id", rowId).then(() => {}, () => {});
    }
    console.error("[generate-report] error", msg);
    return json({ error: "Report generation failed. You were not charged.", detail: msg }, 502);
  }
});
