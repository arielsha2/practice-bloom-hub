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
    <section id="home" className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ backgroundColor: 'hsl(var(--hero-bg))' }}>
      {/* Subtle grain/noise texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.035] mix-blend-multiply"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '256px 256px',
        }}
      />

      {/* Subtle warm glow — very understated */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px]" />
        <div className="absolute -bottom-40 -right-40 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[150px]" />
      </div>

      <div className="container mx-auto px-4 py-20 md:py-28 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Text Content - Right side */}
          <div className={`flex flex-col ${isRTL ? "text-right lg:order-1" : "lg:order-2"}`}>
            <motion.h1
              className="text-5xl md:text-6xl lg:text-7xl font-display text-foreground mb-6 leading-[1.15] tracking-wide"
              {...fadeUp}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
            >
              {t("hero.title")}
            </motion.h1>

            <motion.p
              className="text-lg md:text-xl text-foreground/70 mb-10 max-w-xl leading-relaxed"
              {...fadeUp}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
            >
              {t("hero.subtitle")}
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
                {t("hero.cta")}
                <Arrow
                  className={`w-5 h-5 transition-transform ${isRTL ? "group-hover:-translate-x-1" : "group-hover:translate-x-1"}`}
                />
                </a>
              </Button>
            </motion.div>
          </div>

          {/* Image - Left side — minimal frame */}
          <motion.div
            className={`${isRTL ? "lg:order-2" : "lg:order-1"} flex items-center justify-center`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="relative w-full max-w-lg">
              <img
                src={heroFoundersImg}
                alt={isRTL ? "אליאנה ואריאל – על שפת הקליניקה" : "Eliana and Ariel – Al Sfat HaClinica"}
                className="w-full h-auto rounded-xl shadow-md"
                loading="eager"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
