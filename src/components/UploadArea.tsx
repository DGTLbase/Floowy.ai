import { useCallback } from "react";
import { Upload, X } from "lucide-react";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";

interface UploadAreaProps {
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
  label?: string;
  compact?: boolean;
}

const UploadArea = ({ onFileSelect, selectedFile, label = "Upload Product", compact = false }: UploadAreaProps) => {
  const { toast } = useToast();

  const validateFile = (file: File): boolean => {
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    const maxSize = 50 * 1024 * 1024; // 50MB

    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPG, PNG or WebP image",
        variant: "destructive",
      });
      return false;
    }

    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Maximum file size is 50MB",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && validateFile(file)) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && validateFile(file)) {
      onFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <div className={`bg-card rounded-2xl border-2 border-dashed border-border shadow-elegant overflow-hidden ${compact ? 'p-3 h-full flex flex-col max-w-full' : 'p-8'}`}>
      <h2 className={`font-bold text-foreground ${compact ? 'text-base mb-2' : 'text-2xl mb-4'}`}>{label}</h2>
      
      {!selectedFile ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className={`border-2 border-dashed border-primary/30 rounded-xl text-center hover:border-primary/50 transition-colors bg-accent/5 ${compact ? 'p-4 flex-1 flex items-center justify-center' : 'p-12'}`}
        >
          <div className={`flex flex-col items-center ${compact ? 'gap-2' : 'gap-4'}`}>
            <div className={`bg-primary/10 rounded-full flex items-center justify-center ${compact ? 'w-8 h-8' : 'w-16 h-16'}`}>
              <Upload className={`text-primary ${compact ? 'w-4 h-4' : 'w-8 h-8'}`} />
            </div>
            <div>
              <p className={`font-medium text-foreground ${compact ? 'text-xs mb-1' : 'text-lg mb-2'}`}>
                Drop your {label.toLowerCase()} here
              </p>
              <p className={`text-muted-foreground ${compact ? 'text-xs mb-2' : 'text-sm mb-4'}`}>
                or click to browse
              </p>
            </div>
            <label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size={compact ? "sm" : "default"}
                className="cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  (e.currentTarget.previousSibling as HTMLInputElement)?.click();
                }}
              >
                Browse Files
              </Button>
            </label>
            {!compact && (
              <p className="text-xs text-muted-foreground">
                JPG, PNG or WebP • Max 50MB
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className={compact ? 'space-y-2 flex-1 flex flex-col' : 'space-y-4'}>
          <div className={`relative rounded-xl overflow-hidden border border-border bg-muted/20 ${compact ? 'flex-1' : 'h-64'}`}>
            <img
              src={URL.createObjectURL(selectedFile)}
              alt="Preview"
              className="w-full h-full object-contain"
            />
            <Button
              variant="destructive"
              size="icon"
              className={`absolute ${compact ? 'top-1 right-1' : 'top-2 right-2'}`}
              onClick={() => onFileSelect(null)}
            >
              <X className={compact ? 'w-3 h-3' : 'w-4 h-4'} />
            </Button>
          </div>
          {!compact && (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{selectedFile.name}</span>
              <br />
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default UploadArea;