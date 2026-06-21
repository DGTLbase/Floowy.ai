import fashionScroll1 from "@/assets/fashion-scroll-1.webp";
import fashionScroll2 from "@/assets/fashion-scroll-2.webp";
import fashionScroll3 from "@/assets/fashion-scroll-3.webp";
import fashionScroll4 from "@/assets/fashion-scroll-4.webp";
import fashionScroll5 from "@/assets/fashion-scroll-5.webp";
import fashionScroll6 from "@/assets/fashion-scroll-6.webp";
import fashionScroll7 from "@/assets/fashion-scroll-7.webp";
import fashionScroll8 from "@/assets/fashion-scroll-8.webp";
import fashionScroll9 from "@/assets/fashion-scroll-9.webp";
import fashionScroll10 from "@/assets/fashion-scroll-10.webp";
import fashionScroll11 from "@/assets/fashion-scroll-11.webp";
import fashionScroll12 from "@/assets/fashion-scroll-12.webp";

const column1 = [fashionScroll1, fashionScroll4, fashionScroll7, fashionScroll10];
const column2 = [fashionScroll2, fashionScroll5, fashionScroll8, fashionScroll11];
const column3 = [fashionScroll3, fashionScroll6, fashionScroll9, fashionScroll12];

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
            alt={`Fashion model example ${(i % images.length) + 1}`}
            className="w-full rounded-xl object-cover"
            loading="lazy"
          />
        ))}
      </div>
    </div>
  );
};

const FashionScrollingGrid = () => {
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

export default FashionScrollingGrid;
