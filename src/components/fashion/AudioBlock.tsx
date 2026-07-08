import { Music, Volume2, VolumeX, Waves, Check } from "lucide-react";
import { AUDIO_OPTIONS, MUSIC_STYLES } from "@/lib/fashion-video-config";

const ICONS: Record<string, typeof Music> = {
  natural: Volume2,
  music: Music,
  sfx: Waves,
  silent: VolumeX,
};

interface Props {
  audioId: string;
  musicStyleId: string;
  onAudio: (id: string) => void;
  onMusicStyle: (id: string) => void;
}

/** Audio panel — the generated video has sound, so let users choose how it sounds. */
const AudioBlock = ({ audioId, musicStyleId, onAudio, onMusicStyle }: Props) => {
  const showMusicStyles = AUDIO_OPTIONS.find((a) => a.id === audioId)?.hasMusicStyle;

  return (
    <div className="space-y-4">
      <div>
        <span className="text-lg font-semibold text-foreground">Audio</span>
        <p className="mt-0.5 text-sm text-muted-foreground">Choose how the video sounds.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {AUDIO_OPTIONS.map((a) => {
          const active = a.id === audioId;
          const Icon = ICONS[a.id] ?? Volume2;
          return (
            <button
              key={a.id}
              type="button"
              aria-pressed={active}
              onClick={() => onAudio(a.id)}
              className={`relative flex flex-col rounded-xl border p-3 text-left transition ${
                active ? "border-primary ring-2 ring-primary/30 bg-primary/5" : "border-border hover:border-primary/50"
              }`}
            >
              {active && (
                <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-3 w-3" />
                </span>
              )}
              <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${active ? "text-primary" : "text-muted-foreground"}`} />
                <span className="text-sm font-semibold text-foreground">{a.label}</span>
              </div>
              <p className="mt-1 text-xs leading-snug text-muted-foreground">{a.description}</p>
            </button>
          );
        })}
      </div>

      {/* Music style — only when Background music is selected */}
      {showMusicStyles && (
        <div>
          <div className="mb-2 text-sm font-medium text-foreground">Music style</div>
          <div className="flex flex-wrap gap-2">
            {MUSIC_STYLES.map((m) => {
              const on = m.id === musicStyleId;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onMusicStyle(m.id)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    on ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground hover:border-primary/50"
                  }`}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioBlock;
