import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Lightbulb, ChevronRight, Check } from "lucide-react";

export interface ToolTourStep {
  /** Value of the `data-walkthrough-target` attribute on the page. */
  target: string;
  title: string;
  body: string;
  /** Optional preferred placement for the tooltip relative to the target. */
  placement?: "auto" | "top" | "bottom" | "left" | "right" | "side";
}

interface Props {
  /** Stable key stored in `profiles.tool_walkthroughs_seen`. */
  toolKey: string;
  /** Route this tour belongs to (e.g. `/tool/fashion`). */
  route: string;
  steps: ToolTourStep[];
}

/**
 * Generic per-tool first-time walkthrough. Renders a spotlight + tooltip
 * sequence the first time a logged-in user lands on a given tool page.
 * Tracks completion in `profiles.tool_walkthroughs_seen[toolKey]`.
 */
const ToolWalkthroughTour = ({ toolKey, route, steps }: Props) => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(1);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const onRoute = location.pathname === route;

  // Decide whether to show on mount: only when the user has never seen this
  // tool's tour and they are on the tool page.
  useEffect(() => {
    if (!onRoute) return;
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      const { data } = await supabase
        .from("profiles")
        .select("tool_walkthroughs_seen, onboarding_completed, walkthrough_completed")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled || !data) return;
      // Don't surface on top of onboarding or the main sidebar walkthrough.
      if (!data.onboarding_completed || !data.walkthrough_completed) return;
      const seen = (data as any).tool_walkthroughs_seen as Record<string, boolean> | null;
      if (!seen?.[toolKey]) {
        setStepIndex(1);
        setActive(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [onRoute, toolKey]);

  const markSeen = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("tool_walkthroughs_seen")
      .eq("id", user.id)
      .maybeSingle();
    const next = { ...(((data as any)?.tool_walkthroughs_seen as Record<string, boolean>) ?? {}), [toolKey]: true };
    await supabase.from("profiles").update({ tool_walkthroughs_seen: next } as any).eq("id", user.id);
  }, [toolKey]);

  // Track target element
  const current = steps[stepIndex - 1];
  useEffect(() => {
    if (!active || !current || isMobile) return;
    let raf = 0;
    let attempts = 0;
    const tick = () => {
      const el = document.querySelector(`[data-walkthrough-target="${current.target}"]`) as HTMLElement | null;
      if (el) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          if (r.top < 80 || r.bottom > window.innerHeight - 40) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
          }
          setTargetRect(r);
        } else setTargetRect(null);
      } else setTargetRect(null);
      attempts++;
      if (attempts < 240) raf = requestAnimationFrame(tick);
    };
    tick();
    const onResize = () => {
      const el = document.querySelector(`[data-walkthrough-target="${current.target}"]`) as HTMLElement | null;
      if (el) setTargetRect(el.getBoundingClientRect());
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [current, active, isMobile]);

  const handleNext = useCallback(async () => {
    if (stepIndex < steps.length) setStepIndex((s) => s + 1);
    else {
      await markSeen();
      setActive(false);
    }
  }, [stepIndex, steps.length, markSeen]);

  const handleBack = useCallback(() => {
    if (stepIndex > 1) setStepIndex((s) => s - 1);
  }, [stepIndex]);

  // Block Escape (non-dismissible). Allow Enter/Arrow navigation.
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); return; }
      if (e.key === "Enter" || e.key === "ArrowRight") { e.preventDefault(); handleNext(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); handleBack(); }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [active, handleNext, handleBack]);

  if (!active || !onRoute || !current) return null;

  const TOTAL = steps.length;

  if (isMobile) {
    return createPortal(
      <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
        <div className="bg-popover border border-border rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in-0 slide-in-from-bottom-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-primary uppercase tracking-wide">Step {stepIndex} of {TOTAL}</div>
              <h3 className="text-base font-bold text-foreground mt-0.5">{current.title}</h3>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-5 leading-relaxed">{current.body}</p>
          <div className="flex items-center justify-between gap-3">
            <div className="flex gap-1.5">
              {steps.map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all ${i + 1 === stepIndex ? "w-6 bg-primary" : i + 1 < stepIndex ? "w-1.5 bg-primary/60" : "w-1.5 bg-muted-foreground/30"}`} />
              ))}
            </div>
            <div className="flex items-center gap-2">
              {stepIndex > 1 && <Button size="sm" variant="ghost" onClick={handleBack}>Back</Button>}
              <Button size="sm" onClick={handleNext}>
                {stepIndex === TOTAL ? <>Finish <Check className="w-4 h-4 ml-1" /></> : <>Next <ChevronRight className="w-4 h-4 ml-1" /></>}
              </Button>
            </div>
          </div>
        </div>
      </div>,
      document.body,
    );
  }

  if (!targetRect) {
    // Target not on the page (yet). Render a centered tooltip without spotlight
    // so the tour still works on pages that don't have all anchors wired up.
    return createPortal(
      <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-popover border border-border rounded-xl shadow-2xl p-5 w-full max-w-md animate-in fade-in-0 zoom-in-95">
          <div className="flex items-start gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-primary uppercase tracking-wide">Step {stepIndex} of {TOTAL}</div>
              <h3 className="text-base font-bold text-foreground mt-0.5">{current.title}</h3>
            </div>
          </div>
          <p className="text-[14px] text-muted-foreground leading-[1.5] mb-4">{current.body}</p>
          <div className="flex items-center justify-between gap-3">
            <div className="flex gap-1.5">
              {steps.map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all ${i + 1 === stepIndex ? "w-6 bg-primary" : i + 1 < stepIndex ? "w-1.5 bg-primary/60" : "w-1.5 bg-muted-foreground/30"}`} />
              ))}
            </div>
            <div className="flex items-center gap-2">
              {stepIndex > 1 && <Button size="sm" variant="ghost" onClick={handleBack}>Back</Button>}
              <Button size="sm" onClick={handleNext}>
                {stepIndex === TOTAL ? <>Finish <Check className="w-4 h-4 ml-1" /></> : <>Next <ChevronRight className="w-4 h-4 ml-1" /></>}
              </Button>
            </div>
          </div>
        </div>
      </div>,
      document.body,
    );
  }

  const tooltipWidth = 360;
  const pad = 10;
  const gap = 18;
  let left: number;
  let top: number;
  let transform = "none";
  if (current.placement === "top") {
    left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
    top = targetRect.top - gap;
    transform = "translateY(-100%)";
    left = Math.max(12, Math.min(left, window.innerWidth - tooltipWidth - 12));
  } else if (current.placement === "bottom") {
    left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
    top = targetRect.bottom + gap;
    left = Math.max(12, Math.min(left, window.innerWidth - tooltipWidth - 12));
  } else if (current.placement === "left" || current.placement === "right" || current.placement === "side") {
    const targetCenterX = targetRect.left + targetRect.width / 2;
    const preferRight =
      current.placement === "right" ||
      (current.placement === "side" && targetCenterX < window.innerWidth / 2);
    top = targetRect.top + targetRect.height / 2;
    transform = "translateY(-50%)";
    if (preferRight) {
      left = targetRect.right + gap;
      if (left + tooltipWidth + 12 > window.innerWidth) {
        left = Math.max(12, targetRect.left - gap - tooltipWidth);
      }
    } else {
      left = targetRect.left - gap - tooltipWidth;
      if (left < 12) {
        left = Math.min(targetRect.right + gap, window.innerWidth - tooltipWidth - 12);
      }
    }
  } else {
    left = targetRect.right + gap;
    top = targetRect.top + targetRect.height / 2;
    transform = "translateY(-50%)";
    if (left + tooltipWidth + 12 > window.innerWidth) {
      const leftSide = targetRect.left - gap - tooltipWidth;
      if (leftSide >= 12) left = leftSide;
      else {
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        top = targetRect.bottom + gap;
        transform = "none";
        left = Math.max(12, Math.min(left, window.innerWidth - tooltipWidth - 12));
      }
    }
  }

  return createPortal(
    <>
      <div className="fixed inset-0 z-[9998]">
        <div
          className="absolute pointer-events-none transition-all duration-200"
          style={{
            top: targetRect.top - pad,
            left: targetRect.left - pad,
            width: targetRect.width + pad * 2,
            height: targetRect.height + pad * 2,
            borderRadius: 12,
            boxShadow:
              "0 0 0 9999px hsl(0 0% 0% / 0.6), 0 0 0 2px hsl(var(--primary)), 0 0 28px 6px hsl(var(--primary) / 0.55)",
          }}
        />
      </div>
      <div className="fixed z-[9999] animate-in fade-in-0 zoom-in-95 duration-200" style={{ left, top, width: tooltipWidth, transform }}>
        <div className="bg-popover border border-border rounded-xl shadow-2xl p-5 relative">
          <div className="flex items-start gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-primary uppercase tracking-wide">Step {stepIndex} of {TOTAL}</div>
              <h3 className="text-base font-bold text-foreground mt-0.5">{current.title}</h3>
            </div>
          </div>
          <p className="text-[14px] text-muted-foreground leading-[1.5] mb-4">{current.body}</p>
          <div className="flex items-center justify-between gap-3">
            <div className="flex gap-1.5">
              {steps.map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all ${i + 1 === stepIndex ? "w-6 bg-primary" : i + 1 < stepIndex ? "w-1.5 bg-primary/60" : "w-1.5 bg-muted-foreground/30"}`} />
              ))}
            </div>
            <div className="flex items-center gap-2">
              {stepIndex > 1 && <Button size="sm" variant="ghost" onClick={handleBack}>Back</Button>}
              <Button size="sm" onClick={handleNext}>
                {stepIndex === TOTAL ? <>Finish <Check className="w-4 h-4 ml-1" /></> : <>Next <ChevronRight className="w-4 h-4 ml-1" /></>}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
};

export default ToolWalkthroughTour;