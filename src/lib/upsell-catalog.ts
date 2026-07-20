// In-app upsell catalog — source of truth is the plan feature matrix, so upsell
// copy always matches the pricing table. (In-app upsells briefing.)
// These users already pay: NO €1 trial anywhere. The only incentive is the 42%
// first-month discount on step 3.

import { SUBSCRIPTION_PLANS } from "@/lib/stripe-config";
import {
  TOOL_MIN_TIER,
  gainedFeaturesOnUpgrade,
  normalizeTier,
  TIER_NAME,
  TIER_RANK,
  tierMeets,
  type PaidTier,
} from "@/lib/tier-access";
import { TOOLS } from "@/lib/tools-registry";
import fashionVideoUpsellPreview from "@/assets/fashion-video-upsell-preview.mp4";

export type UpsellTrigger = "behaviour" | "locked-click" | "limit";

export interface Upsell {
  /** Stable id for frequency caps + analytics (trigger + target). */
  id: string;
  trigger: UpsellTrigger;
  toTier: PaidTier;
  planName: string;
  /** Monthly price of the target plan. */
  price: number;
  /** 42%-off first-month price. */
  discountedPrice: number;
  eyebrow: string;
  title: string;
  lead: string;
  /** Step 1 "upgrade unlocks" list. */
  unlocks: string[];
  /** Step 2 loss-aversion "still locked" list. */
  stillLocked: string[];
  previewLabel: string;
  /** Optional looping video preview (shown instead of the gradient placeholder). */
  previewVideo?: string;
  /** Tool route to drop the user into after upgrading. */
  openRoute?: string;
}

const PAID_ORDER: PaidTier[] = ["lite", "starter", "professional", "enterprise"];
const nextTierOf = (t: PaidTier): PaidTier | null => PAID_ORDER[PAID_ORDER.indexOf(t) + 1] ?? null;

const priceOf = (t: PaidTier) => SUBSCRIPTION_PLANS[t].monthly.price;
const creditsOf = (t: PaidTier) => SUBSCRIPTION_PLANS[t].monthly.credits;
const imagesOf = (t: PaidTier) => Math.round(creditsOf(t) / 2);
const routeForTool = (toolId: string) => TOOLS.find((t) => t.id === toolId)?.route;

/** Feature + volume unlocks going from `from` to `to`, for the step-1 list. */
const unlocksList = (from: PaidTier, to: PaidTier): string[] => {
  const feats = gainedFeaturesOnUpgrade(from, to);
  const list = [...feats];
  if (creditsOf(to) > creditsOf(from)) {
    list.push(`${creditsOf(to)} credits and ${imagesOf(to)} images per month`);
  }
  return list;
};

/** Loss-aversion list for step 2: same unlocks framed as still-locked, incl. extras. */
const stillLockedList = (from: PaidTier, to: PaidTier): string[] => {
  const feats = gainedFeaturesOnUpgrade(from, to);
  const list = [...feats];
  const creditGain = creditsOf(to) - creditsOf(from);
  const imgGain = imagesOf(to) - imagesOf(from);
  if (creditGain > 0) list.push(`${creditGain} extra credits and ${imgGain} extra images`);
  return list;
};

const build = (
  from: PaidTier,
  to: PaidTier,
  trigger: UpsellTrigger,
  copy: { id: string; eyebrow: string; title: string; lead: string; previewLabel: string; previewVideo?: string; openRoute?: string },
): Upsell => ({
  id: copy.id,
  trigger,
  toTier: to,
  planName: TIER_NAME[to],
  price: priceOf(to),
  discountedPrice: Math.round(priceOf(to) * 0.58 * 100) / 100, // 42% off, 2dp
  eyebrow: copy.eyebrow,
  title: copy.title,
  lead: copy.lead,
  unlocks: unlocksList(from, to),
  stillLocked: stillLockedList(from, to),
  previewLabel: copy.previewLabel,
  previewVideo: copy.previewVideo,
  openRoute: copy.openRoute,
});

/* ── Behaviour triggers (after N generations in a studio) ───────────────────
   Keyed by the studio id the user just used; each entry names the fromTier it
   applies to and the target upsell. */
interface BehaviourDef {
  fromTier: PaidTier;
  toTier: PaidTier;
  eyebrow: string;
  title: string;
  lead: string;
  previewLabel: string;
  previewVideo?: string;
  openToolId: string;
}

