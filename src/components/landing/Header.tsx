import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

export function Header() {
  const { language, setLanguage, t, isRTL } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-primary shadow-card">
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-primary-foreground tracking-tight">
            TherapyGrowth
          </span>
        </div>

        {/* Desktop Navigation */}
        <div className={`hidden md:flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <a href="#home" className="px-4 py-2 text-primary-foreground/80 hover:text-primary-foreground transition-colors font-medium rounded-lg hover:bg-primary-foreground/10">
            {t('nav.home')}
          </a>
          <a href="#benefits" className="px-4 py-2 text-primary-foreground/80 hover:text-primary-foreground transition-colors font-medium rounded-lg hover:bg-primary-foreground/10">
            {t('nav.about')}
          </a>
          <a href="#bots" className="px-4 py-2 text-primary-foreground/80 hover:text-primary-foreground transition-colors font-medium rounded-lg hover:bg-primary-foreground/10">
            {t('nav.bots')}
          </a>
          <a href="#signup" className="px-4 py-2 text-primary-foreground/80 hover:text-primary-foreground transition-colors font-medium rounded-lg hover:bg-primary-foreground/10">
            {t('nav.contact')}
          </a>
        </div>

        {/* Language Toggles */}
        <div className="flex items-center gap-2">
          <Button
            variant={language === 'he' ? 'header-active' : 'header-ghost'}
            size="sm"
            onClick={() => setLanguage('he')}
            className="font-medium"
          >
            עברית
          </Button>
          <Button
            variant={language === 'en' ? 'header-active' : 'header-ghost'}
            size="sm"
            onClick={() => setLanguage('en')}
            className="font-medium"
          >
            English
          </Button>

          {/* Mobile Menu Button */}
          <Button
            variant="header-ghost"
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
        <div className="md:hidden bg-primary border-t border-primary-foreground/10 animate-fade-in">
          <div className={`container mx-auto px-4 py-4 flex flex-col gap-2 ${isRTL ? 'text-right' : 'text-left'}`}>
            <a 
              href="#home" 
              className="text-primary-foreground/80 hover:text-primary-foreground transition-colors font-medium py-3 px-4 rounded-lg hover:bg-primary-foreground/10"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('nav.home')}
            </a>
            <a 
              href="#benefits" 
              className="text-primary-foreground/80 hover:text-primary-foreground transition-colors font-medium py-3 px-4 rounded-lg hover:bg-primary-foreground/10"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('nav.about')}
            </a>
            <a 
              href="#bots" 
              className="text-primary-foreground/80 hover:text-primary-foreground transition-colors font-medium py-3 px-4 rounded-lg hover:bg-primary-foreground/10"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('nav.bots')}
            </a>
            <a 
              href="#signup" 
              className="text-primary-foreground/80 hover:text-primary-foreground transition-colors font-medium py-3 px-4 rounded-lg hover:bg-primary-foreground/10"
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
