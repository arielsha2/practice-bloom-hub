import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext';
import { Header } from '@/components/landing/Header';
import { Hero } from '@/components/landing/Hero';
import { Benefits } from '@/components/landing/Benefits';
import { Bots } from '@/components/landing/Bots';
import { SignupForm } from '@/components/landing/SignupForm';
import { Footer } from '@/components/landing/Footer';

function LandingContent() {
  const { isRTL } = useLanguage();

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <Benefits />
        <Bots />
        <SignupForm />
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
