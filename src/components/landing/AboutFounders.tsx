import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import foundersImage from "@/assets/founders/founders.jpg";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
};

export function AboutFounders() {
  const { t, isRTL } = useLanguage();

  return (
    <section className="py-20 md:py-28 bg-background relative overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -left-20 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -right-20 w-[300px] h-[300px] bg-accent/5 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className={`grid lg:grid-cols-2 gap-12 lg:gap-16 items-center ${isRTL ? "" : ""}`}>
          {/* Image */}
          <motion.div
            className={`${isRTL ? "lg:order-2" : "lg:order-1"}`}
            {...fadeUp}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <div className="relative">
              <img
                src={foundersImage}
                alt={t("founders.imageAlt")}
                className="w-full h-auto rounded-2xl shadow-card object-cover"
              />
              {/* Decorative accent */}
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-accent/10 rounded-2xl -z-10" />
              <div className="absolute -top-4 -left-4 w-16 h-16 bg-primary/10 rounded-2xl -z-10" />
            </div>
          </motion.div>

          {/* Text Content */}
          <motion.div
            className={`${isRTL ? "lg:order-1 text-right" : "lg:order-2"}`}
            {...fadeUp}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
          >
            <h2 className="text-3xl md:text-4xl font-serif font-medium text-foreground mb-6">
              {t("founders.title")}
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {t("founders.text")}
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
