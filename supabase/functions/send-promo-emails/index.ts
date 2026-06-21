import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://floowy.ai";
const FROM = "Floowy.ai <hello@floowy.ai>";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

// Only target accounts created on/after the date these new drip flows launched.
// Existing users (signed up before this) must NOT receive these emails.
const NEW_SIGNUP_CUTOFF_AT = "2026-05-19T00:00:00Z";

type Flow = {
  key: string;
  subject: string;
  buildHtml: (firstName: string) => string;
  ctaLabel: string;
  ctaUrl: string;
};

const button = (label: string, url: string) =>
  `<p style="margin:32px 0;"><a href="${url}" style="background:#1DB954;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:9999px;font-weight:600;display:inline-block;">${label}</a></p>`;

const wrap = (inner: string) => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Floowy.ai</title>
  </head>
  <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Roboto','Helvetica Neue',sans-serif;background-color:#ffffff;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;padding:40px 20px;">
      <tr>
        <td align="center" style="padding-bottom:0;">
          <img src="https://fjzifykgvdsownlscgct.supabase.co/storage/v1/object/public/products/email-header.png" alt="Floowy.ai - High Quality Marketing Content With AI Power" width="600" style="display:block;width:100%;max-width:600px;height:auto;">
        </td>
      </tr>
      <tr>
        <td style="color:#333333;font-size:16px;line-height:1.6;padding-top:24px;">
          ${inner}
          <hr style="border:none;border-top:1px solid #e5e5e5;margin:32px 0;"/>
          <p style="font-size:12px;color:#888;margin:0;">Floowy.ai — AI Product Image & Video Generator for Ecommerce</p>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

const euro1Url = `${SITE_URL}/pricing-1-euro-offer`;
const fiftyOffUrl = `${SITE_URL}/pricing-50-off`;
const kbUrl = `${SITE_URL}/knowledge-base-hub`;

const LOGO_URL = "https://fjzifykgvdsownlscgct.supabase.co/storage/v1/object/public/products/floowy-logo.png";

