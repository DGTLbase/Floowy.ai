import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LayoutGrid, Image as ImageIcon, Video as VideoIcon, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  TOOLS,
  TOOL_CATEGORIES,
  type ToolDef,
  type ToolType,
  type ToolCategoryId,
} from "@/lib/tools-registry";
import { TOOL_MIN_TIER, tierMeets, TIER_NAME } from "@/lib/tier-access";
import { useUpsell } from "@/hooks/useUpsell";

type TypeFilter = "all" | ToolType;
type CategoryFilter = "all" | ToolCategoryId;

interface ToolsDashboardProps {
  /** Current user's email — drives allowlist visibility. */
  email?: string | null;
  /** Plan/entitlement check for access === "plan" tools. */
  hasToolAccess: (planKey: string) => boolean;
  /** Current user's subscription tier (profiles.plan) — drives tier gating. */
  userPlan?: string | null;
  /** Admins bypass all tier gates. */
  isAdmin?: boolean;
}

const TYPE_OPTIONS: { value: TypeFilter; label: string; Icon: typeof LayoutGrid }[] = [
  { value: "all", label: "All", Icon: LayoutGrid },
  { value: "image", label: "Images", Icon: ImageIcon },
  { value: "video", label: "Videos", Icon: VideoIcon },
];

// Resolve how a tool should render for the current user.
type ToolState = "open" | "locked" | "coming-soon";

