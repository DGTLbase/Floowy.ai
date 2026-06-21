const column1 = ["/videos/creator-grid-1.mp4", "/videos/creator-grid-4.mp4", "/videos/creator-grid-7.mp4"];
const column2 = ["/videos/creator-grid-2.mp4", "/videos/creator-grid-5.mp4", "/videos/creator-grid-8.mp4"];
const column3 = ["/videos/creator-grid-3.mp4", "/videos/creator-grid-6.mp4", "/videos/creator-grid-9.mp4"];

const ScrollColumn = ({
  videos,
  direction = "up",
  duration = "30s",
}: {
  videos: string[];
  direction?: "up" | "down";
  duration?: string;
}) => {
  const doubled = [...videos, ...videos];
  const animClass = direction === "up" ? "animate-scroll-up" : "animate-scroll-down";

  return (
    <div className="relative overflow-hidden h-[500px] md:h-[600px]">
      <div
        className={`flex flex-col gap-4 ${animClass}`}
        style={{ animationDuration: duration }}
      >
        {doubled.map((src, i) => (
          <video
            key={i}
            src={src}
            autoPlay
            muted
            loop
            playsInline
            className="w-full rounded-xl object-cover"
          />
        ))}
      </div>
    </div>
  );
};

const CreatorScrollingGrid = () => {
  return (
    <div className="relative">
      <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-muted/30 to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-muted/30 to-transparent z-10 pointer-events-none" />
      <div className="grid grid-cols-3 gap-3 md:gap-4 max-w-2xl mx-auto lg:mx-0">
        <ScrollColumn videos={column1} direction="up" duration="25s" />
        <ScrollColumn videos={column2} direction="down" duration="30s" />
        <ScrollColumn videos={column3} direction="up" duration="28s" />
      </div>
    </div>
  );
};

export default CreatorScrollingGrid;
