import { useLanguage } from '@/contexts/LanguageContext';
import { Header } from '@/components/landing/Header';
import { Hero } from '@/components/landing/Hero';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { AboutFounders } from '@/components/landing/AboutFounders';
import { Benefits } from '@/components/landing/Benefits';
import { Testimonials } from '@/components/landing/Testimonials';
import { CTABanner } from '@/components/landing/CTABanner';
import { Footer } from '@/components/landing/Footer';

const Index = () => {
  const { isRTL } = useLanguage();

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <HowItWorks />
        <Testimonials />
        <AboutFounders />
        <Benefits />
        <CTABanner />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
