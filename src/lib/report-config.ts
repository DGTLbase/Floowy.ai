// Report generation — single source of truth (Scraper Report Briefing v1, frontend).
//
// After a scrape, two buttons generate a Floowy-styled PDF via the Claude API,
// each backed by a fixed Agent Skill. Plan-gated + credit-priced. This module
// is mirrored server-side in supabase/functions/_shared/report-config.ts — keep
// the two in sync (costs, min tiers, bundle window).
//
// IMPORTANT gating note: the briefing overrides the older "all scraper PDF
// reports are Professional+" rule (tier-access.ts → canExportScraperReports).
// Per the briefing: Insights Report is Starter+; Contentplan is Professional+.

import { type Tier, tierMeets } from "@/lib/tier-access";

export type ReportType = "insights" | "contentplan";

export const REPORT_TYPES: readonly ReportType[] = ["insights", "contentplan"] as const;

export interface ReportMeta {
  /** Stable id used in DB (report_generations.report_type) + generations.tool_name. */
  type: ReportType;
  /** Button + card label shown to the user. */
  label: string;
  /** One-line description under the button. */
  blurb: string;
  /** The custom Agent Skill folder name (uploaded to the Claude Skills API). */
  skillName: string;
  /** Minimum subscription tier that can run this report. */
  minTier: Tier;
  /** Base credit cost for a single report of this type. */
  credits: number;
}

export const REPORTS: Record<ReportType, ReportMeta> = {
  insights: {
    type: "insights",
    label: "Create Insights Report",
    blurb: "Turn this scrape into an executive-ready analysis with opportunities and learnings.",
    skillName: "inzichtenrapport-dgtlbase",
    minTier: "starter",
    credits: 10,
  },
  contentplan: {
    type: "contentplan",
    label: "Create Contentplan",
    blurb: "Translate the scrape insights into concrete, ready-to-shoot content concepts.",
    skillName: "contentplan-briefing-dgtlbase",
    minTier: "professional",
    credits: 10,
  },
};

/* ── Report language ─────────────────────────────────────────────────────────
   The language of the generated PDF. The user picks it at generation time and
   it is passed to the skill as its `language` form field; the skill writes the
   entire report — headings, chrome, fixed sentences, filename — in it.

   This list is exactly the set the skills' template.py ships UI strings for
   (`UI_STRINGS` in references/template.py). Adding a code here without adding
   it there makes the skill fall back to English page chrome inside an otherwise
   translated report. */

export interface ReportLanguage {
  /** Code passed to the skill (its `lang=` / `language` value). */
  code: string;
  /** Shown in the dropdown, in the language itself. */
  label: string;
}

export const REPORT_LANGUAGES: readonly ReportLanguage[] = [
  { code: "nl", label: "Nederlands" },
  { code: "en", label: "English" },
  { code: "de", label: "Deutsch" },
  { code: "fr", label: "Français" },
  { code: "es", label: "Español" },
  { code: "it", label: "Italiano" },
  { code: "pt", label: "Português" },
] as const;

/** Pre-selected in the dropdown. Dutch keeps today's output unchanged for
 *  existing NL customers — the field is required, so there is no empty state. */
export const DEFAULT_REPORT_LANGUAGE = "nl";

export const isReportLanguage = (code: unknown): code is string =>
  typeof code === "string" && REPORT_LANGUAGES.some((l) => l.code === code);

/* ── Bundle pricing (Professional only) ──────────────────────────────────────
   Both reports together cost 15 credits (instead of 20). If a Pro user buys one
   report first and then the second WITHIN the window, the second costs 5 credits
   (so the pair still totals 15). After the window it reverts to the normal 10. */

/** Cost of buying BOTH reports in one action. */
export const BUNDLE_CREDITS = 15;
/** Cost of the SECOND report when bought within the window after the first. */
export const BUNDLE_SECOND_CREDITS = 5;
/** How long the discounted-second-report window stays open after the first purchase. */
export const BUNDLE_WINDOW_MS = 5 * 60 * 1000;

/** The bundle (and therefore the discounted second report) is Professional+ only. */
export const BUNDLE_MIN_TIER: Tier = "professional";

/** Whether the given tier is allowed to run the given report at all. */
export const canRunReport = (userPlan: string | null | undefined, report: ReportType): boolean =>
  tierMeets(userPlan, REPORTS[report].minTier);

/** Whether the given tier can use the bundle / discounted-second-report pricing. */
export const canBundle = (userPlan: string | null | undefined): boolean =>
  tierMeets(userPlan, BUNDLE_MIN_TIER);

/**
 * Credit price for a single report, accounting for the bundle window.
 * `firstPurchasedAt` is the timestamp (ms) the user bought the OTHER report in a
 * potential bundle, or null/undefined if none. `now` is injectable for tests.
 */
export const reportPrice = (
  userPlan: string | null | undefined,
  report: ReportType,
  firstPurchasedAt?: number | null,
  now: number = Date.now(),
): number => {
  const base = REPORTS[report].credits;
  if (!canBundle(userPlan) || !firstPurchasedAt) return base;
  const withinWindow = now - firstPurchasedAt <= BUNDLE_WINDOW_MS;
  return withinWindow ? BUNDLE_SECOND_CREDITS : base;
};

/** Milliseconds left in the bundle window (0 if closed / not applicable). */
export const bundleWindowRemaining = (
  firstPurchasedAt?: number | null,
  now: number = Date.now(),
): number => {
  if (!firstPurchasedAt) return 0;
  return Math.max(0, firstPurchasedAt + BUNDLE_WINDOW_MS - now);
};
