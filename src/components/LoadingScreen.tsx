import { useEffect, useState } from "react";
import { LoadingState } from "./LoadingState";

interface LoadingScreenProps {
  onLoadingComplete?: () => void;
}

export const LoadingScreen = ({ onLoadingComplete }: LoadingScreenProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Simulate minimum loading time for smooth UX
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        // Hide the HTML loading screen
        const htmlLoader = document.getElementById('initial-loading-screen');
        if (htmlLoader) {
          htmlLoader.style.display = 'none';
        }
        onLoadingComplete?.();
      }, 300); // Wait for fade-out animation to complete
    }, 1000);

    return () => clearTimeout(timer);
  }, [onLoadingComplete]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-background ${
        isVisible ? "animate-fade-in" : "animate-fade-out"
      }`}
    >
      <div className="flex flex-col items-center justify-center gap-4">
        {/* Spinner with logo */}
        <div className="relative flex items-center justify-center">
          {/* Center logo */}
          <div className="absolute z-10 flex items-center justify-center w-16 h-16 rounded-full bg-primary">
            <img
              src="/favicon.png"
              alt="Floowy AI"
              className="w-10 h-10 brightness-0 invert"
            />
          </div>
          {/* Rotating ring */}
          <svg className="w-24 h-24 animate-spin" viewBox="0 0 96 96">
            <circle
              cx="48"
              cy="48"
              r="40"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="4"
              strokeDasharray="180 60"
              strokeLinecap="round"
              opacity="0.3"
            />
          </svg>
        </div>

        {/* Loading message */}
        <p className="text-sm font-medium text-muted-foreground">Floowy AI</p>
      </div>
    </div>
  );
};
