import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

import gallery1 from "@/assets/gallery-curly-girl.png";
import gallery2 from "@/assets/gallery-2.jpg";
import gallery3 from "@/assets/gallery-3.jpg";
import gallery4 from "@/assets/gallery-4.jpg";
import gallery5 from "@/assets/gallery-5.jpg";
import gallery8 from "@/assets/gallery-8.jpg";
import galleryVideoNew from "@/assets/gallery-video-new.mp4";
import galleryVideo3 from "@/assets/gallery-video-3.mp4";
import galleryFashionRunway from "@/assets/gallery-fashion-runway.jpg";
import galleryPrimeHydration from "@/assets/gallery-prime-hydration.png";
import galleryJacketJil from "@/assets/gallery-jacket-jil.png";

export type GalleryItem = { src: string; alt: string; type: "image" | "video" };

export const fallbackGalleryItems: GalleryItem[] = [
  { src: gallery1, alt: "Curly hair model", type: "image" },
  { src: galleryJacketJil, alt: "Jil Sander jacket", type: "image" },
  { src: gallery2, alt: "Luxury perfume", type: "image" },
  { src: gallery3, alt: "Fashion sneakers", type: "image" },
  { src: galleryFashionRunway, alt: "Fashion runway", type: "image" },
  { src: gallery4, alt: "Phone case styling", type: "image" },
  { src: gallery5, alt: "Gold bracelet", type: "image" },
  { src: galleryPrimeHydration, alt: "Prime hydration ad", type: "image" },
  { src: galleryVideoNew, alt: "Product showcase", type: "video" },
  { src: galleryVideo3, alt: "Creative showcase", type: "video" },
  { src: gallery8, alt: "Fashion dress", type: "image" },
];

export const useGalleryItems = (): GalleryItem[] => {
  const [items, setItems] = useState<GalleryItem[]>(fallbackGalleryItems);

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const { data, error } = await supabase
          .from("gallery_items")
          .select("*")
          .eq("is_visible", true)
          .order("sort_order", { ascending: true });
        if (!error && data && data.length > 0) {
          setItems(
            data.map((item: any) => ({
              src: item.src_url,
              alt: item.alt,
              type: item.type,
            }))
          );
        }
      } catch {
        // keep fallback
      }
    };

    fetchGallery();

    const channel = supabase
      .channel("gallery_items_shared_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "gallery_items" },
        () => fetchGallery()
      )
      .subscribe();

    const pollId = setInterval(fetchGallery, 3000);

    return () => {
      clearInterval(pollId);
      supabase.removeChannel(channel);
    };
  }, []);

  return items;
};