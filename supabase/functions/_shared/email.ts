// Shared email helpers for the €1 lifecycle flows (Resend).
// Email-safe HTML: table-based layout, inline styles, web-safe fonts.

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

export const FROM = "Floowy.ai <hello@floowy.ai>";
export const HEADER_IMG =
  "https://fjzifykgvdsownlscgct.supabase.co/storage/v1/object/public/products/email-header.png";
// Press / "as featured on" strip — drop the supplied logo image at
// public/email/press-logos.png so it serves from this absolute URL.
export const PRESS_LOGOS_IMG = "https://floowy.ai/email/press-logos.png";

// Every recovery CTA points at the €1 payment step (not the homepage).
export const EURO1_URL = "https://floowy.ai/pricing-1-euro-offer";
export const CASES_URL = "https://floowy.ai/cases";

const GREEN = "#10b981";
const GREEN_DARK = "#059669";
const INK = "#0f1f17";
const MUTED = "#667085";

export async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({ from: FROM, to: [to], subject, html }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend error: ${err}`);
  }
  return res.json();
}

/** Big accent CTA button. */
export function button(text: string, href: string): string {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px auto;">
    <tr><td style="border-radius:10px;background:linear-gradient(135deg,${GREEN} 0%,${GREEN_DARK} 100%);">
      <a href="${href}" style="display:inline-block;padding:15px 38px;color:#ffffff;text-decoration:none;font-weight:bold;font-size:16px;border-radius:10px;">${text}</a>
    </td></tr>
  </table>`;
}

/** A row of headline stats, e.g. [{value:"+90%",label:"Faster production"}]. */
export function statRow(stats: { value: string; label: string }[]): string {
  const cells = stats
    .map(
      (s) => `
      <td align="center" style="padding:14px 10px;">
        <div style="font-size:30px;font-weight:800;color:${GREEN_DARK};line-height:1;">${s.value}</div>
        <div style="font-size:13px;color:${MUTED};margin-top:6px;">${s.label}</div>
      </td>`
    )
    .join("");
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
    style="background:#f0fdf4;border-radius:12px;margin:22px 0;border:1px solid #dcfce7;">
    <tr>${cells}</tr>
  </table>`;
}

/** A case-study block: brand name, one-line description, stat row. */
export function caseStudy(
  brand: string,
  desc: string,
  stats: { value: string; label: string }[]
): string {
  return `
  <div style="margin:24px 0;">
    <div style="font-size:18px;font-weight:700;color:${INK};">${brand}</div>
    <div style="font-size:15px;color:${MUTED};margin:4px 0 6px;">${desc}</div>
    ${statRow(stats)}
  </div>`;
}

/**
 * Press / "as featured on" strip — the real grey logo lockup
 * (RTL, Videoland, TEDx, FD, Global Search Awards, FONK 150), with alt text as
 * the fallback for clients that block images.
 */
export function pressStrip(): string {
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:30px 0 6px;">
    <tr><td style="border-top:1px solid #eef1f0;border-bottom:1px solid #eef1f0;padding:18px 0 16px;">
      <div style="text-align:center;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#9aa6a0;margin-bottom:14px;">As featured on</div>
      <div style="text-align:center;">
        <img src="${PRESS_LOGOS_IMG}" width="560"
          alt="RTL · Videoland · TEDx · FD · Global Search Awards · FONK 150"
          style="width:100%;max-width:560px;height:auto;display:block;margin:0 auto;" />
      </div>
    </td></tr>
  </table>`;
}

// ── Lifecycle flow content (A/B/C/D/E) ───────────────────────────────────────
const p = (t: string) => `<p style="margin:0 0 14px;">${t}</p>`;
const h1 = (t: string) => `<h1 style="font-size:25px;margin:0 0 18px;color:${INK};">${t}</h1>`;
const ul = (items: string[]) =>
  `<ul style="margin:0 0 16px;padding-left:20px;color:${INK};">${items
    .map((i) => `<li style="margin-bottom:8px;">${i}</li>`)
    .join("")}</ul>`;
