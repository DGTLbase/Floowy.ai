import { useState, useRef, useCallback, useEffect } from "react";
import type { GenerationStage } from "@/components/GenerationProgressOverlay";

export const useGenerationProgress = () => {
  const [stage, setStage] = useState<GenerationStage>("uploading");
  const [progress, _setProgress] = useState(0);
  const progressRef = useRef(0);

  // Ensure progress never goes backwards
  const setProgress = useCallback((val: number | ((prev: number) => number)) => {
    _setProgress(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      if (next > progressRef.current) {
        progressRef.current = next;
        return next;
      }
      return prev;
    });
  }, []);
  const [statusMessage, setStatusMessage] = useState("");
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const stageTargets: Record<GenerationStage, { min: number; max: number }> = {
    uploading: { min: 0, max: 20 },
    generating: { min: 20, max: 85 },
    finalizing: { min: 85, max: 95 },
    completed: { min: 100, max: 100 },
    failed: { min: 0, max: 0 },
  };

  // Smooth progress animation within stage bounds
  useEffect(() => {
    if (!isActive || stage === "completed" || stage === "failed") {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    const target = stageTargets[stage];
    intervalRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= target.max) return prev;
        // Slow down as we approach the max
        const remaining = target.max - prev;
        const increment = Math.max(0.3, remaining * 0.05);
        return Math.min(prev + increment, target.max);
      });
    }, 500);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isActive, stage]);

  const start = useCallback(() => {
    setIsActive(true);
    progressRef.current = 0;
    _setProgress(0);
    setStage("uploading");
    setStatusMessage("Preparing your images...");
  }, []);

  const setGenerating = useCallback((msg?: string) => {
    setStage("generating");
    setProgress(20);
    setStatusMessage(msg || "AI is creating your images...");
  }, []);

  const setFinalizing = useCallback((msg?: string) => {
    setStage("finalizing");
    setProgress(85);
    setStatusMessage(msg || "Almost done...");
  }, []);

  const complete = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setStage("completed");
    setProgress(100);
    setStatusMessage("Complete!");
    setIsActive(false);
  }, []);

  const fail = useCallback((msg?: string) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setStage("failed");
    setStatusMessage(msg || "Something went wrong. Please try again.");
    setIsActive(false);
  }, []);

  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsActive(false);
    progressRef.current = 0;
    _setProgress(0);
    setStage("uploading");
    setStatusMessage("");
  }, []);

  return {
    stage,
    progress,
    statusMessage,
    isActive,
    start,
    setGenerating,
    setFinalizing,
    complete,
    fail,
    reset,
  };
};
