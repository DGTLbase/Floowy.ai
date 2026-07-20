// Tier-based feature gating — single source of truth (Tier Briefing v1).
//
// Maps subscription tiers to tool access + the pricing comparison matrix.
// Enterprise INHERITS Professional's permission set: any tool set to
// "professional" is automatically available to Enterprise too (never list a
// separate Enterprise tool set). The rest of the Enterprise difference is
// account-level (pricing, credit volume, account manager) and lives outside the
// tool-permission system.
//
// Tool ids below are the canonical ids from src/lib/tools-registry.ts.

export const TIERS = ["free", "lite", "starter", "professional", "enterprise"] as const;
export type Tier = (typeof TIERS)[number];

/** Paid tiers only, low → high (used for the pricing comparison columns). */
export const PAID_TIERS = ["lite", "starter", "professional", "enterprise"] as const;
export type PaidTier = (typeof PAID_TIERS)[number];

export const TIER_RANK: Record<Tier, number> = {
  free: 0,
  lite: 1,
  starter: 2,
  professional: 3,
  enterprise: 4,
};

/** Display names for tiers (used in upgrade CTAs, e.g. "Available from Starter"). */
export const TIER_NAME: Record<Tier, string> = {
  free: "Free",
  lite: "Lite",
  starter: "Starter",
  professional: "Professional",
  enterprise: "Enterprise",
};

/** Coerce any raw profiles.plan string into a known Tier (defaults to free). */
export const normalizeTier = (plan?: string | null): Tier => {
  const t = (plan || "free").toLowerCase();
  return (TIERS as readonly string[]).includes(t) ? (t as Tier) : "free";
};

/** True when the user's tier is at or above the required tier. */
export const tierMeets = (userPlan: string | null | undefined, required: Tier): boolean =>
  TIER_RANK[normalizeTier(userPlan)] >= TIER_RANK[required];

/**
 * Minimum tier that unlocks each tool. Enterprise inherits Professional, so any
 * "professional" tool is also available on Enterprise via tierMeets(). Tools not
 * listed here are not tier-gated (public/coming-soon/special-grant) and keep
 * their existing access model in the registry.
 */
export const TOOL_MIN_TIER: Record<string, Tier> = {
  // Lite (€19) — entry level, single-output content
  "ads-studio": "lite",
  "ambience": "lite",
  "creator-studio": "lite",
  "fashion": "lite",
  "flatlay": "lite",
  "idea-studio": "lite",
  "listing-studio": "lite",

  // Starter (€49) — video production + limited research
  "fashion-video": "starter",
  "video-recreation": "starter",
  "virtual-video": "starter",
  "social-scraper": "starter", // limited scope on Starter — see helpers below

  // Professional (€119) — scale + reporting (also Enterprise via inheritance)
  "fashion-pro": "professional",
};

/** Whether the given tier can open the given tool (id from tools-registry). */
export const tierHasTool = (userPlan: string | null | undefined, toolId: string): boolean => {
  const min = TOOL_MIN_TIER[toolId];
  if (!min) return true; // not tier-gated here
  return tierMeets(userPlan, min);
};

/* ── Social Scraper split (the key Starter → Professional upgrade trigger) ──
   Starter (limited): 1 platform / month, in-app only, NO export, NO reports.
   Professional/Enterprise (full): all platforms, no scrape limit, PDF reports. */

/**
 * Max distinct platforms a tier may scrape per month.
 * - Professional/Enterprise: null (unlimited).
 * - Starter: 1.
 * - Below Starter: 0 (no scraper access).
 */
export const scraperPlatformLimit = (userPlan: string | null | undefined): number | null => {
  if (tierMeets(userPlan, "professional")) return null; // unlimited
  if (tierMeets(userPlan, "starter")) return 1;
  return 0;
};

/** Export to file / PDF report generation is Professional+ only. */
export const canExportScraperReports = (userPlan: string | null | undefined): boolean =>
  tierMeets(userPlan, "professional");

