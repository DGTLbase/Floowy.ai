import { useState, useCallback, useRef, DragEvent, ReactNode } from "react";

interface DragDropZoneProps {
  onFileDrop: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
}

const DragDropZone = ({ onFileDrop, accept, multiple = false, disabled = false, children, className = "" }: DragDropZoneProps) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const acceptTypes = accept?.split(",").map(t => t.trim()) || [];

  const handleDragOver = useCallback((e: DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (disabled) return;

    let files = Array.from(e.dataTransfer.files);

    if (acceptTypes.length > 0) {
      files = files.filter(f => {
        // Check MIME type match or wildcard (e.g., "image/*")
        return acceptTypes.some(type => {
          if (type.endsWith("/*")) {
            return f.type.startsWith(type.replace("/*", "/"));
          }
          return f.type === type;
        });
      });
    }

    if (!multiple) {
      files = files.slice(0, 1);
    }

    if (files.length > 0) {
      onFileDrop(files);
    }
  }, [acceptTypes, multiple, disabled, onFileDrop]);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`${className} ${isDragOver && !disabled ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}
    >
      {children}
    </div>
  );
};

export default DragDropZone;
