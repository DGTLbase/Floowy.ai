import { ReactNode } from "react";
import { Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * "Reference image + description" settings block: a drop-zone on the left and
 * a one-line description on the right.
 *
 * Used for Fabric Close-up and Lining / Inside in Flatlay Studio's Generation
 * Settings. Both halves are optional and independent — image only, text only,
 * or both — so an untouched block sends nothing.
 */
interface Props {
  icon: ReactNode;
  title: string;
  description: string;
  inputLabel: string;
  placeholder: string;
  file: File | null;
  preview: string | null;
  onFileChange: (file: File | null) => void;
  value: string;
  onValueChange: (value: string) => void;
  maxLength?: number;
}

const ReferenceUploadBlock = ({
  icon,
  title,
  description,
  inputLabel,
  placeholder,
  file,
  preview,
  onFileChange,
  value,
  onValueChange,
  maxLength = 300,
}: Props) => (
  <div className="rounded-xl border bg-card p-5 space-y-4">
    <div>
      <Label className="text-base font-semibold flex items-center gap-2">
        {icon} {title}
      </Label>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4 items-start">
      {preview ? (
        <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-2">
          <img src={preview} alt="" className="h-16 w-16 rounded object-cover bg-white border" />
          <button
            type="button"
            onClick={() => onFileChange(null)}
            className="text-xs text-muted-foreground hover:text-destructive px-2"
          >
            Remove
          </button>
        </div>
      ) : (
        <label className="flex h-[88px] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed bg-muted/20 text-xs text-muted-foreground transition hover:border-primary/50 hover:bg-accent/30">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFileChange(f);
              e.target.value = "";
            }}
          />
          <Upload className="h-4 w-4 opacity-60" />
          <span>Upload image</span>
        </label>
      )}

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {inputLabel}
        </Label>
        <Input
          value={value}
          onChange={(e) => onValueChange(e.target.value.slice(0, maxLength))}
          placeholder={placeholder}
        />
        <div className="text-right text-[11px] text-muted-foreground">
          {value.length}/{maxLength}
        </div>
      </div>
    </div>
  </div>
);

export default ReferenceUploadBlock;
