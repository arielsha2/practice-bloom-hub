import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

export function Header() {
  const { language, setLanguage, t, isRTL } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="font-display text-2xl font-bold text-primary">
            TherapyGrowth
          </span>
        </div>

        {/* Desktop Navigation */}
        <div className={`hidden md:flex items-center gap-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <a href="#home" className="text-foreground/80 hover:text-primary transition-colors font-medium">
            {t('nav.home')}
          </a>
          <a href="#benefits" className="text-foreground/80 hover:text-primary transition-colors font-medium">
            {t('nav.about')}
          </a>
          <a href="#bots" className="text-foreground/80 hover:text-primary transition-colors font-medium">
            {t('nav.bots')}
          </a>
          <a href="#signup" className="text-foreground/80 hover:text-primary transition-colors font-medium">
            {t('nav.contact')}
          </a>
        </div>

        {/* Language Toggles */}
        <div className="flex items-center gap-2">
          <Button
            variant={language === 'he' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setLanguage('he')}
            className="font-medium"
          >
            עברית
          </Button>
          <Button
            variant={language === 'en' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setLanguage('en')}
            className="font-medium"
          >
            English
          </Button>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-background border-b border-border animate-fade-in">
          <div className={`container mx-auto px-4 py-4 flex flex-col gap-4 ${isRTL ? 'text-right' : 'text-left'}`}>
            <a 
              href="#home" 
              className="text-foreground/80 hover:text-primary transition-colors font-medium py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('nav.home')}
            </a>
            <a 
              href="#benefits" 
              className="text-foreground/80 hover:text-primary transition-colors font-medium py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('nav.about')}
            </a>
            <a 
              href="#bots" 
              className="text-foreground/80 hover:text-primary transition-colors font-medium py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('nav.bots')}
            </a>
            <a 
              href="#signup" 
              className="text-foreground/80 hover:text-primary transition-colors font-medium py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('nav.contact')}
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
