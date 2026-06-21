import { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Paintbrush, Eraser, RotateCcw, Circle } from "lucide-react";

interface BrushCanvasProps {
  imageUrl: string;
  onMaskGenerated: (maskDataUrl: string) => void;
  width?: number;
  height?: number;
}

const BrushCanvas = ({ imageUrl, onMaskGenerated, width = 512, height = 512 }: BrushCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const loadedImageRef = useRef<HTMLImageElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const [brushSize, setBrushSize] = useState(30);
  const [brushHardness, setBrushHardness] = useState<"hard" | "soft">("soft");
  const [tool, setTool] = useState<"brush" | "eraser">("brush");
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [canvasSize, setCanvasSize] = useState({ width: 512, height: 512 });

  // Load image and set up canvases
  useEffect(() => {
    if (!imageUrl) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const maxW = Math.min(700, window.innerWidth - 80);
      const scale = Math.min(maxW / img.width, 600 / img.height, 1);
      const cw = Math.round(img.width * scale);
      const ch = Math.round(img.height * scale);

      setImageDimensions({ width: img.width, height: img.height });
      setCanvasSize({ width: cw, height: ch });

      const canvas = canvasRef.current;
      const maskCanvas = maskCanvasRef.current;
      if (!canvas || !maskCanvas) return;

      canvas.width = cw;
      canvas.height = ch;
      maskCanvas.width = img.width;
      maskCanvas.height = img.height;

      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, cw, ch);
      loadedImageRef.current = img;

      const maskCtx = maskCanvas.getContext("2d")!;
      maskCtx.fillStyle = "black";
      maskCtx.fillRect(0, 0, img.width, img.height);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  const getPos = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      const touch = e.touches[0];
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const redrawComposite = useCallback(() => {
    const canvas = canvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!canvas || !maskCanvas || !loadedImageRef.current) return;

    const ctx = canvas.getContext("2d")!;
    // Draw original image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(loadedImageRef.current, 0, 0, canvasSize.width, canvasSize.height);

    // Draw red overlay from mask
    const maskCtx = maskCanvas.getContext("2d")!;
    const maskData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);

    // Create a temporary canvas for the overlay at display size
    const overlayCanvas = document.createElement("canvas");
    overlayCanvas.width = canvasSize.width;
    overlayCanvas.height = canvasSize.height;
    const overlayCtx = overlayCanvas.getContext("2d")!;

    // Draw scaled mask onto overlay
    overlayCtx.drawImage(maskCanvas, 0, 0, canvasSize.width, canvasSize.height);
    const overlayData = overlayCtx.getImageData(0, 0, canvasSize.width, canvasSize.height);

    // Convert white mask pixels to red overlay
    for (let i = 0; i < overlayData.data.length; i += 4) {
      const brightness = overlayData.data[i]; // white = 255, black = 0
      if (brightness > 10) {
        overlayData.data[i] = 239;     // R
        overlayData.data[i + 1] = 68;  // G
        overlayData.data[i + 2] = 68;  // B
        overlayData.data[i + 3] = Math.round(brightness * 0.45); // alpha proportional to mask
      } else {
        overlayData.data[i + 3] = 0;   // fully transparent
      }
    }
    overlayCtx.putImageData(overlayData, 0, 0);
    ctx.drawImage(overlayCanvas, 0, 0);
  }, [canvasSize]);

  const drawAt = useCallback((x: number, y: number) => {
    const maskCanvas = maskCanvasRef.current!;
    const maskCtx = maskCanvas.getContext("2d")!;

    const scaleX = imageDimensions.width / canvasSize.width;
    const scaleY = imageDimensions.height / canvasSize.height;

    // Draw on mask canvas (white = area to replace)
    const mx = x * scaleX;
    const my = y * scaleY;
    const mSize = brushSize * scaleX;

    if (tool === "eraser") {
      maskCtx.globalCompositeOperation = "source-over";
      maskCtx.fillStyle = "black";
    } else {
      maskCtx.globalCompositeOperation = "source-over";
      maskCtx.fillStyle = "white";
    }

    if (brushHardness === "soft") {
      const gradient = maskCtx.createRadialGradient(mx, my, 0, mx, my, mSize / 2);
      gradient.addColorStop(0, tool === "eraser" ? "rgba(0,0,0,1)" : "rgba(255,255,255,1)");
      gradient.addColorStop(1, tool === "eraser" ? "rgba(0,0,0,0)" : "rgba(255,255,255,0)");
      maskCtx.fillStyle = gradient;
    }

    maskCtx.beginPath();
    maskCtx.arc(mx, my, mSize / 2, 0, Math.PI * 2);
    maskCtx.fill();

    // Redraw composite (image + overlay)
    redrawComposite();

    // Export mask
    onMaskGenerated(maskCanvas.toDataURL("image/png"));
  }, [brushSize, brushHardness, tool, imageDimensions, canvasSize, onMaskGenerated, redrawComposite]);

  const startDraw = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDrawing(true);
    const { x, y } = getPos(e);
    drawAt(x, y);
  }, [getPos, drawAt]);

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;
    const { x, y } = getPos(e);
    drawAt(x, y);
  }, [isDrawing, getPos, drawAt]);

  const stopDraw = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const clearMask = useCallback(() => {
    const canvas = canvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!canvas || !maskCanvas) return;

    // Redraw original image
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvasSize.width, canvasSize.height);
    };
    img.src = imageUrl;

    // Clear mask
    const maskCtx = maskCanvas.getContext("2d")!;
    maskCtx.fillStyle = "black";
    maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

    onMaskGenerated("");
  }, [imageUrl, canvasSize, onMaskGenerated]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 bg-muted/50 rounded-lg p-3">
        <div className="flex gap-1">
          <Button
            variant={tool === "brush" ? "default" : "outline"}
            size="sm"
            onClick={() => setTool("brush")}
          >
            <Paintbrush className="h-4 w-4 mr-1" />
            Brush
          </Button>
          <Button
            variant={tool === "eraser" ? "default" : "outline"}
            size="sm"
            onClick={() => setTool("eraser")}
          >
            <Eraser className="h-4 w-4 mr-1" />
            Eraser
          </Button>
        </div>

        <div className="h-6 w-px bg-border" />

        <div className="flex gap-1">
          <Button
            variant={brushHardness === "hard" ? "default" : "outline"}
            size="sm"
            onClick={() => setBrushHardness("hard")}
          >
            <Circle className="h-4 w-4 mr-1 fill-current" />
            Hard
          </Button>
          <Button
            variant={brushHardness === "soft" ? "default" : "outline"}
            size="sm"
            onClick={() => setBrushHardness("soft")}
          >
            <Circle className="h-4 w-4 mr-1" />
            Soft
          </Button>
        </div>

        <div className="h-6 w-px bg-border" />

        <div className="flex items-center gap-2 min-w-[160px]">
          <span className="text-xs text-muted-foreground whitespace-nowrap">Size: {brushSize}px</span>
          <Slider
            value={[brushSize]}
            onValueChange={([v]) => setBrushSize(v)}
            min={5}
            max={100}
            step={1}
            className="flex-1"
          />
        </div>

        <div className="h-6 w-px bg-border" />

        <Button variant="ghost" size="sm" onClick={clearMask}>
          <RotateCcw className="h-4 w-4 mr-1" />
          Clear
        </Button>
      </div>

      {/* Canvas */}
      <div className="relative border border-border rounded-lg overflow-hidden inline-block bg-muted/30">
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          className="cursor-none touch-none"
          style={{ width: canvasSize.width, height: canvasSize.height }}
          onMouseDown={startDraw}
          onMouseMove={(e) => { draw(e); const r = canvasRef.current!.getBoundingClientRect(); setCursorPos({ x: e.clientX - r.left, y: e.clientY - r.top }); }}
          onMouseUp={stopDraw}
          onMouseEnter={(e) => { const r = canvasRef.current!.getBoundingClientRect(); setCursorPos({ x: e.clientX - r.left, y: e.clientY - r.top }); }}
          onMouseLeave={() => { stopDraw(); setCursorPos(null); }}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
        />
        {cursorPos && (
          <div
            className="pointer-events-none absolute border-2 border-white rounded-full mix-blend-difference"
            style={{
              width: brushSize,
              height: brushSize,
              left: cursorPos.x - brushSize / 2,
              top: cursorPos.y - brushSize / 2,
            }}
          />
        )}
        {/* Hidden mask canvas */}
        <canvas ref={maskCanvasRef} className="hidden" />
      </div>

      <p className="text-xs text-muted-foreground">
        Paint over areas you want the AI to replace. Use the eraser to undo selections.
      </p>
    </div>
  );
};

export default BrushCanvas;
