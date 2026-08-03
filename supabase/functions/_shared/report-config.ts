// Backend mirror of src/lib/report-config.ts — report gating + pricing for the
// generate-report edge function. Keep the two in sync (costs, min tiers, window).
//
// Gating (per the Scraper Report Briefing, which overrides the older
// "all scraper reports are Professional+" rule):
//   - Insights Report  → Starter+
//   - Contentplan      → Professional+
//   - Bundle / discounted second report → Professional+

import { type Tier, tierMeets } from "./tier.ts";

export type ReportType = "insights" | "contentplan";

export const REPORT_TYPES: ReportType[] = ["insights", "contentplan"];

export interface ReportMeta {
  type: ReportType;
  label: string;
  /** Custom Agent Skill folder name (uploaded to the Claude Skills API). */
  skillName: string;
  /** Env var holding the uploaded skill_id for this report. */
  skillIdEnv: string;
  /** generations.tool_name written so the PDF shows in "My Generations". */
  toolName: string;
  minTier: Tier;
  credits: number;
}

/* ── Report language (mirror of src/lib/report-config.ts) ────────────────────
   Codes the skills' template.py ships UI strings for. The backend validates the
   client's choice against this list rather than trusting it: an unknown code
   would make the skill render English page chrome inside a report written in
   another language. */
export const REPORT_LANGUAGE_CODES = ["nl", "en", "de", "fr", "es", "it", "pt"] as const;
export const DEFAULT_REPORT_LANGUAGE = "nl";

/** English name of each code, so the prompt names the language unambiguously. */
export const REPORT_LANGUAGE_NAMES: Record<string, string> = {
  nl: "Dutch",
  en: "English",
  de: "German",
  fr: "French",
  es: "Spanish",
  it: "Italian",
  pt: "Portuguese",
};

export const isReportLanguage = (code: unknown): code is string =>
  typeof code === "string" && (REPORT_LANGUAGE_CODES as readonly string[]).includes(code);

export const REPORTS: Record<ReportType, ReportMeta> = {
  insights: {
    type: "insights",
    label: "Insights Report",
    skillName: "inzichtenrapport-dgtlbase",
    skillIdEnv: "CLAUDE_SKILL_ID_INSIGHTS",
    toolName: "insights-report",
    minTier: "starter",
    credits: 10,
  },
  contentplan: {
    type: "contentplan",
    label: "Contentplan",
    skillName: "contentplan-briefing-dgtlbase",
    skillIdEnv: "CLAUDE_SKILL_ID_CONTENTPLAN",
    toolName: "contentplan",
    minTier: "professional",
    credits: 10,
  },
};

export const BUNDLE_CREDITS = 15;
export const BUNDLE_SECOND_CREDITS = 5;
export const BUNDLE_WINDOW_MS = 5 * 60 * 1000;
export const BUNDLE_MIN_TIER: Tier = "professional";

export const isReportType = (v: unknown): v is ReportType =>
  v === "insights" || v === "contentplan";

export const canRunReport = (plan: string | null | undefined, report: ReportType): boolean =>
  tierMeets(plan, REPORTS[report].minTier);

export const canBundle = (plan: string | null | undefined): boolean =>
  tierMeets(plan, BUNDLE_MIN_TIER);

/**
 * Authoritative server-side price for a single report, accounting for the bundle
 * window. `firstPurchasedAtMs` = when the OTHER report in a potential bundle was
 * purchased (ms epoch), or null. This is the value that must be charged.
 */
export const reportPrice = (
  plan: string | null | undefined,
  report: ReportType,
  firstPurchasedAtMs: number | null,
  nowMs: number,
): number => {
  const base = REPORTS[report].credits;
  if (!canBundle(plan) || !firstPurchasedAtMs) return base;
  return nowMs - firstPurchasedAtMs <= BUNDLE_WINDOW_MS ? BUNDLE_SECOND_CREDITS : base;
};
