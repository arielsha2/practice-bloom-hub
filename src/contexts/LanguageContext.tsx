import React, { createContext, useContext, useState, ReactNode } from "react";

type Language = "en" | "he";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Header
    "nav.home": "Home",
    "nav.about": "About",
    "nav.bots": "AI Assistants",
    "nav.contact": "Contact",

    // Hero
    "hero.title": "Market Your Practice with Authenticity",
    "hero.subtitle": "Build a thriving private practice without anxiety or compromising who you are",
    "hero.cta": "Get Free Resources",

    // Benefits
    "benefits.title": "Grow Your Practice, Stay True to Yourself",
    "benefits.subtitle":
      "Our approach helps psychotherapists attract ideal clients while honoring their therapeutic values",
    "benefits.item1.title": "Find Your Niche",
    "benefits.item1.desc":
      "Discover what makes your practice unique and attracts clients who truly resonate with your approach",
    "benefits.item2.title": "Authentic Marketing",
    "benefits.item2.desc": "Learn marketing strategies that feel natural and align with your professional ethics",
    "benefits.item3.title": "Sustainable Growth",
    "benefits.item3.desc": "Build a stable practice with consistent client flow without burnout or overwhelm",

    // Bots
    "bots.title": "AI Assistants for Therapists",
    "bots.subtitle": "Powerful tools designed specifically to help you grow your practice",
    "bots.niche.title": "Niche Finder Bot",
    "bots.niche.desc": "Discover your unique therapeutic niche and ideal client profile through guided exploration",
    "bots.strategy.title": "Strategy Planner Bot",
    "bots.strategy.desc": "Create a personalized marketing strategy that aligns with your values and schedule",
    "bots.content.title": "Content Creator Bot",
    "bots.content.desc": "Generate authentic content ideas that showcase your expertise and attract clients",
    "bots.cta": "Try Now",

    // Form
    "form.title": "Get Free Marketing Resources",
    "form.subtitle": "Join our community and receive practical tools to grow your practice authentically",
    "form.name": "Full Name",
    "form.email": "Email Address",
    "form.phone": "Mobile Number",
    "form.submit": "Get Free Materials",
    "form.privacy": "We respect your privacy. Unsubscribe anytime.",

    // Footer
    "footer.tagline": "Empowering therapists to grow with authenticity",
    "footer.rights": "All rights reserved",
  },
  he: {
    // Header
    "nav.home": "בית",
    "nav.about": "אודות",
    "nav.bots": "עוזרי AI",
    "nav.contact": "צור קשר",

    // Hero
    "hero.title": "הדרך שלך לקליניקה יציבה ומבוקשת",
    "hero.subtitle": " איך ליצור קליניקה שמתאימה לך",
    "hero.cta": "קבלו חומרים בחינם",

    // Benefits
    "benefits.title": "צמחו בפרקטיקה, הישארו נאמנים לעצמכם",
    "benefits.subtitle": "הגישה שלנו עוזרת לפסיכותרפיסטים למשוך לקוחות אידיאליים תוך כיבוד הערכים הטיפוליים שלהם",
    "benefits.item1.title": "מצאו את הנישה שלכם",
    "benefits.item1.desc": "גלו מה מייחד את הפרקטיקה שלכם ומושך לקוחות שמתחברים באמת לגישה שלכם",
    "benefits.item2.title": "שיווק אותנטי",
    "benefits.item2.desc": "למדו אסטרטגיות שיווק שמרגישות טבעיות ומתאימות לאתיקה המקצועית שלכם",
    "benefits.item3.title": "צמיחה בת-קיימא",
    "benefits.item3.desc": "בנו פרקטיקה יציבה עם זרימת לקוחות עקבית ללא שחיקה או עומס",

    // Bots
    "bots.title": "עוזרי AI למטפלים",
    "bots.subtitle": "כלים חכמים שתוכננו במיוחד לעזור לכם לצמוח בפרקטיקה",
    "bots.niche.title": "בוט מציאת נישה",
    "bots.niche.desc": "גלו את הנישה הטיפולית הייחודית שלכם ואת פרופיל הלקוח האידיאלי באמצעות חקירה מודרכת",
    "bots.strategy.title": "בוט תכנון אסטרטגיה",
    "bots.strategy.desc": "צרו אסטרטגיית שיווק מותאמת אישית שמתאימה לערכים ולזמן שלכם",
    "bots.content.title": "בוט יצירת תוכן",
    "bots.content.desc": "הפיקו רעיונות תוכן אותנטיים שמציגים את המומחיות שלכם ומושכים לקוחות",
    "bots.cta": "נסו עכשיו",

    // Form
    "form.title": "קבלו חומרי שיווק בחינם",
    "form.subtitle": "הצטרפו לקהילה שלנו וקבלו כלים מעשיים לצמיחה אותנטית בפרקטיקה",
    "form.name": "שם מלא",
    "form.email": "כתובת אימייל",
    "form.phone": "מספר נייד",
    "form.submit": "קבלו חומרים בחינם",
    "form.privacy": "אנחנו מכבדים את הפרטיות שלכם. ניתן לבטל בכל עת.",

    // Footer
    "footer.tagline": "מעצימים מטפלים לצמוח באותנטיות",
    "footer.rights": "כל הזכויות שמורות",
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  const isRTL = language === "he";

  return <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
