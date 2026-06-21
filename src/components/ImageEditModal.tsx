import { useState, useRef, useEffect, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Paintbrush, Eraser, RotateCcw, Circle, Square, Lasso,
  Loader2, Wand2, ZoomIn, ZoomOut, Maximize, X, Sparkles, Trash2,
  Undo2, Redo2, MousePointer, User, Download, FileImage, FileText, ImageMinus,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ImageEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  onEditComplete: (newImageUrl: string) => void;
  isAdmin?: boolean;
}

type SelectionTool = "brush" | "eraser" | "rectangle" | "lasso" | "wand" | "magic-eraser";
type MagicEraserMode = "brush" | "click" | "foreground";

const TOOLS_ALWAYS: { id: SelectionTool; icon: typeof Paintbrush; label: string; shortcut?: string }[] = [
  { id: "brush", icon: Paintbrush, label: "Brush", shortcut: "B" },
  { id: "wand", icon: Wand2, label: "Magic Wand", shortcut: "W" },
  { id: "rectangle", icon: Square, label: "Rectangle", shortcut: "R" },
  { id: "lasso", icon: Lasso, label: "Lasso", shortcut: "L" },
  { id: "magic-eraser", icon: Trash2, label: "Magic Eraser", shortcut: "D" },
];

const TOOLS_MASK_ONLY: { id: SelectionTool; icon: typeof Paintbrush; label: string; shortcut?: string }[] = [
  { id: "eraser", icon: Eraser, label: "Eraser", shortcut: "E" },
];

