import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Upload, Wand2, CheckCircle2, Loader2, AlertCircle, RotateCcw, ImageIcon } from "lucide-react";

export type GenerationStage = "uploading" | "generating" | "finalizing" | "completed" | "failed";

interface PipelineStep {
  key: string;
  label: string;
  icon: React.ElementType;
}

const DEFAULT_STEPS: PipelineStep[] = [
  { key: "uploading", label: "Uploading images", icon: Upload },
  { key: "generating", label: "AI is creating", icon: Wand2 },
  { key: "finalizing", label: "Finalizing result", icon: ImageIcon },
];

interface GenerationProgressOverlayProps {
  open: boolean;
  stage: string;
  progress: number;
  statusMessage?: string;
  title?: string;
  steps?: PipelineStep[];
  onRetry?: () => void;
  onClose?: () => void;
}

const GenerationProgressOverlay = ({
  open,
  stage,
  progress,
  statusMessage = "",
  title = "Creating Your Image",
  steps = DEFAULT_STEPS,
  onRetry,
  onClose,
}: GenerationProgressOverlayProps) => {
  const isActive = stage !== "completed" && stage !== "failed";

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !isActive && onClose) onClose(); }}>
      <DialogContent
        className="p-0 overflow-hidden border-0 bg-gradient-to-b from-card to-background shadow-2xl sm:max-w-lg rounded-2xl"
        hideClose={isActive}
        onPointerDownOutside={(e) => { if (isActive) e.preventDefault(); }}
        onEscapeKeyDown={(e) => { if (isActive) e.preventDefault(); }}
      >
        {/* Active / generating state */}
        {isActive && (
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
                <h3 className="text-lg sm:text-xl font-bold text-foreground tracking-tight truncate">{title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 truncate">{statusMessage || "Please wait..."}</p>
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
                    <Wand2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-foreground font-semibold">Processing...</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">{Math.round(progress)}% complete</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="relative mb-5 sm:mb-8">
              <div className="h-1.5 sm:h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary via-primary to-primary/80 transition-all duration-700 ease-out relative"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite]" />
                </div>
              </div>
            </div>

            {/* Pipeline steps */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
              {steps.map(({ key, label, icon: Icon }) => {
                const stepsOrder = steps.map(s => s.key);
                const currentIdx = stepsOrder.indexOf(stage);
                const stepIdx = stepsOrder.indexOf(key);
                const isDone = stepIdx < currentIdx;
                const isCurrent = key === stage;

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
        )}

        {/* Failed state */}
        {stage === "failed" && (
          <div className="p-5 sm:p-8 text-center">
            <div className="rounded-xl sm:rounded-2xl overflow-hidden bg-gradient-to-br from-destructive/5 to-muted/30 aspect-video mb-5 sm:mb-8 flex items-center justify-center border border-destructive/20">
              <div className="text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-destructive" />
                </div>
                <p className="text-destructive font-bold text-base sm:text-lg">Generation Failed</p>
                <p className="text-muted-foreground text-xs sm:text-sm mt-2 max-w-sm mx-auto px-4">{statusMessage}</p>
              </div>
            </div>
            <div className="flex gap-3 justify-center">
              {onRetry && (
                <Button variant="outline" onClick={onRetry} className="rounded-xl h-10 sm:h-11 px-6">
                  <RotateCcw className="w-4 h-4 mr-2" /> Try Again
                </Button>
              )}
              {onClose && (
                <Button variant="ghost" onClick={onClose} className="rounded-xl h-10 sm:h-11 px-6">
                  Close
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GenerationProgressOverlay;
