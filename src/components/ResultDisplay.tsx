import { useState } from "react";
import { Button } from "./ui/button";
import { Download, RefreshCw, Pencil, ChevronDown, Video, Maximize2, X, ChevronLeft, ChevronRight, Lock, Sparkles } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
} from "./ui/dialog";
import ImageEditModal from "./ImageEditModal";
import { jsPDF } from "jspdf";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { UnlockDialog } from "./UnlockDialog";
import { useEffect, useRef } from "react";
import { applyWatermarkIfFree } from "@/lib/watermark";

type ExportFormat = "png" | "jpg" | "webp" | "pdf";

interface ResultDisplayProps {
  imageUrls: string[];
  onReset: () => void;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
  isAdmin?: boolean;
  onMakeVideo?: (imageUrl: string) => void;
}

const ResultDisplay = ({ imageUrls, onReset, onRegenerate, isRegenerating = false, isAdmin = false, onMakeVideo }: ResultDisplayProps) => {
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);
  const [currentImages, setCurrentImages] = useState<string[]>(imageUrls);
  const [parentUrls, setParentUrls] = useState<string[]>(imageUrls);
  const [enlargedIndex, setEnlargedIndex] = useState<number | null>(null);
  const [unlockOpen, setUnlockOpen] = useState(false);
  // Per-image watermarked variants (only populated for free users).
  const [watermarkedUrls, setWatermarkedUrls] = useState<Record<string, string>>({});
  const watermarkInFlight = useRef<Set<string>>(new Set());

  // Watermark/paywall: free (non-subscribed) users can't download or edit.
  // Admins are treated as paid by useSubscriptionStatus, but the legacy
  // `isAdmin` prop is also honored as a fallback.
  const { isPaid } = useSubscriptionStatus();
  const canExport = isPaid || isAdmin;

  // Free users: lazily fetch a server-side watermarked version of each
  // result. Clean URLs remain in `currentImages` and `generated_image_url`
  // on the row, so upgrading instantly unlocks the originals.
  useEffect(() => {
    if (canExport) return;
    currentImages.forEach((url) => {
      if (!url) return;
      if (watermarkedUrls[url]) return;
      if (watermarkInFlight.current.has(url)) return;
      watermarkInFlight.current.add(url);
      applyWatermarkIfFree(url).then((wm) => {
        if (wm) {
          setWatermarkedUrls((prev) => ({ ...prev, [url]: wm }));
        }
      });
    });
  }, [currentImages, canExport, watermarkedUrls]);

  // Helper: what URL to actually show in the UI for a given clean URL.
  const displayUrl = (clean: string) =>
    canExport ? clean : (watermarkedUrls[clean] ?? clean);

  // Sync only when the parent provides genuinely new images (not our own edits)
  if (imageUrls !== parentUrls) {
    setParentUrls(imageUrls);
    setCurrentImages(imageUrls);
  }

  const loadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  };

  const canvasFromImage = (img: HTMLImageElement): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    return canvas;
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
  };

  const handleDownload = async (imageUrl: string, index: number, format: ExportFormat = "png") => {
    if (!canExport) {
      setUnlockOpen(true);
      return;
    }
    try {
      const img = await loadImage(imageUrl);
      const canvas = canvasFromImage(img);
      const filename = `floowy-${Date.now()}-${index + 1}`;

      if (format === "pdf") {
        const imgWidth = img.naturalWidth;
        const imgHeight = img.naturalHeight;
        const orientation = imgWidth > imgHeight ? "landscape" : "portrait";
        const pdf = new jsPDF({ orientation, unit: "px", format: [imgWidth, imgHeight] });
        const dataUrl = canvas.toDataURL("image/png");
        pdf.addImage(dataUrl, "PNG", 0, 0, imgWidth, imgHeight);
        pdf.save(`${filename}.pdf`);
        return;
      }

      const mimeMap: Record<string, string> = { png: "image/png", jpg: "image/jpeg", webp: "image/webp" };
      const quality = format === "png" ? undefined : 0.92;
      canvas.toBlob((blob) => {
        if (blob) downloadBlob(blob, `${filename}.${format}`);
      }, mimeMap[format], quality);
    } catch (error) {
      console.error('Download failed, opening in new tab:', error);
      window.open(imageUrl, '_blank');
    }
  };

  const handleDownloadAll = async (format: ExportFormat = "png") => {
    if (!canExport) {
      setUnlockOpen(true);
      return;
    }
    if (format === "pdf") {
      try {
        const images = await Promise.all(currentImages.map(loadImage));
        const first = images[0];
        const orientation = first.naturalWidth > first.naturalHeight ? "landscape" : "portrait";
        const pdf = new jsPDF({ orientation, unit: "px", format: [first.naturalWidth, first.naturalHeight] });

        images.forEach((img, i) => {
          if (i > 0) pdf.addPage([img.naturalWidth, img.naturalHeight], img.naturalWidth > img.naturalHeight ? "landscape" : "portrait");
          const canvas = canvasFromImage(img);
          pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, img.naturalWidth, img.naturalHeight);
        });

        pdf.save(`floowy-${Date.now()}-all.pdf`);
      } catch (error) {
        console.error("PDF generation failed:", error);
      }
      return;
    }
    currentImages.forEach((url, index) => {
      setTimeout(() => handleDownload(url, index, format), index * 500);
    });
  };

  const handleEditComplete = (newImageUrl: string) => {
    if (editingImageIndex !== null) {
      setCurrentImages((prev) => {
        const next = [...prev];
        next[editingImageIndex] = newImageUrl;
        return next;
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-card rounded-2xl border border-border/50 p-8 shadow-elegant">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-foreground mb-2">Your Generated Photos</h2>
          <p className="text-muted-foreground">
            {currentImages.length} generated images ready to download or edit
          </p>
        </div>

        <div className={`grid ${currentImages.length === 1 ? 'grid-cols-1 max-w-md mx-auto' : currentImages.length === 2 ? 'grid-cols-1 sm:grid-cols-2 max-w-3xl mx-auto' : 'grid-cols-2 lg:grid-cols-4'} gap-4 sm:gap-6 mb-6`}>
          {currentImages.map((url, index) => (
            <div key={`${index}-${url}`} className="space-y-3">
              <div className="rounded-xl overflow-hidden border border-border group relative">
                <img
                  src={displayUrl(url)}
                  alt={`Generated photo ${index + 1}`}
                  className="w-full h-auto"
                />
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="shadow-lg"
                    onClick={() => setEnlargedIndex(index)}
                  >
                    <Maximize2 className="w-4 h-4 mr-1" />
                    Enlarge
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="shadow-lg"
                    onClick={() => {
                      if (!canExport) { setUnlockOpen(true); return; }
                      setEditingImageIndex(index);
                    }}
                  >
                    {canExport ? (
                      <><Pencil className="w-4 h-4 mr-1" />Edit</>
                    ) : (
                      <><Lock className="w-4 h-4 mr-1" />Unlock</>
                    )}
                  </Button>
                </div>
              </div>
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex-1" size="sm">
                      <Download className="w-4 h-4 mr-1" />
                      Download
                      <ChevronDown className="w-3 h-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => handleDownload(url, index, "png")}>PNG</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDownload(url, index, "jpg")}>JPG</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDownload(url, index, "webp")}>WEBP</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDownload(url, index, "pdf")}>PDF</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                {onMakeVideo && (
                  <Button
                    onClick={() => onMakeVideo(url)}
                    variant="outline"
                    size="sm"
                    title="Make a Video"
                  >
                    <Video className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  onClick={() => {
                    if (!canExport) { setUnlockOpen(true); return; }
                    setEditingImageIndex(index);
                  }}
                  variant="outline"
                  size="sm"
                >
                  {canExport ? <Pencil className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          {!canExport && (
            <Button
              onClick={() => setUnlockOpen(true)}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Unlock to Download
            </Button>
          )}
          {canExport && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow">
                <Download className="w-5 h-5 mr-2" />
                Download All
                <ChevronDown className="w-4 h-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleDownloadAll("png")}>PNG</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownloadAll("jpg")}>JPG</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownloadAll("webp")}>WEBP</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownloadAll("pdf")}>PDF</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          )}
          {onRegenerate && (
            <Button
              onClick={onRegenerate}
              disabled={isRegenerating}
              variant="secondary"
              className="flex-1"
            >
              {isRegenerating ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Regenerating...
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Regenerate
                </>
              )}
            </Button>
          )}
          <Button onClick={onReset} variant="outline" className="flex-1">
            <RefreshCw className="w-5 h-5 mr-2" />
            Create Another
          </Button>
        </div>
      </div>

      {/* Image Edit Modal */}
      {editingImageIndex !== null && (
        <ImageEditModal
          open={editingImageIndex !== null}
          onOpenChange={(open) => { if (!open) setEditingImageIndex(null); }}
          imageUrl={currentImages[editingImageIndex]}
          onEditComplete={handleEditComplete}
          isAdmin={isAdmin}
        />
      )}

      {/* Enlarge / Lightbox Modal */}
      <Dialog open={enlargedIndex !== null} onOpenChange={(open) => { if (!open) setEnlargedIndex(null); }}>
        <DialogContent hideClose className="max-w-[95vw] max-h-[95vh] w-auto p-0 bg-black/95 border-none overflow-hidden">
          {enlargedIndex !== null && (
            <div className="relative flex items-center justify-center w-full h-full">
              <img
                src={displayUrl(currentImages[enlargedIndex])}
                alt={`Generated photo ${enlargedIndex + 1}`}
                className="max-w-[90vw] max-h-[85vh] object-contain"
              />
              {/* Close */}
              <Button
                size="icon"
                variant="ghost"
                className="absolute top-3 right-3 text-white hover:bg-white/20 rounded-full"
                onClick={() => setEnlargedIndex(null)}
              >
                <X className="w-5 h-5" />
              </Button>
              {/* Nav arrows */}
              {currentImages.length > 1 && (
                <>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 rounded-full"
                    onClick={() => setEnlargedIndex((enlargedIndex - 1 + currentImages.length) % currentImages.length)}
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 rounded-full"
                    onClick={() => setEnlargedIndex((enlargedIndex + 1) % currentImages.length)}
                  >
                    <ChevronRight className="w-6 h-6" />
                  </Button>
                </>
              )}
              {/* Image counter */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white/70 text-sm">
                {enlargedIndex + 1} / {currentImages.length}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <UnlockDialog open={unlockOpen} onOpenChange={setUnlockOpen} />
    </div>
  );
};

export default ResultDisplay;
