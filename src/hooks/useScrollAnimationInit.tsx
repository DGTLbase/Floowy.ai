import { useEffect } from "react";

export const useScrollAnimationInit = () => {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-in");
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px",
      }
    );

    // Observe all elements with scroll animation classes
    const elements = document.querySelectorAll(
      ".scroll-animate, .scroll-fade-down, .scroll-fade-left, .scroll-fade-right, .scroll-scale"
    );
    
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, []);
};
