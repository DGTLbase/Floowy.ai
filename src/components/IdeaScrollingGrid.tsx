import ig1 from "@/assets/idea-grid-1.webp";
import ig2 from "@/assets/idea-grid-2.webp";
import ig3 from "@/assets/idea-grid-3.webp";
import ig4 from "@/assets/idea-grid-4.webp";
import ig5 from "@/assets/idea-grid-5.webp";
import ig6 from "@/assets/idea-grid-6.webp";
import ig7 from "@/assets/idea-grid-7.webp";
import ig8 from "@/assets/idea-grid-8.webp";
import ig9 from "@/assets/idea-grid-9.webp";

const column1 = [ig1, ig2, ig3];
const column2 = [ig4, ig5, ig6];
const column3 = [ig7, ig8, ig9];

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
            alt={`Creative variation ${(i % images.length) + 1}`}
            className="w-full rounded-xl object-cover"
            loading="lazy"
          />
        ))}
      </div>
    </div>
  );
};

const IdeaScrollingGrid = () => {
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

export default IdeaScrollingGrid;