/* ── Pricing comparison matrix ──────────────────────────────────────────────
   The single source of truth for every "which tier gets what" pricing table.
   Order: credit/image limits → per-tool rows → scraper rows → account features.
   Keep labels short (≤ ~5 words). */

export interface TierValueRow {
  kind: "value";
  label: string;
  /** Display value per paid tier. */
  values: Record<PaidTier, string>;
}

export interface TierCheckRow {
  kind: "check";
  label: string;
  /** Included (true = check) / not included (false = cross) per paid tier. */
  tiers: Record<PaidTier, boolean>;
}

export type TierFeatureRow = TierValueRow | TierCheckRow;

const check = (lite: boolean, starter: boolean, professional: boolean, enterprise: boolean) => ({
  lite,
  starter,
  professional,
  enterprise,
});

/**
 * Features present on `current` but absent on `target` — i.e. what a downgrade
 * gives up. Driven by the matrix so it always matches the pricing table. Returns
 * the check-row labels only (limits like credits/images are computed separately
 * from SUBSCRIPTION_PLANS by the caller).
 */
export const lostFeaturesOnDowngrade = (current: PaidTier, target: PaidTier): string[] =>
  TIER_FEATURE_MATRIX.filter(
    (r): r is TierCheckRow => r.kind === "check" && r.tiers[current] && !r.tiers[target],
  ).map((r) => r.label);

/** Features absent on `current` but present on `target` — i.e. what an upgrade unlocks. */
export const gainedFeaturesOnUpgrade = (current: PaidTier, target: PaidTier): string[] =>
  TIER_FEATURE_MATRIX.filter(
    (r): r is TierCheckRow => r.kind === "check" && !r.tiers[current] && r.tiers[target],
  ).map((r) => r.label);

export const TIER_FEATURE_MATRIX: TierFeatureRow[] = [
  // Limits (kept from the current pricing page)
  { kind: "value", label: "Credits / month", values: { lite: "40", starter: "100", professional: "250", enterprise: "500" } },
  { kind: "value", label: "Images / month", values: { lite: "20", starter: "50", professional: "125", enterprise: "250" } },

  // Per-tool rows (replaces the old grouped "Access to all Floowy tools" line)
  { kind: "check", label: "Ads Studio", tiers: check(true, true, true, true) },
  { kind: "check", label: "Ambience Studio", tiers: check(true, true, true, true) },
  { kind: "check", label: "Creator Studio", tiers: check(true, true, true, true) },
  { kind: "check", label: "Fashion Studio", tiers: check(true, true, true, true) },
  { kind: "check", label: "Flatlay Studio", tiers: check(true, true, true, true) },
  { kind: "check", label: "Idea Studio", tiers: check(true, true, true, true) },
  { kind: "check", label: "Listing Studio", tiers: check(true, true, true, true) },
  { kind: "check", label: "Fashion Video Studio", tiers: check(false, true, true, true) },
  { kind: "check", label: "Video Recreation Studio", tiers: check(false, true, true, true) },
  { kind: "check", label: "Virtual Video Studio", tiers: check(false, true, true, true) },
  { kind: "check", label: "Fashion Studio Pro (bulk)", tiers: check(false, false, true, true) },
  { kind: "check", label: "Social Scraper (1 platform)", tiers: check(false, true, false, false) },
  { kind: "check", label: "Social Scraper (all platforms)", tiers: check(false, false, true, true) },
  { kind: "check", label: "Scraper reports (PDF)", tiers: check(false, false, true, true) },

  // Account features (kept from the current pricing page)
  { kind: "check", label: "Priority generation queue", tiers: check(false, false, true, true) },
  { kind: "check", label: "Priority support", tiers: check(false, false, true, true) },
  { kind: "check", label: "Account manager", tiers: check(false, false, false, true) },
  { kind: "check", label: "API access", tiers: check(false, false, false, true) },
];
