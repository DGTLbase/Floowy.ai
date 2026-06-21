import { useState, useCallback, DragEvent } from "react";

interface UseFileDropOptions {
  accept?: string[];
  maxSize?: number; // bytes
  multiple?: boolean;
  onDrop: (files: File[]) => void;
}

export function useFileDrop({ accept, maxSize, multiple = false, onDrop }: UseFileDropOptions) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    let files = Array.from(e.dataTransfer.files);

    if (accept && accept.length > 0) {
      files = files.filter(f => accept.includes(f.type));
    }

    if (maxSize) {
      files = files.filter(f => f.size <= maxSize);
    }

    if (!multiple) {
      files = files.slice(0, 1);
    }

    if (files.length > 0) {
      onDrop(files);
    }
  }, [accept, maxSize, multiple, onDrop]);

  return {
    isDragOver,
    dragProps: {
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop,
    },
  };
}
