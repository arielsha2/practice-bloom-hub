import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import arielImg from "@/assets/founders/ariel-clinic.png";
import elianaImg from "@/assets/founders/eliana-clinic.png";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
};

export function AboutFounders() {
  const { t, isRTL } = useLanguage();

  return (
    <section className="py-20 md:py-28 bg-[#FDFBF7] relative overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -left-20 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -right-20 w-[300px] h-[300px] bg-accent/5 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Title */}
        <motion.div
          className="text-center mb-12"
          {...fadeUp}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <h2 className="text-3xl md:text-4xl font-display text-foreground mb-6">
            {t("founders.title")}
          </h2>
          <div className="max-w-3xl mx-auto space-y-4 text-lg text-muted-foreground leading-relaxed">
            <p>{t("founders.textPart1")}</p>
            <p>
              {t("founders.textPart2Prefix")}
              <span className="font-bold text-foreground">{t("founders.textPart2Bold")}</span>
              {t("founders.textPart2Suffix")}
            </p>
          </div>
        </motion.div>

        {/* Individual Bios with Images */}
        <div className="grid md:grid-cols-2 gap-8 mt-16">
          {/* Ariel Bio */}
          <motion.div
            className={`bg-white/60 rounded-2xl p-6 md:p-8 shadow-sm ${isRTL ? "text-right" : ""}`}
            {...fadeUp}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
          >
            <h3 className="text-xl font-display text-foreground mb-3">

              {t("founders.ariel.name")}
            </h3>
            <p className="text-muted-foreground leading-relaxed mb-6">
              {t("founders.ariel.bio")}
            </p>
            <div className="flex flex-col items-center">
              <img
                src={arielImg}
                alt="ד״ר אריאל שפירא בקליניקה"
                className="w-full max-w-xs h-72 object-cover object-top rounded-xl shadow-card border border-border/30"
                loading="lazy"
              />
              <span className="text-sm text-muted-foreground mt-3">
                ד״ר אריאל שפירא בקליניקה
              </span>
            </div>
          </motion.div>

          {/* Eliana Bio */}
          <motion.div
            className={`bg-white/60 rounded-2xl p-6 md:p-8 shadow-sm ${isRTL ? "text-right" : ""}`}
            {...fadeUp}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.3 }}
          >
            <h3 className="text-xl font-display text-foreground mb-3">
              {t("founders.eliana.name")}
            </h3>
            <p className="text-muted-foreground leading-relaxed mb-6">
              {t("founders.eliana.bio")}
            </p>
            <div className="flex flex-col items-center">
              <img
                src={elianaImg}
                alt="אליענה שפירא בקליניקה"
                className="w-full max-w-xs h-72 object-cover object-top rounded-xl shadow-card border border-border/30"
                loading="lazy"
              />
              <span className="text-sm text-muted-foreground mt-3">
                אליענה שפירא בקליניקה
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
