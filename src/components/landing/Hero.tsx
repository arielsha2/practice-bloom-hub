import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, Sparkles, Target, Heart, Users, BookOpen, Award } from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
};

const floatAnimation = {
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

const floatAnimationDelayed = {
  animate: {
    y: [0, -8, 0],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut",
      delay: 1,
    },
  },
};

export function Hero() {
  const { t, isRTL } = useLanguage();
  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  return (
    <section id="home" className="min-h-screen flex items-center justify-center bg-secondary relative overflow-hidden">
      {/* Subtle background blur circles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-primary/15 rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[150px]" />
        <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className={`grid lg:grid-cols-2 gap-12 lg:gap-16 items-center ${isRTL ? "lg:flex-row-reverse" : ""}`}>
          {/* Text Content */}
          <div className={`flex flex-col ${isRTL ? "text-right lg:order-2" : "lg:order-1"}`}>
            {/* Social proof badge */}
            <motion.div
              {...fadeUp}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className={`flex items-center gap-3 mb-8 ${isRTL ? "flex-row-reverse" : ""}`}
            >
              <div className="flex -space-x-2">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-secondary"
                    style={{
                      background: `linear-gradient(135deg, hsl(${180 + i * 20}, 50%, ${55 + i * 5}%), hsl(${200 + i * 15}, 45%, ${45 + i * 8}%))`,
                    }}
                  />
                ))}
              </div>
              <span className="text-muted-foreground text-sm">
                {isRTL ? "הצטרפו ל-5000+ מטפלים" : "Join 5000+ therapists"}
              </span>
            </motion.div>

            {/* Main heading */}
            <motion.h1
              className="text-4xl md:text-5xl lg:text-6xl font-serif font-medium text-foreground mb-6 leading-tight tracking-wide"
              {...fadeUp}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
            >
              {t("hero.title")}
            </motion.h1>

            {/* Subheading */}
            <motion.p
              className="text-lg md:text-xl text-muted-foreground mb-10 max-w-xl leading-relaxed"
              {...fadeUp}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
            >
              {t("hero.subtitle")}
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              className={`flex flex-col sm:flex-row gap-4 ${isRTL ? "sm:flex-row-reverse" : ""}`}
              {...fadeUp}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.3 }}
            >
              <Button
                variant="cta"
                size="xl"
                className="group"
                onClick={() => document.getElementById("signup")?.scrollIntoView({ behavior: "smooth" })}
              >
                {t("hero.cta")}
                <Arrow
                  className={`w-5 h-5 transition-transform ${isRTL ? "group-hover:-translate-x-1" : "group-hover:translate-x-1"}`}
                />
              </Button>
              <Button
                variant="outline"
                size="xl"
                className="group border-2"
                onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
              >
                {t("hero.secondary_cta")}
              </Button>
            </motion.div>
          </div>

          {/* Visual Illustration */}
          <motion.div
            className={`relative ${isRTL ? "lg:order-1" : "lg:order-2"}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <div className="relative w-full aspect-square max-w-lg mx-auto">
              {/* Main decorative circles */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-72 h-72 md:w-80 md:h-80 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20" />
              </div>
              <div className="absolute inset-8 flex items-center justify-center">
                <div className="w-56 h-56 md:w-64 md:h-64 rounded-full bg-gradient-to-tr from-accent/15 to-accent/5 border border-accent/15" />
              </div>

              {/* Floating glassmorphism cards */}
              <motion.div
                className="absolute top-8 right-4 md:right-8 bg-background/80 backdrop-blur-md rounded-xl p-4 shadow-elevated border border-border/50"
                {...floatAnimation}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{isRTL ? "שיעורי וידאו" : "Video Lessons"}</p>
                    <p className="text-xs text-muted-foreground">{isRTL ? "20+ שעות תוכן" : "20+ hours of content"}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="absolute bottom-12 left-0 md:left-4 bg-background/80 backdrop-blur-md rounded-xl p-4 shadow-elevated border border-border/50"
                {...floatAnimationDelayed}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {isRTL ? "לטפל במטופלים, בשעות ומחיר שמתאים לך" : "Supportive Community"}
                    </p>
                    <p className="text-xs text-muted-foreground">{isRTL ? "מטפלים כמוך" : "Therapists like you"}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="absolute top-1/2 -translate-y-1/2 right-0 md:-right-4 bg-background/80 backdrop-blur-md rounded-xl p-4 shadow-elevated border border-border/50"
                animate={{
                  y: ["-50%", "calc(-50% - 12px)", "-50%"],
                  transition: {
                    duration: 3.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5,
                  },
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Award className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {isRTL ? "להרגיש נוח וראוי בכיסא המטפל" : "Certificate"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isRTL ? "הכרה מקצועית" : "Professional recognition"}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Floating icons */}
              <motion.div
                className="absolute top-1/4 left-1/4 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center"
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0],
                  transition: { duration: 4, repeat: Infinity },
                }}
              >
                <Sparkles className="w-6 h-6 text-primary" />
              </motion.div>

              <motion.div
                className="absolute bottom-1/3 right-1/4 w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center"
                animate={{
                  scale: [1, 1.15, 1],
                  transition: { duration: 3, repeat: Infinity, delay: 0.5 },
                }}
              >
                <Target className="w-5 h-5 text-accent" />
              </motion.div>

              <motion.div
                className="absolute top-1/3 right-1/3 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"
                animate={{
                  scale: [1, 1.2, 1],
                  transition: { duration: 2.5, repeat: Infinity, delay: 1 },
                }}
              >
                <Heart className="w-4 h-4 text-primary" />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
