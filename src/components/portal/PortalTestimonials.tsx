import { motion } from "framer-motion";
import { Quote } from "lucide-react";

const selectedTestimonials = [
  {
    name: "מרים",
    role: 'עו"סית קלינית',
    quote:
      "הייתי במקום אחר לגמרי, מדשדשת במחשבות של איך ואיפה. היום אני עם הרבה פחות פחד, עם הרבה ידע איך לעשות את זה נכון.",
    initials: "מ",
  },
  {
    name: "ל.פ",
    role: "פסיכולוגית קלינית",
    quote:
      'במהלך הקורס חידדתי את החשיבה על מי אני כפסיכולוגית. די מהר הקליניקה החלה לפרוח.',
    initials: "ל.פ",
  },
  {
    name: "פרופ' יוני גז",
    role: "ראש המגמה לפסיכולוגיה קלינית",
    quote:
      'הקורס נותן מקום לשאלות שכל מטפל מכיר, ומצמיח את כולנו להיות אנשי מקצוע טובים יותר.',
    initials: "י.ג",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

export function PortalTestimonials() {
  return (
    <section className="py-16 bg-primary relative overflow-hidden" dir="rtl">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[300px] h-[300px] bg-accent/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-[250px] h-[250px] bg-primary-foreground/5 rounded-full blur-[80px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section header */}
        <motion.div
          className="text-center max-w-2xl mx-auto mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Quote className="w-10 h-10 text-accent mx-auto mb-4 opacity-60" />
          <h2 className="text-2xl md:text-3xl font-serif font-medium text-primary-foreground mb-3 tracking-wide">
            מה אומרים משתתפי התוכנית
          </h2>
          <p className="text-primary-foreground/70">
            מטפלים ומטפלות שעברו את נקודת המפנה משתפים
          </p>
        </motion.div>

        {/* Testimonials grid */}
        <motion.div
          className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {selectedTestimonials.map((testimonial) => (
            <motion.div
              key={testimonial.name}
              className="relative"
              variants={cardVariants}
            >
              <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-xl p-6 border border-primary-foreground/10 h-full flex flex-col">
                {/* Quote text */}
                <blockquote className="text-primary-foreground/90 leading-relaxed mb-5 flex-1 text-sm">
                  "{testimonial.quote}"
                </blockquote>

                {/* Author */}
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-primary font-medium text-sm shrink-0 bg-accent"
                  >
                    {testimonial.initials}
                  </div>
                  <div>
                    <p className="font-medium text-primary-foreground text-sm">
                      {testimonial.name}
                    </p>
                    <p className="text-xs text-primary-foreground/60">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
