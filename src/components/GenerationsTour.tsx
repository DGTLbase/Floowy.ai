import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Globe, Lock, Eye, X, ChevronRight, ChevronLeft } from "lucide-react";
import { createPortal } from "react-dom";

const TOUR_KEY = "floowy_generations_tour_v3";

const steps = [
  {
    title: "Public or Private?",
    description: "Every generation is private by default. Only you can see it.",
    icon: Lock,
  },
  {
    title: "Make it Public",
    description: "Click this icon to publish your creation to the Community gallery.",
    icon: Globe,
  },
  {
    title: "Preview & Toggle",
    description: "You can also open the image preview and use the toggle switch to publish or unpublish.",
    icon: Eye,
  },
];

export const GenerationsTour = ({ hasGenerations }: { hasGenerations: boolean }) => {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const updateTarget = () => {
    const target = document.querySelector("[data-tour-target='visibility-toggle']");
    if (target) {
      setTargetRect(target.getBoundingClientRect());
      return true;
    }
    return false;
  };

  useEffect(() => {
    if (!hasGenerations) return;
    const seen = localStorage.getItem(TOUR_KEY);
    if (seen) return;

    // Poll until the target element exists (grid may still be loading)
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (updateTarget()) {
        setVisible(true);
        clearInterval(interval);
      } else if (attempts > 20) {
        clearInterval(interval);
      }
    }, 300);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const onScroll = () => updateTarget();
    const onResize = () => updateTarget();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [visible]);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(TOUR_KEY, "true");
  };

  if (!visible || !targetRect) return null;

  const current = steps[step];
  const Icon = current.icon;

  // Position the tooltip above the target, centered
  const tooltipWidth = 280;
  const arrowSize = 8;
  const gap = 12;

  const left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
  const top = targetRect.top - gap;

  // Clamp left so it doesn't overflow
  const clampedLeft = Math.max(12, Math.min(left, window.innerWidth - tooltipWidth - 12));

  return createPortal(
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-[9998]" onClick={dismiss}>
        {/* Spotlight cutout using box-shadow */}
        <div
          className="absolute"
          style={{
            top: targetRect.top - 6,
            left: targetRect.left - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
            borderRadius: 12,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* Tooltip */}
      <div
        className="fixed z-[9999] animate-in fade-in-0 slide-in-from-bottom-2 duration-200"
        style={{
          top: top,
          left: clampedLeft,
          width: tooltipWidth,
          transform: "translateY(-100%)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-popover border border-border rounded-xl shadow-xl p-4 relative">
          {/* Close */}
          <button
            onClick={dismiss}
            className="absolute top-2.5 right-2.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          {/* Content */}
          <div className="flex items-start gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <Icon className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground leading-tight">{current.title}</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{current.description}</p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    i === step ? "bg-primary" : "bg-muted-foreground/30"
                  }`}
                />
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              {step > 0 && (
                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setStep(step - 1)}>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
              )}
              {step < steps.length - 1 ? (
                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setStep(step + 1)}>
                  Next <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </Button>
              ) : (
                <Button size="sm" className="h-7 px-3 text-xs" onClick={dismiss}>
                  Got it
                </Button>
              )}
            </div>
          </div>

          {/* Arrow pointing down */}
          <div
            className="absolute w-0 h-0"
            style={{
              bottom: -arrowSize,
              left: targetRect.left + targetRect.width / 2 - clampedLeft - arrowSize,
              borderLeft: `${arrowSize}px solid transparent`,
              borderRight: `${arrowSize}px solid transparent`,
              borderTop: `${arrowSize}px solid hsl(var(--border))`,
            }}
          />
          <div
            className="absolute w-0 h-0"
            style={{
              bottom: -(arrowSize - 1),
              left: targetRect.left + targetRect.width / 2 - clampedLeft - arrowSize,
              borderLeft: `${arrowSize}px solid transparent`,
              borderRight: `${arrowSize}px solid transparent`,
              borderTop: `${arrowSize}px solid hsl(var(--popover))`,
            }}
          />
        </div>
      </div>
    </>,
    document.body
  );
};
