import adScroll1 from "@/assets/ad-scroll-1.webp";
import adScroll2 from "@/assets/ad-scroll-2.webp";
import adScroll3 from "@/assets/ad-scroll-3.webp";
import adScroll4 from "@/assets/ad-scroll-4.webp";
import adScroll5 from "@/assets/ad-scroll-5.webp";
import adScroll6 from "@/assets/ad-scroll-6.webp";
import adScroll7 from "@/assets/ad-scroll-7.webp";
import adScroll8 from "@/assets/ad-scroll-8.webp";
import adScroll9 from "@/assets/ad-scroll-9.webp";
import adScroll10 from "@/assets/ad-scroll-10.webp";
import adScroll11 from "@/assets/ad-scroll-11.webp";
import adScroll12 from "@/assets/ad-scroll-12.webp";

const column1 = [adScroll1, adScroll4, adScroll7, adScroll10];
const column2 = [adScroll2, adScroll5, adScroll8, adScroll11];
const column3 = [adScroll3, adScroll6, adScroll9, adScroll12];

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
            alt={`Ad creative example ${(i % images.length) + 1}`}
            className="w-full rounded-xl object-cover"
            loading="lazy"
          />
        ))}
      </div>
    </div>
  );
};

const AdScrollingGrid = () => {
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

export default AdScrollingGrid;
