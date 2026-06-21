import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Video } from "lucide-react";

interface VideoResultModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoUrl: string;
  title?: string;
  onDownload: () => void;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}

const VideoResultModal = ({
  open,
  onOpenChange,
  videoUrl,
  title = "Your Generated Video",
  onDownload,
  onRegenerate,
  isRegenerating = false,
}: VideoResultModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl">{title}</DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-4">
          <div className="rounded-xl overflow-hidden border border-border">
            <video
              src={videoUrl}
              controls
              autoPlay
              loop
              className="w-full h-auto"
            />
          </div>

          <div className="flex gap-3">
            <Button onClick={onDownload} className="flex-1 shadow-glow">
              <Download className="w-4 h-4 mr-2" />
              Download Video
            </Button>
            {onRegenerate && (
              <Button
                variant="outline"
                onClick={onRegenerate}
                disabled={isRegenerating}
              >
                <Video className="w-4 h-4 mr-2" />
                Regenerate
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VideoResultModal;
