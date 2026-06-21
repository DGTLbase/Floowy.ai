import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useWalkthrough } from "@/hooks/useWalkthrough";
import { Button } from "@/components/ui/button";
import { Lightbulb, ChevronRight, Check, Sparkles } from "lucide-react";

interface Step {
  target: string;
  title: string;
  body: string;
  /** Route the user should be on when this step is shown. */
  route: string;
}

const STEPS: Step[] = [
  { target: "tools", title: "Tools", body: "Browse all AI tools available to create content like ads, product photography, and videos.", route: "/home" },
  { target: "editor", title: "Editor", body: "Edit and refine your generated content with our built-in editor.", route: "/editor" },
  { target: "models", title: "Models", body: "View all the AI models we offer on the platform, including premium models.", route: "/home?tab=custom-models" },
  { target: "my-generations", title: "My Generations", body: "Access all the content you've previously generated, organized in one place.", route: "/my-generations" },
  { target: "community", title: "Community", body: "Discover what others are creating and get inspired by the Floowy community.", route: "/community" },
  { target: "knowledge-base", title: "Knowledge Base", body: "Find guides, tutorials, and answers to help you get the most out of Floowy.", route: "/knowledge-base-hub" },
  { target: "settings", title: "Settings", body: "Manage your account preferences, profile, and platform settings.", route: "/settings" },
  { target: "subscriptions", title: "Subscriptions", body: "View your current plan, credits, and manage your subscription.", route: "/subscriptions" },
  { target: "theme-toggle", title: "Light / Dark mode", body: "Switch between light and dark mode to match your preference.", route: "/settings" },
];

const TOTAL = STEPS.length;
export const AMBIENCE_TOUR_ROUTE = "/tool/atmospheric";

const isHiddenRoute = (pathname: string) => {
  if (pathname === "/" || pathname === "/auth" || pathname === "/reset-password" || pathname === "/onboarding") return true;
  if (pathname.startsWith("/admin")) return true;
  return false;
};

