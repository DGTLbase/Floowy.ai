import { Check, Smartphone, Monitor } from "lucide-react";
import {
  ASPECT_RATIOS, CUT_STYLES, DURATION_PILLS, cutStyleById,
  type AspectRatioId, type DurationSec, type CutStyle,
} from "@/lib/creator-studio-config";

interface Props {
  aspectRatio: AspectRatioId;
  cutStyleId: string;
  duration: DurationSec;
  onAspectRatio: (r: AspectRatioId) => void;
  onCutStyle: (id: string) => void;      // parent also snaps duration to the style default
  onDuration: (d: DurationSec) => void;
}

/**
 * New "Video Editing Style" block (briefing §3). Sits between Video Style and
 * Scene Background. Aspect-ratio toggle drives per-card fit badges; picking a
 * cut style snaps the duration to its smart default; duration pills are
 * overridable and a hint explains the recommendation.
 */
const VideoEditingStyleBlock = ({
  aspectRatio, cutStyleId, duration, onAspectRatio, onCutStyle, onDuration,
}: Props) => {
  const selected: CutStyle = cutStyleById(cutStyleId);

  return (
    <div className="space-y-5">
      <div>
        <Label>Video Editing Style</Label>
        <p className="text-sm text-muted-foreground mt-0.5">
          Choose the format and cutting style — we set a smart default duration for each.
        </p>
      </div>

      {/* Aspect ratio — full-width button options with icons */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {ASPECT_RATIOS.map((r) => {
          const active = r.id === aspectRatio;
          const Icon = r.id === "9:16" ? Smartphone : Monitor;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => onAspectRatio(r.id)}
              className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition ${
                active ? "border-primary ring-2 ring-primary/30 bg-primary/5"
                       : "border-border hover:border-primary/50"
              }`}
            >
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${
                active ? "bg-primary/10" : "bg-muted"
              }`}>
                <Icon className={`h-5 w-5 ${active ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground">{r.label}</span>
                  <span className="text-xs text-muted-foreground">{r.orientation}</span>
                </div>
                <span className="block truncate text-xs text-muted-foreground">{r.platforms}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Cut style cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {CUT_STYLES.map((style) => {
          const active = style.id === cutStyleId;
          const fit = style.fit[aspectRatio];
          const dimmed = fit === "not-ideal" && !active;
          return (
            <button
              key={style.id}
              type="button"
              onClick={() => onCutStyle(style.id)}
              className={`relative flex flex-col rounded-xl border p-3 text-left transition ${
                active ? "border-primary ring-2 ring-primary/30 bg-primary/5"
                       : "border-border hover:border-primary/50"
              } ${dimmed ? "opacity-60" : ""}`}
            >
              {/* Fit badge */}
              {fit === "best" && (
                <span className="absolute right-2 top-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                  Best for {aspectRatio}
                </span>
              )}
              {fit === "not-ideal" && (
                <span className="absolute right-2 top-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                  Not ideal
                </span>
              )}
              {active && (
                <span className="absolute left-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-3 w-3" />
                </span>
              )}

              <div className={`mt-6 text-sm font-semibold text-foreground ${fit === "best" ? "pr-4" : ""}`}>
                {style.name}
              </div>
              <div className="mt-1 text-xs leading-snug text-muted-foreground">{style.description}</div>
              <div className="mt-2 text-[11px] font-medium text-muted-foreground">
                Default {style.defaultDuration} sec
              </div>
            </button>
          );
        })}
      </div>

      {/* Duration pills */}
      <div>
        <div className="mb-2 text-sm font-medium text-foreground">Video duration</div>
        <div className="flex gap-2">
          {DURATION_PILLS.map((p) => {
            const active = p.seconds === duration;
            return (
              <button
                key={p.seconds}
                type="button"
                onClick={() => onDuration(p.seconds)}
                className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
                  active ? "border-primary bg-primary text-primary-foreground"
                         : "border-border text-foreground hover:border-primary/50"
                }`}
              >
                {p.seconds} sec
                <span className={`ml-1.5 text-xs font-normal ${active ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                  {p.credits} cr
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {duration === selected.defaultDuration
            ? selected.durationHint
            : `Recommended for ${selected.name}: ${selected.defaultDuration} sec — ${selected.durationHint}`}
        </p>
      </div>
    </div>
  );
};

// Local label to match the studio's existing block headers.
const Label = ({ children }: { children: React.ReactNode }) => (
  <span className="text-lg font-semibold text-foreground">{children}</span>
);

export default VideoEditingStyleBlock;