const ImageEditModal = ({
  open,
  onOpenChange,
  imageUrl,
  onEditComplete,
  isAdmin = false,
}: ImageEditModalProps) => {
  const { toast } = useToast();
  const checkerboardBg = `url("data:image/svg+xml,${encodeURIComponent('<svg width="20" height="20" xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10" fill="#ccc"/><rect x="10" y="10" width="10" height="10" fill="#ccc"/><rect x="10" width="10" height="10" fill="#fff"/><rect y="10" width="10" height="10" fill="#fff"/></svg>')}")`;

  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const loadedImageRef = useRef<HTMLImageElement | null>(null);
  const hasBeenEditedRef = useRef(false);
  const internalImageUrlRef = useRef<string>("");

  // State
  const [tool, setTool] = useState<SelectionTool>("brush");
  const [magicEraserMode, setMagicEraserMode] = useState<MagicEraserMode | null>(null);
  const [showMagicEraserDialog, setShowMagicEraserDialog] = useState(false);
  const [brushSize, setBrushSize] = useState(30);
  const [brushHardness, setBrushHardness] = useState<"hard" | "soft">("soft");
  const [wandTolerance, setWandTolerance] = useState(32);
  const [isDrawing, setIsDrawing] = useState(false);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const [editPrompt, setEditPrompt] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editingType, setEditingType] = useState<"edit" | "eraser">("edit");
  const [maskDataUrl, setMaskDataUrl] = useState("");
  const [canvasSize, setCanvasSize] = useState({ width: 512, height: 512 });
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  
  // Before/After comparison state
  const [compareResult, setCompareResult] = useState<{ beforeUrl: string; afterUrl: string } | null>(null);
  const preCompareStateRef = useRef<{ image: HTMLImageElement; dimensions: { width: number; height: number }; canvasSize: { width: number; height: number }; wasEdited: boolean } | null>(null);
  const [compareSliderPos, setCompareSliderPos] = useState(50);
  const [isCompareDragging, setIsCompareDragging] = useState(false);
  const compareRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Rectangle / Lasso state
  const [rectStart, setRectStart] = useState<{ x: number; y: number } | null>(null);
  const [rectEnd, setRectEnd] = useState<{ x: number; y: number } | null>(null);
  const [lassoPoints, setLassoPoints] = useState<{ x: number; y: number }[]>([]);

  // Undo / Redo history (stores mask ImageData snapshots)
  const maskHistoryRef = useRef<ImageData[]>([]);
  const maskRedoRef = useRef<ImageData[]>([]);
  const [undoCount, setUndoCount] = useState(0);
  const [redoCount, setRedoCount] = useState(0);

  // Hover preview for click/wand modes
  const hoverPreviewRef = useRef<Float32Array | null>(null);
  const hoverPreviewSizeRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });
  const hoverThrottleRef = useRef<number>(0);

  const saveMaskSnapshot = useCallback(() => {
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;
    const maskCtx = maskCanvas.getContext("2d")!;
    const snapshot = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
    maskHistoryRef.current.push(snapshot);
    if (maskHistoryRef.current.length > 50) maskHistoryRef.current.shift();
    maskRedoRef.current = [];
    setUndoCount(maskHistoryRef.current.length);
    setRedoCount(0);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
      // Ctrl+Z / Cmd+Z = undo, Ctrl+Shift+Z / Cmd+Shift+Z = redo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) { redo(); } else { undo(); }
        return;
      }
      const map: Record<string, SelectionTool> = { b: "brush", e: "eraser", w: "wand", r: "rectangle", l: "lasso", d: "magic-eraser" };
      if (map[e.key.toLowerCase()]) {
        const newTool = map[e.key.toLowerCase()];
        if (newTool === "magic-eraser" && tool !== "magic-eraser") clearMask();
        setTool(newTool);
        e.preventDefault();
      }
      if (e.key === "c" || e.key === "C") clearMask();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Load image when modal opens or when a genuinely new image is provided
  useEffect(() => {
    if (!open || !imageUrl) return;
    // Skip reload if the URL was already set by our own edit (handleKeepNew)
    if (internalImageUrlRef.current === imageUrl) return;
    internalImageUrlRef.current = imageUrl;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      // Full-screen sizing
      const maxW = window.innerWidth - 32;
      const maxH = window.innerHeight - 260;
      const scale = Math.min(maxW / img.width, maxH / img.height, 1);
      const cw = Math.round(img.width * scale);
      const ch = Math.round(img.height * scale);

      setImageDimensions({ width: img.width, height: img.height });
      setCanvasSize({ width: cw, height: ch });
      loadedImageRef.current = img;
      hasBeenEditedRef.current = false;

      requestAnimationFrame(() => {
        const canvas = canvasRef.current;
        const maskCanvas = maskCanvasRef.current;
        if (!canvas || !maskCanvas) return;

        canvas.width = cw;
        canvas.height = ch;
        maskCanvas.width = img.width;
        maskCanvas.height = img.height;

        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, cw, ch);

        const maskCtx = maskCanvas.getContext("2d")!;
        maskCtx.fillStyle = "black";
        maskCtx.fillRect(0, 0, img.width, img.height);
      });
    };
    img.src = imageUrl;

    return () => {
      internalImageUrlRef.current = "";
      setMaskDataUrl("");
      setEditPrompt("");
      setRectStart(null);
      setRectEnd(null);
      setLassoPoints([]);
      setZoom(1);
      setPanOffset({ x: 0, y: 0 });
      maskHistoryRef.current = [];
      maskRedoRef.current = [];
      setUndoCount(0);
      setRedoCount(0);
      setPanOffset({ x: 0, y: 0 });
    };
  }, [open, imageUrl]);

  // Zoom helpers
  const handleZoomIn = useCallback(() => setZoom(z => Math.min(z + 0.25, 4)), []);
  const handleZoomOut = useCallback(() => setZoom(z => Math.max(z - 0.25, 0.5)), []);
  const handleZoomReset = useCallback(() => { setZoom(1); setPanOffset({ x: 0, y: 0 }); }, []);

  // Scroll wheel zoom on canvas container
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container || !open) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.15 : 0.15;
      setZoom(z => Math.min(Math.max(z + delta, 0.5), 4));
    };
    container.addEventListener('wheel', onWheel, { passive: false });
    return () => container.removeEventListener('wheel', onWheel);
  }, [open]);

  const redrawComposite = useCallback(() => {
    const canvas = canvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!canvas || !maskCanvas || !loadedImageRef.current) return;

    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(loadedImageRef.current, 0, 0, canvasSize.width, canvasSize.height);

    const overlayCanvas = document.createElement("canvas");
    overlayCanvas.width = canvasSize.width;
    overlayCanvas.height = canvasSize.height;
    const overlayCtx = overlayCanvas.getContext("2d")!;
    overlayCtx.drawImage(maskCanvas, 0, 0, canvasSize.width, canvasSize.height);
    const overlayData = overlayCtx.getImageData(0, 0, canvasSize.width, canvasSize.height);

    for (let i = 0; i < overlayData.data.length; i += 4) {
      const brightness = overlayData.data[i];
      if (brightness > 10) {
        overlayData.data[i] = 59;
        overlayData.data[i + 1] = 130;
        overlayData.data[i + 2] = 246;
        overlayData.data[i + 3] = Math.round(brightness * 0.4);
      } else {
        overlayData.data[i + 3] = 0;
      }
    }

    // Draw hover preview overlay (orange tint) if available
    const preview = hoverPreviewRef.current;
    const ps = hoverPreviewSizeRef.current;
    if (preview && ps.w === canvasSize.width && ps.h === canvasSize.height) {
      for (let i = 0; i < preview.length; i++) {
        if (preview[i] > 0.01) {
          const pi = i * 4;
          // Blend orange hover preview on top (don't overwrite existing mask)
          if (overlayData.data[pi + 3] === 0) {
            overlayData.data[pi] = 168;
            overlayData.data[pi + 1] = 85;
            overlayData.data[pi + 2] = 247;
            overlayData.data[pi + 3] = Math.round(preview[i] * 100);
          }
        }
      }
    }

    overlayCtx.putImageData(overlayData, 0, 0);
    ctx.drawImage(overlayCanvas, 0, 0);

    setMaskDataUrl(maskCanvas.toDataURL("image/png"));
  }, [canvasSize]);

  const undo = useCallback(() => {
    const mc = maskCanvasRef.current;
    if (!mc || maskHistoryRef.current.length === 0) return;
    const ctx = mc.getContext("2d")!;
    maskRedoRef.current.push(ctx.getImageData(0, 0, mc.width, mc.height));
    ctx.putImageData(maskHistoryRef.current.pop()!, 0, 0);
    setUndoCount(maskHistoryRef.current.length);
    setRedoCount(maskRedoRef.current.length);
    redrawComposite();
  }, [redrawComposite]);

  const redo = useCallback(() => {
    const mc = maskCanvasRef.current;
    if (!mc || maskRedoRef.current.length === 0) return;
    const ctx = mc.getContext("2d")!;
    maskHistoryRef.current.push(ctx.getImageData(0, 0, mc.width, mc.height));
    ctx.putImageData(maskRedoRef.current.pop()!, 0, 0);
    setUndoCount(maskHistoryRef.current.length);
    setRedoCount(maskRedoRef.current.length);
    redrawComposite();
  }, [redrawComposite]);

  const getPos = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      const rect = canvasRef.current!.getBoundingClientRect();
      let clientX: number, clientY: number;
      if ("touches" in e) {
        const touch = e.touches[0];
        clientX = touch.clientX;
        clientY = touch.clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      return {
        x: (clientX - rect.left) / zoom,
        y: (clientY - rect.top) / zoom,
      };
    },
    [zoom]
  );

  const drawBrushAt = useCallback(
    (x: number, y: number) => {
      const maskCanvas = maskCanvasRef.current!;
      const maskCtx = maskCanvas.getContext("2d")!;
      const scaleX = imageDimensions.width / canvasSize.width;
      const scaleY = imageDimensions.height / canvasSize.height;
      const mx = x * scaleX;
      const my = y * scaleY;
      const mSize = brushSize * scaleX;

      const isEraser = tool === "eraser";
      maskCtx.globalCompositeOperation = "source-over";

      if (brushHardness === "soft") {
        const gradient = maskCtx.createRadialGradient(mx, my, 0, mx, my, mSize / 2);
        gradient.addColorStop(0, isEraser ? "rgba(0,0,0,1)" : "rgba(255,255,255,1)");
        gradient.addColorStop(1, isEraser ? "rgba(0,0,0,0)" : "rgba(255,255,255,0)");
        maskCtx.fillStyle = gradient;
      } else {
        maskCtx.fillStyle = isEraser ? "black" : "white";
      }

      maskCtx.beginPath();
      maskCtx.arc(mx, my, mSize / 2, 0, Math.PI * 2);
      maskCtx.fill();
      redrawComposite();
    },
    [brushSize, brushHardness, tool, imageDimensions, canvasSize, redrawComposite]
  );

  const fillRectOnMask = useCallback(
    (start: { x: number; y: number }, end: { x: number; y: number }) => {
      const maskCanvas = maskCanvasRef.current!;
      const maskCtx = maskCanvas.getContext("2d")!;
      const scaleX = imageDimensions.width / canvasSize.width;
      const scaleY = imageDimensions.height / canvasSize.height;

      const x = Math.min(start.x, end.x) * scaleX;
      const y = Math.min(start.y, end.y) * scaleY;
      const w = Math.abs(end.x - start.x) * scaleX;
      const h = Math.abs(end.y - start.y) * scaleY;

      maskCtx.fillStyle = "white";
      maskCtx.fillRect(x, y, w, h);
      redrawComposite();
    },
    [imageDimensions, canvasSize, redrawComposite]
  );

  const fillLassoOnMask = useCallback(
    (points: { x: number; y: number }[]) => {
      if (points.length < 3) return;
      const maskCanvas = maskCanvasRef.current!;
      const maskCtx = maskCanvas.getContext("2d")!;
      const scaleX = imageDimensions.width / canvasSize.width;
      const scaleY = imageDimensions.height / canvasSize.height;

      maskCtx.fillStyle = "white";
      maskCtx.beginPath();
      maskCtx.moveTo(points[0].x * scaleX, points[0].y * scaleY);
      for (let i = 1; i < points.length; i++) {
        maskCtx.lineTo(points[i].x * scaleX, points[i].y * scaleY);
      }
      maskCtx.closePath();
      maskCtx.fill();
      redrawComposite();
    },
    [imageDimensions, canvasSize, redrawComposite]
  );

  const colorDistance = useCallback((r1: number, g1: number, b1: number, r2: number, g2: number, b2: number) => {
    // Simple Euclidean distance in RGB, normalized to 0-255 range
    const dr = r1 - r2;
    const dg = g1 - g2;
    const db = b1 - b2;
    return Math.sqrt(dr * dr + dg * dg + db * db);
  }, []);

  const floodFillAt = useCallback(
    (x: number, y: number, additive: boolean = false) => {
      const canvas = canvasRef.current;
      const maskCanvas = maskCanvasRef.current;
      const img = loadedImageRef.current;
      if (!canvas || !maskCanvas || !img) return;

      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = canvasSize.width;
      tempCanvas.height = canvasSize.height;
      const tempCtx = tempCanvas.getContext("2d")!;
      tempCtx.drawImage(img, 0, 0, canvasSize.width, canvasSize.height);
      const imgData = tempCtx.getImageData(0, 0, canvasSize.width, canvasSize.height);
      const { data, width, height } = imgData;

      const px = Math.round(x);
      const py = Math.round(y);
      if (px < 0 || py < 0 || px >= width || py >= height) return;

      const startIdx = (py * width + px) * 4;
      const sr = data[startIdx], sg = data[startIdx + 1], sb = data[startIdx + 2];
      const tol = wandTolerance * 1.7; // Max ~442 from sqrt(3*255^2), scale tolerance intuitively
      const result = new Float32Array(width * height);
      const visited = new Uint8Array(width * height);
      const stack = [px, py];

      while (stack.length > 0) {
        const cy = stack.pop()!;
        const cx = stack.pop()!;
        if (cx < 0 || cx >= width || cy < 0 || cy >= height) continue;
        const idx = cy * width + cx;
        if (visited[idx]) continue;
        visited[idx] = 1;

        const pi = idx * 4;
        const dist = colorDistance(data[pi], data[pi + 1], data[pi + 2], sr, sg, sb);
        if (dist > tol) continue;

        const strength = dist < tol * 0.6 ? 1.0 : 1.0 - ((dist - tol * 0.6) / (tol * 0.4));
        result[idx] = Math.max(result[idx], strength);

        // 8-directional connectivity for better edge following
        stack.push(cx - 1, cy);
        stack.push(cx + 1, cy);
        stack.push(cx, cy - 1);
        stack.push(cx, cy + 1);
        stack.push(cx - 1, cy - 1);
        stack.push(cx + 1, cy - 1);
        stack.push(cx - 1, cy + 1);
        stack.push(cx + 1, cy + 1);
      }

      const feathered = new Float32Array(result);
      const radius = 2;
      for (let pass = 0; pass < 2; pass++) {
        const src = pass === 0 ? result : feathered;
        const dst = pass === 0 ? feathered : result;
        for (let iy = 0; iy < height; iy++) {
          for (let ix = 0; ix < width; ix++) {
            let sum = 0, count = 0;
            for (let ky = -radius; ky <= radius; ky++) {
              for (let kx = -radius; kx <= radius; kx++) {
                const nx = ix + kx, ny = iy + ky;
                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                  sum += src[ny * width + nx];
                  count++;
                }
              }
            }
            dst[iy * width + ix] = sum / count;
          }
        }
      }

      const maskCtx = maskCanvas.getContext("2d")!;
      const scaleX = imageDimensions.width / canvasSize.width;
      const scaleY = imageDimensions.height / canvasSize.height;
      const maskData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);

      for (let dy = 0; dy < height; dy++) {
        for (let dx = 0; dx < width; dx++) {
          const val = result[dy * width + dx];
          if (val <= 0.01) continue;
          const brightness = Math.round(val * 255);
          const mx = Math.round(dx * scaleX);
          const my = Math.round(dy * scaleY);
          const mx2 = Math.min(Math.round((dx + 1) * scaleX), maskCanvas.width);
          const my2 = Math.min(Math.round((dy + 1) * scaleY), maskCanvas.height);
          for (let fy = my; fy < my2; fy++) {
            for (let fx = mx; fx < mx2; fx++) {
              const mi = (fy * maskCanvas.width + fx) * 4;
              if (additive) {
                maskData.data[mi] = Math.max(maskData.data[mi], brightness);
                maskData.data[mi + 1] = Math.max(maskData.data[mi + 1], brightness);
                maskData.data[mi + 2] = Math.max(maskData.data[mi + 2], brightness);
              } else {
                maskData.data[mi] = brightness;
                maskData.data[mi + 1] = brightness;
                maskData.data[mi + 2] = brightness;
              }
              maskData.data[mi + 3] = 255;
            }
          }
        }
      }
      maskCtx.putImageData(maskData, 0, 0);
      redrawComposite();
    },
    [canvasSize, imageDimensions, wandTolerance, redrawComposite, colorDistance]
  );

  const drawTempOverlay = useCallback(
    (currentPos?: { x: number; y: number }) => {
      redrawComposite();
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d")!;

      ctx.strokeStyle = "rgba(59, 130, 246, 0.8)";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 3]);

      if (tool === "rectangle" && rectStart && currentPos) {
        const x = Math.min(rectStart.x, currentPos.x);
        const y = Math.min(rectStart.y, currentPos.y);
        const w = Math.abs(currentPos.x - rectStart.x);
        const h = Math.abs(currentPos.y - rectStart.y);
        ctx.strokeRect(x, y, w, h);
      }

      if (tool === "lasso" && lassoPoints.length > 1) {
        ctx.beginPath();
        ctx.moveTo(lassoPoints[0].x, lassoPoints[0].y);
        for (let i = 1; i < lassoPoints.length; i++) {
          ctx.lineTo(lassoPoints[i].x, lassoPoints[i].y);
        }
        if (currentPos) ctx.lineTo(currentPos.x, currentPos.y);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    },
    [tool, rectStart, lassoPoints, redrawComposite]
  );
  // Compute hover preview for click/wand mode (lightweight flood fill, throttled)
  const computeHoverPreview = useCallback(
    (x: number, y: number) => {
      const now = Date.now();
      if (now - hoverThrottleRef.current < 80) return; // throttle to ~12fps
      hoverThrottleRef.current = now;

      const canvas = canvasRef.current;
      const img = loadedImageRef.current;
      if (!canvas || !img) return;

      const w = canvasSize.width;
      const h = canvasSize.height;

      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = w;
      tempCanvas.height = h;
      const tempCtx = tempCanvas.getContext("2d")!;
      tempCtx.drawImage(img, 0, 0, w, h);
      const imgData = tempCtx.getImageData(0, 0, w, h);
      const data = imgData.data;

      const px = Math.round(x);
      const py = Math.round(y);
      if (px < 0 || py < 0 || px >= w || py >= h) {
        hoverPreviewRef.current = null;
        redrawComposite();
        return;
      }

      const startIdx = (py * w + px) * 4;
      const sr = data[startIdx], sg = data[startIdx + 1], sb = data[startIdx + 2];
      const tol = wandTolerance * 1.7;
      const result = new Float32Array(w * h);
      const visited = new Uint8Array(w * h);
      const stack = [px, py];
      // Limit iterations for performance during hover
      let iterations = 0;
      const MAX_ITER = 50000;

      while (stack.length > 0 && iterations < MAX_ITER) {
        const cy = stack.pop()!;
        const cx = stack.pop()!;
        if (cx < 0 || cx >= w || cy < 0 || cy >= h) continue;
        const idx = cy * w + cx;
        if (visited[idx]) continue;
        visited[idx] = 1;
        iterations++;

        const pi = idx * 4;
        const dist = colorDistance(data[pi], data[pi + 1], data[pi + 2], sr, sg, sb);
        if (dist > tol) continue;

        result[idx] = dist < tol * 0.6 ? 1.0 : 1.0 - ((dist - tol * 0.6) / (tol * 0.4));
        stack.push(cx - 1, cy, cx + 1, cy, cx, cy - 1, cx, cy + 1);
      }

      hoverPreviewRef.current = result;
      hoverPreviewSizeRef.current = { w, h };
      redrawComposite();
    },
    [canvasSize, wandTolerance, colorDistance, redrawComposite]
  );

  // Clear hover preview
  const clearHoverPreview = useCallback(() => {
    if (hoverPreviewRef.current) {
      hoverPreviewRef.current = null;
      redrawComposite();
    }
  }, [redrawComposite]);

  const handleDownload = useCallback(async (format: "png" | "jpg" | "webp" | "pdf") => {
    const img = loadedImageRef.current;
    if (!img) return;
    try {
      const canvas = document.createElement("canvas");
      canvas.width = imageDimensions.width;
      canvas.height = imageDimensions.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, imageDimensions.width, imageDimensions.height);

      if (format === "pdf") {
        const { default: jsPDF } = await import("jspdf");
        const w = imageDimensions.width;
        const h = imageDimensions.height;
        const orientation = w > h ? "landscape" : "portrait";
        const pdf = new jsPDF({ orientation, unit: "px", format: [w, h] });
        const dataUrl = canvas.toDataURL("image/png");
        pdf.addImage(dataUrl, "PNG", 0, 0, w, h);
        pdf.save("edited-image.pdf");
      } else {
        const mimeType = format === "jpg" ? "image/jpeg" : `image/${format}`;
        const ext = format;
        canvas.toBlob((blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `edited-image.${ext}`;
          a.click();
          URL.revokeObjectURL(url);
        }, mimeType, 0.95);
      }
      toast({ title: "Downloaded!", description: `Image saved as ${format.toUpperCase()}` });
    } catch (err: any) {
      toast({ title: "Download failed", description: err.message, variant: "destructive" });
    }
  }, [imageDimensions, toast]);

  // multi-pass background modeling, morphological ops, and connected component analysis
  const detectForeground = useCallback(() => {
    const maskCanvas = maskCanvasRef.current;
    const img = loadedImageRef.current;
    if (!maskCanvas || !img) return;

    saveMaskSnapshot();

    // Work at reduced resolution for speed
    const MAX_DIM = 300;
    const sc = Math.min(MAX_DIM / img.width, MAX_DIM / img.height, 1);
    const w = Math.round(img.width * sc);
    const h = Math.round(img.height * sc);
    const totalPx = w * h;

    const tc = document.createElement("canvas");
    tc.width = w; tc.height = h;
    const tctx = tc.getContext("2d")!;
    tctx.drawImage(img, 0, 0, w, h);
    const imgData = tctx.getImageData(0, 0, w, h);
    const d = imgData.data;

    // --- Approach: GrabCut-inspired with edge color model ---
    // 1. Build color model from border pixels (outer 5% strip)
    const borderW = Math.max(3, Math.round(w * 0.05));
    const borderH = Math.max(3, Math.round(h * 0.05));
    const bgPixels: number[][] = [];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (x < borderW || x >= w - borderW || y < borderH || y >= h - borderH) {
          const pi = (y * w + x) * 4;
          bgPixels.push([d[pi], d[pi + 1], d[pi + 2]]);
        }
      }
    }

    // 2. K-means cluster bg colors into up to 4 clusters
    const K = Math.min(4, bgPixels.length);
    const centers: number[][] = [];
    for (let i = 0; i < K; i++) {
      centers.push([...bgPixels[Math.floor(i * bgPixels.length / K)]]);
    }
    // Run 8 iterations of k-means
    for (let iter = 0; iter < 8; iter++) {
      const sums = centers.map(() => [0, 0, 0]);
      const counts = new Array(K).fill(0);
      for (const px of bgPixels) {
        let bestK = 0, bestD = Infinity;
        for (let k = 0; k < K; k++) {
          const dist = colorDistance(px[0], px[1], px[2], centers[k][0], centers[k][1], centers[k][2]);
          if (dist < bestD) { bestD = dist; bestK = k; }
        }
        sums[bestK][0] += px[0]; sums[bestK][1] += px[1]; sums[bestK][2] += px[2];
        counts[bestK]++;
      }
      for (let k = 0; k < K; k++) {
        if (counts[k] > 0) {
          centers[k][0] = sums[k][0] / counts[k];
          centers[k][1] = sums[k][1] / counts[k];
          centers[k][2] = sums[k][2] / counts[k];
        }
      }
    }

    // Compute max spread within each cluster to get per-cluster tolerance
    const clusterMaxDist = centers.map(() => 0);
    for (const px of bgPixels) {
      let bestK = 0, bestD = Infinity;
      for (let k = 0; k < K; k++) {
        const dist = colorDistance(px[0], px[1], px[2], centers[k][0], centers[k][1], centers[k][2]);
        if (dist < bestD) { bestD = dist; bestK = k; }
      }
      clusterMaxDist[bestK] = Math.max(clusterMaxDist[bestK], bestD);
    }

    // 3. Classify every pixel: distance to nearest bg cluster vs threshold
    const fgScore = new Float32Array(totalPx); // 0 = bg, 1 = fg
    const cx = w / 2, cy = h / 2;
    const maxR = Math.sqrt(cx * cx + cy * cy);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = y * w + x;
        const pi = idx * 4;
        const r = d[pi], g = d[pi + 1], b = d[pi + 2];

        // Find distance to nearest bg cluster
        let minBgDist = Infinity;
        let nearestK = 0;
        for (let k = 0; k < K; k++) {
          const dist = colorDistance(r, g, b, centers[k][0], centers[k][1], centers[k][2]);
          if (dist < minBgDist) { minBgDist = dist; nearestK = k; }
        }

        // Adaptive threshold per cluster
        const threshold = Math.max(15, clusterMaxDist[nearestK] * 1.1);
        
        // Center prior: pixels closer to center get a lower threshold (easier to be fg)
        const distFromCenter = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2) / maxR;
        const centerBoost = Math.max(0, 1 - distFromCenter * 1.2);
        const adjustedThreshold = threshold * (1 - centerBoost * 0.5);

        if (minBgDist > adjustedThreshold) {
          fgScore[idx] = 1.0;
        } else if (minBgDist > adjustedThreshold * 0.4 && distFromCenter < 0.8) {
          fgScore[idx] = 0.7;
        }
      }
    }

    // 4. Binarize
    let foreground = new Uint8Array(totalPx);
    for (let i = 0; i < totalPx; i++) foreground[i] = fgScore[i] > 0.3 ? 1 : 0;

    // Count fg
    let fgCount = 0;
    for (let i = 0; i < totalPx; i++) if (foreground[i]) fgCount++;
    console.log('[FG detect] fg pixels:', fgCount, '/', totalPx, '=', (fgCount/totalPx*100).toFixed(1) + '%');

    // Fallback: if too little foreground, use generous center ellipse
    if (fgCount < totalPx * 0.05) {
      console.log('[FG detect] Fallback: center ellipse');
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const nx = (x - cx) / (cx * 0.8);
          const ny = (y - cy) / (cy * 0.95);
          if (nx * nx + ny * ny < 1) foreground[y * w + x] = 1;
        }
      }
      fgCount = 0;
      for (let i = 0; i < totalPx; i++) if (foreground[i]) fgCount++;
    }

    // 5. Morphological close to fill gaps (dilate then erode)
    const morphOp = (src: Uint8Array<ArrayBufferLike>, radius: number, isDilate: boolean): Uint8Array<ArrayBuffer> => {
      const dst = new Uint8Array(totalPx);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          if (isDilate) {
            // Dilate: output 1 if ANY neighbor is 1
            let found = false;
            outer_d: for (let ky = -radius; ky <= radius; ky++) {
              for (let kx = -radius; kx <= radius; kx++) {
                if (kx * kx + ky * ky > radius * radius) continue;
                const nx = x + kx, ny = y + ky;
                if (nx >= 0 && nx < w && ny >= 0 && ny < h && src[ny * w + nx]) {
                  found = true; break outer_d;
                }
              }
            }
            dst[y * w + x] = found ? 1 : 0;
          } else {
            // Erode: output 1 only if ALL neighbors within bounds are 1
            let allSet = true;
            outer_e: for (let ky = -radius; ky <= radius; ky++) {
              for (let kx = -radius; kx <= radius; kx++) {
                if (kx * kx + ky * ky > radius * radius) continue;
                const nx = x + kx, ny = y + ky;
                if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue; // ignore out-of-bounds
                if (!src[ny * w + nx]) { allSet = false; break outer_e; }
              }
            }
            dst[y * w + x] = allSet ? 1 : 0;
          }
        }
      }
      return dst;
    };

    // Use small radius to avoid destroying thin features
    const closeR = Math.max(1, Math.round(Math.min(w, h) * 0.01));
    const dilated = morphOp(foreground, closeR, true);
    foreground = morphOp(dilated, closeR, false);

    let fgAfterMorph = 0;
    for (let i = 0; i < totalPx; i++) if (foreground[i]) fgAfterMorph++;
    console.log('[FG detect] after morph close:', fgAfterMorph, 'pixels');

    // 6. Fill holes
    const isHole = new Uint8Array(totalPx);
    const holeVis = new Uint8Array(totalPx);
    for (let i = 0; i < totalPx; i++) if (!foreground[i]) isHole[i] = 1;
    const bs: number[] = [];
    for (let x = 0; x < w; x++) { if (!foreground[x]) bs.push(x, 0); if (!foreground[(h-1)*w+x]) bs.push(x, h-1); }
    for (let y = 1; y < h-1; y++) { if (!foreground[y*w]) bs.push(0, y); if (!foreground[y*w+w-1]) bs.push(w-1, y); }
    while (bs.length > 0) {
      const by = bs.pop()!, bx = bs.pop()!;
      if (bx < 0 || bx >= w || by < 0 || by >= h) continue;
      const bi = by * w + bx;
      if (holeVis[bi] || foreground[bi]) continue;
      holeVis[bi] = 1; isHole[bi] = 0;
      bs.push(bx-1, by, bx+1, by, bx, by-1, bx, by+1);
    }
    for (let i = 0; i < totalPx; i++) if (isHole[i]) foreground[i] = 1;

    // 7. Connected components + scoring
    const labels = new Int32Array(totalPx);
    let nextLabel = 1;
    const compInfo: Map<number, { count: number; skinCount: number; centerDist: number; minY: number; maxY: number; minX: number; maxX: number }> = new Map();

    const isSkin = (r: number, g: number, b: number): boolean => {
      return (r > 60 && g > 40 && b > 20 && r > g && r > b && (Math.max(r,g,b)-Math.min(r,g,b)) > 12 && r > 65) ||
             (r > 45 && g > 30 && b > 15 && r > g && r > b && (r-b) > 10);
    };

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = y * w + x;
        if (!foreground[idx] || labels[idx]) continue;
        const label = nextLabel++;
        const q = [x, y];
        let count = 0, skinCount = 0, tDist = 0;
        let minY = h, maxY = 0, minX = w, maxX = 0;
        let qi = 0;
        while (qi < q.length) {
          const qx = q[qi++], qy = q[qi++];
          if (qx < 0 || qx >= w || qy < 0 || qy >= h) continue;
          const qidx = qy * w + qx;
          if (!foreground[qidx] || labels[qidx]) continue;
          labels[qidx] = label; count++;
          const pi = qidx * 4;
          if (isSkin(d[pi], d[pi+1], d[pi+2])) skinCount++;
          tDist += Math.sqrt((qx-cx)**2 + (qy-cy)**2) / maxR;
          if (qy < minY) minY = qy; if (qy > maxY) maxY = qy;
          if (qx < minX) minX = qx; if (qx > maxX) maxX = qx;
          q.push(qx-1, qy, qx+1, qy, qx, qy-1, qx, qy+1);
        }
        compInfo.set(label, { count, skinCount, centerDist: tDist / count, minY, maxY, minX, maxX });
      }
    }

    let bestLabel = 0, bestScore = -Infinity;
    compInfo.forEach((info, label) => {
      const sf = info.count / totalPx;
      if (sf < 0.005) return;
      let score = Math.min(sf * 8, 3) + (info.skinCount/info.count) * 6 + (1 - info.centerDist) * 3;
      score += ((info.maxY - info.minY) / h) * 2;
      const ar = ((info.maxY - info.minY) / h) / (((info.maxX - info.minX) / w) || 0.01);
      if (ar > 1.2 && ar < 5) score += 2;
      if (info.minY < h * 0.3) score += 1;
      if (score > bestScore) { bestScore = score; bestLabel = label; }
    });

    // Fallback: largest component
    if (bestLabel === 0) {
      let maxC = 0;
      compInfo.forEach((info, label) => { if (info.count > maxC) { maxC = info.count; bestLabel = label; } });
    }

    console.log('[FG detect] bestLabel:', bestLabel, 'components:', compInfo.size);

    // 8. Paint onto full-resolution mask
    const maskCtx = maskCanvas.getContext("2d")!;
    const maskW = maskCanvas.width, maskH = maskCanvas.height;
    const maskData = maskCtx.getImageData(0, 0, maskW, maskH);

    if (bestLabel > 0) {
      const sel = new Uint8Array(totalPx);
      for (let i = 0; i < totalPx; i++) if (labels[i] === bestLabel) sel[i] = 1;
      const dilR = Math.max(2, Math.round(Math.min(w, h) * 0.01));
      const dilated = morphOp(sel, dilR, true);

      const sX = maskW / w, sY = maskH / h;
      for (let dy = 0; dy < h; dy++) {
        for (let dx = 0; dx < w; dx++) {
          if (!dilated[dy * w + dx]) continue;
          const mx1 = Math.floor(dx * sX), my1 = Math.floor(dy * sY);
          const mx2 = Math.min(Math.ceil((dx+1) * sX), maskW);
          const my2 = Math.min(Math.ceil((dy+1) * sY), maskH);
          for (let fy = my1; fy < my2; fy++) {
            for (let fx = mx1; fx < mx2; fx++) {
              const mi = (fy * maskW + fx) * 4;
              maskData.data[mi] = maskData.data[mi+1] = maskData.data[mi+2] = maskData.data[mi+3] = 255;
            }
          }
        }
      }
    }

    maskCtx.putImageData(maskData, 0, 0);
    redrawComposite();
    toast({ title: "Subject detected", description: "Main subject selected. Click Erase to remove." });
  }, [imageDimensions, colorDistance, redrawComposite, saveMaskSnapshot, toast]);

  // Magic eraser handler - smart object detection using edge-bounded region growing
  const handleMagicErase = useCallback(
    (x: number, y: number) => {
      const canvas = canvasRef.current;
      const maskCanvas = maskCanvasRef.current;
      const img = loadedImageRef.current;
      if (!canvas || !maskCanvas || !img) return;

      saveMaskSnapshot();

      const w = canvasSize.width;
      const h = canvasSize.height;
      const tc = document.createElement("canvas");
      tc.width = w; tc.height = h;
      const tctx = tc.getContext("2d")!;
      tctx.drawImage(img, 0, 0, w, h);
      const imgData = tctx.getImageData(0, 0, w, h);
      const d = imgData.data;
      const totalPx = w * h;

      const px = Math.round(x), py = Math.round(y);
      if (px < 0 || py < 0 || px >= w || py >= h) return;

      // 1. Compute edge magnitude map (Sobel)
      const gray = new Float32Array(totalPx);
      for (let i = 0; i < totalPx; i++) {
        const pi = i * 4;
        gray[i] = d[pi] * 0.299 + d[pi + 1] * 0.587 + d[pi + 2] * 0.114;
      }
      const edgeMap = new Float32Array(totalPx);
      let maxEdge = 0;
      for (let iy = 1; iy < h - 1; iy++) {
        for (let ix = 1; ix < w - 1; ix++) {
          const idx = iy * w + ix;
          const gx = -gray[idx - w - 1] - 2 * gray[idx - 1] - gray[idx + w - 1]
                    + gray[idx - w + 1] + 2 * gray[idx + 1] + gray[idx + w + 1];
          const gy = -gray[idx - w - 1] - 2 * gray[idx - w] - gray[idx - w + 1]
                    + gray[idx + w - 1] + 2 * gray[idx + w] + gray[idx + w + 1];
          const mag = Math.sqrt(gx * gx + gy * gy);
          edgeMap[idx] = mag;
          if (mag > maxEdge) maxEdge = mag;
        }
      }
      // Normalize edges to 0-1
      if (maxEdge > 0) {
        for (let i = 0; i < totalPx; i++) edgeMap[i] /= maxEdge;
      }

      // 2. Initial flood fill from click point (color similarity)
      const startIdx = (py * w + px) * 4;
      const sr = d[startIdx], sg = d[startIdx + 1], sb = d[startIdx + 2];
      const tol = wandTolerance * 1.7;
      const seedMask = new Uint8Array(totalPx);
      const visited1 = new Uint8Array(totalPx);
      const stack1 = [px, py];
      while (stack1.length > 0) {
        const cy2 = stack1.pop()!, cx2 = stack1.pop()!;
        if (cx2 < 0 || cx2 >= w || cy2 < 0 || cy2 >= h) continue;
        const idx = cy2 * w + cx2;
        if (visited1[idx]) continue;
        visited1[idx] = 1;
        const pi = idx * 4;
        const dist = colorDistance(d[pi], d[pi + 1], d[pi + 2], sr, sg, sb);
        if (dist > tol) continue;
        seedMask[idx] = 1;
        stack1.push(cx2 - 1, cy2, cx2 + 1, cy2, cx2, cy2 - 1, cx2, cy2 + 1,
                    cx2 - 1, cy2 - 1, cx2 + 1, cy2 - 1, cx2 - 1, cy2 + 1, cx2 + 1, cy2 + 1);
      }

      // 3. Compute bounding box + average color of seed region
      let seedCount = 0;
      let avgR = 0, avgG = 0, avgB = 0;
      let minX = w, maxX2 = 0, minY = h, maxY = 0;
      for (let iy = 0; iy < h; iy++) {
        for (let ix = 0; ix < w; ix++) {
          if (seedMask[iy * w + ix]) {
            seedCount++;
            const pi = (iy * w + ix) * 4;
            avgR += d[pi]; avgG += d[pi + 1]; avgB += d[pi + 2];
            if (ix < minX) minX = ix; if (ix > maxX2) maxX2 = ix;
            if (iy < minY) minY = iy; if (iy > maxY) maxY = iy;
          }
        }
      }

      if (seedCount < 3) {
        // Fallback: just do normal flood fill
        floodFillAt(x, y, false);
        return;
      }

      avgR /= seedCount; avgG /= seedCount; avgB /= seedCount;

      // 4. Edge-bounded region growing from seed region
      // Expand into neighboring pixels that aren't blocked by strong edges
      // and have reasonable color similarity to the object's average
      const objectMask = new Uint8Array(seedMask);
      const visited2 = new Uint8Array(totalPx);
      const expandTol = tol * 1.8; // More generous for expansion
      const edgeThreshold = 0.25; // Edge strength that blocks expansion
      const stack2: number[] = [];

      // Initialize expansion from boundary pixels of seed
      for (let iy = 0; iy < h; iy++) {
        for (let ix = 0; ix < w; ix++) {
          if (!seedMask[iy * w + ix]) continue;
          visited2[iy * w + ix] = 1;
          // Check if boundary pixel (has non-seed neighbor)
          let isBorder = false;
          for (let dy = -1; dy <= 1 && !isBorder; dy++) {
            for (let dx = -1; dx <= 1 && !isBorder; dx++) {
              const nx = ix + dx, ny = iy + dy;
              if (nx >= 0 && nx < w && ny >= 0 && ny < h && !seedMask[ny * w + nx]) {
                isBorder = true;
              }
            }
          }
          if (isBorder) stack2.push(ix, iy);
        }
      }

      // Grow outward, respecting edges
      let expandIter = 0;
      const MAX_EXPAND = 200000;
      while (stack2.length > 0 && expandIter < MAX_EXPAND) {
        const cy2 = stack2.pop()!, cx2 = stack2.pop()!;
        expandIter++;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = cx2 + dx, ny = cy2 + dy;
            if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
            const nIdx = ny * w + nx;
            if (visited2[nIdx]) continue;
            visited2[nIdx] = 1;

            // Skip if strong edge between current and neighbor
            if (edgeMap[nIdx] > edgeThreshold) continue;

            // Color similarity to seed average
            const pi = nIdx * 4;
            const cDist = colorDistance(d[pi], d[pi + 1], d[pi + 2], avgR, avgG, avgB);
            if (cDist > expandTol) continue;

            objectMask[nIdx] = 1;
            stack2.push(nx, ny);
          }
        }
      }

      // 5. Morphological close to fill small gaps
      const closeR = Math.max(1, Math.round(Math.min(w, h) * 0.008));
      // Dilate
      const dilated = new Uint8Array(totalPx);
      for (let iy = 0; iy < h; iy++) {
        for (let ix = 0; ix < w; ix++) {
          let found = false;
          for (let ky = -closeR; ky <= closeR && !found; ky++) {
            for (let kx = -closeR; kx <= closeR && !found; kx++) {
              if (kx * kx + ky * ky > closeR * closeR) continue;
              const nx = ix + kx, ny = iy + ky;
              if (nx >= 0 && nx < w && ny >= 0 && ny < h && objectMask[ny * w + nx]) found = true;
            }
          }
          dilated[iy * w + ix] = found ? 1 : 0;
        }
      }
      // Erode
      const closed = new Uint8Array(totalPx);
      for (let iy = 0; iy < h; iy++) {
        for (let ix = 0; ix < w; ix++) {
          let allSet = true;
          for (let ky = -closeR; ky <= closeR && allSet; ky++) {
            for (let kx = -closeR; kx <= closeR && allSet; kx++) {
              if (kx * kx + ky * ky > closeR * closeR) continue;
              const nx = ix + kx, ny = iy + ky;
              if (nx >= 0 && nx < w && ny >= 0 && ny < h && !dilated[ny * w + nx]) allSet = false;
            }
          }
          closed[iy * w + ix] = allSet ? 1 : 0;
        }
      }

      // 6. Fill interior holes via flood from edges
      const isHole = new Uint8Array(totalPx);
      const holeVis = new Uint8Array(totalPx);
      for (let i = 0; i < totalPx; i++) if (!closed[i]) isHole[i] = 1;
      const bs: number[] = [];
      for (let bx = 0; bx < w; bx++) {
        if (!closed[bx]) bs.push(bx, 0);
        if (!closed[(h - 1) * w + bx]) bs.push(bx, h - 1);
      }
      for (let by = 1; by < h - 1; by++) {
        if (!closed[by * w]) bs.push(0, by);
        if (!closed[by * w + w - 1]) bs.push(w - 1, by);
      }
      while (bs.length > 0) {
        const by = bs.pop()!, bx = bs.pop()!;
        if (bx < 0 || bx >= w || by < 0 || by >= h) continue;
        const bi = by * w + bx;
        if (holeVis[bi] || closed[bi]) continue;
        holeVis[bi] = 1; isHole[bi] = 0;
        bs.push(bx - 1, by, bx + 1, by, bx, by - 1, bx, by + 1);
      }
      for (let i = 0; i < totalPx; i++) if (isHole[i]) closed[i] = 1;

      // 7. Soft feathered edges
      const feathR = Math.max(2, Math.round(Math.min(w, h) * 0.005));
      const result = new Float32Array(totalPx);
      for (let i = 0; i < totalPx; i++) result[i] = closed[i] ? 1.0 : 0.0;
      // Gaussian-ish blur on binary mask for soft edges
      for (let pass = 0; pass < 2; pass++) {
        const src = pass === 0 ? new Float32Array(result) : result;
        const dst = pass === 0 ? result : new Float32Array(result);
        for (let iy = 0; iy < h; iy++) {
          for (let ix = 0; ix < w; ix++) {
            let sum = 0, cnt = 0;
            for (let ky = -feathR; ky <= feathR; ky++) {
              for (let kx = -feathR; kx <= feathR; kx++) {
                const nx = ix + kx, ny = iy + ky;
                if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                  sum += src[ny * w + nx]; cnt++;
                }
              }
            }
            dst[iy * w + ix] = sum / cnt;
          }
        }
        if (pass === 1) for (let i = 0; i < totalPx; i++) result[i] = dst[i];
      }

      // 8. Paint onto mask canvas
      const maskCtx = maskCanvas.getContext("2d")!;
      const scaleX2 = imageDimensions.width / w;
      const scaleY2 = imageDimensions.height / h;
      const maskData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
      for (let dy = 0; dy < h; dy++) {
        for (let dx = 0; dx < w; dx++) {
          const val = result[dy * w + dx];
          if (val <= 0.01) continue;
          const brightness = Math.round(val * 255);
          const mx1 = Math.round(dx * scaleX2);
          const my1 = Math.round(dy * scaleY2);
          const mx2b = Math.min(Math.round((dx + 1) * scaleX2), maskCanvas.width);
          const my2b = Math.min(Math.round((dy + 1) * scaleY2), maskCanvas.height);
          for (let fy = my1; fy < my2b; fy++) {
            for (let fx = mx1; fx < mx2b; fx++) {
              const mi = (fy * maskCanvas.width + fx) * 4;
              maskData.data[mi] = Math.max(maskData.data[mi], brightness);
              maskData.data[mi + 1] = Math.max(maskData.data[mi + 1], brightness);
              maskData.data[mi + 2] = Math.max(maskData.data[mi + 2], brightness);
              maskData.data[mi + 3] = 255;
            }
          }
        }
      }
      maskCtx.putImageData(maskData, 0, 0);
      redrawComposite();
    },
    [canvasSize, imageDimensions, wandTolerance, colorDistance, floodFillAt, redrawComposite, saveMaskSnapshot]
  );

  const startDraw = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const pos = getPos(e);
      setIsDrawing(true);
      clearHoverPreview();

      if (tool === "magic-eraser") {
        if (!magicEraserMode) {
          setShowMagicEraserDialog(true);
          setIsDrawing(false);
          return;
        }
        saveMaskSnapshot();
        if (magicEraserMode === "click") {
          handleMagicErase(pos.x, pos.y);
          setIsDrawing(false);
        } else if (magicEraserMode === "brush") {
          drawBrushAt(pos.x, pos.y);
        } else {
          setIsDrawing(false);
        }
        return;
      } else if (tool === "wand") {
        saveMaskSnapshot();
        const shiftHeld = "shiftKey" in e ? (e as React.MouseEvent).shiftKey : false;
        floodFillAt(pos.x, pos.y, shiftHeld);
        setIsDrawing(false);
        return;
      } else if (tool === "brush" || tool === "eraser") {
        saveMaskSnapshot();
        drawBrushAt(pos.x, pos.y);
      } else if (tool === "rectangle") {
        saveMaskSnapshot();
        setRectStart(pos);
        setRectEnd(pos);
      } else if (tool === "lasso") {
        saveMaskSnapshot();
        setLassoPoints([pos]);
      }
    },
    [tool, magicEraserMode, getPos, drawBrushAt, floodFillAt, handleMagicErase, saveMaskSnapshot]
  );

  const draw = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      if (!isDrawing) return;
      const pos = getPos(e);

      if (tool === "brush" || tool === "eraser" || (tool === "magic-eraser" && magicEraserMode === "brush")) {
        drawBrushAt(pos.x, pos.y);
      } else if (tool === "rectangle") {
        setRectEnd(pos);
        drawTempOverlay(pos);
      } else if (tool === "lasso") {
        setLassoPoints((prev) => [...prev, pos]);
        drawTempOverlay(pos);
      }
    },
    [isDrawing, tool, magicEraserMode, getPos, drawBrushAt, drawTempOverlay]
  );

  const stopDraw = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (tool === "rectangle" && rectStart && rectEnd) {
      fillRectOnMask(rectStart, rectEnd);
      setRectStart(null);
      setRectEnd(null);
    } else if (tool === "lasso" && lassoPoints.length >= 3) {
      fillLassoOnMask(lassoPoints);
      setLassoPoints([]);
    }
  }, [isDrawing, tool, rectStart, rectEnd, lassoPoints, fillRectOnMask, fillLassoOnMask]);

  const clearMask = useCallback(() => {
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;
    saveMaskSnapshot();
    const maskCtx = maskCanvas.getContext("2d")!;
    maskCtx.fillStyle = "black";
    maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
    setMaskDataUrl("");
    redrawComposite();
  }, [redrawComposite, saveMaskSnapshot]);

  const handleEdit = async () => {
    if (!editPrompt.trim()) {
      toast({ title: "Enter a prompt", description: "Describe what you want to change", variant: "destructive" });
      return;
    }
    if (!maskDataUrl) {
      toast({ title: "Select an area", description: "Use the selection tools to mark the area to edit", variant: "destructive" });
      return;
    }

    setEditingType("edit");
    setIsEditing(true);
    try {
      const imgCanvas = document.createElement("canvas");
      imgCanvas.width = imageDimensions.width;
      imgCanvas.height = imageDimensions.height;
      const imgCtx = imgCanvas.getContext("2d")!;
      imgCtx.drawImage(loadedImageRef.current!, 0, 0, imageDimensions.width, imageDimensions.height);
      const imgBase64 = imgCanvas.toDataURL("image/png").split(",")[1];

      const { data: imgUpload, error: imgErr } = await supabase.functions.invoke("upload-to-imgbb", {
        body: { image_base64: imgBase64 },
      });
      if (imgErr) throw imgErr;

      const maskBase64 = maskCanvasRef.current!.toDataURL("image/png").split(",")[1];

      const { data: maskUpload, error: maskErr } = await supabase.functions.invoke("upload-to-imgbb", {
        body: { image_base64: maskBase64 },
      });
      if (maskErr) throw maskErr;

      const { data: genData, error: genErr } = await supabase.functions.invoke("inpaint-image", {
        body: {
          action: "generate",
          image_url: imgUpload.url,
          mask_url: maskUpload.url,
          prompt: editPrompt,
        },
      });
      if (genErr) throw genErr;

      const requestId = genData.request_id;
      const statusUrl = genData.status_url;
      const responseUrl = genData.response_url;
      if (!requestId) throw new Error("No request_id returned");

      let attempts = 0;
      while (attempts < 120) {
        await new Promise((r) => setTimeout(r, 2000));
        const { data: statusData, error: statusErr } = await supabase.functions.invoke("inpaint-image", {
          body: { action: "status", requestId, status_url: statusUrl, response_url: responseUrl },
        });
        if (statusErr) throw statusErr;

        if (statusData.status === "COMPLETED") {
          const resultUrl = statusData.images?.[0]?.url;
          if (!resultUrl) throw new Error("No image in result");
          setIsEditing(false);
          setCompareResult({ beforeUrl: imageUrl, afterUrl: resultUrl });
          setCompareSliderPos(50);
          return;
        }
        if (statusData.status === "FAILED") {
          throw new Error(statusData.error || "Edit failed");
        }
        attempts++;
      }
      throw new Error("Edit timed out");
    } catch (err: any) {
      console.error("Edit error:", err);
      toast({ title: "Edit Failed", description: err.message || "An error occurred", variant: "destructive" });
    } finally {
      setIsEditing(false);
    }
  };

  const handleMagicEraseApply = useCallback(async () => {
    if (!maskDataUrl) return;
    const maskCanvas = maskCanvasRef.current;
    const img = loadedImageRef.current;
    if (!maskCanvas || !img) return;

    saveMaskSnapshot();
    setEditingType("eraser");
    setIsEditing(true);
    

    try {
      const maskCtx = maskCanvas.getContext("2d")!;

      // Prepare original image as base64
      const imgCanvas = document.createElement("canvas");
      imgCanvas.width = imageDimensions.width;
      imgCanvas.height = imageDimensions.height;
      const imgCtx = imgCanvas.getContext("2d")!;
      imgCtx.drawImage(img, 0, 0, imageDimensions.width, imageDimensions.height);
      const imgBase64 = imgCanvas.toDataURL("image/png");

      // Prepare mask as base64
      const maskBase64 = maskCanvas.toDataURL("image/png");

      // Queue the removal via FIBO Edit
      const { data: queueData, error: queueError } = await supabase.functions.invoke("remove-object-bria", {
        body: { action: "generate", image_url: imgBase64, mask_url: maskBase64 },
      });
      if (queueError) throw queueError;
      const requestId = queueData?.request_id;
      if (!requestId) throw new Error("No request ID returned");

      // Poll for completion
      let resultUrl = "";
      for (let i = 0; i < 60; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const { data: statusData, error: statusError } = await supabase.functions.invoke("remove-object-bria", {
          body: { action: "status", requestId, status_url: queueData.status_url, response_url: queueData.response_url },
        });
        if (statusError) throw statusError;
        if (statusData?.status === "COMPLETED") {
          const img = statusData?.images?.[0]?.url || statusData?.image?.url || statusData?.output?.url;
          if (img) { resultUrl = img; break; }
          throw new Error("Completed but no image URL found");
        }
        if (statusData?.status === "FAILED") throw new Error("Object removal failed");
      }
      if (!resultUrl) throw new Error("Timed out waiting for result");

      // Load result image
      const newImg = new Image();
      newImg.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        newImg.onload = () => resolve();
        newImg.onerror = () => reject(new Error("Failed to load result"));
        newImg.src = resultUrl;
      });

      loadedImageRef.current = newImg;
      hasBeenEditedRef.current = true;
      maskCtx.fillStyle = "black";
      maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
      setMaskDataUrl("");
      redrawComposite();

      setCompareResult({ beforeUrl: imageUrl, afterUrl: resultUrl });
      setCompareSliderPos(50);
      toast({ title: "Object removed!", description: "Area filled naturally with surrounding content" });
    } catch (error: any) {
      console.error("Content-aware fill error:", error);
      toast({ title: "Removal failed", description: error.message || "An error occurred", variant: "destructive" });
    } finally {
      setIsEditing(false);
    }
  }, [maskDataUrl, imageDimensions, imageUrl, toast, saveMaskSnapshot, redrawComposite]);

  const [isRemovingBg, setIsRemovingBg] = useState(false);

  const handleRemoveBackground = useCallback(async () => {
    const img = loadedImageRef.current;
    if (!img) return;

    // Check credits (skip for admin)
    if (!isAdmin) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast({ title: "Not logged in", description: "Please log in to use this feature", variant: "destructive" });
        return;
      }
      const { data: creditData } = await supabase.from("credits").select("balance").eq("user_id", session.user.id).single();
      if (!creditData || creditData.balance < 1) {
        toast({ title: "Not enough credits", description: "You need 1 credit to remove background", variant: "destructive" });
        return;
      }
    }

    setIsRemovingBg(true);
    try {
      // Get image as base64
      const imgCanvas = document.createElement("canvas");
      imgCanvas.width = imageDimensions.width;
      imgCanvas.height = imageDimensions.height;
      const imgCtx = imgCanvas.getContext("2d")!;
      imgCtx.drawImage(img, 0, 0, imageDimensions.width, imageDimensions.height);
      const imgBase64 = imgCanvas.toDataURL("image/png").split(",")[1];

      // Upload to imgbb first
      const { data: uploadData, error: uploadErr } = await supabase.functions.invoke("upload-to-imgbb", {
        body: { image_base64: imgBase64 },
      });
      if (uploadErr) throw uploadErr;

      // Call the background removal via generate-flatlay function
      const { data: resultData, error: resultErr } = await supabase.functions.invoke("generate-flatlay", {
        body: { action: "remove-background", imageUrl: uploadData.url },
      });
      if (resultErr) throw resultErr;

      const resultUrl = resultData?.image?.url;
      if (!resultUrl) throw new Error("No result image returned");

      // Deduct 1 credit (skip for admin)
      if (!isAdmin) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await supabase.rpc("deduct_credits", { p_user_id: session.user.id, p_amount: 1 });
        }
      }

      // Load the result
      const newImg = new Image();
      newImg.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        newImg.onload = () => resolve();
        newImg.onerror = () => reject(new Error("Failed to load result"));
        newImg.src = resultUrl;
      });

      // Save pre-edit state so we can restore if user keeps original
      preCompareStateRef.current = {
        image: img,
        dimensions: { ...imageDimensions },
        canvasSize: { ...canvasSize },
        wasEdited: hasBeenEditedRef.current,
      };

      loadedImageRef.current = newImg;
      setImageDimensions({ width: newImg.width, height: newImg.height });

      // Resize canvases
      const maxW = window.innerWidth - 32;
      const maxH = window.innerHeight - 260;
      const scale = Math.min(maxW / newImg.width, maxH / newImg.height, 1);
      const cw = Math.round(newImg.width * scale);
      const ch = Math.round(newImg.height * scale);
      setCanvasSize({ width: cw, height: ch });

      requestAnimationFrame(() => {
        const canvas = canvasRef.current;
        const maskCanvas = maskCanvasRef.current;
        if (!canvas || !maskCanvas) return;
        canvas.width = cw;
        canvas.height = ch;
        maskCanvas.width = newImg.width;
        maskCanvas.height = newImg.height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(newImg, 0, 0, cw, ch);
        const maskCtx = maskCanvas.getContext("2d")!;
        maskCtx.fillStyle = "black";
        maskCtx.fillRect(0, 0, newImg.width, newImg.height);
        setMaskDataUrl("");
      });

      hasBeenEditedRef.current = true;

      // Show before/after comparison
      const beforeCanvas = document.createElement("canvas");
      beforeCanvas.width = imageDimensions.width;
      beforeCanvas.height = imageDimensions.height;
      const beforeCtx = beforeCanvas.getContext("2d")!;
      beforeCtx.drawImage(img, 0, 0, imageDimensions.width, imageDimensions.height);
      
      setCompareResult({ beforeUrl: beforeCanvas.toDataURL("image/png"), afterUrl: resultUrl });
      setCompareSliderPos(50);

      toast({ title: "Background removed!", description: "1 credit used" });
    } catch (error: any) {
      console.error("Background removal error:", error);
      toast({ title: "Background removal failed", description: error.message || "An error occurred", variant: "destructive" });
    } finally {
      setIsRemovingBg(false);
    }
  }, [imageDimensions, toast, isAdmin]);

  const showBrushCursor = (tool === "brush" || tool === "eraser" || (tool === "magic-eraser" && magicEraserMode === "brush")) && cursorPos;
  const hasMask = !!maskDataUrl;
  const canApply = hasMask && editPrompt.trim().length > 0 && !isEditing;

  const handleCompareMove = useCallback((clientX: number) => {
    if (!compareRef.current) return;
    const rect = compareRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    setCompareSliderPos(Math.max(0, Math.min(100, (x / rect.width) * 100)));
  }, []);

  useEffect(() => {
    if (!isCompareDragging) return;
    const onMove = (e: MouseEvent) => handleCompareMove(e.clientX);
    const onTouchMove = (e: TouchEvent) => handleCompareMove(e.touches[0].clientX);
    const onUp = () => setIsCompareDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onTouchMove);
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [isCompareDragging, handleCompareMove]);

  const handleKeepNew = useCallback(() => {
    if (!compareResult) return;
    hasBeenEditedRef.current = true;
    const newUrl = compareResult.afterUrl;
    internalImageUrlRef.current = newUrl;
    onEditComplete(newUrl);
    setCompareResult(null);
    preCompareStateRef.current = null;

    // Reload the new image into the canvas so the editor stays open for further edits
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      loadedImageRef.current = img;
      setImageDimensions({ width: img.width, height: img.height });

      const maxW = window.innerWidth - 32;
      const maxH = window.innerHeight - 260;
      const scale = Math.min(maxW / img.width, maxH / img.height, 1);
      const cw = Math.round(img.width * scale);
      const ch = Math.round(img.height * scale);
      setCanvasSize({ width: cw, height: ch });

      requestAnimationFrame(() => {
        const canvas = canvasRef.current;
        const maskCanvas = maskCanvasRef.current;
        if (!canvas || !maskCanvas) return;
        canvas.width = cw;
        canvas.height = ch;
        maskCanvas.width = img.width;
        maskCanvas.height = img.height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, cw, ch);
        const maskCtx = maskCanvas.getContext("2d")!;
        maskCtx.fillStyle = "black";
        maskCtx.fillRect(0, 0, img.width, img.height);
        setMaskDataUrl("");
      });
    };
    img.src = newUrl;

    toast({ title: "Edit applied!", description: "You can continue editing" });
  }, [compareResult, onEditComplete, toast]);

  const handleKeepOriginal = useCallback(() => {
    // Restore pre-edit canvas state if we saved it
    const saved = preCompareStateRef.current;
    if (saved) {
      loadedImageRef.current = saved.image;
      setImageDimensions(saved.dimensions);
      hasBeenEditedRef.current = saved.wasEdited;

      const cw = saved.canvasSize.width;
      const ch = saved.canvasSize.height;
      setCanvasSize({ width: cw, height: ch });

      requestAnimationFrame(() => {
        const canvas = canvasRef.current;
        const maskCanvas = maskCanvasRef.current;
        if (!canvas || !maskCanvas) return;
        canvas.width = cw;
        canvas.height = ch;
        maskCanvas.width = saved.dimensions.width;
        maskCanvas.height = saved.dimensions.height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(saved.image, 0, 0, cw, ch);
        const maskCtx = maskCanvas.getContext("2d")!;
        maskCtx.fillStyle = "black";
        maskCtx.fillRect(0, 0, saved.dimensions.width, saved.dimensions.height);
        setMaskDataUrl("");
      });

      preCompareStateRef.current = null;
    }
    setCompareResult(null);
    toast({ title: "Original kept", description: "You can try editing again" });
  }, [toast]);

  const handleClose = useCallback(() => {
    if (hasBeenEditedRef.current && loadedImageRef.current) {
      // Save the current edited image before closing
      const canvas = document.createElement("canvas");
      canvas.width = imageDimensions.width;
      canvas.height = imageDimensions.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(loadedImageRef.current, 0, 0, imageDimensions.width, imageDimensions.height);
      const dataUrl = canvas.toDataURL("image/png");
      onEditComplete(dataUrl);
    }
    onOpenChange(false);
  }, [imageDimensions, onEditComplete, onOpenChange]);

  const visibleTools = [
    ...TOOLS_ALWAYS,
    ...(hasMask ? TOOLS_MASK_ONLY : []),
  ];

  return (
    <>
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); else onOpenChange(true); }}>
      <DialogContent className="max-w-[100vw] max-h-[100dvh] h-[100dvh] w-[100vw] overflow-hidden p-0 gap-0 border-none bg-background [&>button.absolute]:hidden rounded-none">
        {/* Header */}
        <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <span className="font-semibold text-sm">Edit Image</span>
          </div>
          <div className="flex items-center gap-1.5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="h-7 px-2.5 rounded-md hover:bg-muted flex items-center justify-center gap-1.5 transition-colors text-muted-foreground hover:text-foreground text-xs font-medium">
                  <Download className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Download</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[140px]">
                <DropdownMenuItem onClick={() => handleDownload("png")} className="gap-2 text-xs">
                  <FileImage className="h-3.5 w-3.5" /> PNG
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownload("jpg")} className="gap-2 text-xs">
                  <FileImage className="h-3.5 w-3.5" /> JPG
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownload("webp")} className="gap-2 text-xs">
                  <FileImage className="h-3.5 w-3.5" /> WEBP
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownload("pdf")} className="gap-2 text-xs">
                  <FileText className="h-3.5 w-3.5" /> PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <button
              onClick={handleClose}
              className="h-7 w-7 rounded-md hover:bg-muted flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-col overflow-hidden flex-1">
          {/* Toolbar */}
          <div className="flex items-center gap-1 px-2 sm:px-4 py-1.5 sm:py-2 border-b border-border/30 bg-muted/20 overflow-x-auto scrollbar-none">
            {/* Tool buttons */}
            <div className="flex items-center bg-muted/50 rounded-md p-0.5 gap-0.5 shrink-0">
              {visibleTools.map(({ id, icon: Icon, label, shortcut }) => (
                <Tooltip key={id}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => {
                        if (id === "magic-eraser" && tool !== "magic-eraser") {
                          clearMask();
                        }
                        setTool(id);
                        setShowMagicEraserDialog(id === "magic-eraser");
                      }}
                      className={cn(
                        "h-8 px-2.5 rounded-md flex items-center justify-center gap-1.5 transition-all text-xs font-medium",
                        tool === id
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span className="hidden lg:inline">{label}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    {label}{shortcut && <span className="ml-1.5 text-muted-foreground">({shortcut})</span>}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>

            {/* Remove BG button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleRemoveBackground}
                  disabled={isRemovingBg || isEditing}
                  className={cn(
                    "h-8 px-2.5 rounded-md flex items-center justify-center gap-1.5 transition-all text-xs font-medium shrink-0",
                    "text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50"
                  )}
                >
                   {isRemovingBg ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageMinus className="h-3.5 w-3.5" />}
                  <span className="hidden lg:inline">Remove BG</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Remove background</TooltipContent>
            </Tooltip>

            <div className="h-5 w-px bg-border/50 mx-1" />

            {/* Contextual settings */}
            {(tool === "brush" || tool === "eraser") && (
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <div className="flex items-center bg-muted/50 rounded-md p-0.5 gap-0.5">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setBrushHardness("hard")}
                        className={cn(
                          "h-7 px-2 rounded text-xs font-medium transition-all flex items-center gap-1",
                          brushHardness === "hard"
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <Circle className="h-3 w-3 fill-current" /> Hard
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">Hard edge brush</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setBrushHardness("soft")}
                        className={cn(
                          "h-7 px-2 rounded text-xs font-medium transition-all flex items-center gap-1",
                          brushHardness === "soft"
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <Circle className="h-3 w-3" /> Soft
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">Soft edge brush with feathering</TooltipContent>
                  </Tooltip>
                </div>
                <div className="flex items-center gap-2 min-w-[90px] sm:min-w-[110px]">
                  <span className="text-[11px] text-muted-foreground tabular-nums w-7 text-right">{brushSize}</span>
                  <Slider value={[brushSize]} onValueChange={([v]) => setBrushSize(v)} min={5} max={100} step={1} className="flex-1" />
                </div>
              </div>
            )}

            {tool === "magic-eraser" && magicEraserMode && (
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[11px] text-muted-foreground bg-muted/50 px-2 py-1 rounded flex items-center gap-1">
                  {magicEraserMode === "brush" && <><Paintbrush className="h-3 w-3" /> Brush</>}
                  {magicEraserMode === "click" && <><MousePointer className="h-3 w-3" /> Click</>}
                  
                </span>
                <button
                  onClick={() => setShowMagicEraserDialog(true)}
                  className="text-[11px] text-primary hover:underline"
                >
                  Change
                </button>
              </div>
            )}

            {(tool === "wand" || (tool === "magic-eraser" && magicEraserMode === "click")) && (
              <div className="flex items-center gap-2 min-w-[110px] sm:min-w-[130px] shrink-0">
                <span className="text-[11px] text-muted-foreground whitespace-nowrap">Tolerance</span>
                <Slider value={[wandTolerance]} onValueChange={([v]) => setWandTolerance(v)} min={1} max={80} step={1} className="flex-1" />
                <span className="text-[11px] text-muted-foreground tabular-nums w-5">{wandTolerance}</span>
              </div>
            )}

            {(tool === "magic-eraser" && magicEraserMode === "brush") && (
              <div className="flex items-center gap-2 min-w-[90px] sm:min-w-[110px] shrink-0">
                <span className="text-[11px] text-muted-foreground tabular-nums w-7 text-right">{brushSize}</span>
                <Slider value={[brushSize]} onValueChange={([v]) => setBrushSize(v)} min={5} max={100} step={1} className="flex-1" />
              </div>
            )}

            <div className="flex-1" />

            {/* Undo / Redo */}
            <div className="flex items-center gap-0.5 shrink-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={undo}
                    disabled={undoCount === 0}
                    className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 transition-colors"
                  >
                    <Undo2 className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">Undo (Ctrl+Z)</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={redo}
                    disabled={redoCount === 0}
                    className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 transition-colors"
                  >
                    <Redo2 className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">Redo (Ctrl+Shift+Z)</TooltipContent>
              </Tooltip>
            </div>

            <div className="h-5 w-px bg-border/50 mx-0.5" />

            {/* Clear */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={clearMask}
                  className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Clear mask (C)</TooltipContent>
            </Tooltip>
          </div>

          {/* Canvas area */}
          <div className="flex-1 flex justify-center items-center overflow-hidden bg-muted/10 relative">
            <div
              ref={canvasContainerRef}
              className="relative overflow-auto"
              style={{
                maxWidth: '100%',
                maxHeight: 'calc(100dvh - 240px)',
              }}
              onMouseDown={(e) => {
                if (e.button === 1 || (e.button === 0 && e.altKey)) {
                  e.preventDefault();
                  setIsPanning(true);
                  panStartRef.current = { x: e.clientX, y: e.clientY, offsetX: canvasContainerRef.current?.scrollLeft || 0, offsetY: canvasContainerRef.current?.scrollTop || 0 };
                }
              }}
              onMouseMove={(e) => {
                if (isPanning && canvasContainerRef.current) {
                  const dx = e.clientX - panStartRef.current.x;
                  const dy = e.clientY - panStartRef.current.y;
                  canvasContainerRef.current.scrollLeft = panStartRef.current.offsetX - dx;
                  canvasContainerRef.current.scrollTop = panStartRef.current.offsetY - dy;
                }
              }}
              onMouseUp={() => setIsPanning(false)}
              onMouseLeave={() => setIsPanning(false)}
            >
              <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', width: canvasSize.width, height: canvasSize.height }}>
                <canvas
                  ref={canvasRef}
                  width={canvasSize.width}
                  height={canvasSize.height}
                  className={`touch-none ${isPanning ? 'cursor-grabbing' : (tool === "brush" || tool === "eraser" || (tool === "magic-eraser" && magicEraserMode === "brush")) ? "cursor-none" : (tool === "magic-eraser" && magicEraserMode === "click") ? "cursor-pointer" : "cursor-crosshair"}`}
                  style={{ width: canvasSize.width, height: canvasSize.height }}
                  onMouseDown={startDraw}
                  onMouseMove={(e) => {
                    draw(e);
                    const r = canvasRef.current!.getBoundingClientRect();
                    const pos = { x: (e.clientX - r.left) / zoom, y: (e.clientY - r.top) / zoom };
                    setCursorPos(pos);
                    // Show hover preview for click/wand modes
                    if (!isDrawing && (tool === "wand" || (tool === "magic-eraser" && magicEraserMode === "click"))) {
                      computeHoverPreview(pos.x, pos.y);
                    } else if (hoverPreviewRef.current) {
                      clearHoverPreview();
                    }
                  }}
                  onMouseUp={stopDraw}
                  onMouseEnter={(e) => {
                    const r = canvasRef.current!.getBoundingClientRect();
                    setCursorPos({ x: (e.clientX - r.left) / zoom, y: (e.clientY - r.top) / zoom });
                  }}
                  onMouseLeave={() => {
                    stopDraw();
                    setCursorPos(null);
                    clearHoverPreview();
                  }}
                  onTouchStart={startDraw}
                  onTouchMove={draw}
                  onTouchEnd={stopDraw}
                />
                {showBrushCursor && (
                  <div
                    className="pointer-events-none absolute border-2 border-white rounded-full mix-blend-difference"
                    style={{
                      width: brushSize,
                      height: brushSize,
                      left: cursorPos!.x - brushSize / 2,
                      top: cursorPos!.y - brushSize / 2,
                    }}
                  />
                )}
              </div>
              <canvas ref={maskCanvasRef} className="hidden" />
            </div>

            {/* Floating zoom controls */}
            <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 flex items-center gap-0.5 sm:gap-1 bg-background/90 backdrop-blur-sm border border-border/50 rounded-lg px-1 sm:px-1.5 py-0.5 sm:py-1 shadow-sm">
              <button onClick={handleZoomOut} disabled={zoom <= 0.5} className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 transition-colors">
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <span className="text-[11px] text-muted-foreground tabular-nums min-w-[36px] text-center">{Math.round(zoom * 100)}%</span>
              <button onClick={handleZoomIn} disabled={zoom >= 4} className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 transition-colors">
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
              <div className="h-4 w-px bg-border/50" />
              <button onClick={handleZoomReset} className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <Maximize className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Floating Magic Eraser panel */}
            {tool === "magic-eraser" && showMagicEraserDialog && (
              <div className="absolute top-3 left-3 z-10 bg-background/95 backdrop-blur-sm border border-border rounded-xl shadow-lg p-4 w-[280px]">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold">Magic Eraser</p>
                  <button onClick={() => setShowMagicEraserDialog(false)} className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex gap-1.5">
                  {([
                    { mode: "brush" as MagicEraserMode, icon: Paintbrush, label: "Brush" },
                    { mode: "click" as MagicEraserMode, icon: MousePointer, label: "Click" },
                  ]).map(({ mode, icon: Icon, label }) => (
                    <button
                      key={mode}
                      onClick={() => {
                        setMagicEraserMode(mode);
                        if (mode === "foreground") detectForeground();
                      }}
                      className={cn(
                        "flex-1 flex flex-col items-center gap-1 py-2 rounded-lg border text-xs font-medium transition-all",
                        magicEraserMode === mode
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50 hover:bg-muted text-muted-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </button>
                  ))}
                </div>
                <Button
                  onClick={handleMagicEraseApply}
                  disabled={!hasMask || isEditing}
                  className="w-full mt-2.5 gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  size="sm"
                >
                  {isEditing ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Removing...</>
                  ) : (
                    <><Trash2 className="h-3.5 w-3.5" /> Erase</>
                  )}
                </Button>
              </div>
            )}

            {/* Hint overlay - show only when no mask */}
            {!hasMask && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 text-[11px] text-muted-foreground bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-border/30 pointer-events-none">
                Paint over the area you want to edit
              </div>
            )}
          </div>

          {/* Bottom panel: prompt + actions */}
          <div className="border-t border-border/50 px-3 sm:px-5 py-3 sm:py-4 space-y-2 sm:space-y-3">
            <div className="mx-auto w-full max-w-lg">
              <Textarea
                placeholder='e.g., "Make the background a warm sunset"'
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                className="min-h-[56px] sm:min-h-[72px] resize-none text-sm bg-muted/30 border-border/50 focus:bg-background transition-colors"
              />
            </div>
            <div className="flex items-center justify-center gap-2 mx-auto w-full max-w-lg">
              <Button
                onClick={handleEdit}
                disabled={!canApply}
                className="flex-1 sm:max-w-[240px]"
                size="default"
              >
                {isEditing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Applying...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    {isAdmin ? "Apply Edit" : "Apply · 1 credit"}
                  </>
        )}
              </Button>
              <Button variant="ghost" onClick={handleClose} disabled={isEditing} size="default" className="shrink-0">
                Cancel
              </Button>
            </div>
          </div>
        </div>

        {/* Loading overlay */}
        {(isEditing || isRemovingBg) && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="text-center space-y-3">
              <div className="h-12 w-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">{isRemovingBg ? "Removing background..." : editingType === "eraser" ? "Removing object..." : "Applying your edit..."}</p>
                <p className="text-xs text-muted-foreground mt-1">This may take up to 30 seconds</p>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>

    {/* Before/After Comparison Dialog - separate from editor */}
    <Dialog open={!!compareResult} onOpenChange={(open) => { if (!open) handleKeepOriginal(); }}>
      <DialogContent className="max-w-3xl w-[95vw] p-4 sm:p-8 flex flex-col items-center">
        <h3 className="text-lg font-semibold mb-4">Compare Results</h3>
        
        {compareResult && (
          <>
            <div
              ref={compareRef}
              className="relative w-full max-w-2xl aspect-square rounded-xl overflow-hidden select-none border border-border shadow-elegant cursor-ew-resize"
              onMouseDown={() => setIsCompareDragging(true)}
              onTouchStart={() => setIsCompareDragging(true)}
            >
              {/* Before (Original) */}
              <div className="absolute inset-0" style={{ backgroundImage: checkerboardBg }}>
                <img src={compareResult.beforeUrl} alt="Before" className="w-full h-full object-contain" draggable={false} />
                <div className="absolute top-3 left-3 bg-muted/90 text-foreground px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">
                  Before
                </div>
              </div>

              {/* After (New) - clipped */}
              <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - compareSliderPos}% 0 0)`, backgroundImage: checkerboardBg }}>
                <img src={compareResult.afterUrl} alt="After" className="w-full h-full object-contain" draggable={false} />
                <div className="absolute top-3 right-3 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold">
                  After
                </div>
              </div>

              {/* Slider line & handle */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-white"
                style={{ left: `${compareSliderPos}%`, transform: "translateX(-50%)" }}
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-primary cursor-grab active:cursor-grabbing">
                  <div className="flex gap-0.5">
                    <div className="w-0.5 h-4 bg-primary rounded-full" />
                    <div className="w-0.5 h-4 bg-primary rounded-full" />
                  </div>
                </div>
              </div>

              {/* Hint */}
              {!isCompareDragging && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-background/80 text-foreground px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm animate-pulse">
                  Drag to compare
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={handleKeepOriginal} className="min-w-[140px]">
                <RotateCcw className="w-4 h-4 mr-2" />
                Keep Original
              </Button>
              <Button onClick={handleKeepNew} className="min-w-[140px] bg-primary text-primary-foreground hover:bg-primary/90">
                <Sparkles className="w-4 h-4 mr-2" />
                Use New Image
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>

    </>
  );
};

export default ImageEditModal;