const WalkthroughTour = () => {
  const { loading, authed, completed, step, setStep, complete } = useWalkthrough();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const active = !loading && authed && !completed && !isHiddenRoute(location.pathname);

  const stepIndex = step > 0 && step <= TOTAL ? step : 1;
  const currentStep = STEPS[stepIndex - 1];

  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [finished, setFinished] = useState(false);

  // Initialize step to 1 the first time the tour activates.
  useEffect(() => {
    if (!active) return;
    if (step === 0) setStep(1);
  }, [active, step, setStep]);

  // Ensure the user is on the expected route for the current step.
  useEffect(() => {
    if (!active) return;
    const [path, query] = currentStep.route.split("?");
    const onRoute =
      location.pathname === path && (!query || location.search.includes(query));
    if (!onRoute) navigate(currentStep.route);
  }, [active, currentStep, location.pathname, location.search, navigate]);

  // Track the highlighted target element.
  useEffect(() => {
    if (!active || isMobile) return;
    let raf = 0;
    let attempts = 0;
    const tick = () => {
      const el = document.querySelector(`[data-walkthrough-target="${currentStep.target}"]`) as HTMLElement | null;
      if (el) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) setTargetRect(r);
        else setTargetRect(null);
      } else setTargetRect(null);
      attempts++;
      if (attempts < 240) raf = requestAnimationFrame(tick);
    };
    tick();
    const onResize = () => {
      const el = document.querySelector(`[data-walkthrough-target="${currentStep.target}"]`) as HTMLElement | null;
      if (el) setTargetRect(el.getBoundingClientRect());
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [currentStep, active, isMobile]);

  const handleNext = useCallback(async () => {
    if (stepIndex < TOTAL) {
      await setStep(stepIndex + 1);
    } else {
      await complete();
      setFinished(true);
    }
  }, [stepIndex, setStep, complete]);

  const handleBack = useCallback(async () => {
    if (stepIndex > 1) await setStep(stepIndex - 1);
  }, [stepIndex, setStep]);

  useEffect(() => {
    if (!active || finished) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); return; }
      if (e.key === "Enter" || e.key === "ArrowRight") { e.preventDefault(); handleNext(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); handleBack(); }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [active, finished, handleNext, handleBack]);

  if (finished) {
    return createPortal(
      <div className="fixed inset-0 z-[9999] bg-black/65 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-popover border border-border rounded-2xl shadow-2xl max-w-md w-full p-8 text-center animate-in fade-in-0 zoom-in-95">
          <div className="w-16 h-16 rounded-full bg-primary/15 text-primary flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">You're all set!</h2>
          <p className="text-muted-foreground mb-6">
            Let's take a quick tour of Ambience Studio so you can create your first visual.
          </p>
          <Button
            size="lg"
            className="w-full"
            onClick={() => {
              setFinished(false);
              navigate(AMBIENCE_TOUR_ROUTE);
            }}
          >
            Start Ambience tour
          </Button>
        </div>
      </div>,
      document.body,
    );
  }

  if (!active) return null;

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
              <h3 className="text-base font-bold text-foreground mt-0.5">{currentStep.title}</h3>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-5 leading-relaxed">{currentStep.body}</p>
          <div className="flex items-center justify-between gap-3">
            <div className="flex gap-1.5">
              {STEPS.map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all ${i + 1 === stepIndex ? "w-6 bg-primary" : i + 1 < stepIndex ? "w-1.5 bg-primary/60" : "w-1.5 bg-muted-foreground/30"}`} />
              ))}
            </div>
            <div className="flex items-center gap-2">
              {stepIndex > 1 && (<Button size="sm" variant="ghost" onClick={handleBack}>Back</Button>)}
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
    return createPortal(
      <div className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-[1px] pointer-events-auto" />,
      document.body,
    );
  }

  const tooltipWidth = 360;
  const pad = 8;
  const gap = 18;

  let left = targetRect.right + gap;
  let top = targetRect.top + targetRect.height / 2;
  let transform = "translateY(-50%)";
  if (left + tooltipWidth + 12 > window.innerWidth) {
    const leftSide = targetRect.left - gap - tooltipWidth;
    if (leftSide >= 12) {
      left = leftSide;
    } else {
      left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
      top = targetRect.bottom + gap;
      transform = "none";
      left = Math.max(12, Math.min(left, window.innerWidth - tooltipWidth - 12));
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

      <div
        className="fixed z-[9999] animate-in fade-in-0 zoom-in-95 duration-200"
        style={{ left, top, width: tooltipWidth, transform }}
      >
        <div className="bg-popover border border-border rounded-xl shadow-2xl p-5 relative">
          <div className="flex items-start gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-primary uppercase tracking-wide">
                Step {stepIndex} of {TOTAL}
              </div>
              <h3 className="text-base font-bold text-foreground mt-0.5">{currentStep.title}</h3>
            </div>
          </div>
          <p className="text-[14px] text-muted-foreground leading-[1.5] mb-4">{currentStep.body}</p>
          <div className="flex items-center justify-between gap-3">
            <div className="flex gap-1.5">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i + 1 === stepIndex
                      ? "w-6 bg-primary"
                      : i + 1 < stepIndex
                      ? "w-1.5 bg-primary/60"
                      : "w-1.5 bg-muted-foreground/30"
                  }`}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              {stepIndex > 1 && (
                <Button size="sm" variant="ghost" onClick={handleBack}>Back</Button>
              )}
              <Button size="sm" onClick={handleNext}>
                {stepIndex === TOTAL ? (
                  <>Finish <Check className="w-4 h-4 ml-1" /></>
                ) : (
                  <>Next <ChevronRight className="w-4 h-4 ml-1" /></>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
};

// Backward-compat export for ToolPageLayout (used to gate redirects to the Ambience tour).
export const WALKTHROUGH_ROUTE = AMBIENCE_TOUR_ROUTE;

export default WalkthroughTour;