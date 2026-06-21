import { useState, useRef, useEffect } from "react";

interface AutoBeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  className?: string;
  autoAnimate?: boolean;
  animationDuration?: number;
}

const AutoBeforeAfterSlider = ({ 
  beforeImage, 
  afterImage, 
  className = "",
  autoAnimate = true,
  animationDuration = 3000
}: AutoBeforeAfterSliderProps) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    
    setSliderPosition(Math.max(0, Math.min(100, percentage)));
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  };

  const handleStart = () => {
    setIsDragging(true);
  };

  const handleEnd = () => {
    setIsDragging(false);
  };

  // Auto-animation effect
  useEffect(() => {
    if (!autoAnimate || isDragging || isHovering) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = (elapsed % (animationDuration * 2)) / animationDuration;
      
      // Ping-pong animation between 20% and 80%
      let position;
      if (progress <= 1) {
        // Moving from 20 to 80
        position = 20 + (progress * 60);
      } else {
        // Moving from 80 to 20
        position = 80 - ((progress - 1) * 60);
      }
      
      setSliderPosition(position);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [autoAnimate, isDragging, isHovering, animationDuration]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleEnd);
      window.addEventListener("touchmove", handleTouchMove);
      window.addEventListener("touchend", handleEnd);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [isDragging]);

  return (
    <div 
      ref={containerRef}
      className={`relative w-full aspect-square overflow-hidden select-none rounded-2xl bg-card ${className}`}
      onMouseDown={handleStart}
      onTouchStart={handleStart}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        setIsHovering(false);
        startTimeRef.current = null;
      }}
    >
      {/* Before Image (Full) */}
      <div className="absolute inset-0">
        <img
          src={beforeImage}
          alt="Before"
          className="w-full h-full object-cover"
          draggable={false}
        />
        <div className="absolute top-4 left-4 bg-muted/90 text-foreground px-3 py-1 rounded-full text-sm font-semibold backdrop-blur-sm">
          Before
        </div>
      </div>

      {/* After Image (Clipped) */}
      <div 
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <img
          src={afterImage}
          alt="After"
          className="w-full h-full object-cover"
          draggable={false}
        />
        <div className="absolute top-4 right-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold">
          After
        </div>
      </div>

      {/* Slider Line & Handle */}
      <div 
        className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize"
        style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
      >
        {/* Handle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-primary cursor-grab active:cursor-grabbing">
          <div className="flex gap-1">
            <div className="w-0.5 h-5 bg-primary rounded-full" />
            <div className="w-0.5 h-5 bg-primary rounded-full" />
          </div>
        </div>
      </div>

      {/* Interaction hint */}
      {!isDragging && !isHovering && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/80 text-foreground px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm animate-pulse">
          Drag to compare
        </div>
      )}
    </div>
  );
};

export default AutoBeforeAfterSlider;
