import { useEffect } from "react";

/**
 * Adds `.is-visible` to any element with `.reveal` (or `.shimmer-once`)
 * once it enters the viewport. Fires once per element. No loop.
 */
export function useRevealOnScroll() {
  useEffect(() => {
    const targets = document.querySelectorAll<HTMLElement>(".reveal, .shimmer-once");
    if (!targets.length) return;

    if (typeof IntersectionObserver === "undefined") {
      targets.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );

    targets.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}
