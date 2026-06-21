import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";
import { Download, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { ScrollArea } from "./ui/scroll-area";

interface Generation {
  id: string;
  created_at: string;
  prompt: string;
  generated_image_url: string;
}

interface PreviousGenerationsProps {
  userId: string;
}

const PreviousGenerations = ({ userId }: PreviousGenerationsProps) => {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && userId) {
      fetchGenerations();
    }
  }, [isOpen, userId]);

  const fetchGenerations = async () => {
    const { data, error } = await supabase
      .from("generations")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(50);

    if (data) {
      setGenerations(data);
    }
  };

  const handleDownload = async (videoUrl: string, generationId: string) => {
    try {
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `floowy-${generationId}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
      window.open(videoUrl, '_blank');
    }
  };

  // Check if URL is a video
  const isVideoUrl = (url: string) => {
    return url.includes('.mp4') || url.includes('.webm') || url.includes('.mov') || url.toLowerCase().endsWith('_video.png');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">View Previous Generations</Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Your Previous Generations</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          {generations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No previous generations yet</p>
              <p className="text-sm mt-2">Your generated photos will appear here</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {generations.map((gen) => {
                const isVideo = isVideoUrl(gen.generated_image_url);
                return (
                  <div
                    key={gen.id}
                    className="group relative rounded-lg overflow-hidden border border-border hover:shadow-glow transition-all cursor-pointer"
                    onClick={() => setSelectedImage(gen.generated_image_url)}
                  >
                    {isVideo ? (
                      <video
                        src={gen.generated_image_url}
                        className="w-full h-48 object-cover"
                        autoPlay
                        muted
                        loop
                        playsInline
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <img
                        src={gen.generated_image_url}
                        alt={gen.prompt}
                        className="w-full h-48 object-cover"
                        crossOrigin="anonymous"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          console.error('Image failed to load:', gen.generated_image_url);
                          e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%23999"%3EImage Error%3C/text%3E%3C/svg%3E';
                        }}
                      />
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(gen.generated_image_url, gen.id);
                        }}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                      <p className="text-white text-xs truncate">{gen.prompt}</p>
                      <p className="text-white/70 text-xs">
                        {new Date(gen.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>

      {/* Full Preview Dialog */}
      {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-5xl">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4 z-50"
              onClick={() => setSelectedImage(null)}
            >
              <X className="w-4 h-4" />
            </Button>
            {isVideoUrl(selectedImage) ? (
              <video
                src={selectedImage}
                controls
                autoPlay
                loop
                className="w-full h-auto rounded-lg"
                crossOrigin="anonymous"
              />
            ) : (
              <img
                src={selectedImage}
                alt="Full size preview"
                className="w-full h-auto rounded-lg"
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
              />
            )}
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
};

export default PreviousGenerations;
