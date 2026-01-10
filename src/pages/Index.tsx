import { useLanguage } from '@/contexts/LanguageContext';
import { Header } from '@/components/landing/Header';
import { Hero } from '@/components/landing/Hero';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { Benefits } from '@/components/landing/Benefits';
import { Testimonials } from '@/components/landing/Testimonials';
import { Features } from '@/components/landing/Features';
import { CTABanner } from '@/components/landing/CTABanner';
import { SignupForm } from '@/components/landing/SignupForm';
import { Footer } from '@/components/landing/Footer';

const Index = () => {
  const { isRTL } = useLanguage();

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <HowItWorks />
        <Benefits />
        <Testimonials />
        <Features />
        <CTABanner />
        <SignupForm />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
