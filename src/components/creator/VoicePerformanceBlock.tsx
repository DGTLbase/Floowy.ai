import { Zap, Gamepad2, BookOpen, Crown, Feather, Heart, ListChecks, Flame, Mic } from "lucide-react";
import { VOICE_PERFORMANCES } from "@/lib/creator-studio-config";

const ICONS: Record<string, typeof Zap> = {
  Zap, Gamepad2, BookOpen, Crown, Feather, Heart, ListChecks, Flame,
};

interface Props {
  value: string;
  onChange: (id: string) => void;
}

/**
 * New "Voice Performance" block (briefing block #6) — controls how the voiceover
 * is delivered. Two-column card grid with icon + description, per the mockup.
 */
const VoicePerformanceBlock = ({ value, onChange }: Props) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2">
      <Mic className="h-4 w-4 text-muted-foreground" />
      <span className="text-lg font-semibold text-foreground">Voice performance</span>
      <span className="text-sm text-muted-foreground">How the voiceover is delivered</span>
    </div>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {VOICE_PERFORMANCES.map((v) => {
        const active = v.id === value;
        const Icon = ICONS[v.icon] ?? Mic;
        return (
          <button
            key={v.id}
            type="button"
            onClick={() => onChange(v.id)}
            className={`flex flex-col rounded-xl border p-4 text-left transition ${
              active ? "border-primary ring-2 ring-primary/30 bg-primary/5"
                     : "border-border hover:border-primary/50"
            }`}
          >
            <div className="flex items-center gap-2">
              <Icon className={`h-4 w-4 ${active ? "text-primary" : "text-muted-foreground"}`} />
              <span className="text-sm font-semibold text-foreground">{v.label}</span>
            </div>
            <p className="mt-1 text-xs leading-snug text-muted-foreground">{v.description}</p>
          </button>
        );
      })}
    </div>
  </div>
);

export default VoicePerformanceBlock;
