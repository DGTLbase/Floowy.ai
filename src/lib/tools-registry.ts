// AI Tools Dashboard — data-driven inventory.
//
// This registry is the single source of truth for the "Your AI Tools" dashboard
// (see src/components/dashboard/ToolsDashboard.tsx). Per the Layout Redesign
// briefing (v1.0), new tools are added here and assigned a category + type; the
// dashboard picks them up automatically — no layout changes required.

import type { LucideIcon } from "lucide-react";
import { Film, Scissors } from "lucide-react";
import { TOOL_MIN_TIER, type Tier } from "@/lib/tier-access";

import fashionCover from "@/assets/fashion-cover-new-5.png";
import fashionProCover from "@/assets/fashion-pro-cover.png";
import flatlayStudioCover from "@/assets/Flatlay-2.png";
import fashionVideoDemo from "@/assets/fashion-video-demo.mp4";
import atmosphericCover from "@/assets/Ambience-6.png";
import creatorStudioCover from "@/assets/creator-feature-video-new.mp4";
import ideaStudioCover from "@/assets/idea-studio-hero-after.png";
import adsStudioPreview from "@/assets/ads-studio-preview.png";
import listingStudioPreview from "@/assets/listing-studio-preview.png";
import virtualVideoStudioCover from "@/assets/virtual-studio-cover.mp4";
import socialScraperCover from "@/assets/social-scraper-cover.png";

import { canAccessFashionStudio } from "@/lib/fashion-video-config";
import { canAccessVideoRecreation } from "@/lib/video-recreation-config";
import { canAccessSocialScraper } from "@/lib/social-scraper-access";

export type ToolType = "image" | "video";
export type ToolCategoryId = "fashion" | "product" | "content" | "ads" | "video";

// How a tool decides whether/how it is shown to the current user.
//  - "public":      always available.
//  - "plan":        plan/entitlement gated (uses `planKey` + hasToolAccess()).
//                   Shown to everyone; locked with an Upgrade CTA when no access.
//  - "allowlist":   limited preview. Hidden entirely unless `allow(email)` passes.
//  - "coming-soon": in the inventory but no live tool page yet. Rendered with a
//                   disabled CTA so there are never dead links.
export type ToolAccess = "public" | "plan" | "allowlist" | "coming-soon";

export interface ToolCategoryMeta {
  id: ToolCategoryId;
  /** Pill label + section header on narrow viewports. */
  label: string;
  /** Optional wider-screen section header (e.g. "Content and creative"). */
  wideLabel?: string;
}

export const TOOL_CATEGORIES: ToolCategoryMeta[] = [
  { id: "fashion", label: "Fashion" },
  { id: "product", label: "Product" },
  { id: "content", label: "Content", wideLabel: "Content and creative" },
  { id: "ads", label: "Ads and listings" },
  { id: "video", label: "Video" },
];

export interface ToolDef {
  id: string;
  name: string;
  /** Green uppercase label above the tool name (matches the category pill). */
  categoryLabel: string;
  category: ToolCategoryId;
  /** Extra sections this tool should also appear in (besides `category`). */
  secondaryCategories?: ToolCategoryId[];
  type: ToolType;
  description: string;
  /** Route to open when the card is activated (omit for coming-soon tools). */
  route?: string;
  /** Cover thumbnail. Falls back to `icon` on a gray background when absent. */
  cover?: string;
  coverType?: "image" | "video";
  /** Icon used as the thumbnail when there is no cover image. */
  icon?: LucideIcon;
  /** "New" badge (top-left, Floowy green). Removed ~30 days after launch. */
  isNew?: boolean;
  /** Tier badge (top-left), e.g. "Pro" or "Special". */
  badge?: string;
  access: ToolAccess;
  /** Entitlement key for access === "plan" (see Home.hasToolAccess). */
  planKey?: string;
  /**
   * For access === "plan": hide the card entirely when the user lacks access,
   * instead of showing it locked with an Upgrade CTA. Used for internal /
   * special-grant tools that shouldn't be advertised to everyone.
   */
  hideWhenLocked?: boolean;
  /** Visibility predicate for access === "allowlist". */
  allow?: (email?: string | null) => boolean;
}

