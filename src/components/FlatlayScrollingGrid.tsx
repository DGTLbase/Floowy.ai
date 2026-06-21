import fg1 from "@/assets/flatlay-grid-1.webp";
import fg2 from "@/assets/flatlay-grid-2.webp";
import fg3 from "@/assets/flatlay-grid-3.webp";
import fg4 from "@/assets/flatlay-grid-4.webp";
import fg5 from "@/assets/flatlay-grid-5.webp";
import fg6 from "@/assets/flatlay-grid-6.webp";
import fg7 from "@/assets/flatlay-grid-7.webp";
import fg8 from "@/assets/flatlay-grid-8.webp";
import fg9 from "@/assets/flatlay-grid-9.webp";
import fg10 from "@/assets/flatlay-grid-10.webp";
import fg11 from "@/assets/flatlay-grid-11.webp";
import fg12 from "@/assets/flatlay-grid-12.webp";

const column1 = [fg1, fg2, fg3, fg4];
const column2 = [fg5, fg6, fg7, fg8];
const column3 = [fg9, fg10, fg11, fg12];

const ScrollColumn = ({
  images,
  direction = "up",
  duration = "30s",
}: {
  images: string[];
  direction?: "up" | "down";
  duration?: string;
}) => {
  const doubled = [...images, ...images];
  const animClass = direction === "up" ? "animate-scroll-up" : "animate-scroll-down";

  return (
    <div className="relative overflow-hidden h-[500px] md:h-[600px]">
      <div
        className={`flex flex-col gap-4 ${animClass}`}
        style={{ animationDuration: duration }}
      >
        {doubled.map((src, i) => (
          <img
            key={i}
            src={src}
            alt={`Flat lay product example ${(i % images.length) + 1}`}
            className="w-full rounded-xl object-cover"
            loading="lazy"
          />
        ))}
      </div>
    </div>
  );
};

const FlatlayScrollingGrid = () => {
  return (
    <div className="relative">
      <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />
      <div className="grid grid-cols-3 gap-3 md:gap-4 max-w-2xl mx-auto lg:mx-0">
        <ScrollColumn images={column1} direction="up" duration="25s" />
        <ScrollColumn images={column2} direction="down" duration="30s" />
        <ScrollColumn images={column3} direction="up" duration="28s" />
      </div>
    </div>
  );
};

export default FlatlayScrollingGrid;
