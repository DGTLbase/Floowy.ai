import { useState, useEffect } from "react";
import { Sparkles, Upload, Wand2, ImageIcon, CheckCircle2, Loader2 } from "lucide-react";

interface PipelineStep {
  key: string;
  label: string;
  icon: React.ElementType;
}

interface GenerationDemoShowcaseProps {
  title?: string;
  subtitle?: string;
  previewIcon?: React.ElementType;
  steps?: PipelineStep[];
}

const DEFAULT_STEPS: PipelineStep[] = [
  { key: "uploading", label: "Uploading images", icon: Upload },
  { key: "generating", label: "AI is generating", icon: Wand2 },
  { key: "finalizing", label: "Finalizing result", icon: ImageIcon },
];

const GenerationDemoShowcase = ({
  title = "Creating Your Image",
  subtitle = "Watch how your images are processed into professional results",
  previewIcon: PreviewIcon = Wand2,
  steps = DEFAULT_STEPS,
}: GenerationDemoShowcaseProps) => {
  const [demoStep, setDemoStep] = useState(0);
  const [demoProgress, setDemoProgress] = useState(0);

  const stepCount = steps.length;
  const stepTargets = steps.map((_, i) => Math.round(((i + 1) / stepCount) * 100));
  const stepDurations = steps.map((_, i) => (i === 0 ? 2000 : i === stepCount - 1 ? 2000 : 3500));

  useEffect(() => {
    const target = stepTargets[demoStep];

    const interval = setInterval(() => {
      setDemoProgress(prev => {
        if (prev >= target) return prev;
        const remaining = target - prev;
        return Math.min(prev + Math.max(0.5, remaining * 0.08), target);
      });
    }, 80);

    const stepTimer = setTimeout(() => {
      if (demoStep < stepCount - 1) {
        setDemoStep(prev => prev + 1);
      } else {
        setTimeout(() => {
          setDemoStep(0);
          setDemoProgress(0);
        }, 2000);
      }
    }, stepDurations[demoStep]);

    return () => {
      clearInterval(interval);
      clearTimeout(stepTimer);
    };
  }, [demoStep]);

  return (
    <section className="container mx-auto px-4 py-16 md:py-24 scroll-animate">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <span className="inline-block text-xs font-mono tracking-[0.3em] uppercase text-primary mb-4">Live Preview</span>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            <span className="text-header-dark">Generation</span> <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">In Action</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">{subtitle}</p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="rounded-2xl border border-border bg-gradient-to-b from-card to-background shadow-2xl overflow-hidden">
            <div className="p-5 sm:p-8">
              {/* Header */}
              <div className="flex items-center gap-3 sm:gap-4 mb-5 sm:mb-8">
                <div className="relative shrink-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20">
                    <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-primary animate-ping opacity-40" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg sm:text-2xl font-bold text-foreground tracking-tight">{title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    {steps[demoStep].label}...
                  </p>
                </div>
              </div>

              {/* Preview placeholder */}
              <div className="rounded-xl sm:rounded-2xl overflow-hidden bg-gradient-to-br from-muted/80 to-muted/30 aspect-video mb-5 sm:mb-8 flex items-center justify-center border border-border/50 backdrop-blur-sm relative">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.05)_0%,transparent_70%)]" />
                <div className="text-center relative z-10">
                  <div className="relative mx-auto mb-3 sm:mb-4 w-12 h-12 sm:w-16 sm:h-16">
                    <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-pulse" />
                    <div className="absolute inset-2 rounded-full border-2 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <PreviewIcon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-foreground font-semibold">Processing...</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">{Math.round(demoProgress)}% complete</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="relative mb-5 sm:mb-8">
                <div className="h-1.5 sm:h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary via-primary to-primary/80 transition-all duration-700 ease-out relative"
                    style={{ width: `${demoProgress}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite]" />
                  </div>
                </div>
              </div>

              {/* Pipeline steps */}
              <div className={`grid gap-2 sm:gap-3 ${
                stepCount <= 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-2 sm:grid-cols-4"
              }`}>
                {steps.map(({ key, label, icon: Icon }, stepIdx) => {
                  const isDone = stepIdx < demoStep;
                  const isCurrent = stepIdx === demoStep;

                  return (
                    <div
                      key={key}
                      className={`rounded-xl border p-2.5 sm:p-3.5 flex sm:flex-col items-center sm:text-center gap-3 sm:gap-0 transition-all duration-500 ${
                        isCurrent
                          ? "border-primary/50 bg-primary/5 shadow-md shadow-primary/10"
                          : isDone
                          ? "border-primary/20 bg-primary/5"
                          : "border-border/50 bg-muted/20"
                      }`}
                    >
                      <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:mx-auto sm:mb-2 flex items-center justify-center shrink-0 transition-all ${
                        isCurrent
                          ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-sm"
                          : isDone
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : isCurrent ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Icon className="w-4 h-4" />
                        )}
                      </div>
                      <span className={`text-xs font-medium ${
                        isCurrent ? "text-primary" : isDone ? "text-primary/80" : "text-muted-foreground"
                      }`}>
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GenerationDemoShowcase;
