import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Volume2, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import testimonial1 from '@/assets/turning-point/testimonial1.webp';
import testimonial2 from '@/assets/turning-point/testimonial2.webp';
import testimonial3 from '@/assets/turning-point/testimonial3.webp';
import testimonial4 from '@/assets/turning-point/testimonial4.jpg';
import marimPoster from '@/assets/turning-point/marim-poster.png';

type Testimonial =
  | { type: 'text'; text: string; author: string; highlight?: boolean }
  | { type: 'audio'; audioSrc: string; poster: string; author: string; highlight?: boolean }
  | { type: 'image'; imageSrc: string; highlight?: boolean };

const testimonials: Testimonial[] = [
  {
    type: 'text',
    highlight: true,
    text: 'אני מטפלת מנוסה, ועדיין הרגשתי שחסר לי ביטחון מקצועי. הרגשתי שפשוט אין הלימה בין המקצועיות שלי והרצון שלי לעזור – לבין כמות הפניות בפועל. המטרה שלי לא הייתה רק \'שיווק\', אלא פשוט להרגיש שאני מציגה את העשייה שלי באופן הולם ומונגש, שאהיה שלמה עם זה.\n\nאני מודה שהתלבטתי בגלל המחיר, אבל היום אני כל כך שמחה שנרשמתי. הקורס הזה תרם לי למשהו עמוק בהרבה מהנגשה חיצונית – הוא בנה לי את הזהות המקצועית.\n\nבשונה מקורס מוקלט, כאן קיבלתי הנחיה קשובה והתייחסות אישית ועמוקה לדוגמאות שהבאתי מהשטח. זה עשה את כל השינוי. היום המסר של \'מי אני\' הרבה יותר ברור, הביטחון המקצועי שלי עלה, וזה שווה כל שקל והרבה יותר ממה ששילמתי. התמורה שקיבלתי היא פשוט יקרת ערך. תודה על הכל!',
    author: 'רונית, מטפלת באומנות',
  },
  {
    type: 'text',
    highlight: true,
    text: 'נרשמתי ל"על שפת הקליניקה" בתקופה של קליניקה בתחילת דרכה, בתקופה בה היו מעט פניות. גם כשהיו, פעמים רבות השיחה הראשונית לא הובילה לתחילת הטיפול.\n\nבמהלך הקורס חידדתי את החשיבה על מי אני כפסיכולוגית, ומה אני מעוניינת לתת למטופלים שלי, ובתקופה קצרה יחסית העברתי זאת החוצה ללא התנצלות ועם הבנה של מה אני יכולה לתת בטיפול, ואיך להעביר זאת החוצה בבהירות.\n\nדי מהר הקליניקה החלה לפרוח. תודה.',
    author: 'ל.פ, פסיכולוגית קלינית',
  },
  {
    type: 'audio',
    highlight: true,
    audioSrc: '/audio/testimonial-marim.m4a',
    poster: marimPoster,
    author: 'מרים',
  },
  { type: 'image', imageSrc: testimonial1 },
  { type: 'image', imageSrc: testimonial4 },
  { type: 'image', imageSrc: testimonial2 },
  { type: 'image', imageSrc: testimonial3 },
];

function TestimonialSlide({ item }: { item: Testimonial }) {
  if (item.type === 'text') {
    return (
      <div className={`bg-card rounded-2xl border p-8 md:p-10 text-right mx-auto max-w-2xl ${item.highlight ? 'border-primary/30 shadow-elevated' : 'border-border/50'}`}>
        <Quote className="w-8 h-8 text-accent/40 mb-4" />
        <p className="text-muted-foreground leading-relaxed mb-6 whitespace-pre-line">
          {item.text}
        </p>
        <p className="font-bold text-foreground">— {item.author}</p>
      </div>
    );
  }

  if (item.type === 'audio') {
    return (
      <div className={`bg-card rounded-2xl border p-8 md:p-10 text-center mx-auto max-w-md ${item.highlight ? 'border-primary/30 shadow-elevated' : 'border-border/50'}`}>
        <div className="flex items-center justify-center gap-2 mb-4">
          <Volume2 className="w-5 h-5 text-teal" />
          <span className="font-bold text-foreground">המלצה קולית – {item.author}</span>
        </div>
        <img
          src={item.poster}
          alt={`המלצה מ${item.author}`}
          className="w-32 h-32 object-cover rounded-full mx-auto mb-4 border-2 border-border/30"
        />
        <audio
          controls
          preload="metadata"
          className="w-full max-w-sm mx-auto"
          controlsList="nodownload"
        >
          <source src={item.audioSrc} type="audio/mp4" />
        </audio>
      </div>
    );
  }

  // image type
  return (
    <div className="rounded-2xl overflow-hidden shadow-card border border-border/50 mx-auto max-w-lg">
      <img
        src={item.imageSrc}
        alt="המלצה"
        className="w-full h-auto"
        loading="lazy"
      />
    </div>
  );
}

export function TurningPointTestimonials() {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % testimonials.length);
  }, []);

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + testimonials.length) % testimonials.length);
  }, []);

  return (
    <section className="py-16 md:py-20 bg-secondary/20 overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.h2
          className="text-2xl md:text-3xl font-display text-foreground mb-10 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          מה אומרים על התוכניות שלנו?
        </motion.h2>

        {/* Carousel */}
        <div className="relative max-w-3xl mx-auto">
          {/* Navigation arrows */}
          <Button
            variant="outline"
            size="icon"
            className="absolute top-1/2 -translate-y-1/2 -right-4 md:-right-14 z-10 rounded-full bg-card shadow-card border-border/50 hover:bg-primary hover:text-primary-foreground"
            onClick={prev}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="absolute top-1/2 -translate-y-1/2 -left-4 md:-left-14 z-10 rounded-full bg-card shadow-card border-border/50 hover:bg-primary hover:text-primary-foreground"
            onClick={next}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          {/* Slide */}
          <div className="min-h-[300px] flex items-center justify-center px-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0, x: 60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -60 }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                <TestimonialSlide item={testimonials[current]} />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {testimonials.map((t, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === current
                    ? 'w-8 h-2.5 bg-primary'
                    : 'w-2.5 h-2.5 bg-border hover:bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
