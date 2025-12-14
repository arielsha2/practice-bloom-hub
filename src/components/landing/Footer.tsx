import { useLanguage } from '@/contexts/LanguageContext';
import { Heart } from 'lucide-react';

export function Footer() {
  const { t, isRTL } = useLanguage();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-12 bg-charcoal text-primary-foreground">
      <div className="container mx-auto px-4">
        <div className={`flex flex-col md:flex-row items-center justify-between gap-6 ${isRTL ? 'md:flex-row-reverse' : ''}`}>
          {/* Logo & tagline */}
          <div className={`text-center ${isRTL ? 'md:text-right' : 'md:text-left'}`}>
            <span className="font-display text-2xl font-bold">TherapyGrowth</span>
            <p className="text-primary-foreground/70 mt-1 text-sm">
              {t('footer.tagline')}
            </p>
          </div>

          {/* Made with love */}
          <div className="flex items-center gap-2 text-primary-foreground/70 text-sm">
            <span>{isRTL ? 'נבנה עם' : 'Made with'}</span>
            <Heart className="w-4 h-4 text-primary fill-primary" />
            <span>{isRTL ? 'למטפלים' : 'for therapists'}</span>
          </div>

          {/* Copyright */}
          <p className="text-primary-foreground/60 text-sm">
            © {currentYear} TherapyGrowth. {t('footer.rights')}.
          </p>
        </div>
      </div>
    </footer>
  );
}
