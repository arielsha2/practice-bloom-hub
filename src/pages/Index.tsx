import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext';
import { Header } from '@/components/landing/Header';
import { Hero } from '@/components/landing/Hero';
import { Benefits } from '@/components/landing/Benefits';
import { BotsTeaser } from '@/components/landing/BotsTeaser';
import { CTABanner } from '@/components/landing/CTABanner';
import { Footer } from '@/components/landing/Footer';

function LandingContent() {
  const { isRTL } = useLanguage();

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <Benefits />
        <BotsTeaser />
        <CTABanner />
      </main>
      <Footer />
    </div>
  );
}

const Index = () => {
  return (
    <LanguageProvider>
      <LandingContent />
    </LanguageProvider>
  );
};

export default Index;