const ToolsDashboard = ({ email, hasToolAccess, userPlan, isAdmin }: ToolsDashboardProps) => {
  const navigate = useNavigate();
  const { showLockedToolUpsell } = useUpsell();
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");

  // Tools the current user is allowed to see at all. Tier-gated tools stay
  // VISIBLE even when locked, so the upgrade path is obvious (briefing §5).
  // Allowlist + special-grant (hideWhenLocked) tools are still hidden when the
  // user lacks access.
  const visibleTools = useMemo(
    () =>
      TOOLS.filter((t) => {
        if (TOOL_MIN_TIER[t.id]) return true; // tier-gated → always shown (locked if below tier)
        if (t.access === "allowlist") return t.allow?.(email) ?? false;
        if (t.access === "plan" && t.hideWhenLocked && t.planKey) return hasToolAccess(t.planKey);
        return true;
      }),
    [email, hasToolAccess],
  );

  const resolveState = (tool: ToolDef): ToolState => {
    if (tool.access === "coming-soon") return "coming-soon";
    // Tier gate (Tier Briefing): admins bypass; otherwise the user's plan must
    // meet the tool's minimum tier, else it renders locked with an upgrade CTA.
    const minTier = TOOL_MIN_TIER[tool.id];
    if (minTier) {
      if (isAdmin || tierMeets(userPlan, minTier)) return "open";
      return "locked";
    }
    if (tool.access === "plan" && tool.planKey && !hasToolAccess(tool.planKey)) return "locked";
    return "open";
  };

  // A tool belongs to its primary category plus any secondary categories.
  const inCategory = (tool: ToolDef, id: ToolCategoryId) =>
    tool.category === id || (tool.secondaryCategories?.includes(id) ?? false);

  const matchesFilters = (tool: ToolDef) =>
    (typeFilter === "all" || tool.type === typeFilter) &&
    (categoryFilter === "all" || inCategory(tool, categoryFilter));

  // Only offer category pills that actually have at least one visible tool.
  const availableCategoryIds = useMemo(
    () =>
      new Set(
        visibleTools.flatMap((t) => [t.category, ...(t.secondaryCategories ?? [])]),
      ),
    [visibleTools],
  );

  const activateTool = (tool: ToolDef, state: ToolState) => {
    if (state === "coming-soon") return;
    if (state === "locked") {
      // Contextual upsell for the locked tool; fall back to /payment if the
      // upsell is capped (frequency limits) or not applicable.
      if (!showLockedToolUpsell(tool.id)) navigate("/payment");
      return;
    }
    if (tool.route) navigate(tool.route);
  };

  return (
    <section className="mb-12">
      {/* Page title */}
      <h2 className="text-2xl font-semibold mb-5">
        <span className="text-foreground">Your AI</span> <span className="text-primary">Tools</span>
      </h2>

      {/* Filter bar — sticky below the title */}
      <div className="sticky top-0 z-20 -mx-2 mb-8 flex flex-col gap-3 bg-background/90 px-2 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/70 sm:flex-row sm:flex-wrap sm:items-center">
        {/* Type toggle (segmented control) */}
        <div
          role="tablist"
          aria-label="Filter tools by type"
          className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-border bg-muted/50 p-1"
        >
          {TYPE_OPTIONS.map(({ value, label, Icon }) => {
            const active = typeFilter === value;
            return (
              <button
                key={value}
                role="tab"
                aria-selected={active}
                onClick={() => setTypeFilter(value)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            );
          })}
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap items-center gap-2">
          <CategoryPill
            active={categoryFilter === "all"}
            onClick={() => setCategoryFilter("all")}
          >
            All categories
          </CategoryPill>
          {TOOL_CATEGORIES.filter((c) => availableCategoryIds.has(c.id)).map((c) => (
            <CategoryPill
              key={c.id}
              active={categoryFilter === c.id}
              onClick={() => setCategoryFilter(c.id)}
            >
              {c.label}
            </CategoryPill>
          ))}
        </div>
      </div>

      {/* Categorised sections */}
      <div className="space-y-10">
        {TOOL_CATEGORIES.map((category) => {
          const sectionTools = visibleTools.filter(
            (t) => inCategory(t, category.id) && matchesFilters(t),
          );
          if (sectionTools.length === 0) return null;

          return (
            <div key={category.id}>
              {/* Section header */}
              <div className="mb-4 flex items-center gap-3">
                <h3 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {category.wideLabel ? (
                    <>
                      <span className="hidden md:inline">{category.wideLabel}</span>
                      <span className="md:hidden">{category.label}</span>
                    </>
                  ) : (
                    category.label
                  )}
                </h3>
                <span className="rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {sectionTools.length} {sectionTools.length === 1 ? "tool" : "tools"}
                </span>
                <span className="h-px flex-1 bg-border" />
              </div>

              {/* Tool grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {sectionTools.map((tool) => (
                  <ToolCard
                    key={tool.id}
                    tool={tool}
                    state={resolveState(tool)}
                    onActivate={activateTool}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

const CategoryPill = ({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    aria-pressed={active}
    className={cn(
      "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
      active
        ? "border-primary bg-primary/15 text-primary"
        : "border-border bg-muted/40 text-muted-foreground hover:text-foreground",
    )}
  >
    {children}
  </button>
);

const TypeBadge = ({ type }: { type: ToolType }) =>
  type === "image" ? (
    <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary backdrop-blur-sm">
      Image
    </span>
  ) : (
    <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-[10px] font-semibold text-sky-400 backdrop-blur-sm">
      Video
    </span>
  );

const ToolCard = ({
  tool,
  state,
  onActivate,
}: {
  tool: ToolDef;
  state: ToolState;
  onActivate: (tool: ToolDef, state: ToolState) => void;
}) => {
  const Icon = tool.icon;
  const clickable = state !== "coming-soon";

  // For tier-locked tools, name the tier that unlocks it (briefing §6).
  const requiredTier = TOOL_MIN_TIER[tool.id];
  const ctaLabel =
    state === "locked"
      ? requiredTier
        ? `Available from ${TIER_NAME[requiredTier]}`
        : "Upgrade Plan"
      : state === "coming-soon"
        ? "Coming soon"
        : "Start creating";

  return (
    <div
      onClick={() => onActivate(tool, state)}
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all duration-300",
        clickable
          ? "cursor-pointer hover:-translate-y-1 hover:shadow-glow"
          : "cursor-default opacity-80",
      )}
    >
      {/* Thumbnail */}
      <div className="relative h-[150px] overflow-hidden bg-muted">
        {tool.cover ? (
          tool.coverType === "video" ? (
            <video
              src={tool.cover}
              className="h-full w-full object-cover object-[center_30%]"
              autoPlay
              muted
              loop
              playsInline
            />
          ) : (
            <img
              src={tool.cover}
              alt={tool.name}
              loading="lazy"
              className="h-full w-full object-cover object-[center_30%] transition-transform duration-500 group-hover:scale-105"
            />
          )
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground/60">
            {Icon ? <Icon className="h-8 w-8" strokeWidth={1.5} /> : null}
          </div>
        )}

        {/* Top-left: New / tier badge */}
        <div className="absolute left-2 top-2 flex gap-1">
          {tool.badge && (
            <span className="rounded-full bg-amber-500/90 px-2 py-0.5 text-[10px] font-semibold text-white">
              {tool.badge}
            </span>
          )}
          {tool.isNew && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
              New
            </span>
          )}
        </div>

        {/* Top-right: type badge */}
        <div className="absolute right-2 top-2">
          <TypeBadge type={tool.type} />
        </div>

        {/* Locked overlay */}
        {state === "locked" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="text-center text-white">
              <Lock className="mx-auto mb-1 h-6 w-6" />
              <p className="text-[11px] font-semibold">Upgrade to unlock</p>
            </div>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-3">
        <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
          {tool.categoryLabel}
        </p>
        <h4 className="text-[13px] font-medium text-foreground">{tool.name}</h4>
        <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">{tool.description}</p>

        <Button
          size="sm"
          variant="outline"
          disabled={state === "coming-soon"}
          onClick={(e) => {
            e.stopPropagation();
            onActivate(tool, state);
          }}
          className="mt-3 w-full border-primary bg-transparent text-primary hover:bg-primary hover:text-primary-foreground disabled:opacity-60"
        >
          {ctaLabel}
        </Button>
      </div>
    </div>
  );
};

export default ToolsDashboard;
