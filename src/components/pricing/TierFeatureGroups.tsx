import { Check, X } from "lucide-react";
import { type PaidTier } from "@/lib/tier-access";
import { cn } from "@/lib/utils";

/**
 * Grouped, itemised feature list for a single tier's plan card — Core Studios /
 * Video Studios / Scale and Research sections, then account features. Every tool
 * shows an explicit check (included) or cross (not included) for this tier, so
 * the upgrade path is visible inside each card. Driven by the tier matrix.
 */

const c = (lite: boolean, starter: boolean, professional: boolean, enterprise: boolean): Record<PaidTier, boolean> => ({
  lite,
  starter,
  professional,
  enterprise,
});

interface FeatureItem {
  /** Static label, or a per-tier label (e.g. the Social Scraper scope). */
  label: string | Record<PaidTier, string>;
  tiers: Record<PaidTier, boolean>;
}

interface FeatureGroup {
  label: string;
  items: FeatureItem[];
}

const GROUPS: FeatureGroup[] = [
  {
    label: "Core Studios",
    items: [
      { label: "Ads Studio", tiers: c(true, true, true, true) },
      { label: "Ambience Studio", tiers: c(true, true, true, true) },
      { label: "Creator Studio", tiers: c(true, true, true, true) },
      { label: "Fashion Studio", tiers: c(true, true, true, true) },
      { label: "Flatlay Studio", tiers: c(true, true, true, true) },
      { label: "Idea Studio", tiers: c(true, true, true, true) },
      { label: "Listing Studio", tiers: c(true, true, true, true) },
    ],
  },
  {
    label: "Video Studios",
    items: [
      { label: "Fashion Video Studio", tiers: c(false, true, true, true) },
      { label: "Video Recreation Studio", tiers: c(false, true, true, true) },
      { label: "Virtual Video Studio", tiers: c(false, true, true, true) },
    ],
  },
  {
    label: "Scale and Research",
    items: [
      {
        // Social Scraper scope depends on the tier.
        label: {
          lite: "Social Scraper",
          starter: "Social Scraper",
          professional: "Social Scraper (all platforms)",
          enterprise: "Social Scraper (all platforms)",
        },
        tiers: c(false, true, true, true),
      },
      {
        // Scraper reports: Starter gets the Insights Report only; Professional /
        // Enterprise get the full Content Plan & Insights Report.
        label: {
          lite: "Scraper reports",
          starter: "Scraper reports (Only Insights Report)",
          professional: "Scraper reports (Content Plan & Insights Report)",
          enterprise: "Scraper reports (Content Plan & Insights Report)",
        },
        tiers: c(false, true, true, true),
      },
      { label: "Fashion Studio Pro", tiers: c(false, false, true, true) },
    ],
  },
];

// Account features render at the bottom without a section header.
const ACCOUNT_FEATURES: FeatureItem[] = [
  { label: "Priority queue", tiers: c(false, false, true, true) },
  { label: "Priority support", tiers: c(false, false, true, true) },
  {
    label: {
      lite: "Account manager",
      starter: "Account manager",
      professional: "Account manager",
      enterprise: "Dedicated account manager",
    },
    tiers: c(false, false, false, true),
  },
  { label: "API access", tiers: c(false, false, false, true) },
];

const labelFor = (item: FeatureItem, tier: PaidTier) =>
  typeof item.label === "string" ? item.label : item.label[tier];

const Row = ({ included, label }: { included: boolean; label: string }) => (
  <li className="flex items-start gap-2.5">
    {included ? (
      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
    ) : (
      <X className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/40" />
    )}
    <span className={cn("text-sm", included ? "text-foreground" : "text-muted-foreground/50")}>{label}</span>
  </li>
);

interface Props {
  tier: PaidTier;
  className?: string;
}

const TierFeatureGroups = ({ tier, className }: Props) => (
  <div className={cn("space-y-5", className)}>
    {GROUPS.map((group) => (
      <div key={group.label}>
        <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          {group.label}
        </p>
        <ul className="space-y-2">
          {group.items.map((item) => (
            <Row key={labelFor(item, tier)} included={item.tiers[tier]} label={labelFor(item, tier)} />
          ))}
        </ul>
      </div>
    ))}
    <ul className="space-y-2 border-t border-border/50 pt-4">
      {ACCOUNT_FEATURES.map((item) => (
        <Row key={labelFor(item, tier)} included={item.tiers[tier]} label={labelFor(item, tier)} />
      ))}
    </ul>
  </div>
);

export default TierFeatureGroups;
