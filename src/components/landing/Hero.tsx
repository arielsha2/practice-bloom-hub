import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft } from "lucide-react";
import heroFoundersImg from "@/assets/hero-founders.png";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
};

export function Hero() {
  const { t, isRTL } = useLanguage();
  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  return (
    <section id="home" className="min-h-screen flex items-center justify-center bg-secondary relative overflow-hidden">
      {/* Background blur circles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-primary/15 rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[150px]" />
        <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 py-20 md:py-28 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Text Content - Right side */}
          <div className={`flex flex-col ${isRTL ? "text-right lg:order-1" : "lg:order-2"}`}>
            <motion.h1
              className="text-4xl md:text-5xl lg:text-6xl font-serif font-medium text-foreground mb-6 leading-tight tracking-wide"
              {...fadeUp}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
            >
              לבנות קליניקה בדרך שלכם – מתוך שליחות והצלחה עסקית
            </motion.h1>

            <motion.p
              className="text-lg md:text-xl text-muted-foreground mb-10 max-w-xl leading-relaxed"
              {...fadeUp}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
            >
              הצטרפו לקהילת המטפלים של "על שפת הקליניקה" וגלו איך לבנות עסק יציב בלי לוותר על הערכים והקול הייחודי שלכם.
            </motion.p>

            <motion.div
              {...fadeUp}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.3 }}
            >
              <Button
                variant="cta"
                size="xl"
                className="group"
                asChild
              >
                <a href="https://api.whatsapp.com/send?phone=972544928993" target="_blank" rel="noopener noreferrer">
                לשיחת ייעוץ ראשונית
                <Arrow
                  className={`w-5 h-5 transition-transform ${isRTL ? "group-hover:-translate-x-1" : "group-hover:translate-x-1"}`}
                />
              </Button>
            </motion.div>
          </div>

          {/* Image - Left side */}
          <motion.div
            className={`${isRTL ? "lg:order-2" : "lg:order-1"} flex items-center justify-center`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="relative w-full max-w-lg">
              <img
                src={heroFoundersImg}
                alt="אליאנה ואריאל – על שפת הקליניקה"
                className="w-full h-auto rounded-2xl shadow-elevated border border-border/50"
                loading="eager"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
