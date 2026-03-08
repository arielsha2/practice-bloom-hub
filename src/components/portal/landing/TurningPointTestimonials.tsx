import { motion } from 'framer-motion';
import testimonial1 from '@/assets/turning-point/testimonial1.webp';
import testimonial2 from '@/assets/turning-point/testimonial2.webp';
import testimonial3 from '@/assets/turning-point/testimonial3.webp';
import testimonial4 from '@/assets/turning-point/testimonial4.jpg';

const testimonialImages = [testimonial1, testimonial4, testimonial2, testimonial3];

const textTestimonials = [
  {
    text: 'אני מטפלת מנוסה, ועדיין הרגשתי שחסר לי ביטחון מקצועי. הקורס הזה תרם לי למשהו עמוק בהרבה מהנגשה חיצונית – הוא בנה לי את הזהות המקצועית. היום המסר של "מי אני" הרבה יותר ברור, הביטחון המקצועי שלי עלה, וזה שווה כל שקל.',
    author: 'רונית, מטפלת באומנות',
  },
  {
    text: 'נרשמתי בתקופה של קליניקה בתחילת דרכה, בתקופה בה היו מעט פניות. במהלך הקורס חידדתי את החשיבה על מי אני כפסיכולוגית, ובתקופה קצרה יחסית העברתי זאת החוצה בבהירות. די מהר הקליניקה החלה לפרוח.',
    author: 'ל.פ, פסיכולוגית קלינית',
  },
];

export function TurningPointTestimonials() {
  return (
    <section className="py-16 md:py-20 bg-secondary/20">
      <div className="container mx-auto px-4">
        <motion.h2
          className="text-2xl md:text-3xl font-display text-foreground mb-10 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          מה אומרים על התוכניות שלנו?
        </motion.h2>

        {/* Text testimonials */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-10">
          {textTestimonials.map((t, i) => (
            <motion.div
              key={i}
              className="bg-card rounded-xl border border-border/50 p-6 text-right"
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <p className="text-sm text-muted-foreground leading-relaxed mb-4 italic">
                "{t.text}"
              </p>
              <p className="text-sm font-bold text-foreground">— {t.author}</p>
            </motion.div>
          ))}
        </div>

        {/* Screenshot testimonials */}
        <div className="grid sm:grid-cols-2 gap-4 max-w-4xl mx-auto">
          {testimonialImages.map((img, i) => (
            <motion.div
              key={i}
              className="rounded-xl overflow-hidden shadow-card border border-border/50"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <img
                src={img}
                alt={`המלצה ${i + 1}`}
                className="w-full h-auto"
                loading="lazy"
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
