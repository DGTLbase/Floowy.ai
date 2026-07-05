import { VOICE_PERFORMANCES } from "@/lib/creator-studio-config";

interface Props {
  value: string;
  onChange: (id: string) => void;
}

/**
 * New "Voice Performance" block (briefing block #6). Controls the emotional
 * delivery of the voiceover. Options are placeholders pending the mockup spec.
 */
const VoicePerformanceBlock = ({ value, onChange }: Props) => (
  <div className="space-y-3">
    <div>
      <span className="text-lg font-semibold text-foreground">Voice Performance</span>
      <p className="text-sm text-muted-foreground mt-0.5">How the voiceover is delivered.</p>
    </div>
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {VOICE_PERFORMANCES.map((v) => {
        const active = v.id === value;
        return (
          <button
            key={v.id}
            type="button"
            onClick={() => onChange(v.id)}
            title={v.description}
            className={`rounded-xl border p-3 text-left transition ${
              active ? "border-primary ring-2 ring-primary/30 bg-primary/5"
                     : "border-border hover:border-primary/50"
            }`}
          >
            <div className="text-sm font-semibold text-foreground">{v.label}</div>
            <div className="mt-0.5 text-xs leading-snug text-muted-foreground line-clamp-2">{v.description}</div>
          </button>
        );
      })}
    </div>
  </div>
);

export default VoicePerformanceBlock;