// Compute hours / minutes / seconds remaining until the per-recipient deadline.
// The deadline is computed at send time = now + 24h, so when the user opens the
// email it still shows an accurate "almost out of time" countdown.
const countdownParts = (deadlineMs: number) => {
  const remaining = Math.max(0, deadlineMs - Date.now());
  const hours = Math.floor(remaining / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return { hh: pad(hours), mm: pad(minutes), ss: pad(seconds) };
};

const COUNTDOWN_GIF_URL = "https://fjzifykgvdsownlscgct.supabase.co/storage/v1/object/public/generated/email%2Fcountdown-24h.gif";

const euro1Email = (firstName: string, deadlineMs: number = Date.now() + 24 * 3_600_000) => {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Floowy.ai — 7 days for €1</title>
  </head>
  <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Roboto','Helvetica Neue',sans-serif;background-color:#f4f4f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background-color:#ffffff;">
      <!-- DARK HERO -->
      <tr>
        <td style="background-color:#0a0a0a;padding:40px 30px;text-align:center;">
          <img src="${LOGO_URL}" alt="Floowy.ai" height="28" style="display:inline-block;height:28px;width:auto;margin-bottom:28px;">

          <p style="color:#a1a1aa;font-size:11px;letter-spacing:2px;margin:0 0 14px 0;text-transform:uppercase;">Limited Offer · Ends In</p>

          <img src="${COUNTDOWN_GIF_URL}" alt="24 : 00 : 00" width="320" style="display:block;margin:0 auto 28px auto;max-width:320px;width:100%;height:auto;border:0;outline:none;text-decoration:none;">

          <h1 style="color:#ffffff;font-size:30px;line-height:1.2;font-weight:700;margin:0 0 16px 0;">
            7 days of Floowy<br/>for <span style="color:#1DB954;">€1</span>
          </h1>
          <p style="color:#a1a1aa;font-size:14px;line-height:1.5;margin:0 0 28px 0;">
            10 credits. 5+ studio-quality creatives.<br/>No subscription, no auto-renew.
          </p>

          <a href="${euro1Url}" style="background:#1DB954;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:9999px;font-weight:600;font-size:15px;display:inline-block;">Claim your €1 trial →</a>

          <p style="color:#71717a;font-size:11px;margin:14px 0 0 0;">Takes 30 seconds · cancel anytime</p>
        </td>
      </tr>

      <!-- BODY -->
      <tr>
        <td style="padding:36px 30px;color:#27272a;font-size:15px;line-height:1.6;">
          <p style="margin:0 0 16px 0;">Hi ${firstName},</p>
          <p style="margin:0 0 24px 0;">You signed up for Floowy but didn't generate yet. Easy to forget — that's why we're unlocking something extra for you.</p>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
            <tr><td style="padding:14px 0;border-top:1px solid #e4e4e7;border-bottom:1px solid #e4e4e7;">
              <span style="color:#1DB954;font-weight:700;font-size:13px;margin-right:12px;">01</span>
              <strong style="color:#0a0a0a;">10 credits</strong> — room to actually experiment with prompts, lighting and styles.
            </td></tr>
            <tr><td style="padding:14px 0;border-bottom:1px solid #e4e4e7;">
              <span style="color:#1DB954;font-weight:700;font-size:13px;margin-right:12px;">02</span>
              <strong style="color:#0a0a0a;">5+ high-quality creatives</strong> — ad visuals, product shots, social content.
            </td></tr>
            <tr><td style="padding:14px 0;border-bottom:1px solid #e4e4e7;">
              <span style="color:#1DB954;font-weight:700;font-size:13px;margin-right:12px;">03</span>
              <strong style="color:#0a0a0a;">7 full days</strong> — no commitment, ends automatically.
            </td></tr>
          </table>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;background-color:#f4f4f5;border-radius:12px;">
            <tr><td style="padding:20px;text-align:center;">
              <p style="margin:0 0 6px 0;color:#a1a1aa;font-size:14px;text-decoration:line-through;">Traditional shoot: €150 – €500+ · 3-5 days</p>
              <p style="margin:0 0 4px 0;color:#0a0a0a;font-size:17px;font-weight:600;">With Floowy: <span style="color:#1DB954;">€1 · minutes</span></p>
              <p style="margin:0;color:#71717a;font-size:12px;">Same output. Same brand control.</p>
            </td></tr>
          </table>

          <p style="text-align:center;margin:32px 0;">
            <a href="${euro1Url}" style="background:#0a0a0a;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:9999px;font-weight:600;font-size:15px;display:inline-block;">Start your €1 trial</a>
          </p>

          <p style="text-align:center;font-size:11px;color:#a1a1aa;margin:24px 0 0 0;">Floowy.ai — AI Product Image & Video Generator for Ecommerce</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};

const flow1Html = (firstName: string) => euro1Email(firstName);

const flow2Html = (firstName: string) => wrap(`
  <p>Hi ${firstName},</p>
  <p>I noticed you created a Floowy.ai account but haven't started generating visuals yet.</p>
  <p>And honestly, 3 free credits often isn't enough to properly explore what Floowy.ai can really do for your brand.</p>
  <p>Most users first need a bit of room to experiment with different styles, prompts, lighting, compositions, and creative directions.</p>
  <p><strong>That's exactly why we unlocked a temporary offer for you:</strong></p>
  <p>🚀 <strong>Try Floowy.ai for 7 days for just €1</strong><br/>
     ✔ Includes 10 credits<br/>
     ✔ Enough for at least 5 high-quality creatives<br/>
     ✔ No long-term commitment</p>
  <p>Creating 5 ad creatives through traditional production can cost €150–€500+ and take days. With Floowy.ai, you can test and create those same concepts within minutes.</p>
  <p>Perfect for ad creatives, ecommerce visuals, social content, campaign concepts, and product imagery.</p>
  ${button("Unlock Special €1 Offer", euro1Url)}
  <p>Need inspiration? <a href="${kbUrl}">Floowy Knowledge Base</a>.</p>
  <p>Best regards,<br/>The Floowy.ai Team</p>
`);

const flow3Html = (firstName: string) => wrap(`
  <p>Hi ${firstName},</p>
  <p>A lot has happened since you last visited Floowy.ai.</p>
  <p>To give you another chance to properly explore the platform, we unlocked a special offer for you:</p>
  <p>🔥 <strong>50% off all Floowy.ai subscriptions</strong><br/>Valid for your first 3 months.</p>
  <p>That means you can start creating ad creatives, ecommerce visuals, campaign concepts, product imagery and social content for a fraction of traditional production costs.</p>
  <p>Most brands spend hundreds or even thousands on content production every month. With Floowy.ai, you can test and scale creatives significantly faster while reducing production time and costs.</p>
  ${button("Start with 50% Off", fiftyOffUrl)}
  <p>Best regards,<br/>The Floowy.ai Team</p>
`);

const flow4Html = flow1Html; // Per spec, body identical to Flow 1
const flow5Html = flow3Html; // Per spec, body identical to Flow 3 (60-day reactivation)

const FLOWS: Record<string, Flow> = {
  flow_1_visuals_no_sub: {
    key: "flow_1_visuals_no_sub",
    subject: "3 credits isn't enough. Unlock 10 more for €1",
    buildHtml: flow1Html,
    ctaLabel: "Unlock Special €1 Offer",
    ctaUrl: euro1Url,
  },
  flow_2_no_visuals_no_sub: {
    key: "flow_2_no_visuals_no_sub",
    subject: "You barely scratched the surface of Floowy.ai 👀",
    buildHtml: flow2Html,
    ctaLabel: "Unlock Special €1 Offer",
    ctaUrl: euro1Url,
  },
  flow_3_reactivation_50off: {
    key: "flow_3_reactivation_50off",
    subject: "Come back to Floowy.ai with 50% off 🚀",
    buildHtml: flow3Html,
    ctaLabel: "Start with 50% Off",
    ctaUrl: fiftyOffUrl,
  },
  flow_4_final_trust: {
    key: "flow_4_final_trust",
    subject: "3 credits isn't enough. Unlock 10 more for €1",
    buildHtml: flow4Html,
    ctaLabel: "Unlock Special €1 Offer",
    ctaUrl: euro1Url,
  },
  flow_5_60day_special: {
    key: "flow_5_60day_special",
    subject: "Come back to Floowy.ai with 50% off 🚀",
    buildHtml: flow5Html,
    ctaLabel: "Start with 50% Off",
    ctaUrl: fiftyOffUrl,
  },
};

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({ from: FROM, to: [to], subject, html }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Resend ${res.status}: ${txt}`);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY missing" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Test mode via query param ?test=1&email=...&flow=...&firstName=...
  const url = new URL(req.url);
  console.log("[send-promo-emails] url:", url.pathname + url.search);
  if (url.searchParams.get("test") === "1") {
    const email = url.searchParams.get("email") || "";
    const flowKey = url.searchParams.get("flow") || "flow_1_visuals_no_sub";
    const firstName = url.searchParams.get("firstName") || "Jef";
    const flow = FLOWS[flowKey];
    if (!email || !flow) {
      return new Response(JSON.stringify({ error: "email & valid flow required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    try {
      await sendEmail(email, `[TEST] ${flow.subject}`, flow.buildHtml(firstName));
      return new Response(JSON.stringify({ ok: true, sent_to: email, flow: flowKey }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: String(e) }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const results: Record<string, { sent: number; skipped: number; errors: number }> = {};

  // Pull all free-plan profiles (existing paying customers are NEVER emailed).
  const { data: profiles, error: profileErr } = await admin
    .from("profiles")
    .select("id, email, full_name, created_at, plan")
    .eq("plan", "free")
    .gte("created_at", NEW_SIGNUP_CUTOFF_AT);

  if (profileErr) {
    return new Response(JSON.stringify({ error: profileErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Generations counts per user
  const userIds = (profiles ?? []).map((p) => p.id);
  const genCounts = new Map<string, number>();
  if (userIds.length) {
    const { data: gens } = await admin
      .from("generations")
      .select("user_id")
      .in("user_id", userIds);
    for (const g of gens ?? []) {
      genCounts.set(g.user_id as string, (genCounts.get(g.user_id as string) ?? 0) + 1);
    }
  }

  // Already-sent map
  const { data: sends } = await admin
    .from("email_sends")
    .select("user_id, flow_key, sent_at")
    .in("user_id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);
  const sentMap = new Map<string, Map<string, Date>>();
  for (const s of sends ?? []) {
    if (!sentMap.has(s.user_id as string)) sentMap.set(s.user_id as string, new Map());
    sentMap.get(s.user_id as string)!.set(s.flow_key as string, new Date(s.sent_at as string));
  }

  const now = Date.now();
  const days = (d: number) => d * 24 * 60 * 60 * 1000;
  const firstName = (full?: string | null) => (full || "").trim().split(" ")[0] || "there";

  const trySend = async (
    profile: { id: string; email: string | null; full_name: string | null },
    flowKey: keyof typeof FLOWS,
  ) => {
    if (!profile.email) return "skipped";
    const userSent = sentMap.get(profile.id);
    if (userSent?.has(flowKey)) return "skipped";
    const flow = FLOWS[flowKey];
    try {
      await sendEmail(profile.email, flow.subject, flow.buildHtml(firstName(profile.full_name)));
      await admin.from("email_sends").insert({ user_id: profile.id, flow_key: flowKey });
      return "sent";
    } catch (e) {
      console.error(`[${flowKey}] send failed for ${profile.email}:`, e);
      return "error";
    }
  };

  const tally = (flowKey: string, r: string) => {
    if (!results[flowKey]) results[flowKey] = { sent: 0, skipped: 0, errors: 0 };
    if (r === "sent") results[flowKey].sent++;
    else if (r === "error") results[flowKey].errors++;
    else results[flowKey].skipped++;
  };

  for (const p of profiles ?? []) {
    const createdAt = new Date(p.created_at as string).getTime();
    const ageMs = now - createdAt;
    const hasGen = (genCounts.get(p.id) ?? 0) > 0;
    const userSent = sentMap.get(p.id);
    const sentFlow1 = userSent?.get("flow_1_visuals_no_sub");
    const sentFlow2 = userSent?.get("flow_2_no_visuals_no_sub");
    const earlier = sentFlow1 || sentFlow2;

    // Flow 1: ≥2 days old, has generations
    if (ageMs >= days(2) && hasGen) {
      tally("flow_1_visuals_no_sub", await trySend(p, "flow_1_visuals_no_sub"));
    }

    // Flow 2: ≥2 days old, no generations
    if (ageMs >= days(2) && !hasGen) {
      tally("flow_2_no_visuals_no_sub", await trySend(p, "flow_2_no_visuals_no_sub"));
    }

    // Flows 3 & 4: ≥5 days after Flow 1 or Flow 2 was sent (still no subscription = still free)
    if (earlier && now - earlier.getTime() >= days(5)) {
      tally("flow_3_reactivation_50off", await trySend(p, "flow_3_reactivation_50off"));
      tally("flow_4_final_trust", await trySend(p, "flow_4_final_trust"));
    }

    // Flow 5: account ≥60 days, no active subscription (already filtered by plan='free')
    if (ageMs >= days(60)) {
      tally("flow_5_60day_special", await trySend(p, "flow_5_60day_special"));
    }
  }

  return new Response(JSON.stringify({ ok: true, results }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});