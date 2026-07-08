import { useState } from "react";
import { Upload, X, GripVertical } from "lucide-react";
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
 * Garment upload (briefing §3): four stacked sections styled like the Fashion
 * Studio upload blocks (card + aspect-square thumbnail grid + dashed add tile).
 * Multiple items per section (max 5), with a per-item priority badge (1 = most
 * screen time — array order) and drag-to-reorder within a section.
 */
const GarmentUploadBlock = ({ value, onChange, onReject }: Props) => {
  const [dragItem, setDragItem] = useState<{ cat: GarmentCategoryId; index: number } | null>(null);
  const [dragOver, setDragOver] = useState<GarmentCategoryId | null>(null);

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
          Upload one or more items per section. Any image works: {GARMENT_INPUT_TYPES.join(" · ")}.
        </p>
      </div>

      {GARMENT_SECTIONS.map((section) => {
        const items = value[section.id];
        const full = items.length >= section.maxItems;
        return (
          <div key={section.id} className="bg-card rounded-xl border border-border p-4 sm:p-6">
            <div className="mb-1 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">
                {section.label}
                {!section.required && <span className="ml-2 text-sm font-normal text-muted-foreground">(Optional)</span>}
              </h3>
              <span className="text-xs text-muted-foreground">{items.length}/{section.maxItems}</span>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              {section.examples}. Priority 1 gets the most screen time — drag to reorder.
            </p>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => setDragItem({ cat: section.id, index })}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (dragItem && dragItem.cat === section.id) reorder(section.id, dragItem.index, index);
                    setDragItem(null);
                  }}
                  className="group relative overflow-hidden rounded-lg border border-border bg-muted"
                >
                  <img src={item.previewUrl} alt="" className="aspect-square w-full object-contain p-2" />
                  {/* Priority badge (array order = priority) */}
                  <span className={`absolute left-1 top-1 flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${priorityBadgeClass(index + 1)}`}>
                    {index + 1}
                  </span>
                  {items.length > 1 && (
                    <span className="absolute left-7 top-1 rounded bg-black/40 p-0.5 text-white opacity-0 transition group-hover:opacity-100" title="Drag to reorder">
                      <GripVertical className="h-3 w-3" />
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeItem(section.id, item.id)}
                    className="absolute right-1 top-1 rounded-full bg-destructive p-1 text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label="Remove"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}

              {/* Dashed add tile — same look as the Fashion Studio upload blocks */}
              {!full && (
                <label
                  onDragOver={(e) => { e.preventDefault(); setDragOver(section.id); }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(null);
                    if (e.dataTransfer.files?.length) addFiles(section.id, e.dataTransfer.files, section.maxItems);
                  }}
                  className={`flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors ${
                    dragOver === section.id ? "border-primary bg-primary/5" : "border-border bg-muted/30 hover:border-primary/50"
                  }`}
                >
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">
                    {items.length > 0 ? "Add" : "Upload"}
                  </span>
                  <input
                    type="file"
                    accept={GARMENT_ACCEPTED_FORMATS.join(",")}
                    multiple
                    hidden
                    onChange={(e) => { if (e.target.files?.length) addFiles(section.id, e.target.files, section.maxItems); e.target.value = ""; }}
                  />
                </label>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default GarmentUploadBlock;
