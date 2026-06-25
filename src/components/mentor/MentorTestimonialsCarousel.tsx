import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface MentorTestimonial {
  id: string;
  language: "he" | "en";
  kind: "text" | "image";
  body_text: string | null;
  author: string | null;
  image_url: string | null;
  sort_order: number;
}

interface Props {
  language: "he" | "en";
}

export function MentorTestimonialsCarousel({ language }: Props) {
  const [items, setItems] = useState<MentorTestimonial[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const isRTL = language === "he";

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("mentor_testimonials")
        .select("*")
        .eq("language", language)
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (!active) return;
      setItems((data as any) || []);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [language]);

  const next = useCallback(() => {
    setCurrent((c) => (items.length ? (c + 1) % items.length : 0));
  }, [items.length]);

  const prev = useCallback(() => {
    setCurrent((c) => (items.length ? (c - 1 + items.length) % items.length : 0));
  }, [items.length]);

  if (loading || items.length === 0) return null;

  const heading = isRTL ? "מטפלים ומטפלות מספרים" : "What therapists are saying";
  const sub = isRTL
    ? "קולות אמיתיים מהשטח — מאחורי המנטור."
    : "Real voices from therapists who use the Mentor.";

  const item = items[current];

  return (
    <section className="band band-grain band-cream" dir={isRTL ? "rtl" : "ltr"}>
      <div className="container mx-auto px-4 max-w-4xl pt-20 pb-24 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="section-eyebrow" style={{ color: "hsl(var(--terracotta))" }}>
            {isRTL ? "המלצות" : "Testimonials"}
          </div>
          <h2 className="font-display text-3xl md:text-5xl tracking-tight leading-tight mb-3 text-foreground">
            {heading}
          </h2>
          <p className="text-base md:text-lg text-muted-foreground">{sub}</p>
        </div>

        <div className="relative max-w-3xl mx-auto">
          {items.length > 1 && (
            <>
              <Button
                variant="outline"
                size="icon"
                aria-label={isRTL ? "הקודם" : "Previous"}
                className="absolute top-1/2 -translate-y-1/2 -right-2 md:-right-14 z-10 rounded-full bg-card shadow-card border-border/50 hover:bg-primary hover:text-primary-foreground"
                onClick={isRTL ? next : prev}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label={isRTL ? "הבא" : "Next"}
                className="absolute top-1/2 -translate-y-1/2 -left-2 md:-left-14 z-10 rounded-full bg-card shadow-card border-border/50 hover:bg-primary hover:text-primary-foreground"
                onClick={isRTL ? prev : next}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </>
          )}

          <div className="min-h-[320px] flex items-center justify-center px-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: isRTL ? -40 : 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isRTL ? 40 : -40 }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                {item.kind === "text" ? (
                  <div className="bg-card rounded-2xl border border-border/60 p-8 md:p-10 mx-auto max-w-2xl shadow-soft">
                    <Quote className="w-8 h-8 mb-4" style={{ color: "hsl(var(--terracotta))" }} />
                    <p className="text-foreground/90 leading-relaxed mb-6 whitespace-pre-line text-base md:text-lg">
                      {item.body_text}
                    </p>
                    {item.author && (
                      <p className="font-bold text-foreground">— {item.author}</p>
                    )}
                  </div>
                ) : (
                  <div className="rounded-2xl overflow-hidden shadow-card border border-border/50 mx-auto max-w-xl bg-card">
                    {item.image_url && (
                      <img
                        src={item.image_url}
                        alt={item.author || (isRTL ? "המלצה" : "Testimonial")}
                        className="w-full h-auto"
                        loading="lazy"
                      />
                    )}
                    {item.author && (
                      <p className="text-center text-sm text-muted-foreground py-3 px-4">
                        — {item.author}
                      </p>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {items.length > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {items.map((t, i) => (
                <button
                  key={t.id}
                  onClick={() => setCurrent(i)}
                  aria-label={`${isRTL ? "המלצה" : "Testimonial"} ${i + 1}`}
                  className={`rounded-full transition-all duration-300 ${
                    i === current
                      ? "w-8 h-2.5 bg-primary"
                      : "w-2.5 h-2.5 bg-border hover:bg-muted-foreground/30"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
