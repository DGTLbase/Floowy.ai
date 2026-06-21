import fspScroll1 from "@/assets/fsp-scroll-1.webp";
import fspScroll2 from "@/assets/fsp-scroll-2.webp";
import fspScroll3 from "@/assets/fsp-scroll-3.webp";
import fspScroll4 from "@/assets/fsp-scroll-4.webp";
import fspScroll5 from "@/assets/fsp-scroll-5.webp";
import fspScroll6 from "@/assets/fsp-scroll-6.webp";
import fspScroll7 from "@/assets/fsp-scroll-7.webp";
import fspScroll8 from "@/assets/fsp-scroll-8.webp";
import fspScroll9 from "@/assets/fsp-scroll-9.webp";
import fspScroll10 from "@/assets/fsp-scroll-10.webp";
import fspScroll11 from "@/assets/fsp-scroll-11.webp";
import fspScroll12 from "@/assets/fsp-scroll-12.webp";

const column1 = [fspScroll1, fspScroll2, fspScroll3, fspScroll4];
const column2 = [fspScroll5, fspScroll6, fspScroll7, fspScroll8];
const column3 = [fspScroll9, fspScroll10, fspScroll11, fspScroll12];

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
            alt={`Fashion campaign example ${(i % images.length) + 1}`}
            className="w-full rounded-xl object-cover"
            loading="lazy"
          />
        ))}
      </div>
    </div>
  );
};

const FashionProScrollingGrid = () => {
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

export default FashionProScrollingGrid;