const flame = (t: string) =>
  `<p style="margin:0 0 10px;color:${GREEN_DARK};font-weight:bold;">⚡ ${t}</p>`;
const TV_URL = "https://youtu.be/DB9Lrxx7rhs";

export type Flow = "A" | "B" | "C" | "D" | "E";

/** Build subject + full HTML for a lifecycle flow. */
export function buildLifecycleEmail(flow: Flow, firstName: string): { subject: string; html: string } {
  const n = firstName || "there";
  switch (flow) {
    case "A":
      return {
        subject: "How ICON Amsterdam cut production costs by 90%",
        html: layout({
          preview: "They were spending weeks on shoots. Now they publish daily. Here's how.",
          bodyHtml:
            h1("How ICON Amsterdam cut production costs by 90%") +
            p(`Hi ${n},`) +
            p("You signed up to Floowy but you haven't started yet.") +
            p("Before you decide, here's what one brand did with the exact same tool you have access to.") +
            p("<strong>ICON Amsterdam.</strong> A men's fashion brand with a sharp aesthetic and a serious content problem.") +
            p("They needed fresh visuals constantly across their entire catalogue. Traditional photography was too slow, too expensive, and couldn't keep pace with new drops.") +
            statRow([
              { value: "+72%", label: "Production cost saved" },
              { value: "+90%", label: "Faster flatlay production" },
              { value: "+75%", label: "Time saved per shoot" },
            ]) +
            `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 18px;"><tr><td style="border-left:4px solid ${GREEN};background:#f0fdf4;padding:14px 18px;border-radius:8px;font-style:italic;color:${INK};">"We used to wait weeks for new ad creative. With Floowy, we're producing on-brand visuals in minutes and pushing fresh ads live almost daily."<div style="font-style:normal;color:${MUTED};font-size:13px;margin-top:8px;">— Art Director, ICON Amsterdam</div></td></tr></table>` +
            p("Instead of waiting on shoots, styling, and revisions — new concepts were live within minutes. Full brand consistency, zero photographer dependency.") +
            p("<strong>Your €1 trial gives you the same access. 10 credits, 3 days, no watermarks.</strong>") +
            button("Start for €1 — get your first creative live today", EURO1_URL) +
            flame("€1 offer limited window. Don't leave this on the table.") +
            `<p style="margin:0;color:${MUTED};font-size:14px;">Read the full ICON Amsterdam case: <a href="https://floowy.ai/cases/icon-amsterdam" style="color:${GREEN_DARK};">floowy.ai/cases/icon-amsterdam</a></p>`,
        }),
      };
    case "B":
      return {
        subject: "This is your last reminder",
        html: layout({
          preview: "Your €1 access won't be available forever.",
          bodyHtml:
            h1("This is your last reminder") +
            p(`Hi ${n},`) +
            `<p style="margin:0 0 6px;">You created a Floowy account 48 hours ago.</p>` +
            p("You haven't started yet.") +
            `<p style="margin:0 0 10px;">That's fine — but here's the reality:</p>` +
            ul([
              "Your competitors are already testing more creatives than you",
              "Brands using Floowy are cutting production costs by up to 90%",
              "The €1 offer is not permanent",
            ]) +
            p("For €1 you get 3 days, 10 credits, and download-ready outputs with zero watermarks.") +
            `<p style="margin:0 0 6px;font-size:18px;font-weight:bold;color:${INK};">That's it. One euro.</p>` +
            button("Activate my €1 access now", EURO1_URL) +
            flame("This is your last nudge from us. The offer is live — grab it."),
        }),
      };
    case "C":
      return {
        subject: "The brands winning right now all have one thing in common",
        html: layout({
          preview: "We reactivated your €1 offer. Here's why — and what they're achieving.",
          bodyHtml:
            h1("The brands winning right now all have one thing in common") +
            p(`Hi ${n},`) +
            `<p style="margin:0 0 6px;">It's been a week since you created your Floowy account.</p>` +
            `<p style="margin:0 0 8px;">In that time, brands just like yours have been doing this:</p>` +
            caseStudy("Marcel's Green Soap", "A Dutch sustainable cleaning brand scaling national campaigns from a single content team.", [
              { value: "+36%", label: "Content output" },
              { value: "-60%", label: "Production costs" },
              { value: "+28%", label: "Engagement rate" },
            ]) +
            caseStudy("Basko", "Fashion e-commerce brand solving buyer uncertainty with full-angle AI product coverage.", [
              { value: "-24%", label: "Product return rate" },
              { value: "+19%", label: "Conversion rate" },
              { value: "+27%", label: "Add-to-cart rate" },
            ]) +
            caseStudy("ICON Amsterdam", "Men's fashion brand replacing costly shoots with daily AI-generated on-brand visuals.", [
              { value: "+72%", label: "Production costs saved" },
              { value: "+90%", label: "Faster flatlay production" },
              { value: "+75%", label: "Time saved per shoot" },
            ]) +
            p("Because of the results we're seeing across the board, we've decided to <strong>reactivate your €1 offer.</strong>") +
            `<p style="margin:0 0 10px;">This isn't something we do often. But if you haven't started yet, this is your moment.</p>` +
            ul(["3 days of access", "10 credits, no watermarks", "Your first creative live in minutes"]) +
            button("Activate my €1 access", EURO1_URL) +
            flame("Activate offer. This is the last time we'll reach out.") +
            `<p style="margin:0;color:${MUTED};font-size:14px;">See all case studies: <a href="https://floowy.ai/cases" style="color:${GREEN_DARK};">floowy.ai/cases</a></p>`,
        }),
      };
    case "D":
      return {
        subject: "Welcome to Floowy! we're glad you're here",
        html: layout({
          preview: "Thank you for the trust. Here's everything you need to get the most out of Floowy.",
          bodyHtml:
            h1("Welcome to Floowy — we're glad you're here") +
            p(`Hi ${n},`) +
            p("Welcome to Floowy.") +
            p("We genuinely mean that. In a world where AI tools are popping up everywhere, choosing to trust us with your brand's content is something we don't take lightly.") +
            `<p style="margin:0 0 18px;font-weight:bold;color:${INK};">Thank you.</p>` +
            `<p style="margin:0 0 8px;font-size:18px;font-weight:bold;color:${INK};">Everything you need, right here.</p>` +
            p("We've put together a few resources to help you hit the ground running. Take your time — there's no rush.") +
            [
              ["Knowledge base", "Step-by-step guides, tips, and tutorials to get the best out of Floowy.", "floowy.ai/knowledge-base"],
              ["Customer cases", "See how brands like ICON Amsterdam, Basko, and Marcel's Green Soap grew with Floowy.", "floowy.ai/cases"],
              ["Contact us", "A question, a thought, anything at all — we're here and we respond fast.", "floowy.ai/contact"],
            ]
              .map(([t, d, u]) =>
                `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px;background:#f8fafc;border:1px solid #eef1f0;border-radius:10px;"><tr><td style="padding:14px 18px;"><div style="font-weight:700;color:${INK};font-size:16px;">${t}</div><div style="color:${MUTED};font-size:14px;margin:4px 0 6px;">${d}</div><a href="https://${u}" style="color:${GREEN_DARK};text-decoration:none;font-size:14px;">${u} →</a></td></tr></table>`)
              .join("") +
            button("Open your dashboard", "https://floowy.ai/home") +
            p("One last thing — if you ever feel stuck, have a question about a feature, or just want to show us what you've created: reach out. We love seeing what brands make with Floowy.") +
            `<p style="margin:0;font-weight:bold;color:${INK};">Here's to your first creative.</p>`,
        }),
      };
    case "E":
      return {
        subject: "National television came to us. We think you should see why.",
        html: layout({
          preview: "RTL7, RTLZ & Videoland visited Floowy. Here's what they found — and why it matters for you.",
          showPress: true,
          bodyHtml:
            h1("National television came to us. We think you should see why.") +
            p(`Hi ${n},`) +
            p("A month ago, you created a Floowy account.") +
            p("We get it — AI is moving fast. There's a lot to keep up with. It's easy to sign up for something and not get around to actually using it.") +
            p("But we wanted to share something with you before we stop reaching out.") +
            p('For the programme <strong>"De AI Storm"</strong> — a four-part series on national television about how AI is changing Dutch business — the production team came to Floowy to see how brands are using AI to produce content at scale.') +
            p("Not a startup pitch. Not a tech demo. National television, covering real results.") +
            button("▶ Watch the TV feature", TV_URL) +
            `<p style="margin:0 0 8px;font-weight:bold;color:${INK};">Why does this matter to you?</p>` +
            p("Because the brands featured weren't special cases. They were brands exactly like yours — dealing with the same content bottlenecks, the same production costs, the same pressure to keep up.") +
            `<p style="margin:0 0 6px;">Here's what AI-powered content creation is doing for Dutch brands right now:</p>` +
            statRow([
              { value: "-90%", label: "Production cost — ICON Amsterdam" },
              { value: "+36%", label: "Content output — Marcel's Green Soap" },
              { value: "+19%", label: "Conversion rate — Basko" },
            ]) +
            `<p style="margin:0 0 6px;font-size:18px;font-weight:bold;color:${INK};">You're one euro away from your first result.</p>` +
            `<p style="margin:0 0 10px;">We know keeping up with AI feels overwhelming right now. That's exactly why we made the entry point as low as possible.</p>` +
            ul([
              "€1 to start — no risk, no big commitment",
              "10 credits in your first 3 days",
              "Your first creative ready in under 2 minutes",
              "Download-ready outputs — zero watermarks",
            ]) +
            button("Watch the TV feature + start for €1", EURO1_URL) +
            flame("The €1 offer is live — it takes 60 seconds to start.") +
            `<p style="margin:0;color:${MUTED};font-size:14px;">Watch the TV feature: <a href="${TV_URL}" style="color:${GREEN_DARK};">youtu.be/DB9Lrxx7rhs</a><br/>See all case studies: <a href="https://floowy.ai/cases" style="color:${GREEN_DARK};">floowy.ai/cases</a></p>`,
        }),
      };
  }
}

