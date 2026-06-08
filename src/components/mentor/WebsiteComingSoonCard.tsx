import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface WebsiteComingSoonCardProps {
  variant?: "default" | "paywall";
  className?: string;
}

export function WebsiteComingSoonCard({ variant = "default", className }: WebsiteComingSoonCardProps) {
  const { isRTL, language } = useLanguage();
  const isEn = variant === "paywall" && language === "en";

  const badgeText = isEn ? "Coming soon — a new feature is on its way" : "בקרוב, פיצ׳ר חדש";

  const bodyText = isEn
    ? "Soon we'll launch a new tool that takes everything you built with the Mentor — your niche, your personal story, your pricing and your voice — and creates a personalized website that speaks directly to the right clients and invites them to reach out to you."
    : "בקרוב נשיק כלי חדש שייקח את כל מה שבנית במסע עם המנטור, הנישה שלך, הסיפור האישי, התמחור ושפת הפנייה, וייצור עבורך אתר מותאם אישית שמדבר בדיוק אל המטופלים הנכונים ומזמין אותם לפנות אליך.";

  const footerText =
    variant === "paywall"
      ? isEn
        ? "Available to Mentor members later in the journey, as part of the growing value of the program."
        : "יוצע לרוכשי המנטור בהמשך המסע, חלק מהערך הגדל של הליווי."
      : "שמור את הסיכומים שעלו במסע, הם יהפכו לבסיס לאתר שלך.";

  return (
    <motion.div
      dir={isRTL ? "rtl" : "ltr"}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`relative rounded-tr-2xl border border-border/60 bg-card max-w-4xl mx-auto ${className ?? ""}`}
    >
      <div className="rounded-tr-2xl p-6 md:p-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-mentor-accent/15 text-mentor-accent text-xs font-semibold mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          {badgeText}
        </div>
        <p className="text-base md:text-lg text-foreground max-w-2xl mx-auto leading-relaxed">
          {bodyText}
        </p>
        <p className="text-xs md:text-sm text-mentor-accent font-medium mt-4">
          {footerText}
        </p>
      </div>
    </motion.div>
  );
}
