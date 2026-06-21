import ambienceScroll1 from "@/assets/ambience-scroll-1.webp";
import ambienceScroll2 from "@/assets/ambience-scroll-2.webp";
import ambienceScroll3 from "@/assets/ambience-scroll-3.webp";
import ambienceScroll4 from "@/assets/ambience-scroll-4.webp";
import ambienceScroll5 from "@/assets/ambience-scroll-5.webp";
import ambienceScroll6 from "@/assets/ambience-scroll-6.webp";
import ambienceScroll7 from "@/assets/ambience-scroll-7.webp";
import ambienceScroll8 from "@/assets/ambience-scroll-8.webp";
import ambienceScroll9 from "@/assets/ambience-scroll-9.webp";
import ambienceScroll10 from "@/assets/ambience-scroll-10.webp";
import ambienceScroll11 from "@/assets/ambience-scroll-11.webp";
import ambienceScroll12 from "@/assets/ambience-scroll-12.webp";

const column1 = [ambienceScroll1, ambienceScroll4, ambienceScroll7, ambienceScroll10];
const column2 = [ambienceScroll2, ambienceScroll5, ambienceScroll8, ambienceScroll11];
const column3 = [ambienceScroll3, ambienceScroll6, ambienceScroll9, ambienceScroll12];

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
            alt={`Ambience scene example ${(i % images.length) + 1}`}
            className="w-full rounded-xl object-cover"
            loading="lazy"
          />
        ))}
      </div>
    </div>
  );
};

const AmbienceScrollingGrid = () => {
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

export default AmbienceScrollingGrid;