interface LayoutOpts {
  bodyHtml: string;
  preview?: string;
  showPress?: boolean;
}

/** Full branded email document wrapper. */
export function layout({ bodyHtml, preview = "", showPress = false }: LayoutOpts): string {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body style="margin:0;padding:0;background:#f4f6f5;font-family:Arial,Helvetica,sans-serif;">
    <span style="display:none;max-height:0;overflow:hidden;opacity:0;">${preview}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f5;padding:24px 0;">
      <tr><td align="center">
        <table role="presentation" width="680" cellpadding="0" cellspacing="0" style="max-width:680px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;">
          <tr><td>
            <img src="${HEADER_IMG}" alt="Floowy.ai" style="width:100%;display:block;" />
          </td></tr>
          <tr><td style="padding:36px 34px 14px;color:${INK};font-size:16px;line-height:1.65;">
            ${bodyHtml}
            ${showPress ? pressStrip() : ""}
          </td></tr>
          <tr><td style="padding:22px 34px 34px;border-top:1px solid #eef1f0;color:${MUTED};font-size:13px;line-height:1.6;">
            <p style="margin:0 0 6px;">The Floowy team</p>
            <p style="margin:0;">
              <a href="https://floowy.ai" style="color:${GREEN_DARK};text-decoration:none;">floowy.ai</a> ·
              <a href="${EURO1_URL}" style="color:${GREEN_DARK};text-decoration:none;">Start for €1</a> ·
              <a href="https://floowy.ai/contact" style="color:${GREEN_DARK};text-decoration:none;">Contact</a>
            </p>
            <p style="margin:12px 0 0;color:#9aa6a0;">Questions? Just reply to this email — we respond fast.</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}
