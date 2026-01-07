import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft } from 'lucide-react';

export function Hero() {
  const { t, isRTL } = useLanguage();
  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  return (
    <section 
      id="home" 
      className="min-h-screen flex items-center justify-center pt-16 bg-secondary relative overflow-hidden"
    >
      {/* Animated floating decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Large blurred circles */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float-slower" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-primary/3 to-transparent rounded-full" />
        
        {/* Small floating dots */}
        <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-primary/20 rounded-full animate-float-dot" />
        <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-accent/30 rounded-full animate-float-dot-reverse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-1/3 left-1/3 w-4 h-4 bg-primary/15 rounded-full animate-float-dot" style={{ animationDelay: '2s' }} />
        <div className="absolute top-2/3 right-1/3 w-2 h-2 bg-accent/25 rounded-full animate-float-dot-reverse" style={{ animationDelay: '0.5s' }} />
        <div className="absolute bottom-1/4 right-1/5 w-3 h-3 bg-primary/20 rounded-full animate-float-dot" style={{ animationDelay: '1.5s' }} />
        
        {/* Subtle geometric shapes */}
        <div className="absolute top-[15%] right-[20%] w-16 h-16 border border-primary/10 rounded-lg rotate-12 animate-spin-very-slow" />
        <div className="absolute bottom-[20%] left-[15%] w-12 h-12 border border-accent/15 rounded-full animate-pulse-slow" />
        <div className="absolute top-[60%] right-[10%] w-8 h-8 border border-primary/10 rotate-45 animate-float-dot" style={{ animationDelay: '3s' }} />
      </div>
      
      <div className={`container mx-auto px-4 py-32 relative z-10 ${isRTL ? 'text-right' : 'text-left'}`}>
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div 
            className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-8 animate-fade-in"
            style={{ animationDelay: '0.1s' }}
          >
            <span className="text-primary text-sm font-medium">
              {isRTL ? 'לפסיכותרפיסטים בפרקטיקה פרטית' : 'For Private Practice Psychotherapists'}
            </span>
          </div>

          {/* Main heading */}
          <h1 
            className="text-4xl md:text-5xl lg:text-6xl font-serif font-medium text-foreground mb-6 leading-tight animate-fade-in tracking-wide"
            style={{ animationDelay: '0.2s' }}
          >
            {t('hero.title')}
          </h1>

          {/* Subheading */}
          <p 
            className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in"
            style={{ animationDelay: '0.3s' }}
          >
            {t('hero.subtitle')}
          </p>

          {/* CTA Button */}
          <div 
            className="animate-fade-in"
            style={{ animationDelay: '0.4s' }}
          >
            <Button 
              variant="cta" 
              size="xl" 
              className="group"
              onClick={() => document.getElementById('signup')?.scrollIntoView({ behavior: 'smooth' })}
            >
              {t('hero.cta')}
              <Arrow className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
