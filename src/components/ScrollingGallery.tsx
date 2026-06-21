import { useGalleryItems } from "@/hooks/useGalleryItems";

interface ScrollingGalleryProps {
  title?: string;
  subtitle?: string;
}

const ScrollingGallery = ({ title, subtitle }: ScrollingGalleryProps) => {
  const galleryItems = useGalleryItems();

  return (
    <section className="py-8">
      {(title || subtitle) && (
        <div className="text-center mb-6 px-4">
          {title && (
            <h2 className="text-2xl md:text-3xl font-bold text-header-dark mb-2">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-muted-foreground">{subtitle}</p>
          )}
        </div>
      )}
      
      <div className="relative overflow-hidden w-full">
        <div className="flex gap-4 w-max animate-scroll-left will-change-transform">
          {[...galleryItems, ...galleryItems].map((item, index) => (
            <div
              key={index}
              className="flex-shrink-0 w-36 h-48 md:w-64 md:h-80 rounded-2xl overflow-hidden shadow-lg hover:shadow-glow transition-all duration-300 hover:scale-105"
            >
              {item.type === "video" ? (
                <video
                  src={item.src}
                  className="w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              ) : (
                <img
                  src={item.src}
                  alt={item.alt}
                  className="w-full h-full object-cover" loading="lazy" decoding="async"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ScrollingGallery;
