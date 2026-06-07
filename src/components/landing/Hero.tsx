import { useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ArrowRight, ArrowLeft, Mail, MessageCircle } from "lucide-react";
import heroFoundersImg from "@/assets/hero-founders.png";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
};

export function Hero() {
  const { t, isRTL } = useLanguage();
  const Arrow = isRTL ? ArrowLeft : ArrowRight;
  const [open, setOpen] = useState(false);

  return (
    <section
      id="home"
      className="band band-charcoal band-grain min-h-screen flex items-center justify-center relative overflow-hidden"
    >
      {/* Subtle warm glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full blur-[150px]"
          style={{ background: "hsl(var(--accent) / 0.18)" }}
        />
        <div
          className="absolute -bottom-40 -right-40 w-[400px] h-[400px] rounded-full blur-[150px]"
          style={{ background: "hsl(var(--primary) / 0.4)" }}
        />
      </div>


      <div className="container mx-auto px-4 py-20 md:py-28 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Text Content - Right side */}
          <div className={`flex flex-col ${isRTL ? "text-right lg:order-1" : "lg:order-2"}`}>
            <motion.h1
              className="text-5xl md:text-6xl lg:text-7xl font-display tracking-tight text-foreground mb-6 leading-[1.15]"
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
                onClick={() => setOpen(true)}
              >
                {t("hero.cta")}
                <Arrow
                  className={`w-5 h-5 transition-transform ${isRTL ? "group-hover:-translate-x-1" : "group-hover:translate-x-1"}`}
                />
              </Button>
            </motion.div>
          </div>

          {/* Image - Left side, frameless 3D float */}
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
                className="w-full h-auto rounded-tl-[80px] rounded-br-[80px] shadow-3d-float"
                width={1024}
                height={1024}
                loading="eager"
                fetchPriority="high"
                decoding="async"
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Gradient transition to next section */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[120px] pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent, hsl(var(--background)))' }}
      />

      {/* Join community dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md" dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className={`text-2xl font-display ${isRTL ? "text-right" : ""}`}>
              {isRTL ? 'הצטרפו לקהילת "על שפת הקליניקה"' : 'Join the "Al Sfat HaClinica" community'}
            </DialogTitle>
            <DialogDescription className={isRTL ? "text-right" : ""}>
              {isRTL
                ? "בחרו את הדרך המועדפת עליכם להישאר בקשר"
                : "Choose your preferred way to stay in touch"}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 pt-2">
            <Button
              variant="cta"
              size="lg"
              className="w-full"
              asChild
            >
              <a
                href="https://sfat.myflodesk.com/c6d2334e-ea5d-4f2a-bc16-0fb3fc548d93"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
              >
                <Mail className="w-5 h-5" />
                {isRTL ? "הצטרפות לרשימת התפוצה במייל" : "Join the email newsletter"}
              </a>
            </Button>

            <Button
              size="lg"
              className="w-full bg-[#25D366] text-white hover:bg-[#20BD5A]"
              asChild
            >
              <a
                href="https://chat.whatsapp.com/LIFDBs6thhtH3L7LqMTfdv"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
              >
                <MessageCircle className="w-5 h-5" />
                {isRTL ? "הצטרפות לקבוצת הוואטסאפ" : "Join the WhatsApp group"}
              </a>
            </Button>
          </div>

        </DialogContent>
      </Dialog>
    </section>
  );
}
