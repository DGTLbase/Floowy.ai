import { useEffect, useRef } from "react";
import { Check } from "lucide-react";

export interface PresetItem {
  id: string;
  name: string;
  description: string;
}

interface Props {
  title: string;
  subtitle?: string;
  presets: PresetItem[];
  /** Selected preset id, or the literal "custom". */
  selectedId: string;
  customText: string;
  onSelectPreset: (id: string) => void;
  onSelectCustom: () => void;
  onCustomText: (text: string) => void;
  customPlaceholder: string;
  customMaxChars: number;
  /** lg column count for the preset grid (default 4). */
  lgCols?: 2 | 3 | 4;
}

/**
 * Reusable "N preset cards + a mutually-exclusive Custom option" block
 * (Fashion Video Studio briefing §5 and §6). Selecting Custom dims and disables
 * every preset and expands a textarea; selecting any preset deselects Custom and
 * collapses the textarea. Used for both Fashion context and Video editing style.
 */
const PresetWithCustomBlock = ({
  title, subtitle, presets, selectedId, customText,
  onSelectPreset, onSelectCustom, onCustomText, customPlaceholder, customMaxChars, lgCols = 4,
}: Props) => {
  const isCustom = selectedId === "custom";
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus the textarea when Custom becomes active (briefing: autofocus).
  useEffect(() => {
    if (isCustom) textareaRef.current?.focus();
  }, [isCustom]);

  const lgColClass = lgCols === 2 ? "lg:grid-cols-2" : lgCols === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4";
  const remaining = customMaxChars - customText.length;

  return (
    <div className="space-y-4">
      <div>
        <span className="text-lg font-semibold text-foreground">{title}</span>
        {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
      </div>

      {/* Preset cards */}
      <div className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${lgColClass}`}>
        {presets.map((p) => {
          const active = !isCustom && p.id === selectedId;
          return (
            <button
              key={p.id}
              type="button"
              aria-pressed={active}
              onClick={() => onSelectPreset(p.id)}
              className={`relative flex flex-col rounded-xl border p-3 text-left transition ${
                active ? "border-primary ring-2 ring-primary/30 bg-primary/5"
                       : "border-border hover:border-primary/50"
              }`}
            >
              {active && (
                <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-3 w-3" />
                </span>
              )}
              <div className={`text-sm font-semibold text-foreground ${active ? "pr-6" : ""}`}>{p.name}</div>
              <div className="mt-1 text-xs leading-snug text-muted-foreground">{p.description}</div>
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">or describe your own</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Custom option — radio-styled, mutually exclusive with the presets */}
      <button
        type="button"
        onClick={onSelectCustom}
        aria-pressed={isCustom}
        className={`flex w-full flex-col rounded-xl border p-4 text-left transition ${
          isCustom ? "border-primary ring-2 ring-primary/30 bg-primary/5" : "border-border hover:border-primary/50"
        }`}
      >
        <div className="flex items-center gap-3">
          <span className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
            isCustom ? "border-primary" : "border-muted-foreground/40"
          }`}>
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
              <span className={`text-xs ${remaining < 20 ? "text-amber-600" : "text-muted-foreground"}`}>
                {remaining}
              </span>
            </div>
          </div>
        )}
      </button>
    </div>
  );
};

export default PresetWithCustomBlock;
