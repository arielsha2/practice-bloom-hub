import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface WebsiteComingSoonCardProps {
  variant?: "default" | "paywall";
  className?: string;
}

export function WebsiteComingSoonCard({ variant = "default", className }: WebsiteComingSoonCardProps) {
  const { isRTL } = useLanguage();

  const footerText =
    variant === "paywall"
      ? "יוצע לרוכשי המנטור בהמשך המסע, חלק מהערך הגדל של הליווי."
      : "שמור את הסיכומים שעלו במסע, הם יהפכו לבסיס לאתר שלך.";

  return (
    <motion.div
      dir={isRTL ? "rtl" : "ltr"}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`relative rounded-2xl p-[2px] bg-gradient-to-br from-mentor-accent via-primary to-mentor-accent shadow-xl max-w-4xl mx-auto ${className ?? ""}`}
    >
      <div className="rounded-2xl bg-gradient-to-br from-mentor-accent/10 via-card to-primary/10 p-6 md:p-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-mentor-accent/15 text-mentor-accent text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          בקרוב, פיצ׳ר חדש
        </div>
        <h3 className="text-xl md:text-2xl font-serif font-semibold text-foreground mb-3">
          האתר האישי שלך, נבנה עבורך אוטומטית ✨
        </h3>
        <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
          בקרוב נשיק כלי חדש שייקח את כל מה שבנית במסע עם המנטור, הנישה שלך,
          הסיפור האישי, התמחור ושפת הפנייה, וייצור עבורך דף נחיתה מותאם אישית
          שמדבר בדיוק אל המטופלים הנכונים ומזמין אותם לפנות אליך.
        </p>
        <p className="text-xs md:text-sm text-mentor-accent font-medium mt-4">
          {footerText}
        </p>
      </div>
    </motion.div>
  );
}
