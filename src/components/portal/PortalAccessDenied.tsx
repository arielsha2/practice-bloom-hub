import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';
import { TurningPointHero } from './landing/TurningPointHero';
import { TurningPointStory } from './landing/TurningPointStory';
import { TurningPointVideo } from './landing/TurningPointVideo';
import { TurningPointProgram } from './landing/TurningPointProgram';
import { TurningPointOutcomes } from './landing/TurningPointOutcomes';
import { TurningPointValueCalculator } from './landing/TurningPointValueCalculator';
import { TurningPointMeetings } from './landing/TurningPointMeetings';
import { TurningPointPricing } from './landing/TurningPointPricing';
import { TurningPointTestimonials } from './landing/TurningPointTestimonials';
import { TurningPointFounders } from './landing/TurningPointFounders';
import { TurningPointCTA } from './landing/TurningPointCTA';

export function PortalAccessDenied() {
  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      <Header />
      <TurningPointHero />
      <TurningPointStory />
      <TurningPointProgram />
      <TurningPointOutcomes />
      <TurningPointValueCalculator />
      <TurningPointMeetings />
      <TurningPointPricing />
      <TurningPointTestimonials />
      <TurningPointVideo />
      <TurningPointFounders />
      <TurningPointCTA />
      <Footer />
    </div>
  );
}
