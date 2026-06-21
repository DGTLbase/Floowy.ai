import listingGrid1 from "@/assets/listing-grid-1.webp";
import listingGrid2 from "@/assets/listing-grid-2.webp";
import listingGrid3 from "@/assets/listing-grid-3.webp";
import listingGrid4 from "@/assets/listing-grid-4.webp";
import listingGrid5 from "@/assets/listing-grid-5.webp";
import listingGrid6 from "@/assets/listing-grid-6.webp";
import listingGrid7 from "@/assets/listing-grid-7.webp";
import listingGrid8 from "@/assets/listing-grid-8.webp";
import listingGrid9 from "@/assets/listing-grid-9.webp";
import listingGrid10 from "@/assets/listing-grid-10.webp";
import listingGrid11 from "@/assets/listing-grid-11.webp";
import listingGrid12 from "@/assets/listing-grid-12.webp";

const column1 = [listingGrid1, listingGrid4, listingGrid7, listingGrid10];
const column2 = [listingGrid2, listingGrid5, listingGrid8, listingGrid11];
const column3 = [listingGrid3, listingGrid6, listingGrid9, listingGrid12];

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
            alt={`Product listing image example ${(i % images.length) + 1}`}
            className="w-full rounded-xl object-cover"
            loading="lazy"
          />
        ))}
      </div>
    </div>
  );
};

const ListingScrollingGrid = () => {
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

export default ListingScrollingGrid;
