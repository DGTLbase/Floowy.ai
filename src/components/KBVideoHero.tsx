import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Play } from "lucide-react";

const getYouTubeId = (url: string): string | null => {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
};

const getYouTubeEmbedUrl = (url: string): string | null => {
  const id = getYouTubeId(url);
  return id ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=1&rel=0` : null;
};

const getYouTubeThumbnail = (url: string): string | null => {
  const id = getYouTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
};

interface KBVideoHeroProps {
  toolName: string;
  className?: string;
}

const KBVideoHero = ({ toolName, className = "" }: KBVideoHeroProps) => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [showEmbed, setShowEmbed] = useState(false);

  useEffect(() => {
    supabase
      .from("knowledge_base_videos")
      .select("video_url")
      .eq("tool_name", toolName)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setVideoUrl(data.video_url);
      });
  }, [toolName]);

  if (!videoUrl) return null;

  const ytId = getYouTubeId(videoUrl);
  const ytEmbed = getYouTubeEmbedUrl(videoUrl);
  const ytThumb = getYouTubeThumbnail(videoUrl);

  return (
    <section className={`py-6 md:py-10 bg-background ${className}`}>
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-2xl overflow-hidden shadow-2xl border border-border/50 aspect-video relative bg-black">
            {ytId && !showEmbed ? (
              <button
                onClick={() => setShowEmbed(true)}
                className="w-full h-full relative group cursor-pointer"
              >
                <img
                  src={`https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`}
                  alt={`${toolName} tutorial video`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to hqdefault if maxres doesn't exist
                    (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
                  }}
                />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/40 transition-colors">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary/90 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                    <Play className="w-8 h-8 md:w-10 md:h-10 text-white fill-white ml-1" />
                  </div>
                </div>
              </button>
            ) : ytEmbed && showEmbed ? (
              <iframe
                src={ytEmbed}
                className="w-full h-full absolute inset-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={`${toolName} tutorial video`}
              />
            ) : !ytId ? (
              <video
                src={videoUrl}
                className="w-full h-full object-cover"
                controls
                autoPlay
                muted
                loop
                playsInline
              />
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
};

export { getYouTubeThumbnail, getYouTubeEmbedUrl };
export default KBVideoHero;