const BEHAVIOUR: Record<string, BehaviourDef[]> = {
  fashion: [
    { fromTier: "lite", toTier: "starter", eyebrow: "You just used Fashion Studio", title: "Make Fashion Videos too?", lead: "Turn the looks you just created into scroll-stopping video. Fashion Video Studio is included on Starter.", previewLabel: "Fashion Video preview", previewVideo: fashionVideoUpsellPreview, openToolId: "fashion-video" },
    { fromTier: "starter", toTier: "professional", eyebrow: "You just used Fashion Studio", title: "Go pro with Fashion Studio Pro", lead: "Process shoots in bulk and scale your output. Fashion Studio Pro is included on Professional.", previewLabel: "Fashion Studio Pro", openToolId: "fashion-pro" },
  ],
  // Flatlay users get the Fashion Video upsell (same as Fashion Studio).
  flatlay: [
    { fromTier: "lite", toTier: "starter", eyebrow: "You just used Flatlay Studio", title: "Bring your flatlays to life on video?", lead: "Turn your product shots into scroll-stopping video. Fashion Video Studio is included on Starter.", previewLabel: "Fashion Video preview", previewVideo: fashionVideoUpsellPreview, openToolId: "fashion-video" },
  ],
  // Fashion Video users get the Fashion Studio Pro upsell.
  "fashion-video": [
    { fromTier: "starter", toTier: "professional", eyebrow: "You just made a Fashion Video", title: "Go pro with Fashion Studio Pro", lead: "Produce shoots in bulk and scale your output. Fashion Studio Pro is included on Professional.", previewLabel: "Fashion Studio Pro", openToolId: "fashion-pro" },
  ],
  "social-scraper": [
    { fromTier: "starter", toTier: "professional", eyebrow: "You just ran the Social Scraper", title: "Scrape every platform, get reports", lead: "Unlock all platforms at once plus downloadable Scraper reports on Professional.", previewLabel: "Scraper reports", openToolId: "social-scraper" },
  ],
  "listing-studio": [
    { fromTier: "lite", toTier: "starter", eyebrow: "You just used Listing Studio", title: "Find winning content faster", lead: "Research top-performing content with the Social Scraper, included on Starter.", previewLabel: "Social Scraper", openToolId: "social-scraper" },
  ],
  "ads-studio": [
    { fromTier: "lite", toTier: "starter", eyebrow: "You just used Ads Studio", title: "Find winning content faster", lead: "Research top-performing content with the Social Scraper, included on Starter.", previewLabel: "Social Scraper", openToolId: "social-scraper" },
  ],
};

/** Behaviour upsell for a user's tier after using a given studio (or null). */
export const behaviourUpsell = (userPlan: string | null | undefined, studioId: string): Upsell | null => {
  const from = normalizeTier(userPlan);
  if (from === "free" || from === "enterprise") return null;
  const def = (BEHAVIOUR[studioId] ?? []).find((d) => d.fromTier === from);
  if (!def) return null;
  return build(from as PaidTier, def.toTier, "behaviour", {
    id: `behaviour:${studioId}:${def.toTier}`,
    eyebrow: def.eyebrow,
    title: def.title,
    lead: def.lead,
    previewLabel: def.previewLabel,
    previewVideo: def.previewVideo,
    openRoute: routeForTool(def.openToolId),
  });
};

/** Upsell shown when a user clicks a tool their tier can't open yet (or null). */
export const lockedToolUpsell = (userPlan: string | null | undefined, toolId: string): Upsell | null => {
  const from = normalizeTier(userPlan);
  const min = TOOL_MIN_TIER[toolId];
  if (from === "free" || !min || tierMeets(from, min)) return null; // not locked
  const tool = TOOLS.find((t) => t.id === toolId);
  return build(from as PaidTier, min, "locked-click", {
    id: `locked:${toolId}`,
    eyebrow: "This tool is one plan away",
    title: `Unlock ${tool?.name ?? "this studio"}`,
    lead: `${tool?.name ?? "This studio"} is included on ${TIER_NAME[min]}. Upgrade to start using it right away.`,
    previewLabel: tool?.name ?? "Preview",
    previewVideo: toolId === "fashion-video" ? fashionVideoUpsellPreview : undefined,
    openRoute: tool?.route,
  });
};

export { nextTierOf, priceOf, TIER_RANK };
