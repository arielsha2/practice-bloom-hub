import { useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ChevronLeft, ChevronRight, Quote as QuoteIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Testimonial = {
  id: string;
  body_text: string | null;
  author: string | null;
  image_url: string | null;
};

interface Props {
  language: "he" | "en" | string;
  isRTL?: boolean;
}

export function MentorTestimonialsCarousel({ language, isRTL = false }: Props) {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "start", direction: isRTL ? "rtl" : "ltr" },
    [Autoplay({ delay: 6000, stopOnInteraction: true })],
  );

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("mentor_testimonials")
        .select("id, body_text, author, image_url")
        .eq("language", language)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (active) setItems((data as Testimonial[]) || []);
    })();
    return () => {
      active = false;
    };
  }, [language]);

  if (!items.length) return null;

  return (
    <div className="relative max-w-5xl mx-auto">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {items.map((it) => (
            <div
              key={it.id}
              className="flex-[0_0_100%] md:flex-[0_0_50%] lg:flex-[0_0_33.3333%] px-3"
            >
              <div className="h-full rounded-2xl p-7 md:p-8 bg-card border border-border shadow-soft flex flex-col">
                <QuoteIcon
                  className="mb-4 opacity-90"
                  style={{ color: "hsl(var(--terracotta))", width: 28, height: 28 }}
                />
                <p className="italic text-foreground leading-relaxed flex-1">{it.body_text}</p>
                {(it.author || it.image_url) && (
                  <div className="flex items-center gap-3 mt-6 pt-5 border-t border-border">
                    {it.image_url && (
                      <img
                        src={it.image_url}
                        alt={it.author || ""}
                        loading="lazy"
                        className="w-11 h-11 rounded-full object-cover border border-border"
                      />
                    )}
                    {it.author && (
                      <div className="text-sm font-semibold text-foreground">{it.author}</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        aria-label="Previous"
        onClick={() => emblaApi?.scrollPrev()}
        className="absolute top-1/2 -translate-y-1/2 -left-2 md:-left-6 z-10 h-10 w-10 rounded-full bg-background/95 border border-border shadow-soft flex items-center justify-center hover:bg-background"
      >
        <ChevronLeft className="w-5 h-5 text-foreground" />
      </button>
      <button
        type="button"
        aria-label="Next"
        onClick={() => emblaApi?.scrollNext()}
        className="absolute top-1/2 -translate-y-1/2 -right-2 md:-right-6 z-10 h-10 w-10 rounded-full bg-background/95 border border-border shadow-soft flex items-center justify-center hover:bg-background"
      >
        <ChevronRight className="w-5 h-5 text-foreground" />
      </button>
    </div>
  );
}
