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
}

const STEPS: Step[] = [
  {
    target: "ambience-upload",
    title: "Upload your product",
    body:
      "Start by uploading the product photo you want to use. Supported file types are JPG, PNG and WebP, with a maximum file size of 10 MB. A clear and well-lit product image will result in the best output, as this becomes the foundation of the generated visual.",
  },
  {
    target: "ambience-time",
    title: "Set the time of day",
    body:
      "Choose between Day for a bright and fresh look or Night for a warm and moody atmosphere. This choice has a big impact on the emotional tone of the final image.",
  },
  {
    target: "ambience-mode",
    title: "Pick how your product is shown",
    body:
      "Select Product Only to focus fully on the product in a curated environment, With Model to add lifestyle context using a male or female model (or upload your own), or Hands Only to show the product being held or worn without a full person. When using a default AI model, describe the desired appearance in your mood prompt.",
  },
  {
    target: "ambience-mood",
    title: "Describe the mood",
    body:
      "Describe the environment, atmosphere, and style you want. The best results come from English prompts of around 20 to 30 words. Include setting, lighting, colors, textures, and emotional tone. You can also use style presets like Scandinavian interior, Minimalist studio, Luxury environment, Cozy home atmosphere, or Outdoor nature scene.",
  },
  {
    target: "ambience-output",
    title: "Choose your output size",
    body:
      "Select the aspect ratio that fits your channel and pick a resolution tier: 1K for speed, 2K for professional use, or 4K for ultra-high resolution.",
  },
];

const TOTAL = STEPS.length;
export const AMBIENCE_WALKTHROUGH_ROUTE = "/tool/atmospheric";

const isHiddenRoute = (pathname: string) => {
  if (pathname === "/" || pathname === "/auth" || pathname === "/reset-password" || pathname === "/onboarding") return true;
  if (pathname.startsWith("/admin")) return true;
  return false;
};

const AmbienceWalkthroughTour = () => {
  const {
    loading,
    authed,
    completed,
    ambienceCompleted,
    ambienceStep,
    setAmbienceStep,
    completeAmbience,
  } = useWalkthrough();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Only runs AFTER the general sidebar walkthrough has been completed.
  const active =
    !loading && authed && completed && !ambienceCompleted && !isHiddenRoute(location.pathname);
  const onTourRoute = location.pathname === AMBIENCE_WALKTHROUGH_ROUTE;
  const step = ambienceStep;
  const setStep = setAmbienceStep;
  const complete = completeAmbience;

  const stepIndex = step > 0 && step <= TOTAL ? step : 1;
  const current = STEPS[stepIndex - 1];

  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (!active || !onTourRoute) return;
    if (step === 0) setStep(1);
  }, [active, onTourRoute, step, setStep]);

  useEffect(() => {
    if (!active || !onTourRoute || isMobile) return;
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
  }, [current, active, onTourRoute, isMobile]);

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
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (e.key === "Enter" || e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handleBack();
      }
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
          <h2 className="text-2xl font-bold text-foreground mb-2">Need more clarity?</h2>
          <p className="text-muted-foreground mb-6">
            Check our detailed knowledge base guide for step-by-step instructions.
          </p>
          <div className="flex flex-col gap-2">
            <Button
              size="lg"
              className="w-full"
              onClick={() => {
                setFinished(false);
                navigate("/home");
              }}
            >
              Start creating now
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full"
              onClick={() => {
                window.open("/knowledge-base-hub", "_blank", "noopener,noreferrer");
              }}
            >
              Learn more
            </Button>
          </div>
        </div>
      </div>,
      document.body,
    );
  }

  if (!active) return null;

  if (isMobile) {
    if (!onTourRoute) return null;
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
              {STEPS.map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all ${i + 1 === stepIndex ? "w-6 bg-primary" : i + 1 < stepIndex ? "w-1.5 bg-primary/60" : "w-1.5 bg-muted-foreground/30"}`} />
              ))}
            </div>
            <div className="flex items-center gap-2">
              {stepIndex > 1 && (
                <Button size="sm" variant="ghost" onClick={handleBack}>Back</Button>
              )}
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

  if (!onTourRoute) {
    // Don't render anything outside the Ambience tool page — the tour only
    // activates once the user opens that tool.
    return null;
  }

  if (!targetRect) {
    return createPortal(
      <div className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-[1px] pointer-events-auto" />,
      document.body,
    );
  }

  const tooltipWidth = 360;
  const pad = 10;
  const gap = 18;

  // Position tooltip ABOVE the highlighted target, horizontally centered.
  let left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
  let top = targetRect.top - gap;
  let transform = "translateY(-100%)";
  left = Math.max(12, Math.min(left, window.innerWidth - tooltipWidth - 12));
  // If there's no room above, flip below.
  if (top - 200 < 12) {
    top = targetRect.bottom + gap;
    transform = "none";
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
            borderRadius: 14,
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
              <h3 className="text-base font-bold text-foreground mt-0.5">{current.title}</h3>
            </div>
          </div>
          <p className="text-[14px] text-muted-foreground leading-[1.5] mb-4">{current.body}</p>
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

export default AmbienceWalkthroughTour;