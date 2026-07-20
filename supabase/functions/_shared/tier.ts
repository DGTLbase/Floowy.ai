// Backend mirror of src/lib/tier-access.ts — tier gating for edge functions.
// Keep this in sync with the frontend matrix. Import from any function:
//   import { getUserTier, isAdmin, tierMeets, tierDenied } from "../_shared/tier.ts";

export type Tier = "free" | "lite" | "starter" | "professional" | "enterprise";

export const TIER_RANK: Record<Tier, number> = {
  free: 0,
  lite: 1,
  starter: 2,
  professional: 3,
  enterprise: 4,
};

const TIER_NAMES: Tier[] = ["free", "lite", "starter", "professional", "enterprise"];

export const normalizeTier = (plan?: string | null): Tier => {
  const t = (plan || "free").toLowerCase();
  return (TIER_NAMES as string[]).includes(t) ? (t as Tier) : "free";
};

export const tierMeets = (plan: string | null | undefined, required: Tier): boolean =>
  TIER_RANK[normalizeTier(plan)] >= TIER_RANK[required];

/** Minimum tier per tool id (mirrors src/lib/tier-access.ts TOOL_MIN_TIER). */
export const TOOL_MIN_TIER: Record<string, Tier> = {
  "ads-studio": "lite",
  "ambience": "lite",
  "creator-studio": "lite",
  "fashion": "lite",
  "flatlay": "lite",
  "idea-studio": "lite",
  "listing-studio": "lite",
  "fashion-video": "starter",
  "video-recreation": "starter",
  "virtual-video": "starter",
  "social-scraper": "starter",
  "fashion-pro": "professional",
};

/** Max distinct platforms a tier may scrape per month (null = unlimited, 0 = none). */
export const scraperPlatformLimit = (plan: string | null | undefined): number | null => {
  if (tierMeets(plan, "professional")) return null;
  if (tierMeets(plan, "starter")) return 1;
  return 0;
};

/** Export / PDF report generation is Professional+ only. */
export const canExportScraperReports = (plan: string | null | undefined): boolean =>
  tierMeets(plan, "professional");

/** Read a user's tier from profiles.plan (defaults to "free"). */
export async function getUserTier(supabase: any, userId: string): Promise<Tier> {
  const { data } = await supabase.from("profiles").select("plan").eq("id", userId).maybeSingle();
  return normalizeTier(data?.plan);
}

/** True when the user has the admin role (admins bypass all tier gates). */
export async function isAdmin(supabase: any, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  return !!data;
}

const titleCase = (t: Tier) => t.charAt(0).toUpperCase() + t.slice(1);

/** Standard 403 for a tier-gated action. */
export const tierDenied = (requiredTier: Tier, corsHeaders: Record<string, string>) =>
  new Response(
    JSON.stringify({
      error: `This feature requires the ${titleCase(requiredTier)} plan or higher.`,
      upgrade: true,
      requiredTier,
    }),
    { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
