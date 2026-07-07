import { useRef, useState } from "react";
import { Upload, X, GripVertical, Plus } from "lucide-react";
import {
  GARMENT_SECTIONS, GARMENT_ACCEPTED_FORMATS, GARMENT_MAX_BYTES, GARMENT_INPUT_TYPES,
  priorityBadgeClass, type GarmentCategoryId,
} from "@/lib/fashion-video-config";

export interface GarmentItem {
  id: string;
  file: File;
  previewUrl: string;
}
export type GarmentMap = Record<GarmentCategoryId, GarmentItem[]>;

export const emptyGarmentMap = (): GarmentMap => ({ top: [], bottom: [], shoes: [], accessories: [] });

interface Props {
  value: GarmentMap;
  onChange: (next: GarmentMap) => void;
  onReject?: (reason: string) => void;
}

let uid = 0;
const nextId = () => `g${Date.now()}_${uid++}`;

/**
 * Garment upload (briefing §3): four stacked sections, multiple items each (max 5),
 * per-item priority badge (1 = most screen time) with drag-to-reorder within a
 * section. Priority is the array order — index 0 is priority 1.
 */
const GarmentUploadBlock = ({ value, onChange, onReject }: Props) => {
  const [dragOver, setDragOver] = useState<GarmentCategoryId | null>(null);
  const [dragItem, setDragItem] = useState<{ cat: GarmentCategoryId; index: number } | null>(null);

  const addFiles = (cat: GarmentCategoryId, files: FileList | File[], max: number) => {
    const current = value[cat];
    const room = max - current.length;
    if (room <= 0) { onReject?.(`Max ${max} items in ${cat}.`); return; }
    const accepted: GarmentItem[] = [];
    for (const f of Array.from(files)) {
      if (accepted.length >= room) { onReject?.(`Only ${max} items allowed per section.`); break; }
      if (!GARMENT_ACCEPTED_FORMATS.includes(f.type)) { onReject?.(`${f.name}: use JPG, PNG or WebP.`); continue; }
      if (f.size > GARMENT_MAX_BYTES) { onReject?.(`${f.name} is over 20MB.`); continue; }
      accepted.push({ id: nextId(), file: f, previewUrl: URL.createObjectURL(f) });
    }
    if (accepted.length) onChange({ ...value, [cat]: [...current, ...accepted] });
  };

  const removeItem = (cat: GarmentCategoryId, id: string) => {
    const item = value[cat].find((i) => i.id === id);
    if (item) URL.revokeObjectURL(item.previewUrl);
    onChange({ ...value, [cat]: value[cat].filter((i) => i.id !== id) });
  };

  const reorder = (cat: GarmentCategoryId, from: number, to: number) => {
    if (from === to) return;
    const arr = [...value[cat]];
    const [moved] = arr.splice(from, 1);
    arr.splice(to, 0, moved);
    onChange({ ...value, [cat]: arr });
  };

  return (
    <div className="space-y-5">
      <div>
        <span className="text-lg font-semibold text-foreground">Garments</span>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Upload one or more items per section. Priority 1 gets the most screen time — drag to reorder.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Any image works: {GARMENT_INPUT_TYPES.join(" · ")}.
        </p>
      </div>

      {GARMENT_SECTIONS.map((section) => {
        const items = value[section.id];
        const full = items.length >= section.maxItems;
        return (
          <div key={section.id} className="rounded-xl border border-border p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">{section.label}</span>
                {section.required && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    Top or bottom required
                  </span>
                )}
              </div>
              <span className="text-xs text-muted-foreground">{items.length}/{section.maxItems}</span>
            </div>
            <p className="mb-3 text-xs text-muted-foreground">{section.examples}</p>

            <div className="flex flex-wrap gap-3">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => setDragItem({ cat: section.id, index })}
                  onDragOver={(e) => { e.preventDefault(); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (dragItem && dragItem.cat === section.id) reorder(section.id, dragItem.index, index);
                    setDragItem(null);
                  }}
                  className="group relative h-28 w-24 shrink-0 overflow-hidden rounded-lg border border-border bg-muted"
                >
                  <img src={item.previewUrl} alt="" className="h-full w-full object-cover" />
                  {/* Priority badge (array order = priority) */}
                  <span className={`absolute left-1 top-1 flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${priorityBadgeClass(index + 1)}`}>
                    {index + 1}
                  </span>
                  {items.length > 1 && (
                    <span className="absolute right-1 top-1 rounded bg-black/40 p-0.5 text-white opacity-0 transition group-hover:opacity-100" title="Drag to reorder">
                      <GripVertical className="h-3 w-3" />
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeItem(section.id, item.id)}
                    className="absolute bottom-1 right-1 rounded-full bg-black/50 p-1 text-white transition hover:bg-black/70"
                    aria-label="Remove"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}

              {/* Add tile */}
              {!full && (
                <UploadTile
                  cat={section.id}
                  isDragOver={dragOver === section.id}
                  onDragState={(over) => setDragOver(over ? section.id : null)}
                  onFiles={(files) => addFiles(section.id, files, section.maxItems)}
                  hasItems={items.length > 0}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const UploadTile = ({
  cat, isDragOver, onDragState, onFiles, hasItems,
}: {
  cat: GarmentCategoryId;
  isDragOver: boolean;
  onDragState: (over: boolean) => void;
  onFiles: (files: FileList) => void;
  hasItems: boolean;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); onDragState(true); }}
        onDragLeave={() => onDragState(false)}
        onDrop={(e) => {
          e.preventDefault();
          onDragState(false);
          if (e.dataTransfer.files?.length) onFiles(e.dataTransfer.files);
        }}
        className={`flex h-28 w-24 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-muted-foreground transition ${
          isDragOver ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/50"
        }`}
      >
        {hasItems ? <Plus className="h-5 w-5" /> : <Upload className="h-5 w-5" />}
        <span className="text-[10px] font-medium">{hasItems ? "Add" : "Upload"}</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={GARMENT_ACCEPTED_FORMATS.join(",")}
        multiple
        hidden
        onChange={(e) => { if (e.target.files?.length) onFiles(e.target.files); e.target.value = ""; }}
        data-category={cat}
      />
    </>
  );
};

export default GarmentUploadBlock;
