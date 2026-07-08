import { useRef } from "react";
import { Users, Upload, PenLine, X } from "lucide-react";
import {
  MODEL_DESCRIBE_MAX_CHARS, MODEL_DESCRIBE_PLACEHOLDER,
  MODEL_UPLOAD_ACCEPTED, GARMENT_MAX_BYTES, type ModelMethod,
} from "@/lib/fashion-video-config";
import ModelSelector from "@/components/ModelSelector";

export interface ModelValue {
  method: ModelMethod;
  libraryModelUrl: string | null;   // selected avatar image URL from the shared library
  describe: string;
  uploadFile: File | null;
  uploadPreview: string | null;
}

export const defaultModelValue = (): ModelValue => ({
  method: "library",
  libraryModelUrl: null,
  describe: "",
  uploadFile: null,
  uploadPreview: null,
});

interface Props {
  value: ModelValue;
  onChange: (next: ModelValue) => void;
  onReject?: (reason: string) => void;
}

const TABS: { id: ModelMethod; label: string; icon: typeof Users }[] = [
  { id: "library", label: "Choose from library", icon: Users },
  { id: "upload", label: "Upload your model", icon: Upload },
  { id: "describe", label: "Describe a model", icon: PenLine },
];

/** Model selection (briefing §4): 3 mutually-exclusive tabs. */
const ModelSelectBlock = ({ value, onChange, onReject }: Props) => {
  const fileRef = useRef<HTMLInputElement>(null);

  const setUpload = (file: File | null) => {
    if (value.uploadPreview) URL.revokeObjectURL(value.uploadPreview);
    if (!file) { onChange({ ...value, uploadFile: null, uploadPreview: null }); return; }
    if (!MODEL_UPLOAD_ACCEPTED.includes(file.type)) { onReject?.("Use a JPG or PNG photo."); return; }
    if (file.size > GARMENT_MAX_BYTES) { onReject?.("Photo is over 20MB."); return; }
    onChange({ ...value, uploadFile: file, uploadPreview: URL.createObjectURL(file) });
  };

  return (
    <div className="space-y-4">
      <div>
        <span className="text-lg font-semibold text-foreground">Model</span>
        <p className="mt-0.5 text-sm text-muted-foreground">Pick how the model is created — one method at a time.</p>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {TABS.map((t) => {
          const active = value.method === t.id;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange({ ...value, method: t.id })}
              className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
                active ? "border-primary bg-primary/5 text-foreground ring-2 ring-primary/30"
                       : "border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              <Icon className="h-4 w-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Library — the shared avatar library with filter buttons */}
      {value.method === "library" && (
        <div className="rounded-xl border border-border p-4">
          <ModelSelector
            selectedModel={value.libraryModelUrl}
            onModelSelect={(url) => onChange({ ...value, libraryModelUrl: url || null })}
            columns={10}
            maxHeight="400px"
          />
        </div>
      )}

      {/* Tab 2: Upload a model photo */}
      {value.method === "upload" && (
        <div className="rounded-xl border border-border p-4">
          {value.uploadPreview ? (
            <div className="flex items-start gap-4">
              <div className="relative h-40 w-32 overflow-hidden rounded-lg border border-border bg-muted">
                <img src={value.uploadPreview} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setUpload(null)}
                  className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
                  aria-label="Remove"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                We keep this person's face, skin tone and proportions, and dress them in your garments.
              </p>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border py-8 text-muted-foreground transition hover:border-primary/50"
            >
              <Upload className="h-6 w-6" />
              <span className="text-sm font-medium">Upload a full-body photo</span>
              <span className="text-xs">JPG or PNG, max 20MB · neutral background, standing pose</span>
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept={MODEL_UPLOAD_ACCEPTED.join(",")}
            hidden
            onChange={(e) => { const f = e.target.files?.[0]; if (f) setUpload(f); e.target.value = ""; }}
          />
        </div>
      )}

      {/* Tab 3: Describe */}
      {value.method === "describe" && (
        <div className="rounded-xl border border-border p-4">
          <textarea
            value={value.describe}
            onChange={(e) => onChange({ ...value, describe: e.target.value.slice(0, MODEL_DESCRIBE_MAX_CHARS) })}
            placeholder={MODEL_DESCRIBE_PLACEHOLDER}
            rows={3}
            className="w-full resize-none rounded-lg border border-border bg-background p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <div className="mt-1 flex justify-end">
            <span className={`text-xs ${MODEL_DESCRIBE_MAX_CHARS - value.describe.length < 20 ? "text-amber-600" : "text-muted-foreground"}`}>
              {MODEL_DESCRIBE_MAX_CHARS - value.describe.length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelSelectBlock;
