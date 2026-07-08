import { useEffect, useRef } from "react";
import { Check, MoveVertical, Newspaper, Zap, PersonStanding, Rotate3d, ZoomIn, Scissors } from "lucide-react";
import { EDITING_STYLES, type AspectRatioId } from "@/lib/fashion-video-config";

const ICONS: Record<string, typeof Zap> = {
  MoveVertical, Newspaper, Zap, PersonStanding, Rotate3d, ZoomIn,
};

interface Props {
  aspectRatio: AspectRatioId;
  selectedId: string;          // an editing style id, or "custom"
  customText: string;
  onSelectPreset: (id: string) => void;
  onSelectCustom: () => void;
  onCustomText: (text: string) => void;
  customPlaceholder: string;
  customMaxChars: number;
}

/**
 * Video editing style block — mirrors Creator Studio's cut-style cards: an icon,
 * a per-aspect-ratio fit badge ("Best for 9:16" / "Not ideal"), the cut count,
 * plus the mutually-exclusive "describe your own" custom option.
 */
const EditingStyleBlock = ({
  aspectRatio, selectedId, customText, onSelectPreset, onSelectCustom, onCustomText, customPlaceholder, customMaxChars,
}: Props) => {
  const isCustom = selectedId === "custom";
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { if (isCustom) textareaRef.current?.focus(); }, [isCustom]);
  const remaining = customMaxChars - customText.length;

  return (
    <div className="space-y-4">
      <div>
        <span className="text-lg font-semibold text-foreground">Video editing style</span>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Camera movement, cut pattern and motion — badges show what suits {aspectRatio}.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {EDITING_STYLES.map((style) => {
          const active = !isCustom && style.id === selectedId;
          const fit = style.fit[aspectRatio];
          const dimmed = fit === "not-ideal" && !active;
          const Icon = ICONS[style.icon] ?? Scissors;
          return (
            <button
              key={style.id}
              type="button"
              aria-pressed={active}
              onClick={() => onSelectPreset(style.id)}
              className={`relative flex flex-col rounded-xl border p-3 text-left transition ${
                active ? "border-primary ring-2 ring-primary/30 bg-primary/5" : "border-border hover:border-primary/50"
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

              <div className={`mt-6 flex items-center gap-2 ${fit === "best" ? "pr-4" : ""}`}>
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${active ? "bg-primary/10" : "bg-muted"}`}>
                  <Icon className={`h-4 w-4 ${active ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <span className="text-sm font-semibold text-foreground">{style.name}</span>
              </div>
              <div className="mt-2 text-xs leading-snug text-muted-foreground">{style.description}</div>
              <div className="mt-2 text-[11px] font-medium text-muted-foreground">
                {style.cuts === "None" ? "No cuts" : `${style.cuts} cuts`}
              </div>
            </button>
          );
        })}
      </div>

      {/* Divider + custom option */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">or describe your own</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <button
        type="button"
        onClick={onSelectCustom}
        aria-pressed={isCustom}
        className={`flex w-full flex-col rounded-xl border p-4 text-left transition ${
          isCustom ? "border-primary ring-2 ring-primary/30 bg-primary/5" : "border-border hover:border-primary/50"
        }`}
      >
        <div className="flex items-center gap-3">
          <span className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${isCustom ? "border-primary" : "border-muted-foreground/40"}`}>
            {isCustom && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
          </span>
          <span className="text-sm font-semibold text-foreground">Describe your own</span>
        </div>
        {isCustom && (
          <div className="mt-3" onClick={(e) => e.stopPropagation()}>
            <textarea
              ref={textareaRef}
              value={customText}
              onChange={(e) => onCustomText(e.target.value.slice(0, customMaxChars))}
              placeholder={customPlaceholder}
              rows={3}
              className="w-full resize-none rounded-lg border border-border bg-background p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <div className="mt-1 flex justify-end">
              <span className={`text-xs ${remaining < 20 ? "text-amber-600" : "text-muted-foreground"}`}>{remaining}</span>
            </div>
          </div>
        )}
      </button>
    </div>
  );
};

export default EditingStyleBlock;