export const TOOLS: ToolDef[] = [
  // ── Fashion ────────────────────────────────────────────────────────────────
  {
    id: "fashion",
    name: "Fashion Studio",
    categoryLabel: "Fashion",
    category: "fashion",
    type: "image",
    description: "On-model fashion photography with AI styling.",
    route: "/tool/fashion",
    cover: fashionCover,
    coverType: "image",
    access: "public",
  },
  {
    id: "fashion-pro",
    name: "Fashion Studio Pro",
    categoryLabel: "Fashion",
    category: "fashion",
    type: "image",
    description: "Multi-angle fashion shoots at scale.",
    route: "/tool/ultimate-outfit-maker",
    cover: fashionProCover,
    coverType: "image",
    badge: "Pro",
    access: "plan",
    planKey: "ultimate-outfit-maker",
  },
  {
    // Internal / special-grant tool — hidden unless explicitly granted.
    id: "outfit-maker-v2",
    name: "Outfit Maker 2.0",
    categoryLabel: "Fashion",
    category: "fashion",
    type: "image",
    description: "Hairstyles, poses and outfit swaps at scale.",
    route: "/tool/ultimate-outfit-maker-v2",
    cover: fashionProCover,
    coverType: "image",
    badge: "Special",
    access: "plan",
    planKey: "ultimate-outfit-maker-v2",
    hideWhenLocked: true,
  },
  {
    // Internal / special-grant tool — hidden unless explicitly granted.
    id: "outfit-maker-ck",
    name: "Outfit Maker CK",
    categoryLabel: "Fashion",
    category: "fashion",
    type: "image",
    description: "Clothing transfer onto any model.",
    route: "/tool/simple-pose-maker",
    cover: fashionCover,
    coverType: "image",
    badge: "Special",
    access: "plan",
    planKey: "simple_pose_maker",
    hideWhenLocked: true,
  },
  {
    id: "flatlay",
    name: "Flatlay Studio",
    categoryLabel: "Fashion",
    category: "fashion",
    type: "image",
    description: "Top-down styled flatlay photography.",
    route: "/tool/flatlay-studio",
    cover: flatlayStudioCover,
    coverType: "image",
    access: "public",
  },
  {
    id: "fashion-video",
    name: "Fashion Video Studio",
    categoryLabel: "Fashion",
    category: "fashion",
    type: "video",
    description: "Styled fashion videos — no model needed.",
    route: "/tool/fashion-video-studio",
    cover: fashionVideoDemo,
    coverType: "video",
    isNew: true,
    access: "allowlist",
    allow: canAccessFashionStudio,
  },

  // ── Product ──────────────────────────────────────────────────────────────
  {
    id: "ambience",
    name: "Ambience Studio",
    categoryLabel: "Product",
    category: "product",
    type: "image",
    description: "Atmospheric product photography in any setting.",
    route: "/tool/atmospheric",
    cover: atmosphericCover,
    coverType: "image",
    access: "public",
  },
  {
    id: "product-reel",
    name: "Product Reel Studio",
    categoryLabel: "Product",
    category: "product",
    type: "video",
    description: "Cinematic product hero videos from one image.",
    icon: Film,
    isNew: true,
    access: "coming-soon",
  },

  // ── Content and creative ─────────────────────────────────────────────────
  {
    id: "creator-studio",
    name: "Creator Studio",
    categoryLabel: "Video",
    category: "video",
    secondaryCategories: ["content"],
    type: "video",
    description: "UGC-style product videos with cuts, angles and Omni editing.",
    route: "/tool/creator-studio",
    cover: creatorStudioCover,
    coverType: "video",
    access: "plan",
    planKey: "creator-studio",
  },
  {
    id: "idea-studio",
    name: "Idea Studio",
    categoryLabel: "Content",
    category: "content",
    type: "image",
    description: "Recreate inspired visuals and iterate creatives.",
    route: "/tool/idea-studio",
    cover: ideaStudioCover,
    coverType: "image",
    access: "plan",
    planKey: "idea-studio",
  },
  {
    id: "video-recreation",
    name: "Video Recreation Studio",
    categoryLabel: "Content",
    category: "content",
    type: "video",
    description: "Transform any existing video with AI edits.",
    route: "/tool/video-recreation-studio",
    icon: Film,
    isNew: true,
    access: "allowlist",
    allow: canAccessVideoRecreation,
  },
  {
    id: "social-clip",
    name: "Social Clip Studio",
    categoryLabel: "Content",
    category: "content",
    type: "video",
    description: "Turn any video into 5 social-ready reels.",
    icon: Scissors,
    isNew: true,
    access: "coming-soon",
  },
  {
    // Research tool — limited preview. Not part of the public briefing inventory
    // but kept working for allowlisted users; hidden for everyone else.
    id: "social-scraper",
    name: "Social Scraper",
    categoryLabel: "Content",
    category: "content",
    type: "image",
    description: "Research top-performing social content.",
    route: "/tool/social-scraper",
    cover: socialScraperCover,
    coverType: "image",
    access: "allowlist",
    allow: canAccessSocialScraper,
  },

  // ── Ads and listings ─────────────────────────────────────────────────────
  {
    id: "ads-studio",
    name: "Ads Studio",
    categoryLabel: "Ads",
    category: "ads",
    type: "image",
    description: "High-converting ad creatives for all platforms.",
    route: "/tool/ads-listing-studio",
    cover: adsStudioPreview,
    coverType: "image",
    access: "public",
  },
  {
    id: "listing-studio",
    name: "Listing Studio",
    categoryLabel: "Ads",
    category: "ads",
    type: "image",
    description: "Marketplace-ready product listings that convert.",
    route: "/tool/listing-studio",
    cover: listingStudioPreview,
    coverType: "image",
    access: "public",
  },

  // ── Video ────────────────────────────────────────────────────────────────
  {
    id: "virtual-video",
    name: "Virtual Video Studio",
    categoryLabel: "Video",
    category: "video",
    type: "video",
    description: "Cinematic marketing videos from product images.",
    route: "/tool/property-studio",
    cover: virtualVideoStudioCover,
    coverType: "video",
    access: "public",
  },
];

/** Minimum tier required to open the tool served at `pathname` (undefined = not tier-gated). */
export const routeMinTier = (pathname: string): Tier | undefined => {
  const tool = TOOLS.find((t) => t.route === pathname);
  return tool ? TOOL_MIN_TIER[tool.id] : undefined;
};
