import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";

import nimaniLogo from "@/assets/logos/nimani-logo.png";
import lothFabenimLogo from "@/assets/logos/loth-fabenim-logo.png";
import curlygirlmovementLogo from "@/assets/logos/curlygirlmovement-logo.png";
import reloadbaseLogo from "@/assets/logos/reloadbase-logo.png";
import welhofLogo from "@/assets/logos/welhof-logo.png";
import idonLogo from "@/assets/logos/idon-logo.png";

const testimonials = [
  {
    name: "Niels",
    role: "Head of Marketing",
    company: "Nimani",
    logo: nimaniLogo,
    content: "Floowy.ai has completely changed how we create visuals for campaigns. What used to take a full day in coordination with our designers now takes less than an hour. The quality is spot-on, and our workflow is finally as fast as our ideas.",
    rating: 5,
    initials: "N",
  },
  {
    name: "Ray",
    role: "Founder",
    company: "Loth Fabenim",
    logo: lothFabenimLogo,
    content: "As a founder, I need things that save time and deliver results. Floowy.ai gives me both. I can generate content ideas and visuals on the go, and the results actually match my brand aesthetic. It's like having an in-house creative team, but automated.",
    rating: 5,
    initials: "R",
  },
  {
    name: "Jason",
    role: "E-commerce Manager",
    company: "Curlygirlmovement",
    logo: curlygirlmovementLogo,
    content: "We use Floowy.ai to produce lifestyle visuals and short videos for our online store and social channels. It has saved us countless hours and helped us maintain consistency across all our platforms. The ROI calculator really shows how much value we're getting.",
    rating: 5,
    initials: "J",
  },
  {
    name: "Simon",
    role: "Digital Marketing Manager",
    company: "ReloadBase",
    logo: reloadbaseLogo,
    content: "Floowy.ai helps us scale ad creatives faster than ever before. Instead of briefing designers for every small change, we can instantly test multiple variations. It's become a key part of our performance marketing stack.",
    rating: 5,
    initials: "S",
  },
  {
    name: "Erik",
    role: "Online Marketer",
    company: "Welhof",
    logo: welhofLogo,
    content: "I was skeptical at first, but after testing Floowy.ai I was impressed by how quickly it produces high-quality creatives. It's easy to use, integrates smoothly with our workflow, and helps us launch campaigns faster, without compromising quality.",
    rating: 5,
    initials: "E",
  },
  {
    name: "Dirk",
    role: "Founder",
    company: "iDon",
    logo: idonLogo,
    content: "Floowy.ai has been a gamechanger for our bol.com listings. I create high-quality product visuals in minutes, and the consistency has noticeably improved our conversions. Fast, easy, and exactly what we needed.",
    rating: 5,
    initials: "D",
  },
];

const TestimonialsSection = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);

    // Calculate active dot
    const cardWidth = el.scrollWidth / testimonials.length;
    const idx = Math.round(el.scrollLeft / cardWidth);
    setActiveIndex(Math.min(idx, testimonials.length - 1));
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll]);

  // Auto-scroll every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const el = scrollRef.current;
      if (!el) return;
      const cardWidth = el.querySelector<HTMLElement>(":scope > div")?.offsetWidth ?? 400;
      const gap = 24;
      const atEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth - 4;
      if (atEnd) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: cardWidth + gap, behavior: "smooth" });
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.querySelector<HTMLElement>(":scope > div")?.offsetWidth ?? 400;
    const gap = 24;
    el.scrollBy({ left: direction === "left" ? -(cardWidth + gap) : cardWidth + gap, behavior: "smooth" });
  };

  const scrollToIndex = (index: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.children[index] as HTMLElement | undefined;
    if (card) {
      el.scrollTo({ left: card.offsetLeft - el.offsetLeft, behavior: "smooth" });
    }
  };

  return (
    <section className="container mx-auto px-4 pt-10 pb-12 md:pt-[52px] md:pb-16 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 px-4">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
            <span className="text-header-dark">The Results Speak</span> <span className="text-primary">for Themselves</span>
          </h2>
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-5xl font-bold text-foreground">4.7</span>
            <div className="flex flex-col items-start">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-5 h-5 ${i < 4 ? "text-primary fill-primary" : "text-muted fill-muted"}`}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-sm text-muted-foreground">out of 5</span>
            </div>
          </div>
        </div>

        {/* Carousel */}
        <div className="relative group">
          {/* Navigation arrows – desktop */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll("left")}
            className={`absolute -left-5 top-1/2 -translate-y-1/2 z-10 hidden md:flex rounded-full shadow-lg border-border/50 bg-background/90 backdrop-blur-sm transition-opacity ${
              canScrollLeft ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll("right")}
            className={`absolute -right-5 top-1/2 -translate-y-1/2 z-10 hidden md:flex rounded-full shadow-lg border-border/50 bg-background/90 backdrop-blur-sm transition-opacity ${
              canScrollRight ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>

          {/* Cards container */}
          <div
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-4 -mb-4 scrollbar-hide"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {testimonials.map((testimonial, index) => (
              <Card
                key={index}
                className="flex-shrink-0 w-[85vw] sm:w-[70vw] md:w-[calc((100%-48px)/3)] snap-start border-border/50 shadow-elegant hover:shadow-glow transition-all duration-300 hover:-translate-y-1"
              >
                <CardContent className="p-6 flex flex-col h-full">
                  {/* Stars */}
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                    ))}
                  </div>

                  {/* Quote */}
                  <p className="text-muted-foreground mb-6 leading-relaxed flex-1 text-sm">
                    "{testimonial.content}"
                  </p>

                  {/* Profile with Company Logo */}
                  <div className="flex items-center gap-3">
                    <img
                      src={testimonial.logo}
                      alt={`${testimonial.company} logo`}
                      className="h-10 w-10 rounded-lg object-contain bg-muted/50 p-1 shrink-0" loading="lazy" decoding="async"
                    />
                    <div>
                      <p className="font-semibold text-foreground text-sm">
                        {testimonial.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {testimonial.role} at {testimonial.company}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Dot indicators */}
        <div className="flex justify-center gap-2 mt-6">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollToIndex(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === activeIndex
                  ? "bg-primary w-6"
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
              aria-label={`Go to review ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
